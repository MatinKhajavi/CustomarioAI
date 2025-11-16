import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";
import "../App.css";

interface SurveyConfig {
  minPrice: number;
  maxPrice: number;
  surveyTopic: string;
  successCriteria: string;
}

function AdminPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<SurveyConfig>({
    minPrice: 0,
    maxPrice: 1000,
    surveyTopic: "",
    successCriteria: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof SurveyConfig, string>>
  >({});
  const [isCreating, setIsCreating] = useState(false);
  const [existingSurveys, setExistingSurveys] = useState<any[]>([]);

  useEffect(() => {
    loadExistingSurveys();
  }, []);

  const loadExistingSurveys = async () => {
    try {
      const response = await fetch('http://localhost:8000/surveys');
      if (response.ok) {
        const surveys = await response.json();
        setExistingSurveys(surveys);
      }
    } catch (error) {
      console.error('Error loading surveys:', error);
    }
  };

  const handleInputChange = (
    field: keyof SurveyConfig,
    value: string | number
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SurveyConfig, string>> = {};

    if (config.minPrice < 0) {
      newErrors.minPrice = "Minimum price cannot be negative";
    }

    if (config.maxPrice <= config.minPrice) {
      newErrors.maxPrice = "Maximum price must be greater than minimum price";
    }

    if (!config.surveyTopic.trim()) {
      newErrors.surveyTopic = "Survey topic is required";
    }

    if (config.surveyTopic.trim().length < 10) {
      newErrors.surveyTopic = "Survey topic must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateSurvey = async () => {
    if (!validateForm()) {
      return;
    }

    setIsCreating(true);

    try {
      // Parse questions from text (one per line)
      const questions = config.surveyTopic
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 0);

      if (questions.length === 0) {
        alert("Please enter at least one question");
        setIsCreating(false);
        return;
      }

      // Simple default criteria
      const criteria = [
        {
          name: "Response Quality",
          weight: 0.5,
          description: "Detailed and thoughtful responses"
        },
        {
          name: "Relevance",
          weight: 0.3,
          description: "Stayed on topic and answered questions"
        },
        {
          name: "Actionability",
          weight: 0.2,
          description: "Provided actionable feedback"
        }
      ];

      // Create survey directly
      const survey = await apiService.createSurvey({
        title: questions[0].substring(0, 100), // Use first question as title
        questions: questions,
        criteria: criteria,
        price_range: {
          min_amount: config.minPrice,
          max_amount: config.maxPrice,
        },
      });

      console.log("Survey created:", survey);

      // Navigate to user experience with survey ID
      navigate("/user", {
        state: {
          surveyId: survey.survey_id,
          config: {
            minPrice: config.minPrice,
            maxPrice: config.maxPrice,
            surveyTopic: questions.join(', '),
          },
        },
      });
    } catch (error) {
      console.error("Error creating survey:", error);
      alert(
        `Failed to create survey: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-card">
        <div className="admin-header">
          <h1>AI Feedback Builder</h1>
          <p className="subtitle">Configure your survey settings</p>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="minPrice" className="form-label">
              Minimum Price ($)
            </label>
            <input
              id="minPrice"
              type="number"
              className={`form-input ${errors.minPrice ? "error" : ""}`}
              value={config.minPrice}
              onChange={(e) =>
                handleInputChange("minPrice", parseFloat(e.target.value) || 0)
              }
              min="0"
              step="0.01"
              placeholder="0.00"
            />
            {errors.minPrice && (
              <span className="error-message">{errors.minPrice}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="maxPrice" className="form-label">
              Maximum Price ($)
            </label>
            <input
              id="maxPrice"
              type="number"
              className={`form-input ${errors.maxPrice ? "error" : ""}`}
              value={config.maxPrice}
              onChange={(e) =>
                handleInputChange("maxPrice", parseFloat(e.target.value) || 0)
              }
              min="0"
              step="0.01"
              placeholder="1000.00"
            />
            {errors.maxPrice && (
              <span className="error-message">{errors.maxPrice}</span>
            )}
          </div>

          <div className="price-range-display">
            <span className="range-label">Price Range:</span>
            <span className="range-value">
              ${config.minPrice.toFixed(2)} - ${config.maxPrice.toFixed(2)}
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="surveyTopic" className="form-label">
              What questions do you want to ask the user?
            </label>
            <textarea
              id="surveyTopic"
              className={`form-textarea ${errors.surveyTopic ? "error" : ""}`}
              value={config.surveyTopic}
              onChange={(e) => handleInputChange("surveyTopic", e.target.value)}
              placeholder="Enter your questions, one per line:

How would you rate our product out of 10?
What features do you want to see?
What problems did you face?"
              rows={5}
            />
            {errors.surveyTopic && (
              <span className="error-message">{errors.surveyTopic}</span>
            )}
            <div className="char-count">
              {config.surveyTopic.length} characters
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="successCriteria" className="form-label">
              What does the success criteria look like?
            </label>
            <textarea
              id="successCriteria"
              className={`form-textarea ${
                errors.successCriteria ? "error" : ""
              }`}
              value={config.successCriteria}
              onChange={(e) =>
                handleInputChange("successCriteria", e.target.value)
              }
              placeholder="Describe what success looks like for this survey. For example: 'learn how users use our tool` `specific examples of how people use our product` `general feedback on what problems they faced on thier development` `speific or broad`  or 'Identify top 3 improvement areas'..."
              rows={5}
            />
            {errors.successCriteria && (
              <span className="error-message">{errors.successCriteria}</span>
            )}
            <div className="char-count">
              {config.successCriteria.length} characters
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            className="next-button"
            onClick={handleCreateSurvey}
            disabled={!config.surveyTopic.trim() || isCreating}
          >
            {isCreating ? "Creating..." : "Create Feedback form"}
          </button>
        </div>

        {/* Existing Surveys */}
        {existingSurveys.length > 0 && (
          <div style={{ marginTop: "3rem", borderTop: "1px solid #e2e8f0", paddingTop: "2rem" }}>
            <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem", color: "#2d3748" }}>
              Existing Surveys
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {existingSurveys.map((survey) => (
                <div
                  key={survey.survey_id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "white",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: "#2d3748", marginBottom: "0.25rem" }}>
                      {survey.title}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#718096" }}>
                      {survey.questions?.length || 0} questions • Created {new Date(survey.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      className="secondary-button"
                      onClick={() => navigate(`/insights/${survey.survey_id}`)}
                      style={{
                        padding: "0.5rem 1rem",
                        fontSize: "0.875rem",
                        background: "white",
                        border: "2px solid #667eea",
                        color: "#667eea",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      View Insights
                    </button>
                    <button
                      className="next-button"
                      onClick={() => navigate("/user", { state: { surveyId: survey.survey_id } })}
                      style={{
                        padding: "0.5rem 1rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      Test Survey
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
