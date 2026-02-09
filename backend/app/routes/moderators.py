from fastapi import APIRouter, Depends, HTTPException

from ..auth import get_current_wallet, require_moderator
from ..database import supabase
from ..models import ModeratorCheck

router = APIRouter()


@router.get("/check", response_model=ModeratorCheck)
async def check_moderator_status(user: dict = Depends(get_current_wallet)):
    """Check if the current wallet is a moderator."""
    return ModeratorCheck(
        is_moderator=user["is_moderator"],
        wallet_address=user["wallet_address"],
    )


@router.get("/")
async def list_moderators(user: dict = Depends(require_moderator)):
    """List all moderators (moderators only)."""
    result = (
        supabase.table("moderators")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.post("/")
async def add_moderator(
    wallet_address: str,
    name: str = "Moderator",
    user: dict = Depends(require_moderator),
):
    """Add a new moderator wallet (moderators only)."""
    # Check if already exists
    existing = (
        supabase.table("moderators")
        .select("id")
        .eq("wallet_address", wallet_address)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=400, detail="Wallet is already a moderator")

    result = (
        supabase.table("moderators")
        .insert({"wallet_address": wallet_address, "name": name})
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to add moderator")
    return result.data[0]


@router.delete("/{wallet_address}")
async def remove_moderator(
    wallet_address: str,
    user: dict = Depends(require_moderator),
):
    """Remove a moderator (moderators only). Cannot remove yourself."""
    if wallet_address == user["wallet_address"]:
        raise HTTPException(status_code=400, detail="Cannot remove yourself as moderator")

    result = (
        supabase.table("moderators")
        .delete()
        .eq("wallet_address", wallet_address)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Moderator not found")
    return {"message": "Moderator removed", "wallet_address": wallet_address}
