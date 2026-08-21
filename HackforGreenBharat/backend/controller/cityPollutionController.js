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
  { state: "Delhi", city: "New Delhi", lat: 28.6139, lon: 77.2090 },
  { state: "Maharashtra", city: "Mumbai", lat: 19.0760, lon: 72.8777 },
  { state: "Karnataka", city: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  { state: "Tamil Nadu", city: "Chennai", lat: 13.0827, lon: 80.2707 },
  { state: "West Bengal", city: "Kolkata", lat: 22.5726, lon: 88.3639 },
  { state: "Telangana", city: "Hyderabad", lat: 17.3850, lon: 78.4867 },
  { state: "Gujarat", city: "Ahmedabad", lat: 23.0225, lon: 72.5714 },
  { state: "Uttar Pradesh", city: "Lucknow", lat: 26.8467, lon: 80.9462 },
  { state: "Rajasthan", city: "Jaipur", lat: 26.9124, lon: 75.7873 },
  { state: "Punjab", city: "Chandigarh", lat: 30.7333, lon: 76.7794 },
  { state: "Kerala", city: "Kochi", lat: 9.9312, lon: 76.2673 },
  { state: "Madhya Pradesh", city: "Bhopal", lat: 23.2599, lon: 77.4126 },
  { state: "Bihar", city: "Patna", lat: 25.5941, lon: 85.1376 },
  { state: "Odisha", city: "Bhubaneswar", lat: 20.2961, lon: 85.8245 },
  { state: "Assam", city: "Guwahati", lat: 26.1445, lon: 91.7362 },
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
          const aqi = res?.aqi || 85;
          const statusInfo = getAQIStatus(aqi);
          return {
            state: item.state,
            city: item.city,
            lat: item.lat,
            lon: item.lon,
            aqi,
            max: 300,
            station: res?.station || `${item.city} Station`,
            ...statusInfo,
          };
        } catch {
          return {
            state: item.state,
            city: item.city,
            lat: item.lat,
            lon: item.lon,
            aqi: 90,
            max: 300,
            ...getAQIStatus(90),
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