"""
Test voice agent in console mode (terminal)
Lets you speak to the agent via your microphone and see transcripts in terminal
"""
import asyncio
from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

load_dotenv()


class TestVoiceAgent(Agent):
    """Test agent for console voice interaction"""
    
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are a friendly voice AI assistant conducting a feedback survey.

Ask the user:
1. How would you rate your overall experience with our product?
2. What features do you use most frequently?
3. What improvements would you like to see?

Be conversational and friendly. Ask follow-up questions if answers are brief."""
        )


async def entrypoint(ctx: agents.JobContext):
    """Console mode entrypoint"""
    
    print("\n" + "="*60)
    print("🎤 VOICE AGENT CONSOLE TEST")
    print("="*60)
    print("\nStarting voice agent...")
    print("You can speak when you see the prompt.")
    print("Press Ctrl+C to stop.\n")
    
    # Create session
    session = AgentSession(
        stt="cartesia/ink-whisper:en",  # Speech-to-text
        llm="openai/gpt-4o",                # Language model
        tts="cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",  # Text-to-speech
        vad=silero.VAD.load(),                    # Voice activity detection
        turn_detection=MultilingualModel(),
    )
    
    await session.start(
        room=ctx.room,
        agent=TestVoiceAgent(),
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )
    
    # Start the conversation
    print("Agent: Starting conversation...\n")
    await session.generate_reply(
        instructions="Greet the user warmly and introduce the feedback survey."
    )
    
    # Keep running until interrupted
    await asyncio.Future()  # Run forever


if __name__ == "__main__":
    print("\n" + "="*60)
    print("SETUP CHECK")
    print("="*60)
    print("✓ Make sure you have:")
    print("  - ANTHROPIC_API_KEY in .env")
    print("  - LIVEKIT_URL in .env")
    print("  - LIVEKIT_API_KEY in .env")
    print("  - LIVEKIT_API_SECRET in .env")
    print("  - Microphone connected")
    print("  - Speakers/headphones connected")
    print("\n")
    
    # Run in console mode
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )

