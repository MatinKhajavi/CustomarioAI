"""
Anthropic Agent implementation with tool calling and conversation state
Uses the official Anthropic SDK with proper agent patterns
"""
import os
from typing import List, Dict, Any, Callable, Optional
from anthropic import AsyncAnthropic
from anthropic.types import MessageParam, ToolParam


def get_anthropic_client() -> AsyncAnthropic:
    """Get configured Anthropic client"""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
    
    return AsyncAnthropic(api_key=api_key)


class Agent:
    """
    Anthropic Agent with tool calling capabilities
    This is a proper agent that can use tools and maintain conversation state
    """
    
    def __init__(
        self,
        name: str,
        system_prompt: str,
        tools: Optional[List[ToolParam]] = None,
        tool_functions: Optional[Dict[str, Callable]] = None,
        model: str = "claude-sonnet-4-5",
        max_tokens: int = 4096
    ):
        self.name = name
        self.system_prompt = system_prompt
        self.tools = tools or []
        self.tool_functions = tool_functions or {}
        self.model = model
        self.max_tokens = max_tokens
        self.client = get_anthropic_client()
        self.conversation_history: List[MessageParam] = []
    
    async def run(self, prompt: str, max_turns: int = 5) -> str:
        """
        Run the agent with a prompt, allowing for multi-turn tool use
        
        Args:
            prompt: User's input prompt
            max_turns: Maximum conversation turns (to prevent infinite loops)
        
        Returns:
            Final text response from agent
        """
        # Add user message to conversation
        self.conversation_history.append({
            "role": "user",
            "content": prompt
        })
        
        # Agent loop: can make multiple turns if using tools
        for turn in range(max_turns):
            # Create message with tools
            kwargs: Dict[str, Any] = {
                "model": self.model,
                "max_tokens": self.max_tokens,
                "system": self.system_prompt,
                "messages": self.conversation_history
            }
            
            if self.tools:
                kwargs["tools"] = self.tools
            
            response = await self.client.messages.create(**kwargs)
            
            # Add assistant response to history
            self.conversation_history.append({
                "role": "assistant",
                "content": response.content
            })
            
            # Check if agent wants to use tools
            tool_use_blocks = [block for block in response.content if block.type == "tool_use"]
            
            if not tool_use_blocks:
                # No more tools to use, extract text response
                text_blocks = [block.text for block in response.content if hasattr(block, 'text')]
                return "\n".join(text_blocks)
            
            # Execute tools and add results
            tool_results = []
            for tool_use in tool_use_blocks:
                tool_name = tool_use.name
                tool_input = tool_use.input
                
                if tool_name in self.tool_functions:
                    # Execute the tool
                    result = await self.tool_functions[tool_name](tool_input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_use.id,
                        "content": str(result)
                    })
            
            # Add tool results to conversation
            if tool_results:
                self.conversation_history.append({
                    "role": "user",
                    "content": tool_results
                })
            else:
                # No tool functions available but agent tried to use them
                break
        
        # Extract final response
        last_message = self.conversation_history[-1]
        if last_message["role"] == "assistant":
            text_blocks = [block.text for block in last_message["content"] if hasattr(block, 'text')]
            return "\n".join(text_blocks)
        
        return "Agent completed without final text response"
    
    def reset_conversation(self):
        """Clear conversation history"""
        self.conversation_history = []


async def simple_query(prompt: str, system_prompt: str = None, max_tokens: int = 4096) -> str:
    """
    Simple one-off query without agent state (for backwards compatibility)
    
    Args:
        prompt: User prompt
        system_prompt: System instructions
        max_tokens: Max tokens in response
    
    Returns:
        str: Claude's response
    """
    client = get_anthropic_client()
    
    messages = [{"role": "user", "content": prompt}]
    
    kwargs = {
        "model": "claude-sonnet-4-5",
        "max_tokens": max_tokens,
        "messages": messages
    }
    
    if system_prompt:
        kwargs["system"] = system_prompt
    
    response = await client.messages.create(**kwargs)
    
    return response.content[0].text

