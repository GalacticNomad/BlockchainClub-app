import os
import time
import base64
from typing import Optional

from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError
from jose import jwt, JWTError
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .database import supabase

JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret-key")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

security = HTTPBearer()


def verify_wallet_signature(wallet_address: str, signature: str, message: str) -> bool:
    """
    Verify that a Solana wallet signed the given message.
    The signature and message come from the frontend wallet adapter.
    """
    try:
        # Decode the base58 wallet address (public key)
        from solders.pubkey import Pubkey
        pubkey = Pubkey.from_string(wallet_address)
        pubkey_bytes = bytes(pubkey)

        # Decode the signature from base58
        import base58
        sig_bytes = base58.b58decode(signature)

        # The message is UTF-8 encoded
        message_bytes = message.encode("utf-8")

        # Verify using ed25519 (NaCl)
        verify_key = VerifyKey(pubkey_bytes)
        verify_key.verify(message_bytes, sig_bytes)
        return True
    except (BadSignatureError, Exception):
        return False


def create_jwt(wallet_address: str, is_moderator: bool) -> str:
    """Create a JWT token for an authenticated wallet."""
    payload = {
        "sub": wallet_address,
        "is_moderator": is_moderator,
        "iat": int(time.time()),
        "exp": int(time.time()) + (JWT_EXPIRY_HOURS * 3600),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_wallet(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """FastAPI dependency: extracts wallet address from JWT Bearer token."""
    payload = decode_jwt(credentials.credentials)
    return {
        "wallet_address": payload["sub"],
        "is_moderator": payload.get("is_moderator", False),
    }


async def require_moderator(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """FastAPI dependency: requires the caller to be a moderator."""
    payload = decode_jwt(credentials.credentials)
    if not payload.get("is_moderator", False):
        raise HTTPException(status_code=403, detail="Moderator access required")
    return {
        "wallet_address": payload["sub"],
        "is_moderator": True,
    }


def check_is_moderator(wallet_address: str) -> bool:
    """Check if a wallet address is in the moderators table."""
    result = (
        supabase.table("moderators")
        .select("id")
        .eq("wallet_address", wallet_address)
        .execute()
    )
    return len(result.data) > 0
