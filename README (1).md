<div align="center">

# InfraGuard AI

**Incident Intelligence & Scenario Simulation for Critical Infrastructure**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![Ollama](https://img.shields.io/badge/Ollama-Local_AI-black?style=flat)](https://ollama.com)
[![License](https://img.shields.io/badge/License-MIT-C8860A?style=flat)](LICENSE)

*Built by Habiba — AI Accelerator Program, 2026*

</div>

---

## What Is InfraGuard AI?

Critical infrastructure operators — the people protecting oil pipelines, power grids, banks, mining sites, hospitals, and smart cities — receive hundreds of sensor alerts every shift. Most are noise. But somewhere in that stream is a real threat, and no system was telling them which one.

**InfraGuard AI closes that gap.**

It sits on top of existing monitoring infrastructure, analyses incoming security events in real time, scores each situation by risk level, and delivers a plain-English AI-generated threat assessment — with a specific recommended action — in under 10 seconds.

> *"InfraGuard AI gives infrastructure operators what they have never had before — time to think, because the system has already done the thinking."*

---

## Key Features

- **AI-Powered Threat Analysis** — Locally-hosted Gemma 3 (via Ollama) generates plain-English threat assessments, reasoning, and recommended actions for every incident
- **Proprietary Risk Scoring Engine** — Weighted algorithm evaluates event type, zone sensitivity, multi-zone patterns, and temporal factors to produce a 0–95 risk score
- **Real-Time Dashboard** — Professional React interface with live incident feed, zone activity monitoring, and AI analysis panel
- **Live Event Streaming** — WebSocket connection delivers background sensor events every 3 seconds with no polling delay
- **Scenario Simulation** — Run pre-built threat scenarios for operator training and system testing
- **Zero Cloud Dependency** — Runs entirely offline on local hardware. No data ever leaves the facility. No API costs per analysis
- **Configurable by Industry** — Zone maps, event types, risk weights, and AI prompts all adapt to any sector without rebuilding the product

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     InfraGuard AI                           │
├──────────────────┬──────────────────┬───────────────────────┤
│   Event Engine   │  Risk Scoring    │   AI Analysis Engine  │
│                  │     Engine       │                       │
│  Captures or     │  Weighted algo   │  Gemma 3 via Ollama   │
│  simulates       │  evaluates event │  generates plain-     │
│  sensor events   │  combinations    │  English analysis     │
│  across zones    │  → score 10–95   │  + recommended action │
└──────────────────┴──────────────────┴───────────────────────┘
         │                  │                    │
         └──────────────────┴────────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │     FastAPI Backend        │
              │  REST API + WebSocket      │
              └─────────────┬─────────────┘
                            │
              ┌─────────────▼─────────────┐
              │   React + Vite Frontend    │
              │   Real-time Dashboard      │
              └────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | FastAPI (Python) | REST API endpoints, WebSocket streaming, async processing |
| AI Engine | Gemma 3 via Ollama | Local LLM inference — threat assessment, no cloud needed |
| Frontend | React + Vite | Real-time dashboard with live event streaming |
| Risk Engine | Python (custom) | Weighted scoring algorithm, proprietary logic |
| Event Engine | Python (custom) | Sensor event simulation and ingestion |
| Real-time | WebSockets | Live event delivery, 3-second intervals |
| Typography | DM Sans + DM Mono | Professional UI font system |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | System status and version check |
| `POST` | `/simulate` | Trigger a new incident — generates events, scores risk, runs AI analysis |
| `GET` | `/incidents` | Return all stored incidents with full AI analysis |
| `WS` | `/ws/live` | WebSocket — streams live background events every 3 seconds |

Interactive API docs available at `http://localhost:8000/docs` when running locally.

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.com) installed and running

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/infraguard-ai.git
cd infraguard-ai
```

### 2. Backend Setup

```bash
# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

# Install dependencies
cd backend
pip install -r requirements.txt
```

### 3. Pull the AI Model

```bash
# Ollama must be installed and running
ollama pull gemma3:1b
```

> **Note:** The system also works with `mistral`, `llama3`, or `gemma3:4b` if you have more RAM available.

### 4. Start the Backend

```bash
cd backend
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`

### 5. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### 6. Open the Dashboard

Visit `http://localhost:5173` in your browser, click **Run Simulation**, and watch InfraGuard AI generate a real-time AI threat assessment.

---

## Project Structure

```
infraguard-ai/
├── backend/
│   ├── main.py               # FastAPI app — routes, WebSocket, CORS
│   ├── event_generator.py    # Sensor event simulation engine
│   ├── risk_engine.py        # Weighted risk scoring algorithm
│   ├── ai_engine.py          # AI analysis — Ollama (local) or Claude API (cloud)
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main dashboard component
│   │   └── main.jsx          # React entry point
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## How the Risk Scoring Works

The risk engine evaluates each incident using a weighted logic model:

```python
# Scoring weights (simplified)
WEIGHTS = {
    "perimeter_breach":   30,
    "vehicle_detected":   18,
    "drone_signal_loss":  15,
    "thermal_anomaly":    12,
    "motion_detected":     8,
    "unknown_signal":     10,
}

# Additional modifiers
NIGHT_TIME_BONUS     = +10   # Events between 10pm and 5am
RESTRICTED_ZONE      = +8    # Alpha zone events
MULTI_ZONE_ACTIVITY  = +10   # 3+ zones simultaneously
DUAL_ZONE_ACTIVITY   = +5    # 2 zones simultaneously

# Score is capped at 95 — real intelligence is never absolute
RISK_LEVELS = {
    "LOW":    (10, 34),
    "MEDIUM": (35, 64),
    "HIGH":   (65, 95),
}
```

---

## Cloud Deployment — What We Iterated

The original version of InfraGuard AI was designed entirely for **local deployment** — the AI model (Gemma 3) ran on the same machine as the application, with no internet dependency. This is still the recommended architecture for production deployments where **data sovereignty** is a requirement (oil and gas, defence, banking).

However, to make the system **publicly accessible for demos, investor presentations, and remote pilots**, we iterated on the architecture to support cloud hosting.

### The Challenge

The core local AI inference setup — Ollama + Gemma 3 — requires **4–8GB of RAM** to run comfortably. Free-tier cloud servers (Render, Railway, Fly.io) typically provide **512MB–1GB RAM**, which is insufficient to load the model.

### The Solution — Dual AI Engine

We refactored `ai_engine.py` to support **two inference modes** selected automatically based on environment:

```python
# ai_engine.py — dual mode
import os

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

async def ai_analyze(events, risk):
    if ANTHROPIC_API_KEY:
        # Cloud mode: Claude API (Haiku — fast and affordable)
        return await analyze_with_claude(events, risk)
    else:
        # Local mode: Gemma 3 via Ollama (no internet, no cost)
        return await analyze_with_ollama(events, risk)
```

| Mode | When It Runs | AI Model | Internet Required |
|------|-------------|----------|------------------|
| **Local** | No `ANTHROPIC_API_KEY` set | Gemma 3 via Ollama | No |
| **Cloud** | `ANTHROPIC_API_KEY` present | Claude Haiku (Anthropic API) | Yes |

This means:
- **Local / on-premise deployments** — run exactly as before. No changes needed. Full data sovereignty.
- **Cloud / demo deployments** — set the `ANTHROPIC_API_KEY` environment variable and deploy to any platform

### What Else Changed for Cloud

**1. Dynamic API URL in the frontend**

The frontend originally hardcoded `localhost:8000`. We updated it to read from an environment variable:

```javascript
// frontend/src/App.jsx
const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
```

**2. Environment variable for frontend build**

```bash
# .env.production (in frontend folder)
VITE_API_URL=https://your-backend.onrender.com
```

**3. requirements.txt cleaned up**

Removed development-only packages and pinned versions for reproducible cloud builds.

**4. Start command for cloud platforms**

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Deploying to Render (Free Tier)

**Backend:**
1. Connect your GitHub repo to [Render](https://render.com)
2. New → Web Service → Root Directory: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variable: `ANTHROPIC_API_KEY = your_key_here`

**Frontend:**
1. New → Static Site → Root Directory: `frontend`
2. Build Command: `npm install && npm run build`
3. Publish Directory: `dist`
4. Add environment variable: `VITE_API_URL = https://your-backend.onrender.com`

---

## Supported Industries

InfraGuard AI is configurable for any facility that monitors physical assets through sensors:

| Industry | Example Operators | Primary Threats Monitored |
|----------|------------------|--------------------------|
| **Oil & Gas** | NNPC, independents | Pipeline tapping, perimeter breach, vehicle loitering |
| **Power & Energy** | PHCN, substations | Grid tampering, equipment sabotage, unauthorized access |
| **Banking & Finance** | Access Bank, GTBank, CBN | Vault intrusion, server room access, ATM zone anomalies |
| **Mining** | Solid minerals sites | Equipment theft, illegal mining, night-time intrusion |
| **Healthcare** | Hospitals, pharma stores | Drug store breach, restricted lab access, patient zone alerts |
| **Ports & Logistics** | Tin Can Island Port | Cargo breach, unauthorized vehicles, perimeter activity |
| **Smart Cities** | FCT Abuja, Lagos | Utility tampering, civic infrastructure breach |
| **Defence & Government** | Classified installations | Air-gapped deployment, scenario simulation, zero data transmission |

To configure InfraGuard AI for a specific industry, update:
1. `ZONES` list in `event_generator.py`
2. `EVENT_TYPES` and weights in `risk_engine.py`
3. System prompt in `ai_engine.py`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Cloud only | Enables Claude API for AI analysis in hosted deployments |
| `VITE_API_URL` | Cloud only | Points frontend to the hosted backend URL |

No environment variables needed for local deployment.

---

## Screenshots

> *Add your dashboard screenshots here*

| Dashboard Overview | AI Analysis Panel | Zone Activity |
|-------------------|------------------|---------------|
| *(screenshot)* | *(screenshot)* | *(screenshot)* |

---

## Roadmap

- [ ] PostgreSQL persistent storage for full incident audit trail
- [ ] Role-based access control for multi-operator environments
- [ ] PDF incident report export
- [ ] Real sensor hardware integration (IoT, CCTV, perimeter systems)
- [ ] Mobile-responsive interface for field operator access
- [ ] Industry-specific editions (Energy, Mining, Banking)
- [ ] Gemma 4 upgrade as hardware capacity allows
- [ ] Multi-site deployment for operators managing multiple facilities

---

## Acknowledgements

Built during the **AI Accelerator Program, 2026**.

- [FastAPI](https://fastapi.tiangolo.com) — backend framework
- [Ollama](https://ollama.com) — local AI inference
- [Gemma 3](https://ai.google.dev/gemma) — open-source language model by Google DeepMind
- [React](https://react.dev) + [Vite](https://vitejs.dev) — frontend
- [DM Sans & DM Mono](https://fonts.google.com) — typography

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built by Habiba**
*AI Accelerator Program · 2026*

*InfraGuard AI — For the operators who guard what the world runs on.*

</div>
