# CustomarioAI

Multi-agent customer feedback/survey system with voice AI, powered by LiveKit and Anthropic.

## Overview

CustomarioAI is a FastAPI-based backend system that orchestrates multiple AI agents to conduct voice surveys, evaluate responses, determine payments, and generate insights.

### Architecture

### Interactive Widget Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User clicks widget button → Panel opens                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────┐
        │  PHASE 1: START SESSION             │
        │  ┌──────────────────┐               │
        │  │ TARGETING AGENT  │ (2-3 sec)     │
        │  │ Prepares context │               │
        │  └──────────────────┘               │
        │         ↓                            │
        │  LiveKit room ready                  │
        └─────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────┐
        │  VOICE CONVERSATION                  │
        │  ┌──────────────────┐               │
        │  │  VOICE AGENT     │               │
        │  │  (LiveKit)       │               │
        │  │                  │               │
        │  │ • Real-time audio               │
        │  │ • Transcript shown in panel     │
        │  │ • Natural Q&A                   │
        │  └──────────────────┘               │
        └─────────────────────────────────────┘
                              ↓
        User clicks "Done" or agent ends call
                              ↓
        ┌─────────────────────────────────────┐
        │  PHASE 2: COMPLETE SESSION          │
        │  ┌──────────────────┐               │
        │  │ EVALUATION AGENT │ (3-5 sec)     │
        │  │ • Scores quality │               │
        │  │ • Calculates $   │               │
        │  └──────────────────┘               │
        │         ↓                            │
        │  ┌──────────────────┐               │
        │  │ PAYMENT FUNCTION │               │
        │  │ • Processes $    │               │
        │  └──────────────────┘               │
        │         ↓                            │
        │  Results shown to user immediately   │
        └─────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────┐
        │  BACKGROUND: INSIGHTS FOR COMPANY    │
        │  ┌──────────────────┐               │
        │  │ INSIGHTS AGENT   │               │
        │  │ Analyzes patterns│               │
        │  └──────────────────┘               │
        └─────────────────────────────────────┘
```

### AI Agents (Anthropic SDK)

1. **Targeting Agent** 
   - **Type:** Reasoning agent (no tools)
   - **Job:** Prepares context briefing for voice agent
   - **Input:** Survey config (questions, criteria, payment range)
   - **Output:** Conversational briefing for voice agent

2. **Voice Agent** (LiveKit)
   - **Type:** Real-time voice interaction
   - **Job:** Conducts natural voice conversation with users
   - **Input:** Briefing from Targeting Agent
   - **Output:** Conversation transcript

3. **Evaluation Agent**
   - **Type:** Agent with tool calling
   - **Tool:** `submit_evaluation` - Structured evaluation submission
   - **Job:** Scores transcript based on criteria, calculates payment
   - **Input:** Transcript + evaluation criteria
   - **Output:** Score (0-100), notes, payment amount

4. **Insights Agent**
   - **Type:** Reasoning agent (extensible with tools)
   - **Job:** Analyzes all transcripts for patterns and trends
   - **Input:** All session data + scores
   - **Output:** Strategic insights and recommendations

5. **Orchestrator**
   - **Type:** Python coordinator (not LLM)
   - **Job:** Manages flow between agents and phases
   - **Handles:** State transitions, error recovery, data passing

## Setup

### Prerequisites

- Python 3.9+
- LiveKit Cloud account (or self-hosted LiveKit server)
- Anthropic API key

### Installation

**Option 1: Using Poetry (Recommended)**

```bash
# Configure Poetry for local .venv
poetry config virtualenvs.in-project true

# Initialize and add dependencies
poetry init --no-interaction --name customario-ai --python "^3.9"

# Add all dependencies (bulk)
poetry add \
  fastapi==0.115.0 uvicorn==0.30.0 pydantic==2.9.0 \
  python-dotenv==1.0.1 anthropic==0.39.0 livekit==0.17.0 \
  httpx==0.27.0 "livekit-agents[silero,turn-detector]==1.2.0" \
  livekit-plugins-noise-cancellation==0.2.0

# Install and activate
poetry install
poetry shell
```

**Option 2: Using pip**

```bash
pip install -r requirements.txt
```

See `POETRY_SETUP.md` for detailed Poetry setup guide.

1. Create `.env` file with your credentials:
```bash
# LiveKit Configuration
LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# Anthropic Configuration
ANTHROPIC_API_KEY=your-anthropic-api-key
```

2. Run the server:
```bash
# With Poetry
poetry run python run.py
# Or after poetry shell:
python run.py

# With pip
python run.py
```

The API will be available at `http://localhost:8000`

### API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Company/Admin Endpoints

- `POST /survey/create` - Create a new survey with questions, criteria, and price range
- `GET /survey/{survey_id}` - Get survey configuration
- `GET /surveys` - List all surveys
- `GET /survey/{survey_id}/insights` - Get aggregated insights for a survey

### User/Session Endpoints

- `POST /survey/{survey_id}/session/start` - Start a new feedback session
- `GET /session/{session_id}` - Get session details (transcript, score, payment)
- `GET /survey/{survey_id}/sessions` - Get all sessions for a survey

### LiveKit Integration

- `POST /session/{session_id}/token` - Get LiveKit access token for voice connection

## Usage Example

### Interactive Widget Flow (Matches Frontend Behavior)

```python
# PHASE 1: User clicks widget button
POST /survey/{survey_id}/session/start

Response:
{
  "session_id": "session_xyz",
  "room_name": "survey-session_xyz",
  "livekit_token": "eyJ...",
  "livekit_url": "wss://...",
  "context": "Agent briefing...",
  "status": "ready"
}

# PHASE 2: Voice conversation happens via LiveKit
# (Frontend shows real-time transcript)

# PHASE 3: User clicks "Done" button
POST /session/{session_id}/complete?transcript={transcript}

Response:
{
  "session_id": "session_xyz",
  "score": 85,
  "payment_amount": 15.50,
  "payment_status": "success",
  "message": "Thank you! You've earned $15.50"
}

# BACKGROUND: Insights generated for company
GET /survey/{survey_id}/insights
```

### Testing Without Frontend

```bash
# Terminal 1: Start server
python run.py

# Terminal 2: Simulate widget interaction
python test_widget_flow.py
```

See `WIDGET_INTEGRATION.md` for complete frontend integration guide.

## Data Storage

Currently uses local JSON file storage:
- `data/surveys.json` - Survey configurations
- `data/sessions.json` - Session data, transcripts, scores, payments

## Tech Stack

- **FastAPI** - Web framework
- **LiveKit** - Real-time voice infrastructure  
- **Anthropic SDK** - Actual AI agents with tool calling and state management
- **Pydantic** - Data validation
- **asyncio** - Asynchronous processing

### Agent Architecture

The system uses **real agents** from the Anthropic SDK with:
- ✅ **Tool calling** - Agents can use tools to take actions
- ✅ **Conversation state** - Multi-turn reasoning with history
- ✅ **Structured outputs** - Tools enforce formats (e.g., evaluation scores)
- ✅ **Multi-turn loops** - Agents can break down complex tasks

See `AGENT_ARCHITECTURE.md` for detailed explanation.

## Development

The code is intentionally kept simple and modular:
- Each agent is in its own file under `app/agents/`
- Models are defined in `app/models.py`
- Storage is abstracted in `app/storage.py`
- Orchestration logic is in `app/orchestrator.py`
- FastAPI routes are in `app/main.py`

## Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- Real payment provider integration
- User authentication and authorization
- Advanced analytics dashboard
- Multiple survey types and templates
- A/B testing capabilities
- Real-time WebSocket updates for session status