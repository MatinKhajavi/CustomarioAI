# Agent Architecture - Using Anthropic SDK

## ✅ Now Using ACTUAL Agents

The system has been refactored to use **real agents** from the Anthropic SDK, not just API calls.

### What Changed

**BEFORE (Just API Calls):**
```python
# Simple message.create() - no agent state, no tools
response = await client.messages.create(messages=[...])
```

**AFTER (Real Agents):**
```python
# Proper agent with conversation state and tool calling
agent = Agent(
    name="EvaluationAgent",
    system_prompt="You are an expert evaluator...",
    tools=[evaluation_tool],
    tool_functions={"submit_evaluation": submit_evaluation}
)
result = await agent.run(prompt, max_turns=3)
```

## Agent Class Features

### 1. **Conversation State**
Agents maintain conversation history across turns:
```python
agent.conversation_history  # List of all messages
agent.reset_conversation()  # Clear history
```

### 2. **Tool Calling**
Agents can use tools to take actions:
```python
# Define a tool
tool = {
    "name": "submit_evaluation",
    "description": "Submit evaluation results",
    "input_schema": {
        "type": "object",
        "properties": {
            "score": {"type": "number"},
            "notes": {"type": "string"}
        }
    }
}

# Define tool function
async def submit_evaluation(input_data):
    return f"Score: {input_data['score']}"

# Agent can now call this tool
agent = Agent(
    tools=[tool],
    tool_functions={"submit_evaluation": submit_evaluation}
)
```

### 3. **Multi-Turn Reasoning**
Agents can take multiple turns to accomplish tasks:
```python
await agent.run(prompt, max_turns=5)  # Up to 5 agent turns
```

## The 4 Agents

### 1. Targeting Agent
**Purpose:** Prepare context for voice agent

**Architecture:**
- System: Expert at creating survey briefings
- Input: Survey config (questions, criteria, payment range)
- Output: Contextual briefing for voice agent
- Tools: None (pure reasoning)

**Example:**
```python
agent = Agent(
    name="TargetingAgent",
    system_prompt="Expert at creating briefings...",
    max_tokens=2000
)
result = await agent.run("Create briefing for...")
```

### 2. Evaluation Agent
**Purpose:** Score transcript and calculate payment

**Architecture:**
- System: Expert evaluator with criteria
- Input: Transcript + evaluation criteria
- Output: Score (0-100), notes, payment amount
- Tools: `submit_evaluation` - Structured way to record results

**Tool Usage:**
```python
# Agent analyzes transcript, then calls tool:
agent.submit_evaluation({
    "score": 85,
    "notes": "Excellent feedback...",
    "payment_amount": 15.50
})
```

**Why Tool?** Ensures structured output format and validates payment range.

### 3. Insights Agent
**Purpose:** Analyze all transcripts for patterns

**Architecture:**
- System: Expert research analyst
- Input: All session transcripts + scores
- Output: Strategic insights and recommendations
- Tools: None currently (could add: query_database, generate_chart)

**Future Tools:**
```python
# Could add tools like:
- calculate_sentiment(transcript)
- find_similar_patterns(sessions)
- generate_visualization(data)
```

### 4. Orchestrator Agent (Coordinator)
**Purpose:** Manage flow between agents

**Not an LLM agent** - this is a Python orchestrator that:
1. Calls agents in sequence
2. Passes data between them
3. Handles errors
4. Manages state transitions

## Tool Calling Pattern

### How It Works

1. **Agent receives prompt** with available tools
2. **Agent thinks** and decides to use a tool
3. **SDK executes** the tool function
4. **Result returned** to agent
5. **Agent continues** or finishes

### Example Flow

```python
# Turn 1: Agent analyzes transcript
Agent: "I need to evaluate this transcript..."
[thinks about criteria and quality]

# Turn 2: Agent uses tool
Agent: [calls submit_evaluation tool]
Tool Result: "Evaluation submitted: Score 85/100"

# Turn 3: Agent acknowledges
Agent: "Evaluation complete. The response scored 85/100..."
```

## Benefits of Agent Architecture

### 1. **Stateful Conversations**
Agents remember context across turns:
```python
agent.run("What's the score?")
# Agent remembers previous evaluation
```

### 2. **Tool Extension**
Easy to add new capabilities:
```python
# Add database query tool
db_tool = {
    "name": "query_past_surveys",
    "description": "Look up historical data"
}
agent.tools.append(db_tool)
```

### 3. **Reasoning Chains**
Agents can break down complex tasks:
```
1. Analyze transcript
2. Calculate weighted scores
3. Determine payment
4. Submit results
```

### 4. **Error Recovery**
Tools can return errors for agent to handle:
```python
return {
    "error": "Payment out of range",
    "suggestion": "Try amount between $5-20"
}
```

## Adding New Tools

### Example: Add Survey Lookup Tool

```python
# 1. Define the tool schema
survey_lookup_tool = {
    "name": "lookup_survey",
    "description": "Look up past surveys by ID",
    "input_schema": {
        "type": "object",
        "properties": {
            "survey_id": {
                "type": "string",
                "description": "The survey ID to look up"
            }
        },
        "required": ["survey_id"]
    }
}

# 2. Implement the function
async def lookup_survey(input_data: dict) -> str:
    survey_id = input_data["survey_id"]
    survey = storage.get_survey(survey_id)
    return json.dumps(survey.model_dump())

# 3. Give to agent
agent = Agent(
    name="InsightsAgent",
    tools=[survey_lookup_tool],
    tool_functions={"lookup_survey": lookup_survey}
)

# 4. Agent can now use it
await agent.run("Compare survey_123 to current trends")
# Agent: [calls lookup_survey("survey_123")]
# Agent: "Based on survey_123 data, I see..."
```

## Testing Agents

```bash
# Run the agent test
python test_agents.py
```

This will:
1. Test each agent individually
2. Show tool calling in action
3. Verify structured outputs

## Agent vs Simple Query

**Use Agent when:**
- Need multi-turn reasoning
- Want tool calling
- Require state management
- Complex task breakdown

**Use simple_query when:**
- One-shot question
- No tools needed
- Stateless operation
- Quick response

```python
# Simple query (no agent)
result = await simple_query("What is 2+2?")

# Agent (with tools and state)
agent = Agent(tools=[calculator_tool])
result = await agent.run("Calculate (12 + 8) * 3")
```

## Future Enhancements

### 1. Add More Tools to Evaluation Agent
```python
- validate_payment_method(user_id)
- check_duplicate_session(user_id)
- fraud_detection(transcript)
```

### 2. Make Insights Agent More Powerful
```python
- query_competitor_data()
- generate_visualization(data)
- sentiment_analysis(transcript)
- trend_detection(sessions)
```

### 3. Add Agent-to-Agent Communication
```python
evaluation_agent.consult(insights_agent, "Is this score typical?")
```

### 4. Add Memory Systems
```python
agent = Agent(
    memory=VectorStore(),  # Remember past conversations
    tools=[...]
)
```

## Key Takeaways

✅ **Real Agents** - Not just API calls  
✅ **Tool Calling** - Agents can take actions  
✅ **State Management** - Conversation history maintained  
✅ **Multi-Turn** - Complex reasoning chains  
✅ **Extensible** - Easy to add new tools  
✅ **Structured Output** - Tools enforce formats  

This is a **proper agent architecture** using Anthropic's SDK, not just message passing!

