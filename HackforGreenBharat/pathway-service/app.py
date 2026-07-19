import pathway as pw
import json
import os
import requests

# Define schema for input data
class InputSchema(pw.Schema):
    user_id: str
    lat: float
    lon: float

# Configuration
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:3000/api/v1/alert") # Adjusted to match backend route structure if needed, or create new.
# Let's assume we will create /api/v9/alert for pathway

# Mock pollution data
HIGH_POLLUTION_ZONES = [
    {"lat": 28.7041, "lon": 77.1025, "radius": 0.5, "level": "High", "description": "Severe Air Quality in Delhi"}
]

def check_pollution(lat, lon):
    for zone in HIGH_POLLUTION_ZONES:
        if abs(lat - zone["lat"]) < zone["radius"] and abs(lon - zone["lon"]) < zone["radius"]:
            return (zone["level"], zone["description"])
    return (None, None)

def send_alert(alert_data):
    try:
        # Convert map object to dict if needed, or just access fields
        payload = {
            "user_id": alert_data["user_id"],
            "lat": alert_data["lat"],
            "lon": alert_data["lon"],
            "level": alert_data["level"],
            "description": alert_data["description"]
        }
        print(f"Sending alert to backend: {payload}")
        requests.post(BACKEND_URL, json=payload, timeout=5)
    except Exception as e:
        print(f"Error sending alert: {e}")

def run():
    # 1. Input: HTTP Server
    # This creates a table that updates in real-time as data is POSTed to http://localhost:8081/
    t = pw.io.http.read(
        host="0.0.0.0",
        port=8081,
        schema=InputSchema,
        format="json"
    )

    # 2. Process: Add pollution info
    # We use a UDF to enrich the data
    @pw.udf
    def enrich_with_pollution(lat: float, lon: float) -> tuple[str | None, str | None]:
        return check_pollution(lat, lon)

    # Add columns
    t = t.select(
        *pw.this.without(pw.this.timestamp), # Timestamp is auto-added by http connector usually, or we can ignore
        pollution_info=enrich_with_pollution(pw.this.lat, pw.this.lon)
    )

    # Flatten and Filter
    t = t.select(
        pw.this.user_id,
        pw.this.lat,
        pw.this.lon,
        level=pw.this.pollution_info[0],
        description=pw.this.pollution_info[1]
    ).filter(pw.this.level.is_not_none())

    # 3. Output: Call function
    # Use `pw.io.subscribe` to trigger an action for each new row
    pw.io.subscribe(t, send_alert)

    # Run
    pw.run()

if __name__ == "__main__":
    run()
