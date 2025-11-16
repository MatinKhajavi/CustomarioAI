import { useState, useRef, useEffect } from "react";
import "./FeedbackPanel.css";
import { apiService } from "../services/apiService";
import { VoiceAgent } from "../services/voiceAgent";

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
  questions: string[];
  surveyId?: string;
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
  questions,
  surveyId,
}: FeedbackPanelProps) {
  const [messages, setMessages] = useState<
    Array<{ type: "user" | "ai"; text: string; isVoice?: boolean }>
  >([]);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);
  const [evaluationNotes, setEvaluationNotes] = useState("");
  const [isCompletingSession, setIsCompletingSession] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [userInput, setUserInput] = useState("");
  const [voiceAgent, setVoiceAgent] = useState<VoiceAgent | null>(null);
  const [useVoice, setUseVoice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = () => {
    if (userInput.trim() && !isPaused) {
      setMessages((prev) => [
        ...prev,
        {
          type: "user",
          text: userInput.trim(),
        },
      ]);
      setUserInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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

  // Complete session and evaluate when session ends
  useEffect(() => {
    if (
      !isSessionActive &&
      sessionDuration > 0 &&
      !sessionComplete &&
      sessionId &&
      surveyId &&
      !isCompletingSession
    ) {
      setIsCompletingSession(true);
      setIsRecording(false);

      (async () => {
        try {
          console.log("📤 Sending transcript to backend for evaluation...");

          // Use transcript if available (from voice agent), otherwise build from messages
          let transcriptText = transcript;
          if (!transcriptText) {
            transcriptText = messages
              .map((msg) => `${msg.type === "user" ? "User" : "Agent"}: ${msg.text}`)
              .join("\n\n");
          }

          console.log("📝 Transcript length:", transcriptText.length, "characters");

          // First, create the backend session (this is the ONLY time we hit backend during voice flow)
          console.log("Creating backend session...");
          const sessionResponse = await apiService.startSession(surveyId);
          const backendSessionId = sessionResponse.session_id;

          console.log("✅ Backend session created:", backendSessionId);

          // Now evaluate the transcript
          console.log("📊 Evaluating transcript...");
          const result = await apiService.completeSession(
            backendSessionId,
            transcriptText
          );

          console.log("✅ Evaluation complete:", result);

          // Update UI with results
          setEarnedAmount(result.payment_amount);
          setEvaluationNotes(result.evaluation_notes);
          setSessionComplete(true);
        } catch (error) {
          console.error("❌ Error completing session:", error);
          alert(
            `Failed to complete session: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        } finally {
          setIsCompletingSession(false);
        }
      })();
    }
  }, [isSessionActive, sessionDuration, sessionComplete, sessionId, surveyId, messages, transcript]);

  // Initialize session when it starts
  useEffect(() => {
    if (isSessionActive && questions.length > 0 && messages.length === 0) {
      setIsRecording(true);
      
      console.log("🎬 FeedbackPanel: Starting voice agent with questions:", questions);
      console.log("🎬 FeedbackPanel: Questions length:", questions.length);
      
      // Try to start voice agent
      const agent = new VoiceAgent(
        questions,
        (transcriptMessages) => {
          // Update messages as conversation progresses
          setMessages(transcriptMessages);
        },
        (finalTranscript) => {
          // Voice conversation complete
          console.log("Voice conversation completed");
          setTranscript(finalTranscript);
          onEnd(); // Trigger session end
        }
      );

      agent
        .start()
        .then(() => {
          console.log("✅ Voice agent started successfully");
          setVoiceAgent(agent);
          setUseVoice(true);
        })
        .catch((error) => {
          console.warn("⚠️ Could not start voice agent, falling back to text:", error);
          setUseVoice(false);
          
          // Fallback to text mode
          const greeting = `Hi! Thanks for participating in this feedback session. I'd love to hear your thoughts. Let's start with the first question:\n\n${questions[0]}`;
          
          setMessages([
            {
              type: "ai",
              text: greeting,
            },
          ]);
        });

      // Cleanup function
      return () => {
        if (voiceAgent) {
          voiceAgent.stop();
        }
      };
    }
  }, [isSessionActive, questions]);

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
                  <span>Status:</span>
                  <span className="transfer-status">Payment Processed</span>
                </div>
              </div>
            </div>
          ) : isCompletingSession ? (
            <div className="processing-section">
              <div className="processing-spinner">
                <div className="spinner"></div>
              </div>
              <h3 className="processing-title">Processing...</h3>
              <p className="processing-subtitle">Evaluating your responses</p>
            </div>
          ) : (
            <div className="voice-session-section">
              {useVoice ? (
                <div className="voice-active-indicator">
                  <div className="voice-wave">
                    <div className="wave-bar"></div>
                    <div className="wave-bar"></div>
                    <div className="wave-bar"></div>
                    <div className="wave-bar"></div>
                  </div>
                  <p className="voice-status">
                    🎤 Voice conversation active
                  </p>
                  <p className="voice-hint">
                    Speak naturally and answer the questions
                  </p>
                </div>
              ) : (
                <div className="voice-fallback">
                  <p className="voice-note">
                    💡 Voice mode unavailable. Using text mode instead.
                  </p>
                  <p className="voice-hint">
                    (Add VITE_OPENAI_API_KEY to enable voice)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {isSessionActive && !sessionComplete && !isCompletingSession && (
          <div className="panel-footer">
            <div className="session-controls">
              <button
                className="control-button end"
                onClick={() => {
                  if (voiceAgent) {
                    voiceAgent.stop();
                  }
                  onEnd();
                }}
              >
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

