from datetime import datetime
import random

def calculate_risk(events):
    score = 0
    factors = []

    # Night time adds risk
    hour = datetime.now().hour
    if hour >= 22 or hour <= 5:
        score += 10
        factors.append("night_time")

    # Count event types — only score the worst occurrence of each type
    event_types = set(e["type"] for e in events)
    zones_hit = set(e["zone"] for e in events)

    if "perimeter_breach" in event_types:
        score += 30
        factors.append("perimeter_breach")

    if "vehicle_detected" in event_types:
        score += 18
        factors.append("vehicle_detected")

    if "drone_signal_loss" in event_types:
        score += 15
        factors.append("drone_signal_loss")

    if "thermal_anomaly" in event_types:
        score += 12
        factors.append("thermal_anomaly")

    if "motion_detected" in event_types:
        score += 8
        factors.append("motion_detected")

    if "unknown_signal" in event_types:
        score += 10
        factors.append("unknown_signal")

    # Multi-zone activity adds moderate risk
    if len(zones_hit) >= 3:
        score += 10
        factors.append("multi_zone_activity")
    elif len(zones_hit) == 2:
        score += 5
        factors.append("dual_zone_activity")

    # Alpha zone is restricted — small bonus
    if "Alpha" in zones_hit:
        score += 8
        factors.append("restricted_zone_alpha")

    # Add slight randomness so scores feel natural
    score += random.randint(-5, 5)

    # Cap between 10 and 95 so we never always hit 100
    score = max(10, min(score, 95))

    return {
        "score": score,
        "level": "HIGH" if score >= 65 else "MEDIUM" if score >= 35 else "LOW",
        "factors": list(set(factors))
    }