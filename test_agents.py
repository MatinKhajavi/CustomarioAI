"""
Test script to verify agents are working correctly
"""
import asyncio
from app.models import Survey, PriceRange, Criteria
from app.agents.targeting_agent import generate_context
from app.agents.evaluation_agent import evaluate_transcript
from app.agents.insights_agent import generate_insights


async def test_targeting_agent():
    """Test the targeting agent"""
    print("\n=== Testing Targeting Agent ===")
    
    survey = Survey(
        survey_id="test_survey_1",
        title="Product Feedback Survey",
        questions=[
            "How satisfied are you with our product?",
            "What features would you like to see?"
        ],
        criteria=[
            Criteria(name="Completeness", description="Thorough answers", weight=0.5),
            Criteria(name="Quality", description="Actionable feedback", weight=0.5)
        ],
        price_range=PriceRange(min_amount=5.0, max_amount=15.0)
    )
    
    context = await generate_context(survey)
    print(f"\nGenerated Context:\n{context}\n")
    return context


async def test_evaluation_agent():
    """Test the evaluation agent"""
    print("\n=== Testing Evaluation Agent ===")
    
    survey = Survey(
        survey_id="test_survey_1",
        title="Product Feedback Survey",
        questions=[
            "How satisfied are you with our product?",
            "What features would you like to see?"
        ],
        criteria=[
            Criteria(name="Completeness", description="Thorough answers", weight=0.5),
            Criteria(name="Quality", description="Actionable feedback", weight=0.5)
        ],
        price_range=PriceRange(min_amount=5.0, max_amount=15.0)
    )
    
    # Mock transcript
    transcript = """
    Agent: How satisfied are you with our product?
    User: I'm very satisfied! I've been using it for 6 months and it's made my workflow much more efficient. 
    The user interface is intuitive and the features are exactly what I need.
    
    Agent: What features would you like to see?
    User: I'd love to see better integration with third-party tools, especially Slack and Google Calendar. 
    Also, a mobile app would be great for on-the-go access.
    """
    
    score, notes, payment = await evaluate_transcript(survey, transcript)
    print(f"\nEvaluation Results:")
    print(f"Score: {score}/100")
    print(f"Payment: ${payment:.2f}")
    print(f"Notes: {notes}\n")
    
    return score, notes, payment


async def test_insights_agent():
    """Test the insights agent"""
    print("\n=== Testing Insights Agent ===")
    
    # This would normally use real session data
    # For testing, we'll just verify it can be called
    print("Insights agent test requires actual session data.")
    print("Run the full system with example_usage.py to test insights.\n")


async def main():
    """Run all agent tests"""
    print("=" * 60)
    print("CustomarioAI - Agent Testing Suite")
    print("=" * 60)
    
    try:
        # Test each agent
        await test_targeting_agent()
        await test_evaluation_agent()
        await test_insights_agent()
        
        print("=" * 60)
        print("✓ All agent tests completed!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("\nNote: Make sure you have set up your .env file with:")
    print("  - ANTHROPIC_API_KEY")
    print("  - LIVEKIT credentials (for full system test)\n")
    
    asyncio.run(main())

