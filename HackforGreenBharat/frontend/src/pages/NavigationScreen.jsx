import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MapContainer, TileLayer, Polyline, Marker, Popup, useMap, useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import {
  Navigation, ArrowLeft, Mic, MicOff, ChevronDown, ChevronRight,
  MapPin, Leaf, Zap, Sparkles, Share2, Compass, Gauge, Clock,
  Route as RouteIcon, Target, Eye, Plus, Minus, Volume2, Hospital, ShieldCheck, Crosshair,
} from "lucide-react";
import { fetchNearestEmergencyPOIs } from "@/services/emergencyService";

import {
  fetchRouteEmergency,
  refreshUserDistances,
  haversine,
  OVERPASS_URL,
  normalizeGeometry
} from "@/services/nearbyServices";

/* ─── Leaflet icons ──────────────────────────────────────── */
const hospitalIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#ef4444;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:13px;">🏥</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const policeIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#2563eb;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:13px;">🛡️</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const destIcon = L.divIcon({
  className: "",
  html: `<div style="display:flex;flex-direction:column;align-items:center;"><svg width="30" height="38" viewBox="0 0 24 32" fill="none"><path d="M12 0C5.37 0 0 5.37 0 12C0 20.5 12 32 12 32C12 32 24 20.5 24 12C24 5.37 18.63 0 12 0Z" fill="#ea4335"/><circle cx="12" cy="11.5" r="4.5" fill="white"/></svg></div>`,
  iconSize: [30, 38],
  iconAnchor: [15, 36],
});

const makeNavIcon = (heading = 0) =>
  L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#60a5fa,#2563eb);border:3px solid white;box-shadow:0 0 0 5px rgba(37,99,235,0.25);transform:rotate(${heading}deg);transition:transform 0.4s ease;"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
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

/* ─── Formatters ─────────────────────────────────────────── */
const fmtDist = (km) =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

const fmtETA = (mins) => {
  const eta = new Date(Date.now() + (mins || 30) * 60_000);
  return eta.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

/* ─── Fetch OSRM steps ────────────────────────────────────── */
const fetchOSRMSteps = async (originCoords, destinationCoords, mode = "driving") => {
  const osrmProfile = mode === "cycling" ? "bike" : mode === "foot" ? "foot" : "driving";
  try {
    const url =
      `https://router.project-osrm.org/route/v1/${osrmProfile}/` +
      `${originCoords.lon},${originCoords.lat};` +
      `${destinationCoords.lon},${destinationCoords.lat}` +
      `?steps=true&geometries=geojson&overview=full`;
    const res = await axios.get(url, { timeout: 10000 });
    const r = res.data?.routes?.[0];
    if (!r) return { steps: [], geometry: [] };

    const steps = [];
    r.legs?.forEach((leg) => {
      leg.steps?.forEach((step) => {
        if (!step.maneuver?.type) return;
        const icon = step.maneuver.modifier?.includes("right") ? "↪" : "↩";
        const name = step.name || "Main Road";
        const dist = step.distance > 1000 ? `${(step.distance / 1000).toFixed(1)} km` : `${Math.round(step.distance)} m`;
        steps.push({
          icon,
          text: `${step.maneuver.modifier ? step.maneuver.modifier + " onto " : "onto "}${name}`,
          dist,
        });
      });
    });
    const geometry = r.geometry?.coordinates?.map(([lon, lat]) => ({ lat, lon })) || [];
    return { steps, geometry, totalDistance: r.distance };
  } catch {
    return { steps: [], geometry: [] };
  }
};

/* ─── Leaflet map sub-components ─────────────────────────── */
const RecenterMap = ({ position, follow, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (follow && position)
      map.setView(position, zoom ?? map.getZoom(), { animate: true, duration: 0.6 });
  }, [position, follow]);
  return null;
};

const DragWatcher = ({ onDrag }) => {
  useMapEvents({ dragstart: onDrag });
  return null;
};

const FitRouteBounds = ({ geometry, enabled }) => {
  const map = useMap();
  useEffect(() => {
    if (enabled && geometry && geometry.length > 1) {
      const bounds = L.latLngBounds(geometry.map((p) => [p.lat, p.lon]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [geometry, enabled, map]);
  return null;
};

const HospitalMarker = ({ h, isFocused }) => {
  const markerRef = useRef(null);
  useEffect(() => {
    if (isFocused && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isFocused]);

  return (
    <Marker ref={markerRef} position={[h.lat, h.lon]} icon={hospitalIcon}>
      <Popup>🏥 {h.name}</Popup>
    </Marker>
  );
};

const PoliceMarker = ({ p, isFocused }) => {
  const markerRef = useRef(null);
  useEffect(() => {
    if (isFocused && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isFocused]);

  return (
    <Marker ref={markerRef} position={[p.lat, p.lon]} icon={policeIcon}>
      <Popup>🛡️ {p.name}</Popup>
    </Marker>
  );
};

/* ════════════════════════════════════════════════════════════
   MAIN NAVIGATION COMPONENT
════════════════════════════════════════════════════════════ */
const NavigationScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const queryMode = queryParams.get("mode");

  const {
    route = {}, origin = "New Delhi, Delhi", destination = "Mumbai, Maharashtra",
    originCoords = { lat: 28.6139, lon: 77.2090 },
    destinationCoords = { lat: 19.0760, lon: 72.8777 },
    travelMode = "driving",
    navigationMode: stateMode = null,
    focusedFacility = null,
  } = location.state || {};

  const navigationMode = queryMode || stateMode || "live";

  const [displayPos, setDisplayPos] = useState(
    focusedFacility ? [focusedFacility.lat, focusedFacility.lon] : [originCoords.lat, originCoords.lon]
  );
  const [realPos, setRealPos] = useState([originCoords.lat, originCoords.lon]);
  const [heading, setHeading] = useState(0);
  const [followUser, setFollowUser] = useState(focusedFacility ? false : (navigationMode === "live"));
  const [focusedFacilityId, setFocusedFacilityId] = useState(focusedFacility?.id || null);
  const [voiceEnabled, setVoiceEnabled] = useState(navigationMode === "live");

  const [steps, setSteps] = useState([]);
  const [routeGeometry, setRouteGeometry] = useState(normalizeGeometry(route.geometry));
  const [remainingDist, setRemainingDist] = useState(route.distance || "4.2 km");
  const [remainingMins, setRemainingMins] = useState(parseInt(route.duration) || 12);
  const [progressPct, setProgressPct] = useState(navigationMode === "live" ? 45 : 0);
  const [speed, setSpeed] = useState(navigationMode === "live" ? 42 : null);

  const [liveAQI, setLiveAQI] = useState(route.avgAQI ?? 59);
  const [allHospitals, setAllHospitals] = useState([]);
  const [allPolice, setAllPolice] = useState([]);
  const [showHospitalsOnMap, setShowHospitalsOnMap] = useState(true);
  const [showPoliceOnMap, setShowPoliceOnMap] = useState(true);
  const [emergencyTab, setEmergencyTab] = useState("hospitals");

  // Watch ID for tracking user position in live mode
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (navigationMode !== "live") return;

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, heading: rawHeading, speed: rawSpeed } = pos.coords;
          setRealPos([latitude, longitude]);
          setDisplayPos([latitude, longitude]);
          if (rawHeading != null) setHeading(rawHeading);
          if (rawSpeed != null) setSpeed(Math.round(rawSpeed * 3.6));
        },
        (err) => {
          console.warn("GPS tracking error:", err.message);
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 8000 }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [navigationMode]);

  const handleGoBack = () => {
    navigate("/routes", {
      state: {
        preserveState: true,
        routes: location.state?.routes || (route?.geometry ? [route] : []),
        selectedRoute: location.state?.selectedRoute || 0,
        origin: origin,
        destination: destination,
        originCoords: originCoords,
        destinationCoords: destinationCoords,
        travelMode: travelMode,
        preferences: location.state?.preferences || {},
        showDetailedInputs: true,
      },
    });
  };

  const handleNavigateToStart = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          navigate("/routes", {
            state: {
              triggerNavigateToStart: true,
              userCoords: { lat: pos.coords.latitude, lon: pos.coords.longitude },
              targetOrigin: origin,
              targetOriginCoords: originCoords,
              targetDestination: destination,
              targetDestinationCoords: destinationCoords
            }
          });
        },
        (err) => {
          navigate("/routes", {
            state: {
              triggerNavigateToStart: true,
              userCoords: { lat: 28.6139, lon: 77.2090 },
              targetOrigin: origin,
              targetOriginCoords: originCoords,
              targetDestination: destination,
              targetDestinationCoords: destinationCoords
            }
          });
        }
      );
    } else {
      navigate("/routes");
    }
  };

  /* Load steps & emergency POIs */
  useEffect(() => {
    fetchOSRMSteps(originCoords, destinationCoords, travelMode).then(({ steps: s, geometry: g }) => {
      if (s.length) setSteps(s);
      else {
        setSteps([
          { icon: "↪", text: "Turn right onto Main Road", dist: "300 m" },
          { icon: "↑", text: "Continue straight on NH 48", dist: "2.4 km" },
          { icon: "↰", text: "Turn left onto Link Road", dist: "5.2 km" },
        ]);
      }
      const normG = normalizeGeometry(g);
      if (normG.length > 1) setRouteGeometry(normG);
    });

    fetchNearestEmergencyPOIs(
      routeGeometry.length > 0 ? routeGeometry : [originCoords, destinationCoords],
      originCoords,
      destinationCoords
    ).then(({ hospitals, police }) => {
      setAllHospitals(hospitals);
      setAllPolice(police);
    });
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((v) => !v);
  }, []);

  const currentStep = steps[0] || { icon: "↪", text: "Turn right onto Main Road", dist: "300 m" };
  const nextStep = steps[1] || { icon: "↑", text: "Continue straight on NH 48", dist: "2.4 km" };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100 flex flex-col font-sans select-none">
      
      {/* ════════════════ 1. TOP NAVIGATION HEADER ════════════════ */}
      <header className="w-full bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between gap-3 shadow-xs shrink-0 z-30">
        
        {/* Left: Back Arrow + End Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGoBack}
            className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-gray-700 transition-colors shadow-xs"
            title="Go Back to Routes"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          {navigationMode === "preview" ? (
            <span className="text-sm font-black text-blue-600 px-2 py-1 uppercase tracking-wider">
              Route Preview
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-emerald-600 px-2 py-1 uppercase tracking-wider">
                Active Navigation
              </span>
              <button
                type="button"
                onClick={handleGoBack}
                className="text-xs font-bold text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 bg-red-50/50 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                End
              </button>
            </div>
          )}
        </div>

        {/* Center: Location Status Pair */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-1.5 text-xs font-bold text-gray-800">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="truncate max-w-[180px]">{origin}</span>
          <span className="text-gray-400">➔</span>
          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="truncate max-w-[180px]">{destination}</span>
        </div>

        {/* Right: Travel Mode Selector & Mic/Voice */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700">
            <span>🚗</span>
            <span className="capitalize">{travelMode}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>

          <button
            type="button"
            onClick={toggleVoice}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
              voiceEnabled
                ? "bg-emerald-50 border-emerald-300 text-emerald-600"
                : "bg-gray-50 border-gray-200 text-gray-400"
            }`}
          >
            {voiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        </div>

      </header>

      {/* ════════════════ 2. 3-COLUMN WORKSPACE GRID ════════════════ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] xl:grid-cols-[330px_1fr_330px] p-3 gap-3 min-h-0 overflow-hidden">

        {/* ── LEFT PANEL ── */}
        {navigationMode === "preview" ? (
          <aside className="flex flex-col gap-3 overflow-y-auto min-h-0 shrink-0">
            
            {/* 1. Preview Header */}
            <div className="bg-[#1e40af] text-white rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-start gap-3">
                <span className="text-4xl leading-none font-bold mt-0.5">🗺️</span>
                <div>
                  <span className="text-lg font-black block">Route Preview</span>
                  <span className="text-xs font-bold text-blue-200 block">{origin.split(",")[0]} ➔ {destination.split(",")[0]}</span>
                </div>
              </div>
            </div>

            {/* 2. Route Details Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3 text-xs font-bold text-gray-800">
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Route Details</h4>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400">Total Distance</span>
                <span>{route.distance || remainingDist}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400">Estimated Duration</span>
                <span>{route.duration || `${remainingMins} min`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Route Average AQI</span>
                <span className="text-emerald-600 font-extrabold">{liveAQI}</span>
              </div>
            </div>

            {/* 3. Suggested Paths */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-2.5">
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Suggested Paths</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex items-center justify-between text-xs font-bold text-blue-900">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>Eco Route (Selected)</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-gray-600">{route.duration || `${remainingMins} min`}</span>
                  <span className="text-blue-700 font-bold">{route.distance || remainingDist}</span>
                </div>
              </div>
            </div>

            {/* 4. Action Buttons */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-2.5">
              <button
                type="button"
                onClick={handleNavigateToStart}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all"
              >
                <Navigation className="w-4 h-4" />
                <span>Navigate to Starting Point</span>
              </button>

              <button
                type="button"
                onClick={handleGoBack}
                className="w-full h-11 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Routes</span>
              </button>
            </div>

          </aside>
        ) : (
          <aside className="flex flex-col gap-3 overflow-y-auto min-h-0 shrink-0">
            
            {/* 1. Main Turn Instruction Card (Dark Green) */}
            <div className="bg-[#064e3b] text-white rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-start gap-3">
                <span className="text-4xl leading-none font-bold mt-0.5">
                  {currentStep.icon}
                </span>
                <div>
                  <span className="text-2xl font-black block">{currentStep.dist}</span>
                  <span className="text-xs font-bold text-emerald-200 block">{currentStep.text}</span>
                </div>
              </div>
            </div>

            {/* 2. Upcoming Turn Instructions List */}
            <div className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-sm space-y-3">
              <div className="flex items-start gap-3 text-xs font-bold text-gray-800">
                <span className="text-base font-black text-gray-500">↑</span>
                <div>
                  <span className="text-gray-900 font-extrabold block">2.4 km</span>
                  <span className="text-gray-500 block">Continue straight on NH 48</span>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-2 flex items-start gap-3 text-xs font-bold text-gray-800">
                <span className="text-base font-black text-gray-500">↰</span>
                <div>
                  <span className="text-gray-900 font-extrabold block">5.2 km</span>
                  <span className="text-gray-500 block">Turn left onto Link Road</span>
                </div>
              </div>
            </div>

            {/* 3. Route Progress */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-2.5">
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Route Progress</h4>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-600 font-extrabold">{progressPct}% Completed</span>
                <span className="text-gray-400 font-medium">{remainingDist} of {route.distance || "9.3 km"}</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[45%]" />
              </div>
            </div>

            {/* 4. Route Options */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-2.5">
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Route Options</h4>
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 flex items-center justify-between text-xs font-bold text-emerald-900">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                  <span>Eco Route (Selected)</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-gray-600">12 min</span>
                  <span className="text-emerald-700 font-extrabold">4.2 km</span>
                </div>
              </div>
              <div className="border-border border-gray-100 rounded-xl p-2.5 flex items-center justify-between text-xs font-bold text-gray-700">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span>Fastest Route</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-gray-600">10 min</span>
                  <span className="text-gray-800">4.6 km</span>
                </div>
              </div>
              <div className="border border-gray-100 rounded-xl p-2.5 flex items-center justify-between text-xs font-bold text-gray-700">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>Low Pollution Route</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-gray-600">13 min</span>
                  <span className="text-gray-800">4.3 km</span>
                </div>
              </div>
            </div>

            {/* 5. Voice Guidance & Share ETA */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3 text-xs font-bold text-gray-800">
              <div className="flex items-center justify-between">
                <span>Voice Guidance</span>
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                    voiceEnabled ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {voiceEnabled ? "ON" : "OFF"}
                </button>
              </div>
              <div className="border-t border-gray-100 pt-2 flex items-center justify-between cursor-pointer hover:text-emerald-600">
                <span className="flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  <span>Share ETA</span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>

          </aside>
        )}

        {/* ── CENTER LIVE NAVIGATION MAP ── */}
        <main className="flex flex-col flex-1 h-full min-h-0 relative rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-xs">
          
          {/* Compass North Indicator */}
          <div className="absolute top-4 left-4 z-[500] w-9 h-9 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-gray-200 flex flex-col items-center justify-center text-[10px] font-black text-red-600 pointer-events-none">
            <span>▲</span>
            <span className="text-[8px] font-black text-gray-800 -mt-1">N</span>
          </div>

          {/* Leaflet Map */}
          <MapContainer
            center={displayPos}
            zoom={15}
            minZoom={5}
            maxZoom={18}
            zoomControl={false}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution="&copy; CARTO"
            />
            <RecenterMap position={displayPos} follow={followUser} zoom={15} />
            <DragWatcher onDrag={() => setFollowUser(false)} />
            <FitRouteBounds geometry={routeGeometry} enabled={navigationMode === "preview"} />

            {/* Navigation Active Polyline */}
            {routeGeometry.length > 1 && (
              <Polyline
                positions={routeGeometry.map((p) => [p.lat, p.lon])}
                pathOptions={{ color: "#2563eb", weight: 7, opacity: 0.9 }}
              />
            )}

            {/* Destination Pin */}
            <Marker position={[destinationCoords.lat, destinationCoords.lon]} icon={destIcon}>
              <Popup>{destination}</Popup>
            </Marker>

            {/* User Direction Marker */}
            <Marker position={displayPos} icon={makeNavIcon(heading)}>
              <Popup>Current Position</Popup>
            </Marker>

            {/* Hospital Markers */}
            {showHospitalsOnMap &&
              allHospitals.map((h) => (
                <HospitalMarker key={h.id} h={h} isFocused={focusedFacilityId === h.id} />
              ))}

            {/* Police Markers */}
            {showPoliceOnMap &&
              allPolice.map((p) => (
                <PoliceMarker key={p.id} p={p} isFocused={focusedFacilityId === p.id} />
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
          </MapContainer>

          {/* Right-Hand Map Controls Stack */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[500] flex flex-col bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
            <button
              type="button"
              onClick={() => setFollowUser(true)}
              className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setFollowUser(true)}
              className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setFollowUser(true)}
              className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              title="Recenter Map"
            >
              <Target className="w-4 h-4 text-emerald-600" />
            </button>
            <button
              type="button"
              onClick={toggleVoice}
              className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              title="Toggle Voice"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Lower Recenter Button */}
          <div className="absolute bottom-4 right-20 z-[500]">
            <button
              type="button"
              onClick={() => setFollowUser(true)}
              className="px-4 py-2 bg-white/95 backdrop-blur-md border border-gray-200 rounded-full shadow-lg text-xs font-black text-emerald-700 flex items-center gap-2 hover:bg-emerald-50 transition-all"
            >
              <Target className="w-4 h-4 text-emerald-600" />
              <span>Recenter</span>
            </button>
          </div>

        </main>

        {/* ── RIGHT PANEL ── */}
        <aside className="flex flex-col gap-3 overflow-y-auto min-h-0">
          
          {/* 1. Environment */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>Environment</span>
              </h4>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>

            <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">AQI (Current)</span>
                <span className="text-2xl font-black text-emerald-700">{liveAQI}</span>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-lg text-[10px] font-black uppercase block">
                  Moderate 🟡
                </span>
                <span className="text-emerald-600 text-xs font-bold mt-1 block">🌿 Clean Air</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">Route AQI</span>
                <span className="font-extrabold text-gray-800">62 <span className="text-[10px] text-yellow-600 font-normal">Moderate</span></span>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">Temperature</span>
                <span className="font-extrabold text-gray-800">26°C ⛅</span>
              </div>
            </div>
          </div>

          {/* 2. Nearby Services */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Nearby Services</h4>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Show on Map
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-800">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-xs">🏥</span>
                <div>
                  <span className="block font-black">Hospitals</span>
                  <span className="block text-[10px] text-gray-400 font-medium">{allHospitals.length || 8} Nearby</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showHospitalsOnMap}
                onChange={(e) => setShowHospitalsOnMap(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-800">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs">🛡️</span>
                <div>
                  <span className="block font-black">Police Stations</span>
                  <span className="block text-[10px] text-gray-400 font-medium">{allPolice.length || 5} Nearby</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showPoliceOnMap}
                onChange={(e) => setShowPoliceOnMap(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {/* 3. Emergency Quick Access (Top 10 Hospitals & Police Stations) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-red-500" />
                <span>Emergency Hub (Top 10)</span>
              </h4>
              <span className="text-[10px] font-bold text-gray-400">Click to Focus</span>
            </div>

            {/* Quick Toggle Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setEmergencyTab("hospitals")}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
                  emergencyTab === "hospitals"
                    ? "bg-white text-red-600 shadow-xs font-black"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🏥 Hospitals ({allHospitals.length})
              </button>
              <button
                type="button"
                onClick={() => setEmergencyTab("police")}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
                  emergencyTab === "police"
                    ? "bg-white text-blue-600 shadow-xs font-black"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🛡️ Police ({allPolice.length})
              </button>
            </div>

            {/* List */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5 custom-scrollbar">
              {(emergencyTab === "hospitals" ? allHospitals : allPolice).map((item, idx) => (
                <div
                  key={item.id || idx}
                  onClick={() => {
                    setDisplayPos([item.lat, item.lon]);
                    setFollowUser(true);
                  }}
                  className="p-2 border border-gray-100 hover:border-emerald-300 rounded-xl flex items-center justify-between text-xs font-bold text-gray-800 hover:bg-emerald-50/50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black shrink-0 ${
                      emergencyTab === "hospitals" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="block font-black truncate group-hover:text-emerald-700">{item.name}</span>
                      <span className="block text-[9px] text-gray-400 font-medium truncate">
                        {item.distFromStart ? fmtDist(item.distFromStart) : (item.userDist ? fmtDist(item.userDist) : "Along route")}
                      </span>
                    </div>
                  </div>
                  <Crosshair className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 shrink-0" />
                </div>
              ))}
            </div>
          </div>

        </aside>

      </div>

      {/* ════════════════ 3. BOTTOM NAVIGATION STATUS BAR ════════════════ */}
      <footer className="w-full bg-white border-t border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between text-xs font-bold text-gray-700 shadow-sm shrink-0 gap-3">
        {navigationMode === "preview" ? (
          <>
            <div className="flex items-center gap-2">
              <RouteIcon className="w-4 h-4 text-blue-600" />
              <div>
                <span className="text-[9px] text-gray-400 uppercase font-extrabold block">Total Distance</span>
                <span className="text-sm font-black text-gray-900">{route.distance || remainingDist}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <div>
                <span className="text-[9px] text-gray-400 uppercase font-extrabold block">Estimated Duration</span>
                <span className="text-sm font-black text-gray-900">{route.duration || `${remainingMins} min`}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-500" />
              <div>
                <span className="text-[9px] text-gray-400 uppercase font-extrabold block">Route AQI</span>
                <span className="text-sm font-black text-emerald-700">{liveAQI}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="text-[9px] text-gray-400 uppercase font-extrabold block">Eco Score</span>
                <span className="text-sm font-black text-emerald-700">85 / 100 <span className="text-gray-400 text-[10px]">ⓘ</span></span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <RouteIcon className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="text-[9px] text-gray-400 uppercase font-extrabold block">Distance Remaining</span>
                <span className="text-sm font-black text-gray-900">{remainingDist}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <div>
                <span className="text-[9px] text-gray-400 uppercase font-extrabold block">Time Remaining</span>
                <span className="text-sm font-black text-gray-900">{remainingMins} min</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-500" />
              <div>
                <span className="text-[9px] text-gray-400 uppercase font-extrabold block">ETA</span>
                <span className="text-sm font-black text-gray-900">{fmtETA(remainingMins)} <span className="text-[10px] text-gray-400 font-normal">21 Aug 2026</span></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-purple-500" />
              <div>
                <span className="text-[9px] text-gray-400 uppercase font-extrabold block">Current Speed</span>
                <span className="text-sm font-black text-gray-900">{speed != null ? `${speed} km/h` : "—"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="text-[9px] text-gray-400 uppercase font-extrabold block">Eco Score</span>
                <span className="text-sm font-black text-emerald-700">85 / 100 <span className="text-gray-400 text-[10px]">ⓘ</span></span>
              </div>
            </div>
          </>
        )}
      </footer>

    </div>
  );
};

export default NavigationScreen;
