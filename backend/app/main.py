"""
FastAPI backend for CustomarioAI - Payment integration
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

# Import payment service
from app.payment_service import send_usdc_payment_sync

# Vapi configuration
VAPI_API_KEY = os.getenv("VAPI_API_KEY")
VAPI_ASSISTANT_ID = os.getenv("VAPI_ASSISTANT_ID")
VAPI_BASE_URL = "https://api.vapi.ai"

# Initialize FastAPI
app = FastAPI(
    title="CustomarioAI Payment API",
    description="USDC payment service for feedback sessions",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class PaymentRequest(BaseModel):
    amount: Optional[float] = None
    recipient_address: Optional[str] = None
    memo: Optional[str] = None


# Health check
@app.get("/")
async def root():
    return {
        "message": "CustomarioAI Payment API",
        "status": "healthy",
        "version": "1.0.0"
    }


# ============================================================================
# VAPI PROXY ENDPOINTS (to avoid CORS issues)
# ============================================================================

class VapiCallRequest(BaseModel):
    metadata: Optional[Dict[str, Any]] = None


@app.post("/vapi/call/start")
async def start_vapi_call(request: VapiCallRequest):
    """
    Proxy endpoint to start a Vapi call (avoids CORS issues)
    """
    if not VAPI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="VAPI_API_KEY not configured in backend .env"
        )
    if not VAPI_ASSISTANT_ID:
        raise HTTPException(
            status_code=500,
            detail="VAPI_ASSISTANT_ID not configured in backend .env"
        )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{VAPI_BASE_URL}/call",
                headers={
                    "Authorization": f"Bearer {VAPI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "assistantId": VAPI_ASSISTANT_ID,
                    "customer": {
                        "number": None,  # Web call, not phone
                    },
                    "metadata": request.metadata or {},
                },
                timeout=30.0
            )

            if not response.is_success:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": response.text}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", f"Vapi API error: {response.status_code}")
                )

            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to connect to Vapi API: {str(e)}"
        )


@app.post("/vapi/call/{call_id}/end")
async def end_vapi_call(call_id: str):
    """Proxy endpoint to end a Vapi call"""
    if not VAPI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="VAPI_API_KEY not configured"
        )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{VAPI_BASE_URL}/call/{call_id}/end",
                headers={
                    "Authorization": f"Bearer {VAPI_API_KEY}",
                    "Content-Type": "application/json",
                },
                timeout=30.0
            )

            if not response.is_success:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": response.text}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", f"Vapi API error: {response.status_code}")
                )

            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to connect to Vapi API: {str(e)}"
        )


# ============================================================================
# PAYMENT ENDPOINT
# ============================================================================

@app.post("/payment/send")
async def send_payment(request: PaymentRequest):
    """
    Send USDC payment after feedback session completes
    
    Uses hard-coded recipient address from PAYMENT_RECIPIENT_ADDRESS env var
    or the one provided in the request.
    """
    try:
        result = send_usdc_payment_sync(
            amount=request.amount,
            recipient_address=request.recipient_address,
            memo=request.memo
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Payment failed")
            )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Payment error: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


