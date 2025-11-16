# VAD Configuration Guide 🎛️

## Voice Activity Detection Settings

The Voice Agent uses **Voice Activity Detection (VAD)** to determine when the user is speaking and when they're done. These settings are in `customario/src/services/voiceAgent.ts`.

## VAD Types

### 1. `semantic_vad` (Recommended) 🌟

**NEW!** Uses AI to understand conversational context and natural turn-taking.

```typescript
turnDetection: {
  type: 'semantic_vad',
  threshold: 0.5,
  eagerness: 'medium',
  // ...
}
```

**Benefits:**
- ✅ Better turn-taking in natural conversation
- ✅ Understands hesitations and "umm", "ahh"
- ✅ Less likely to cut off mid-sentence
- ✅ Adjustable eagerness levels

**Use when:** You want the most natural conversation experience

### 2. `server_vad` (Traditional)

Classic voice activity detection based on audio levels.

```typescript
turnDetection: {
  type: 'server_vad',
  threshold: 0.5,
  silenceDurationMs: 700,
  // ...
}
```

**Benefits:**
- ⚡ Slightly faster response time
- ⚡ More predictable behavior
- ⚡ Good for structured Q&A

**Use when:** You want fast, deterministic turn-taking

## Key Settings

### `threshold` 🎚️

**Range:** `0.0` to `1.0`  
**Default:** `0.5`

Controls VAD sensitivity:

```typescript
threshold: 0.3  // Very sensitive - picks up quiet speech & background noise
threshold: 0.5  // Balanced - good for most environments ✅
threshold: 0.7  // Less sensitive - only loud, clear speech
```

**Adjust if:**
- 🔇 **Too quiet/cuts off:** Lower threshold (e.g., `0.3-0.4`)
- 🔊 **Picks up background noise:** Raise threshold (e.g., `0.6-0.7`)

### `silenceDurationMs` ⏱️

**Range:** `200` to `3000` ms  
**Default:** `700` ms

How much silence before considering the user finished speaking:

```typescript
silenceDurationMs: 500   // Quick responses, but may cut off
silenceDurationMs: 700   // Balanced - good for most conversations ✅
silenceDurationMs: 1000  // Patient - waits for longer pauses
```

**Adjust if:**
- 🏃 **Agent interrupts too soon:** Increase (e.g., `1000-1200`)
- 🐌 **Agent waits too long:** Decrease (e.g., `500-600`)

### `eagerness` (semantic_vad only) 🎯

**Options:** `'auto'` | `'low'` | `'medium'` | `'high'`  
**Default:** `'medium'`

How eager the agent is to start responding:

```typescript
eagerness: 'low'     // Patient - waits for very clear end of turn
eagerness: 'medium'  // Balanced - natural conversation flow ✅
eagerness: 'high'    // Eager - jumps in quickly
eagerness: 'auto'    // Let OpenAI decide based on context
```

**Use cases:**
- `'low'` - Long-form responses, storytelling
- `'medium'` - Normal conversation (recommended)
- `'high'` - Quick Q&A, rapid back-and-forth
- `'auto'` - Context-aware (adapts to conversation style)

### `prefixPaddingMs` 📊

**Range:** `0` to `1000` ms  
**Default:** `300` ms

Audio to include **before** detected speech starts:

```typescript
prefixPaddingMs: 100   // May miss start of words
prefixPaddingMs: 300   // Good balance ✅
prefixPaddingMs: 500   // Ensures nothing is missed
```

**Adjust if:**
- ✂️ **First words get cut off:** Increase (e.g., `400-500`)
- 🎵 **Picks up too much before speech:** Decrease (e.g., `100-200`)

### `createResponse` 🤖

**Type:** `boolean`  
**Default:** `true`

Automatically create agent response when turn ends:

```typescript
createResponse: true   // Agent responds immediately ✅
createResponse: false  // Manual control (advanced use)
```

**Use `false` for:**
- Manual response triggering
- Custom turn-taking logic
- Multi-step workflows

### `interruptResponse` 🛑

**Type:** `boolean`  
**Default:** `true`

Allow user to interrupt agent while speaking:

```typescript
interruptResponse: true   // Natural conversation ✅
interruptResponse: false  // Agent always finishes speaking
```

**Use `false` for:**
- Important announcements
- Legal disclaimers
- Critical instructions

## Recommended Configurations

### 🎤 Normal Conversation (Default)

```typescript
turnDetection: {
  type: 'semantic_vad',
  threshold: 0.5,
  silenceDurationMs: 700,
  prefixPaddingMs: 300,
  eagerness: 'medium',
  createResponse: true,
  interruptResponse: true,
}
```

### 📞 Noisy Environment

```typescript
turnDetection: {
  type: 'semantic_vad',
  threshold: 0.65,              // ⬆️ Less sensitive to noise
  silenceDurationMs: 600,       // Slightly faster
  prefixPaddingMs: 200,         
  eagerness: 'medium',
  createResponse: true,
  interruptResponse: true,
}
```

### 🧘 Patient Listener (Long Responses)

```typescript
turnDetection: {
  type: 'semantic_vad',
  threshold: 0.4,               // ⬇️ Pick up softer speech
  silenceDurationMs: 1200,      // ⬆️ Wait longer
  prefixPaddingMs: 400,         
  eagerness: 'low',             // Patient
  createResponse: true,
  interruptResponse: true,
}
```

### ⚡ Quick Q&A

```typescript
turnDetection: {
  type: 'server_vad',           // Faster, more predictable
  threshold: 0.5,
  silenceDurationMs: 500,       // ⬇️ Quick responses
  prefixPaddingMs: 200,         
  createResponse: true,
  interruptResponse: true,
}
```

## Models

### Realtime Model
```typescript
model: 'gpt-4o-realtime-preview-2024-12-17'  // Latest ✅
// or
model: 'gpt-realtime'  // Alias for latest
```

### Transcription Model
```typescript
transcription: {
  model: 'gpt-4o-transcribe'       // Best quality ✅
  // or
  model: 'gpt-4o-mini-transcribe'  // Faster, cheaper
  // or
  model: 'whisper-1'               // Legacy
}
```

### Available Voices
```typescript
voice: 'alloy'    // Neutral, balanced ✅
voice: 'echo'     // Clear, professional
voice: 'fable'    // Expressive, British accent
voice: 'onyx'     // Deep, authoritative
voice: 'nova'     // Friendly, energetic
voice: 'shimmer'  // Warm, soft
```

## Troubleshooting

### Agent keeps interrupting me
```typescript
silenceDurationMs: 1000,  // ⬆️ Wait longer
eagerness: 'low',         // Be more patient
```

### Agent waits too long to respond
```typescript
silenceDurationMs: 500,   // ⬇️ Respond faster
eagerness: 'high',        // Be more eager
```

### Cuts off the start of my sentences
```typescript
prefixPaddingMs: 500,     // ⬆️ Include more audio before
threshold: 0.4,           // ⬇️ Detect speech earlier
```

### Picks up background noise as speech
```typescript
threshold: 0.65,          // ⬆️ Less sensitive
// Consider using noise reduction:
noiseReduction: {
  type: 'near_field'      // For close-to-mic audio
  // or
  type: 'far_field'       // For room audio
}
```

### Misses quiet speech
```typescript
threshold: 0.3,           // ⬇️ More sensitive
```

## Testing Your Settings

1. **Start the voice agent** and have a natural conversation
2. **Pay attention to:**
   - Does it cut you off?
   - Does it wait too long?
   - Does it pick up background noise?
   - Does it miss quiet speech?
3. **Adjust one parameter at a time** (don't change multiple settings)
4. **Test again** and iterate

## Location in Code

All settings are in:
```
customario/src/services/voiceAgent.ts
Lines ~104-128
```

Just update the values and reload your frontend!

---

**Pro Tip:** Start with the defaults and only adjust if you notice specific issues. The semantic_vad with default settings works great for most use cases! 🎯

