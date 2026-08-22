import { geocodeCity } from "../utils/geocodeCity.js";
import { detectPollutionSources } from "../utils/detectPollutionSources.js";
import { calculateSectorContribution } from "../utils/calculateSectorContribution.js";
import { getAQIByCoords, getLiveTelemetry } from "../utils/getAQI.js";
import axios from "axios";

// In-memory cache for live states AQI (5-minute TTL)
let statesCache = {
  timestamp: 0,
  data: [],
};

const INDIAN_STATES = [
  { state: "Andhra Pradesh", code: "AP", city: "Amaravati", lat: 16.5062, lon: 80.6480 },
  { state: "Arunachal Pradesh", code: "AR", city: "Itanagar", lat: 27.0844, lon: 93.6053 },
  { state: "Assam", code: "AS", city: "Guwahati", lat: 26.1445, lon: 91.7362 },
  { state: "Bihar", code: "BR", city: "Patna", lat: 25.5941, lon: 85.1376 },
  { state: "Chhattisgarh", code: "CT", city: "Raipur", lat: 21.2514, lon: 81.6296 },
  { state: "Goa", code: "GA", city: "Panaji", lat: 15.4909, lon: 73.8278 },
  { state: "Gujarat", code: "GJ", city: "Ahmedabad", lat: 23.0225, lon: 72.5714 },
  { state: "Haryana", code: "HR", city: "Gurugram", lat: 28.4595, lon: 77.0266 },
  { state: "Himachal Pradesh", code: "HP", city: "Shimla", lat: 31.1048, lon: 77.1734 },
  { state: "Jharkhand", code: "JH", city: "Ranchi", lat: 23.3441, lon: 85.3096 },
  { state: "Karnataka", code: "KA", city: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  { state: "Kerala", code: "KL", city: "Thiruvananthapuram", lat: 8.5241, lon: 76.9366 },
  { state: "Madhya Pradesh", code: "MP", city: "Bhopal", lat: 23.2599, lon: 77.4126 },
  { state: "Maharashtra", code: "MH", city: "Mumbai", lat: 19.0760, lon: 72.8777 },
  { state: "Manipur", code: "MN", city: "Imphal", lat: 24.8170, lon: 93.9368 },
  { state: "Meghalaya", code: "ML", city: "Shillong", lat: 25.5788, lon: 91.8933 },
  { state: "Mizoram", code: "MZ", city: "Aizawl", lat: 23.7271, lon: 92.7176 },
  { state: "Nagaland", code: "NL", city: "Kohima", lat: 25.6751, lon: 94.1086 },
  { state: "Odisha", code: "OR", city: "Bhubaneswar", lat: 20.2961, lon: 85.8245 },
  { state: "Punjab", code: "PB", city: "Ludhiana", lat: 30.9010, lon: 75.8573 },
  { state: "Rajasthan", code: "RJ", city: "Jaipur", lat: 26.9124, lon: 75.7873 },
  { state: "Sikkim", code: "SK", city: "Gangtok", lat: 27.3389, lon: 88.6065 },
  { state: "Tamil Nadu", code: "TN", city: "Chennai", lat: 13.0827, lon: 80.2707 },
  { state: "Telangana", code: "TG", city: "Hyderabad", lat: 17.3850, lon: 78.4867 },
  { state: "Tripura", code: "TR", city: "Agartala", lat: 23.8315, lon: 91.2868 },
  { state: "Uttar Pradesh", code: "UP", city: "Lucknow", lat: 26.8467, lon: 80.9462 },
  { state: "Uttarakhand", code: "UT", city: "Dehradun", lat: 30.3165, lon: 78.0322 },
  { state: "West Bengal", code: "WB", city: "Kolkata", lat: 22.5726, lon: 88.3639 },
  { state: "Delhi", code: "DL", city: "New Delhi", lat: 28.6139, lon: 77.2090 },
  { state: "Jammu and Kashmir", code: "JK", city: "Srinagar", lat: 34.0837, lon: 74.7973 },
  { state: "Ladakh", code: "LA", city: "Leh", lat: 34.1526, lon: 77.5771 },
  { state: "Chandigarh", code: "CH", city: "Chandigarh", lat: 30.7333, lon: 76.7794 },
  { state: "Puducherry", code: "PY", city: "Puducherry", lat: 11.9416, lon: 79.8083 },
  { state: "Andaman and Nicobar Islands", code: "AN", city: "Port Blair", lat: 11.6234, lon: 92.7265 },
  { state: "Dadra and Nagar Haveli and Daman and Diu", code: "DN", city: "Daman", lat: 20.3974, lon: 72.8328 },
  { state: "Lakshadweep", code: "LD", city: "Kavaratti", lat: 10.5667, lon: 72.6417 },
];

const getAQIStatus = (aqi) => {
  if (aqi <= 50) return { status: "Good", color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" };
  if (aqi <= 100) return { status: "Moderate", color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100" };
  if (aqi <= 150) return { status: "Unhealthy for Sensitive", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" };
  if (aqi <= 200) return { status: "Unhealthy", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" };
  if (aqi <= 300) return { status: "Very Unhealthy", color: "text-red-500", bg: "bg-red-50", border: "border-red-100" };
  return { status: "Hazardous", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" };
};

/**
 * Controller: Get live AQI for all major Indian states
 */
export const getLiveStatesAQI = async (req, res) => {
  try {
    const now = Date.now();
    // Use cached response if fresh (< 5 minutes)
    if (statesCache.data.length > 0 && now - statesCache.timestamp < 5 * 60 * 1000) {
      return res.json({
        success: true,
        source: "cache",
        updatedAt: new Date(statesCache.timestamp).toISOString(),
        states: statesCache.data,
      });
    }

    // Fetch all in parallel
    const stateResults = await Promise.all(
      INDIAN_STATES.map(async (item) => {
        try {
          const res = await getAQIByCoords(item.lat, item.lon);
          const aqi = res?.aqi || 78;
          const statusInfo = getAQIStatus(aqi);
          return {
            state: item.state,
            code: item.code,
            city: item.city,
            lat: item.lat,
            lon: item.lon,
            aqi,
            max: 300,
            station: res?.station || `${item.city} Sensor Station`,
            ...statusInfo,
          };
        } catch {
          return {
            state: item.state,
            code: item.code,
            city: item.city,
            lat: item.lat,
            lon: item.lon,
            aqi: 75,
            max: 300,
            ...getAQIStatus(75),
          };
        }
      })
    );

    statesCache = {
      timestamp: now,
      data: stateResults,
    };

    res.json({
      success: true,
      source: "live",
      updatedAt: new Date(now).toISOString(),
      states: stateResults,
    });
  } catch (err) {
    console.error("Live states AQI error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch live states AQI" });
  }
};

/**
 * Controller: Get live AQI and weather telemetry for specific coordinates
 */
export const getLiveLocationAQI = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 30.7333; // Default Chandigarh
    const lon = parseFloat(req.query.lon) || 76.7794;

    // 1. Reverse geocode city name
    let city = "Local Area";
    try {
      const geoRes = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
        { headers: { "User-Agent": "EcoSense-App/1.0" }, timeout: 2500 }
      );
      city = geoRes.data?.address?.city || geoRes.data?.address?.state_district || geoRes.data?.address?.state || geoRes.data?.name || "Local Area";
    } catch {
      // Keep default
    }

    // 2. Telemetry (AQI + Weather)
    const telemetry = await getLiveTelemetry(lat, lon);

    res.json({
      success: true,
      city,
      lat,
      lon,
      aqi: telemetry.aqi,
      temperature: telemetry.temperature,
      humidity: telemetry.humidity,
      windSpeed: telemetry.windSpeed,
      station: telemetry.station,
      source: telemetry.source,
      iaqi: telemetry.iaqi,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Live location AQI error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch location AQI" });
  }
};

export const cityPollutionController = async (req, res) => {
  try {
    const { city } = req.body;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "City required",
      });
    }

    // 1️⃣ City → lat/lon
    const location = await geocodeCity(city);

    if (!location) {
      return res.status(400).json({
        success: false,
        message: "Invalid city",
      });
    }

    // 2️⃣ Real AQI (safe)
    let aqi = null;
    try {
      const aqiRes = await getAQIByCoords(location.lat, location.lon);
      aqi = aqiRes?.aqi ?? null;
    } catch (e) {
      console.warn("AQI fetch failed, continuing...");
    }

    // 3️⃣ ALWAYS CREATE A VALID BBOX
    const bbox = Array.isArray(location.bbox)
      ? location.bbox
      : [
          location.lat - 0.1, // south
          location.lat + 0.1, // north
          location.lon - 0.1, // west
          location.lon + 0.1, // east
        ];

    // 4️⃣ Detect pollution sources (safe)
    let sources = {
      transport: 0,
      industry: 0,
      power: 0,
      construction: 0,
    };

    try {
      sources = await detectPollutionSources(bbox);
    } catch (e) {
      console.warn("Overpass failed, continuing...");
    }

    // 5️⃣ Calculate sector contribution
    const contribution = calculateSectorContribution(sources);

    // 6️⃣ Response
    res.json({
      success: true,
      city,
      coordinates: location,
      aqi,
      contribution,
      detectedSources: sources,
    });
  } catch (err) {
    console.error("City pollution error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to calculate pollution contribution",
    });
  }
};