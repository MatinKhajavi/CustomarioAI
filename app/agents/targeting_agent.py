"""
Targeting/Context Agent
Job: Prepare context for the voice agent based on survey config
Uses proper agent architecture with potential for tool use
"""
from app.models import Survey
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

