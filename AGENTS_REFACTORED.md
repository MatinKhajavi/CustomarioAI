# ✅ Agents Refactored - Now Using Anthropic SDK Properly

## What You Asked For

> "I want actual agents not just query calls"

**Done!** ✅ The system now uses **real agents** from the Anthropic SDK with:
- Tool calling capabilities
- Conversation state management
- Multi-turn reasoning
- Structured outputs via tools

## What Changed

### Before (Simple API Calls)

```python
# Just making API calls - no agent behavior
async def evaluate_transcript(survey, transcript):
    response = await client.messages.create(
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text
```

**Problems:**
- ❌ No conversation state
- ❌ No tool calling
- ❌ Just one-shot prompts
- ❌ Parsing JSON from text responses

### After (Real Agents)

```python
# Actual agent with tools and state
async def evaluate_transcript(survey, transcript):
    # Define tool for structured output
    evaluation_tool = {
        "name": "submit_evaluation",
        "description": "Submit evaluation results",
        "input_schema": {...}
    }
    
    # Create agent with tool
    agent = Agent(
        name="EvaluationAgent",
        system_prompt="Expert evaluator...",
        tools=[evaluation_tool],
        tool_functions={"submit_evaluation": submit_evaluation}
    )
    
    # Agent can call tool during reasoning
    await agent.run(prompt, max_turns=3)
```

**Benefits:**
- ✅ Conversation state maintained
- ✅ Tool calling for structured outputs
- ✅ Multi-turn reasoning
- ✅ Validated, structured responses

## The Agent Class

Located in `app/agents/anthropic_client.py`:

```python
class Agent:
    """
    Anthropic Agent with tool calling capabilities
    """
    def __init__(
        self,
        name: str,
        system_prompt: str,
        tools: Optional[List[ToolParam]] = None,
        tool_functions: Optional[Dict[str, Callable]] = None,
    ):
        self.conversation_history = []  # Maintains state
        self.tools = tools  # Available tools
        self.tool_functions = tool_functions  # Tool implementations
    
    async def run(self, prompt: str, max_turns: int = 5):
        """Run agent with multi-turn capability"""
        # Agent loop: can make multiple turns
        # Can call tools and reason about results
        # Maintains conversation history
```

## Agent Examples

### 1. Targeting Agent (No Tools)

```python
agent = Agent(
    name="TargetingAgent",
    system_prompt="Expert at creating briefings...",
    max_tokens=2000
)

result = await agent.run("Create briefing for survey...")
```

**Pure reasoning** - analyzes survey config, creates contextual briefing.

### 2. Evaluation Agent (With Tool)

```python
# Define the tool
evaluation_tool = {
    "name": "submit_evaluation",
    "description": "Submit structured evaluation",
    "input_schema": {
        "type": "object",
        "properties": {
            "score": {"type": "number"},
            "notes": {"type": "string"},
            "payment_amount": {"type": "number"}
        }
    }
}

# Agent uses tool for structured output
agent = Agent(
    name="EvaluationAgent",
    tools=[evaluation_tool],
    tool_functions={"submit_evaluation": submit_evaluation}
)

await agent.run("Evaluate this transcript...")

# Agent will:
# 1. Analyze transcript
# 2. Calculate score
# 3. Call submit_evaluation tool
# 4. Tool validates and stores result
```

**Benefits:**
- Structured outputs (no JSON parsing!)
- Validation built-in (payment range check)
- Explicit tool use (agent chooses when to submit)

### 3. Insights Agent (Extensible)

```python
agent = Agent(
    name="InsightsAgent",
    system_prompt="Expert research analyst...",
    max_tokens=2000
)

result = await agent.run("Analyze all sessions...")
```

**Could easily add tools:**
```python
# Future enhancements:
tools = [
    query_database_tool,
    generate_chart_tool,
    sentiment_analysis_tool
]
```

## Tool Calling in Action

### Example Flow

```
Turn 1: Agent receives transcript
  Agent: "Let me analyze this response..."
  [Agent thinks about criteria and quality]

Turn 2: Agent calls tool
  Agent: [Calls submit_evaluation tool]
  {
    "score": 85,
    "notes": "Excellent feedback with specific details",
    "payment_amount": 15.50
  }
  Tool Result: "Evaluation submitted: Score 85/100, Payment $15.50"

Turn 3: Agent acknowledges
  Agent: "Evaluation complete. This response scored 85/100 
         due to its detailed, specific feedback..."
```

## Testing the Agents

```bash
# Start server
python run.py

# Run widget flow test (tests all agents)
python test_widget_flow.py
```

You'll see:
- Targeting Agent preparing context
- Evaluation Agent calling `submit_evaluation` tool
- Insights Agent analyzing patterns
- All with proper agent behavior

## Adding New Tools

Super easy! Example - add database lookup:

```python
# 1. Define tool schema
db_tool = {
    "name": "lookup_past_surveys",
    "description": "Query historical survey data",
    "input_schema": {
        "type": "object",
        "properties": {
            "timeframe": {"type": "string"}
        }
    }
}

# 2. Implement function
async def lookup_past_surveys(input_data):
    timeframe = input_data["timeframe"]
    surveys = db.query(timeframe)
    return json.dumps(surveys)

# 3. Give to agent
agent = Agent(
    name="InsightsAgent",
    tools=[db_tool],
    tool_functions={"lookup_past_surveys": lookup_past_surveys}
)

# Agent can now use it!
await agent.run("Compare this month to last month")
# Agent: [calls lookup_past_surveys("last_month")]
# Agent: "Based on last month's data, I see..."
```

## File Structure

```
app/agents/
├── anthropic_client.py       # Agent class with tool calling
├── targeting_agent.py         # Uses Agent (no tools)
├── evaluation_agent.py        # Uses Agent + submit_evaluation tool
└── insights_agent.py          # Uses Agent (extensible)
```

## Key Differences

### Simple API Call:
```python
response = await client.messages.create(...)
# One-shot, no state, no tools
```

### Agent:
```python
agent = Agent(tools=[...])
result = await agent.run(prompt, max_turns=5)
# Multi-turn, stateful, tool calling
```

## Documentation

- **`AGENT_ARCHITECTURE.md`** - Detailed explanation of agent system
- **`README.md`** - Updated with agent details
- **`test_widget_flow.py`** - Tests agents in action

## What This Enables

### Now:
- ✅ Structured outputs via tools
- ✅ Multi-turn reasoning
- ✅ Conversation state
- ✅ Tool validation

### Future:
- 🔧 Add more tools to each agent
- 🔧 Agent-to-agent communication
- 🔧 Memory systems
- 🔧 Complex reasoning chains

## Summary

**You now have REAL agents** using the Anthropic SDK properly:

✅ **Targeting Agent** - Prepares context (pure reasoning)
✅ **Evaluation Agent** - Scores + uses tool for structured output
✅ **Insights Agent** - Analyzes patterns (extensible with tools)
✅ **All agents** - Maintain state, can use tools, multi-turn reasoning

This is a **proper agent architecture**, not just API wrappers! 🚀

