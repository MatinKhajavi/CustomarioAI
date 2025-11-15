"""
Insights/Researcher Agent  
Job: Analyze all transcripts and scores to generate insights
Uses proper agent architecture with potential for tool use
"""
from typing import List, Dict, Any
from app.models import Session, Survey
from app.agents.anthropic_client import Agent


async def generate_insights(survey: Survey, sessions: List[Session]) -> str:
    """
    Generate insights from all sessions for a survey
    Uses an actual agent that could be extended with analysis tools
    """
    if not sessions:
        return "No sessions to analyze yet."
    
    # Prepare summary data
    completed_sessions = [s for s in sessions if s.transcript and s.evaluation_score is not None]
    
    if not completed_sessions:
        return "No completed sessions to analyze yet."
    
    avg_score = sum(s.evaluation_score for s in completed_sessions) / len(completed_sessions)
    avg_payment = sum(s.payment_amount for s in completed_sessions if s.payment_amount) / len(completed_sessions)
    
    # Build transcript summaries
    transcript_summaries = []
    for i, session in enumerate(completed_sessions[:10], 1):  # Limit to 10 most recent
        transcript_summaries.append(f"""
Session {i} (Score: {session.evaluation_score}/100, Payment: ${session.payment_amount}):
{session.transcript[:500]}...
Evaluation: {session.evaluation_notes}
""")
    
    system_prompt = """You are an expert research analyst specializing in qualitative feedback analysis.

You excel at:
- Identifying patterns and themes across responses
- Extracting actionable insights
- Assessing feedback quality
- Providing strategic recommendations
- Synthesizing complex data into clear narratives"""
    
    prompt = f"""Analyze this feedback survey data and generate strategic insights.

Survey: {survey.title}

Questions Asked:
{chr(10).join(f"{i+1}. {q}" for i, q in enumerate(survey.questions))}

Summary Statistics:
- Total completed sessions: {len(completed_sessions)}
- Average score: {avg_score:.1f}/100
- Average payment: ${avg_payment:.2f}

Sample Session Data:
{chr(10).join(transcript_summaries)}

Provide a comprehensive analysis covering:
1. Key themes and patterns across responses
2. Quality assessment of the feedback collected
3. Notable insights or surprises
4. Specific recommendations for:
   - Improving the product/service
   - Enhancing the survey itself
   - Areas to investigate further

Keep your analysis actionable, specific, and under 400 words."""
    
    # Create insights agent
    agent = Agent(
        name="InsightsAgent",
        system_prompt=system_prompt,
        max_tokens=2000
    )
    
    # Run agent
    result = await agent.run(prompt)
    
    return result

