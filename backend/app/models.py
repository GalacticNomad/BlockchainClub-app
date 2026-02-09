from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ---- Auth ----

class AuthRequest(BaseModel):
    wallet_address: str
    signature: str
    message: str


class AuthResponse(BaseModel):
    token: str
    wallet_address: str
    is_moderator: bool


# ---- Activities ----

class ActivityCreate(BaseModel):
    title: str
    description: str = ""
    token_reward: int = Field(ge=0)
    category: str = "general"


class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    token_reward: Optional[int] = Field(default=None, ge=0)
    category: Optional[str] = None
    is_active: Optional[bool] = None


class ActivityResponse(BaseModel):
    id: str
    title: str
    description: str
    token_reward: int
    category: str
    is_active: bool
    created_by: str
    created_at: str


# ---- Submissions ----

class SubmissionCreate(BaseModel):
    activity_id: str
    proof_text: str = ""
    proof_url: Optional[str] = None


class SubmissionReview(BaseModel):
    status: str = Field(pattern=r"^(approved|rejected)$")
    review_note: Optional[str] = None


class SubmissionResponse(BaseModel):
    id: str
    activity_id: str
    wallet_address: str
    proof_text: str
    proof_url: Optional[str]
    status: str
    reviewer_wallet: Optional[str]
    review_note: Optional[str]
    created_at: str
    reviewed_at: Optional[str]
    activity_title: Optional[str] = None
    token_reward: Optional[int] = None


# ---- Token Distribution ----

class DistributionRecord(BaseModel):
    submission_id: str
    from_wallet: str
    to_wallet: str
    amount: int
    tx_signature: str


class DistributionResponse(BaseModel):
    id: str
    submission_id: str
    from_wallet: str
    to_wallet: str
    amount: int
    tx_signature: str
    created_at: str


# ---- Moderators ----

class ModeratorCheck(BaseModel):
    is_moderator: bool
    wallet_address: str
