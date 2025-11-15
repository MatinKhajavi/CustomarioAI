from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
import os

app = Flask(__name__)
CORS(app)

# Directory to store call logs
LOGS_DIR = "call_logs"
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)


@app.route('/webhook/call-complete', methods=['POST'])
def handle_call_complete():
    """
    Webhook endpoint for Vapi call completion

    Expected data from Vapi:
    - call object with details about the call
    - transcript with conversation history
    - duration, cost, etc.
    """
    try:
        data = request.json
        timestamp = datetime.now().isoformat()

        # Extract key information
        call_id = data.get('call', {}).get('id', 'unknown')
        status = data.get('call', {}).get('status', 'unknown')
        duration = data.get('call', {}).get('duration', 0)

        # Get messages/transcript
        messages = data.get('messages', [])
        transcript = data.get('transcript', '')

        # Log the call data
        log_data = {
            'timestamp': timestamp,
            'call_id': call_id,
            'status': status,
            'duration': duration,
            'messages': messages,
            'transcript': transcript,
            'full_data': data
        }

        # Save to file
        log_filename = f"{LOGS_DIR}/call_{call_id}_{timestamp.replace(':', '-')}.json"
        with open(log_filename, 'w') as f:
            json.dump(log_data, f, indent=2)

        print(f"\n{'='*60}")
        print(f"Call Completed: {call_id}")
        print(f"Status: {status}")
        print(f"Duration: {duration} seconds")
        print(f"Messages: {len(messages)}")
        print(f"Saved to: {log_filename}")
        print(f"{'='*60}\n")

        # TODO: Add your custom logic here
        # - Save to database
        # - Send email notifications
        # - Trigger follow-up actions
        # - Analyze sentiment
        # - etc.

        return jsonify({
            'success': True,
            'message': 'Call data received and processed',
            'call_id': call_id
        }), 200

    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/webhook/call-started', methods=['POST'])
def handle_call_started():
    """Webhook endpoint for when a call starts"""
    try:
        data = request.json
        call_id = data.get('call', {}).get('id', 'unknown')

        print(f"\n{'='*60}")
        print(f"Call Started: {call_id}")
        print(f"{'='*60}\n")

        return jsonify({
            'success': True,
            'message': 'Call start acknowledged',
            'call_id': call_id
        }), 200

    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    }), 200


@app.route('/calls/list', methods=['GET'])
def list_calls():
    """List all stored call logs"""
    try:
        files = os.listdir(LOGS_DIR)
        call_files = [f for f in files if f.startswith('call_') and f.endswith('.json')]

        calls = []
        for filename in sorted(call_files, reverse=True):
            filepath = os.path.join(LOGS_DIR, filename)
            with open(filepath, 'r') as f:
                call_data = json.load(f)
                calls.append({
                    'filename': filename,
                    'timestamp': call_data.get('timestamp'),
                    'call_id': call_data.get('call_id'),
                    'status': call_data.get('status'),
                    'duration': call_data.get('duration')
                })

        return jsonify({
            'success': True,
            'count': len(calls),
            'calls': calls
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/calls/<call_id>', methods=['GET'])
def get_call(call_id):
    """Get details of a specific call"""
    try:
        files = os.listdir(LOGS_DIR)
        matching_files = [f for f in files if call_id in f]

        if not matching_files:
            return jsonify({
                'success': False,
                'error': 'Call not found'
            }), 404

        filepath = os.path.join(LOGS_DIR, matching_files[0])
        with open(filepath, 'r') as f:
            call_data = json.load(f)

        return jsonify({
            'success': True,
            'call': call_data
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    print("\n" + "="*60)
    print("Vapi Webhook Server Starting...")
    print("="*60)
    print("\nEndpoints:")
    print("  POST   /webhook/call-complete  - Handle call completion")
    print("  POST   /webhook/call-started   - Handle call start")
    print("  GET    /health                 - Health check")
    print("  GET    /calls/list             - List all calls")
    print("  GET    /calls/<call_id>        - Get specific call")
    print("\nServer running on http://localhost:5000")
    print("="*60 + "\n")

    app.run(debug=True, host='0.0.0.0', port=5000)
