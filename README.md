# ResearchGraph AI
**Ontology-guided research discovery with explainable graph-aware recommendations.**

## 1. Project Overview
ResearchGraph AI is a full-stack academic prototype for research discovery and guidance. It combines OpenAlex ingestion, Neo4j knowledge graph storage, embedding-based ranking, explainable recommendation scoring, skill-gap analysis, and an interactive advisor + graph explorer interface.

## 2. Problem Statement
Research exploration is often fragmented across multiple tools:
- paper search is disconnected from personal research context
- recommendation outputs are difficult to explain and trust
- skill development priorities are not surfaced clearly
- graph relationships between papers, topics, skills, and authors are underused

## 3. Core Idea / Solution
Model research entities in a knowledge graph and rank papers with transparent, multi-signal scoring:
- semantic similarity between user interests and paper text embeddings
- graph centrality signal (with robust fallback when citation edges are sparse)
- recency signal based on publication year

Then expose explainable outputs and actionable guidance through recommendation cards, skill-gap summaries, advisor responses, and graph exploration.

## 4. Implemented Features
- User profile create/update/read (`name`, `interests_text`, `skills`) with stored interest embeddings
- OpenAlex paper search with normalized response schema
- Direct paper import by OpenAlex ID and batch import
- Neo4j upsert for `Paper`, `Author`, `Topic`, `UserProfile`, `Skill` nodes and active relationships
- Explained recommendations with:
  - semantic similarity
  - graph centrality
  - recency
  - final weighted score
  - signal-level explanation + evidence fields
- Backend skill-gap endpoint with deterministic evidence-based outputs
- Advisor chat endpoint for focused research guidance (deterministic intent routing)
- Graph Explorer page (Cytoscape.js) with filtering, selection, details, and interaction controls

## 5. Architecture Summary
- **Frontend (React + TypeScript + Tailwind):** page-driven user workflows with shared active user context
- **Backend (FastAPI):** router-based API orchestration, validation, and error handling
- **Services layer:** profile, ingestion, recommendation, explainability, skill-gap, advisor logic
- **Graph layer (Neo4j):** canonical entity and relationship storage for retrieval/scoring
- **Ontology layer (OWLReady2 + RDFLib):** formal domain schema definition and export

## 6. Backend Capabilities
Implemented API surface (prefix: `/api/v1`):
- `GET /health`
- `GET /health/neo4j`
- `GET /search/papers`
- `POST /import/paper`
- `POST /import/paper/{openalex_id}`
- `POST /import/papers/by-id`
- `POST /user/profile`
- `GET /user/profile/{id}`
- `GET /recommend/papers/semantic`
- `GET /recommend/papers/scored`
- `GET /recommend/papers/explained`
- `GET /skill-gap`
- `POST /advisor/chat`

Additional implemented backend behavior:
- FastAPI startup/shutdown Neo4j connection lifecycle
- centralized configuration via environment variables
- OpenAlex timeout/error handling
- paper + user embedding generation via sentence-transformers
- centrality fallback to normalized `cited_by_count` when `CITES` edges are unavailable

## 7. Frontend Capabilities
Implemented pages:
- **Profile:** load/save profile and skills
- **Search & Import:** search OpenAlex and import selected papers
- **Recommendations:** scored + explained recommendation cards with evidence
- **Skill Gap:** backend-driven strengths, missing skills, and suggested next skills
- **Advisor:** interactive guidance over existing profile/recommendation/skill-gap context
- **Graph Explorer:** interactive knowledge graph view with type filters and node details

Shared UX capabilities:
- active user context in top navigation
- prefilled user-aware forms across pages
- consistent loading/empty/error/success state handling

## 8. Recommendation Pipeline
1. User profile stores interest text and embedding.
2. Paper ingestion stores paper embedding from `title + abstract` (title fallback).
3. Candidate papers are scored with three signals:
   - semantic similarity
   - graph centrality
   - recency
4. Final score combines configurable weights:
   - `final = alpha * semantic + beta * centrality + gamma * recency`
5. Explainability layer adds:
   - `top_contributing_signals`
   - deterministic `explanation_text`
   - structured evidence fields (publication year, cited count, centrality source, embedding model, strength buckets)

## 9. Skill Gap Analysis
`GET /api/v1/skill-gap` computes a deterministic, backend-owned skill-gap view using:
- user profile + current skills
- explained/scored recommendation outputs
- recommendation evidence signals

Response includes:
- `current_skills`
- `missing_skills` (with confidence + supporting papers)
- `suggested_next_skills`
- `strengths`
- `gaps_summary`

## 10. Advisor Chat
`POST /api/v1/advisor/chat` provides lightweight research-advisor responses using existing system data only (no external LLM APIs).

Currently supported intent families:
- explain recommendations
- what to learn next
- where to start first
- summarize profile and direction
- compare top recommendations

The endpoint returns:
- `detected_intent`
- concise `answer`
- optional `supporting_items`

## 11. Graph Explorer
The Graph Explorer page uses Cytoscape.js to present an interactive graph over real backend data.

Current capabilities:
- node color coding by type (`UserProfile`, `Skill`, `Paper`, `Topic`, `Author`)
- type filters and legend
- click-to-focus neighborhood highlighting
- fade-out of non-relevant elements on selection
- fit/reset view and reset selection controls
- node detail panel with metadata

Note: graph rendering is currently composed from existing backend endpoints (profile/recommendation/skill-gap/search), not from a dedicated graph API endpoint yet.

## 12. Knowledge Graph + Ontology Role
Ontology defines core research entities and relations (e.g., `Paper`, `Author`, `Topic`, `Skill`, `UserProfile`).

Neo4j stores the operational graph used by current features, including profile-skill links and paper-author-topic structures, with recommendation-related embedding and scoring metadata.

## 13. Project Structure Overview
```text
ResearcherAI/
├─ backend/
│  ├─ app/
│  │  ├─ api/              # API router registration
│  │  ├─ routers/          # FastAPI endpoint modules
│  │  ├─ services/         # Profile, ingestion, skill-gap, advisor services
│  │  ├─ recommendation/   # Semantic/scored/explained recommendation logic
│  │  ├─ data_ingestion/   # OpenAlex client + normalization
│  │  ├─ db/               # Neo4j client and schema initialization
│  │  ├─ ontology/         # Ontology schema + OWL export tools
│  │  ├─ ai/               # Embedding and extraction modules
│  │  ├─ models/           # Pydantic models
│  │  └─ core/             # Settings/config
│  ├─ requirements.txt
│  ├─ .env.example
│  └─ run.py
├─ frontend/
│  ├─ src/
│  │  ├─ app/              # App shell + navigation + shared active user flow
│  │  ├─ pages/            # Profile, Search, Recommendations, Skill Gap, Advisor, Graph Explorer
│  │  ├─ features/         # Feature modules, APIs, components
│  │  ├─ services/         # Shared frontend API config
│  │  └─ styles/           # Tailwind styles
│  ├─ .env.example
│  └─ package.json
├─ data/
├─ docs/
└─ scripts/
```

## 14. Local Setup Instructions
### Prerequisites
- Python 3.11+
- Node.js 18+
- Neo4j Community (local)

### Clone
```bash
git clone <your-repo-url>
cd ResearcherAI
```

## 15. Backend Run Instructions
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set Neo4j credentials in `.env`, then run:
```bash
python run.py
```
or:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend base URL: `http://localhost:8000`

## 16. Frontend Run Instructions
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## 17. Demo Flow
1. **Create or load profile** on Profile page (`user_id`, name, interests, skills)
2. **Search and import papers** from OpenAlex on Search page
3. **View explained recommendations** on Recommendations page
4. **Inspect skill gaps** on Skill Gap page
5. **Interact with Advisor** for deterministic guidance and next-step suggestions
6. **Explore the graph** on Graph Explorer page to inspect connected entities

## 18. Current Limitations
- Full `CITES` ingestion from OpenAlex references is not implemented yet
- Graph centrality uses a fallback proxy when citation edges are sparse
- Skill-gap inference is deterministic/evidence-driven and still heuristic-based
- Graph Explorer currently composes graph data from multiple endpoints instead of using a dedicated graph endpoint
- Advanced extraction (spaCy/KeyBERT entity linking into graph) is scaffolded but not fully integrated end-to-end
- Authentication and multi-tenant user isolation are not implemented
- Automated test coverage remains limited

## 19. Future Improvements
- Add full citation-edge ingestion (`CITES`) and richer graph-native centrality
- Add a dedicated backend graph endpoint for explorer performance and consistency
- Integrate extraction pipeline deeply (methods, datasets, skills with stronger entity linking)
- Add link prediction signal (TransE) to recommendation scoring
- Add automated test suites and CI workflow
- Add auth/user management for multi-user deployments

---
ResearchGraph AI is a modular academic prototype designed for explainable research discovery and extensible knowledge-graph intelligence.
