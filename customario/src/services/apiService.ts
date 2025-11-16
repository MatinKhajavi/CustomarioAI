/**
 * API Service for connecting frontend to backend
 * Handles all communication with the CustomarioAI backend
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface PriceRange {
  min_amount: number;
  max_amount: number;
}

export interface Criteria {
  name: string;
  description: string;
  weight: number;
}

export interface Survey {
  survey_id: string;
  title: string;
  questions: string[];
  criteria: Criteria[];
  price_range: PriceRange;
  created_at: string;
}

export interface SurveyCreateRequest {
  title: string;
  questions: string[];
  criteria: Criteria[];
  price_range: PriceRange;
}

export interface Session {
  session_id: string;
  survey_id: string;
  status: string;
  context?: string;
  transcript?: string;
  evaluation_score?: number;
  evaluation_notes?: string;
  payment_amount?: number;
  payment_status?: string;
  created_at: string;
  completed_at?: string;
}

export interface StartSessionResponse {
  session_id: string;
  room_name: string;
  context: string;
  questions: string[];
  status: string;
  livekit_token?: string;
  livekit_url?: string;
}

export interface CompleteSessionResponse {
  session_id: string;
  score: number;
  payment_amount: number;
  payment_status: string;
  transaction_id: string;
  evaluation_notes: string;
  message: string;
}

export interface GenerateContextRequest {
  survey_topic: string;
  success_criteria: string;
  price_range: PriceRange;
}

export interface GeneratedContext {
  questions: string[];
  criteria: Criteria[];
}

class ApiService {
  /**
   * Generate survey context (questions and criteria) using targeting agent
   */
  async generateContext(
    request: GenerateContextRequest
  ): Promise<GeneratedContext> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-context`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.detail || "Failed to generate survey context"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Generate context error:", error);
      throw error;
    }
  }

  /**
   * Create a new survey
   */
  async createSurvey(data: SurveyCreateRequest): Promise<Survey> {
    try {
      const response = await fetch(`${API_BASE_URL}/survey/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create survey");
      }

      return await response.json();
    } catch (error) {
      console.error("Create survey error:", error);
      throw error;
    }
  }

  /**
   * Get survey by ID
   */
  async getSurvey(surveyId: string): Promise<Survey> {
    try {
      const response = await fetch(`${API_BASE_URL}/survey/${surveyId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to get survey");
      }

      return await response.json();
    } catch (error) {
      console.error("Get survey error:", error);
      throw error;
    }
  }

  /**
   * Start a feedback session
   */
  async startSession(surveyId: string): Promise<StartSessionResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/survey/${surveyId}/session/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to start session");
      }

      return await response.json();
    } catch (error) {
      console.error("Start session error:", error);
      throw error;
    }
  }

  /**
   * Complete a feedback session
   */
  async completeSession(
    sessionId: string,
    transcript: string
  ): Promise<CompleteSessionResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/session/${sessionId}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transcript }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to complete session");
      }

      return await response.json();
    } catch (error) {
      console.error("Complete session error:", error);
      throw error;
    }
  }

  /**
   * Get session details
   */
  async getSession(sessionId: string): Promise<Session> {
    try {
      const response = await fetch(`${API_BASE_URL}/session/${sessionId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to get session");
      }

      return await response.json();
    } catch (error) {
      console.error("Get session error:", error);
      throw error;
    }
  }
}

export const apiService = new ApiService();

