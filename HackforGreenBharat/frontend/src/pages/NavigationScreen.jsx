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

/* ─── Leaflet icons for hospital & police ────────────────── */
const hospitalIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:30px;height:30px;border-radius:50%;
    background:#ef4444;border:3px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.35);
    display:flex;align-items:center;justify-content:center;
    font-size:14px;line-height:1;">🏥</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const policeIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:30px;height:30px;border-radius:50%;
    background:#2563eb;border:3px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.35);
    display:flex;align-items:center;justify-content:center;
    font-size:14px;line-height:1;">🚔</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

/* ─── AQI helpers ─────────────────────────────────────────── */
const getAQIColor = (aqi) => {
  if (!aqi) return "#9CA3AF";
  if (aqi <= 50)  return "#16a34a";
  if (aqi <= 100) return "#ca8a04";
  if (aqi <= 150) return "#ea580c";
  if (aqi <= 200) return "#dc2626";
  return "#7c3aed";
};
const getAQILabel = (aqi) => {
  if (!aqi)       return "Unknown";
  if (aqi <= 50)  return "Good";
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

  /* ── "Remaining" portion of geometry (from closest point onward) ── */
  const remainingGeometry = (() => {
    if (routeGeometry.length < 2) return routeGeometry;
    const [lat, lon] = realPos;
    const idx = closestPointIndex(routeGeometry, lat, lon);
    return routeGeometry.slice(idx);
  })();

  /* ── Completed portion of geometry ── */
  const completedGeometry = (() => {
    if (routeGeometry.length < 2) return [];
    const [lat, lon] = realPos;
    const idx = closestPointIndex(routeGeometry, lat, lon);
    return routeGeometry.slice(0, idx + 1);
  })();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900 select-none">

      {/* ══ FULL-SCREEN MAP ══════════════════════════════════════ */}
      <MapContainer
        center={displayPos}
        zoom={15}
        minZoom={5}
        maxZoom={18}
        zoomControl={false}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", position: "absolute", inset: 0 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution="&copy; CARTO"
        />
        <ZoomControls />
        <RecenterMap position={displayPos} follow={followUser} zoom={15} />
        <DragWatcher onDrag={() => setFollowUser(false)} />

        {/* Completed route — dimmed grey */}
        {completedGeometry.length > 1 && (
          <Polyline
            positions={completedGeometry.map((p) => [p.lat, p.lon])}
            pathOptions={{ color: "#94a3b8", weight: 6, opacity: 0.4, lineCap: "round", lineJoin: "round" }}
          />
        )}

        {/* Outer Casing / Deep Emerald Glow Path */}
        {remainingGeometry.length > 1 && (
          <Polyline
            positions={remainingGeometry.map((p) => [p.lat, p.lon])}
            pathOptions={{
              color: "#064e3b",
              weight: 14,
              opacity: 0.65,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

        {/* Primary Core Route Path — AQI coloured or solid Eco-Emerald */}
        {segments.length > 1
          ? segments.map((seg, i) => {
              if (i === segments.length - 1) return null;
              const next = segments[i + 1];
              return (
                <Polyline
                  key={i}
                  positions={[[seg.lat, seg.lon], [next.lat, next.lon]]}
                  pathOptions={{
                    color: getAQIColor(seg.aqi),
                    weight: 8,
                    opacity: 0.95,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
              );
            })
          : remainingGeometry.length > 1 && (
              <Polyline
                positions={remainingGeometry.map((p) => [p.lat, p.lon])}
                pathOptions={{
                  color: "#10b981", // Vibrant Emerald Green matching EcoSense theme!
                  weight: 8,
                  opacity: 0.95,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            )}

        {/* Live position — animated blue marker + accuracy ring */}
        {displayPos && (
          <>
            <Circle
              center={displayPos}
              radius={60}
              pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.1, weight: 1 }}
            />
            <Marker position={displayPos} icon={navIcon}>
              <Popup>📍 You</Popup>
            </Marker>
          </>
        )}

        {/* Destination pin */}
        <Marker position={[destinationCoords.lat, destinationCoords.lon]} icon={destIcon}>
          <Popup>🏁 {destination}</Popup>
        </Marker>

        {/* EV stations */}
        {route.evStations?.map((ev) => (
          <Marker key={ev.id} position={[ev.lat, ev.lon]}>
            <Popup><strong style={{ color: "#10b981" }}>{ev.name}</strong><br /><small>{ev.operator}</small></Popup>
          </Marker>
        ))}

        {/* Nearby Hospitals */}
        {allHospitals.map((h, i) => (
          <Marker key={`hosp-${h.id ?? i}`} position={[h.lat, h.lon]} icon={hospitalIcon}>
            <Popup>
              <strong style={{ color: "#ef4444" }}>🏥 {h.name}</strong><br />
              <small>{h.userDist != null ? (h.userDist < 1 ? `${Math.round(h.userDist * 1000)} m from you` : `${h.userDist.toFixed(1)} km from you`) : ""}</small>
            </Popup>
          </Marker>
        ))}

        {/* Nearby Police Stations */}
        {allPolice.map((p, i) => (
          <Marker key={`police-${p.id ?? i}`} position={[p.lat, p.lon]} icon={policeIcon}>
            <Popup>
              <strong style={{ color: "#2563eb" }}>🚔 {p.name}</strong><br />
              <small>{p.userDist != null ? (p.userDist < 1 ? `${Math.round(p.userDist * 1000)} m from you` : `${p.userDist.toFixed(1)} km from you`) : ""}</small>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ══ FIXED LEFT — EMERGENCY SERVICES PANEL ═══════════════ */}
      <div
        className="fixed left-3 z-[600] pointer-events-auto"
        style={{
          top: "186px",
          bottom: "212px",
          width: "224px",
        }}
      >
        <div
          className="flex flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/20 border border-white/70 overflow-hidden"
          style={{ height: "100%", maxHeight: "100%" }}
        >

          {/* ── Panel header ── */}
          <button
            onClick={() => setShowEmergency((v) => !v)}
            className="flex items-center justify-between px-3 py-2.5 bg-gray-900/90 text-white rounded-t-2xl shrink-0 hover:bg-gray-800/90 transition-colors"
          >
            <span className="text-[11px] font-black uppercase tracking-widest">🚨 Emergency Services</span>
            <span className="text-[10px] font-black opacity-60">{showEmergency ? "◀" : "▶"}</span>
          </button>

          {/* ── Expanded: two independent sections ── */}
          {showEmergency && (
            <div className="flex flex-col overflow-hidden" style={{ flex: "1 1 0", minHeight: 0 }}>

              {/* Loading state */}
              {emergencyLoading && (
                <div className="flex items-center justify-center gap-2 py-4 shrink-0">
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] text-gray-400 font-bold">Scanning route…</span>
                </div>
              )}

              {/* ════ HOSPITALS SECTION ════ */}
              {/* Takes exactly half the available height, has its own scroll */}
              <div
                className="flex flex-col border-b border-gray-200"
                style={{ flex: "1 1 0", minHeight: 0, overflow: "hidden" }}
              >

                {/* Section header — fixed, never scrolls */}
                <div className="shrink-0 px-2.5 pt-2 pb-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-red-100 flex items-center justify-center shrink-0">
                        <Hospital className="w-3 h-3 text-red-600" />
                      </div>
                      <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">Hospitals</span>
                    </div>
                    <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full leading-none">
                      {allHospitals.length}
                    </span>
                  </div>

                  {/* Nearest hospital — always visible, updates live */}
                  {allHospitals[0] ? (
                    <div className="px-2 py-1.5 bg-red-50 border border-red-100 rounded-xl mb-1">
                      <p className="text-[8px] font-black text-red-400 uppercase tracking-widest leading-none mb-0.5">Nearest</p>
                      <p className="text-[10px] font-black text-gray-800 leading-tight truncate">{allHospitals[0].name}</p>
                      <p className="text-[9px] font-bold text-red-500 leading-none mt-0.5">
                        {allHospitals[0].userDist != null
                          ? allHospitals[0].userDist < 1
                            ? `${Math.round(allHospitals[0].userDist * 1000)} m away`
                            : `${allHospitals[0].userDist.toFixed(1)} km away`
                          : "—"}
                      </p>
                    </div>
                  ) : (
                    !emergencyLoading && (
                      <p className="text-[9px] text-gray-400 italic px-1 mb-1">None found along route.</p>
                    )
                  )}
                </div>

                {/* Hospital scrollable list — independent scroll */}
                {allHospitals.length > 0 && (
                  <div
                    className="px-2.5 pb-2 space-y-1"
                    style={{ flex: "1 1 0", minHeight: 0, overflowY: "auto" }}
                  >
                    {allHospitals.map((h, i) => (
                      <div
                        key={h.id ?? i}
                        className="flex items-start justify-between gap-1 py-1 px-2 rounded-lg bg-red-50/50 border border-red-100/60"
                      >
                        <div className="flex items-start gap-1 min-w-0">
                          <span className="text-[8px] font-black text-red-300 mt-0.5 shrink-0">{i + 1}.</span>
                          <span className="text-[10px] font-bold text-gray-700 leading-tight">{h.name}</span>
                        </div>
                        <div className="flex flex-col items-end shrink-0 ml-1 gap-0.5">
                          <span className="text-[9px] font-black text-red-600 whitespace-nowrap">
                            {h.userDist != null
                              ? h.userDist < 1 ? `${Math.round(h.userDist * 1000)} m` : `${h.userDist.toFixed(1)} km`
                              : "—"}
                          </span>
                          {h.routeDist != null && (
                            <span className="text-[8px] text-gray-400 font-bold whitespace-nowrap">
                              ~{h.routeDist < 1 ? `${Math.round(h.routeDist * 1000)} m` : `${h.routeDist.toFixed(1)} km`} rt
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ════ POLICE STATIONS SECTION ════ */}
              {/* Takes the other half, has its own independent scroll */}
              <div
                className="flex flex-col"
                style={{ flex: "1 1 0", minHeight: 0, overflow: "hidden" }}
              >

                {/* Section header — fixed, never scrolls */}
                <div className="shrink-0 px-2.5 pt-2 pb-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">Police</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full leading-none">
                      {allPolice.length}
                    </span>
                  </div>

                  {/* Nearest police — always visible, updates live */}
                  {allPolice[0] ? (
                    <div className="px-2 py-1.5 bg-blue-50 border border-blue-100 rounded-xl mb-1">
                      <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none mb-0.5">Nearest</p>
                      <p className="text-[10px] font-black text-gray-800 leading-tight truncate">{allPolice[0].name}</p>
                      <p className="text-[9px] font-bold text-blue-500 leading-none mt-0.5">
                        {allPolice[0].userDist != null
                          ? allPolice[0].userDist < 1
                            ? `${Math.round(allPolice[0].userDist * 1000)} m away`
                            : `${allPolice[0].userDist.toFixed(1)} km away`
                          : "—"}
                      </p>
                    </div>
                  ) : (
                    !emergencyLoading && (
                      <p className="text-[9px] text-gray-400 italic px-1 mb-1">None found along route.</p>
                    )
                  )}
                </div>

                {/* Police scrollable list — independent scroll */}
                {allPolice.length > 0 && (
                  <div
                    className="px-2.5 pb-2 space-y-1"
                    style={{ flex: "1 1 0", minHeight: 0, overflowY: "auto" }}
                  >
                    {allPolice.map((p, i) => (
                      <div
                        key={p.id ?? i}
                        className="flex items-start justify-between gap-1 py-1 px-2 rounded-lg bg-blue-50/50 border border-blue-100/60"
                      >
                        <div className="flex items-start gap-1 min-w-0">
                          <span className="text-[8px] font-black text-blue-300 mt-0.5 shrink-0">{i + 1}.</span>
                          <span className="text-[10px] font-bold text-gray-700 leading-tight">{p.name}</span>
                        </div>
                        <div className="flex flex-col items-end shrink-0 ml-1 gap-0.5">
                          <span className="text-[9px] font-black text-blue-600 whitespace-nowrap">
                            {p.userDist != null
                              ? p.userDist < 1 ? `${Math.round(p.userDist * 1000)} m` : `${p.userDist.toFixed(1)} km`
                              : "—"}
                          </span>
                          {p.routeDist != null && (
                            <span className="text-[8px] text-gray-400 font-bold whitespace-nowrap">
                              ~{p.routeDist < 1 ? `${Math.round(p.routeDist * 1000)} m` : `${p.routeDist.toFixed(1)} km`} rt
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ── Collapsed state — compact summary pills ── */}
          {!showEmergency && (
            <div className="flex flex-col justify-start gap-2 px-2.5 py-2">
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-red-50 border border-red-100">
                <Hospital className="w-3 h-3 text-red-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-red-600">{allHospitals.length} Hospitals</p>
                  {allHospitals[0] && (
                    <p className="text-[8px] text-gray-500 font-bold truncate">
                      {allHospitals[0].userDist != null
                        ? allHospitals[0].userDist < 1
                          ? `Nearest: ${Math.round(allHospitals[0].userDist * 1000)} m`
                          : `Nearest: ${allHospitals[0].userDist.toFixed(1)} km`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-blue-50 border border-blue-100">
                <ShieldCheck className="w-3 h-3 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-blue-600">{allPolice.length} Police Stns</p>
                  {allPolice[0] && (
                    <p className="text-[8px] text-gray-500 font-bold truncate">
                      {allPolice[0].userDist != null
                        ? allPolice[0].userDist < 1
                          ? `Nearest: ${Math.round(allPolice[0].userDist * 1000)} m`
                          : `Nearest: ${allPolice[0].userDist.toFixed(1)} km`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ══ TOP — STEP INSTRUCTION BANNER ═══════════════════════ */}
      <div className="absolute top-0 left-0 right-0 z-[600] px-4 pt-4 pb-2 pointer-events-none">
        <div className="max-w-2xl mx-auto space-y-2">

          {/* Route badge */}
          <div className="flex justify-center">
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${routeBadge.color}`}>
              {routeBadge.icon} {routeBadge.label}
            </span>
          </div>

          {/* Recalculating alert */}
          {recalculating && (
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-400 rounded-2xl shadow-lg pointer-events-none">
              <RefreshCw className="w-4 h-4 text-white animate-spin" />
              <span className="text-white font-black text-sm">Recalculating route…</span>
            </div>
          )}

          {/* Step card */}
          <div className="bg-white/95 backdrop-blur-md rounded-[1.5rem] shadow-2xl shadow-black/20 px-5 py-4 border border-white/60 pointer-events-auto">
            {loadingSteps ? (
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center animate-pulse shrink-0">
                  <Navigation className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-gray-400 font-bold text-sm">Calculating route steps…</p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/30 shrink-0">
                  {currentStep?.icon || "⬆"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-black text-base leading-tight">{currentStep?.text}</p>
                  {currentStep?.dist && (
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">in {currentStep.dist}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Step</p>
                  <p className="text-sm font-black text-emerald-600">{currentStepIdx + 1}/{steps.length}</p>
                </div>
              </div>
            )}
            {nextStep && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-gray-400">
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                <p className="text-xs font-bold truncate">Then: {nextStep.text}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ PROGRESS BAR ═════════════════════════════════════════ */}
      <div className="absolute top-[160px] left-0 right-0 z-[590] px-4 pointer-events-none">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, #10b981, #059669)",
                }}
              />
            </div>
            <span className="text-white font-black text-xs bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full shrink-0">
              {progressPct}%
            </span>
          </div>
        </div>
      </div>

      {/* ══ RIGHT SIDE CONTROLS ═══════════════════════════════════ */}
      <div className="absolute right-4 bottom-60 z-[600] flex flex-col gap-3">
        {/* Voice toggle */}
        <button
          onClick={toggleVoice}
          className={`w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center transition border ${
            voiceEnabled
              ? "bg-blue-600 text-white border-blue-700"
              : "bg-white text-gray-500 border-gray-200"
          }`}
          title={voiceEnabled ? "Mute voice" : "Enable voice"}
        >
          {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {/* Re-center / re-enable auto-follow */}
        <button
          onClick={() => setFollowUser(true)}
          className={`w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center transition border ${
            followUser
              ? "bg-blue-600 text-white border-blue-700"
              : "bg-white text-gray-500 border-gray-200"
          }`}
          title="Re-center on my location"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Exit navigation */}
        <button
          onClick={() => { window.speechSynthesis?.cancel(); navigate("/routes"); }}
          className="w-12 h-12 rounded-2xl bg-red-500 text-white shadow-xl flex items-center justify-center hover:bg-red-600 transition border border-red-600"
          title="Exit navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ══ BOTTOM INFO PANEL ════════════════════════════════════ */}
      <div className="absolute bottom-0 left-0 right-0 z-[600]">
        <div className="mx-4 mb-4 space-y-2">

          {/* AQI + Weather row */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl shadow-black/10 px-4 py-3 border border-white/60">
            <div className="flex items-center gap-3 flex-wrap">
              {/* AQI */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-black"
                style={{
                  color: getAQIColor(liveAQI),
                  backgroundColor: `${getAQIColor(liveAQI)}15`,
                  borderColor: `${getAQIColor(liveAQI)}30`,
                }}
              >
                <Wind className="w-4 h-4" />
                AQI {liveAQI ?? "—"} · {getAQILabel(liveAQI)}
              </div>

              {/* Weather */}
              {weather && (
                <>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                    <Thermometer className="w-4 h-4 text-orange-400" />
                    {weather.temp}°C
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    {weather.humidity}%
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                    <Gauge className="w-4 h-4 text-gray-400" />
                    {weather.wind} km/h
                  </div>
                  <div className="text-sm font-bold text-gray-600 ml-auto">
                    {weatherEmoji(weather.code)}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Main metrics panel */}
          <div className="bg-white/95 backdrop-blur-md rounded-[1.5rem] shadow-2xl shadow-black/20 px-5 py-4 border border-white/60">
            {/* Metrics grid */}
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div className="text-center">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">ETA</p>
                <p className="text-base font-black text-gray-900 leading-none transition-all duration-500">
                  {fmtETA(remainingMins)}
                </p>
              </div>
              <div className="text-center border-l border-gray-100">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Left</p>
                <p className="text-base font-black text-gray-900 leading-none transition-all duration-500">
                  {remainingDist}
                </p>
              </div>
              <div className="text-center border-l border-gray-100">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Time</p>
                <p className="text-base font-black text-gray-900 leading-none transition-all duration-500">
                  {remainingMins} min
                </p>
              </div>
              <div className="text-center border-l border-gray-100">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Speed</p>
                <p className="text-base font-black text-gray-900 leading-none transition-all duration-500">
                  {speed != null ? `${speed} km/h` : "—"}
                </p>
              </div>
            </div>

            {/* Destination + health advice */}
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Origin → Destination</p>
                <p className="text-sm font-extrabold text-gray-900 truncate">
                  {origin} → {destination}
                </p>
              </div>
              {route.healthAdvice && (
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-xl shrink-0 max-w-[42%]">
                  <Leaf className="w-3 h-3 text-emerald-500 shrink-0" />
                  <p className="text-[9px] font-black text-emerald-700 truncate">{route.healthAdvice}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══ AUTO-FOLLOW DISABLED TOAST ════════════════════════════ */}
      {!followUser && (
        <div className="absolute bottom-[340px] left-1/2 -translate-x-1/2 z-[650] pointer-events-none">
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm text-white text-xs font-black px-4 py-2 rounded-full shadow-xl">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Auto-follow paused — tap <RotateCcw className="w-3 h-3 inline mx-1" /> to re-enable
          </div>
        </div>
      )}

      {/* ══ ARRIVAL OVERLAY ════════════════════════════════════ */}
      {arrived && (
        <div className="absolute inset-0 z-[700] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 mx-6 text-center shadow-2xl max-w-sm w-full">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-200">
              <span className="text-4xl">🏁</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">You've Arrived!</h2>
            <p className="text-gray-500 font-medium text-sm mb-4">
              You've reached <span className="text-emerald-600 font-black">{destination}</span>
            </p>
            {/* Final trip summary */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 rounded-2xl p-3">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Distance</p>
                <p className="text-lg font-black text-gray-900">{route.distance}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-3">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">AQI</p>
                <p className="text-lg font-black" style={{ color: getAQIColor(liveAQI) }}>
                  {liveAQI ?? "—"}
                </p>
              </div>
            </div>
            {liveAQI && (
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-black mb-6"
                style={{
                  color: getAQIColor(liveAQI),
                  backgroundColor: `${getAQIColor(liveAQI)}15`,
                  border: `1px solid ${getAQIColor(liveAQI)}30`,
                }}
              >
                <Wind className="w-4 h-4" />
                AQI: {liveAQI} · {getAQILabel(liveAQI)}
              </div>
            )}
            <button
              onClick={() => navigate("/routes")}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-200 transition text-base"
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
