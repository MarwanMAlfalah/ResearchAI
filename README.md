# ResearchGraph AI
**Ontology-guided research discovery with explainable graph-aware recommendations.**

## 1. Project Overview
ResearchGraph AI is a full-stack academic prototype for discovering, importing, organizing, and recommending research papers using a knowledge graph + AI-assisted scoring pipeline. It combines OpenAlex ingestion, Neo4j graph storage, semantic embeddings, multi-signal recommendation scoring, and explainable outputs through a clean React frontend.

## 2. Problem Statement
Researchers often face fragmented discovery workflows:
- paper search is separated from profile/context
- recommendations are hard to explain
- skill development gaps are not surfaced clearly
- graph relationships between papers, topics, and skills are underused

## 3. Core Idea / Solution
Use a graph-centered architecture where papers, authors, topics, and user profiles are connected in Neo4j, then rank candidate papers with transparent signals:
- semantic similarity (user interests ↔ paper embeddings)
- graph centrality (with robust fallback)
- recency

The system returns explainable recommendation evidence and a backend-generated skill-gap analysis.

## 4. Key Features (Implemented)
- User profile create/update/read with skills and interests embeddings
- OpenAlex paper search and normalized metadata retrieval
- Single and batch direct import by OpenAlex ID
- Neo4j upsert pipeline for Papers, Authors, Topics, and relationships
- Semantic recommendations endpoint
- Multi-signal scored recommendations endpoint
- Explained recommendations with signal breakdown and evidence fields
- Backend skill-gap endpoint with deterministic evidence
- Frontend pages for:
  - Profile
  - Search & Import
  - Recommendations
  - Skill Gap
- Shared active user context across frontend pages

## 5. Tech Stack
### Backend
- Python 3.11
- FastAPI
- Neo4j Python driver
- Pydantic + pydantic-settings
- httpx
- OWLReady2 + RDFLib
- sentence-transformers
- spaCy, KeyBERT (installed; extraction pipeline scaffolded)

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS

### Data/API
- OpenAlex (active source)
- Neo4j Community

## 6. System Architecture Summary
- **Frontend (React)**: user workflows (profile, search/import, recommendations, skill-gap)
- **API Layer (FastAPI routers)**: endpoint orchestration + validation + error handling
- **Services Layer**: ingestion, user profile, skill-gap computation
- **Recommendation Layer**: semantic scoring, weighted scoring, explainability
- **Graph Layer (Neo4j)**: canonical entities and relationships for retrieval/scoring
- **Ontology Layer (OWLReady2)**: formal schema definition and export

## 7. Backend Capabilities
Implemented API surface (prefix: `/api/v1`):
- `GET /health`
- `GET /health/neo4j`
- `GET /search/papers?q=...&limit=...`
- `POST /import/paper` (normalized payload)
- `POST /import/paper/{openalex_id}`
- `POST /import/papers/by-id`
- `POST /user/profile`
- `GET /user/profile/{id}`
- `GET /recommend/papers/semantic?user_id=...&limit=...`
- `GET /recommend/papers/scored?user_id=...&limit=...`
- `GET /recommend/papers/explained?user_id=...&limit=...`
- `GET /skill-gap?user_id=...&limit=...`

Other implemented backend capabilities:
- app-level Neo4j lifecycle connection management
- schema constraint/index initialization script support
- OpenAlex timeout and error handling
- embedding generation for user interests and paper text
- centrality fallback to `cited_by_count` when `CITES` graph is sparse

### Concise API Reference
Base URL (local): `http://localhost:8000`

#### `GET /api/v1/health`
- Purpose: basic service health check.
- Params/body: none.
- Example request:
```bash
curl "http://localhost:8000/api/v1/health"
```
- Example response shape:
```json
{ "status": "ok" }
```

#### `GET /api/v1/health/neo4j`
- Purpose: verify Neo4j connectivity from the running API.
- Params/body: none.
- Example request:
```bash
curl "http://localhost:8000/api/v1/health/neo4j"
```
- Example response shape:
```json
{ "status": "ok", "neo4j": "connected" }
```

#### `GET /api/v1/search/papers`
- Purpose: search OpenAlex and return normalized paper results.
- Query params: `q` (string, required), `limit` (int, optional, 1-50).
- Example request:
```bash
curl "http://localhost:8000/api/v1/search/papers?q=knowledge+graph&limit=5"
```
- Example response shape:
```json
[
  {
    "title": "Paper title",
    "abstract": "Abstract text",
    "authors": [{ "name": "Author Name", "openalex_id": "https://openalex.org/A...", "orcid": null }],
    "publication_year": 2023,
    "cited_by_count": 42,
    "concepts": [{ "name": "Knowledge graph", "openalex_id": "https://openalex.org/C...", "score": 0.78 }],
    "ids": { "openalex": "https://openalex.org/W..." }
  }
]
```

#### `POST /api/v1/import/paper/{openalex_id}`
- Purpose: fetch a paper by OpenAlex ID, normalize it, and import to Neo4j.
- Path param: `openalex_id` (e.g. `W2741809807`).
- Example request:
```bash
curl -X POST "http://localhost:8000/api/v1/import/paper/W2741809807"
```
- Example response shape:
```json
{
  "status": "imported",
  "openalex_id": "W2741809807",
  "imported": {
    "paper_id": "https://openalex.org/W2741809807",
    "authors_merged": 3,
    "topics_merged": 5,
    "author_ids": ["https://openalex.org/A..."],
    "topic_names": ["Machine learning"]
  }
}
```

#### `POST /api/v1/user/profile`
- Purpose: create or update a user profile and linked skills.
- Body shape:
```json
{
  "user_id": "user_001",
  "name": "Alice",
  "interests_text": "knowledge graphs, recommender systems",
  "skills": ["Python", "Neo4j"]
}
```
- Example request:
```bash
curl -X POST "http://localhost:8000/api/v1/user/profile" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user_001","name":"Alice","interests_text":"knowledge graphs","skills":["Python","Neo4j"]}'
```
- Example response shape:
```json
{
  "user_id": "user_001",
  "name": "Alice",
  "interests_text": "knowledge graphs",
  "interests_embedding": [0.01, -0.12],
  "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
  "skills": ["Python", "Neo4j"],
  "created_at": "2026-04-08T18:00:00",
  "updated_at": "2026-04-08T18:01:00"
}
```

#### `GET /api/v1/user/profile/{id}`
- Purpose: fetch a user profile with linked skills.
- Path param: `id` (user ID).
- Example request:
```bash
curl "http://localhost:8000/api/v1/user/profile/user_001"
```
- Example response shape: same as `POST /api/v1/user/profile` response model.

#### `GET /api/v1/recommend/papers/explained`
- Purpose: return scored recommendations with explanation and evidence fields.
- Query params: `user_id` (required), `limit` (optional, 1-100).
- Example request:
```bash
curl "http://localhost:8000/api/v1/recommend/papers/explained?user_id=user_001&limit=5"
```
- Example response shape:
```json
{
  "user_id": "user_001",
  "recommendations": [
    {
      "paper_id": "https://openalex.org/W...",
      "title": "Paper title",
      "semantic_similarity": 0.81,
      "graph_centrality": 0.42,
      "recency": 0.77,
      "final_score": 0.72,
      "top_contributing_signals": ["semantic_similarity", "recency", "graph_centrality"],
      "explanation_text": "Strong semantic match to your interests; ...",
      "evidence": {
        "publication_year": 2022,
        "cited_by_count": 31,
        "centrality_source": "cited_by_count_fallback",
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
        "semantic_strength_bucket": "high",
        "centrality_strength_bucket": "medium",
        "recency_strength_bucket": "high"
      }
    }
  ]
}
```

#### `GET /api/v1/skill-gap`
- Purpose: return backend-driven skill-gap analysis from profile + recommendation evidence.
- Query params: `user_id` (required), `limit` (optional, 1-100).
- Example request:
```bash
curl "http://localhost:8000/api/v1/skill-gap?user_id=user_001&limit=10"
```
- Example response shape:
```json
{
  "user_id": "user_001",
  "current_skills": ["Python", "Neo4j"],
  "missing_skills": [
    {
      "skill": "Knowledge Graphs",
      "confidence": 0.92,
      "evidence_count": 3,
      "supporting_papers": [
        {
          "paper_id": "https://openalex.org/W...",
          "title": "Paper title",
          "final_score": 0.74,
          "matched_fields": ["title", "explanation"],
          "top_contributing_signals": ["semantic_similarity", "recency", "graph_centrality"]
        }
      ],
      "rationale": "Matched user interests and appeared in recommendation evidence."
    }
  ],
  "suggested_next_skills": ["Knowledge Graphs", "Link Prediction"],
  "strengths": ["Python", "Neo4j"],
  "gaps_summary": "Identified potential skill gaps from recommendation evidence."
}
```

## 8. Frontend Capabilities
Implemented pages and behavior:
- **Profile**: load/save user profile, skills, interests
- **Search & Import**: search OpenAlex papers and import by ID into graph
- **Recommendations**: fetch explained recommendations and render evidence-rich cards
- **Skill Gap**: fetch backend skill-gap analysis and display strengths, gaps, suggested next skills, and evidence

UI capabilities:
- shared active user state in top navigation
- consistent loading/empty/error/success state panels
- professional card-based layout suitable for demo presentation

## 9. Knowledge Graph + Ontology Role
Ontology defines core classes and relations used by graph schema design:
- Classes: `Paper`, `Author`, `Topic`, `Method`, `Skill`, `Dataset`, `ResearchArea`, `UserProfile`
- Key relations include: `WRITTEN_BY`, `BELONGS_TO_TOPIC`, `HAS_SKILL`, `CITES`, etc.

Neo4j currently stores and uses a practical subset for active workflows (papers/authors/topics/profiles/skills + recommendation-related properties).

## 10. Recommendation and Explainability Pipeline
1. User profile stores interests text + embedding
2. Paper ingestion stores paper embedding (`title + abstract`, title fallback)
3. Candidate papers are scored with:
   - semantic similarity
   - graph centrality (citation-degree or fallback)
   - recency (exponential decay)
4. Final score combines weighted signals:
   - `final = alpha*semantic + beta*centrality + gamma*recency`
5. Explainability layer adds:
   - top contributing signals
   - explanation text
   - evidence fields (publication year, cited count, centrality source, buckets)
6. Skill-gap service reuses profile + explained recommendations for deterministic backend analysis

## 11. Project Structure Overview
```text
ResearchGraph AI/
├─ backend/
│  ├─ app/
│  │  ├─ api/              # Router registration
│  │  ├─ routers/          # FastAPI endpoint modules
│  │  ├─ services/         # Business services (ingestion, profiles, skill-gap)
│  │  ├─ recommendation/   # Semantic/scored/explainability pipeline
│  │  ├─ data_ingestion/   # OpenAlex + normalization clients
│  │  ├─ db/               # Neo4j client + graph schema init
│  │  ├─ ontology/         # OWL schema creation/export
│  │  ├─ ai/               # Embeddings + extraction scaffolds
│  │  ├─ models/           # Pydantic request/response models
│  │  └─ core/             # Configuration
│  ├─ requirements.txt
│  ├─ .env.example
│  └─ run.py
├─ frontend/
│  ├─ src/
│  │  ├─ app/              # App shell + navigation
│  │  ├─ pages/            # Profile/Search/Recommendations/SkillGap pages
│  │  ├─ features/         # Feature modules and components
│  │  ├─ services/         # Shared API config
│  │  └─ styles/           # Tailwind styles
│  ├─ .env.example
│  └─ package.json
├─ data/
├─ docs/
└─ scripts/
```

## 12. Local Setup Instructions
### Prerequisites
- Python 3.11+
- Node.js 18+
- Neo4j Community (local)

### Clone and prepare
```bash
git clone <your-repo-url>
cd ResearchGraphAI
```

## 13. Backend Run Instructions
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Update `.env` with your Neo4j credentials, then run:
```bash
python run.py
```
or:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API root: `http://localhost:8000`

## 14. Frontend Run Instructions
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## 15. Demo Flow (How to Use)
1. Open **Profile** page and create/update a user profile (`user_id`, name, interests, skills)
2. Open **Search** page and search papers from OpenAlex
3. Import one or more papers into Neo4j
4. Open **Recommendations** page and fetch explained recommendations for the same user
5. Open **Skill Gap** page and load backend skill-gap analysis

## 16. Current Limitations
- True `CITES` ingestion from OpenAlex references is not fully implemented yet
- Skill-gap inference is deterministic and evidence-driven but still heuristic-based
- Graph explorer page is not implemented in the current frontend
- Advanced extraction pipeline (spaCy/KeyBERT into graph entities) is scaffolded, not fully productionized
- No authentication/multi-tenant user management yet
- Automated test coverage is currently minimal

## 17. Future Improvements
- Add full citation graph ingestion (`CITES`) and graph-native centrality features
- Move skill-gap inference from keyword matching to ontology/graph relation reasoning
- Add dedicated graph explorer UI (Cytoscape.js) for interactive graph traversal
- Extend extraction pipeline for methods/datasets/skills with stronger entity linking
- Add link prediction signal (TransE module integration) into recommendation scoring
- Add stronger automated tests and CI

---
ResearchGraph AI is designed as a credible academic prototype with a modular path toward research-grade and production-grade extensions.
