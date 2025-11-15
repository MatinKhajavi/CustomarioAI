# CustomarioAI 🎙️

**AI-Powered Voice Survey System** with intelligent evaluation and payment processing.

## ✨ What It Does

CustomarioAI is a complete voice survey system that:
- 🎤 Conducts REAL voice conversations using OpenAI Realtime API
- 📊 Evaluates response quality using Claude AI
- 💰 Calculates fair compensation based on feedback quality
- 🔍 Generates insights from all survey responses

---

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- OpenAI API key (with GPT-4 access)
- Anthropic API key

### Setup (3 minutes)

```bash
# 1. Clone and enter directory
cd CustomarioAI

# 2. Create .env file
cp env.example .env
# Edit .env and add your API keys:
#   OPENAI_API_KEY=sk-proj-...
#   ANTHROPIC_API_KEY=sk-ant-...

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run!
# Terminal 1:
python run.py

# Terminal 2:
python test.py
```

That's it! 🎉

---

## 🎯 How It Works

```
┌─────────────────────────────────────────────────────────┐
│                   CustomarioAI Flow                      │
└─────────────────────────────────────────────────────────┘

1. Survey Creation
   └─> Company defines questions, evaluation criteria, price range

2. Session Start (Targeting Agent)
   └─> Generates context for the survey

3. VOICE Conversation (OpenAI Realtime API)
   └─> AI SPEAKS to you, LISTENS to your voice
   └─> Natural follow-up questions if needed
   └─> Real-time bidirectional audio

4. Evaluation (Claude AI)
   └─> Evaluates completeness, quality, clarity
   └─> Scores 0-100

5. Payment Calculation
   └─> Score mapped to price range ($5-$20)
   └─> User gets paid for quality feedback

6. Insights (Claude AI)
   └─> Company gets aggregated insights
   └─> Common themes, patterns, recommendations
```

---

## 📁 Project Structure

```
CustomarioAI/
├── app/
│   ├── agents/          # AI agents
│   │   ├── voice_agent.py      # GPT-4 conversation
│   │   ├── evaluation_agent.py # Claude evaluation
│   │   ├── insights_agent.py   # Claude insights
│   │   └── targeting_agent.py  # Context generation
│   ├── main.py         # FastAPI backend
│   ├── orchestrator.py # Coordinates all agents
│   └── ...
├── data/               # JSON storage
├── test.py            # Complete flow test
└── run.py             # Start server
```

---

## 🔑 Environment Variables

Required in `.env`:
```bash
OPENAI_API_KEY=sk-proj-...        # For conversation agent
ANTHROPIC_API_KEY=sk-ant-...       # For evaluation & insights
```

Optional:
```bash
BACKEND_URL=http://localhost:8000  # Backend URL
```

---

## 📊 API Endpoints

### Surveys
- `POST /survey/create` - Create survey
- `GET /survey/{id}` - Get survey
- `GET /surveys` - List all surveys
- `GET /survey/{id}/insights` - Get insights

### Sessions
- `POST /survey/{id}/session/start` - Start session
- `POST /session/{id}/complete` - Complete session
- `GET /session/{id}` - Get session details

Full API docs: http://localhost:8000/docs (when running)

---

## 💡 Example Survey

```json
{
  "title": "Product Feedback Survey",
  "questions": [
    "How would you rate your experience 1-10?",
    "What features do you use most?",
    "What improvements would you suggest?"
  ],
  "criteria": [
    {
      "name": "Completeness",
      "description": "Answered all questions with detail",
      "weight": 0.3
    },
    {
      "name": "Quality",
      "description": "Specific, actionable feedback",
      "weight": 0.4
    }
  ],
  "price_range": {
    "min_amount": 5.0,
    "max_amount": 20.0
  }
}
```

---

## 🎬 Demo Flow

```bash
$ python test.py

================================================================================
CustomarioAI - Complete Flow Test
================================================================================

[1] CREATING SURVEY
✅ Survey created: survey_abc123

[2] STARTING SESSION
✅ Session started: session_xyz789

[3] VOICE CONVERSATION (OpenAI Realtime API)
🎤 Starting REAL voice survey...
✅ Connected to OpenAI Realtime API

[AI speaks to you]: "Hi! Thanks for taking time to give us feedback..."

[You speak your response]

[AI responds with follow-up questions]

...

[4] COMPLETING SESSION
✅ Session completed!

[5] RESULTS
💰 Your Score: 85.0/100
💰 Your Payment: $17.50

[6] GENERATING INSIGHTS
🔍 Survey Insights generated

✅ COMPLETE FLOW TEST FINISHED!
```

---

## 🛠️ Tech Stack

- **Backend:** FastAPI (Python)
- **AI Models:**
  - GPT-4o Realtime (OpenAI) - Voice Conversation
  - Claude 3.5 Sonnet (Anthropic) - Evaluation & Insights
- **Voice:** OpenAI Realtime API via WebSocket
- **Audio:** PyAudio for microphone/speaker I/O
- **Storage:** JSON files (easily upgradable to database)
- **API:** REST with automatic OpenAPI docs

---

## 💰 Cost Per Session

- OpenAI Realtime API: ~$0.12-0.30 (voice, 3-5 min conversation)
- Anthropic Claude: ~$0.10-0.30 (evaluation + insights)
- **Total:** ~$0.22-0.60 per session

---

## 🚧 Current Status & Roadmap

**✅ Working Now:**
- 🎤 **REAL voice conversations** (OpenAI Realtime API)
- 🤖 All AI agents operational
- ✅ Complete flow end-to-end
- 📊 Evaluation & payment
- 🔍 Insights generation
- 💬 Natural turn-taking in conversations

**🚀 Coming Next:**
- Web widget for embedding surveys
- Payment integration (Stripe)
- Database storage (PostgreSQL)
- Analytics dashboard
- User authentication
- Multiple voice options (different accents, languages)

---

## 📖 Documentation

- [SETUP.md](SETUP.md) - Detailed setup instructions
- [env.example](env.example) - Environment configuration
- API Docs: http://localhost:8000/docs

---

## 🐛 Troubleshooting

**"OPENAI_API_KEY is required"**
- Make sure `.env` file exists
- Check API key is valid
- Ensure you have GPT-4 access

**"Connection refused"**
- Start backend first: `python run.py`
- Check port 8000 is available

**More help:** See [SETUP.md](SETUP.md) troubleshooting section

---

## 📝 License

MIT License - feel free to use for your projects!

---

## 🤝 Contributing

Contributions welcome! This project is designed to be:
- Easy to understand
- Easy to extend
- Production-ready architecture

---

## ⭐ Key Features

- 🎤 **REAL Voice Conversations** - OpenAI Realtime API
- ✅ **No separate terminals needed** - Everything integrated
- ✅ **No transcript files** - All in-memory
- ✅ **Low latency** - ~250ms response time
- ✅ **Natural turn-taking** - AI knows when you stop talking
- ✅ **Clean architecture** - Multi-agent orchestration
- ✅ **Type-safe** - Pydantic models throughout
- ✅ **Async** - Fast and efficient
- ✅ **API-first** - Easy to integrate anywhere

---

Built with ❤️ using FastAPI, OpenAI, and Anthropic Claude

