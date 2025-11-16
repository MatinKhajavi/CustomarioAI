import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiService } from "../services/apiService";
import ReactMarkdown from "react-markdown";
import "../App.css";
import "./InsightsPage.css";

interface Session {
  session_id: string;
  survey_id: string;
  status: string;
  transcript?: string;
  evaluation_score?: number;
  evaluation_notes?: string;
  payment_amount?: number;
  created_at: string;
  completed_at?: string;
}

interface InsightsData {
  survey_id: string;
  total_sessions: number;
  average_score: number;
  average_payment: number;
  key_insights: string;
  sessions: Session[];
}

function InsightsPage() {
  const navigate = useNavigate();
  const { surveyId } = useParams<{ surveyId: string }>();
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [surveyTitle, setSurveyTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!surveyId) {
      setError("No survey ID provided");
      setLoading(false);
      return;
    }

    loadInsights();
  }, [surveyId]);

  const loadInsights = async () => {
    if (!surveyId) return;

    try {
      setLoading(true);
      
      // Load survey info
      const survey = await apiService.getSurvey(surveyId);
      setSurveyTitle(survey.title);

      // Load insights
      const insightsResponse = await fetch(
        `http://localhost:8000/survey/${surveyId}/insights`
      );
      
      if (!insightsResponse.ok) {
        throw new Error("Failed to load insights");
      }

      const insightsData = await insightsResponse.json();
      setInsights(insightsData);
      setError(null);
    } catch (err) {
      console.error("Error loading insights:", err);
      setError(err instanceof Error ? err.message : "Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-card">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading insights...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-container">
        <div className="admin-card">
          <div className="error-state">
            <h2>Error Loading Insights</h2>
            <p>{error}</p>
            <button
              className="next-button"
              onClick={() => navigate("/admin")}
            >
              Back to Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <div className="admin-container">
      <div className="admin-card" style={{ maxWidth: "900px" }}>
        <div className="admin-header">
          <h1>Survey Insights</h1>
          <p className="subtitle">{surveyTitle}</p>
        </div>

        {/* Summary Stats */}
        <div className="insights-summary">
          <div className="insight-stat-card">
            <div className="stat-label">Total Sessions</div>
            <div className="stat-value">{insights.total_sessions}</div>
          </div>

          <div className="insight-stat-card">
            <div className="stat-label">Average Score</div>
            <div className="stat-value">
              {insights.average_score.toFixed(1)}/100
            </div>
          </div>

          <div className="insight-stat-card">
            <div className="stat-label">Average Payment</div>
            <div className="stat-value">
              ${insights.average_payment.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Key Insights */}
        {insights.key_insights && (
          <div className="insights-section">
            <h3>Key Insights</h3>
            <div className="insights-content markdown-content">
              <ReactMarkdown>{insights.key_insights}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Sessions List */}
        {insights.sessions && insights.sessions.length > 0 && (
          <div className="insights-section">
            <h3>Recent Sessions ({insights.sessions.length})</h3>
            <div className="sessions-list">
              {insights.sessions.map((session) => (
                <div key={session.session_id} className="session-card">
                  <div className="session-header">
                    <span className="session-id">{session.session_id}</span>
                    <span className="session-status">{session.status}</span>
                  </div>

                  <div className="session-details">
                    {session.evaluation_score !== undefined && (
                      <div className="session-detail">
                        <strong>Score:</strong> {session.evaluation_score}/100
                      </div>
                    )}

                    {session.payment_amount !== undefined && (
                      <div className="session-detail">
                        <strong>Payment:</strong> ${session.payment_amount.toFixed(2)}
                      </div>
                    )}

                    <div className="session-detail">
                      <strong>Created:</strong> {formatDate(session.created_at)}
                    </div>

                    {session.completed_at && (
                      <div className="session-detail">
                        <strong>Completed:</strong> {formatDate(session.completed_at)}
                      </div>
                    )}
                  </div>

                  {session.evaluation_notes && (
                    <div className="session-notes">
                      <strong>Notes:</strong>
                      <p>{session.evaluation_notes}</p>
                    </div>
                  )}

                  {session.transcript && (
                    <details className="session-transcript">
                      <summary>View Transcript</summary>
                      <p style={{ whiteSpace: "pre-wrap" }}>
                        {session.transcript}
                      </p>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="form-actions">
          <button
            className="next-button"
            onClick={() => navigate("/admin")}
          >
            Back to Admin
          </button>
          <button
            className="secondary-button"
            onClick={loadInsights}
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

export default InsightsPage;

