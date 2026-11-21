"""Edge-device simulator: posts the same JSON an ESP32 would send.
Use it to test /sensor-event before real hardware arrives.
Run: python sensor_simulator.py  (backend must be running)"""
import random, time, datetime, requests
URL = "http://localhost:8000/sensor-event"
KEY = "change-me"
ZONES = ["Alpha","Bravo","Charlie","Perimeter-North","Gate-7","Sector-4"]
def msg():
    ev = [{"type":"motion","value":1}]
    if random.random()<.3: ev.append({"type":"thermal","value":round(random.uniform(40,75),1),"threshold":45})
    if random.random()<.3: ev.append({"type":"vehicle","distance_cm":random.randint(30,300)})
    return {"device_id":"sim-"+random.choice(ZONES).lower(),"zone":random.choice(ZONES),
            "timestamp":datetime.datetime.utcnow().isoformat()+"Z","events":ev}
while True:
    r = requests.post(URL,json=msg(),headers={"X-API-Key":KEY},timeout=10)
    print(r.status_code, r.text[:120]); time.sleep(random.uniform(2,6))
