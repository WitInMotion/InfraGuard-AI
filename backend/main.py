from pathlib import Path

from fastapi import FastAPI, WebSocket
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import asyncio
import random

from event_generator import generate_event_stream, generate_event
from risk_engine import calculate_risk
from ai_engine import ai_analyze

app = FastAPI(title="InfraGuard AI")
FRONTEND_DIST = Path(__file__).resolve().parent / "static"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

active_incidents = []

@app.get("/")
def root():
    index = FRONTEND_DIST / "index.html"
    if index.exists():
        return FileResponse(index)
    return {"status": "InfraGuard AI operational", "version": "0.3.0"}

@app.post("/simulate")
async def simulate():
    events = generate_event_stream(count=random.randint(3, 6))
    risk = calculate_risk(events)
    analysis = await ai_analyze(events, risk)

    incident = {
        "id": f"INC-{random.randint(10000, 99999)}",
        "events": events,
        "risk": risk,
        "analysis": analysis,
        "timestamp": datetime.now().isoformat()
    }

    active_incidents.insert(0, incident)
    return incident

@app.get("/incidents")
def get_incidents():
    return active_incidents[:20]

@app.websocket("/ws/live")
async def live_events(websocket: WebSocket):
    await websocket.accept()
    while True:
        event = generate_event()
        await websocket.send_json(event)
        await asyncio.sleep(3)


if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str):
        requested = FRONTEND_DIST / full_path
        if requested.is_file():
            return FileResponse(requested)
        return FileResponse(FRONTEND_DIST / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
