import { useEffect, useState, useMemo, useRef, Fragment } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import StateMap from "./StateMap";
import { 
  Activity, 
  CloudSun, 
  Compass, 
  Droplets, 
  Info,
  Navigation,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  X,
  ShieldAlert,
  CornerUpRight,
  Gauge,
  CheckCircle2
} from "lucide-react";

/* ===== LEAFLET ICONS ===== */
const evIcon = L.divIcon({
  className: "custom-ev-marker",
  html: `<div style="background-color: #10b981; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-size: 14px;">⚡</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

/* ===== TRANSPORT MODE CONFIG ===== */
const TRANSPORT_CONFIG = {
  car:  { emoji: "🚗", label: "Car",        color: "#2563eb", speedUnit: "km/h" },
  bike: { emoji: "🏍️", label: "Bike",       color: "#ea580c", speedUnit: "km/h" },
  bus:  { emoji: "🚌", label: "Bus",        color: "#7c3aed", speedUnit: "km/h" },
  walk: { emoji: "🚶", label: "Walking",    color: "#10b981", speedUnit: "km/h" },
};

/** Build a vehicle marker icon for the given transport mode */
const makeVehicleIcon = (mode = "car") => {
  const cfg = TRANSPORT_CONFIG[mode] || TRANSPORT_CONFIG.car;
  return L.divIcon({
    className: "custom-vehicle-marker-icon",
    html: `
      <div style="
        background: ${cfg.color};
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3.5px solid white;
        box-shadow: 0 0 28px ${cfg.color}99, 0 6px 16px rgba(0,0,0,0.35);
        color: white;
        font-size: 22px;
        transform: translate(-50%, -50%);
      ">
        ${cfg.emoji}
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const originIcon = new L.Icon({
  iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/red-pushpin.png",
  iconSize: [32, 32],
  iconAnchor: [10, 32],
});

const destIcon = new L.Icon({
  iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/blue-pushpin.png",
  iconSize: [32, 32],
  iconAnchor: [10, 32],
});

/* ===== STATE MAP LOOKUPS ===== */
const STATE_NAME_TO_CODE = {
  'Andhra Pradesh': 'AP', 'Arunachal Pradesh': 'AR', 'Assam': 'AS', 'Bihar': 'BR',
  'Chhattisgarh': 'CT', 'Goa': 'GA', 'Gujarat': 'GJ', 'Haryana': 'HR',
  'Himachal Pradesh': 'HP', 'Jharkhand': 'JH', 'Karnataka': 'KA', 'Kerala': 'KL',
  'Madhya Pradesh': 'MP', 'Maharashtra': 'MH', 'Manipur': 'MN', 'Meghalaya': 'ML',
  'Mizoram': 'MZ', 'Nagaland': 'NL', 'Odisha': 'OR', 'Punjab': 'PB',
  'Rajasthan': 'RJ', 'Sikkim': 'SK', 'Tamil Nadu': 'TN', 'Telangana': 'TG',
  'Tripura': 'TR', 'Uttar Pradesh': 'UP', 'Uttarakhand': 'UT', 'West Bengal': 'WB',
  'Delhi': 'DL', 'Jammu and Kashmir': 'JK', 'Ladakh': 'LA', 'Chandigarh': 'CH',
  'Puducherry': 'PY', 'Andaman and Nicobar Islands': 'AN',
  'Dadra and Nagar Haveli and Daman and Diu': 'DN', 'Lakshadweep': 'LD'
};

const STATE_CODE_TO_NAME = Object.fromEntries(
  Object.entries(STATE_NAME_TO_CODE).map(([name, code]) => [code, name])
);

/* ===== ECO-MAP STATE ENVIRONMENT DATA ===== */
const STATE_ENV_DATA = {
  'AP': { aqi: 75, temp: 32, roadQuality: "88% Smooth", greenery: "Dense Canopy", status: "Healthy", advice: "Smooth roads & clean air. Ideal for EV travel." },
  'AR': { aqi: 35, temp: 22, roadQuality: "70% Bumpy", greenery: "Lush Forest", status: "Excellent", advice: "Extremely clean air, but terrain is rough and bumpy." },
  'AS': { aqi: 62, temp: 26, roadQuality: "75% Smooth", greenery: "Lush Forest", status: "Good", advice: "Lush foliage provides great natural canopy shade." },
  'BR': { aqi: 185, temp: 30, roadQuality: "68% Bumpy", greenery: "Moderate Grassland", status: "Unhealthy", advice: "Elevated particulate pollution. Wear protective masks." },
  'CH': { aqi: 110, temp: 28, roadQuality: "95% Smooth", greenery: "High Canopy", status: "Moderate", advice: "Perfect urban roads but moderate air haze present." },
  'CT': { aqi: 95, temp: 31, roadQuality: "80% Smooth", greenery: "High Canopy", status: "Moderate", advice: "Abundant forests balance local coal-generation emissions." },
  'DL': { aqi: 340, temp: 35, roadQuality: "90% Smooth", greenery: "Low Canopy", status: "Severe", advice: "Critical pollution levels. Restrict outdoor workouts." },
  'GA': { aqi: 45, temp: 30, roadQuality: "92% Smooth", greenery: "Dense Canopy", status: "Excellent", advice: "Coastal winds keep air fresh. Excellent highway quality." },
  'GJ': { aqi: 140, temp: 36, roadQuality: "92% Smooth", greenery: "Sparse Shrubland", status: "Moderate", advice: "High heat index. Keep hydrated during daytime travel." },
  'HR': { aqi: 240, temp: 33, roadQuality: "86% Smooth", greenery: "Low Canopy", status: "Severe", advice: "Heavy agrarian stubble haze. Prefer indoor routing." },
  'HP': { aqi: 48, temp: 18, roadQuality: "72% Bumpy", greenery: "Lush Forest", status: "Excellent", advice: "Cool mountain air. Smooth driving inside main valleys." },
  'JK': { aqi: 42, temp: 15, roadQuality: "65% Bumpy", greenery: "Lush Forest", status: "Excellent", advice: "Cold climate, check for high elevation rough roads." },
  'JH': { aqi: 125, temp: 29, roadQuality: "76% Smooth", greenery: "High Canopy", status: "Moderate", advice: "Industrial dust particles suspended. Watch out for road works." },
  'KA': { aqi: 68, temp: 28, roadQuality: "85% Smooth", greenery: "Dense Canopy", status: "Healthy", advice: "Favorable green cover and smooth, well-lit highways." },
  'KL': { aqi: 52, temp: 29, roadQuality: "88% Smooth", greenery: "Lush Forest", status: "Excellent", advice: "High humidity but excellent eco-system air quality." },
  'LA': { aqi: 30, temp: 10, roadQuality: "55% Rough", greenery: "Alpine Meadows", status: "Excellent", advice: "High altitude zone. Cold weather, ensure heavy winter gear." },
  'MP': { aqi: 115, temp: 32, roadQuality: "82% Smooth", greenery: "High Canopy", status: "Moderate", advice: "Dry inland climate. Road condition is moderately stable." },
  'MH': { aqi: 135, temp: 31, roadQuality: "87% Smooth", greenery: "Moderate Canopy", status: "Moderate", advice: "Urban vehicular dust. Good streetlights on central corridors." },
  'MN': { aqi: 40, temp: 23, roadQuality: "68% Bumpy", greenery: "Lush Forest", status: "Excellent", advice: "Pure natural atmosphere with dense forest coverage." },
  'ML': { aqi: 38, temp: 21, roadQuality: "70% Bumpy", greenery: "Lush Forest", status: "Excellent", advice: "Extremely clean air, but persistent high monsoon rainfall." },
  'MZ': { aqi: 35, temp: 22, roadQuality: "62% Bumpy", greenery: "Lush Forest", status: "Excellent", advice: "Pristine mountain forests. Roads are slippery when wet." },
  'NL': { aqi: 45, temp: 22, roadQuality: "64% Bumpy", greenery: "Lush Forest", status: "Excellent", advice: "Low human pollution. Very healthy atmosphere." },
  'OR': { aqi: 88, temp: 31, roadQuality: "79% Smooth", greenery: "High Canopy", status: "Moderate", advice: "Coastal breeze offsets inland industrial zones." },
  'PB': { aqi: 195, temp: 32, roadQuality: "89% Smooth", greenery: "Low Canopy", status: "Unhealthy", advice: "Seasonal crop harvesting dust. High particulate matter." },
  'RJ': { aqi: 155, temp: 38, roadQuality: "85% Smooth", greenery: "Desert Scrub", status: "Unhealthy", advice: "Desert sand particles and extreme summer heat waves." },
  'SK': { aqi: 32, temp: 17, roadQuality: "60% Bumpy", greenery: "Lush Forest", status: "Excellent", advice: "Pristine ecosystem. Mountain paths require high caution." },
  'TN': { aqi: 78, temp: 33, roadQuality: "90% Smooth", greenery: "Moderate Canopy", status: "Healthy", advice: "Great sea breeze. Smooth and well-lit highway structures." },
  'TG': { aqi: 85, temp: 32, roadQuality: "88% Smooth", greenery: "Moderate Canopy", status: "Healthy", advice: "Warm dry air, solid road construction around cities." },
  'TR': { aqi: 50, temp: 25, roadQuality: "68% Bumpy", greenery: "Dense Canopy", status: "Good", advice: "Rich flora. Watch for narrow pathways and potholes." },
  'UP': { aqi: 220, temp: 33, roadQuality: "82% Smooth", greenery: "Low Canopy", status: "Severe", advice: "Heavy smog in Gangetic plain. Mask recommended." },
  'UT': { aqi: 55, temp: 20, roadQuality: "74% Bumpy", greenery: "Lush Forest", status: "Excellent", advice: "Clean mountain valleys, but landslide risk during rains." },
  'WB': { aqi: 165, temp: 30, roadQuality: "78% Smooth", greenery: "Moderate Canopy", status: "Unhealthy", advice: "Dense urban concentration. Prefer eco-safe green paths." },
  'AN': { aqi: 25, temp: 28, roadQuality: "80% Smooth", greenery: "Lush Forest", status: "Excellent", advice: "Pure marine atmosphere. No major pollution zones." },
  'DN': { aqi: 90, temp: 30, roadQuality: "85% Smooth", greenery: "Moderate Canopy", status: "Moderate", advice: "Moderate coastal air quality. Paths are well paved." },
  'LD': { aqi: 20, temp: 29, roadQuality: "90% Smooth", greenery: "Dense Canopy", status: "Excellent", advice: "Unpolluted islands. Pure sea breeze and clear skies." },
  'PY': { aqi: 65, temp: 31, roadQuality: "90% Smooth", greenery: "Moderate Canopy", status: "Healthy", advice: "Clean coastal boulevard. Smooth driving parameters." }
};

/* Get risk color scale matching CivicShield heat map styles */
const getAQIColor = (aqi) => {
  if (aqi <= 50) return "rgba(16, 185, 129, 0.85)";   // Clean emerald
  if (aqi <= 100) return "rgba(132, 204, 22, 0.85)";  // Good lime
  if (aqi <= 150) return "rgba(234, 179, 8, 0.85)";   // Moderate yellow
  if (aqi <= 200) return "rgba(249, 115, 22, 0.85)";   // Unhealthy orange
  return "rgba(239, 68, 68, 0.85)";                  // Severe red
};

const getAQILabel = (aqi) => {
  if (aqi <= 50) return "Healthy";
  if (aqi <= 100) return "Good";
  if (aqi <= 150) return "Moderate";
  if (aqi <= 200) return "Unhealthy";
  return "Severe";
};

/* ===== HELPERS ===== */
const getRouteSegmentAQIColor = (aqi) => {
  if (aqi === null || aqi === undefined) return "#9CA3AF";
  if (aqi <= 50) return "#16a34a";   // green
  if (aqi <= 100) return "#ca8a04";  // yellow
  if (aqi <= 150) return "#ea580c";  // orange
  if (aqi <= 200) return "#dc2626";  // red
  return "#7c3aed";                  // purple
};

const getLabelCount = (distanceKm) => {
  if (distanceKm < 50) return 2;
  if (distanceKm < 200) return 3;
  return 5;
};

const formatDuration = (durationStr) => {
  if (!durationStr) return "";
  const match = durationStr.match(/(\d+)\s*min/);
  if (match) {
    const mins = parseInt(match[1], 10);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return remMins > 0 ? `${hrs} hr ${remMins} min` : `${hrs} hr`;
    }
  }
  return durationStr;
};

const createDurationBadgeIcon = (durationStr, isSelected) => {
  const formatted = formatDuration(durationStr);
  const bg = isSelected ? "#ffffff" : "#f8fafc";
  const textColor = isSelected ? "#1e293b" : "#64748b";
  const border = isSelected ? "2.5px solid #2563eb" : "1.5px solid #cbd5e1";
  const shadow = isSelected ? "0 4px 14px rgba(37,99,235,0.3)" : "0 2px 6px rgba(0,0,0,0.12)";

  return L.divIcon({
    className: "custom-duration-badge-wrapper",
    html: `
      <div style="
        background: ${bg};
        color: ${textColor};
        border: ${border};
        box-shadow: ${shadow};
        padding: 5px 12px;
        border-radius: 14px;
        font-family: system-ui, -apple-system, sans-serif;
        font-weight: 800;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
        transform: translate(-50%, -50%);
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        <span style="font-size: 14px;">🚗</span>
        <span>${formatted}</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

/* ===== INVALIDATE MAP SIZE (fixes blank tile rendering after DOM layout changes) ===== */
const InvalidateSizeHelper = ({ isActive }) => {
  const map = useMap();
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => map.invalidateSize(), 200);
      return () => clearTimeout(timer);
    }
  }, [map, isActive]);
  return null;
};

/* ===== AUTO FIT MAP ===== */
const FitBounds = ({ origin, destination }) => {
  const map = useMap();
  useEffect(() => {
    if (!origin || !destination) return;
    const bounds = L.latLngBounds(
      [origin.lat, origin.lon],
      [destination.lat, destination.lon]
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, origin, destination]);
  return null;
};

/* ===== LIVE NAVIGATION MAP TRACKER ===== */
const NavigationTracker = ({ currentPos }) => {
  const map = useMap();
  useEffect(() => {
    if (currentPos && currentPos.lat && currentPos.lon) {
      map.flyTo([currentPos.lat, currentPos.lon], 16, { animate: true, duration: 0.8 });
    }
  }, [map, currentPos]);
  return null;
};

/* ===== MAIN MAP ORCHESTRATOR ===== */
const RouteMap = ({ routes, selectedRouteId, origin, destination, onSelectRoute, isNavigating, onExitNav, transportMode = "car" }) => {
  const [selectedState, setSelectedState] = useState(null);
  const [pathData, setPathData] = useState(null);
  const [hoveredState, setHoveredState] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showHoverBox, setShowHoverBox] = useState(false);

  // Live Navigation State
  const [navIndex, setNavIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Real-time GPS state
  const [gpsPos, setGpsPos] = useState(null);       // { lat, lon, speed } from Geolocation API
  const [gpsError, setGpsError] = useState(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [liveSpeed, setLiveSpeed] = useState(null);  // km/h
  const gpsWatchRef = useRef(null);

  // Transition States for Smooth space-to-ground Zoom Animation
  const [heatmapScale, setHeatmapScale] = useState(1);
  const [heatmapOpacity, setHeatmapOpacity] = useState(1);
  const [mapOpacity, setMapOpacity] = useState(0);

  const showLeafletMap = destination !== null;

  // Build vehicle icon based on transport mode (memoised to avoid re-creating on every render)
  const vehicleIcon = useMemo(() => makeVehicleIcon(transportMode), [transportMode]);
  const modeCfg = TRANSPORT_CONFIG[transportMode] || TRANSPORT_CONFIG.car;

  // Load India SVG paths
  useEffect(() => {
    fetch('/india-paths.json')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setPathData(data))
      .catch((err) => console.error('Failed to load map paths:', err));
  }, []);

  // ===== REAL-TIME GPS TRACKING =====
  useEffect(() => {
    if (!isNavigating) {
      // Stop watching when navigation exits
      if (gpsWatchRef.current !== null) {
        navigator.geolocation?.clearWatch(gpsWatchRef.current);
        gpsWatchRef.current = null;
      }
      setGpsPos(null);
      setGpsActive(false);
      setLiveSpeed(null);
      setGpsError(null);
      return;
    }

    if (!navigator.geolocation) {
      setGpsError("GPS not supported by this browser");
      return;
    }

    setGpsError(null);
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        setGpsPos({ lat: latitude, lon: longitude });
        setGpsActive(true);
        // speed is in m/s — convert to km/h
        setLiveSpeed(speed != null ? Math.round(speed * 3.6) : null);
      },
      (err) => {
        // Permission denied or unavailable → fall back to simulation silently
        setGpsError(err.code === 1 ? "GPS access denied — using simulation" : "GPS unavailable — using simulation");
        setGpsActive(false);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    return () => {
      if (gpsWatchRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchRef.current);
        gpsWatchRef.current = null;
      }
    };
  }, [isNavigating]);

  // Manage Zoom Scale transition when Destination is searched
  useEffect(() => {
    if (showLeafletMap) {
      // Zoom out/into the ground: SVG scale up to 8x and fade out
      setHeatmapScale(8);
      setHeatmapOpacity(0);
      
      const timer = setTimeout(() => {
        setMapOpacity(1);
      }, 150);

      return () => clearTimeout(timer);
    } else {
      // Reset back to initial space-view SVG Heatmap of India
      setHeatmapScale(1);
      setHeatmapOpacity(1);
      setMapOpacity(0);
      setSelectedState(null);
    }
  }, [showLeafletMap]);

  const handleStateHover = (stateName, evt) => {
    const code = STATE_NAME_TO_CODE[stateName];
    if (code) {
      const container = evt.currentTarget.closest('.relative');
      const rect = container ? container.getBoundingClientRect() : evt.currentTarget.closest('.map-container-relative').getBoundingClientRect();
      setHoveredState({
        name: stateName,
        code: code,
        data: STATE_ENV_DATA[code]
      });
      setMousePos({
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top,
        containerWidth: rect.width,
        containerHeight: rect.height,
      });
      setShowHoverBox(true);
    }
  };

  const handleStateClick = (stateName) => {
    const code = STATE_NAME_TO_CODE[stateName];
    if (code) {
      setSelectedState(code);
      setShowHoverBox(false);
    }
  };

  const handleMouseLeave = () => {
    setShowHoverBox(false);
  };

  const leafletOrigin = origin || { lat: 28.6139, lon: 77.2090, name: "Delhi" };
  const originPos = [leafletOrigin.lat, leafletOrigin.lon];
  const destPos = destination ? [destination.lat, destination.lon] : null;

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
  const geometryPoints = activeRoute?.geometry || [];

  // Reset and auto-play when navigation mode toggles
  useEffect(() => {
    if (isNavigating) {
      setNavIndex(0);
      setIsPlaying(true);
    }
  }, [isNavigating, selectedRouteId]);

  // Simulation step interval — only runs when GPS is NOT active
  useEffect(() => {
    if (!isNavigating || !isPlaying || geometryPoints.length === 0 || gpsActive) return;

    const intervalMs = Math.max(100, Math.floor(750 / simSpeed));
    const timer = setInterval(() => {
      setNavIndex((prev) => {
        if (prev >= geometryPoints.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isNavigating, isPlaying, simSpeed, geometryPoints.length, gpsActive]);

  // When GPS is active use the real position, otherwise use simulated geometry point
  const currentPos = gpsActive && gpsPos
    ? gpsPos
    : (geometryPoints[navIndex] || (origin ? { lat: origin.lat, lon: origin.lon } : null));

  const stepsList = activeRoute?.steps?.length ? activeRoute.steps : [
    { instruction: `Depart from ${origin?.name || "Origin"}`, distance: "Start", lat: origin?.lat, lon: origin?.lon },
    ...(activeRoute?.pollutionSegments || []).map(seg => ({
      instruction: `Passing ${seg.area || "Segment"} — AQI ${seg.aqi ?? "Good"} (${seg.zone || "Low"} pollution)`,
      distance: "En Route",
      lat: seg.lat,
      lon: seg.lon
    })),
    { instruction: `Arrive at ${destination?.name || "Destination"}`, distance: "0 km", lat: destination?.lat, lon: destination?.lon }
  ];

  const stepProgress = Math.min(1, navIndex / Math.max(1, geometryPoints.length - 1));
  const currentStepIndex = Math.min(stepsList.length - 1, Math.floor(stepProgress * stepsList.length));
  const currentStep = stepsList[currentStepIndex] || stepsList[0];
  const currentSeg = activeRoute?.pollutionSegments?.[Math.floor(stepProgress * Math.max(1, (activeRoute?.pollutionSegments?.length || 1) - 1))];

  // Voice speech announcement on step changes
  useEffect(() => {
    if (!isNavigating || !voiceEnabled || !currentStep?.instruction) return;
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(currentStep.instruction);
        msg.rate = 1;
        msg.volume = 0.9;
        window.speechSynthesis.speak(msg);
      } catch (e) {}
    }
  }, [currentStepIndex, isNavigating, voiceEnabled]);

  const labelIndexes = new Set();
  if (activeRoute?.pollutionSegments?.length) {
    const total = activeRoute.pollutionSegments.length;
    const distanceKm = parseFloat(activeRoute.distance);
    const labelsToShow = getLabelCount(distanceKm);
    for (let i = 0; i < labelsToShow; i++) {
      labelIndexes.add(Math.floor((i * total) / labelsToShow));
    }
  }

  return (
    <div className="relative w-full h-full rounded-[3rem] overflow-hidden bg-white">
      
      {/* 🗺️ LEAFLET MAP VIEW WRAPPER (Always mounted to prevent React unmount/removeChild DOM crashes) */}
      <div 
        className="absolute inset-0 w-full h-full rounded-[3rem] overflow-hidden bg-emerald-50/10 transition-opacity duration-700 ease-out"
        style={{ 
          opacity: mapOpacity, 
          zIndex: showLeafletMap ? 10 : 1,
          pointerEvents: showLeafletMap ? "auto" : "none" 
        }}
      >
        <MapContainer
          center={[22.5, 78.9]}
          zoom={4.2}
          minZoom={3}
          maxZoom={18}
          scrollWheelZoom={true}
          dragging={true}
          doubleClickZoom={true}
          zoomControl={true}
          style={{ height: "100%", width: "100%", filter: "hue-rotate(85deg) saturate(105%) brightness(1.02) contrast(95%)" }}
          className="h-full w-full rounded-[3rem]"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          <InvalidateSizeHelper isActive={showLeafletMap} />

          {destination && !isNavigating && <FitBounds origin={leafletOrigin} destination={destination} />}
          {isNavigating && currentPos && <NavigationTracker currentPos={currentPos} />}

          <Marker position={originPos} icon={originIcon}>
            <Popup><strong>Origin:</strong> {leafletOrigin.name}</Popup>
          </Marker>
          {destPos && <Marker position={destPos} icon={destIcon}>
            <Popup><strong>Destination:</strong> {destination?.name}</Popup>
          </Marker>}

          {/* Live Navigation GPS Vehicle Marker */}
          {isNavigating && currentPos && (
            <Marker position={[currentPos.lat, currentPos.lon]} icon={vehicleIcon}>
              <Popup>
                <div style={{ fontWeight: 800, color: modeCfg.color }}>{modeCfg.emoji} {modeCfg.label}</div>
                <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>{currentStep?.instruction}</div>
                {gpsActive && liveSpeed !== null && (
                  <div style={{ fontSize: "11px", color: "#10b981", fontWeight: 700, marginTop: "4px" }}>
                    📡 Live GPS · {liveSpeed} km/h
                  </div>
                )}
              </Popup>
            </Marker>
          )}

          {/* Traveled / Remaining polylines during Live Navigation */}
          {isNavigating && geometryPoints.length > 0 && (
            <Fragment key="live-nav-polylines">
              <Polyline
                positions={geometryPoints.slice(0, navIndex + 1).map((p) => [p.lat, p.lon])}
                pathOptions={{ color: "#10b981", weight: 9, opacity: 0.95, lineCap: "round", lineJoin: "round" }}
              />
              <Polyline
                positions={geometryPoints.slice(navIndex).map((p) => [p.lat, p.lon])}
                pathOptions={{ color: "#2563eb", weight: 7, opacity: 0.8, dashArray: "6 8", lineCap: "round" }}
              />
            </Fragment>
          )}

          {/* Render unselected routes first so selected route is drawn on top */}
          {routes.filter((r) => r.id !== selectedRouteId).map((route) => {
            const positions = route.geometry?.map((p) => [p.lat, p.lon]) || [];
            if (!positions.length) return null;
            const midPos = positions[Math.floor(positions.length / 2)];

            return (
              <Fragment key={`alt-route-${route.id}`}>
                <Polyline
                  positions={positions}
                  pathOptions={{ color: "#64748b", weight: 6, opacity: 0.65, lineCap: "round", lineJoin: "round" }}
                  eventHandlers={{ click: () => onSelectRoute && onSelectRoute(route.id) }}
                />
                {midPos && (
                  <Marker
                    position={midPos}
                    icon={createDurationBadgeIcon(route.duration, false)}
                    eventHandlers={{ click: () => onSelectRoute && onSelectRoute(route.id) }}
                  />
                )}
              </Fragment>
            );
          })}

          {/* Render selected route */}
          {routes.filter((r) => r.id === selectedRouteId).map((route) => {
            const fullPositions = route.geometry?.map((p) => [p.lat, p.lon]) || [];
            if (!fullPositions.length) return null;
            const midPos = fullPositions[Math.floor(fullPositions.length / 2)];

            const evMarkers = (route.evStations || []).map((ev) => (
              <Marker key={`ev-${ev.id}`} position={[ev.lat, ev.lon]} icon={evIcon}>
                <Popup>
                  <div style={{ fontWeight: 700, color: "#10b981", textTransform: "uppercase" }}>{ev.name}</div>
                  <div style={{ fontSize: "11px", color: "#666" }}>Operator: {ev.operator}</div>
                </Popup>
              </Marker>
            ));

            const segmentTooltips = (route.pollutionSegments || []).map((seg, i) => {
              if (!labelIndexes.has(i)) return null;
              const segColor = getRouteSegmentAQIColor(seg.aqi);
              return (
                <Marker key={`seg-badge-${i}`} position={[seg.lat, seg.lon]} icon={L.divIcon({ className: "empty-icon" })}>
                  <Tooltip permanent direction="top" opacity={1}>
                    <div style={{
                      background: "#fff",
                      border: `3px solid ${segColor}`,
                      borderRadius: "10px",
                      padding: "4px 10px",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#111",
                      minWidth: "90px",
                      textAlign: "center",
                    }}>
                      <div style={{ color: segColor, fontWeight: 800 }}>{seg.zone || "Unknown"}</div>
                      <div style={{ color: "#555", fontWeight: 600 }}>AQI: {seg.aqi ?? "N/A"}</div>
                    </div>
                  </Tooltip>
                </Marker>
              );
            });

            return (
              <Fragment key={`selected-route-${route.id}`}>
                {/* Outer casing halo for high contrast road polyline */}
                <Polyline
                  positions={fullPositions}
                  pathOptions={{ color: "#1e3a8a", weight: 10, opacity: 0.35, lineCap: "round", lineJoin: "round" }}
                />
                {/* Core road polyline in Google Maps driving blue */}
                <Polyline
                  positions={fullPositions}
                  pathOptions={{ color: "#2563eb", weight: 6, opacity: 0.95, lineCap: "round", lineJoin: "round" }}
                  eventHandlers={{ click: () => onSelectRoute && onSelectRoute(route.id) }}
                />
                {evMarkers}
                {segmentTooltips}
                {midPos && (
                  <Marker
                    position={midPos}
                    icon={createDurationBadgeIcon(route.duration, true)}
                    eventHandlers={{ click: () => onSelectRoute && onSelectRoute(route.id) }}
                  />
                )}
              </Fragment>
            );
          })}
        </MapContainer>

        {/* 🧭 IN-APP LIVE NAVIGATION HUD OVERLAYS */}
        {isNavigating && showLeafletMap && (
        <>
            {/* Top HUD Direction Banner */}
            <div className="absolute top-6 left-6 right-6 z-[1000] bg-gray-900/90 backdrop-blur-xl border border-emerald-500/30 text-white rounded-[2rem] p-5 shadow-2xl animate-in slide-in-from-top duration-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pointer-events-auto">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <CornerUpRight className="w-8 h-8 text-emerald-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {/* Transport mode badge */}
                    <span
                      className="px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-widest text-white"
                      style={{ backgroundColor: modeCfg.color }}
                    >
                      {modeCfg.emoji} {modeCfg.label}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-gray-950 font-black text-[10px] uppercase tracking-widest">
                      {currentStep?.distance || "Ahead"}
                    </span>
                    {currentSeg?.aqi !== undefined && (
                      <span className="px-2.5 py-0.5 rounded-full bg-gray-800 text-emerald-400 font-bold text-[10px] border border-gray-700">
                        AQI {currentSeg.aqi} • {currentSeg.zone || "Clean Zone"}
                      </span>
                    )}
                    {/* GPS status pill */}
                    {gpsActive ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                        Live GPS{liveSpeed !== null ? ` · ${liveSpeed} km/h` : ""}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-gray-700/60 text-gray-400 font-bold text-[10px] border border-gray-600/40">
                        {gpsError ? "Sim Mode" : "Acquiring GPS…"}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg md:text-xl font-extrabold tracking-tight text-white leading-tight">
                    {currentStep?.instruction || "Proceed along route"}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    voiceEnabled
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                      : "bg-gray-800 border-gray-700 text-gray-400"
                  }`}
                  title="Toggle Voice Guidance"
                >
                  {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  onClick={onExitNav}
                  className="p-3 rounded-2xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 transition-all font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-5 h-5" /> Exit Nav
                </button>
              </div>
            </div>

            {/* Bottom Control & Progress Toolbar */}
            <div className="absolute bottom-6 left-6 right-6 z-[1000] bg-gray-900/90 backdrop-blur-xl border border-gray-800 text-white rounded-[2rem] p-4 shadow-2xl flex flex-col gap-3 pointer-events-auto">
              {/* Route Progress Bar */}
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden flex">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${(stepProgress * 100).toFixed(1)}%`,
                    background: `linear-gradient(to right, ${modeCfg.color}, #10b981)`
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-extrabold tracking-wider" style={{ color: modeCfg.color }}>
                    {(stepProgress * 100).toFixed(0)}% COMPLETED
                  </span>
                  <span className="text-xs text-gray-400 font-bold">
                    {activeRoute?.duration} • {activeRoute?.distance}
                  </span>
                  {/* Speed display when GPS active */}
                  {gpsActive && liveSpeed !== null && (
                    <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5" /> {liveSpeed} km/h
                    </span>
                  )}
                </div>

                {/* Simulation Controls — hidden when real GPS is driving position */}
                {!gpsActive && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNavIndex((p) => Math.max(0, p - 1))}
                      className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 flex items-center justify-center text-white cursor-pointer"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="h-10 px-5 rounded-xl font-extrabold text-gray-950 flex items-center gap-2 shadow-lg cursor-pointer"
                      style={{ backgroundColor: modeCfg.color }}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{isPlaying ? "Pause" : "Play Nav"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNavIndex((p) => Math.min(geometryPoints.length - 1, p + 1))}
                      className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 flex items-center justify-center text-white cursor-pointer"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimSpeed((s) => (s === 1 ? 2 : s === 2 ? 5 : 1))}
                      className="h-10 px-3 rounded-xl bg-gray-800 border border-gray-700 text-xs font-black text-emerald-400 cursor-pointer"
                    >
                      {simSpeed}x Speed
                    </button>
                  </div>
                )}

                {/* When GPS is live — show a "following GPS" indicator instead of sim controls */}
                {gpsActive && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Following Live GPS</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 🗺️ DYNAMIC CIVICSHIELD-STYLE SVG HEATMAP VIEW WRAPPER */}
      <div 
        className="absolute inset-0 w-full h-full transition-all duration-700 ease-out origin-center"
        style={{ 
          opacity: heatmapOpacity,
          transform: `scale(${heatmapScale})`,
          zIndex: !showLeafletMap ? 10 : 1,
          pointerEvents: !showLeafletMap ? "auto" : "none"
        }}
      >
        <div className="map-container-relative w-full h-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-b from-[#f0faf5] to-white rounded-[3rem]">
          {selectedState ? (
            /* District-level State Map View */
            <StateMap 
              stateCode={selectedState} 
              stateData={STATE_ENV_DATA[selectedState]} 
              stateName={STATE_CODE_TO_NAME[selectedState]} 
              onBack={() => setSelectedState(null)} 
            />
          ) : (
            /* National India Heatmap View */
            <div className="w-full flex flex-col items-center">
              
              {/* Legend and Title Bar */}
              <div className="w-full flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                <div>
                  <h3 className="font-black text-gray-800 text-base leading-none">🗺️ National Health Index</h3>
                  <span className="text-[10px] font-bold text-gray-400 mt-1 block">Click any state to explore district-level details</span>
                </div>
                
                {/* Color Scale Legend */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase">AQI Scale</span>
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/50 p-1 rounded-xl text-[8px] font-black text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981]" /> Good</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#eab308]" /> Moderate</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4444]" /> Severe</span>
                  </div>
                </div>
              </div>

              {/* SVG Map of India */}
              {pathData ? (
                <div className="relative w-full max-h-[460px] overflow-hidden flex items-center justify-center">
                  <svg 
                    viewBox="0 0 600 700" 
                    preserveAspectRatio="xMidYMid meet"
                    className="w-full h-full max-h-[450px]"
                  >
                    {Object.entries(pathData).map(([stateName, d]) => {
                      const code = STATE_NAME_TO_CODE[stateName];
                      const stateData = STATE_ENV_DATA[code];
                      const fillColor = stateData ? getAQIColor(stateData.aqi) : "rgba(200, 200, 200, 0.4)";

                      return (
                        <path
                          key={stateName}
                          d={d}
                          fill={fillColor}
                          stroke="rgba(255, 255, 255, 0.55)"
                          strokeWidth={hoveredState?.name === stateName ? 1.5 : 0.55}
                          onMouseEnter={(e) => handleStateHover(stateName, e)}
                          onMouseMove={(e) => handleStateHover(stateName, e)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => handleStateClick(stateName)}
                          className="cursor-pointer transition-all duration-200"
                          style={{
                            filter: hoveredState?.name === stateName ? "brightness(1.1)" : "none"
                          }}
                        />
                      );
                    })}
                  </svg>

                  {/* 📊 Dynamic Coordinates-Following State Tooltip */}
                  {showHoverBox && hoveredState && hoveredState.data && (
                    <div 
                      className="absolute z-[1000] w-60 bg-white/95 backdrop-blur-md shadow-2xl shadow-emerald-950/15 border border-emerald-100/60 rounded-[2rem] p-5 pointer-events-none transition-all duration-75"
                      style={(() => {
                        const popupWidth = 240;  // w-60 = 240px
                        const popupHeight = 290; // approximate popup height
                        const gap = 12;          // gap from cursor

                        const cw = mousePos.containerWidth || 600;
                        const ch = mousePos.containerHeight || 460;
                        const mx = mousePos.x;
                        const my = mousePos.y;

                        // Prefer right side, flip left if not enough space
                        const fitsRight = mx + gap + popupWidth <= cw;
                        const fitsBottom = my + popupHeight <= ch;

                        const left = fitsRight ? mx + gap : mx - gap - popupWidth;
                        const top = fitsBottom ? my : my - popupHeight;

                        // Clamp to container edges to prevent any overflow
                        const clampedLeft = Math.max(0, Math.min(left, cw - popupWidth));
                        const clampedTop = Math.max(0, Math.min(top, ch - popupHeight));

                        return { left: `${clampedLeft}px`, top: `${clampedTop}px` };
                      })()}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <Activity className="w-3 h-3 text-emerald-600 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black text-emerald-800 uppercase tracking-widest leading-none">{hoveredState.name}</h4>
                          <span className="text-[8px] text-gray-400 font-black mt-0.5 block">State Level Metrics</span>
                        </div>
                      </div>

                      {/* AQI Indicator */}
                      <div className="border-t border-b border-gray-100/60 py-2.5 mb-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">State Avg AQI</p>
                          <p className="text-2xl font-black tracking-tight" style={{ color: getAQIColor(hoveredState.data.aqi) }}>
                            {hoveredState.data.aqi}
                          </p>
                        </div>
                        <span 
                          className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border"
                          style={{ 
                            color: getAQIColor(hoveredState.data.aqi), 
                            borderColor: `${getAQIColor(hoveredState.data.aqi)}30`, 
                            backgroundColor: `${getAQIColor(hoveredState.data.aqi)}10` 
                          }}
                        >
                          {getAQILabel(hoveredState.data.aqi)}
                        </span>
                      </div>

                      {/* Weather, Temp, Greenery */}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="flex items-center gap-1.5 bg-gray-50/50 p-1.5 rounded-lg border border-gray-100/30">
                          <CloudSun className="w-3.5 h-3.5 text-orange-400" />
                          <div>
                            <p className="text-[8px] text-gray-400 font-bold uppercase">Temp</p>
                            <p className="text-[10px] font-black text-gray-700">{hoveredState.data.temp}°C</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50/50 p-1.5 rounded-lg border border-gray-100/30">
                          <Compass className="w-3.5 h-3.5 text-emerald-400" />
                          <div>
                            <p className="text-[8px] text-gray-400 font-bold uppercase">Roads</p>
                            <p className="text-[9px] font-black text-gray-700 leading-tight">{hoveredState.data.roadQuality}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 bg-gray-50/50 p-2 rounded-lg border border-gray-100/30 mb-2 text-xs">
                        <Droplets className="w-3.5 h-3.5 text-blue-400" />
                        <div>
                          <span className="text-[8px] text-gray-400 font-bold uppercase block leading-none">Green Canopy</span>
                          <span className="font-extrabold text-[10px] text-gray-700">{hoveredState.data.greenery}</span>
                        </div>
                      </div>

                      {/* Primary Source */}
                      <div className="bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10 flex items-start gap-1.5">
                        <Info className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest block leading-none mb-1">Eco Travel Advice</span>
                          <p className="text-[9px] text-gray-500 font-bold leading-tight">{hoveredState.data.advice}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                  Loading national map data...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteMap;
