"""
Test the interactive widget flow without frontend
Simulates what happens when a user interacts with the embedded widget
"""
import asyncio
import httpx
from app.models import SurveyCreate, PriceRange, Criteria


async def test_interactive_flow():
    """
    Simulate the complete widget interaction flow:
    1. Company creates survey
    2. User clicks widget button
    3. Session starts (targeting agent runs)
    4. User has voice conversation
    5. User clicks "Done"
    6. Evaluation runs, payment shown
    7. Insights generated in background
    """
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        print("=" * 70)
        print("SIMULATING WIDGET INTERACTION FLOW")
        print("=" * 70)
        
        # ================================================================
        # STEP 1: Company creates survey (one-time setup)
        # ================================================================
        print("\n📋 STEP 1: Company creates survey")
        print("-" * 70)
        
        survey_data = SurveyCreate(
            title="Product Experience Feedback",
            questions=[
                "How would you rate your overall experience with our product?",
                "What features do you use most frequently?",
                "What improvements would you like to see?",
                "How likely are you to recommend our product?"
            ],
            criteria=[
                Criteria(
                    name="Completeness",
                    description="Did user provide thorough answers?",
                    weight=0.3
                ),
                Criteria(
                    name="Quality",
                    description="Is feedback specific and actionable?",
                    weight=0.4
                ),
                Criteria(
                    name="Clarity",
                    description="Are responses clear and well-articulated?",
                    weight=0.3
                )
            ],
            price_range=PriceRange(min_amount=5.0, max_amount=20.0)
        )
        
        response = await client.post(
            f"{base_url}/survey/create",
            json=survey_data.model_dump()
        )
        survey = response.json()
        survey_id = survey["survey_id"]
        print(f"✓ Survey created: {survey_id}")
        print(f"  Title: {survey['title']}")
        print(f"  Questions: {len(survey['questions'])}")
        print(f"  Payment range: ${survey['price_range']['min_amount']}-${survey['price_range']['max_amount']}")
        
        # ================================================================
        # STEP 2: User visits website and clicks widget button
        # ================================================================
        print("\n\n👤 STEP 2: User clicks feedback widget button")
        print("-" * 70)
        print("(Widget panel opens...)")
        
        # ================================================================
        # STEP 3: Start session (Phase 1)
        # ================================================================
        print("\n\n🚀 STEP 3: Initialize session")
        print("-" * 70)
        
        response = await client.post(f"{base_url}/survey/{survey_id}/session/start")
        
        # Debug: check response
        if response.status_code != 200:
            print(f"❌ Error: Status {response.status_code}")
            print(f"Response: {response.text}")
            return
        
        start_result = response.json()
        session_id = start_result["session_id"]
        
        print(f"✓ Session started: {session_id}")
        print(f"  Status: {start_result['status']}")
        print(f"  Room: {start_result['room_name']}")
        print(f"  LiveKit URL: {start_result['livekit_url']}")
        print(f"\n  Context for voice agent:")
        print(f"  {start_result['context'][:200]}...")
        
        # ================================================================
        # STEP 4: Voice conversation happens
        # ================================================================
        print("\n\n🎤 STEP 4: Voice conversation in progress")
        print("-" * 70)
        print("(User talks to voice agent via LiveKit...)")
        print("(Widget shows real-time transcript...)")
        
        # Simulate a realistic conversation transcript
        transcript = f"""
Agent: Hi there! Thank you for taking the time to share your feedback with us today. 
I have a few questions about your experience with our product. Ready to begin?

User: Yes, I'm ready!

Agent: Great! First question: How would you rate your overall experience with our product?

User: I'd give it a solid 8 out of 10. I've been using it for about 6 months now, 
and overall it's been really helpful. The interface is intuitive and it's made my 
workflow much more efficient. There are a few things that could be better, but 
overall I'm quite satisfied.

Agent: That's great to hear! What features do you use most frequently?

User: I mainly use the dashboard for analytics and the automated reporting feature. 
The reporting saves me probably 2-3 hours a week. I also use the collaboration 
tools quite a bit when working with my team. The real-time sync is fantastic.

Agent: Excellent! Now, what improvements would you like to see?

User: I'd love to see better mobile app support. Right now the mobile version 
is pretty limited. Also, it would be great if you could add more customization 
options for the dashboard widgets. And maybe some more integrations with other 
tools we use, like Slack and Notion.

Agent: Those are really helpful suggestions. Last question: How likely are you 
to recommend our product to a friend or colleague?

User: Very likely! I'd probably give it a 9 out of 10 on likelihood to recommend. 
I've actually already told a couple of colleagues about it. The value for the 
price is excellent, and it really does solve a real problem for me.

Agent: Wonderful! Thank you so much for your detailed feedback. We really appreciate 
your time and insights. Your feedback will help us make the product even better!

User: Happy to help! Thanks for listening.
"""
        
        print(f"  Sample transcript:\n{transcript[:300]}...")
        print("\n  (Conversation continues...)")
        
        # Simulate some time passing
        await asyncio.sleep(2)
        
        # ================================================================
        # STEP 5: User clicks "Done" button
        # ================================================================
        print("\n\n✅ STEP 5: User clicks 'Done' button")
        print("-" * 70)
        print("(Processing feedback...)")
        
        # ================================================================
        # STEP 6: Complete session (Phase 2)
        # ================================================================
        print("\n\n💰 STEP 6: Evaluating & processing payment")
        print("-" * 70)
        
        response = await client.post(
            f"{base_url}/session/{session_id}/complete",
            params={"transcript": transcript}
        )
        completion_result = response.json()
        
        # ================================================================
        # STEP 7: Show results to user
        # ================================================================
        print("\n\n🎉 RESULTS SHOWN TO USER:")
        print("=" * 70)
        print(f"  {completion_result['message']}")
        print(f"\n  Score: {completion_result['score']}/100")
        print(f"  Payment Amount: ${completion_result['payment_amount']:.2f}")
        print(f"  Transaction ID: {completion_result['transaction_id']}")
        print(f"  Payment Status: {completion_result['payment_status']}")
        print(f"\n  Feedback Quality:")
        print(f"  {completion_result['evaluation_notes']}")
        
        # ================================================================
        # STEP 8: Background insights for company
        # ================================================================
        print("\n\n📊 STEP 8: Background - Insights for company")
        print("-" * 70)
        print("(Insights agent running in background...)")
        
        # Wait a moment for background task
        await asyncio.sleep(3)
        
        # Get insights
        response = await client.get(f"{base_url}/survey/{survey_id}/insights")
        insights = response.json()
        
        print(f"\n  Total sessions: {insights['total_sessions']}")
        print(f"  Average score: {insights['average_score']:.1f}/100")
        print(f"  Average payment: ${insights['average_payment']:.2f}")
        print(f"\n  Key insights:")
        print(f"  {insights['key_insights'][:400]}...")
        
        # ================================================================
        # Summary
        # ================================================================
        print("\n\n" + "=" * 70)
        print("✓ WIDGET FLOW COMPLETE!")
        print("=" * 70)
        print("\nWhat happened:")
        print("  1. ✓ Survey created by company")
        print("  2. ✓ User clicked widget button")
        print("  3. ✓ Session started (targeting agent prepared context)")
        print("  4. ✓ Voice conversation conducted")
        print("  5. ✓ User clicked 'Done'")
        print("  6. ✓ Evaluation ran & payment processed")
        print("  7. ✓ Results shown to user immediately")
        print("  8. ✓ Insights generated for company (background)")
        
        print("\n" + "=" * 70)
        print("This is EXACTLY how the widget will work!")
        print("=" * 70)


async def test_multiple_sessions():
    """
    Test multiple sessions to see insights improve
    """
    base_url = "http://localhost:8000"
    
    print("\n\n" + "=" * 70)
    print("TESTING MULTIPLE SESSIONS")
    print("=" * 70)
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Get the survey we just created
        response = await client.get(f"{base_url}/surveys")
        surveys = response.json()
        
        if not surveys:
            print("No surveys found. Run the main test first.")
            return
        
        survey_id = surveys[0]["survey_id"]
        print(f"\nUsing survey: {survey_id}")
        
        # Create 2 more sessions
        transcripts = [
            "Agent: How's your experience?\nUser: Great! Love the features.\n...",
            "Agent: How's your experience?\nUser: Pretty good, needs mobile app though.\n..."
        ]
        
        for i, transcript in enumerate(transcripts, 1):
            print(f"\n  Creating session {i}...")
            
            # Start
            response = await client.post(f"{base_url}/survey/{survey_id}/session/start")
            result = response.json()
            session_id = result["session_id"]
            
            # Complete
            response = await client.post(
                f"{base_url}/session/{session_id}/complete",
                params={"transcript": transcript}
            )
            result = response.json()
            print(f"  ✓ Session {i} completed: ${result['payment_amount']:.2f}")
        
        # Get updated insights
        await asyncio.sleep(2)
        response = await client.get(f"{base_url}/survey/{survey_id}/insights")
        insights = response.json()
        
        print(f"\n📊 Updated Insights (after {insights['total_sessions']} sessions):")
        print(f"  Average score: {insights['average_score']:.1f}/100")
        print(f"  Average payment: ${insights['average_payment']:.2f}")


if __name__ == "__main__":
    print("\n⚠️  Make sure the FastAPI server is running!")
    print("Start it with: python run.py\n")
    
    try:
        # Run the main interactive flow test
        asyncio.run(test_interactive_flow())
        
        # Optionally run multiple sessions test
        print("\n\nRun multiple sessions test? (y/n): ", end="")
        # For automated testing, just run it
        asyncio.run(test_multiple_sessions())
        
    except httpx.ConnectError:
        print("\n❌ Error: Could not connect to server at http://localhost:8000")
        print("Make sure to start the server first with: python run.py")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

