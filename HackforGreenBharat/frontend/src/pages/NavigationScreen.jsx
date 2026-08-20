import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MapContainer, TileLayer, Polyline, Marker, Popup, Circle, useMap, useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import {
  Navigation, X, Volume2, VolumeX, RotateCcw, ZoomIn, ZoomOut,
  MapPin, Leaf, ChevronRight, Wind, Gauge, Thermometer, Droplets,
  AlertTriangle, RefreshCw, Hospital, ShieldCheck,
} from "lucide-react";
import { serverUrl } from "@/main";

/* ─── Overpass URL (same as RouteInsights) ───────────────── */
const OVERPASS_URL = "https://overpass.openstreetmap.fr/api/interpreter";

/* ─── Normalize array [lat,lon] or object {lat,lon} geometry ─── */
const normalizeGeometry = (geom) => {
  if (!Array.isArray(geom) || geom.length === 0) return [];
  return geom
    .map((p) => {
      if (Array.isArray(p) && p.length >= 2) return { lat: Number(p[0]), lon: Number(p[1]) };
      if (p && typeof p === "object" && "lat" in p && "lon" in p)
        return { lat: Number(p.lat), lon: Number(p.lon) };
      return null;
    })
    .filter(Boolean);
};

/* ─── Sample N evenly-spaced points from route geometry ─── */
const sampleGeometry = (geometry, maxPoints = 10) => {
  const norm = normalizeGeometry(geometry);
  if (norm.length === 0) return [];
  if (norm.length <= maxPoints) return norm;
  const step = Math.floor(norm.length / (maxPoints - 1));
  const pts = [];
  for (let i = 0; i < maxPoints - 1; i++) pts.push(norm[i * step]);
  pts.push(norm[norm.length - 1]);
  return pts;
};

/* ─── Fetch hospitals & police along the FULL route ──────── */
/* Searches around every sampled point (radius scales with    */
/* segment spacing) so no stretch of the route is missed.    */
const fetchRouteEmergency = async (geometry) => {
  if (!geometry || geometry.length === 0) return { hospitals: [], police: [] };

  // Pick up to 10 evenly-spaced anchor points along the route
  const anchors = sampleGeometry(geometry, 10);
  // Radius = 8 km per anchor so circles overlap on long routes
  const radiusM = 8000;

  let queryStr = `[out:json][timeout:25];\n(\n`;
  anchors.forEach(({ lat, lon }) => {
    queryStr += `  node["amenity"="hospital"](around:${radiusM},${lat},${lon});\n`;
    queryStr += `  node["amenity"="clinic"](around:${radiusM},${lat},${lon});\n`;
    queryStr += `  node["amenity"="police"](around:${radiusM},${lat},${lon});\n`;
  });
  queryStr += `);\nout body;`;

  const res = await axios.post(OVERPASS_URL, queryStr, {
    headers: { "Content-Type": "text/plain" },
    timeout: 28000,
  });

  const elements = res.data?.elements || [];
  const seenIds = new Set();
  const hospitals = [];
  const police = [];

  elements.forEach((el) => {
    if (!el.lat || !el.lon || seenIds.has(el.id)) return;
    seenIds.add(el.id);
    const name = el.tags?.name || el.tags?.["name:en"] || "Unnamed";
    // Distance from nearest route point
    let minRouteDist = Infinity;
    anchors.forEach(({ lat, lon }) => {
      const d = haversine(lat, lon, el.lat, el.lon);
      if (d < minRouteDist) minRouteDist = d;
    });
    const item = { id: el.id, name, lat: el.lat, lon: el.lon, routeDist: minRouteDist, userDist: null };
    const a = el.tags?.amenity;
    if (a === "hospital" || a === "clinic") hospitals.push(item);
    else if (a === "police") police.push(item);
  });

  return { hospitals, police };
};

/* ─── Recompute userDist for every item and sort by it ────── */
const refreshUserDistances = (items, userLat, userLon) =>
  items
    .map((item) => ({ ...item, userDist: haversine(userLat, userLon, item.lat, item.lon) }))
    .sort((a, b) => a.userDist - b.userDist);

/* ─── Leaflet Map Helpers ──────────────────────────────────── */
function FitRouteBounds({ geometry, originCoords, destinationCoords }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (geometry && geometry.length > 1) {
      const bounds = L.latLngBounds(geometry.map((p) => [p.lat, p.lon]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    } else if (originCoords && destinationCoords) {
      const bounds = L.latLngBounds([
        [originCoords.lat, originCoords.lon],
        [destinationCoords.lat, destinationCoords.lon],
      ]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
  }, [map, geometry, originCoords, destinationCoords]);
  return null;
}

function InvalidateSizeHelper() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 200);
    const t2 = setTimeout(() => map.invalidateSize(), 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);
  return null;
}

/* ─── Leaflet icons for origin / destination in Uber Style ────── */
const createUberOriginIcon = (cityName) =>
  L.divIcon({
    className: "uber-origin-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.18)); cursor: pointer;">
        <div style="background: #ffffff; border-radius: 8px; padding: 6px 14px; font-size: 13px; font-weight: 800; color: #111111; display: flex; align-items: center; gap: 6px; white-space: nowrap; margin-bottom: 6px; border: 1px solid rgba(0,0,0,0.08); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <span>From ${cityName || "Origin"}</span>
          <span style="font-size: 14px; font-weight: 900; opacity: 0.6;">›</span>
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          <div style="width: 22px; height: 22px; border-radius: 50%; background: #000000; border: 3.5px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: white;"></div>
          </div>
        </div>
      </div>
    `,
    iconSize: [160, 60],
    iconAnchor: [80, 50],
  });

const createUberDestIcon = (cityName) =>
  L.divIcon({
    className: "uber-dest-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.18)); cursor: pointer;">
        <div style="background: #ffffff; border-radius: 8px; padding: 6px 14px; font-size: 13px; font-weight: 800; color: #111111; display: flex; align-items: center; gap: 6px; white-space: nowrap; margin-bottom: 6px; border: 1px solid rgba(0,0,0,0.08); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <span>To ${cityName || "Destination"}</span>
          <span style="font-size: 14px; font-weight: 900; opacity: 0.6;">›</span>
        </div>
        <div style="width: 20px; height: 20px; background: #000000; border: 3.5px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; background: white;"></div>
        </div>
      </div>
    `,
    iconSize: [160, 60],
    iconAnchor: [80, 50],
  });

const uberVehicleIcon = L.divIcon({
  className: "uber-car-marker",
  html: `
    <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: rgba(0, 0, 0, 0.15); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 30px; height: 30px; border-radius: 50%; background: #000000; border: 2.5px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; font-size: 14px;">
        🚗
      </div>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const wildlifeHazardIcon = L.divIcon({
  className: "uber-hazard-marker",
  html: `
    <div style="background: #dc2626; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(220,38,38,0.5); font-size: 13px; animation: pulse 2s infinite;">
      🐾
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const hospitalMarkerIcon = L.divIcon({
  className: "hospital-pin",
  html: `
    <div style="background: #ef4444; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 8px rgba(239,68,68,0.45); font-size: 13px;">
      🏥
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const policeMarkerIcon = L.divIcon({
  className: "police-pin",
  html: `
    <div style="background: #2563eb; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 8px rgba(37,99,235,0.45); font-size: 13px;">
      🚔
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const roadColonyMarkerIcon = (name) =>
  L.divIcon({
    className: "colony-road-badge",
    html: `
      <div style="background: #ffffff; color: #0f172a; border: 1.5px solid #059669; border-radius: 12px; padding: 2px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.18); font-size: 11px; font-weight: 800; white-space: nowrap; display: flex; align-items: center; gap: 4px; font-family: sans-serif;">
        <span style="width: 6px; height: 6px; border-radius: 50%; background: #059669;"></span>
        <span>${name}</span>
      </div>
    `,
    iconSize: [110, 22],
    iconAnchor: [55, 11],
  });

/* ─── AQI helpers ─────────────────────────────────────────── */
const getAQIColor = (aqi) => {
  if (!aqi) return "#9CA3AF";
  if (aqi <= 50) return "#16a34a";
  if (aqi <= 100) return "#ca8a04";
  if (aqi <= 150) return "#ea580c";
  if (aqi <= 200) return "#dc2626";
  return "#7c3aed";
};

const getAQILabel = (aqi) => {
  if (!aqi) return "Unknown";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy";
  if (aqi <= 200) return "Very Unhealthy";
  return "Severe";
};

/* ─── Haversine distance (km) ────────────────────────────── */
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ─── Format distance ─────────────────────────────────────── */
const fmtDist = (km) =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

/* ─── Format ETA clock time ──────────────────────────────── */
const fmtETA = (mins) => {
  const eta = new Date(Date.now() + mins * 60_000);
  return eta.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

/* ─── Fetch OSRM steps + geometry ────────────────────────── */
const fetchOSRMSteps = async (originCoords, destinationCoords, mode = "driving") => {
  const osrmProfile =
    mode === "cycling" ? "bike"
    : mode === "foot"  ? "foot"
    : "driving";
  try {
    const url =
      `https://router.project-osrm.org/route/v1/${osrmProfile}/` +
      `${originCoords.lon},${originCoords.lat};` +
      `${destinationCoords.lon},${destinationCoords.lat}` +
      `?steps=true&geometries=geojson&overview=full`;
    const res = await axios.get(url, { timeout: 12000 });
    const route = res.data?.routes?.[0];
    if (!route) return { steps: [], geometry: [] };

    const steps = [];
    route.legs?.forEach((leg) => {
      leg.steps?.forEach((step) => {
        if (!step.maneuver?.type) return;
        const typeMap = {
          turn:        step.maneuver.modifier?.includes("right") ? "↪" : "↩",
          "new name":  "⬆", depart: "🚦", arrive: "🏁",
          merge: "↗", "on ramp": "↗", "off ramp": "↘",
          fork: "⬆", "end of road": "↩",
          roundabout: "🔄", rotary: "🔄", continue: "⬆",
        };
        const icon = typeMap[step.maneuver.type] || "⬆";
        const name = step.name || "unnamed road";
        const dist =
          step.distance > 1000
            ? `${(step.distance / 1000).toFixed(1)} km`
            : `${Math.round(step.distance)} m`;
        const text =
          step.maneuver.type === "depart" ? `Head towards ${name}`
          : step.maneuver.type === "arrive" ? "Arrive at destination"
          : `${step.maneuver.modifier
              ? step.maneuver.modifier.charAt(0).toUpperCase() +
                step.maneuver.modifier.slice(1) + " on "
              : ""}${name}`;
        steps.push({
          icon, text, dist,
          lat: step.maneuver.location[1],
          lon: step.maneuver.location[0],
          distanceMeters: step.distance,
        });
      });
    });
    const geometry =
      route.geometry?.coordinates?.map(([lon, lat]) => ({ lat, lon })) || [];
    return { steps, geometry, totalDistance: route.distance, totalDuration: route.duration };
  } catch {
    return { steps: [], geometry: [], totalDistance: 0, totalDuration: 0 };
  }
};

/* ─── Fetch weather from Open-Meteo (free, no key) ─────── */
const fetchWeather = async (lat, lon) => {
  try {
    const res = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`,
      { timeout: 6000 }
    );
    const c = res.data?.current;
    if (!c) return null;
    return {
      temp:     c.temperature_2m,
      humidity: c.relative_humidity_2m,
      wind:     c.wind_speed_10m,
      code:     c.weather_code,
    };
  } catch {
    return null;
  }
};

/* ─── WMO weather-code → emoji label ────────────────────── */
const weatherEmoji = (code) => {
  if (code === 0)          return "☀️ Clear";
  if (code <= 3)           return "🌤 Partly Cloudy";
  if (code <= 48)          return "🌫 Foggy";
  if (code <= 67)          return "🌧 Rainy";
  if (code <= 77)          return "❄️ Snowy";
  if (code <= 82)          return "🌦 Showers";
  if (code <= 99)          return "⛈ Thunderstorm";
  return "🌡 Unknown";
};

/* ─── Voice TTS ──────────────────────────────────────────── */
const speak = (text) => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-IN"; msg.rate = 0.95; msg.volume = 1;
  window.speechSynthesis.speak(msg);
};

/* ─── Smooth animated marker icon (blue nav arrow) ──────── */
const makeNavIcon = (heading = 0) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:radial-gradient(circle at 40% 35%,#60a5fa,#2563eb);
      border:3px solid white;
      box-shadow:0 0 0 6px rgba(37,99,235,0.25),0 3px 10px rgba(0,0,0,0.35);
      transform:rotate(${heading}deg);
      transition:transform 0.4s ease;
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const destIcon = new L.Icon({
  iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/blue-pushpin.png",
  iconSize: [32, 32],
  iconAnchor: [10, 32],
});

/* ─── Sub-component: recenter map when followUser=true ───── */
const RecenterMap = ({ position, follow, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (follow && position)
      map.setView(position, zoom ?? map.getZoom(), { animate: true, duration: 0.6 });
  }, [position, follow]);
  return null;
};

/* ─── Sub-component: detect map drag → disable auto-follow ── */
const DragWatcher = ({ onDrag }) => {
  useMapEvents({ dragstart: onDrag });
  return null;
};

/* ─── Sub-component: zoom controls ──────────────────────── */
const ZoomControls = () => {
  const map = useMap();
  return (
    <div
      className="absolute right-4 top-1/2 -translate-y-1/2 z-[500] flex flex-col gap-2"
      style={{ pointerEvents: "auto" }}
    >
      <button
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-700 hover:bg-blue-50 transition border border-gray-100"
      ><ZoomIn className="w-4 h-4" /></button>
      <button
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-700 hover:bg-blue-50 transition border border-gray-100"
      ><ZoomOut className="w-4 h-4" /></button>
    </div>
  );
};

/* ─── Smoothly interpolate a position towards target ──────── */
const lerp = (a, b, t) => a + (b - a) * t;
const lerpPos = ([la, loa], [lb, lob], t) => [lerp(la, lb, t), lerp(loa, lob, t)];

/* ─── Find closest point index on geometry ───────────────── */
const closestPointIndex = (geometry, lat, lon) => {
  let best = 0, bestDist = Infinity;
  if (!geometry || !Array.isArray(geometry)) return 0;
  geometry.forEach((p, i) => {
    if (!p) return;
    const pLat = p.lat ?? (Array.isArray(p) ? p[0] : null);
    const pLon = p.lon ?? (Array.isArray(p) ? p[1] : null);
    if (pLat == null || pLon == null) return;
    const d = haversine(lat, lon, pLat, pLon);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
};

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
const NavigationScreen = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const {
    route, origin, destination, originCoords, destinationCoords, travelMode,
  } = location.state || {};

  /* ── Guard ── */
  if (!route || !originCoords || !destinationCoords) {
    return (
      <div className="min-h-screen bg-[#f0faf5] flex items-center justify-center">
        <div className="text-center p-10 bg-white rounded-3xl shadow-lg">
          <Navigation className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <p className="text-gray-700 font-bold text-lg">No route selected.</p>
          <button
            onClick={() => navigate("/routes")}
            className="mt-4 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition"
          >Back to Routes</button>
        </div>
      </div>
    );
  }

  /* ── Core state ── */
  const [displayPos,    setDisplayPos]    = useState([originCoords.lat, originCoords.lon]);
  const [realPos,       setRealPos]       = useState([originCoords.lat, originCoords.lon]);
  const [heading,       setHeading]       = useState(0);
  const [followUser,    setFollowUser]    = useState(true);
  const [voiceEnabled,  setVoiceEnabled]  = useState(true);

  /* ── Route data ── */
  const [steps,         setSteps]         = useState([]);
  const [routeGeometry, setRouteGeometry] = useState(normalizeGeometry(route.geometry));
  const [totalDist,     setTotalDist]     = useState(0); // metres from OSRM
  const [loadingSteps,  setLoadingSteps]  = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  /* ── Progress & navigation ── */
  const [currentStepIdx,  setCurrentStepIdx]  = useState(0);
  const [remainingDist,   setRemainingDist]   = useState(route.distance || "—");
  const [remainingMins,   setRemainingMins]   = useState(parseInt(route.duration) || 0);
  const [progressPct,     setProgressPct]     = useState(0);
  const [speed,           setSpeed]           = useState(null); // km/h
  const [arrived,         setArrived]         = useState(false);

  /* ── Live data ── */
  const [liveAQI,     setLiveAQI]     = useState(route.avgAQI ?? null);
  const [weather,     setWeather]     = useState(null);

  /* ── Emergency services (full route) ── */
  const [allHospitals,   setAllHospitals]   = useState([]); // sorted by userDist
  const [allPolice,      setAllPolice]      = useState([]); // sorted by userDist
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [showEmergency,  setShowEmergency]  = useState(false);
  const rawHospitalsRef = useRef([]); // unsorted master list (stable after fetch)
  const rawPoliceRef    = useRef([]);
  const emergencyFetchRef = useRef(null);

  /* ── Refs ── */
  const watchIdRef       = useRef(null);
  const lastVoiceRef     = useRef("");
  const aqiIntervalRef   = useRef(null);
  const weatherIntervalRef = useRef(null);
  const animFrameRef     = useRef(null);
  const targetPosRef     = useRef([originCoords.lat, originCoords.lon]);
  const currentPosRef    = useRef([originCoords.lat, originCoords.lon]);
  const voiceRef         = useRef(true);
  const geometryRef      = useRef(normalizeGeometry(route.geometry));
  const lastRecalcRef    = useRef(0);
  voiceRef.current       = voiceEnabled;

  const segments = route.pollutionSegments || [];

  /* ── Load OSRM steps on mount ── */
  useEffect(() => {
    setLoadingSteps(true);
    fetchOSRMSteps(originCoords, destinationCoords, travelMode).then(
      ({ steps: s, geometry: g, totalDistance }) => {
        if (s.length) {
          setSteps(s);
        } else {
          setSteps([
            { icon: "🚦", text: `Head from ${origin}`, dist: "Start", distanceMeters: 0 },
            { icon: "🏁", text: `Arrive at ${destination}`, dist: "End", distanceMeters: 0 },
          ]);
        }
        const normG = normalizeGeometry(g);
        if (normG.length > 1) {
          setRouteGeometry(normG);
          geometryRef.current = normG;
        }
        if (totalDistance) setTotalDist(totalDistance);
        setLoadingSteps(false);
        if (voiceRef.current)
          setTimeout(
            () => speak(`Navigation started to ${destination}. ${route.healthAdvice || ""}`),
            600,
          );
      },
    );
  }, []);

  /* ── Smooth marker animation loop ── */
  useEffect(() => {
    const animate = () => {
      currentPosRef.current = lerpPos(
        currentPosRef.current,
        targetPosRef.current,
        0.12,
      );
      const [la, lo] = currentPosRef.current;
      const [ta, to] = targetPosRef.current;
      // Only setState when movement is noticeable (avoid rerender flood)
      if (haversine(la, lo, ta, to) > 0.000001) {
        setDisplayPos([...currentPosRef.current]);
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  /* ── Recalculate route when deviation > 300 m ── */
  const recalculate = useCallback(async (lat, lon) => {
    const now = Date.now();
    if (now - lastRecalcRef.current < 30_000) return; // throttle: once per 30 s
    lastRecalcRef.current = now;
    setRecalculating(true);
    if (voiceRef.current) speak("Recalculating route.");
    const { steps: s, geometry: g, totalDistance } = await fetchOSRMSteps(
      { lat, lon },
      destinationCoords,
      travelMode,
    );
    if (s.length) { setSteps(s); setCurrentStepIdx(0); }
    if (g.length > 1) { setRouteGeometry(g); geometryRef.current = g; }
    if (totalDistance) setTotalDist(totalDistance);
    setRecalculating(false);
  }, [destinationCoords, travelMode]);

  /* ── Live GPS tracking ── */
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    let prevLat = originCoords.lat, prevLon = originCoords.lon, prevTime = Date.now();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lon, speed: rawSpeed } = pos.coords;

        /* Heading (bearing) from previous point */
        const dLon = ((lon - prevLon) * Math.PI) / 180;
        const y = Math.sin(dLon) * Math.cos((lat * Math.PI) / 180);
        const x =
          Math.cos((prevLat * Math.PI) / 180) * Math.sin((lat * Math.PI) / 180) -
          Math.sin((prevLat * Math.PI) / 180) *
            Math.cos((lat * Math.PI) / 180) *
            Math.cos(dLon);
        const bear = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
        if (haversine(prevLat, prevLon, lat, lon) > 0.005) setHeading(bear);

        /* Speed — prefer GPS speed, fall back to calculated */
        let kmh = null;
        if (rawSpeed != null && rawSpeed >= 0) {
          kmh = rawSpeed * 3.6;
        } else {
          const dt = (Date.now() - prevTime) / 3600000; // hours
          if (dt > 0) kmh = haversine(prevLat, prevLon, lat, lon) / dt;
        }
        if (kmh !== null) setSpeed(Math.round(kmh));
        prevLat = lat; prevLon = lon; prevTime = Date.now();

        /* Move target for smooth animation */
        targetPosRef.current = [lat, lon];
        setRealPos([lat, lon]);

        /* Remaining distance to destination */
        const distKm = haversine(lat, lon, destinationCoords.lat, destinationCoords.lon);
        setRemainingDist(fmtDist(distKm));

        /* ETA: use speed if available, else 60 km/h assumption */
        const avgKmh = (kmh && kmh > 2) ? kmh : 60;
        setRemainingMins(Math.round((distKm / avgKmh) * 60));

        /* Route progress percentage */
        if (geometryRef.current.length > 1) {
          const closestIdx = closestPointIndex(geometryRef.current, lat, lon);
          setProgressPct(Math.round((closestIdx / (geometryRef.current.length - 1)) * 100));
        }

        /* Arrival */
        if (distKm < 0.15) {
          setArrived(true);
          if (voiceRef.current) speak(`You have arrived at ${destination}`);
          return;
        }

        /* Deviation check — if > 300 m off route, recalculate */
        if (geometryRef.current.length > 1) {
          const closestIdx = closestPointIndex(geometryRef.current, lat, lon);
          const cp = geometryRef.current[closestIdx];
          const offRoute = haversine(lat, lon, cp.lat, cp.lon);
          if (offRoute > 0.3) recalculate(lat, lon);
        }

        /* Step advancement */
        setSteps((prev) => {
          const nextIdx = prev.findIndex(
            (s, i) => i > currentStepIdx && s.lat && haversine(lat, lon, s.lat, s.lon) < 0.12,
          );
          if (nextIdx > 0) {
            setCurrentStepIdx(nextIdx);
            if (voiceRef.current && prev[nextIdx]?.text !== lastVoiceRef.current) {
              lastVoiceRef.current = prev[nextIdx].text;
              speak(prev[nextIdx].text);
            }
          }
          return prev;
        });
      },
      (err) => console.warn("GPS:", err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 },
    );
    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  /* ── Poll AQI every 90 s at user position ── */
  useEffect(() => {
    const poll = async () => {
      const [lat, lon] = realPos;
      try {
        const res = await axios.post(
          `${serverUrl}/api/v5/city`,
          { city: destination },
          { timeout: 6000 },
        );
        if (res.data?.aqi != null) setLiveAQI(res.data.aqi);
      } catch { /* silent */ }
    };
    poll();
    aqiIntervalRef.current = setInterval(poll, 90_000);
    return () => clearInterval(aqiIntervalRef.current);
  }, []);

  /* ── Fetch weather on mount + every 5 min ── */
  useEffect(() => {
    const fetchW = () => fetchWeather(destinationCoords.lat, destinationCoords.lon)
      .then((w) => { if (w) setWeather(w); });
    fetchW();
    weatherIntervalRef.current = setInterval(fetchW, 300_000);
    return () => clearInterval(weatherIntervalRef.current);
  }, []);

  /* ── Fetch emergency services along the full route (once) ── */
  useEffect(() => {
    const geometry = route.geometry || routeGeometry;
    if (!geometry || geometry.length === 0) return;
    setEmergencyLoading(true);
    fetchRouteEmergency(geometry)
      .then(({ hospitals, police }) => {
        const [uLat, uLon] = realPos;
        const h = refreshUserDistances(hospitals, uLat, uLon);
        const p = refreshUserDistances(police, uLat, uLon);
        rawHospitalsRef.current = hospitals;
        rawPoliceRef.current    = police;
        setAllHospitals(h);
        setAllPolice(p);
      })
      .catch(() => { /* silent */ })
      .finally(() => setEmergencyLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // Re-sort by distance whenever user position changes significantly (> 200 m)
  const lastSortPosRef = useRef([originCoords.lat, originCoords.lon]);
  useEffect(() => {
    if (rawHospitalsRef.current.length === 0 && rawPoliceRef.current.length === 0) return;
    const [prevLat, prevLon] = lastSortPosRef.current;
    const [curLat, curLon]   = realPos;
    if (haversine(prevLat, prevLon, curLat, curLon) < 0.2) return;
    lastSortPosRef.current = realPos;
    clearTimeout(emergencyFetchRef.current);
    emergencyFetchRef.current = setTimeout(() => {
      setAllHospitals(refreshUserDistances(rawHospitalsRef.current, curLat, curLon));
      setAllPolice(refreshUserDistances(rawPoliceRef.current, curLat, curLon));
    }, 1000);
  }, [realPos]);

  /* ── Cleanup voice on unmount ── */
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  /* ── Toggle voice ── */
  const toggleVoice = useCallback(() => {
    setVoiceEnabled((v) => {
      if (!v) speak("Voice enabled.");
      else window.speechSynthesis?.cancel();
      return !v;
    });
  }, []);

  /* ── Derived ── */
  const currentStep = steps[currentStepIdx] || steps[0];
  const nextStep    = steps[currentStepIdx + 1];
  const navIcon     = makeNavIcon(heading);

  /* ── Route badge ── */
  const routeBadge = (() => {
    if (route.name?.includes("Pregnancy") || route.name?.includes("Elder"))
      return { label: "Pregnancy & Elder", color: "bg-pink-100 text-pink-700 border-pink-200", icon: "🤱" };
    if (route.name?.includes("Bright") || route.name?.includes("Lit"))
      return { label: "Women Safety", color: "bg-purple-100 text-purple-700 border-purple-200", icon: "💡" };
    if (route.name?.includes("Smog") || route.name?.includes("Eco") || route.name?.includes("Champion"))
      return { label: "Low Pollution", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "🍃" };
    if (route.name?.includes("Shaded") || route.name?.includes("Canopy"))
      return { label: "Seasonal Route", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: "☀️" };
    return { label: route.name || "Navigation", color: "bg-gray-100 text-gray-700 border-gray-200", icon: "🗺️" };
  })();

  /* ── Extract actual road and highway names from OSRM steps ── */
  const majorRoads = (() => {
    const roadSet = new Set();
    if (route.summary) roadSet.add(route.summary);
    if (route.via) roadSet.add(route.via);
    (steps || []).forEach((s) => {
      if (s.name && s.name !== "unnamed road" && s.name.length > 2) {
        roadSet.add(s.name);
      }
    });
    const list = Array.from(roadSet);
    return list.length > 0 ? list : [`${origin} - ${destination} Corridor`];
  })();

  const primaryRoad = majorRoads[0];
  const connectingRoads = majorRoads.slice(1, 4);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#f6f6f6] flex flex-col select-none font-sans">
      
      {/* ── Top Navbar ── */}
      <header className="h-16 px-6 md:px-8 bg-white border-b border-gray-100 flex items-center justify-between z-30 shrink-0 shadow-sm">
        <div className="flex items-center gap-8">
          <div
            className="text-2xl font-black tracking-tighter text-gray-900 flex items-center gap-1 cursor-pointer"
            onClick={() => { window.speechSynthesis?.cancel(); navigate("/routes"); }}
          >
            <span>Eco</span>
            <span className="text-emerald-600">Sense</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full ml-1 uppercase tracking-wider">
              Road Guidance
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <div className="flex items-center gap-2 pb-1 border-b-2 border-emerald-600 font-extrabold text-emerald-800 text-sm cursor-pointer">
              <span className="text-base">🛣️</span> Selected Road: {primaryRoad}
            </div>
            <div
              onClick={() => { window.speechSynthesis?.cancel(); navigate("/routes"); }}
              className="text-gray-500 hover:text-emerald-700 font-bold text-sm cursor-pointer transition"
            >
              Alternative Routes
            </div>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { window.speechSynthesis?.cancel(); navigate("/routes"); }}
            className="px-3.5 py-1.5 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-600 font-bold text-xs border border-gray-200 flex items-center gap-1.5 transition"
          >
            <X className="w-3.5 h-3.5" /> Exit
          </button>
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shadow-sm">
            🌱
          </div>
        </div>
      </header>

      {/* ── Main 2-Column Content ── */}
      <div className="flex-1 w-full max-w-[1550px] mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6 min-h-0 overflow-hidden">
        
        {/* ════════════════════════════════════════════════════════════════
            LEFT PANEL (~460px): ROAD & HIGHWAY ROUTE ANALYSIS
            ════════════════════════════════════════════════════════════════ */}
        <div className="w-full md:w-[460px] lg:w-[490px] h-full flex flex-col bg-white rounded-3xl p-6 shadow-xl shadow-emerald-950/5 border border-emerald-100/80 overflow-y-auto shrink-0">
          
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Selected Road Route</h1>
            <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● Active Road
            </span>
          </div>

          {/* Location & Highway Summary Capsule */}
          <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/60 border border-emerald-200/80 rounded-2xl p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-extrabold text-gray-900">{origin} → {destination}</h2>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                Via {primaryRoad}
              </span>
            </div>
            <p className="text-xs text-emerald-700 font-bold mb-2">Highway Navigation Active</p>
            <div className="bg-white/80 backdrop-blur-sm text-emerald-900 border border-emerald-200/80 text-[11px] font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <span>🍃</span>
              <span>100% Eco-Optimized. ~{(parseFloat(route.distance || 0) * 0.12).toFixed(1)} kg CO₂ saved.</span>
            </div>
          </div>

          {/* Turn-by-Turn Road Guidance Card */}
          <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white rounded-2xl p-4 mb-4 shadow-lg shadow-emerald-600/20">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md text-white border border-white/20 flex items-center justify-center text-xl font-black shrink-0 shadow-md">
                {currentStep?.icon || "⬆"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-emerald-200 uppercase tracking-wider">
                  {currentStep?.dist ? `In ${currentStep.dist}` : "Next road transition"}
                </p>
                <p className="text-sm font-extrabold leading-tight text-white mt-0.5">
                  {currentStep?.text || `Continue on ${primaryRoad}`}
                </p>
              </div>
            </div>
            {nextStep && (
              <div className="mt-2.5 pt-2 border-t border-white/15 text-[11px] text-emerald-100 flex items-center gap-1 truncate font-medium">
                <ChevronRight className="w-3 h-3 text-emerald-200 shrink-0" />
                <span className="truncate">Then: {nextStep.text}</span>
              </div>
            )}
          </div>

          <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider mb-2.5">Selected Road Characteristics</h2>

          {/* Primary Selected Road Card */}
          <div className="border-2 border-emerald-500 bg-emerald-50/40 rounded-2xl p-4 flex items-center justify-between mb-3 shadow-sm transition">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm border border-emerald-100 p-2">
                🛣️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-gray-900">{primaryRoad}</h3>
                </div>
                <p className="text-xs text-gray-500 font-semibold">{remainingDist} • {remainingMins} mins total</p>
                <span className="inline-block bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1">
                  Selected Highway
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-black text-emerald-700">AQI: {liveAQI ?? 67}</p>
              <p className="text-[10px] text-gray-500 font-bold">{getAQILabel(liveAQI)} Air</p>
            </div>
          </div>

          {/* Connecting Road Stretches List */}
          {connectingRoads.length > 0 && (
            <div className="border border-gray-200 rounded-2xl p-3.5 mb-3 bg-white space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Connecting Road Corridors</p>
              {connectingRoads.map((roadName, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-black">↳</span>
                    <span className="font-bold text-gray-800">{roadName}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold">Highway Segment</span>
                </div>
              ))}
            </div>
          )}

          {/* Animal Hazard / Wildlife Corridor Warning */}
          {((route.animalRisk && (route.animalRisk.hasHighRisk || route.animalRisk.maxRisk > 25)) || route.maxAnimalRisk > 25 || route.animalWarning) && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 mb-3 text-xs shadow-sm">
              <div className="flex items-center gap-1.5 font-black text-amber-900 mb-1">
                <span>🐾</span>
                <span>Wildlife Corridor Alert</span>
              </div>
              <p className="text-amber-800 text-[11px] font-medium leading-tight">
                {route.animalWarning || "High animal crossing record on this segment. Recommended speed limit < 45 km/h."}
              </p>
            </div>
          )}

          {/* Emergency Services & Nearby Hospitals/Police Collapsible List */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden mb-3 bg-white shadow-sm">
            <button
              onClick={() => setShowEmergency((v) => !v)}
              className="w-full flex items-center justify-between p-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition text-xs font-black text-gray-800"
            >
              <span className="flex items-center gap-2">
                🚨 Nearby Emergency ({allHospitals.length} Hosp / {allPolice.length} Police)
              </span>
              <span className="text-gray-400 font-black">{showEmergency ? "▲" : "▼"}</span>
            </button>
            {showEmergency && (
              <div className="p-3 bg-white space-y-2 max-h-48 overflow-y-auto border-t border-gray-100">
                {allHospitals.slice(0, 4).map((h, i) => (
                  <div key={`hosp-hud-${i}`} className="flex items-center justify-between p-2 rounded-xl bg-red-50/60 border border-red-100 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <Hospital className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span className="font-bold text-gray-800 truncate">{h.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-red-600 shrink-0">
                      {h.userDist != null ? `${h.userDist.toFixed(1)} km` : "Nearby"}
                    </span>
                  </div>
                ))}
                {allPolice.slice(0, 4).map((p, i) => (
                  <div key={`pol-hud-${i}`} className="flex items-center justify-between p-2 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-bold text-gray-800 truncate">{p.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 shrink-0">
                      {p.userDist != null ? `${p.userDist.toFixed(1)} km` : "Nearby"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Controls & End Navigation */}
          <div className="mt-auto pt-4 space-y-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-700 font-extrabold px-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <span>🌿</span> Eco-Speed Active (~{speed != null && speed > 0 && speed < 140 ? Math.round(speed) : 52} km/h)
              </div>
              <div className="flex items-center gap-2">
                <button onClick={toggleVoice} className="p-2.5 rounded-xl bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 transition" title="Toggle Voice">
                  {voiceEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
                </button>
                <button onClick={() => setFollowUser(true)} className="p-2.5 rounded-xl bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 transition" title="Recenter">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={() => { window.speechSynthesis?.cancel(); navigate("/routes"); }}
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold py-3.5 rounded-2xl shadow-lg shadow-emerald-600/25 transition text-sm tracking-wide text-center"
            >
              End Navigation
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT PANEL (~60%-62% width): HIGHWAY ROAD MAP
            ════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 h-full min-h-[500px] bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden relative">
          
          {/* Floating Selected Road Badge on Map */}
          <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl px-4 py-2 shadow-lg flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Selected Road</p>
              <p className="text-xs font-black text-gray-900 leading-tight mt-0.5">{primaryRoad}</p>
            </div>
            <span className="ml-2 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
              {remainingDist}
            </span>
          </div>

          <MapContainer
            center={displayPos}
            zoom={12}
            minZoom={3}
            maxZoom={20}
            zoomSnap={0.5}
            zoomDelta={0.5}
            wheelPxPerZoomLevel={100}
            zoomControl={true}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            {/* Google Maps Clean Street Tile Layer with maxNativeZoom & keepBuffer */}
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
              maxNativeZoom={19}
              maxZoom={20}
              keepBuffer={8}
              crossOrigin="anonymous"
            />

            <InvalidateSizeHelper />
            <FitRouteBounds
              geometry={routeGeometry}
              originCoords={originCoords}
              destinationCoords={destinationCoords}
            />
            <DragWatcher onDrag={() => setFollowUser(false)} />

            {/* Selected Road Casing (Dark Slate Outer Outline) */}
            {routeGeometry.length > 1 && (
              <Polyline
                positions={routeGeometry.map((p) => [p.lat, p.lon])}
                pathOptions={{
                  color: "#0f172a",
                  weight: 8,
                  opacity: 0.95,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            )}

            {/* Selected Road Core Highway (Vibrant Emerald Navigation) */}
            {routeGeometry.length > 1 && (
              <Polyline
                positions={routeGeometry.map((p) => [p.lat, p.lon])}
                pathOptions={{
                  color: "#059669",
                  weight: 5,
                  opacity: 1,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            )}

            {/* Origin Marker with floating 'From <City> ›' pill */}
            {originCoords && (
              <Marker position={[originCoords.lat, originCoords.lon]} icon={createUberOriginIcon(origin)}>
                <Popup>
                  <div className="text-xs font-black text-gray-800">
                    <span>Start: {origin}</span>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Destination Marker with floating 'To <City> ›' pill */}
            {destinationCoords && (
              <Marker position={[destinationCoords.lat, destinationCoords.lon]} icon={createUberDestIcon(destination)}>
                <Popup>
                  <div className="text-xs font-black text-gray-800">
                    <span>Destination: {destination}</span>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Road Colonies & Key Waypoints */}
            {steps
              .filter((st) => st.name && st.name !== "unnamed road" && st.lat && st.lon)
              .slice(0, 5)
              .map((st, i) => (
                <Marker key={`colony-${i}`} position={[st.lat, st.lon]} icon={roadColonyMarkerIcon(st.name)}>
                  <Popup>
                    <div className="text-xs font-bold text-gray-800">
                      <div>📍 <strong>Colony / Sector:</strong> {st.name}</div>
                      <div className="text-[10px] text-gray-500">{st.dist ? `In ${st.dist}` : 'En route'}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Nearby Hospital Markers */}
            {allHospitals.slice(0, 6).map((h, i) => (
              <Marker key={`hosp-map-${h.id ?? i}`} position={[h.lat, h.lon]} icon={hospitalMarkerIcon}>
                <Popup>
                  <div className="text-xs font-black text-red-600">🏥 {h.name}</div>
                  <div className="text-[10px] text-gray-600">
                    {h.userDist != null ? `${h.userDist.toFixed(1)} km from your location` : "Emergency Hospital"}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Nearby Police Station Markers */}
            {allPolice.slice(0, 6).map((p, i) => (
              <Marker key={`pol-map-${p.id ?? i}`} position={[p.lat, p.lon]} icon={policeMarkerIcon}>
                <Popup>
                  <div className="text-xs font-black text-blue-600">🚔 {p.name}</div>
                  <div className="text-[10px] text-gray-600">
                    {p.userDist != null ? `${p.userDist.toFixed(1)} km from your location` : "Police Station"}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Wildlife Hazard Checkpoints */}
            {(route.pollutionSegments || [])
              .filter((seg) => (route.animalRisk?.maxRisk > 40 || route.maxAnimalRisk > 40) && seg.lat && seg.lon)
              .slice(0, 3)
              .map((seg, idx) => (
                <Marker key={`hazard-${idx}`} position={[seg.lat, seg.lon]} icon={wildlifeHazardIcon}>
                  <Popup>
                    <div className="text-xs font-black text-red-600">🐾 Wildlife Danger Zone</div>
                    <div className="text-[10px] text-gray-600">High animal accident risk recorded</div>
                  </Popup>
                </Marker>
              ))}

            {/* EV Charging Stations */}
            {route.evStations?.map((ev) => (
              <Marker key={ev.id} position={[ev.lat, ev.lon]}>
                <Popup>
                  <strong style={{ color: "#0f9d58" }}>⚡ {ev.name}</strong><br />
                  <small>{ev.operator}</small>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* ══ ARRIVAL OVERLAY ════════════════════════════════════ */}
      {arrived && (
        <div className="absolute inset-0 z-[700] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 mx-6 text-center shadow-2xl max-w-sm w-full">
            <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-200 text-white text-4xl shadow-xl">
              🏁
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Trip Completed!</h2>
            <p className="text-gray-500 font-medium text-sm mb-4">
              You've arrived at <span className="text-emerald-700 font-black">{destination}</span>
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Distance</p>
                <p className="text-lg font-black text-gray-900">{route.distance}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Air Quality</p>
                <p className="text-lg font-black" style={{ color: getAQIColor(liveAQI) }}>
                  {liveAQI ?? "—"}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/routes")}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl transition text-base"
            >
              Back to Routes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationScreen;
