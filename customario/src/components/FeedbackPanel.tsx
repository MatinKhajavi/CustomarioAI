import { useState, useRef, useEffect } from "react";
import "./FeedbackPanel.css";
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
  const [sessionComplete, setSessionComplete] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);
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

  // Initialize session when it starts
  useEffect(() => {
    if (isSessionActive) {
      setIsRecording(true);
      setMessages([
        {
          type: "ai",
          text: "Hi! I'm ready to listen. Feel free to share your thoughts about TechFlow as you use it. I'm here to have a conversation with you!",
        },
      ]);
    }
  }, [isSessionActive]);

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
