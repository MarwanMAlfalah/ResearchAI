# ResearchGraph AI

ResearchGraph AI is a full-stack academic prototype for intelligent research discovery using ontology, knowledge graphs, and explainable AI recommendations.

## Monorepo Structure

- `backend/`: FastAPI API, graph integration, AI/ML pipeline modules
- `frontend/`: React + TypeScript UI for search, recommendations, analytics, and graph exploration
- `data/`: Local seed datasets and static assets
- `docs/`: Architecture notes, design decisions, and technical documentation
- `scripts/`: Utility scripts for setup, data loading, and development workflows

## Setup

### Backend (FastAPI)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

API base URL: `http://localhost:8000`  
Health endpoint: `http://localhost:8000/api/v1/health`

Alternative run command:

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (React + Vite)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Default frontend URL: `http://localhost:5173`

## Status

Initial scaffold is in place. Business logic modules are intentionally placeholders.
