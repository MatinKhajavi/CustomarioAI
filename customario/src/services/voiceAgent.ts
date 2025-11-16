/**
 * Voice Agent using OpenAI Realtime API SDK
 * Modern implementation using @openai/agents for reliable real-time voice conversations
 * 
 * Key improvements over manual WebSocket approach:
 * - Automatic audio handling (mic + speaker)
 * - Built-in WebRTC/WebSocket transport
 * - Proper session management
 * - Type-safe event handling
 * - Better error handling
 */

import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
import type { RealtimeItem } from '@openai/agents/realtime';

export interface VoiceMessage {
  type: "user" | "agent";
  text: string;
}

export class VoiceAgent {
  private agent: RealtimeAgent;
  private session: RealtimeSession | null = null;
  private transcript: VoiceMessage[] = [];
  private questions: string[];
  private onTranscriptUpdate: (messages: VoiceMessage[]) => void;
  private onComplete: (transcript: string) => void;
  private isActive = false;

  constructor(
    questions: string[],
    onTranscriptUpdate: (messages: VoiceMessage[]) => void,
    onComplete: (transcript: string) => void
  ) {
    this.questions = questions;
    this.onTranscriptUpdate = onTranscriptUpdate;
    this.onComplete = onComplete;

    console.log('🎯 Voice agent received questions:', questions);
    console.log('🎯 Number of questions:', questions.length);

    // Create the RealtimeAgent with survey instructions
    const prompt = this.buildSystemPrompt();
    console.log('📝 System prompt:', prompt);

    this.agent = new RealtimeAgent({
      name: 'Survey Assistant',
      instructions: prompt,
    });

    console.log('✅ Voice agent created');
  }

  // --- Prompt builder -------------------------------------------------------

  private buildSystemPrompt(): string {
    // Clean up questions - remove any existing numbering
    const cleanedQuestions = this.questions.map(q => 
      q.replace(/^\d+\.\s*/, '').trim()
    );
    
    const questionsText = cleanedQuestions
      .map((q, i) => `${i + 1}. ${q}`)
      .join('\n');

    return `You are conducting a feedback survey. You MUST ask ONLY these exact questions in order:

${questionsText}

IMPORTANT RULES:
- Start by greeting briefly and say you have ${cleanedQuestions.length} questions
- Continue until all ${cleanedQuestions.length} questions are done
- DO NOT make up your own questions
- DO NOT ask about topics not in the list above
- When all questions answered, say "Thank you for your feedback!"

Remember: Ask ONLY the ${cleanedQuestions.length} questions listed above. No other questions.`;
  }

  // --- Public API -----------------------------------------------------------

  async start(): Promise<void> {
    if (this.isActive) {
      console.warn('⚠️ Voice agent already active');
      return;
    }

    console.log('🎙️ Starting voice conversation...');

    try {
      // Get ephemeral token from backend
      const ephemeralToken = await this.getEphemeralToken();

      // Create session with audio configuration
      // The SDK will automatically use WebRTC in browser and handle audio
      this.session = new RealtimeSession(this.agent, {
        model: 'gpt-4o-realtime-preview-2024-12-17',
        config: {
          audio: {
            input: {
              // Audio format configuration
              format: {
                type: 'audio/pcm',
                rate: 24000,
              },
              // Noise reduction
              noiseReduction: {
                type: 'far_field', // 'near_field' for close-to-mic, 'far_field' for room audio
              },
              // Transcription settings
              transcription: {
                model: 'gpt-4o-transcribe', // Use best quality transcription
              },
              // Voice Activity Detection (VAD) configuration
              turnDetection: {
                type: 'server_vad', // Use server_vad for better compatibility
                
                // VAD sensitivity (0.0 to 1.0)
                threshold: 0.7,
                
                // How much silence before considering speech ended
                silenceDurationMs: 1000,
              },
            },
            output: {
              format: {
                type: 'audio/pcm',
                rate: 24000,
              },
              voice: 'alloy', // alloy, echo, fable, onyx, nova, shimmer
            },
          },
        },
      });

      // Set up event listeners BEFORE connecting
      this.setupEventListeners();

      // Connect to OpenAI Realtime API
      // The SDK automatically handles:
      // - Microphone access
      // - Audio context setup
      // - WebRTC connection in browser
      // - Speaker output
      await this.session.connect({ apiKey: ephemeralToken });

      this.isActive = true;
      console.log('✅ Connected to OpenAI Realtime API');

      // Start the conversation with a greeting
      this.session.sendMessage("Hi, I'm ready for the survey.");

    } catch (error) {
      console.error('❌ Error starting voice agent:', error);
      this.isActive = false;
      throw error;
    }
  }

  stop(): void {
    console.log('⏹️ Stopping voice agent...');
    this.complete();
  }

  // --- Ephemeral Token Generation -------------------------------------------

  private async getEphemeralToken(): Promise<string> {
    // First, try to get from backend endpoint
    try {
      const response = await fetch('/api/realtime-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        return data.token;
      }
    } catch (error) {
      console.warn('⚠️ Backend token endpoint not available, trying direct API');
    }

    // Fallback: generate directly using API key (for development only)
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'No OpenAI API key found. Add VITE_OPENAI_API_KEY to .env or implement /api/realtime-token endpoint'
      );
    }

    console.log('⚠️ Generating ephemeral token directly (development mode)');
    
    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: 'gpt-4o-realtime-preview-2024-12-17',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to generate ephemeral token: ${error}`);
    }

    const data = await response.json();
    return data.value; // The ephemeral key starts with "ek_"
  }

  // --- Event Handling -------------------------------------------------------

  private setupEventListeners(): void {
    if (!this.session) return;

    // Listen for conversation history updates
    // This is the most reliable way to track the conversation
    this.session.on('history_updated', (history: RealtimeItem[]) => {
      console.log('📜 History updated:', history.length, 'items');
      this.syncTranscriptFromHistory(history);
    });

    // Listen for when items are added (real-time updates)
    this.session.on('history_added', (item: RealtimeItem) => {
      console.log('➕ History item added:', item);
    });

    // Listen for agent audio events
    this.session.on('audio_start', () => {
      console.log('🔊 Agent started speaking');
    });

    this.session.on('audio_stopped', () => {
      console.log('🔇 Agent stopped speaking');
    });

    this.session.on('audio_interrupted', () => {
      console.log('⚠️ Agent was interrupted');
    });

    // Listen for agent lifecycle events
    this.session.on('agent_start', (_context, agent) => {
      console.log('🤖 Agent started:', agent.name);
    });

    this.session.on('agent_end', (_context, _agent, output) => {
      console.log('🤖 Agent ended:', output);
      
      // Check if survey is complete based on agent's output
      if (output) {
        this.checkSurveyCompletion(output);
      }
    });

    // Listen for tool calls if needed
    this.session.on('agent_tool_start', (_context, _agent, tool) => {
      console.log('🔧 Tool called:', tool.name);
    });

    this.session.on('agent_tool_end', (_context, _agent, _tool, result) => {
      console.log('🔧 Tool result:', result);
    });

    // Listen for errors
    this.session.on('error', (errorEvent) => {
      console.error('❌ Session error:', errorEvent.error);
    });

    // Listen for raw transport events if needed for debugging
    this.session.on('transport_event', (_event) => {
      // Uncomment for deep debugging:
      // console.log('🔌 Transport event:', _event.type);
    });
  }

  // --- Helper Methods -------------------------------------------------------

  private syncTranscriptFromHistory(history: RealtimeItem[]): void {
    // Extract text messages from history
    const messages: VoiceMessage[] = [];

    for (const item of history) {
      if (item.type === 'message') {
        const role = item.role;
        
        // Extract text content from the message
        if (Array.isArray(item.content)) {
          for (const content of item.content) {
            let text: string | null = null;

            // Handle different content types
            if (content.type === 'input_text') {
              text = content.text;
            } else if (content.type === 'input_audio' && content.transcript) {
              text = content.transcript;
            } else if (content.type === 'output_text') {
              text = content.text;
            } else if (content.type === 'output_audio' && content.transcript) {
              text = content.transcript;
            }

            if (text && text.trim()) {
              messages.push({
                type: role === 'user' ? 'user' : 'agent',
                text: text.trim(),
              });
            }
          }
        }
      }
    }

    // Update transcript if changed
    if (JSON.stringify(messages) !== JSON.stringify(this.transcript)) {
      this.transcript = messages;
      this.onTranscriptUpdate([...this.transcript]);
    }
  }

  private checkSurveyCompletion(text: string): void {
    const lowerText = text.toLowerCase();
    if (
      lowerText.includes('thank you for your feedback') ||
      lowerText.includes('completes our survey') ||
      lowerText.includes('thank you so much for your time') ||
      lowerText.includes('that completes the survey')
    ) {
      console.log('✅ Survey completion detected in text:', text);
      setTimeout(() => this.complete(), 1500);
    }
  }

  // --- Completion & Cleanup -------------------------------------------------

  private complete(): void {
    if (!this.isActive) return;

    console.log('✅ Survey complete');

    // Build final transcript
    const transcriptText = this.transcript
      .map((msg) => `${msg.type === 'user' ? 'User' : 'Agent'}: ${msg.text}`)
      .join('\n\n');

    this.onComplete(transcriptText);
    this.cleanup();
  }

  private cleanup(): void {
    console.log('🧹 Cleaning up voice agent...');

    if (this.session) {
      // Disconnect cleanly
      this.session.close();
      this.session = null;
    }

    this.isActive = false;
    console.log('✅ Cleanup complete');
  }

  // --- Advanced Features (Optional) -----------------------------------------

  /**
   * Manually update conversation history
   * Useful for context injection or history management
   */
  updateHistory(history: RealtimeItem[]): void {
    if (this.session) {
      this.session.updateHistory(history);
    }
  }

  /**
   * Get current conversation history
   */
  getHistory(): RealtimeItem[] {
    return this.session?.history ?? [];
  }

  /**
   * Manually interrupt the agent
   */
  interrupt(): void {
    if (this.session) {
      this.session.interrupt();
    }
  }

  /**
   * Mute/unmute the microphone
   */
  mute(muted: boolean): void {
    if (this.session) {
      this.session.mute(muted);
    }
  }
}
