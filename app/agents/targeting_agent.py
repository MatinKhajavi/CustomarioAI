"""
Targeting/Context Agent
Job: Prepare context for the voice agent based on survey config
Uses proper agent architecture with potential for tool use
"""
import json
from typing import List, Tuple
from app.models import Survey, Criteria, PriceRange
from app.agents.anthropic_client import Agent


async def generate_context(survey: Survey) -> str:
    """
    Generate context/briefing for the voice agent based on survey config
    Uses an actual agent that could be extended with tools
    """
    system_prompt = """You are an expert at creating briefings for AI agents conducting surveys.
You excel at:
- Creating natural conversational flows
- Understanding what makes good survey questions
- Providing actionable guidance for voice agents
- Keeping briefings concise and practical"""
    
    prompt = f"""Create a briefing for a voice AI agent that will conduct this feedback survey.

Survey Title: {survey.title}

Questions to ask:
{chr(10).join(f"{i+1}. {q}" for i, q in enumerate(survey.questions))}

Evaluation Criteria (how responses will be judged):
{chr(10).join(f"- {c.name}: {c.description} (weight: {c.weight})" for c in survey.criteria)}

Payment Range: ${survey.price_range.min_amount} - ${survey.price_range.max_amount}

Create a concise briefing that includes:
1. How to introduce the survey naturally
2. The questions to ask (in order, conversationally)
3. Tips for getting quality, detailed responses
4. How to handle short or vague answers
5. How to wrap up gracefully

Keep it under 300 words and actionable."""
    
    # Create targeting agent
    agent = Agent(
        name="TargetingAgent",
        system_prompt=system_prompt,
        max_tokens=2000
    )
    
    # Run agent
    result = await agent.run(prompt)
    
    return result


async def generate_questions_and_criteria(
    survey_topic: str,
    success_criteria: str,
    price_range: PriceRange
) -> Tuple[List[str], List[Criteria]]:
    """
    Generate survey questions and evaluation criteria from admin input
    Uses targeting agent to intelligently create the survey structure
    
    Args:
        survey_topic: What the survey is about
        success_criteria: What success looks like for this survey
        price_range: Payment range for quality assessment
        
    Returns:
        Tuple of (questions list, criteria list)
    """
    # Storage for generated content
    generated_content = {"questions": [], "criteria": []}
    
    # Define tool for submitting generated content
    async def submit_survey_structure(input_data: dict) -> str:
        """Tool for agent to submit generated questions and criteria"""
        generated_content["questions"] = input_data.get("questions", [])
        
        # Parse criteria
        criteria_data = input_data.get("criteria", [])
        generated_content["criteria"] = [
            Criteria(
                name=c.get("name", ""),
                description=c.get("description", ""),
                weight=float(c.get("weight", 0.3))
            )
            for c in criteria_data
        ]
        
        return f"Survey structure created: {len(generated_content['questions'])} questions, {len(generated_content['criteria'])} criteria"
    
    # Define the tool schema
    survey_tool = {
        "name": "submit_survey_structure",
        "description": "Submit the generated survey structure with questions and evaluation criteria",
        "input_schema": {
            "type": "object",
            "properties": {
                "questions": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of 3-5 specific, open-ended questions for the voice survey"
                },
                "criteria": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string", "description": "Criteria name (e.g., 'Completeness', 'Quality')"},
                            "description": {"type": "string", "description": "What to evaluate"},
                            "weight": {"type": "number", "description": "Weight in scoring (0.0-1.0, sum should be ~1.0)"}
                        },
                        "required": ["name", "description", "weight"]
                    },
                    "description": "List of 2-4 evaluation criteria with weights"
                }
            },
            "required": ["questions", "criteria"]
        }
    }
    
    system_prompt = f"""You are an expert survey designer who creates effective feedback surveys.

Your expertise:
- Crafting open-ended questions that elicit detailed responses
- Designing evaluation criteria that measure response quality
- Understanding what makes feedback valuable and actionable

Payment context: ${price_range.min_amount} - ${price_range.max_amount}
This helps you understand the quality bar for responses."""

    prompt = f"""Design a voice feedback survey based on this information:

Topic: {survey_topic}

Success Criteria: {success_criteria}

Create:
1. **Questions** (3-5 questions):
   - Open-ended and conversational
   - Designed for voice responses (not rating scales)
   - Encourage detailed, specific feedback
   - Flow naturally in conversation
   
2. **Evaluation Criteria** (2-4 criteria):
   - How to judge response quality
   - Each criterion needs: name, description, weight (0.0-1.0)
   - Weights should sum to approximately 1.0
   - Common criteria: Completeness, Quality/Depth, Clarity, Specificity

Consider the success criteria when designing both questions and evaluation rubric.

Use the submit_survey_structure tool to submit your design."""

    # Create agent with tool
    agent = Agent(
        name="SurveyDesigner",
        system_prompt=system_prompt,
        tools=[survey_tool],
        tool_functions={"submit_survey_structure": submit_survey_structure},
        max_tokens=3000
    )
    
    # Run agent
    await agent.run(prompt, max_turns=3)
    
    # Return generated content
    return generated_content["questions"], generated_content["criteria"]

