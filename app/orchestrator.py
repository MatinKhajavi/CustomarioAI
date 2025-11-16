"""
Orchestrator Agent
Job: Coordinate the flow between all agents in two phases:
  Phase 1 (Start): Targeting agent + LiveKit room setup
  Phase 2 (Complete): Evaluation + Payment + Insights
"""
import asyncio
from datetime import datetime
from app.models import Session, SessionStatus
from app.storage import storage
from app.agents.targeting_agent import generate_context
from app.agents.evaluation_agent import evaluate_transcript
from app.agents.insights_agent import generate_insights
from app.payment import process_payment


async def start_session_phase(session_id: str) -> dict:
    """
    Phase 1: Start session
    - Use existing survey questions (context already generated)
    - Mark session as ready for voice interaction
    
    Args:
        session_id: The session to start
    
    Returns:
        dict: Session details with questions ready for voice agent
    """
    # Get session and survey
    session = storage.get_session(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")
    
    survey = storage.get_survey(session.survey_id)
    if not survey:
        raise ValueError(f"Survey {session.survey_id} not found")
    
    try:
        print(f"[Orchestrator] Starting session {session_id}")
        
        # Generate briefing context for voice agent
        print(f"[Orchestrator] Generating voice agent briefing...")
        context = await generate_context(survey)
        
        # Update session
        storage.update_session(session_id, {
            "context": context,
            "status": SessionStatus.IN_PROGRESS.value
        })
        
        print(f"[Orchestrator] Session {session_id} ready for voice interaction")
        
        return {
            "session_id": session_id,
            "room_name": f"survey-{session_id}",
            "context": context,
            "questions": survey.questions,
            "status": "ready"
        }
        
    except Exception as e:
        storage.update_session(session_id, {
            "status": SessionStatus.FAILED.value,
            "evaluation_notes": f"Error starting session: {str(e)}"
        })
        raise


async def complete_session_phase(session_id: str, transcript: str) -> dict:
    """
    Phase 2: Complete session
    - Evaluate transcript
    - Calculate and process payment
    - Return results to show user
    - Generate insights in background for company
    
    Args:
        session_id: The session to complete
        transcript: The voice conversation transcript
    
    Returns:
        dict: Evaluation results and payment info to show user
    """
    # Get session and survey
    session = storage.get_session(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")
    
    survey = storage.get_survey(session.survey_id)
    if not survey:
        raise ValueError(f"Survey {session.survey_id} not found")
    
    try:
        print(f"[Orchestrator] Completing session {session_id}")
        
        # Save transcript
        storage.update_session(session_id, {"transcript": transcript})
        
        # Step 1: Evaluation Agent - Score and determine payment
        print(f"[Orchestrator] Evaluating transcript...")
        score, notes, payment_amount = await evaluate_transcript(survey, transcript)
        
        # Define amount_tobepaid from evaluation
        amount_tobepaid = payment_amount
        
        # Step 2: Payment - Process payment with evaluated amount
        print(f"[Orchestrator] Processing payment of ${amount_tobepaid:.2f}...")
        payment_result = await process_payment(session_id, amount_tobepaid)
        
        # Update session with evaluation and payment
        storage.update_session(session_id, {
            "evaluation_score": score,
            "evaluation_notes": notes,
            "payment_amount": amount_tobepaid,
            "payment_status": payment_result["status"],
            "status": SessionStatus.COMPLETED.value,
            "completed_at": datetime.now().isoformat()
        })
        
        print(f"[Orchestrator] Session {session_id} completed!")
        
        # Prepare results to return to user immediately
        if payment_result["status"] == "success":
            message = f"Thank you! You've earned ${amount_tobepaid:.2f}"
        else:
            message = f"Thank you! Payment of ${amount_tobepaid:.2f} is being processed."
        
        user_result = {
            "session_id": session_id,
            "score": score,
            "payment_amount": amount_tobepaid,
            "payment_status": payment_result["status"],
            "transaction_id": payment_result.get("transaction_id"),
            "evaluation_notes": notes,
            "message": message,
            "payment_details": payment_result
        }
        
        return user_result
        
    except Exception as e:
        storage.update_session(session_id, {
            "status": SessionStatus.FAILED.value,
            "evaluation_notes": f"Error completing session: {str(e)}"
        })
        raise


async def generate_insights_background(survey_id: str):
    """
    Background task: Generate insights for company
    Runs after session completion without blocking user response
    
    Args:
        survey_id: The survey to generate insights for
    """
    try:
        print(f"[Orchestrator] Generating insights for survey {survey_id}")
        
        survey = storage.get_survey(survey_id)
        if not survey:
            print(f"[Orchestrator] Survey {survey_id} not found")
            return
        
        all_sessions = storage.get_sessions_by_survey(survey_id)
        insights = await generate_insights(survey, all_sessions)
        
        # Store insights (could be in a separate insights table/file)
        # For now, we'll update the most recent session
        completed_sessions = [s for s in all_sessions if s.status == SessionStatus.COMPLETED]
        if completed_sessions:
            latest = max(completed_sessions, key=lambda s: s.created_at)
            storage.update_session(latest.session_id, {"insights": insights})
        
        print(f"[Orchestrator] Insights generated for survey {survey_id}")
        
    except Exception as e:
        print(f"[Orchestrator] Error generating insights: {str(e)}")

