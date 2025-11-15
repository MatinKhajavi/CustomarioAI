import { useState, useRef, useEffect, useCallback } from "react";
import "./FeedbackPanel.css";

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
}: FeedbackPanelProps) {
  const [messages, setMessages] = useState<
    Array<{ type: "user" | "ai"; text: string; isVoice?: boolean }>
  >([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const autoRecordTimeoutRef = useRef<number | null>(null);

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

  const stopRecording = useCallback(() => {
    if (autoRecordTimeoutRef.current) {
      clearTimeout(autoRecordTimeoutRef.current);
      autoRecordTimeoutRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleVoiceMessage = useCallback((audioBlob: Blob) => {
    setIsProcessing(true);

    // Store audio blob for future processing
    // In a real app, you would send this to an API for transcription/AI processing
    console.log("Voice message recorded:", audioBlob.size, "bytes");

    // Add user voice message
    const userMessage = {
      type: "user" as const,
      text: "🎤 Voice message",
      isVoice: true,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate AI processing and response
    setTimeout(() => {
      const aiResponses = [
        "That's really helpful feedback! Can you tell me more about that?",
        "I understand. What else have you noticed while using TechFlow?",
        "Thanks for sharing! How does that compare to other tools you've used?",
        "That's interesting. What would make that better for you?",
        "Got it! Any other thoughts or suggestions?",
      ];
      const randomResponse =
        aiResponses[Math.floor(Math.random() * aiResponses.length)];

      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: randomResponse,
        },
      ]);

      setIsProcessing(false);
    }, 2000);
  }, []);

  // Calculate earnings when session ends
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
      stopRecording(); // Stop any ongoing recording
    }
  }, [
    isSessionActive,
    sessionDuration,
    minPrice,
    maxPrice,
    sessionComplete,
    stopRecording,
  ]);

  const startAutoRecording = useCallback(async () => {
    if (isPaused || !isSessionActive || isRecording || isProcessing) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          handleVoiceMessage(audioBlob);
        }

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 5 seconds (simulating voice activity detection)
      // In a real app, you'd use actual voice activity detection
      autoRecordTimeoutRef.current = window.setTimeout(() => {
        stopRecording();
      }, 5000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      // Don't show alert, just log - user might not want to grant permission
    }
  }, [
    isPaused,
    isSessionActive,
    isRecording,
    isProcessing,
    stopRecording,
    handleVoiceMessage,
  ]);

  // Initialize chat and start auto-recording when session starts
  useEffect(() => {
    if (isSessionActive && messages.length === 0) {
      setMessages([
        {
          type: "ai",
          text: "Hi! I'm listening. Feel free to share your thoughts about TechFlow as you use it. I'm here to have a conversation with you!",
        },
      ]);
    }
  }, [isSessionActive, messages.length]);

  // Auto-start recording when session becomes active
  useEffect(() => {
    if (
      isSessionActive &&
      !isPaused &&
      !isRecording &&
      !isProcessing &&
      messages.length > 0
    ) {
      const timer = setTimeout(() => {
        startAutoRecording();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [
    isSessionActive,
    isPaused,
    isRecording,
    isProcessing,
    messages.length,
    startAutoRecording,
  ]);

  // Stop recording when session is paused
  useEffect(() => {
    if (isPaused && isRecording) {
      stopRecording();
    }
  }, [isPaused, isRecording, stopRecording]);

  // Auto-start recording after AI response
  useEffect(() => {
    if (
      !isProcessing &&
      isSessionActive &&
      !isPaused &&
      !isRecording &&
      messages.length > 1
    ) {
      // Check if last message was from AI
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === "ai") {
        const timer = setTimeout(() => {
          startAutoRecording();
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [
    isProcessing,
    isSessionActive,
    isPaused,
    isRecording,
    messages,
    startAutoRecording,
  ]);

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
              </div>

              <button
                className="transfer-button"
                onClick={() => {
                  // Handle wallet transfer
                  alert("Transferring to wallet...");
                }}
              >
                Transfer to Wallet
              </button>
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
