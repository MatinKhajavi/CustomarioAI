# Voice Survey Flow - What to Expect

## 🎤 Complete Flow

When you run `python test.py`, here's what happens:

### 1. Survey Creation ✅
- Backend creates a survey with questions
- Takes ~1 second

### 2. Session Start ✅
- Targeting agent generates context
- Takes ~2-3 seconds

### 3. Voice Conversation 🎙️
- **Connects to OpenAI Realtime API**
- **AI speaks to you** through your speakers
- **You speak back** into your microphone
- **Real-time transcription** shows in terminal
- **Conversation ends AUTOMATICALLY** when survey is complete
  - The AI says: "That completes our survey. Thank you so much for your time!"
  - You'll see: "✅ Survey completed!"
  - **DO NOT press Ctrl+C** - it will continue automatically!

Takes ~3-5 minutes depending on your answers

### 4. Session Completion ✅
- Transcript is sent to backend automatically
- Takes ~1 second

### 5. Evaluation 🤖
- Claude AI evaluates your responses
- Scores completeness, quality, clarity
- Calculates payment based on score
- Takes ~5-10 seconds

### 6. Results 💰
- Shows your score (0-100)
- Shows your payment ($5-$20)
- Shows evaluation notes
- Displays transcript

### 7. Insights 📊
- Generates insights from all sessions
- Shows patterns and trends
- Company dashboard data

---

## ⚠️ Important: When to Press Ctrl+C

### ❌ DON'T Press Ctrl+C When:
- You see "✅ Survey completed!"
- You see "🔄 Ending conversation, please wait..."
- You see "📝 CONVERSATION TRANSCRIPT"
- The conversation naturally ended

**The script will automatically continue to the next steps!**

### ✅ DO Press Ctrl+C If:
- You want to abort the conversation early
- Something is stuck/frozen
- You want to stop the entire test

---

## 🎯 What You'll See

```
================================================================================
[3] VOICE CONVERSATION (OpenAI Realtime API)
================================================================================

🎤 Starting REAL voice survey...

================================================================================
🎙️  VOICE SURVEY STARTING
================================================================================

✅ Connected to OpenAI Realtime API

🎤 Session created, ready to speak!

[Agent]: Hello! Thank you for joining me today...

[You]: <your speech transcribed here>

[Agent]: Great! Next question...

... conversation continues ...

[Agent]: That completes our survey. Thank you so much for your time!

✅ Survey completed!

🔄 Ending conversation, please wait...

================================================================================
📝 CONVERSATION TRANSCRIPT
================================================================================
<full transcript shown>
================================================================================

✅ Voice conversation complete! Got 12 turns.
📤 Sending transcript for evaluation...

================================================================================
[4] COMPLETING SESSION
================================================================================
<continues automatically...>
```

---

## 💡 Tips for Best Results

### During Voice Conversation:
1. **Speak clearly** - wait for AI to finish before speaking
2. **Be detailed** - more detail = higher quality = more payment
3. **Answer all questions** - completeness is evaluated
4. **Natural conversation** - AI will ask follow-ups if needed
5. **Wait for completion** - Don't interrupt the ending

### For High Scores:
- **Completeness (30%)**: Answer all questions with detail
- **Quality (40%)**: Be specific, actionable, valuable
- **Clarity (30%)**: Clear, well-articulated responses

### Example Good Answers:
- ❌ Bad: "It's good"
- ✅ Good: "I'd rate it 8/10 because the interface is intuitive and saves me time, though the mobile app could use some work"

---

## 🔍 Troubleshooting

### "Conversation seems stuck"
- Wait 10 seconds - AI might be processing
- If still stuck after 30 seconds, press Ctrl+C

### "I pressed Ctrl+C too early"
- The script will ask if you want to continue
- Choose 'y' to skip to results
- Or choose 'n' to cancel the test

### "Transcript is too short"
- You'll be warned if transcript < 50 characters
- Can choose to continue or abort
- Try speaking more clearly next time

### "No audio playing"
- Check speaker volume
- Check System Preferences > Sound > Output
- Try restarting the test

### "Microphone not working"
- Check System Preferences > Microphone permissions
- Grant access to Terminal
- Test mic in another app first

---

## 📊 Typical Timeline

| Step | Duration | What's Happening |
|------|----------|------------------|
| Survey Creation | 1s | Creating survey in DB |
| Session Start | 2-3s | Claude generating context |
| Voice Connection | 2-3s | Connecting to OpenAI |
| Voice Conversation | 3-5 min | You talking with AI |
| Ending Conversation | 1-2s | Cleaning up audio |
| Transcript Processing | <1s | Formatting transcript |
| Session Completion | 1s | Sending to backend |
| Evaluation | 5-10s | Claude analyzing responses |
| Results Display | 1s | Showing your score |
| Insights Generation | 3-5s | Analyzing all sessions |
| **TOTAL** | **~5-7 minutes** | Full end-to-end flow |

---

## ✅ Success Indicators

You'll know everything worked when you see:
- ✅ Survey created
- ✅ Session started
- ✅ Connected to OpenAI Realtime API
- 🎤 Session created, ready to speak!
- [Agent] and [You] transcripts in real-time
- ✅ Survey completed!
- ✅ Voice conversation complete!
- ✅ Session completed and evaluated!
- 💰 Your Score: 85.0/100
- 💰 Your Payment: $17.50
- ✅ COMPLETE FLOW TEST FINISHED!

---

**Enjoy your voice survey experience!** 🎉

