# CustomarioAI - Setup Guide

**AI-Powered Voice Survey System** - Complete setup guide with REAL voice conversations!

## 🚀 Quick Start

### 1. Get API Keys

You need **2 API keys**:

1. **OpenAI API Key**
   - Go to: https://platform.openai.com/api-keys
   - Requires paid account (GPT-4 access needed)
   - Create and copy API key

2. **Anthropic API Key**
   - Go to: https://console.anthropic.com/settings/keys
   - Free trial available
   - Create and copy API key

### 2. Configure Environment

```bash
# Copy the example env file
cp env.example .env

# Edit .env and add your API keys
nano .env  # or use your favorite editor
```

Your `.env` should look like:
```bash
OPENAI_API_KEY=sk-proj-your_openai_key_here
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here
BACKEND_URL=http://localhost:8000
```

### 3. Install Dependencies

```bash
# Install Python packages
pip install -r requirements.txt

# On macOS, you may need to install PortAudio first for pyaudio:
brew install portaudio

# On Linux (Ubuntu/Debian):
# sudo apt-get install portaudio19-dev

# On Windows:
# pyaudio should install automatically via pip
```

### 4. Run the App

**Open 2 terminals:**

**Terminal 1 - Start Backend:**
```bash
python run.py
```

**Terminal 2 - Run Test:**
```bash
python test.py
```

That's it! The conversation agent runs **directly in Terminal 2** - no third terminal needed!

---

## 🎯 How It Works

### The Flow

```
1. Survey Creation    → Creates survey with questions
2. Session Start      → Targeting agent prepares context
3. VOICE Conversation → OpenAI Realtime API - REAL voice chat!
4. Evaluation         → Claude evaluates transcript quality
5. Payment            → Calculates and processes payment
6. Insights           → Generates insights for company
```

### Current Implementation

**🎤 REAL Voice Conversation:**
- ✅ True voice input/output using OpenAI Realtime API
- ✅ Natural conversation with AI speaking to you
- ✅ Real-time speech-to-text and text-to-speech
- ✅ Automatic turn detection (AI knows when you stop talking)
- 🎯 Low latency (~250ms response time)

---

## 🎤 Voice Agent Details

The voice agent (`app/agents/voice_agent.py`) uses:

- **Model:** GPT-4o Realtime (OpenAI's voice model)
- **Interface:** WebSocket connection to OpenAI
- **Voice:** "Alloy" (can be changed to: echo, fable, onyx, nova, shimmer)
- **Audio:** 24kHz PCM16 format
- **Features:**
  - Real-time bidirectional audio streaming
  - Server-side Voice Activity Detection (VAD)
  - Automatic turn detection
  - Built-in speech-to-text transcription
  - Natural conversation flow
  - Contextual follow-up questions

---

## 📊 API Endpoints

### Survey Management
- `POST /survey/create` - Create new survey
- `GET /survey/{survey_id}` - Get survey details
- `GET /surveys` - List all surveys
- `GET /survey/{survey_id}/insights` - Get survey insights

### Session Management
- `POST /survey/{survey_id}/session/start` - Start new session
- `POST /session/{session_id}/complete` - Complete session with transcript
- `GET /session/{session_id}` - Get session details
- `GET /survey/{survey_id}/sessions` - List survey sessions

---

## 🔧 Configuration

### Survey Evaluation Criteria

Edit `example_survey.json` to customize:

```json
{
  "criteria": [
    {
      "name": "Completeness",
      "weight": 0.3
    },
    {
      "name": "Quality",
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

## 🐛 Troubleshooting

### "OPENAI_API_KEY is required"
- Make sure `.env` file exists in the project root
- Check that `OPENAI_API_KEY` is set correctly
- Restart the test script after adding the key

### "Error during conversation"
- Verify your OpenAI API key is valid
- Ensure you have GPT-4 access on your OpenAI account
- Check your OpenAI account has available credits

### "Session must be in progress"
- Make sure you started the session first
- Don't manually change session status
- Check backend logs for errors

### Connection refused / Backend errors
- Ensure `python run.py` is running in Terminal 1
- Check that port 8000 is not being used by another process
- Look at the backend terminal for error messages

### "No module named 'pyaudio'" or pyaudio errors
- On macOS: `brew install portaudio` then `pip install pyaudio`
- On Linux: `sudo apt-get install portaudio19-dev` then `pip install pyaudio`
- On Windows: `pip install pyaudio` should work directly

### Microphone not working / No audio
- Check System Preferences > Security & Privacy > Microphone
- Grant microphone access to Terminal
- Test your microphone with another app first
- Make sure speakers/headphones are connected
- Try different audio input/output devices

### "WebSocket connection failed"
- Verify your OpenAI API key is valid
- Check you have access to GPT-4 Realtime API
- Ensure you have network connectivity

---

## 💰 API Costs

**Per survey session (approximate):**

- **OpenAI Realtime API:** ~$0.12-0.30 (voice conversation, ~3-5 minutes)
  - Input audio: $0.06/min
  - Output audio: $0.24/min
  - Text input/output: $0.005/1K tokens
- **Anthropic Claude:** ~$0.10-0.30 (evaluation + insights)

**Total per session:** ~$0.22-0.60

**Free trials available:**
- OpenAI: Pay as you go (no free tier for GPT-4)
- Anthropic: $5 credit (~50-100 evaluations)

---

## 🔐 Security Notes

- Never commit `.env` file to git
- Keep API keys secret
- Rotate keys regularly
- Use environment-specific keys for production

---

## 📚 File Structure

```
CustomarioAI/
├── app/
│   ├── agents/
│   │   ├── voice_agent.py        # GPT-4 conversation agent
│   │   ├── evaluation_agent.py   # Claude evaluation
│   │   ├── insights_agent.py     # Claude insights
│   │   └── targeting_agent.py    # Context generation
│   ├── main.py                   # FastAPI app
│   ├── models.py                 # Pydantic models
│   ├── orchestrator.py           # Flow coordination
│   ├── payment.py                # Payment processing
│   └── storage.py                # Data storage
├── data/
│   ├── surveys.json              # Survey storage
│   └── sessions.json             # Session storage
├── run.py                        # Start backend
├── test.py                       # Test complete flow
├── requirements.txt              # Dependencies
├── env.example                   # Example environment variables
└── example_survey.json           # Example survey
```

---

## 🚧 Roadmap

### Current Status: ✅ Text-Based Chat

**Next Steps:**
1. Add voice input/output using OpenAI Realtime API
2. Alternative: Integrate Deepgram STT + ElevenLabs TTS
3. Add web widget for embedding surveys
4. Add analytics dashboard
5. Add payment integration (Stripe)

---

## 🆘 Support

For issues:
1. Check troubleshooting section above
2. Verify all API keys are valid
3. Check backend logs for errors
4. Ensure both terminals are running

---

## 🎉 Success!

When you run `python test.py`, you should see:
1. Survey created ✅
2. Session started ✅
3. Conversation with AI (you type responses) 💬
4. Transcript displayed 📝
5. Evaluation score 💯
6. Payment calculated 💰
7. Insights generated 📊

**Enjoy using CustomarioAI!**
