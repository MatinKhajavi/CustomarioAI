# Widget Integration Guide

## Overview

CustomarioAI is designed to be embedded in your website/app as an interactive widget (similar to Intercom). Users can provide feedback through voice, get paid immediately, and the company gets insights.

## Widget Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. User clicks widget button                                │
│     ↓                                                         │
│  2. Panel opens, session starts                              │
│     - Targeting agent prepares context (2-3 sec)             │
│     - LiveKit room is ready                                  │
│     ↓                                                         │
│  3. Voice conversation                                        │
│     - Real-time audio via LiveKit                            │
│     - Transcript shown in panel                              │
│     - Questions asked naturally                              │
│     ↓                                                         │
│  4. User clicks "Done" (or agent ends call)                  │
│     ↓                                                         │
│  5. Evaluation & Payment (3-5 sec)                           │
│     - Evaluation agent scores response                       │
│     - Payment processed                                      │
│     - Results shown to user immediately                      │
│     ↓                                                         │
│  6. Background: Insights generated for company               │
└─────────────────────────────────────────────────────────────┘
```

## API Flow for Widget

### 1. Initialize Widget (One-time on page load)

```javascript
// Get survey configuration
GET /survey/{survey_id}

Response:
{
  "survey_id": "survey_abc123",
  "title": "Product Feedback",
  "questions": [...],
  "price_range": {"min_amount": 5.0, "max_amount": 20.0}
}
```

### 2. User Clicks Widget Button

```javascript
// Start session
POST /survey/{survey_id}/session/start

Response:
{
  "session_id": "session_xyz789",
  "room_name": "survey-session_xyz789",
  "livekit_token": "eyJhbGc...",
  "livekit_url": "wss://...",
  "context": "Agent briefing...",
  "questions": [...],
  "status": "ready"
}
```

### 3. Connect to LiveKit (Voice Conversation)

```javascript
import { Room } from 'livekit-client';

// Connect to LiveKit room
const room = new Room();
await room.connect(livekit_url, livekit_token);

// Enable user microphone
await room.localParticipant.setMicrophoneEnabled(true);

// Listen for transcripts
room.on('transcriptionReceived', (transcript) => {
  // Show in widget panel
  updateTranscriptPanel(transcript);
});

// Voice agent joins automatically and starts conversation
```

### 4. User Clicks "Done" or Agent Ends

```javascript
// Get transcript from LiveKit
const transcript = getFullTranscript();

// Complete session
POST /session/{session_id}/complete?transcript={transcript}

Response:
{
  "session_id": "session_xyz789",
  "score": 85,
  "payment_amount": 15.50,
  "payment_status": "success",
  "transaction_id": "txn_...",
  "evaluation_notes": "Great feedback!",
  "message": "Thank you! You've earned $15.50"
}

// Show this to user immediately!
```

### 5. Company Dashboard (Separate)

```javascript
// Get insights anytime
GET /survey/{survey_id}/insights

Response:
{
  "survey_id": "survey_abc123",
  "total_sessions": 42,
  "average_score": 78.5,
  "average_payment": 12.30,
  "key_insights": "Users love feature X but want mobile app...",
  "sessions": [...]
}
```

## Frontend Widget Implementation

### Basic HTML Structure

```html
<!-- Widget Button (always visible) -->
<div id="feedback-widget-button">
  💬 Share Feedback & Earn $5-20
</div>

<!-- Widget Panel (slides in when clicked) -->
<div id="feedback-widget-panel" class="hidden">
  <div class="header">
    <h2>Share Your Feedback</h2>
    <button id="close-widget">×</button>
  </div>
  
  <div class="content">
    <!-- Status message -->
    <div id="status">Connecting...</div>
    
    <!-- Transcript display -->
    <div id="transcript"></div>
    
    <!-- Controls -->
    <button id="done-button" class="hidden">Done</button>
  </div>
  
  <!-- Results screen -->
  <div id="results" class="hidden">
    <h3>Thank you! 🎉</h3>
    <p id="payment-message"></p>
    <p id="score-message"></p>
  </div>
</div>
```

### Widget JavaScript (Simplified)

```javascript
class FeedbackWidget {
  constructor(surveyId, apiUrl) {
    this.surveyId = surveyId;
    this.apiUrl = apiUrl;
    this.sessionId = null;
    this.room = null;
    this.transcript = '';
  }

  async initialize() {
    // Load survey config
    const survey = await fetch(`${this.apiUrl}/survey/${this.surveyId}`);
    this.survey = await survey.json();
  }

  async startSession() {
    // Call API to start session
    const response = await fetch(
      `${this.apiUrl}/survey/${this.surveyId}/session/start`,
      { method: 'POST' }
    );
    const data = await response.json();
    
    this.sessionId = data.session_id;
    
    // Connect to LiveKit
    await this.connectToLiveKit(data.livekit_url, data.livekit_token);
    
    // Show panel
    this.showPanel();
  }

  async connectToLiveKit(url, token) {
    const { Room } = await import('livekit-client');
    
    this.room = new Room();
    await this.room.connect(url, token);
    
    // Enable microphone
    await this.room.localParticipant.setMicrophoneEnabled(true);
    
    // Listen for transcripts
    this.room.on('transcriptionReceived', (transcription) => {
      this.transcript += transcription.text + '\n';
      this.updateTranscriptDisplay(transcription);
    });
    
    // Show "Done" button after conversation starts
    setTimeout(() => {
      document.getElementById('done-button').classList.remove('hidden');
    }, 3000);
  }

  async completeSession() {
    // Disconnect from LiveKit
    await this.room.disconnect();
    
    // Call API to complete
    const response = await fetch(
      `${this.apiUrl}/session/${this.sessionId}/complete?transcript=${encodeURIComponent(this.transcript)}`,
      { method: 'POST' }
    );
    const result = await response.json();
    
    // Show results to user
    this.showResults(result);
  }

  showResults(result) {
    document.getElementById('transcript').classList.add('hidden');
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('payment-message').textContent = result.message;
    document.getElementById('score-message').textContent = 
      `Quality Score: ${result.score}/100`;
  }
}

// Initialize widget
const widget = new FeedbackWidget('survey_abc123', 'http://localhost:8000');
widget.initialize();

// Attach event listeners
document.getElementById('feedback-widget-button').onclick = () => {
  widget.startSession();
};

document.getElementById('done-button').onclick = () => {
  widget.completeSession();
};
```

## Testing Without Frontend

Run the test script that simulates the entire widget flow:

```bash
# Terminal 1: Start server
python run.py

# Terminal 2: Run widget flow test
python test_widget_flow.py
```

This script simulates:
1. ✅ User clicking widget button
2. ✅ Session starting (targeting agent)
3. ✅ Voice conversation happening
4. ✅ User clicking "Done"
5. ✅ Evaluation & payment
6. ✅ Results shown to user
7. ✅ Insights generated for company

## Response Times

- **Session Start**: 2-5 seconds (targeting agent)
- **Voice Latency**: <100ms (LiveKit)
- **Session Complete**: 3-8 seconds (evaluation + payment)
- **Insights**: 5-15 seconds (runs in background, doesn't block)

## Widget Customization

### Styling
- Match your brand colors
- Position: bottom-right, bottom-left, etc.
- Size: compact, expanded, full-screen mobile

### Behavior
- Auto-open on page load (optional)
- Show only to certain users
- Track completion rate
- A/B test payment amounts

### Integration Points
- User authentication (pass user ID)
- Payment info collection upfront
- Email receipt after completion
- Save transcript to user profile

## Next Steps

1. **Build Frontend Widget**: Use React, Vue, or vanilla JS
2. **Implement LiveKit Client**: Follow their excellent docs
3. **Style Widget**: Match your brand
4. **Test End-to-End**: Real voice conversations
5. **Deploy**: Host backend on cloud

## Example Repositories

Check these for frontend examples:
- React: https://github.com/livekit-examples/agent-starter-react
- Swift: https://github.com/livekit-examples/agent-starter-swift
- Flutter: https://github.com/livekit-examples/agent-starter-flutter

## Support

For issues or questions about integration:
- Check the API docs at `/docs`
- Review `test_widget_flow.py` for API usage examples
- See LiveKit docs for client integration

