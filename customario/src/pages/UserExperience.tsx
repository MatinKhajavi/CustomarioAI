import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";
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
  const navigate = useNavigate();

  // Get surveyId and config from route state
  const surveyId = location.state?.surveyId;
  const config = location.state?.config || DEFAULT_CONFIG;

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isFeedbackActive, setIsFeedbackActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [pausedDuration, setPausedDuration] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);

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
    if (!surveyId) {
      alert("No survey ID found. Please start from the admin page.");
      navigate("/admin");
      return;
    }

    setIsStarting(true);

    try {
      // Get survey data (already has questions - no session creation yet!)
      const survey = await apiService.getSurvey(surveyId);

      console.log("📊 Survey loaded:", survey);
      console.log("❓ Survey questions:", survey.questions);
      console.log("❓ Number of questions:", survey.questions?.length);

      // Create local session ID (backend session created only when we send transcript)
      const localSessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Set session data
      setSessionId(localSessionId);
      setQuestions(survey.questions);
      
      console.log("✅ Questions set in state:", survey.questions);

      // Start feedback session (voice agent starts now - NO backend calls!)
      setIsFeedbackActive(true);
      setIsPanelOpen(true);
      setSessionStartTime(Date.now());
      setPausedDuration(0);
      setSessionDuration(0);

      console.log("✅ Starting voice session (frontend only, no backend yet)");
    } catch (error) {
      console.error("Error loading survey:", error);
      alert(
        `Failed to load survey: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsStarting(false);
    }
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

      {!isFeedbackActive && (
        <FeedbackFAB onClick={handleFABClick} disabled={isStarting} />
      )}

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
        questions={questions}
        surveyId={surveyId}
      />
    </>
  );
}

export default UserExperience;
