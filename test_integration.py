"""
Simple test script to verify the backend integration works
Run this after starting the backend with: python run.py
"""
import asyncio
import sys
from app.models import Survey, PriceRange, Criteria
from app.agents.targeting_agent import generate_questions_and_criteria
from app.storage import storage


async def test_question_generation():
    """Test the targeting agent question generation"""
    print("\n" + "="*80)
    print("TEST 1: Question & Criteria Generation")
    print("="*80)
    
    try:
        questions, criteria = await generate_questions_and_criteria(
            survey_topic="Customer feedback on our new mobile app",
            success_criteria="Learn specific pain points and feature requests",
            price_range=PriceRange(min_amount=5.0, max_amount=20.0)
        )
        
        print("\n✓ Questions generated:")
        for i, q in enumerate(questions, 1):
            print(f"  {i}. {q}")
        
        print("\n✓ Criteria generated:")
        for c in criteria:
            print(f"  - {c.name} (weight: {c.weight}): {c.description}")
        
        print("\n✓ TEST PASSED: Question generation works!")
        return True
        
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_survey_creation():
    """Test survey creation and storage"""
    print("\n" + "="*80)
    print("TEST 2: Survey Creation")
    print("="*80)
    
    try:
        # Create a test survey
        survey = Survey(
            survey_id="test_survey_001",
            title="Test Survey",
            questions=["Question 1?", "Question 2?"],
            criteria=[
                Criteria(name="Quality", description="Response quality", weight=0.5),
                Criteria(name="Detail", description="Response detail", weight=0.5)
            ],
            price_range=PriceRange(min_amount=5.0, max_amount=15.0)
        )
        
        # Save it
        stored = storage.create_survey(survey)
        print(f"\n✓ Survey created: {stored.survey_id}")
        
        # Retrieve it
        retrieved = storage.get_survey("test_survey_001")
        if retrieved:
            print(f"✓ Survey retrieved: {retrieved.title}")
            print(f"✓ Has {len(retrieved.questions)} questions")
            print(f"✓ Has {len(retrieved.criteria)} criteria")
            print("\n✓ TEST PASSED: Survey storage works!")
            return True
        else:
            print("✗ TEST FAILED: Could not retrieve survey")
            return False
            
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_full_flow():
    """Test the complete flow"""
    print("\n" + "="*80)
    print("TEST 3: Complete Flow Simulation")
    print("="*80)
    
    try:
        # Step 1: Generate context
        print("\nStep 1: Generating questions and criteria...")
        questions, criteria = await generate_questions_and_criteria(
            survey_topic="User experience with our product",
            success_criteria="Understand usage patterns and improvement areas",
            price_range=PriceRange(min_amount=10.0, max_amount=30.0)
        )
        print(f"✓ Generated {len(questions)} questions and {len(criteria)} criteria")
        
        # Step 2: Create survey
        print("\nStep 2: Creating survey...")
        from datetime import datetime
        import uuid
        survey = Survey(
            survey_id=f"survey_{uuid.uuid4().hex[:8]}",
            title="User Experience Survey",
            questions=questions,
            criteria=criteria,
            price_range=PriceRange(min_amount=10.0, max_amount=30.0),
            created_at=datetime.now()
        )
        storage.create_survey(survey)
        print(f"✓ Survey created: {survey.survey_id}")
        
        print("\n✓ TEST PASSED: Complete flow works!")
        print("\nYou can now:")
        print("1. Start the backend: python run.py")
        print("2. Start the frontend: cd customario && npm run dev")
        print("3. Open http://localhost:5173")
        return True
        
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("CUSTOMARIO BACKEND INTEGRATION TESTS")
    print("="*80)
    print("\nThis will test the backend integration without starting the server.")
    print("Make sure you have:")
    print("  - ANTHROPIC_API_KEY in your .env file")
    print("  - pip install -r requirements.txt completed")
    print("\nStarting tests in 2 seconds...")
    await asyncio.sleep(2)
    
    results = []
    
    # Run tests
    results.append(await test_question_generation())
    results.append(await test_survey_creation())
    results.append(await test_full_flow())
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    passed = sum(results)
    total = len(results)
    print(f"\nPassed: {passed}/{total}")
    
    if passed == total:
        print("\n✓ All tests passed! Integration is working correctly.")
        print("\nNext steps:")
        print("  1. Terminal 1: python run.py")
        print("  2. Terminal 2: cd customario && npm run dev")
        print("  3. Open http://localhost:5173")
        return 0
    else:
        print("\n✗ Some tests failed. Please check the errors above.")
        return 1


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

