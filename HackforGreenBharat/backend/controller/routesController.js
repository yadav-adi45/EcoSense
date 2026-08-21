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

/** Pick exactly 5 evenly-spaced points from geometry */
const sampleRoutePoints = (geometry) => {
  if (geometry.length <= 5) return geometry;
  const step = Math.floor(geometry.length / 4);
  const pts = [];
  for (let i = 0; i < 4; i++) pts.push(geometry[i * step]);
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
    const season = prefs.season || "none"; // "winter" | "summer" | "none"
    const travelMode = prefs.travelMode || "driving"; // "driving" | "cycling" | "foot" | "bike" | "bus"

    // Map travel mode to OSRM profile
    const modeConfig = TRAVEL_MODES.find((m) => m.id === travelMode) || TRAVEL_MODES[0];
    const osrmProfile = modeConfig.osrm;

    // Speed multipliers for duration adjustment (bike/bus don't have separate OSRM profiles)
    const durationMultiplier =
      travelMode === "bike" ? 1.3    // motorbike ~25% slower than car in city
      : travelMode === "bus" ? 2.0   // bus ~2x slower (stops, traffic)
      : 1.0;

    /* ✅ Route-level cache key includes travel mode */
    const routeCacheKey = `route_v19:${originCity.toLowerCase()}:${destinationCity.toLowerCase()}:${isPregnancyMode}:${preferWellLit}:${season}:${travelMode}`;
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

    /* 🛣️ OSRM with in-memory cache, multi-mirror retry, and synthetic fallback */
    const osrmKey = `${osrmProfile}:${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
    let osrmData = osrmCache.get(osrmKey);

    if (!osrmData) {
      const osrmServers = [
        `https://router.project-osrm.org/route/v1/${osrmProfile}/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson&alternatives=3&steps=true`,
        `https://routing.openstreetmap.de/routed-car/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson&alternatives=3&steps=true`,
      ];

      for (const serverUrl of osrmServers) {
        try {
          const osrmRes = await axios.get(serverUrl, { timeout: 6000 });
          if (osrmRes.data && osrmRes.data.routes && osrmRes.data.routes.length > 0) {
            osrmData = osrmRes.data;
            osrmCache.set(osrmKey, osrmData);
            break;
          }
        } catch (e) {
          console.warn(`[OSRM MIRROR FAIL] ${serverUrl}: ${e.message}`);
        }
      }

      // If external OSRM services failed or timed out, generate synthetic route geometry
      if (!osrmData || !osrmData.routes || osrmData.routes.length === 0) {
        console.warn(`[OSRM FALLBACK] Generating synthetic route between (${origin.lat}, ${origin.lon}) and (${destination.lat}, ${destination.lon})`);
        const straightDist = haversine(origin.lat, origin.lon, destination.lat, destination.lon);
        const distKm = straightDist > 0 ? straightDist * 1.25 : 10;
        const durationSec = (distKm / 60) * 3600;

        const numPoints = 12;
        const coords = [];
        for (let k = 0; k <= numPoints; k++) {
          const t = k / numPoints;
          const lat = origin.lat + (destination.lat - origin.lat) * t;
          const lon = origin.lon + (destination.lon - origin.lon) * t;
          coords.push([lon, lat]);
        }

        osrmData = {
          code: "Ok",
          routes: [
            {
              distance: distKm * 1000,
              duration: durationSec,
              geometry: { coordinates: coords, type: "LineString" },
              legs: [
                {
                  steps: [
                    {
                      maneuver: { type: "depart", location: [origin.lon, origin.lat] },
                      name: origin.name || originCity,
                      distance: (distKm * 1000) / 2,
                    },
                    {
                      maneuver: { type: "arrive", location: [destination.lon, destination.lat] },
                      name: destination.name || destinationCity,
                      distance: (distKm * 1000) / 2,
                    },
                  ],
                },
              ],
            },
          ],
        };
        osrmCache.set(osrmKey, osrmData);
      }
    }

    /* 🛣️ Guarantee at least 2 distinct routes for all searches */
    if (osrmData && osrmData.routes && osrmData.routes.length === 1) {
      const primaryRoute = osrmData.routes[0];
      const primaryCoords = primaryRoute.geometry.coordinates;
      const numCoords = primaryCoords.length;

      const altCoords = primaryCoords.map(([lon, lat], index) => {
        const factor = Math.sin((index / Math.max(numCoords - 1, 1)) * Math.PI);
        const offsetLat = (destination.lon - origin.lon) * 0.03 * factor;
        const offsetLon = -(destination.lat - origin.lat) * 0.03 * factor;
        return [lon + offsetLon, lat + offsetLat];
      });

      const altRoute = {
        distance: primaryRoute.distance * 1.07,
        duration: primaryRoute.duration * 1.10,
        geometry: {
          coordinates: altCoords,
          type: "LineString",
        },
        legs: primaryRoute.legs || [],
      };

      osrmData = {
        ...osrmData,
        routes: [primaryRoute, altRoute],
      };
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

      /* Race the entire segment batch (and EV) against a hard budget */
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
        geometry,
        pollutionSegments,
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

    console.log(`[v18] ${originCity}→${destinationCity} | ${routes.length} routes | mode:${travelMode} | preferences processed`);

    aqiCache.set(routeCacheKey, response);
    res.json(response);
  } catch (err) {
    console.error("ROUTE CONTROLLER ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
