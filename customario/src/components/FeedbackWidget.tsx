import { useState, useEffect } from "react";
import "./FeedbackWidget.css";

interface FeedbackWidgetProps {
  isActive: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}

function FeedbackWidget({
  isActive,
  isPaused,
  onPause,
  onResume,
  onEnd,
}: FeedbackWidgetProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isActive || isPaused) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  if (!isActive) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="feedback-widget">
      <div className="widget-header">
        <div className="recording-indicator">
          <span
            className={`pulse-dot ${isPaused ? "paused" : "active"}`}
          ></span>
          <span className="recording-text">
            {isPaused ? "Paused" : "Recording"}
          </span>
        </div>
        <div className="session-time">{formatTime(elapsedTime)}</div>
      </div>

      <div className="widget-actions">
        {isPaused ? (
          <button className="widget-button resume" onClick={onResume}>
            ▶ Resume
          </button>
        ) : (
          <button className="widget-button pause" onClick={onPause}>
            ⏸ Pause
          </button>
        )}
        <button className="widget-button end" onClick={onEnd}>
          ⏹ End Session
        </button>
      </div>
    </div>
  );
}

export default FeedbackWidget;
