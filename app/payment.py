"""
Payment processing module
Integrates with payment service to send payments to users
"""
import httpx
from datetime import datetime


async def process_payment(session_id: str, amount: float, user_info: dict = None) -> dict:
    """
    Process payment to user using external payment service
    
    Args:
        session_id: Session identifier
        amount: Payment amount in USD (from evaluation agent)
        user_info: User payment information (wallet address, email, etc.)
    
    Returns:
        dict: Payment result with status and transaction details
    """
    # Define amount to be paid (from evaluation agent)
    # amount_tobepaid = amount
    amount_tobepaid = 0.02
    
    print(f"💰 Processing payment for session {session_id}: ${amount_tobepaid:.2f}")
    
    # Payment endpoint
    payment_url = "https://send-payment-gclif6m6iq-uc.a.run.app/"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                payment_url,
                headers={"Content-Type": "application/json"},
                json={"amount": amount_tobepaid}
            )
            
            response.raise_for_status()
            
            # Parse response
            payment_data = response.json() if response.text else {}
            
            print(f"✅ Payment successful: ${amount_tobepaid:.2f}")
            
            return {
                "status": "success",
                "transaction_id": payment_data.get("transaction_id", f"txn_{session_id}_{int(datetime.now().timestamp())}"),
                "amount": amount_tobepaid,
                "timestamp": datetime.now().isoformat(),
                "message": f"Payment of ${amount_tobepaid:.2f} processed successfully",
                "payment_response": payment_data
            }
            
    except httpx.HTTPStatusError as e:
        print(f"❌ Payment failed with status {e.response.status_code}: {e.response.text}")
        return {
            "status": "failed",
            "transaction_id": None,
            "amount": amount_tobepaid,
            "timestamp": datetime.now().isoformat(),
            "message": f"Payment failed: {e.response.text}",
            "error": str(e)
        }
        
    except httpx.RequestError as e:
        print(f"❌ Payment request error: {str(e)}")
        return {
            "status": "failed",
            "transaction_id": None,
            "amount": amount_tobepaid,
            "timestamp": datetime.now().isoformat(),
            "message": f"Payment request failed: {str(e)}",
            "error": str(e)
        }
        
    except Exception as e:
        print(f"❌ Unexpected payment error: {str(e)}")
        return {
            "status": "failed",
            "transaction_id": None,
            "amount": amount_tobepaid,
            "timestamp": datetime.now().isoformat(),
            "message": f"Payment processing error: {str(e)}",
            "error": str(e)
        }

