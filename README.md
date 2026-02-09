# Blockchain Club Web App

A web application for the Blockchain Club that lets members earn tokens by completing club activities, with moderator-managed approvals and semi-automated on-chain token distribution on Solana.

## Features

- **Solana Wallet Login** -- Connect with Phantom, Solflare, or any Solana wallet. No passwords needed.
- **Token Balance Display** -- See your club token balance (mint: `TLGkmTbAUVPyXiCM8e67h9WnDLRiGRo8LAfGvPt6Awz`).
- **Activity Dashboard** -- Browse available club activities (social media, events, contributions, etc.) and submit proof to earn tokens.
- **Submission Tracking** -- Track the status of your submissions (pending, approved, rejected).
- **Moderator Panel** -- Restricted to whitelisted wallets. Moderators can create/edit activities, review submissions, and distribute tokens.
- **Semi-Automated Token Distribution** -- When a moderator approves a submission, the browser builds a token transfer transaction that the moderator signs with their wallet. No private keys stored on the server.

## Tech Stack

| Layer    | Technology                                       |
| -------- | ------------------------------------------------ |
| Frontend | React 18, Vite, TailwindCSS, Solana Wallet Adapter |
| Backend  | Python 3.11+, FastAPI, Pydantic                  |
| Database | Supabase (hosted PostgreSQL)                     |
| Chain    | Solana (SPL Token transfers)                     |

## Project Structure

```
BlockchainClub/
  frontend/           React app (Vite)
    src/
      components/     Reusable UI components
      pages/          Home, Dashboard, ModDashboard
      utils/          Solana helpers, API client, auth
  backend/            Python API (FastAPI)
    app/
      routes/         API route handlers
      auth.py         Wallet signature verification + JWT
      database.py     Supabase client
      models.py       Pydantic request/response models
      main.py         FastAPI app entry point
  supabase_migration.sql   Database schema
```

## Setup

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a free project.
2. Open the **SQL Editor** in the Supabase dashboard.
3. Copy the contents of `supabase_migration.sql` and run it to create all tables.
4. **Add yourself as a moderator**: In the SQL Editor, run:
   ```sql
   INSERT INTO moderators (wallet_address, name)
   VALUES ('YOUR_SOLANA_WALLET_ADDRESS', 'Admin');
   ```
5. (Optional) Seed some sample activities by uncommenting the INSERT at the bottom of the migration file (replace `YOUR_WALLET_ADDRESS_HERE` with your actual wallet address).

### 2. Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env from the example
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
```

Edit `backend/.env` and fill in your Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key
JWT_SECRET=pick-a-random-secret-string
```

You can find the URL and anon key in your Supabase dashboard under **Settings > API**.

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env from the example
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VITE_TOKEN_MINT=TLGkmTbAUVPyXiCM8e67h9WnDLRiGRo8LAfGvPt6Awz
```

Start the frontend:

```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

## How It Works

### For Members

1. Visit the app and click **"Select Wallet"** to connect your Solana wallet.
2. Sign the authentication message when prompted.
3. Browse activities on the **Dashboard** and click **"Submit Proof"** to submit evidence of your contribution.
4. Track your submissions under the **"My Submissions"** tab.

### For Moderators

1. Connect your whitelisted wallet -- the **"Mod Panel"** link will appear in the navbar.
2. Review pending submissions under **"Pending Submissions"**.
3. Click **"Approve & Send"** to approve a submission. This will:
   - Build an SPL token transfer transaction
   - Ask you to sign it in your wallet (Phantom/Solflare popup)
   - Send the tokens on-chain to the member
   - Record the transaction in the database
4. Click **"Reject"** to decline a submission with an optional note.
5. Use **"Activity Manager"** to create, activate, or deactivate club activities.
6. View all past distributions under **"Distribution History"** with links to Solscan.

## Environment Variables

### Backend (`backend/.env`)

| Variable       | Description                          |
| -------------- | ------------------------------------ |
| `SUPABASE_URL` | Your Supabase project URL            |
| `SUPABASE_KEY` | Your Supabase anon (public) key      |
| `JWT_SECRET`   | Random string for signing JWT tokens |

### Frontend (`frontend/.env`)

| Variable              | Description                                    |
| --------------------- | ---------------------------------------------- |
| `VITE_API_URL`        | Backend URL (default: `http://localhost:8000`)  |
| `VITE_SOLANA_RPC_URL` | Solana RPC endpoint                            |
| `VITE_TOKEN_MINT`     | Your club token's mint address                 |

## Deployment Notes

- **Frontend**: Can be deployed to Vercel, Netlify, or any static hosting. Run `npm run build` and deploy the `dist/` folder.
- **Backend**: Can be deployed to Railway, Render, Fly.io, or any platform that supports Python. Make sure to set the environment variables.
- When deploying, update the CORS origins in `backend/app/main.py` to include your production frontend URL.
- Update `VITE_API_URL` in the frontend to point to your production backend URL.
