import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../components/FeedbackResults.css";

function FeedbackResults() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get data from route state
  const sessionDuration = (location.state?.sessionDuration as number) || 0;
  const minPrice = (location.state?.minPrice as number) || 0;
  const maxPrice = (location.state?.maxPrice as number) || 1000;

  const [earnedAmount, setEarnedAmount] = useState(0);

  useEffect(() => {
    // Calculate payment based on session duration
    // Payment is proportional to time spent, within the min/max range
    const minutes = sessionDuration / 60;
    const baseRate = (minPrice + maxPrice) / 2; // Average of min/max
    const calculatedAmount = Math.min(
      maxPrice,
      Math.max(minPrice, (baseRate * minutes) / 10) // Scale based on 10 minutes = average price
    );
    setEarnedAmount(calculatedAmount);
  }, [sessionDuration, minPrice, maxPrice]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className="results-container">
      <div className="results-card">
        <div className="results-header">
          <div className="success-icon">✓</div>
          <h1>Feedback Session Complete!</h1>
          <p className="subtitle">Thank you for your valuable feedback</p>
        </div>

        <div className="results-stats">
          <div className="stat-card">
            <div className="stat-label">Session Duration</div>
            <div className="stat-value">{formatTime(sessionDuration)}</div>
          </div>

          <div className="stat-card highlight">
            <div className="stat-label">You Earned</div>
            <div className="stat-value amount">${earnedAmount.toFixed(2)}</div>
          </div>
        </div>

        <div className="payment-info">
          <h3>Payment Details</h3>
          <div className="payment-details">
            <div className="payment-row">
              <span>Base Rate:</span>
              <span>${((minPrice + maxPrice) / 2).toFixed(2)}</span>
            </div>
            <div className="payment-row">
              <span>Session Time:</span>
              <span>{formatTime(sessionDuration)}</span>
            </div>
            <div className="payment-row total">
              <span>Total Earned:</span>
              <span>${earnedAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="results-actions">
          <button className="primary-button" onClick={() => navigate("/user")}>
            Start New Session
          </button>
          <button
            className="secondary-button"
            onClick={() => navigate("/admin")}
          >
            Back to Admin
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeedbackResults;
