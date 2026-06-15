import random
from datetime import datetime

ZONES = ["Alpha", "Bravo", "Charlie", "Perimeter-North", "Gate-7", "Sector-4"]

EVENT_TYPES = [
    "motion_detected",
    "vehicle_detected",
    "drone_signal_loss",
    "thermal_anomaly",
    "perimeter_breach",
    "unknown_signal"
]

def generate_event():
    return {
        "id": f"EVT-{random.randint(1000, 9999)}",
        "type": random.choice(EVENT_TYPES),
        "zone": random.choice(ZONES),
        "timestamp": datetime.now().isoformat(),
        "severity_seed": round(random.uniform(0, 1), 2)
    }

def generate_event_stream(count=5):
    return [generate_event() for _ in range(count)]