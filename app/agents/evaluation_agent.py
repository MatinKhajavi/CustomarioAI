"""
Evaluation/Rubric Agent
Job: Evaluate transcript based on criteria and determine payment amount
Uses proper agent architecture with tool calling for structured evaluation
"""
import json
from typing import Dict, Any
from app.models import Survey
from app.agents.anthropic_client import Agent


async def evaluate_transcript(survey: Survey, transcript: str) -> tuple[float, str, float]:
    """
    Evaluate the transcript and return (score, notes, payment_amount)
    Uses an agent with a tool for structured evaluation
    
    Returns:
        tuple: (score 0-100, evaluation notes, payment amount)
    """
    
    # Define evaluation result storage
    evaluation_result = {"score": 0, "notes": "", "payment": survey.price_range.min_amount}
    
    # Define tool for submitting evaluation
    async def submit_evaluation(input_data: Dict[str, Any]) -> str:
        """Tool for agent to submit evaluation results"""
        evaluation_result["score"] = float(input_data.get("score", 0))
        evaluation_result["notes"] = input_data.get("notes", "")
        evaluation_result["payment"] = float(input_data.get("payment_amount", survey.price_range.min_amount))
        
        # Ensure payment is within range
        evaluation_result["payment"] = max(
            survey.price_range.min_amount,
            min(survey.price_range.max_amount, evaluation_result["payment"])
        )
        
        return f"Evaluation submitted: Score {evaluation_result['score']}/100, Payment ${evaluation_result['payment']:.2f}"
    
    # Define the tool schema
    evaluation_tool = {
        "name": "submit_evaluation",
        "description": "Submit the evaluation results with score, notes, and payment amount",
        "input_schema": {
            "type": "object",
            "properties": {
                "score": {
                    "type": "number",
                    "description": "Quality score from 0-100 based on the evaluation criteria"
                },
                "notes": {
                    "type": "string",
                    "description": "Explanation of the evaluation and score"
                },
                "payment_amount": {
                    "type": "number",
                    "description": f"Payment amount between {survey.price_range.min_amount} and {survey.price_range.max_amount}"
                }
            },
            "required": ["score", "notes", "payment_amount"]
        }
    }
    
    system_prompt = f"""You are an expert evaluator for survey responses. Be fair but rigorous.

Your job is to:
1. Evaluate the transcript based on the given criteria
2. Calculate a score from 0-100 (considering criterion weights)
3. Determine appropriate payment within the range
4. Use the submit_evaluation tool to record your assessment

Criteria for evaluation:
{chr(10).join(f"- {c.name} (weight {c.weight}): {c.description}" for c in survey.criteria)}

Payment range: ${survey.price_range.min_amount} - ${survey.price_range.max_amount}

Higher quality responses (detailed, specific, actionable) deserve higher scores and payments."""
    
    prompt = f"""Evaluate this feedback survey response.

Survey: {survey.title}

Expected Questions:
{chr(10).join(f"{i+1}. {q}" for i, q in enumerate(survey.questions))}

Transcript:
{transcript}

Analyze the transcript thoroughly, then use the submit_evaluation tool to record your assessment."""
    
    # Create evaluation agent with tool
    agent = Agent(
        name="EvaluationAgent",
        system_prompt=system_prompt,
        tools=[evaluation_tool],
        tool_functions={"submit_evaluation": submit_evaluation},
        max_tokens=2000
    )
    
    # Run agent
    await agent.run(prompt, max_turns=3)
    
    return evaluation_result["score"], evaluation_result["notes"], evaluation_result["payment"]

