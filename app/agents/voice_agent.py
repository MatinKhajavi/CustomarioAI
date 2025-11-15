"""
OpenAI Realtime Voice Agent for CustomarioAI
Uses OpenAI's Realtime API for true voice conversations
"""
import asyncio
import os
import base64
import json
from typing import List
import pyaudio
import websockets
from openai import AsyncOpenAI


class VoiceSurveyAgent:
    """
    Voice agent using OpenAI Realtime API
    Handles real-time voice conversation for feedback surveys
    """
    
    # Audio configuration
    SAMPLE_RATE = 24000  # 24kHz as required by OpenAI
    CHANNELS = 1
    CHUNK_SIZE = 1024
    FORMAT = pyaudio.paInt16
    
    def __init__(self, api_key: str = None):
        """
        Initialize OpenAI Realtime voice agent
        
        Args:
            api_key: OpenAI API key (defaults to OPENAI_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is required")
        
        self.client = AsyncOpenAI(api_key=self.api_key)
        self.transcript = []
        self.audio = None
        self.stream = None
    
    def _build_system_prompt(self, questions: List[str]) -> str:
        """Build system prompt with survey questions"""
        questions_text = "\n".join([f"{i+1}. {q}" for i, q in enumerate(questions)])
        
        return f"""You are a friendly AI assistant conducting a feedback survey.

Your job:
- Greet the user warmly and explain this is a quick feedback survey (should take just a few minutes)
- Ask these SPECIFIC questions one by one:

{questions_text}

- Listen carefully to each response
- Ask natural follow-up questions if answers are too brief or unclear
- Be encouraging, conversational, and professional
- After all questions are answered, thank the user warmly and let them know their feedback is valuable

Keep the conversation natural and flowing. Make sure to get their answer to each question before moving on.

When you've completed all questions, say "That completes our survey. Thank you so much for your time!" """
    
    async def conduct_survey(self, questions: List[str]) -> str:
        """
        Conduct a voice survey conversation using OpenAI Realtime API
        
        Args:
            questions: List of survey questions to ask
        
        Returns:
            str: Full conversation transcript
        """
        print("\n" + "="*80)
        print("🎙️  VOICE SURVEY STARTING")
        print("="*80)
        print("\nThis uses OpenAI's Realtime API with REAL voice capabilities!")
        print("\nInstructions:")
        print("  - Speak clearly into your microphone")
        print("  - The AI will speak back to you")
        print("  - Answer naturally - the AI will follow up if needed")
        print("  - The conversation will END AUTOMATICALLY when complete")
        print("  - (Press Ctrl+C only if you want to abort early)")
        print("\nMake sure your microphone and speakers are working!")
        print("\n" + "="*80 + "\n")
        
        # Build system prompt
        system_prompt = self._build_system_prompt(questions)
        
        # Initialize audio
        self.audio = pyaudio.PyAudio()
        
        # Open audio streams
        self.input_stream = self.audio.open(
            format=self.FORMAT,
            channels=self.CHANNELS,
            rate=self.SAMPLE_RATE,
            input=True,
            frames_per_buffer=self.CHUNK_SIZE
        )
        
        self.output_stream = self.audio.open(
            format=self.FORMAT,
            channels=self.CHANNELS,
            rate=self.SAMPLE_RATE,
            output=True,
            frames_per_buffer=self.CHUNK_SIZE
        )
        
        send_task = None
        receive_task = None
        
        try:
            # Connect to OpenAI Realtime API via WebSocket
            url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "OpenAI-Beta": "realtime=v1"
            }
            
            async with websockets.connect(url, additional_headers=headers) as ws:
                print("✅ Connected to OpenAI Realtime API\n")
                
                # Configure session
                await ws.send(json.dumps({
                    "type": "session.update",
                    "session": {
                        "modalities": ["text", "audio"],
                        "instructions": system_prompt,
                        "voice": "alloy",
                        "input_audio_format": "pcm16",
                        "output_audio_format": "pcm16",
                        "input_audio_transcription": {
                            "model": "whisper-1"
                        },
                        "turn_detection": {
                            "type": "server_vad",
                            "threshold": 0.8,
                            "prefix_padding_ms": 300,
                            "silence_duration_ms": 1000
                        }
                    }
                }))
                
                # Create tasks for sending and receiving
                send_task = asyncio.create_task(self._send_audio(ws))
                receive_task = asyncio.create_task(self._receive_audio(ws))
                
                # Wait for receive task to complete (when survey ends)
                # This will exit when survey is done
                await receive_task
                
                print("🔄 Ending conversation, please wait...")
                
                # Cancel send task since survey is done
                if not send_task.done():
                    send_task.cancel()
                    try:
                        await send_task
                    except asyncio.CancelledError:
                        pass
                
                # Small delay to let everything clean up
                await asyncio.sleep(0.5)
                
        except KeyboardInterrupt:
            print("\n\n⚠️  Conversation interrupted by user")
            # Cancel tasks if they're running
            if send_task and not send_task.done():
                send_task.cancel()
            if receive_task and not receive_task.done():
                receive_task.cancel()
        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            # Cleanup
            if self.input_stream:
                self.input_stream.stop_stream()
                self.input_stream.close()
            if self.output_stream:
                self.output_stream.stop_stream()
                self.output_stream.close()
            if self.audio:
                self.audio.terminate()
        
        # Build final transcript
        transcript_text = self._format_transcript()
        
        print("\n" + "="*80)
        print("📝 CONVERSATION TRANSCRIPT")
        print("="*80)
        print(transcript_text)
        print("="*80)
        
        print(f"\n✅ Voice conversation complete! Got {len(self.transcript)} turns.")
        print("📤 Sending transcript for evaluation...\n")
        
        return transcript_text
    
    async def _send_audio(self, ws):
        """Send audio from microphone to OpenAI"""
        try:
            while True:
                # Read audio from microphone
                audio_data = self.input_stream.read(self.CHUNK_SIZE, exception_on_overflow=False)
                
                # Encode to base64
                audio_base64 = base64.b64encode(audio_data).decode('utf-8')
                
                # Send to OpenAI
                await ws.send(json.dumps({
                    "type": "input_audio_buffer.append",
                    "audio": audio_base64
                }))
                
                await asyncio.sleep(0.01)  # Small delay to prevent overwhelming
                
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Error sending audio: {e}")
    
    async def _receive_audio(self, ws):
        """Receive events from OpenAI and play audio"""
        try:
            async for message in ws:
                event = json.loads(message)
                event_type = event.get("type")
                
                # Handle different event types
                if event_type == "session.created":
                    print("🎤 Session created, ready to speak!\n")
                
                elif event_type == "response.audio.delta":
                    # Play audio chunk
                    audio_data = base64.b64decode(event["delta"])
                    self.output_stream.write(audio_data)
                
                elif event_type == "conversation.item.input_audio_transcription.completed":
                    # User speech transcribed
                    transcript = event.get("transcript", "")
                    if transcript:
                        print(f"[You]: {transcript}")
                        self.transcript.append(f"User: {transcript}")
                
                elif event_type == "response.audio_transcript.done":
                    # AI speech transcribed
                    transcript = event.get("transcript", "")
                    if transcript:
                        print(f"[Agent]: {transcript}\n")
                        self.transcript.append(f"Agent: {transcript}")
                        
                        # Check if survey is complete
                        if "completes our survey" in transcript.lower() or "thank you so much for your time" in transcript.lower():
                            print("\n✅ Survey completed!\n")
                            return
                
                elif event_type == "error":
                    print(f"❌ Error: {event.get('error', {}).get('message', 'Unknown error')}")
                    return
                
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Error receiving: {e}")
            import traceback
            traceback.print_exc()
    
    def _format_transcript(self) -> str:
        """Format transcript as readable text"""
        return "\n\n".join(self.transcript)


async def run_voice_survey(questions: List[str]) -> str:
    """
    Run a voice survey conversation
    
    Args:
        questions: List of survey questions
    
    Returns:
        str: Conversation transcript
    """
    agent = VoiceSurveyAgent()
    return await agent.conduct_survey(questions)


# For standalone testing
if __name__ == "__main__":
    async def test():
        questions = [
            "How would you rate your overall experience with our product on a scale of 1-10?",
            "What features do you use most frequently, and why?",
            "What improvements would you like to see?"
        ]
        
        transcript = await run_voice_survey(questions)
        print(f"\nFinal transcript length: {len(transcript)} characters")
    
    try:
        asyncio.run(test())
    except KeyboardInterrupt:
        print("\n\nStopped by user")
