# Vapi Setup Guide

This project uses the official [@vapi-ai/web](https://github.com/VapiAI/client-sdk-web) SDK for voice AI conversations.

## Installation

The SDK is already installed via npm:

```bash
npm install @vapi-ai/web
```

## Environment Variables

Create a `.env` file in the `customario` directory with the following variables:

```env
VITE_VAPI_PUBLIC_KEY=your_public_key_here
VITE_VAPI_ASSISTANT_ID=your_assistant_id_here
```

### Getting Your Public Key

1. Go to [Vapi Dashboard](https://dashboard.vapi.ai/keys)
2. Copy your **PUBLIC** key (not the private key)
3. Public keys are safe to use in frontend code
4. Private keys should never be exposed in frontend code

### Getting Your Assistant ID

1. Go to [Vapi Dashboard](https://dashboard.vapi.ai/assistants)
2. Create or select an assistant
3. Copy the Assistant ID

## How It Works

The Vapi SDK handles:

- WebSocket connections for real-time voice streaming
- Microphone access and audio processing
- Speech-to-text transcription
- Text-to-speech responses
- Call management (start, stop, pause, resume)

## Usage in Code

The SDK is used through the `vapiService` wrapper in `src/services/vapiService.ts`:

```typescript
import { vapiService } from "../services/vapiService";

// Start a call
await vapiService.startCall(
  { sessionId: "123", surveyTopic: "Feedback" },
  handleMessage
);

// Stop a call
vapiService.stopCall();

// Mute/unmute
vapiService.setMuted(true);
```

## Events

The SDK emits the following events:

- `message` - Transcripts, assistant messages, function calls
- `call-start` - Call has started
- `call-end` - Call has ended
- `speech-start` - Assistant started speaking
- `speech-end` - Assistant finished speaking
- `error` - Error occurred

These events are automatically handled by the `vapiService` and forwarded to your message handlers.

## Troubleshooting

### "Invalid Key" Error

- Make sure you're using your **PUBLIC** key, not the private key
- Public keys are safe for frontend use
- Private keys will cause CORS and authentication errors

### "VAPI_PUBLIC_KEY not found"

- Check that your `.env` file is in the `customario` directory
- Make sure the variable is named `VITE_VAPI_PUBLIC_KEY` (with `VITE_` prefix)
- Restart your dev server after adding/changing environment variables

### "VAPI_ASSISTANT_ID not found"

- Check that your `.env` file contains `VITE_VAPI_ASSISTANT_ID`
- Restart your dev server after adding/changing environment variables

### Microphone Not Working

- The SDK will automatically request microphone permissions
- Make sure your browser allows microphone access
- Check browser console for permission errors

## Resources

- [Vapi Web SDK GitHub](https://github.com/VapiAI/client-sdk-web)
- [Vapi Dashboard](https://dashboard.vapi.ai)
- [Vapi Documentation](https://docs.vapi.ai)
