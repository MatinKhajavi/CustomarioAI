"""
Example usage of the CustomarioAI API
"""
import asyncio
import httpx
from app.models import SurveyCreate, PriceRange, Criteria


async def main():
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient() as client:
        print("=== CustomarioAI Example Usage ===\n")
        
        # 1. Create a survey
        print("1. Creating survey...")
        survey_data = SurveyCreate(
            title="Product Experience Feedback",
            questions=[
                "How would you rate your overall experience with our product?",
                "What features do you use most frequently?",
                "What improvements would you like to see?",
                "How likely are you to recommend our product to others?"
            ],
            criteria=[
                Criteria(
                    name="Completeness",
                    description="Did the user answer all questions thoroughly?",
                    weight=0.3
                ),
                Criteria(
                    name="Quality",
                    description="Is the feedback specific and actionable?",
                    weight=0.4
                ),
                Criteria(
                    name="Clarity",
                    description="Are the responses clear and well-articulated?",
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
        print(f"   Created survey: {survey_id}")
        print(f"   Title: {survey['title']}\n")
        
        # 2. Start a session
        print("2. Starting feedback session...")
        response = await client.post(f"{base_url}/survey/{survey_id}/session/start")
        session = response.json()
        session_id = session["session_id"]
        print(f"   Session started: {session_id}")
        print(f"   Status: {session['status']}\n")
        
        # 3. Wait for session to complete (orchestrator runs in background)
        print("3. Waiting for session to complete...")
        print("   (The orchestrator is running all agents in the background)")
        
        max_attempts = 30
        for i in range(max_attempts):
            await asyncio.sleep(2)
            response = await client.get(f"{base_url}/session/{session_id}")
            session = response.json()
            
            print(f"   Attempt {i+1}/{max_attempts}: Status = {session['status']}")
            
            if session["status"] == "completed":
                print("   ✓ Session completed!\n")
                break
            elif session["status"] == "failed":
                print("   ✗ Session failed!\n")
                break
        
        # 4. Get session results
        print("4. Session Results:")
        print(f"   Score: {session.get('evaluation_score', 'N/A')}/100")
        print(f"   Payment: ${session.get('payment_amount', 0):.2f}")
        print(f"   Payment Status: {session.get('payment_status', 'N/A')}")
        print(f"\n   Evaluation Notes:")
        print(f"   {session.get('evaluation_notes', 'N/A')}\n")
        
        # 5. Get survey insights
        print("5. Getting survey insights...")
        response = await client.get(f"{base_url}/survey/{survey_id}/insights")
        insights = response.json()
        
        print(f"   Total Sessions: {insights['total_sessions']}")
        print(f"   Average Score: {insights['average_score']:.1f}/100")
        print(f"   Average Payment: ${insights['average_payment']:.2f}")
        print(f"\n   Key Insights:")
        print(f"   {insights['key_insights']}\n")
        
        print("=== Example Complete ===")


if __name__ == "__main__":
    print("Make sure the FastAPI server is running on http://localhost:8000")
    print("Start it with: python run.py\n")
    asyncio.run(main())

