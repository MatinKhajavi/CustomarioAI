"""
Voice Agent using LiveKit
Job: Conduct voice conversation with user and collect feedback
"""
import asyncio
from livekit import agents, rtc
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from typing import Optional
import os


class FeedbackAgent(Agent):
    """Custom Agent for conducting feedback surveys"""
    
    def __init__(self, context: str, questions: list[str]) -> None:
        instructions = f"""You are a friendly voice AI assistant conducting a feedback survey.

{context}

Questions to ask:
{chr(10).join(f"{i+1}. {q}" for i, q in enumerate(questions))}

Guidelines:
- Ask questions naturally and conversationally
- Listen carefully to responses
- Ask follow-up questions if responses are too brief
- Be encouraging and thank the user for their time
- Keep the conversation flowing naturally
"""
        super().__init__(instructions=instructions)


async def conduct_voice_survey(
    room_name: str,
    context: str,
    questions: list[str],
    livekit_url: str,
    api_key: str,
    api_secret: str
) -> str:
    """
    Conduct a voice survey and return the transcript
    
    Args:
        room_name: LiveKit room name
        context: Context from targeting agent
        questions: List of questions to ask
        livekit_url: LiveKit server URL
        api_key: LiveKit API key
        api_secret: LiveKit API secret
    
    Returns:
        str: Complete conversation transcript
    """
    
    # Store transcript
    transcript_parts = []
    
    async def entrypoint(ctx: agents.JobContext):
        # Create session
        session = AgentSession(
            stt="assemblyai/universal-streaming:en",
            llm="openai/gpt-4.1-mini",
            tts="cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
            vad=silero.VAD.load(),
            turn_detection=MultilingualModel(),
        )
        
        # Start session
        await session.start(
            room=ctx.room,
            agent=FeedbackAgent(context, questions),
            room_input_options=RoomInputOptions(
                noise_cancellation=noise_cancellation.BVCTelephony(),
            ),
        )
        
        # Collect transcripts
        @ctx.room.on("track_subscribed")
        def on_track_subscribed(
            track: rtc.Track,
            publication: rtc.TrackPublication,
            participant: rtc.RemoteParticipant,
        ):
            if track.kind == rtc.TrackKind.KIND_AUDIO:
                # Handle audio track for transcription
                pass
        
        # Start the conversation
        await session.generate_reply(
            instructions="Greet the user, introduce the survey, and start asking the questions."
        )
        
        # Wait for conversation to complete
        # In a real implementation, you'd track when all questions are answered
        # For now, we'll wait for a reasonable duration
        await asyncio.sleep(300)  # 5 minutes max
    
    # Create worker and run
    worker = agents.Worker(
        request_fnc=entrypoint,
        worker_type=agents.WorkerType.ROOM,
    )
    
    # In a real implementation, this would connect to LiveKit
    # and return the actual transcript
    # For now, return placeholder
    return "Voice conversation transcript will be captured here..."


async def run_voice_agent_for_session(
    session_id: str,
    context: str,
    questions: list[str]
) -> str:
    """
    Run voice agent for a specific session and return transcript
    
    This is a simplified version that would be connected to LiveKit
    in a production environment.
    """
    # Get LiveKit credentials from environment
    livekit_url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    
    if not all([livekit_url, api_key, api_secret]):
        raise ValueError("LiveKit credentials not configured")
    
    # Room name based on session ID
    room_name = f"survey-{session_id}"
    
    # Run the voice survey
    transcript = await conduct_voice_survey(
        room_name=room_name,
        context=context,
        questions=questions,
        livekit_url=livekit_url,
        api_key=api_key,
        api_secret=api_secret
    )
    
    return transcript

