from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime, timezone

from ..auth import get_current_wallet, require_moderator
from ..database import supabase
from ..models import (
    SubmissionCreate,
    SubmissionReview,
    SubmissionResponse,
    DistributionRecord,
    DistributionResponse,
)

router = APIRouter()


@router.get("/mine", response_model=List[SubmissionResponse])
async def my_submissions(user: dict = Depends(get_current_wallet)):
    """Get all submissions for the current wallet."""
    result = (
        supabase.table("submissions")
        .select("*, activities(title, token_reward)")
        .eq("wallet_address", user["wallet_address"])
        .order("created_at", desc=True)
        .execute()
    )
    # Flatten the joined activity data
    submissions = []
    for row in result.data:
        activity_data = row.pop("activities", None)
        if activity_data:
            row["activity_title"] = activity_data.get("title")
            row["token_reward"] = activity_data.get("token_reward")
        submissions.append(row)
    return submissions


@router.get("/pending", response_model=List[SubmissionResponse])
async def pending_submissions(user: dict = Depends(require_moderator)):
    """Get all pending submissions (moderators only)."""
    result = (
        supabase.table("submissions")
        .select("*, activities(title, token_reward)")
        .eq("status", "pending")
        .order("created_at", desc=False)
        .execute()
    )
    submissions = []
    for row in result.data:
        activity_data = row.pop("activities", None)
        if activity_data:
            row["activity_title"] = activity_data.get("title")
            row["token_reward"] = activity_data.get("token_reward")
        submissions.append(row)
    return submissions


@router.get("/all", response_model=List[SubmissionResponse])
async def all_submissions(
    status: Optional[str] = None,
    user: dict = Depends(require_moderator),
):
    """Get all submissions, optionally filtered by status (moderators only)."""
    query = (
        supabase.table("submissions")
        .select("*, activities(title, token_reward)")
        .order("created_at", desc=True)
    )
    if status:
        query = query.eq("status", status)
    result = query.execute()

    submissions = []
    for row in result.data:
        activity_data = row.pop("activities", None)
        if activity_data:
            row["activity_title"] = activity_data.get("title")
            row["token_reward"] = activity_data.get("token_reward")
        submissions.append(row)
    return submissions


@router.post("/", response_model=SubmissionResponse)
async def create_submission(
    body: SubmissionCreate,
    user: dict = Depends(get_current_wallet),
):
    """Submit proof for an activity."""
    # Verify the activity exists and is active
    activity = (
        supabase.table("activities")
        .select("id, is_active")
        .eq("id", body.activity_id)
        .execute()
    )
    if not activity.data:
        raise HTTPException(status_code=404, detail="Activity not found")
    if not activity.data[0]["is_active"]:
        raise HTTPException(status_code=400, detail="Activity is no longer active")

    data = {
        "activity_id": body.activity_id,
        "wallet_address": user["wallet_address"],
        "proof_text": body.proof_text,
        "proof_url": body.proof_url,
        "status": "pending",
    }
    result = supabase.table("submissions").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create submission")
    return result.data[0]


@router.patch("/{submission_id}/review", response_model=SubmissionResponse)
async def review_submission(
    submission_id: str,
    body: SubmissionReview,
    user: dict = Depends(require_moderator),
):
    """Approve or reject a submission (moderators only)."""
    # Check submission exists and is pending
    existing = (
        supabase.table("submissions")
        .select("*")
        .eq("id", submission_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Submission not found")
    if existing.data[0]["status"] != "pending":
        raise HTTPException(status_code=400, detail="Submission already reviewed")

    update_data = {
        "status": body.status,
        "reviewer_wallet": user["wallet_address"],
        "review_note": body.review_note,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
    }
    result = (
        supabase.table("submissions")
        .update(update_data)
        .eq("id", submission_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update submission")
    return result.data[0]


@router.post("/distribution", response_model=DistributionResponse)
async def record_distribution(
    body: DistributionRecord,
    user: dict = Depends(require_moderator),
):
    """
    Record a token distribution after the moderator signs the on-chain transfer.
    Called by the frontend after the wallet transaction succeeds.
    """
    data = {
        "submission_id": body.submission_id,
        "from_wallet": body.from_wallet,
        "to_wallet": body.to_wallet,
        "amount": body.amount,
        "tx_signature": body.tx_signature,
    }
    result = supabase.table("token_distributions").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to record distribution")
    return result.data[0]


@router.get("/distributions", response_model=List[DistributionResponse])
async def list_distributions(user: dict = Depends(require_moderator)):
    """List all token distributions (moderators only)."""
    result = (
        supabase.table("token_distributions")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data
