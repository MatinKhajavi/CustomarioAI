# USDC Payment Setup

This guide explains how to set up automatic USDC payments when feedback sessions complete.

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
source venv/bin/activate  # or activate your virtual environment
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the `backend` directory with:

```env
# Locus MCP Credentials (Person 3 - the sender)
PERSON3_CLIENT_ID=your_locus_client_id
PERSON3_CLIENT_SECRET=your_locus_client_secret
PERSON3_ADDRESS=your_wallet_address

# Anthropic API Key (for Claude AI agent)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Payment Configuration (hard-coded defaults)
PAYMENT_RECIPIENT_ADDRESS=recipient_wallet_address_here
PAYMENT_AMOUNT=10.00  # Default amount if not provided (optional)
```

### 3. Start Backend Server

```bash
cd backend
source venv/bin/activate
python -m app.main
# Or use uvicorn directly:
uvicorn app.main:app --reload --port 8000
```

## How It Works

1. **When feedback session ends:**

   - Frontend calculates earnings based on session duration
   - Frontend calls `/payment/send` endpoint with the amount
   - Backend uses Claude AI + Locus MCP to send USDC payment

2. **Payment Process:**

   - Backend creates a Claude AI agent with Locus MCP tools
   - Agent sends USDC payment to the configured recipient address
   - Payment amount is the calculated earnings from the session
   - Returns transaction details

3. **Hard-coded Configuration:**
   - Recipient address: Set via `PAYMENT_RECIPIENT_ADDRESS` in `.env`
   - Amount: Uses calculated earnings from session (or `PAYMENT_AMOUNT` if provided)
   - Memo: Includes session duration info

## Frontend Configuration

Make sure your frontend `.env` has:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Testing

1. Start backend server: `uvicorn app.main:app --reload --port 8000`
2. Start frontend: `cd customario && npm run dev`
3. Complete a feedback session
4. Check backend logs for payment transaction details
5. Check browser console for payment status

## Troubleshooting

- **"Missing required environment variables"**: Check that all Locus and Anthropic credentials are set
- **"Recipient address not configured"**: Set `PAYMENT_RECIPIENT_ADDRESS` in backend `.env`
- **Payment fails**: Check backend logs for detailed error messages
- **CORS errors**: Make sure backend CORS is configured to allow frontend origin

