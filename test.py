#!/usr/bin/env python3
"""
Test the complete CustomarioAI flow with real voice
Now with integrated ElevenLabs voice agent - no separate terminal needed!
"""
import asyncio
import json
import httpx
import os
import sys
from dotenv import load_dotenv

# Load environment variables FIRST (before any other imports that need them)
load_dotenv()

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agents.voice_agent import run_voice_survey

BASE_URL = "http://localhost:8000"

async def main():
    print("\n" + "="*80)
    print("CustomarioAI - Complete Flow Test with VOICE")
    print("="*80)
    print("\nThis will test the COMPLETE flow:")
    print("  1. Survey creation")
    print("  2. Session start (Targeting Agent)")
    print("  3. VOICE conversation (OpenAI Realtime API - REAL voice!)")
    print("  4. Automatic evaluation (Evaluation Agent)")
    print("  5. Payment processing")
    print("  6. Insights generation")
    print("\n" + "="*80)
    print("\nMake sure:")
    print("  - Backend is running: python run.py")
    print("  - You have OPENAI_API_KEY and ANTHROPIC_API_KEY in .env")
    print("  - Your microphone and speakers are working")
    input("\nPress Enter when ready to start...")
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        # Create survey
        print("\n" + "="*80)
        print("[1] CREATING SURVEY")
        print("="*80)
        with open("example_survey.json", "r") as f:
            survey_data = json.load(f)
        
        response = await client.post(f"{BASE_URL}/survey/create", json=survey_data)
        if response.status_code != 200:
            print(f"❌ Error: {response.text}")
            return
        
        survey = response.json()
        survey_id = survey["survey_id"]
        questions = survey["questions"]
        print(f"✅ Survey created: {survey_id}")
        print(f"   Questions: {len(questions)}")
        
        # Start session
        print("\n" + "="*80)
        print("[2] STARTING SESSION")
        print("="*80)
        response = await client.post(f"{BASE_URL}/survey/{survey_id}/session/start")
        if response.status_code != 200:
            print(f"❌ Error: {response.text}")
            return
        
        session_data = response.json()
        session_id = session_data["session_id"]
        
        print(f"✅ Session started")
        print(f"   Session ID: {session_id}")
        print(f"   Status: {session_data['status']}")
        
        # Voice conversation - REAL VOICE!
        print("\n" + "="*80)
        print("[3] VOICE CONVERSATION (OpenAI Realtime API)")
        print("="*80)
        print("\n🎤 Starting REAL voice survey...")
        print("   The AI will SPEAK to you and LISTEN to your voice")
        print("   Make sure your microphone and speakers are on!")
        print("\n")
        
        try:
            # Run voice survey and get transcript directly
            transcript = await run_voice_survey(questions)
            
            if not transcript or len(transcript) < 50:
                print("\n⚠️  Warning: Transcript seems too short")
                print(f"   Length: {len(transcript)} characters")
                use_anyway = input("\n   Continue anyway? (y/n): ")
                if use_anyway.lower() != 'y':
                    print("Aborting...")
                    return
        
        except KeyboardInterrupt:
            print("\n\n⚠️  Voice conversation interrupted!")
            print("The conversation was stopped before completion.")
            cont = input("\nDo you want to skip to results? (y/n): ")
            if cont.lower() != 'y':
                print("Test cancelled.")
                return
            else:
                print("\nSkipping to existing session results...\n")
                # Just get the existing session without completing it
                response = await client.get(f"{BASE_URL}/session/{session_id}")
                if response.status_code == 200:
                    session = response.json()
                    print(f"\nSession status: {session.get('status')}")
                    print("Test incomplete - session not evaluated.")
                return
            
        except Exception as e:
            print(f"\n❌ Error during voice conversation: {e}")
            print("\nPlease check:")
            print("  - OPENAI_API_KEY is set in .env")
            print("  - Your microphone/speakers are working")
            print("  - You have granted microphone permissions")
            import traceback
            traceback.print_exc()
            return
        
        # Complete session with transcript
        print("\n" + "="*80)
        print("[4] COMPLETING SESSION")
        print("="*80)
        print("📤 Sending transcript for evaluation...")
        
        response = await client.post(
            f"{BASE_URL}/session/{session_id}/complete",
            params={"transcript": transcript}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Session completed and evaluated!")
        else:
            print(f"❌ Error completing session: {response.text}")
            return
        
        # Get full results
        response = await client.get(f"{BASE_URL}/session/{session_id}")
        if response.status_code != 200:
            print(f"❌ Error: {response.text}")
            return
        
        session = response.json()
        
        print("\n" + "="*80)
        print("[5] RESULTS")
        print("="*80)
        
        if session.get("evaluation_score"):
            print(f"\n💰 Your Score: {session['evaluation_score']:.1f}/100")
            print(f"💰 Your Payment: ${session['payment_amount']:.2f}")
            print(f"\n📊 Evaluation Notes:")
            print(f"   {session.get('evaluation_notes', 'No notes')}")
        else:
            print("\n⚠️  Not evaluated yet")
            print(f"Status: {session.get('status')}")
        
        if session.get('transcript'):
            print(f"\n📝 Transcript Preview ({len(session['transcript'])} chars):")
            preview = session['transcript'][:300]
            print(f"   {preview}...")
        
        # Get insights
        print("\n" + "="*80)
        print("[6] GENERATING INSIGHTS")
        print("="*80)
        await asyncio.sleep(2)
        response = await client.get(f"{BASE_URL}/survey/{survey_id}/insights")
        if response.status_code == 200:
            insights = response.json()
            print(f"\n🔍 Survey Insights:")
            print(f"   Total Sessions: {insights['total_sessions']}")
            print(f"   Average Score: {insights['average_score']:.1f}/100")
            print(f"   Average Payment: ${insights['average_payment']:.2f}")
            print(f"\n📊 Key Insights:")
            print(f"   {insights['key_insights']}")
        
        print("\n" + "="*80)
        print("✅ COMPLETE FLOW TEST FINISHED!")
        print("="*80)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nCancelled")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

