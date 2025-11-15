/**
 * Vapi service using the official @vapi-ai/web SDK
 */
import Vapi from "@vapi-ai/web";

const VAPI_PUBLIC_KEY = "fde36d8f-f671-4cd5-9a32-f454cec179e9";
const VAPI_ASSISTANT_ID = "e19f59d2-3f14-4179-b071-0869c77f6c8a";

export interface VapiMessage {
  type?: string;
  role?: "user" | "assistant" | "system";
  content?: string;
  transcript?: string;
  status?: string;
  message?: string;
  text?: string;
  result?: any;
  output?: any;
  [key: string]: any;
}

export type VapiMessageHandler = (message: VapiMessage) => void;
export type VapiEventHandler = () => void;

class VapiService {
  private vapi: Vapi | null = null;
  private messageHandlers: Set<VapiMessageHandler> = new Set();
  private isInitialized = false;

  /**
   * Initialize Vapi with public key
   */
  initialize(): void {
    if (this.isInitialized && this.vapi) {
      return;
    }

    if (!VAPI_PUBLIC_KEY) {
      throw new Error(
        "VAPI_PUBLIC_KEY not found. Please set VITE_VAPI_PUBLIC_KEY in your .env file and restart the dev server. IMPORTANT: Use your PUBLIC key, not the private key."
      );
    }

    console.log("Vapi Service - Initializing with SDK...");
    this.vapi = new Vapi(VAPI_PUBLIC_KEY);
    this.isInitialized = true;

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up Vapi event listeners
   */
  private setupEventListeners(): void {
    if (!this.vapi) return;

    // Listen for messages (transcripts, function calls, etc.)
    this.vapi.on("message", (message: any) => {
      console.log("Vapi SDK - Message received:", message);
      this.messageHandlers.forEach((handler) =>
        handler(message as VapiMessage)
      );
    });

    // Listen for call events
    this.vapi.on("call-start", () => {
      console.log("Vapi SDK - Call started");
      // Notify handlers of call start
      this.messageHandlers.forEach((handler) =>
        handler({ type: "call-start", status: "started" } as VapiMessage)
      );
    });

    this.vapi.on("call-end", () => {
      console.log("Vapi SDK - Call ended");
      // Notify handlers of call end
      this.messageHandlers.forEach((handler) =>
        handler({ type: "call-end", status: "ended" } as VapiMessage)
      );
    });

    // Listen for speech events
    this.vapi.on("speech-start", () => {
      console.log("Vapi SDK - Speech started");
      // Notify handlers that assistant is speaking
      this.messageHandlers.forEach((handler) =>
        handler({ type: "speech-start", status: "speaking" } as VapiMessage)
      );
    });

    this.vapi.on("speech-end", () => {
      console.log("Vapi SDK - Speech ended");
      // Notify handlers that assistant finished speaking
      this.messageHandlers.forEach((handler) =>
        handler({ type: "speech-end", status: "listening" } as VapiMessage)
      );
    });

    // Listen for errors
    this.vapi.on("error", (error: any) => {
      console.error("Vapi SDK - Error:", error);
    });
  }

  /**
   * Start a Vapi call
   */
  async startCall(
    metadata?: Record<string, any>,
    onMessage?: VapiMessageHandler
  ): Promise<void> {
    if (!this.isInitialized) {
      this.initialize();
    }

    if (!this.vapi) {
      throw new Error("Vapi not initialized");
    }

    if (!VAPI_ASSISTANT_ID) {
      throw new Error(
        "VAPI_ASSISTANT_ID not found. Please set VITE_VAPI_ASSISTANT_ID in your .env file and restart the dev server."
      );
    }

    // Add message handler if provided
    if (onMessage) {
      this.messageHandlers.add(onMessage);
    }

    console.log(
      "Vapi Service - Starting call with assistant:",
      VAPI_ASSISTANT_ID
    );

    try {
      // Start the call with assistant ID and any overrides
      const assistantOverrides = metadata
        ? {
            variableValues: metadata,
          }
        : undefined;

      await this.vapi.start(VAPI_ASSISTANT_ID, assistantOverrides);
      console.log("Vapi SDK - Call started successfully");
    } catch (error) {
      console.error("Vapi Service - Error starting call:", error);
      throw error;
    }
  }

  /**
   * Stop the current call
   */
  stopCall(): void {
    if (this.vapi) {
      console.log("Vapi Service - Stopping call");
      this.vapi.stop();
    }
    this.messageHandlers.clear();
  }

  /**
   * Add a message handler
   */
  onMessage(handler: VapiMessageHandler): void {
    this.messageHandlers.add(handler);
  }

  /**
   * Remove a message handler
   */
  offMessage(handler: VapiMessageHandler): void {
    this.messageHandlers.delete(handler);
  }

  /**
   * Send a text message to the assistant
   */
  sendMessage(role: "system" | "user" | "assistant", content: string): void {
    if (!this.vapi) {
      console.warn("Vapi not initialized, cannot send message");
      return;
    }

    this.vapi.send({
      type: "add-message",
      message: {
        role,
        content,
      },
    });
  }

  /**
   * Mute/unmute the microphone
   * Only works after call has started
   */
  setMuted(muted: boolean): void {
    if (this.vapi) {
      try {
        this.vapi.setMuted(muted);
      } catch (error) {
        // Call might not be active yet, ignore the error
        console.warn("Cannot set muted state - call not active yet:", error);
      }
    }
  }

  /**
   * Check if microphone is muted
   */
  isMuted(): boolean {
    return this.vapi ? this.vapi.isMuted() : false;
  }

  /**
   * Make the assistant say something
   */
  say(message: string, endCallAfterSpoken = false): void {
    if (this.vapi) {
      this.vapi.say(message, endCallAfterSpoken);
    }
  }

  /**
   * Get the Vapi instance (for advanced usage)
   */
  getVapiInstance(): Vapi | null {
    return this.vapi;
  }
}

export const vapiService = new VapiService();
