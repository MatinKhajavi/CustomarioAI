"""
FastAPI backend for CustomarioAI - Multi-agent feedback survey system
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from app.models import (
    Survey, 
    SurveyCreate, 
    Session, 
    SessionCreate, 
    InsightsResponse,
    SessionStatus
)
from app.storage import storage
from app.agents.insights_agent import generate_insights

# Initialize FastAPI
app = FastAPI(
    title="CustomarioAI API",
    description="Multi-agent feedback survey system with voice AI",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/")
async def root():
    return {
        "message": "CustomarioAI API",
        "status": "healthy",
        "version": "1.0.0"
    }


# ============================================================================
# SURVEY ENDPOINTS (Company/Admin)
# ============================================================================

@app.post("/survey/create", response_model=Survey)
async def create_survey(survey_data: SurveyCreate):
    """
    Create a new survey with questions, criteria, and price range
    """
    survey = Survey(
        survey_id=f"survey_{uuid.uuid4().hex[:8]}",
        title=survey_data.title,
        questions=survey_data.questions,
        criteria=survey_data.criteria,
        price_range=survey_data.price_range,
        created_at=datetime.now()
    )
    
    return storage.create_survey(survey)


@app.get("/survey/{survey_id}", response_model=Survey)
async def get_survey(survey_id: str):
    """
    Get survey configuration by ID
    """
    survey = storage.get_survey(survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    return survey


@app.get("/surveys", response_model=List[Survey])
async def list_surveys():
    """
    List all surveys
    """
    return storage.list_surveys()


@app.get("/survey/{survey_id}/insights", response_model=InsightsResponse)
async def get_survey_insights(survey_id: str):
    """
    Get aggregated insights for a survey
    """
    survey = storage.get_survey(survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    sessions = storage.get_sessions_by_survey(survey_id)
    completed_sessions = [
        s for s in sessions 
        if s.status == SessionStatus.COMPLETED and s.evaluation_score is not None
    ]
    
    if not completed_sessions:
        return InsightsResponse(
            survey_id=survey_id,
            total_sessions=0,
            average_score=0.0,
            average_payment=0.0,
            key_insights="No completed sessions yet.",
            sessions=[]
        )
    
    avg_score = sum(s.evaluation_score for s in completed_sessions) / len(completed_sessions)
    avg_payment = sum(s.payment_amount for s in completed_sessions if s.payment_amount) / len(completed_sessions)
    
    # Generate fresh insights
    insights_text = await generate_insights(survey, completed_sessions)
    
    return InsightsResponse(
        survey_id=survey_id,
        total_sessions=len(completed_sessions),
        average_score=avg_score,
        average_payment=avg_payment,
        key_insights=insights_text,
        sessions=completed_sessions
    )


# ============================================================================
# SESSION ENDPOINTS (User/Feedback)
# ============================================================================

@app.post("/survey/{survey_id}/session/start")
async def start_session(survey_id: str):
    """
    Start a new feedback session for a survey
    
    Phase 1: Prepares context and returns LiveKit connection details
    The frontend widget will use this to connect to the voice agent
    """
    # Verify survey exists
    survey = storage.get_survey(survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    # Create session
    session = Session(
        session_id=f"session_{uuid.uuid4().hex[:8]}",
        survey_id=survey_id,
        status=SessionStatus.PENDING,
        created_at=datetime.now()
    )
    
    storage.create_session(session)
    
    # Run start phase (targeting agent + setup)
    from app.orchestrator import start_session_phase
    result = await start_session_phase(session.session_id)
    
    # Add LiveKit token for frontend
    result["livekit_token"] = f"mock_token_{session.session_id}"
    result["livekit_url"] = "wss://your-livekit-url.livekit.cloud"
    
    return result


@app.post("/session/{session_id}/complete")
async def complete_session(session_id: str, transcript: str, background_tasks: BackgroundTasks):
    """
    Complete a feedback session
    
    Phase 2: Called when user clicks "Done" or agent ends conversation
    - Evaluates transcript
    - Processes payment
    - Returns results immediately to show user
    - Generates insights in background for company
    """
    session = storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status != SessionStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=400, 
            detail=f"Session must be in progress. Current status: {session.status}"
        )
    
    # Run completion phase
    from app.orchestrator import complete_session_phase, generate_insights_background
    result = await complete_session_phase(session_id, transcript)
    
    # Generate insights in background (for company)
    background_tasks.add_task(generate_insights_background, session.survey_id)
    
    return result


@app.get("/session/{session_id}", response_model=Session)
async def get_session(session_id: str):
    """
    Get session details including transcript, score, and payment
    """
    session = storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.get("/survey/{survey_id}/sessions", response_model=List[Session])
async def get_survey_sessions(survey_id: str):
    """
    Get all sessions for a survey
    """
    survey = storage.get_survey(survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    return storage.get_sessions_by_survey(survey_id)


# ============================================================================
# LIVEKIT INTEGRATION (for voice agent connections)
# ============================================================================

@app.post("/session/{session_id}/token")
async def get_livekit_token(session_id: str):
    """
    Generate LiveKit access token for a session
    
    This would be called by the frontend to connect to the voice agent
    """
    session = storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # In production, generate actual LiveKit token
    # For now, return mock token
    return {
        "token": f"mock_token_{session_id}",
        "room_name": f"survey-{session_id}",
        "session_id": session_id
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

