from fastapi import APIRouter, Depends, HTTPException
from typing import List

from ..auth import get_current_wallet, require_moderator
from ..database import supabase
from ..models import ActivityCreate, ActivityUpdate, ActivityResponse

router = APIRouter()


@router.get("/", response_model=List[ActivityResponse])
async def list_activities(active_only: bool = True):
    """List all activities. By default only active ones are returned."""
    query = supabase.table("activities").select("*").order("created_at", desc=True)
    if active_only:
        query = query.eq("is_active", True)
    result = query.execute()
    return result.data


@router.get("/{activity_id}", response_model=ActivityResponse)
async def get_activity(activity_id: str):
    """Get a single activity by ID."""
    result = (
        supabase.table("activities")
        .select("*")
        .eq("id", activity_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Activity not found")
    return result.data[0]


@router.post("/", response_model=ActivityResponse)
async def create_activity(
    body: ActivityCreate,
    user: dict = Depends(require_moderator),
):
    """Create a new activity (moderators only)."""
    data = {
        "title": body.title,
        "description": body.description,
        "token_reward": body.token_reward,
        "category": body.category,
        "created_by": user["wallet_address"],
    }
    result = supabase.table("activities").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create activity")
    return result.data[0]


@router.patch("/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: str,
    body: ActivityUpdate,
    user: dict = Depends(require_moderator),
):
    """Update an activity (moderators only)."""
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        supabase.table("activities")
        .update(update_data)
        .eq("id", activity_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Activity not found")
    return result.data[0]


@router.delete("/{activity_id}")
async def delete_activity(
    activity_id: str,
    user: dict = Depends(require_moderator),
):
    """Soft-delete an activity by deactivating it (moderators only)."""
    result = (
        supabase.table("activities")
        .update({"is_active": False})
        .eq("id", activity_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {"message": "Activity deactivated", "id": activity_id}
