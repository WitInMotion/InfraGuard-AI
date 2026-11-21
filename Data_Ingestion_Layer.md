# Data Ingestion Layer — How Real Sensors Reach InfraGuard AI

> **Honest status up front:** the prototype has been tested end-to-end on **simulated sensor events**. Real hardware has **not yet been tested**. This section explains the ingestion design, what is already working, and exactly what is needed to connect real sensors.

## 1. Data-flow diagram

```
 SENSORS                EDGE / GATEWAY             INGESTION API                 INTELLIGENCE              OPERATOR
┌──────────────┐      ┌────────────────┐      ┌───────────────────────┐      ┌──────────────────┐     ┌────────────┐
│ Motion (PIR) │      │ ESP32 / Pi /   │      │ 1 Authenticate (key)  │      │ Risk Engine      │     │ Dashboard  │
│ Vehicle      │─────▶│ existing alarm │─────▶│ 2 Validate schema     │─────▶│ (weights, night, │────▶│ (WebSocket │
│ Perimeter    │ wire │ panel / NVR /  │ HTTPS│ 3 Normalise           │      │ zones, combos)   │     │  live feed)│
│ Thermal      │ /RF  │ SCADA gateway  │ JSON │ 4 De-duplicate        │      │        │         │     └────────────┘
└──────────────┘      └────────────────┘ MQTT*│ 5 Tag zone + UTC time │      │        ▼         │
                                              └───────────────────────┘      │ AI Analysis      │
 SIMULATOR (today) ─────────────────────────────────────▲                    │ (Gemma 3 local / │
 generate_event_stream() feeds the same pipeline         │ same event format  │  Claude demo)    │
                                                                             └──────────────────┘
 * MQTT, Modbus/serial and webhook adapters are planned, not yet built.
```

## 2. How alerts from each sensor type reach the system

| Sensor | Typical hardware | How it reaches InfraGuard | Event type produced |
|---|---|---|---|
| Motion | PIR (e.g. HC-SR501) on ESP32 | Edge device detects trigger and sends a JSON message | `motion_detected` |
| Vehicle | Ultrasonic / radar / camera-based detector, or existing gate system | Edge device or the existing system's webhook sends distance/detection | `vehicle_detected` |
| Perimeter | Fence/vibration sensor, door/gate contact, beam | Dry-contact → edge device → JSON | `perimeter_breach` |
| Thermal | Temperature sensor (e.g. DHT22) or thermal camera alert | Edge device compares to threshold, sends value + threshold | `thermal_anomaly` |

**Interfaces**

| Interface | Status |
|---|---|
| HTTPS REST + JSON (`POST /sensor-event`) — primary path | Designed; **to be built and tested on hardware** |
| WebSocket (`/ws/live`) — outbound to dashboard | **Built and working** |
| Simulated event stream (internal) | **Built and working** |
| MQTT (via broker bridge to the API) | Planned |
| Webhook from existing alarm/VMS/NVR systems | Planned |
| Modbus / serial / SCADA via a protocol gateway | Planned (needs a pilot site) |

Design principle: **InfraGuard does not replace sensors.** Raw signals are converted to a small JSON message at the edge, so the platform only needs to understand one format.

**Example message**
```json
{
  "device_id": "esp32-gate7-01",
  "zone": "Gate-7",
  "timestamp": "2026-11-21T22:14:05Z",
  "events": [
    {"type": "motion", "value": 1},
    {"type": "thermal", "value": 61.2, "threshold": 45.0}
  ]
}
```

## 3. How raw data is cleaned and standardised before scoring

1. **Authenticate** – request must carry a valid device API key (planned; part of the security hardening).
2. **Validate** – reject malformed JSON, missing fields, unknown device IDs, impossible values (e.g. temperature of 9,000 °C). Rejected messages are logged, never scored.
3. **Map to standard event types** – vendor/sensor names (`pir`, `motion`, `fence_vib`, `temp_high`) become one of InfraGuard's six types: `motion_detected`, `vehicle_detected`, `perimeter_breach`, `thermal_anomaly`, `drone_signal_loss`, `unknown_signal`.
4. **Apply thresholds** – analogue readings (temperature, distance) become an event only when they cross a configured threshold.
5. **Normalise time** – all timestamps converted to UTC; devices with bad clocks are stamped on arrival.
6. **Attach zone** – `device_id` → zone via a registry (Alpha, Bravo, Gate-7, …), so scoring knows which zones are restricted.
7. **De-duplicate / debounce** – repeated triggers from one device within a short window (e.g. 10 s) collapse into one event, so a bird or a flickering sensor does not flood the operator.
8. **Emit the standard event** `{id, type, zone, timestamp, severity_seed, source}` – the **same format the simulator already produces**, which is why risk scoring and AI analysis need no changes.

Steps 3 and 8 are what the prototype already does with simulated data. Steps 1, 2, 4–7 are the ingestion work still to be built.

## 4. Tested on real hardware or simulated data?

- **Tested (simulated data):** event stream → risk engine → AI analysis → live dashboard, via `generate_event_stream()` and the `/simulate` endpoint.
- **Not yet tested:** physical sensors. No claims of real-hardware validation are made.

**What is still needed to integrate real sensors**

| Need | Why | Effort (estimate) |
|---|---|---|
| `/sensor-event` endpoint with validation, normalisation and de-duplication | Single door for all devices | 1–2 days |
| Device registry (device → zone, sensor type, thresholds) | Zone-aware scoring | 1 day |
| Device API keys + rate limiting | Security | 1 day |
| Bench test: ESP32 + PIR + DHT22 + ultrasonic posting over Wi-Fi | First real-hardware proof | 3–5 days incl. parts |
| MQTT / webhook adapters | Existing systems, low-bandwidth sites | 1 week |
| Offline buffering on the edge device | Network drops | 2–3 days |
| Pilot site with existing sensors (ideally under an NDA) | Real noise, real false alarms | Needs a partner |

## 5. Next milestone
Run a **bench test** of 3 low-cost sensors on one ESP32 posting into `/sensor-event`, record it, and report the result as the first hardware validation. After that, a **90-day pilot** alongside an operator's existing system.
