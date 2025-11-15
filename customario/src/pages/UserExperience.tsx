import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import MockWebsite from "../components/MockWebsite";
import FeedbackBorder from "../components/FeedbackBorder";
import FeedbackFAB from "../components/FeedbackFAB";
import FeedbackPanel from "../components/FeedbackPanel";

// Default config - in a real app, this would come from context or API
const DEFAULT_CONFIG = {
  minPrice: 0,
  maxPrice: 1000,
  surveyTopic: "User experience feedback",
  successCriteria: "Learn how users interact with the website",
};

function UserExperience() {
  const location = useLocation();

  // Get config from route state if available, otherwise use defaults
  const config = location.state?.config || DEFAULT_CONFIG;
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isFeedbackActive, setIsFeedbackActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [pausedDuration, setPausedDuration] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (isFeedbackActive && !isPaused && sessionStartTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor(
          (now - sessionStartTime - pausedDuration) / 1000
        );
        setSessionDuration(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isFeedbackActive, isPaused, sessionStartTime, pausedDuration]);

  useEffect(() => {
    if (isPaused && pauseStartTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        const additionalPauseTime = now - pauseStartTime;
        setPausedDuration((prev) => prev + additionalPauseTime);
        setPauseStartTime(now);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPaused, pauseStartTime]);

  const handleFABClick = async () => {
    // Start feedback session directly
    setIsFeedbackActive(true);
    setIsPanelOpen(true);
    setSessionStartTime(Date.now());
    setPausedDuration(0);
    setSessionDuration(0);

    // Create a session ID (in production, this would come from the backend)
    const newSessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setSessionId(newSessionId);
  };

  const handlePanelClose = () => {
    setIsPanelOpen(false);
  };

  const handleFeedbackStart = () => {
    setIsFeedbackActive(true);
    setIsPanelOpen(true); // Keep panel open during session
    setSessionStartTime(Date.now());
    setPausedDuration(0);
    setSessionDuration(0);
  };

  const handlePause = () => {
    setIsPaused(true);
    setPauseStartTime(Date.now());
  };

  const handleResume = () => {
    if (pauseStartTime) {
      const pauseTime = Date.now() - pauseStartTime;
      setPausedDuration((prev) => prev + pauseTime);
    }
    setIsPaused(false);
    setPauseStartTime(null);
  };

  const handleEnd = () => {
    // End the session - panel will show earnings
    setIsFeedbackActive(false);
  };

  return (
    <>
      <FeedbackBorder isActive={isFeedbackActive} isPaused={isPaused}>
        <MockWebsite onFeedbackStart={handleFeedbackStart} />
      </FeedbackBorder>

      {!isFeedbackActive && <FeedbackFAB onClick={handleFABClick} />}

      {/* Keep panel open during active session or when manually opened */}
      <FeedbackPanel
        isOpen={isPanelOpen || isFeedbackActive}
        onClose={isFeedbackActive ? undefined : handlePanelClose}
        isSessionActive={isFeedbackActive}
        isPaused={isPaused}
        onPause={handlePause}
        onResume={handleResume}
        onEnd={handleEnd}
        sessionDuration={sessionDuration}
        minPrice={config.minPrice}
        maxPrice={config.maxPrice}
        sessionId={sessionId || undefined}
      />
    </>
  );
}

export default UserExperience;
