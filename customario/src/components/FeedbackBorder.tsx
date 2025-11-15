import { useState, useEffect } from "react";
import "./FeedbackBorder.css";

interface FeedbackBorderProps {
  isActive: boolean;
  isPaused: boolean;
  children: React.ReactNode;
}

function FeedbackBorder({ isActive, isPaused, children }: FeedbackBorderProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setElapsedTime(0);
      return;
    }

    if (isPaused) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className={`feedback-container ${isActive ? "active" : ""}`}>
      {isActive && (
        <>
          <div className="feedback-border-top">
            <div className="border-content">
              <div className="recording-indicator">
                <span
                  className={`pulse-dot ${isPaused ? "paused" : "active"}`}
                ></span>
                <span className="recording-text">
                  {isPaused ? "Feedback Paused" : "Recording Feedback"}
                </span>
              </div>
              <div className="session-time">{formatTime(elapsedTime)}</div>
            </div>
          </div>

          <div className="feedback-border-left"></div>
          <div className="feedback-border-right"></div>
          <div className="feedback-border-bottom"></div>
        </>
      )}
      <div className="feedback-content">{children}</div>
    </div>
  );
}

export default FeedbackBorder;
