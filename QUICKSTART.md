# CustomarioAI - Quick Start Guide

## Step-by-Step Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
# LiveKit Configuration (get from https://cloud.livekit.io)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxx

# Anthropic Configuration (get from https://console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
```

### 3. Start the Server

```bash
python run.py
```

The API will start at `http://localhost:8000`

### 4. Test the System

Open a new terminal and run:

```bash
# Test individual agents
python test_agents.py

# Test full system flow
python example_usage.py
```

### 5. Explore the API

Visit these URLs in your browser:
- Interactive docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## Manual Testing with cURL

### Create a Survey

```bash
curl -X POST "http://localhost:8000/survey/create" \
  -H "Content-Type: application/json" \
  -d @example_survey.json
```

This returns a `survey_id`.

### Start a Session

```bash
curl -X POST "http://localhost:8000/survey/{survey_id}/session/start"
```

This returns a `session_id` and starts the orchestrator in the background.

### Check Session Status

```bash
curl "http://localhost:8000/session/{session_id}"
```

Wait for `status` to become `"completed"`, then you'll see:
- `evaluation_score` - Quality score (0-100)
- `payment_amount` - Calculated payment
- `transcript` - Full conversation
- `evaluation_notes` - Evaluation details

### View Insights

```bash
curl "http://localhost:8000/survey/{survey_id}/insights"
```

## What Happens in a Session?

When you start a session, the orchestrator automatically:

1. **Targeting Agent** prepares context for the voice agent
2. **Voice Agent** conducts the conversation (currently uses mock transcript)
3. **Evaluation Agent** scores the responses and calculates payment
4. **Payment Function** processes the payment
5. **Insights Agent** analyzes all transcripts and generates insights

## Next Steps

### For Development

- Modify agent prompts in `app/agents/`
- Adjust evaluation criteria in your survey config
- Customize the orchestration flow in `app/orchestrator.py`

### For Production

- Set up actual LiveKit voice integration
- Replace mock payment with real payment provider
- Add database (PostgreSQL/MongoDB) instead of JSON files
- Add user authentication
- Deploy to cloud (AWS, GCP, Azure)

## File Structure

```
CustomarioAI/
├── app/
│   ├── agents/          # All AI agents
│   │   ├── targeting_agent.py
│   │   ├── voice_agent.py
│   │   ├── evaluation_agent.py
│   │   └── insights_agent.py
│   ├── models.py        # Pydantic models
│   ├── storage.py       # JSON storage
│   ├── orchestrator.py  # Flow coordination
│   ├── payment.py       # Payment processing
│   └── main.py          # FastAPI app
├── data/                # Local storage (created automatically)
├── example_survey.json  # Example survey config
├── example_usage.py     # Full system demo
├── test_agents.py       # Individual agent tests
├── run.py               # Server startup
└── requirements.txt     # Dependencies
```

## Troubleshooting

### "ModuleNotFoundError: No module named 'claude_agent_sdk'"

Install dependencies: `pip install -r requirements.txt`

### "LiveKit credentials not configured"

Make sure your `.env` file has all required variables

### "anthropic.AuthenticationError"

Check your `ANTHROPIC_API_KEY` in `.env`

### Session stuck in "in_progress"

Check server logs for errors. The orchestrator runs in background tasks.

## Support

For issues or questions:
1. Check the README.md for detailed documentation
2. Review the API docs at /docs
3. Examine the example_usage.py for working code

