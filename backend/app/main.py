import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .routes import activities, submissions, moderators
from .auth import verify_wallet_signature, create_jwt, check_is_moderator
from .models import AuthRequest, AuthResponse

SOLANA_RPC_URL = os.getenv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com")
TOKEN_MINT = os.getenv("TOKEN_MINT", "TLGkmTbAUVPyXiCM8e67h9WnDLRiGRo8LAfGvPt6Awz")

app = FastAPI(title="Blockchain Club API", version="1.0.0")

# CORS - allow the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(activities.router, prefix="/api/activities", tags=["Activities"])
app.include_router(submissions.router, prefix="/api/submissions", tags=["Submissions"])
app.include_router(moderators.router, prefix="/api/moderators", tags=["Moderators"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "Blockchain Club API"}


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(req: AuthRequest):
    """
    Wallet-based login:
    1. Frontend has the user sign a message with their Solana wallet.
    2. This endpoint verifies the signature matches the wallet address.
    3. Returns a JWT for subsequent API calls.
    """
    valid = verify_wallet_signature(req.wallet_address, req.signature, req.message)
    if not valid:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Invalid wallet signature")

    is_mod = check_is_moderator(req.wallet_address)
    token = create_jwt(req.wallet_address, is_mod)

    return AuthResponse(
        token=token,
        wallet_address=req.wallet_address,
        is_moderator=is_mod,
    )


@app.get("/api/balance/{wallet_address}")
async def get_token_balance(wallet_address: str):
    """
    Proxy endpoint to fetch SPL token balance from Solana RPC.
    This avoids CORS issues with the public Solana RPC when called from a browser.
    """
    # Build the JSON-RPC request to get token accounts by owner
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getTokenAccountsByOwner",
        "params": [
            wallet_address,
            {"mint": TOKEN_MINT},
            {"encoding": "jsonParsed"},
        ],
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(SOLANA_RPC_URL, json=payload, timeout=10.0)
            data = resp.json()

        if "error" in data:
            raise HTTPException(status_code=502, detail=f"Solana RPC error: {data['error']}")

        accounts = data.get("result", {}).get("value", [])
        if not accounts:
            return {"wallet_address": wallet_address, "balance": 0, "mint": TOKEN_MINT}

        # Extract the parsed token balance
        token_info = accounts[0]["account"]["data"]["parsed"]["info"]
        ui_amount = token_info["tokenAmount"]["uiAmount"]

        return {
            "wallet_address": wallet_address,
            "balance": ui_amount if ui_amount is not None else 0,
            "mint": TOKEN_MINT,
        }
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Failed to reach Solana RPC: {str(e)}")
