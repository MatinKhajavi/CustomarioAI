"""
USDC payment service using Claude AI and Locus MCP
"""
import asyncio
import os
from dotenv import load_dotenv
from typing import Optional, Dict, Any

load_dotenv()

# Hard-coded payment configuration
# Set PAYMENT_RECIPIENT_ADDRESS in .env file to configure the default recipient
PAYMENT_CONFIG = {
    "recipient_address": os.getenv("PAYMENT_RECIPIENT_ADDRESS", ""),  # Wallet address to send payment to
    "amount": float(os.getenv("PAYMENT_AMOUNT", "10.00")),  # Default payment amount in USDC (if not provided)
    "memo": "Feedback session payment",
}

async def send_usdc_payment(
    amount: Optional[float] = None,
    recipient_address: Optional[str] = None,
    memo: Optional[str] = None
) -> Dict[str, Any]:
    """
    Send USDC payment using Claude AI and Locus MCP
    
    Args:
        amount: Amount in USDC (uses config default if not provided)
        recipient_address: Recipient wallet address (uses config default if not provided)
        memo: Payment memo (uses config default if not provided)
    
    Returns:
        Dict with payment status and transaction details
    """
    try:
        from langchain_mcp_m2m import MCPClientCredentials
        from langchain_anthropic import ChatAnthropic
        from langgraph.prebuilt import create_react_agent
    except ImportError:
        return {
            "success": False,
            "error": "Required packages not installed. Install: pip install langchain-mcp-m2m langchain-anthropic langgraph"
        }

    # Use provided values or fall back to config
    payment_amount = amount or PAYMENT_CONFIG["amount"]
    recipient = recipient_address or PAYMENT_CONFIG["recipient_address"]
    payment_memo = memo or PAYMENT_CONFIG["memo"]

    # Validate required environment variables
    locus_client_id = os.getenv("PERSON3_CLIENT_ID")
    locus_client_secret = os.getenv("PERSON3_CLIENT_SECRET")
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
    sender_address = os.getenv("PERSON3_ADDRESS")

    if not all([locus_client_id, locus_client_secret, anthropic_api_key, sender_address]):
        return {
            "success": False,
            "error": "Missing required environment variables. Need: PERSON3_CLIENT_ID, PERSON3_CLIENT_SECRET, ANTHROPIC_API_KEY, PERSON3_ADDRESS"
        }

    if not recipient:
        return {
            "success": False,
            "error": "Recipient address not configured. Set PAYMENT_RECIPIENT_ADDRESS in .env or pass recipient_address parameter"
        }

    try:
        # 1. Create MCP client
        client = MCPClientCredentials({
            "locus": {
                "url": "https://mcp.paywithlocus.com/mcp",
                "transport": "streamable_http",
                "auth": {
                    "client_id": locus_client_id,
                    "client_secret": locus_client_secret
                }
            }
        })

        # 2. Initialize and load tools
        await client.initialize()
        tools = await client.get_tools()

        # 3. Create Claude agent
        llm = ChatAnthropic(
            model="claude-sonnet-4-20250514",
            api_key=anthropic_api_key
        )
        agent = create_react_agent(llm, tools)

        # 4. Send payment via AI agent
        query = f"""
        Please send {payment_amount} USDC to {recipient} with memo "{payment_memo}".
        Please confirm the transaction was successful and provide the transaction hash.
        """

        result = await agent.ainvoke({
            "messages": [{"role": "user", "content": query}]
        })

        # Extract response
        messages = result.get("messages", [])
        response_text = ""
        if messages:
            final_message = messages[-1]
            response_text = final_message.content if hasattr(final_message, 'content') else str(final_message)

        return {
            "success": True,
            "amount": payment_amount,
            "recipient": recipient,
            "memo": payment_memo,
            "response": response_text,
            "transaction_details": result
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "amount": payment_amount,
            "recipient": recipient
        }


def send_usdc_payment_sync(
    amount: Optional[float] = None,
    recipient_address: Optional[str] = None,
    memo: Optional[str] = None
) -> Dict[str, Any]:
    """
    Synchronous wrapper for send_usdc_payment
    """
    return asyncio.run(send_usdc_payment(amount, recipient_address, memo))

