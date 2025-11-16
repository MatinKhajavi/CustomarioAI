# Payment Integration 💰

## Overview

The payment system is fully integrated and automatically pays users based on the quality of their survey responses. The payment amount is determined by the **Evaluation Agent** based on how well they answered the questions.

## Payment Flow

```
1. User completes voice survey
   │
   ├─> Transcript sent to backend
   │
2. Evaluation Agent analyzes transcript
   │
   ├─> Scores response (0-100)
   ├─> Evaluates against criteria
   └─> Determines payment amount ← 💰 amount_tobepaid
   │
3. Payment processed automatically
   │
   └─> POST https://send-payment-gclif6m6iq-uc.a.run.app/
       Body: {"amount": <amount_tobepaid>}
   │
4. User sees confirmation
   └─> "Thank you! You've earned $X.XX"
```

## How Payment Amount is Determined

### 1. Survey Configuration (Admin)

When creating a survey, the admin sets a price range:

```json
{
  "price_range": {
    "min_amount": 0.50,   // Minimum payment
    "max_amount": 5.00    // Maximum payment
  },
  "criteria": [
    {
      "name": "Response Depth",
      "weight": 0.4,
      "description": "Detailed and thoughtful answers"
    },
    {
      "name": "Relevance",
      "weight": 0.3,
      "description": "Stayed on topic"
    },
    {
      "name": "Actionability",
      "weight": 0.3,
      "description": "Provided actionable insights"
    }
  ]
}
```

### 2. Evaluation Agent Scoring

The Evaluation Agent (`app/agents/evaluation_agent.py`) analyzes the transcript:

```python
# Evaluates based on:
# - Did they answer all questions?
# - How detailed were their responses?
# - Did they meet the evaluation criteria?
# - Were answers relevant and actionable?

score, notes, amount_tobepaid = await evaluate_transcript(survey, transcript)

# Example results:
# - Excellent response: score=95, amount=$4.75
# - Good response: score=75, amount=$3.00
# - Basic response: score=50, amount=$1.50
# - Poor response: score=30, amount=$0.50 (minimum)
```

### 3. Payment Variable

The **`amount_tobepaid`** variable is defined in two places:

#### In `app/payment.py`:
```python
async def process_payment(session_id: str, amount: float, user_info: dict = None):
    # Define amount to be paid (from evaluation agent)
    amount_tobepaid = amount  # ← Received from evaluation
    
    # Send payment
    response = await client.post(
        "https://send-payment-gclif6m6iq-uc.a.run.app/",
        json={"amount": amount_tobepaid}
    )
```

#### In `app/orchestrator.py`:
```python
# Step 1: Evaluation determines payment
score, notes, payment_amount = await evaluate_transcript(survey, transcript)

# Define amount_tobepaid from evaluation
amount_tobepaid = payment_amount  # ← From AI evaluation

# Step 2: Process payment
payment_result = await process_payment(session_id, amount_tobepaid)
```

## Payment Endpoint

### Request
```bash
curl -X POST https://send-payment-gclif6m6iq-uc.a.run.app/ \
  -H "Content-Type: application/json" \
  -d '{"amount": 2.50}'
```

### Response (Expected)
```json
{
  "transaction_id": "txn_abc123...",
  "status": "success",
  "amount": 2.50
}
```

## Error Handling

The payment system gracefully handles failures:

```python
# If payment succeeds:
message = "Thank you! You've earned $2.50"

# If payment fails:
message = "Thank you! Payment of $2.50 is being processed."
# (Session still marked as completed, payment can be retried)
```

### Payment Statuses

- **`success`** - Payment sent successfully ✅
- **`failed`** - Payment failed, needs retry ❌

Failed payments are logged with error details and can be retried manually or automatically.

## Code Locations

### Main Files

1. **`app/payment.py`** - Payment processing logic
   - Defines `amount_tobepaid`
   - Calls payment endpoint
   - Handles success/failure

2. **`app/orchestrator.py`** - Orchestrates the flow
   - Gets `amount_tobepaid` from evaluation
   - Triggers payment processing
   - Returns results to user

3. **`app/agents/evaluation_agent.py`** - Determines payment
   - Analyzes transcript quality
   - Returns `(score, notes, amount_tobepaid)`

## Testing Payment Integration

### 1. Create a Survey with Price Range
```bash
POST /survey/create
{
  "title": "Product Feedback Survey",
  "questions": ["What do you think?", "How can we improve?"],
  "criteria": [...],
  "price_range": {
    "min_amount": 1.00,
    "max_amount": 5.00
  }
}
```

### 2. Complete a Session
```bash
# User completes voice survey via frontend
# Transcript is automatically submitted

POST /session/{session_id}/complete
{
  "transcript": "User: I really like... Agent: Thank you..."
}
```

### 3. Check Payment Result
```bash
GET /session/{session_id}

# Response includes:
{
  "evaluation_score": 85,
  "payment_amount": 4.25,  # ← amount_tobepaid
  "payment_status": "success",
  "transaction_id": "txn_...",
  "message": "Thank you! You've earned $4.25"
}
```

## Payment Configuration

### Environment Variables (Optional)

If you need to configure the payment endpoint:

```bash
# .env
PAYMENT_ENDPOINT=https://send-payment-gclif6m6iq-uc.a.run.app/
PAYMENT_TIMEOUT=30  # seconds
```

Update in `app/payment.py`:
```python
payment_url = os.getenv("PAYMENT_ENDPOINT", "https://send-payment-gclif6m6iq-uc.a.run.app/")
```

## Monitoring Payments

### View Payment Logs

Backend logs show payment processing:

```
💰 Processing payment for session session_abc123: $3.50
✅ Payment successful: $3.50
```

Or if failed:
```
💰 Processing payment for session session_abc123: $3.50
❌ Payment failed with status 500: Internal server error
```

### Query Payment Status

```bash
GET /session/{session_id}

# Check payment_status and transaction_id
```

### Retry Failed Payments

You can add a retry endpoint:

```python
@app.post("/session/{session_id}/retry-payment")
async def retry_payment(session_id: str):
    session = storage.get_session(session_id)
    if session.payment_status != "success":
        result = await process_payment(session_id, session.payment_amount)
        storage.update_session(session_id, {"payment_status": result["status"]})
        return result
    return {"message": "Payment already successful"}
```

## Security Notes

- ✅ Payment amount is determined by **AI evaluation** (not user-controlled)
- ✅ Amount is **validated** against min/max range
- ✅ Payment endpoint is called from **backend only** (not frontend)
- ✅ All payment attempts are **logged**
- ✅ Failed payments are **tracked** and can be retried

## Example Flow

### Scenario: User gives excellent feedback

1. **Survey Config:**
   - Min: $0.50, Max: $5.00
   - Questions about product features

2. **User Answers:**
   - Provides detailed, thoughtful responses
   - Covers all questions thoroughly
   - Offers actionable suggestions

3. **Evaluation:**
   - Score: 92/100
   - Payment: $4.60 ← **amount_tobepaid**

4. **Payment:**
   ```bash
   POST https://send-payment-gclif6m6iq-uc.a.run.app/
   {"amount": 4.60}
   ```

5. **User Sees:**
   > "Thank you! You've earned $4.60"

## Summary

- ✅ **amount_tobepaid** is defined and used correctly
- ✅ Payment endpoint integrated: `https://send-payment-gclif6m6iq-uc.a.run.app/`
- ✅ Amount comes from **Evaluation Agent** (AI-determined)
- ✅ Error handling for failed payments
- ✅ Full logging and monitoring
- ✅ Ready to use! 🚀

