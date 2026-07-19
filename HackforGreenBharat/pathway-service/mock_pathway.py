from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import threading
import time

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.before_request
def log_request_info():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

# Configuration
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:3000/api/v9/alert") 

# https://hackforgreenbharat.onrender.com
# Note: Ensure this matches the backend route! (v9/alert)

# Mock pollution data
HIGH_POLLUTION_ZONES = [
    {"lat": 28.7041, "lon": 77.1025, "radius": 0.5, "level": "High", "description": "Severe Air Quality in Delhi"}
]

import random

def get_pollution_data(lat, lon):
    # Simulate pollution data based on location
    # Base AQI
    base_aqi = 50
    
    # "Hotspot" effect
    for zone in HIGH_POLLUTION_ZONES:
        dist = ((lat - zone["lat"])**2 + (lon - zone["lon"])**2)**0.5
        if dist < zone["radius"]:
            # Closer = Higher AQI
            factor = (zone["radius"] - dist) / zone["radius"]
            base_aqi += 200 * factor
            
    # Add some random noise
    current_aqi = int(base_aqi + random.randint(-5, 15))
    
    # Determine level
    if current_aqi > 200: level = "High"
    elif current_aqi > 100: level = "Moderate"
    else: level = "Good"

    return {
        "aqi": current_aqi,
        "co2": round(400 + (current_aqi * 0.5) + random.uniform(-10, 10), 2),
        "no2": round(20 + (current_aqi * 0.2) + random.uniform(-5, 5), 2),
        "level": level,
        "description": f"AQI is {level}",
        "zone_lat": lat,
        "zone_lon": lon
    }

@app.route('/v1/inputs', methods=['POST'])
def receive_inputs():
    try:
        data = request.json
        if isinstance(data, dict):
            items = [data]
        else:
            items = data
        
        for item in items:
            lat = item.get("lat")
            lon = item.get("lon")
            user_id = item.get("user_id")

            if lat is None or lon is None:
                continue

            print(f"📍 Location: {lat:.4f}, {lon:.4f}")

            # Always calculate pollution data
            pollution_data = get_pollution_data(lat, lon)
            
            payload = {
                "user_id": user_id,
                "lat": lat,
                "lon": lon,
                **pollution_data
            }
            
            print(f"📡 Sending Update: AQI {pollution_data['aqi']} ({pollution_data['level']})")
            
            try:
                 requests.post(BACKEND_URL, json=payload, timeout=2)
            except Exception as e:
                print(f"❌ Backend error: {e}")

        return jsonify({"status": "success"}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8081))
    print(f"🚀 Starting Mock Pathway Service on port {port}...")
    print("🔓 CORS Enabled for all origins")
    print(f"📡 Sending alerts to: {BACKEND_URL}")
    app.run(host='0.0.0.0', port=port, debug=False)
