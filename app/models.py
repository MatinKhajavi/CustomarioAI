from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum


class PriceRange(BaseModel):
    min_amount: float = Field(..., description="Minimum payment amount")
    max_amount: float = Field(..., description="Maximum payment amount")


class Criteria(BaseModel):
    name: str = Field(..., description="Criteria name")
    description: str = Field(..., description="What to evaluate")
    weight: float = Field(default=1.0, description="Weight in scoring (0-1)")


class Survey(BaseModel):
    survey_id: str = Field(..., description="Unique survey identifier")
    title: str = Field(..., description="Survey title")
    questions: List[str] = Field(..., description="List of questions to ask")
    criteria: List[Criteria] = Field(..., description="Evaluation criteria")
    price_range: PriceRange = Field(..., description="Payment range")
    created_at: datetime = Field(default_factory=datetime.now)


class SessionStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class Session(BaseModel):
    session_id: str = Field(..., description="Unique session identifier")
    survey_id: str = Field(..., description="Related survey ID")
    status: SessionStatus = Field(default=SessionStatus.PENDING)
    context: Optional[str] = Field(None, description="Context from targeting agent")
    transcript: Optional[str] = Field(None, description="Voice conversation transcript")
    evaluation_score: Optional[float] = Field(None, description="Score from evaluation agent")
    evaluation_notes: Optional[str] = Field(None, description="Notes from evaluation")
    payment_amount: Optional[float] = Field(None, description="Calculated payment amount")
    payment_status: Optional[str] = Field(None, description="Payment status")
    insights: Optional[str] = Field(None, description="Insights from researcher agent")
    created_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None


class SurveyCreate(BaseModel):
    title: str
    questions: List[str]
    criteria: List[Criteria]
    price_range: PriceRange


class SessionCreate(BaseModel):
    survey_id: str


class InsightsResponse(BaseModel):
    survey_id: str
    total_sessions: int
    average_score: float
    average_payment: float
    key_insights: str
    sessions: List[Session]

