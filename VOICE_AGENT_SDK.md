# Voice Agent - OpenAI Realtime SDK Implementation

## ✅ What Changed

The voice agent has been **completely rewritten** using the official OpenAI Agents SDK (`@openai/agents`), which provides a much more reliable and maintainable implementation compared to the previous manual WebSocket approach.

### Key Improvements

1. **Official SDK**: Using `@openai/agents/realtime` instead of low-level WebSocket handling
2. **Automatic Audio Handling**: SDK manages microphone, speaker, and audio processing automatically
3. **Type Safety**: Full TypeScript support with proper types
4. **Better Event System**: Comprehensive event listeners for all session states
5. **Secure Token Generation**: Backend endpoint generates ephemeral tokens

### Files Modified

- ✅ `customario/src/services/voiceAgent.ts` - Completely rewritten with SDK
- ✅ `app/main.py` - Added `/api/realtime-token` endpoint
- ✅ `customario/vite.config.ts` - Added proxy for backend API calls
- ✅ `customario/package.json` - Added `@openai/agents` dependency

## 🚀 How to Use

### 1. Install Dependencies

```bash
cd customario
npm install
```

This installs:
- `@openai/agents` - Official OpenAI Agents SDK
- `zod@3` - Required peer dependency

### 2. Start Backend (Terminal 1)

```bash
cd /Users/matin/Desktop/Projects/CustomarioAI
export OPENAI_API_KEY="your-key-here"
python -m uvicorn app.main:app --reload --port 8000
```

### 3. Start Frontend (Terminal 2)

```bash
cd customario
npm run dev
```

The frontend will run on `http://localhost:5173` and automatically proxy API calls to the backend on port 8000.

## 🔧 How It Works

### Architecture

```
Frontend (Browser)                Backend (FastAPI)              OpenAI
─────────────────                ──────────────────              ──────
                                                                   
1. User clicks "Start Survey"                                      
   │                                                               
   ├─> POST /api/realtime-token ──────> Generate ephemeral       
   │                                     token with API key       
   │                                     │                         
   │                                     └─> POST /v1/realtime/   
   │                                          client_secrets ────> 
   │                                                               
   │                                         <── Returns ek_...  <──
   │                                                               
   <── Returns ephemeral token                                    
   │                                                               
2. VoiceAgent connects                                            
   │                                                               
   └─> WebRTC Connection ──────────────────────────────────────>  
       (SDK handles automatically)                        Realtime API
       │                                                           
       ├─ Mic audio streams                                       
       ├─ Receives agent audio                                    
       ├─ Transcripts tracked                                     
       └─ Events handled                                          
```

### Key Components

#### Frontend: `VoiceAgent` Class

```typescript
import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';

// Create agent with instructions
const agent = new RealtimeAgent({
  name: 'Survey Assistant',
  instructions: 'Your survey prompt...',
  voice: 'alloy',
});

// Create session (SDK handles audio automatically)
const session = new RealtimeSession(agent, {
  model: 'gpt-4o-realtime',
});

// Connect with ephemeral token
await session.connect({ apiKey: ephemeralToken });

// Listen to events
session.on('history_updated', (history) => {
  // Update transcript UI
});
```

#### Backend: Token Generation

```python
@app.post("/api/realtime-token")
async def generate_realtime_token():
    # Call OpenAI to generate ephemeral token
    response = await client.post(
        'https://api.openai.com/v1/realtime/client_secrets',
        headers={'Authorization': f'Bearer {OPENAI_API_KEY}'},
        json={'session': {'type': 'realtime', 'model': 'gpt-4o-realtime'}}
    )
    return {'token': response.json()['value']}  # Returns "ek_..."
```

## 🎯 Features

### What the SDK Handles Automatically

- ✅ Microphone access and audio capture
- ✅ Audio encoding (PCM16, 24kHz)
- ✅ WebRTC connection in browser
- ✅ Speaker output and playback
- ✅ Voice Activity Detection (VAD)
- ✅ Turn-taking and interruptions
- ✅ Transcription (both user and agent)
- ✅ Session state management
- ✅ Error handling and reconnection

### Available Events

```typescript
session.on('history_updated', (history) => {})      // Full conversation history
session.on('history_added', (item) => {})           // New message added
session.on('audio_start', () => {})                 // Agent starts speaking
session.on('audio_stopped', () => {})               // Agent stops speaking
session.on('audio_interrupted', () => {})           // Agent was interrupted
session.on('agent_start', (context, agent) => {})   // Agent begins response
session.on('agent_end', (context, agent, output) => {}) // Agent finishes
session.on('error', (error) => {})                  // Error occurred
```

### Available Methods

```typescript
// Send text message
session.sendMessage("Hello!");

// Update conversation history
session.updateHistory(newHistory);

// Get current history
const history = session.history;

// Interrupt agent
session.interrupt();

// Mute/unmute microphone
session.mute(true);

// Disconnect
session.close();
```

## 📚 Documentation

- [OpenAI Agents SDK - Voice Agents](https://openai.github.io/openai-agents-js/guides/voice-agents/quickstart/)
- [Building Voice Agents](https://openai.github.io/openai-agents-js/guides/voice-agents/build/)
- [API Reference](https://openai.github.io/openai-agents-js/api/agents-realtime/)

## 🐛 Troubleshooting

### No microphone access
- Browser will prompt for permission on first use
- Check browser console for errors

### Token generation fails
- Ensure `OPENAI_API_KEY` is set in backend environment
- Check backend is running on port 8000
- Verify proxy configuration in `vite.config.ts`

### Audio not playing
- Check browser audio permissions
- Verify speakers are working
- SDK automatically handles audio context (no manual setup needed)

### Connection errors
- Ensure backend is running first
- Check CORS settings in backend
- Verify OpenAI API key is valid

## 🔒 Security Notes

**✅ Best Practice**: The backend generates ephemeral tokens
- Your OpenAI API key stays secure on the server
- Ephemeral tokens expire quickly (short-lived)
- Frontend never sees your actual API key

**⚠️ Development Fallback**: If backend is unavailable, the voice agent will try to use `VITE_OPENAI_API_KEY` directly from the frontend. This is **only for development** and should not be used in production.

## 🎉 Ready to Test

1. Start backend: `python -m uvicorn app.main:app --reload --port 8000`
2. Start frontend: `cd customario && npm run dev`
3. Open browser: `http://localhost:5173`
4. Click the feedback widget and start talking!

The SDK handles everything automatically - just speak naturally and the agent will conduct the survey.

