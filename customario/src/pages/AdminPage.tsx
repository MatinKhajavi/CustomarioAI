import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const handleNext = () => {
    if (validateForm()) {
      // Save config and navigate to user experience
      console.log("Configuration saved:", config);
      // Pass config to user experience page
      navigate("/user", {
        state: { config },
      });
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
              What is the survey about?
            </label>
            <textarea
              id="surveyTopic"
              className={`form-textarea ${errors.surveyTopic ? "error" : ""}`}
              value={config.surveyTopic}
              onChange={(e) => handleInputChange("surveyTopic", e.target.value)}
              placeholder="Describe what this survey will focus on. For example: 'Customer satisfaction with our new product features' or 'Employee feedback on workplace culture'..."
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
            onClick={handleNext}
            disabled={!config.surveyTopic.trim()}
          >
            Start Feedback Session
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
