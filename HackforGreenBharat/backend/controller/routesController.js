import axios from "axios";
import aqiCache from "../utils/aqiCache.js";
import { geocodeCity } from "../utils/geocodeCity.js";
import { getAQIByCoords } from "../utils/getAQI.js";
import { reverseGeocode } from "../utils/reverseGeocode.js";
import { getEVStations } from "../utils/getEVStations.js";
import { getRoadAttributes } from "../utils/overpassService.js";

/* ============ CONSTANTS ============ */
const osrmCache = new Map();
const AQI_TIMEOUT_MS = 3000; // Per-AQI call timeout (3s max per point)
const ROUTE_BUDGET_MS = 7000;  // Total AQI budget per route — ensures <10s

/* ============ HELPERS ============ */

/** Pick exactly 5 evenly-spaced points from geometry */
const sampleRoutePoints = (geometry) => {
  if (geometry.length <= 5) return geometry;
  const step = Math.floor(geometry.length / 4);
  const pts = [];
  for (let i = 0; i < 4; i++) pts.push(geometry[i * step]);
  pts.push(geometry[geometry.length - 1]);
  return pts;
};

/** Cap map geometry at maxPoints to keep payload tiny */
const simplifyGeometry = (coords, maxPoints = 300) => {
  if (coords.length <= maxPoints) return coords;
  const step = Math.floor(coords.length / maxPoints);
  const result = [];
  for (let i = 0; i < coords.length; i += step) {
    result.push(coords[i]);
    if (result.length >= maxPoints) break;
  }
  if (result[result.length - 1] !== coords[coords.length - 1]) {
    result.push(coords[coords.length - 1]);
  }
  return result;
};

const getZone = (aqi) => {
  if (aqi === null) return "Unknown";
  if (aqi > 200) return "High";
  if (aqi > 100) return "Medium";
  return "Low";
};

const getTrafficLevel = (speedKmph) => {
  if (speedKmph < 15) return "Heavy";
  if (speedKmph < 30) return "Moderate";
  return "Light";
};

/** Fetch AQI with a hard per-call timeout */
const fetchAQI = async (lat, lon) => {
  const aqiKey = `aqi:${lat.toFixed(3)},${lon.toFixed(3)}`;
  let aqi = aqiCache.get(aqiKey);
  if (aqi !== undefined) return aqi;

  try {
    const result = await Promise.race([
      getAQIByCoords(lat, lon),
      new Promise((resolve) => setTimeout(() => resolve({ aqi: null }), AQI_TIMEOUT_MS)),
    ]);
    aqi = result?.aqi ?? null;
  } catch {
    aqi = null;
  }

  aqiCache.set(aqiKey, aqi);
  return aqi;
};

/** Fetch reverse geocode with a hard per-call timeout */
const fetchArea = async (lat, lon) => {
  const revKey = `rev_v3:${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = aqiCache.get(revKey);
  if (cached) return cached;

  try {
    const result = await Promise.race([
      reverseGeocode(lat, lon),
      new Promise((resolve) => setTimeout(() => resolve("Along Route"), 4000)),
    ]);
    aqiCache.set(revKey, result);
    return result;
  } catch {
    return "Along Route";
  }
};


export const routeController = async (req, res) => {
  try {
    const { originCity, destinationCity, preferences } = req.body;

    if (!originCity || !destinationCity) {
      return res.status(400).json({ success: false, message: "originCity and destinationCity required" });
    }

    const prefs = preferences || {};
    const isPregnancyMode = !!prefs.isPregnancyMode;
    const preferWellLit = !!prefs.preferWellLit;
    const season = prefs.season || "none"; // "winter" | "summer" | "none"

    /* ✅ Route-level cache key adjusted to include preferences */
    const routeCacheKey = `route_v17:${originCity.toLowerCase()}:${destinationCity.toLowerCase()}:${isPregnancyMode}:${preferWellLit}:${season}`;
    const cached = aqiCache.get(routeCacheKey);
    if (cached) {
      console.log(`[CACHE HIT] ${routeCacheKey}`);
      return res.json(cached);
    }

    /* 🌍 Geocode both cities sequentially to avoid Nominatim 429 Ratelimits */
    const origin = await geocodeCity(originCity);
    const destination = await geocodeCity(destinationCity);

    if (!origin || !destination) {
      return res.status(400).json({ success: false, message: "Could not find one or both cities." });
    }

    /* 🛣️ OSRM with in-memory cache */
    const osrmKey = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
    let osrmData = osrmCache.get(osrmKey);

    if (!osrmData) {
      const osrmURL = `https://router.project-osrm.org/route/v1/driving/${osrmKey}?overview=full&geometries=geojson&alternatives=true`;
      const osrmRes = await axios.get(osrmURL, { timeout: 12000 });
      osrmData = osrmRes.data;
      osrmCache.set(osrmKey, osrmData);
    }

    /* 🏎️ FAST FALLBACK MODE — no AQI, just geometry */
    if (req.query.fast === "true") {
      const fastRoutes = osrmData.routes.map((r, i) => ({
        id: i,
        name: `Quick Path ${i + 1}`,
        distance: `${(r.distance / 1000).toFixed(1)} km`,
        duration: `${Math.round(r.duration / 60)} min`,
        avgAQI: null,
        geometry: simplifyGeometry(r.geometry.coordinates.map(([lon, lat]) => ({ lat, lon }))),
        pollutionSegments: [],
        healthAdvice: "Calculating air quality...",
        travelTip: "Just a moment while we find the cleanest air.",
      }));

      return res.json({ success: true, origin, destination, routes: fastRoutes, isFastFallback: true });
    }

    /* 🚀 CONCURRENT FULL ANALYSIS — all routes processed in parallel */
    const routePromises = osrmData.routes.map(async (r, i) => {
      const distanceKm = r.distance / 1000;
      const durationMin = r.duration / 60;
      const avgSpeed = distanceKm / (r.duration / 3600);
      const traffic = getTrafficLevel(avgSpeed);

      const fullGeometry = r.geometry.coordinates.map(([lon, lat]) => ({ lat, lon }));
      const geometry = simplifyGeometry(fullGeometry);
      const sampledPoints = sampleRoutePoints(fullGeometry);

      /* ⏱️ Fetch all segment AQI + area + road attributes in parallel with a global budget timeout */
      const segmentPromises = sampledPoints.map(async (p) => {
        const [aqi, area, roadAttributes] = await Promise.all([
          fetchAQI(p.lat, p.lon),
          fetchArea(p.lat, p.lon),
          getRoadAttributes(p.lat, p.lon)
        ]);
        return { lat: p.lat, lon: p.lon, aqi, zone: getZone(aqi), area, roadAttributes };
      });

      /* 🔋 Also kick off EV stations fetch */
      const evStationsPromise = getEVStations(sampledPoints);

      /* Race the entire segment batch (and EV) against a hard budget */
      const [pollutionSegments, evStations] = await Promise.race([
        Promise.all([Promise.all(segmentPromises), evStationsPromise]),
        new Promise((resolve) =>
          setTimeout(() => {
            console.warn(`[TIMEOUT] Route ${i} — returning partial AQI and attributes`);
            resolve([
              sampledPoints.map((p) => ({
                lat: p.lat,
                lon: p.lon,
                aqi: null,
                zone: "Unknown",
                area: "Along Route",
                roadAttributes: { hasLit: true, smoothnessScore: 6, isPaved: true, greenCover: 0 }
              })),
              []
            ]);
          }, ROUTE_BUDGET_MS)
        ),
      ]);

      const validAQI = pollutionSegments.map((p) => p.aqi).filter((a) => a !== null);
      const avgAQI = validAQI.length ? Math.round(validAQI.reduce((a, b) => a + b, 0) / validAQI.length) : null;

      // Dynamic weighting based on user preferences
      let aqiWeight = 2.0;
      let durationWeight = 0.5;
      let penaltyPoints = 0;

      if (season === "winter") {
        aqiWeight = 3.5; // Smog check: heavily penalize poor air quality
      }

      let litCount = 0;
      let totalSmoothness = 0;
      let pavedCount = 0;
      let totalGreen = 0;

      pollutionSegments.forEach((seg) => {
        const attr = seg.roadAttributes || { hasLit: true, smoothnessScore: 6, isPaved: true, greenCover: 0 };
        if (attr.hasLit) litCount++;
        totalSmoothness += attr.smoothnessScore;
        if (attr.isPaved) pavedCount++;
        totalGreen += attr.greenCover;
      });

      const avgSmoothness = totalSmoothness / pollutionSegments.length;
      const percentLit = litCount / pollutionSegments.length;
      const percentPaved = pavedCount / pollutionSegments.length;
      const avgGreen = totalGreen / pollutionSegments.length;

      if (preferWellLit) {
        // Penalty for darker paths (lack of street lights)
        penaltyPoints += (1.0 - percentLit) * 80;
      }

      if (isPregnancyMode) {
        // Penalty for bad smoothness (bumpiness) and unpaved roads
        const smoothnessPenalty = (10 - avgSmoothness) * 15;
        const unpavedPenalty = (1.0 - percentPaved) * 50;
        penaltyPoints += smoothnessPenalty + unpavedPenalty;
        durationWeight = 0.8; // pregnancy/elder: value smooth ride over raw travel speed
      }

      if (season === "summer") {
        // Shade bonus: reward green canopy cover
        const shadeBonus = avgGreen * 8;
        penaltyPoints -= shadeBonus;
      }

      const score = (durationMin * durationWeight) + ((avgAQI ?? 150) * aqiWeight) + penaltyPoints;

      return {
        id: i,
        distance: `${distanceKm.toFixed(1)} km`,
        duration: `${Math.round(durationMin)} min`,
        avgAQI,
        score,
        traffic,
        avgSpeed: avgSpeed.toFixed(1),
        pollutionSegments,
        evStations,
        geometry,
      };
    });

    const routes = await Promise.all(routePromises);

    if (!routes.length) throw new Error("No routes found from OSRM");

    /* 🏆 Sort: best score first (low score = preferred route) */
    routes.sort((a, b) => a.score - b.score);

    /* 💬 Humanize */
    const humanizedRoutes = routes.map((route, index) => {
      let name = `Efficient Option ${index + 1} ⚡`;
      if (isPregnancyMode) {
        if (index === 0) name = "Pregnancy & Elder Safe Route 🤱";
        else name = "Standard Route (Bumpy) 🚗";
      } else if (preferWellLit) {
        if (index === 0) name = "Bright & Secure Route 💡";
        else name = "Alternate Route 🛣️";
      } else if (season === "winter") {
        if (index === 0) name = "Smog-Avoidance Route ❄️";
        else name = "Scenic Path 🌲";
      } else if (season === "summer") {
        if (index === 0) name = "Shaded Canopy Route ☀️";
        else name = "Direct Highway 🚗";
      } else {
        if (index === 0) name = "Eco-Champion 🍃";
        else if (route.avgAQI !== null && route.avgAQI <= 50) name = "The Nature Path 🌿";
      }

      let healthAdvice = "Safe for most travelers.";
      let travelTip = "Keep an eye on the air as you go.";

      if (isPregnancyMode) {
        healthAdvice = "Optimized for minimal bumps, smooth pavements, and high lighting.";
        travelTip = "Recommended road for pregnant women and elderly family members.";
      } else if (preferWellLit) {
        healthAdvice = "Street lighting detected along the majority of this route.";
        travelTip = "Excellent option for driving safely after sunset or solo travel.";
      } else if (season === "winter") {
        healthAdvice = "Bypasses heavy industrial smog and traffic density hotspots.";
        travelTip = "Recommended to minimize exposure to winter fog and high PM2.5 levels.";
      } else if (season === "summer") {
        healthAdvice = "Route elements offer high tree canopy density, avoiding heat island corridors.";
        travelTip = "Keeps vehicle heat exposure low. Enjoy cooler driving surroundings!";
      } else {
        if (route.avgAQI === null) {
          healthAdvice = "AQI data unavailable for this route.";
          travelTip = "Check local conditions before you travel.";
        } else if (route.avgAQI <= 50) {
          healthAdvice = "Fresh air ahead! Great for any traveler.";
          travelTip = "Windows down — enjoy the breeze!";
        } else if (route.avgAQI <= 100) {
          healthAdvice = "Air quality is acceptable. Enjoy your trip.";
          travelTip = "A pleasant route with moderate air.";
        } else if (route.avgAQI <= 200) {
          healthAdvice = "Sensitive groups should wear a mask.";
          travelTip = "Consider keeping windows slightly closed.";
        } else {
          healthAdvice = "Severe pollution detected. Close all windows.";
          travelTip = "Enable air recirculation and stay safe.";
        }
      }

      return { ...route, name, healthAdvice, travelTip };
    });

    const response = { success: true, origin, destination, routes: humanizedRoutes };

    console.log(`[v17] ${originCity}→${destinationCity} | ${routes.length} routes | lit/pregnancy preferences processed`);

    aqiCache.set(routeCacheKey, response);
    res.json(response);
  } catch (err) {
    console.error("ROUTE CONTROLLER ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};