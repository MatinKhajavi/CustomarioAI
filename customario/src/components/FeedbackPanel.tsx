import { useState, useRef, useEffect, useCallback } from "react";
import "./FeedbackPanel.css";
import { vapiService } from "../services/vapiService";
import type { VapiMessage } from "../services/vapiService";
import { paymentService } from "../services/paymentService";

interface FeedbackPanelProps {
  isOpen: boolean;
  onClose?: () => void;
  isSessionActive: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  sessionDuration: number;
  minPrice: number;
  maxPrice: number;
  sessionId?: string;
}

function FeedbackPanel({
  isOpen,
  onClose,
  isSessionActive,
  isPaused,
  onPause,
  onResume,
  onEnd,
  sessionDuration,
  minPrice,
  maxPrice,
  sessionId,
}: FeedbackPanelProps) {
  const [messages, setMessages] = useState<
    Array<{ type: "user" | "ai"; text: string; isVoice?: boolean }>
  >([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const formatTimeShort = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Handle Vapi messages from SDK
  const handleVapiMessage = useCallback((message: VapiMessage) => {
    console.log("Vapi SDK message:", message);

    // Extract text content from various possible fields
    const getTextContent = (msg: VapiMessage): string => {
      return (
        msg.transcript ||
        msg.content ||
        msg.message ||
        msg.text ||
        (typeof msg === "string" ? msg : "") ||
        ""
      );
    };

    const textContent = getTextContent(message);

    // Handle USER messages/transcripts
    // Vapi SDK sends user transcripts with role="user" or type="transcript"
    const isUserMessage =
      message.role === "user" ||
      (message.type === "transcript" && !message.role) || // Default transcript is user
      message.type === "user-transcript" ||
      message.type === "user-message";

    if (isUserMessage) {
      if (textContent && textContent.trim()) {
        setMessages((prev) => {
          // Check if we already have this exact message to avoid duplicates
          const lastMessage = prev[prev.length - 1];
          if (
            lastMessage?.type === "user" &&
            lastMessage.text === textContent.trim()
          ) {
            return prev;
          }
          return [
            ...prev,
            {
              type: "user" as const,
              text: textContent.trim(),
              isVoice: true,
            },
          ];
        });
      }
    }

    // Handle ASSISTANT messages/responses
    // Vapi SDK sends assistant messages with role="assistant" or in function call results
    const isAssistantMessage =
      message.role === "assistant" ||
      message.type === "assistant-message" ||
      message.type === "assistant-response" ||
      (message.type === "function-call-result" && textContent);

    if (isAssistantMessage) {
      if (textContent && textContent.trim()) {
        setMessages((prev) => {
          // Check if we already have this exact message to avoid duplicates
          const lastMessage = prev[prev.length - 1];
          if (
            lastMessage?.type === "ai" &&
            lastMessage.text === textContent.trim()
          ) {
            return prev;
          }
          return [
            ...prev,
            {
              type: "ai" as const,
              text: textContent.trim(),
            },
          ];
        });
      }
    }

    // Handle function calls (can contain assistant responses)
    if (
      message.type === "function-call" ||
      message.type === "function-call-result"
    ) {
      // If function call has a response message, show it
      if (message.result || message.output) {
        const resultText =
          typeof message.result === "string"
            ? message.result
            : typeof message.output === "string"
            ? message.output
            : JSON.stringify(message.result || message.output);

        if (resultText && resultText.trim()) {
          setMessages((prev) => [
            ...prev,
            {
              type: "ai" as const,
              text: resultText.trim(),
            },
          ]);
        }
      }
      console.log("Function call:", message);
    }

    // Handle speech events from SDK
    if (message.type === "speech-start") {
      setIsProcessing(true);
      setIsRecording(false);
    } else if (message.type === "speech-end") {
      setIsProcessing(false);
      setIsRecording(true);
    }

    // Handle call start/end
    if (message.type === "call-start") {
      setIsCallActive(true);
    } else if (message.type === "call-end") {
      setIsRecording(false);
      setIsProcessing(false);
      setIsCallActive(false);
    }
  }, []);

  // Calculate earnings and auto-transfer when session ends
  useEffect(() => {
    if (!isSessionActive && sessionDuration > 0 && !sessionComplete) {
      const minutes = sessionDuration / 60;
      const baseRate = (minPrice + maxPrice) / 2;
      const calculatedAmount = Math.min(
        maxPrice,
        Math.max(minPrice, (baseRate * minutes) / 10)
      );
      setEarnedAmount(calculatedAmount);
      setSessionComplete(true);
      setIsRecording(false);

      // End Vapi call and cleanup
      vapiService.stopCall();

      // Automatically send USDC payment (async)
      (async () => {
        try {
          console.log(
            `Sending payment of $${calculatedAmount.toFixed(2)} USDC...`
          );
          const paymentResult = await paymentService.sendPayment(
            calculatedAmount,
            undefined, // Use default recipient from backend config
            `Feedback session payment - ${formatTimeShort(sessionDuration)}`
          );

          if (paymentResult.success) {
            console.log("Payment sent successfully:", paymentResult);
          } else {
            console.error("Payment failed:", paymentResult.error);
          }
        } catch (error) {
          console.error("Error sending payment:", error);
          // Don't block the UI if payment fails
        }
      })();
    }
  }, [
    isSessionActive,
    sessionDuration,
    minPrice,
    maxPrice,
    sessionComplete,
    sessionId,
    formatTimeShort,
  ]);

  // Initialize Vapi call when session starts
  useEffect(() => {
    if (isSessionActive) {
      const initializeVapi = async () => {
        try {
          // Initialize and start Vapi call using SDK
          // The SDK handles all WebSocket and audio streaming internally
          await vapiService.startCall(
            {
              sessionId: sessionId || "default",
              surveyTopic: "User experience feedback",
            },
            handleVapiMessage
          );

          setIsRecording(true);
          setMessages([
            {
              type: "ai",
              text: "Hi! I'm ready to listen. Feel free to share your thoughts about TechFlow as you use it. I'm here to have a conversation with you!",
            },
          ]);
        } catch (error) {
          console.error("Error initializing Vapi:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

          // Provide helpful message for common errors
          let userMessage = errorMessage;
          if (
            errorMessage.includes("Invalid Key") ||
            errorMessage.includes("private key") ||
            errorMessage.includes("public key")
          ) {
            userMessage =
              "Invalid API Key: Make sure you're using your PUBLIC key (not private key) from https://dashboard.vapi.ai/keys. Public keys are safe for frontend use.";
          } else if (errorMessage.includes("VAPI_PUBLIC_KEY not found")) {
            userMessage =
              "API Key not found. Please add VITE_VAPI_PUBLIC_KEY to your .env file and restart the dev server.";
          } else if (errorMessage.includes("VAPI_ASSISTANT_ID not found")) {
            userMessage =
              "Assistant ID not found. Please add VITE_VAPI_ASSISTANT_ID to your .env file and restart the dev server.";
          }

          setMessages([
            {
              type: "ai",
              text: `Sorry, I'm having trouble connecting: ${userMessage}`,
            },
          ]);
        }
      };

      initializeVapi();
    }

    // Cleanup on unmount or session end
    return () => {
      if (!isSessionActive) {
        vapiService.stopCall();
      }
    };
  }, [isSessionActive, handleVapiMessage, sessionId]);

  // Handle pause/resume with Vapi SDK
  // Only call setMuted after the call is active
  useEffect(() => {
    if (!isCallActive) return; // Wait for call to be active

    if (isPaused) {
      setIsRecording(false);
      vapiService.setMuted(true);
    } else if (isSessionActive) {
      setIsRecording(true);
      vapiService.setMuted(false);
    }
  }, [isPaused, isSessionActive, isCallActive]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div
      className={`feedback-panel-overlay ${
        isSessionActive ? "session-active" : ""
      }`}
      onClick={isSessionActive ? undefined : onClose}
    >
      <div className="feedback-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="header-content">
            <h3>TechFlow Feedback</h3>
            {isSessionActive && !sessionComplete && (
              <div className="session-status">
                <span
                  className={`status-dot ${isPaused ? "paused" : "active"}`}
                ></span>
                <span className="status-text">
                  {isPaused ? "Paused" : "Recording"}
                </span>
                <span className="session-time">
                  {formatTime(sessionDuration)}
                </span>
              </div>
            )}
            {sessionComplete && (
              <div className="session-status">
                <span className="status-text">Session Complete</span>
              </div>
            )}
          </div>
          {onClose && !isSessionActive && (
            <button
              className="close-button"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>

        {isSessionActive && !sessionComplete && (
          <div className="earnings-banner">
            <div className="earnings-content">
              <span className="earnings-label">Potential Earnings:</span>
              <span className="earnings-amount">
                ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div className="panel-content">
          {sessionComplete ? (
            <div className="completion-section">
              <div className="completion-icon">✓</div>
              <h3 className="completion-title">Session Complete!</h3>
              <p className="completion-subtitle">Thank you for your feedback</p>

              <div className="earnings-display">
                <div className="earnings-amount-large">
                  ${earnedAmount.toFixed(2)}
                </div>
                <div className="earnings-label-large">You Earned</div>
              </div>

              <div className="session-summary">
                <div className="summary-row">
                  <span>Session Duration:</span>
                  <span>{formatTimeShort(sessionDuration)}</span>
                </div>
                <div className="summary-row">
                  <span>Earnings Range:</span>
                  <span>
                    ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Status:</span>
                  <span className="transfer-status">Transferred to Wallet</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="chat-section">
              <div className="messages-container">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`message ${
                      message.type === "user" ? "user-message" : "ai-message"
                    }`}
                  >
                    <div className="message-content">{message.text}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="voice-input-container">
                {isRecording ? (
                  <div className="recording-indicator-voice">
                    <div className="recording-pulse"></div>
                    <span className="recording-text-voice">Listening...</span>
                  </div>
                ) : isProcessing ? (
                  <div className="processing-indicator">
                    <div className="processing-spinner"></div>
                    <span className="processing-text">Processing...</span>
                  </div>
                ) : (
                  <div className="voice-status">
                    <div className="status-icon">🎤</div>
                    <span className="status-text">Ready to listen</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {isSessionActive && !sessionComplete && (
          <div className="panel-footer">
            <div className="session-controls">
              {isPaused ? (
                <button className="control-button resume" onClick={onResume}>
                  ▶ Resume
                </button>
              ) : (
                <button className="control-button pause" onClick={onPause}>
                  ⏸ Pause
                </button>
              )}
              <button className="control-button end" onClick={onEnd}>
                ⏹ End Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedbackPanel;
