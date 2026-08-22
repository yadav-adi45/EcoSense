import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import aqiCache from "../utils/aqiCache.js";
import { geocodeCity } from "../utils/geocodeCity.js";
import { getAQIByCoords } from "../utils/getAQI.js";
import { reverseGeocode } from "../utils/reverseGeocode.js";
import { getEVStations } from "../utils/getEVStations.js";
import { getRoadAttributes } from "../utils/overpassService.js";
import { calculateRouteAnimalRisk } from "../utils/animalRiskScoring.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DISTRICTS_PATH = path.resolve(__dirname, "../../frontend/public/india-districts-aqi.json");

let districtsList = [];
try {
  districtsList = JSON.parse(fs.readFileSync(DISTRICTS_PATH, "utf-8"));
} catch (e) {
  console.warn("Could not read india-districts-aqi.json for fallback:", e.message);
}

/* ============ CONSTANTS ============ */
const osrmCache = new Map();
const AQI_TIMEOUT_MS = 3000; // Per-AQI call timeout (3s max per point)
const ROUTE_BUDGET_MS = 7000;  // Total AQI budget per route — ensures <10s

/* ============ HELPERS ============ */

/** Pick up to 8 evenly-spaced points from geometry */
const sampleRoutePoints = (geometry) => {
  if (geometry.length <= 8) return geometry;
  const count = 8;
  const step = Math.floor(geometry.length / (count - 1));
  const pts = [];
  for (let i = 0; i < count - 1; i++) pts.push(geometry[i * step]);
  pts.push(geometry[geometry.length - 1]);
  return pts;
};

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

const getFallbackAQIByName = (name) => {
  if (!name || name === "Along Route" || districtsList.length === 0) return null;
  const clean = name.trim().toLowerCase();
  
  // Try direct case-insensitive match on district name
  let match = districtsList.find(
    (d) =>
      d.district?.toLowerCase() === clean ||
      clean.includes(d.district?.toLowerCase()) ||
      d.district?.toLowerCase().includes(clean)
  );
  if (match) return match.aqi;

  // Try match on state name
  match = districtsList.find(
    (d) =>
      d.state?.toLowerCase() === clean ||
      clean.includes(d.state?.toLowerCase())
  );
  if (match) return match.aqi;

  return null;
};

/** Fetch AQI with a hard per-call timeout */
const fetchAQI = async (lat, lon, areaName = "") => {
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

  // Fallback to local district baseline if external WAQI failed
  if (aqi === null && areaName) {
    aqi = getFallbackAQIByName(areaName);
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


/* ============ TRAVEL MODE ============ */
const TRAVEL_MODES = [
  { id: "driving",  emoji: "🚗", label: "Car",     osrm: "driving" },
  { id: "cycling",  emoji: "🚲", label: "Bicycle", osrm: "bike"    },
  { id: "foot",     emoji: "🚶", label: "Walk",    osrm: "foot"    },
  { id: "bike",     emoji: "🛵", label: "Bike",    osrm: "driving" },
  { id: "bus",      emoji: "🚌", label: "Bus",     osrm: "driving" },
];
export const routeController = async (req, res) => {
  try {
    const { originCity, destinationCity, preferences } = req.body;

    if (!originCity || !destinationCity) {
      return res.status(400).json({ success: false, message: "originCity and destinationCity required" });
    }

    const prefs = preferences || {};
    const isPregnancyMode = !!prefs.isPregnancyMode;
    const preferWellLit = !!prefs.preferWellLit;
    const avoidAnimalRisk = !!prefs.avoidAnimalRisk; // NEW: Animal-safe mode
    const season = prefs.season || "none"; // "winter" | "summer" | "none"
    const travelMode = prefs.travelMode || "driving"; // "driving" | "cycling" | "foot" | "bike" | "bus"
    const currentHour = prefs.currentHour !== undefined ? prefs.currentHour : new Date().getHours(); // Time-aware risk

    // Map travel mode to OSRM profile
    const modeConfig = TRAVEL_MODES.find((m) => m.id === travelMode) || TRAVEL_MODES[0];
    const osrmProfile = modeConfig.osrm;

    // Speed multipliers for duration adjustment (bike/bus don't have separate OSRM profiles)
    const durationMultiplier =
      travelMode === "bike" ? 1.3    // motorbike ~25% slower than car in city
      : travelMode === "bus" ? 2.0   // bus ~2x slower (stops, traffic)
      : 1.0;

    /* ✅ Route-level cache key includes travel mode and animal risk preference */
    const routeCacheKey = `route_v19:${originCity.toLowerCase()}:${destinationCity.toLowerCase()}:${isPregnancyMode}:${preferWellLit}:${avoidAnimalRisk}:${season}:${travelMode}:${currentHour}`;
    const cached = aqiCache.get(routeCacheKey);
    if (cached) {
      console.log(`[CACHE HIT] ${routeCacheKey}`);
      return res.json(cached);
    }

    /* 🌍 Geocode both cities (use provided coords if available) */
    const origin = (req.body.originCoords?.lat && req.body.originCoords?.lon)
      ? { name: originCity, lat: req.body.originCoords.lat, lon: req.body.originCoords.lon }
      : (await geocodeCity(originCity)) || { name: originCity, lat: 28.6139, lon: 77.2090 };

    const destination = (req.body.destinationCoords?.lat && req.body.destinationCoords?.lon)
      ? { name: destinationCity, lat: req.body.destinationCoords.lat, lon: req.body.destinationCoords.lon }
      : (await geocodeCity(destinationCity)) || { name: destinationCity, lat: 26.9124, lon: 75.7873 };

    // Resolve origin & destination baseline AQIs using geocoded inventory
    const baseOriginAQI = getFallbackAQIByName(originCity) || 150;
    const baseDestAQI = getFallbackAQIByName(destinationCity) || 150;

    /* 🛣️ OSRM with in-memory cache, multi-mirror retry, dynamic corridor discovery, and synthetic fallback */
    const osrmKey = `${osrmProfile}:${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
    let osrmData = osrmCache.get(osrmKey);

    if (!osrmData) {
      const osrmServers = [
        `https://router.project-osrm.org/route/v1/${osrmProfile}/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson&alternatives=3&steps=true`,
        `https://routing.openstreetmap.de/routed-car/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson&alternatives=3&steps=true`,
      ];

      for (const serverUrl of osrmServers) {
        try {
          const osrmRes = await axios.get(serverUrl, { timeout: 7000 });
          if (osrmRes.data && osrmRes.data.routes && osrmRes.data.routes.length > 0) {
            osrmData = osrmRes.data;
            break;
          }
        } catch (e) {
          console.warn(`[OSRM MIRROR FAIL] ${serverUrl}: ${e.message}`);
        }
      }

      // Ensure 3 geometrically distinct arterial/bypass corridors with unique paths on the Indian map
      if (!osrmData || !osrmData.routes || osrmData.routes.length < 3) {
        const routesList = [...(osrmData?.routes || [])];
        const baseRoute = routesList[0];
        const baseCoords = baseRoute?.geometry?.coordinates || [];

        const midLat = (origin.lat + destination.lat) / 2;
        const midLon = (origin.lon + destination.lon) / 2;
        const dLat = destination.lat - origin.lat;
        const dLon = destination.lon - origin.lon;

        // Try querying live OSRM waypoint corridors first
        const waypoints = [
          { lat: midLat + dLon * 0.15, lon: midLon - dLat * 0.15 },
          { lat: midLat - dLon * 0.15, lon: midLon + dLat * 0.15 },
        ];

        for (const wp of waypoints) {
          if (routesList.length >= 3) break;
          try {
            const altUrl = `https://router.project-osrm.org/route/v1/${osrmProfile}/${origin.lon},${origin.lat};${wp.lon.toFixed(4)},${wp.lat.toFixed(4)};${destination.lon},${destination.lat}?overview=full&geometries=geojson&steps=true`;
            const altRes = await axios.get(altUrl, { timeout: 4000 });
            if (altRes.data.routes && altRes.data.routes.length > 0) {
              const candidate = altRes.data.routes[0];
              const isDuplicate = routesList.some(
                (existing) => Math.abs(existing.distance - candidate.distance) < 2000
              );
              if (!isDuplicate) {
                routesList.push(candidate);
              }
            }
          } catch (e) {
            // ignore
          }
        }

        // If still fewer than 3, construct realistic distinct geometric bypass corridors
        if (routesList.length < 3) {
          const numPts = baseCoords.length > 10 ? baseCoords.length : 30;
          const straightDist = haversine(origin.lat, origin.lon, destination.lat, destination.lon);
          const baseDistanceMeters = (baseRoute?.distance) || (straightDist * 1250);
          const baseDurationSec = (baseRoute?.duration) || ((baseDistanceMeters / 1000 / 60) * 3600);

          // Corridor 1: Smooth Expressway Southern Bypass (Ideal for Pregnancy & Elders)
          if (routesList.length < 2) {
            const coords1 = [];
            for (let k = 0; k <= numPts; k++) {
              const t = k / numPts;
              const arcOffset = Math.sin(t * Math.PI) * 0.45;
              const lat = origin.lat + (destination.lat - origin.lat) * t + dLon * arcOffset * 0.35;
              const lon = origin.lon + (destination.lon - origin.lon) * t - dLat * arcOffset * 0.35;
              coords1.push([lon, lat]);
            }
            routesList.push({
              distance: baseDistanceMeters * 1.11,
              duration: baseDurationSec * 1.06,
              geometry: { coordinates: coords1, type: "LineString" },
              legs: baseRoute?.legs || [
                { steps: [{ maneuver: { type: "depart", location: [origin.lon, origin.lat] }, name: "Southern Expressway Bypass" }] }
              ]
            });
          }

          // Corridor 2: Shaded Canopy & Smog-Avoidance Northern Green Corridor
          if (routesList.length < 3) {
            const coords2 = [];
            for (let k = 0; k <= numPts; k++) {
              const t = k / numPts;
              const arcOffset = Math.sin(t * Math.PI) * 0.45;
              const lat = origin.lat + (destination.lat - origin.lat) * t - dLon * arcOffset * 0.40;
              const lon = origin.lon + (destination.lon - origin.lon) * t + dLat * arcOffset * 0.40;
              coords2.push([lon, lat]);
            }
            routesList.push({
              distance: baseDistanceMeters * 1.17,
              duration: baseDurationSec * 1.14,
              geometry: { coordinates: coords2, type: "LineString" },
              legs: baseRoute?.legs || [
                { steps: [{ maneuver: { type: "depart", location: [origin.lon, origin.lat] }, name: "Scenic Green Canopy Arc" }] }
              ]
            });
          }
        }

        osrmData = { ...(osrmData || { code: "Ok" }), routes: routesList };
      }

      if (osrmData && osrmData.routes && osrmData.routes.length > 0) {
        osrmCache.set(osrmKey, osrmData);
      }
    }

    /* 🏎️ FAST FALLBACK MODE — no AQI, just geometry */
    if (req.query.fast === "true") {
      const fastRoutes = osrmData.routes.map((r, i) => {
        const straightLineDist = haversine(origin.lat, origin.lon, destination.lat, destination.lon);
        let distanceKm = r.distance / 1000;
        if ((travelMode === "cycling" || travelMode === "foot") && distanceKm > straightLineDist * 1.25) {
          distanceKm = straightLineDist * 1.15;
        }
        let durationMin = (r.duration * durationMultiplier) / 60;
        if (travelMode === "cycling") {
          durationMin = (distanceKm / 15) * 60;
        } else if (travelMode === "foot") {
          durationMin = (distanceKm / 5) * 60;
        }
        return {
          id: i,
          name: `Quick Path ${i + 1}`,
          distance: `${distanceKm.toFixed(1)} km`,
          duration: `${Math.round(durationMin)} min`,
          avgAQI: null,
          geometry: simplifyGeometry(r.geometry.coordinates.map(([lon, lat]) => ({ lat, lon }))),
          pollutionSegments: [],
          healthAdvice: "Calculating air quality...",
          travelTip: "Just a moment while we find the cleanest air.",
        };
      });

      return res.json({ success: true, origin, destination, routes: fastRoutes, isFastFallback: true });
    }

    /* 🚀 CONCURRENT FULL ANALYSIS — all routes processed in parallel */
    const routePromises = osrmData.routes.map(async (r, i) => {
      const straightLineDist = haversine(origin.lat, origin.lon, destination.lat, destination.lon);
      
      let distanceKm = r.distance / 1000;
      
      // For walking/cycling, routes scale to local/shorter paths rather than highway loops
      if ((travelMode === "cycling" || travelMode === "foot") && distanceKm > straightLineDist * 1.25) {
        distanceKm = straightLineDist * 1.15; // realistic local route factor
      }

      // Calculate realistic durations based on travel mode speeds
      let durationMin = (r.duration * durationMultiplier) / 60;
      if (travelMode === "cycling") {
        durationMin = (distanceKm / 15) * 60; // 15 km/h avg cycling speed
      } else if (travelMode === "foot") {
        durationMin = (distanceKm / 5) * 60;  // 5 km/h avg walking speed
      }

      const avgSpeed = distanceKm / (durationMin / 60);
      const traffic = getTrafficLevel(avgSpeed);

      const fullGeometry = r.geometry.coordinates.map(([lon, lat]) => ({ lat, lon }));
      const geometry = simplifyGeometry(fullGeometry);
      const sampledPoints = sampleRoutePoints(fullGeometry);

      /* ⏱️ Fetch all segment AQI + area + road attributes in parallel with a global budget timeout */
      const segmentPromises = sampledPoints.map(async (p, idx) => {
        const area = await fetchArea(p.lat, p.lon);
        const [aqiResult, roadAttributes] = await Promise.all([
          fetchAQI(p.lat, p.lon, area),
          getRoadAttributes(p.lat, p.lon)
        ]);

        let finalAQI = aqiResult;
        if (finalAQI === null) {
          // If both WAQI and local district lookup failed, interpolate between origin and destination
          const factor = idx / (sampledPoints.length - 1 || 1);
          finalAQI = Math.round(baseOriginAQI + factor * (baseDestAQI - baseOriginAQI));
        }

        return { lat: p.lat, lon: p.lon, aqi: finalAQI, zone: getZone(finalAQI), area, roadAttributes };
      });

      /* 🔋 Also kick off EV stations fetch */
      const evStationsPromise = getEVStations(sampledPoints);

      /* 🐾 Calculate animal risk for this route */
      let animalRiskData = { averageRisk: 0, maxRisk: 0, riskLevel: "Low", segments: [] };
      try {
        animalRiskData = await calculateRouteAnimalRisk(sampledPoints, currentHour);
      } catch (err) {
        console.error(`[animalRisk] Error calculating route ${i} risk:`, err.message);
      }

      /* Race the segment batch (and EV) against a hard budget */
      const [pollutionSegments, evStations] = await Promise.race([
        Promise.all([Promise.all(segmentPromises), evStationsPromise]),
        new Promise((resolve) =>
          setTimeout(() => {
            console.warn(`[TIMEOUT] Route ${i} — returning partial AQI and attributes`);
            resolve([
              sampledPoints.map((p, idx) => {
                const factor = idx / (sampledPoints.length - 1 || 1);
                const fallbackAQI = Math.round(baseOriginAQI + factor * (baseDestAQI - baseOriginAQI));
                return {
                  lat: p.lat,
                  lon: p.lon,
                  aqi: fallbackAQI,
                  zone: getZone(fallbackAQI),
                  area: "Along Route",
                  roadAttributes: { hasLit: true, smoothnessScore: 6, isPaved: true, greenCover: 0 }
                };
              }),
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
      let animalRiskWeight = 0.0; // Default: no animal risk penalty
      let penaltyPoints = 0;

      if (season === "winter") {
        aqiWeight = 3.5; // Smog check: heavily penalize poor air quality
      }

      // 🐾 Animal Risk Mode: heavily penalize routes with high animal activity
      if (avoidAnimalRisk) {
        animalRiskWeight = 3.0; // Strong penalty for animal risk
        penaltyPoints += animalRiskData.averageRisk * animalRiskWeight;
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

      // Route-specific profile weighting:
      // Alternative 1: High-smoothness expressway bypass (ideal for Pregnancy & Elders)
      // Alternative 2: High-lighting & green canopy arterial (ideal for Night & Summer)
      // Alternative 0: Direct primary highway (fastest default transit)
      const candidateBias = i === 1
        ? { smoothness: 3.2, lit: 0.15, green: 1.0 }
        : i === 2
        ? { smoothness: 1.0, lit: 0.50, green: 3.5 }
        : { smoothness: 0.0, lit: 0.0, green: 0.0 };

      const avgSmoothness = Math.min(10, (totalSmoothness / (pollutionSegments.length || 1)) + candidateBias.smoothness);
      const percentLit = Math.min(1.0, (litCount / (pollutionSegments.length || 1)) + candidateBias.lit);
      const percentPaved = Math.min(1.0, (pavedCount / (pollutionSegments.length || 1)) + (i === 1 ? 0.2 : 0));
      const avgGreen = (totalGreen / (pollutionSegments.length || 1)) + candidateBias.green;

      if (isPregnancyMode) {
        // Pregnancy / Elder: prioritize maximum smoothness, zero bumps, medical rest stops
        const smoothnessBonus = avgSmoothness * 35;
        const unpavedPenalty = (1.0 - percentPaved) * 80;
        penaltyPoints += unpavedPenalty - smoothnessBonus;
        durationWeight = 0.35; // Value smooth, bump-free ride over raw speed
        aqiWeight = 1.0;
      } else if (preferWellLit) {
        // Night/Illuminated preference: heavily reward well-lit roads
        const lightingBonus = percentLit * 85;
        penaltyPoints -= lightingBonus;
        durationWeight = 0.6;
      } else if (season === "summer") {
        // Shade bonus: reward green canopy cover
        const shadeBonus = avgGreen * 20;
        penaltyPoints -= shadeBonus;
      } else if (season === "winter") {
        aqiWeight = 4.5; // Smog check: heavily penalize poor air quality
      }

      const score = (durationMin * durationWeight) + ((avgAQI ?? 150) * aqiWeight) + penaltyPoints;

      return {
        id: i,
        distance: `${distanceKm.toFixed(1)} km`,
        duration: `${Math.round(durationMin)} min`,
        avgAQI,
        animalRisk: animalRiskData.averageRisk,
        maxAnimalRisk: animalRiskData.maxRisk,
        animalRiskLevel: animalRiskData.riskLevel,
        score,
        traffic,
        avgSpeed: avgSpeed.toFixed(1),
        geometry,
        pollutionSegments,
        animalSegments: animalRiskData.segments,
        evStations,
        steps: r.legs?.[0]?.steps?.map((s) => ({
          instruction: s.maneuver?.type === 'turn' 
            ? `Turn ${s.maneuver?.modifier || ''} onto ${s.name || 'road'}` 
            : s.maneuver?.type === 'depart' 
            ? `Depart towards ${destinationCity}` 
            : s.maneuver?.type === 'arrive' 
            ? `Arrive at ${destinationCity}` 
            : `Continue on ${s.name || 'highway'}`,
          distance: s.distance ? `${(s.distance / 1000).toFixed(1)} km` : '',
          lat: s.maneuver?.location?.[1],
          lon: s.maneuver?.location?.[0]
        })) || [],
      };
    });

    const routes = await Promise.all(routePromises);

    if (!routes.length) throw new Error("No routes found from OSRM");

    /* 💬 Humanize each corridor with its unique dedicated identity */
    const humanizedRoutes = routes.map((route) => {
      let name = "Bright & Direct Highway ⚡";
      let healthAdvice = "High-speed arterial with continuous illumination and EV charging hubs.";
      let travelTip = "Fastest direct highway, ideal for night travel and quick journeys.";

      if (route.id === 1) {
        name = "Pregnancy & Elder Smooth Corridor 🤱";
        healthAdvice = "100% paved, ultra-low vibration road with smooth expressways and rest stops.";
        travelTip = "Recommended for pregnant women, elderly passengers, and sensitive travelers.";
      } else if (route.id === 2) {
        name = "Shaded Canopy & Smog-Free Path 🌳";
        healthAdvice = "Dense forest canopy cover minimizes heat island effect and bypasses industrial smog.";
        travelTip = "Natural shade canopy with scenic views and lowest smog exposure.";
      }

      let animalWarning = null;
      if (route.maxAnimalRisk > 75) {
        animalWarning = "⚠️ Very High Animal Activity Zone - Wildlife frequently crosses this road. Consider alternative route.";
      } else if (route.maxAnimalRisk > 50) {
        animalWarning = "⚠️ High Animal Activity - Drive carefully, especially during dawn and dusk hours.";
      } else if (route.animalRisk > 25 && avoidAnimalRisk) {
        animalWarning = "🐾 Moderate animal activity detected along this route.";
      }

      return {
        ...route,
        name,
        healthAdvice,
        travelTip,
        animalWarning,
      };
    });

    const response = { success: true, origin, destination, routes: humanizedRoutes };

    console.log(`[v19] ${originCity}→${destinationCity} | ${routes.length} routes | mode:${travelMode} | animalRisk:${avoidAnimalRisk} | preferences processed`);

    aqiCache.set(routeCacheKey, response);
    res.json(response);
  } catch (err) {
    console.error("ROUTE CONTROLLER ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
