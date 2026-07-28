import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { Navigation, X, Volume2, VolumeX, RotateCcw, ZoomIn, ZoomOut, MapPin, Leaf, ChevronRight, Wind } from "lucide-react";
import { serverUrl } from "@/main";

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

/* ─── Haversine distance km ───────────────────────────────── */
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ─── ETA helper ──────────────────────────────────────────── */
const getETA = (mins) => {
  const eta = new Date(Date.now() + mins * 60 * 1000);
  return eta.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

/* ─── Fetch real OSRM steps ───────────────────────────────── */
const fetchOSRMSteps = async (originCoords, destinationCoords) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${originCoords.lon},${originCoords.lat};${destinationCoords.lon},${destinationCoords.lat}?steps=true&geometries=geojson&overview=full`;
    const res = await axios.get(url, { timeout: 12000 });
    const route = res.data?.routes?.[0];
    if (!route) return { steps: [], geometry: [] };
    // Flatten all steps from all legs
    const steps = [];
    route.legs?.forEach((leg) => {
      leg.steps?.forEach((step) => {
        if (step.maneuver?.type) {
          const typeMap = {
            "turn": step.maneuver.modifier?.includes("right") ? "↪" : "↩",
            "new name": "⬆",
            "depart": "🚦",
            "arrive": "🏁",
            "merge": "↗",
            "on ramp": "↗",
            "off ramp": "↘",
            "fork": "⬆",
            "end of road": "↩",
            "roundabout": "🔄",
            "rotary": "🔄",
            "continue": "⬆",
          };
          const icon = typeMap[step.maneuver.type] || "⬆";
          const name = step.name || "unnamed road";
          const dist = step.distance > 1000
            ? `${(step.distance / 1000).toFixed(1)} km`
            : `${Math.round(step.distance)} m`;
          steps.push({ icon, text: step.maneuver.type === "depart" ? `Head towards ${name}` : step.maneuver.type === "arrive" ? `Arrive at destination` : `${step.maneuver.modifier ? step.maneuver.modifier.charAt(0).toUpperCase() + step.maneuver.modifier.slice(1) + " on " : ""}${name}`, dist, lat: step.maneuver.location[1], lon: step.maneuver.location[0] });
        }
      });
    });
    const geometry = route.geometry?.coordinates?.map(([lon, lat]) => ({ lat, lon })) || [];
    return { steps, geometry };
  } catch {
    return { steps: [], geometry: [] };
  }
};

/* ─── Voice ───────────────────────────────────────────────── */
const speak = (text) => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-IN"; msg.rate = 0.95; msg.volume = 1;
  window.speechSynthesis.speak(msg);
};

/* ─── Map icons ───────────────────────────────────────────── */
const liveIcon = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#34d399,#059669);border:3px solid white;box-shadow:0 0 0 5px rgba(16,185,129,0.3),0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [22, 22], iconAnchor: [11, 11],
});
const destIcon = new L.Icon({
  iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/blue-pushpin.png",
  iconSize: [32, 32], iconAnchor: [10, 32],
});

/* ─── Map sub-components ──────────────────────────────────── */
const RecenterMap = ({ position, follow }) => {
  const map = useMap();
  useEffect(() => { if (follow && position) map.setView(position, map.getZoom(), { animate: true }); }, [position, follow, map]);
  return null;
};

const ZoomControls = () => {
  const map = useMap();
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[500] flex flex-col gap-2" style={{ pointerEvents: "auto" }}>
      <button onClick={() => map.zoomIn()} className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-700 hover:bg-emerald-50 transition border border-gray-100"><ZoomIn className="w-4 h-4" /></button>
      <button onClick={() => map.zoomOut()} className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-700 hover:bg-emerald-50 transition border border-gray-100"><ZoomOut className="w-4 h-4" /></button>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
const NavigationScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { route, origin, destination, originCoords, destinationCoords } = location.state || {};

  /* Guard */
  if (!route || !originCoords || !destinationCoords) {
    return (
      <div className="min-h-screen bg-[#f0faf5] flex items-center justify-center">
        <div className="text-center p-10 bg-white rounded-3xl shadow-lg">
          <Navigation className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <p className="text-gray-700 font-bold text-lg">No route selected.</p>
          <button onClick={() => navigate("/routes")} className="mt-4 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition">Back to Routes</button>
        </div>
      </div>
    );
  }

  /* State */
  const [userPosition, setUserPosition] = useState([originCoords.lat, originCoords.lon]);
  const [followUser, setFollowUser] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [steps, setSteps] = useState([]);
  const [routeGeometry, setRouteGeometry] = useState(route.geometry || []);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [remainingDist, setRemainingDist] = useState(route.distance);
  const [remainingMins, setRemainingMins] = useState(parseInt(route.duration) || 0);
  const [liveAQI, setLiveAQI] = useState(route.avgAQI);
  const [arrived, setArrived] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState(true);

  const watchIdRef = useRef(null);
  const lastVoiceRef = useRef("");
  const aqiIntervalRef = useRef(null);
  const voiceRef = useRef(true);
  voiceRef.current = voiceEnabled;

  const segments = route.pollutionSegments || [];
  const eta = getETA(remainingMins);

  /* ── Fetch real OSRM steps on mount ── */
  useEffect(() => {
    setLoadingSteps(true);
    fetchOSRMSteps(originCoords, destinationCoords).then(({ steps: s, geometry: g }) => {
      if (s.length) setSteps(s);
      else setSteps([{ icon: "🚦", text: `Head from ${origin}`, dist: "Start" }, { icon: "🏁", text: `Arrive at ${destination}`, dist: "End" }]);
      if (g.length > 1) setRouteGeometry(g);
      setLoadingSteps(false);
      if (voiceRef.current) setTimeout(() => speak(`Navigation started to ${destination}. ${route.healthAdvice || ""}`), 600);
    });
  }, []);

  /* ── Live geolocation ── */
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const newPos = [lat, lon];
        setUserPosition(newPos);

        /* Remaining distance & time */
        const distKm = haversine(lat, lon, destinationCoords.lat, destinationCoords.lon);
        setRemainingDist(`${distKm.toFixed(1)} km`);
        setRemainingMins(Math.round((distKm / 60) * 60));

        /* Arrival check */
        if (distKm < 0.3) {
          setArrived(true);
          if (voiceRef.current) speak(`You have arrived at ${destination}`);
          return;
        }

        /* Advance step based on proximity to step waypoint */
        setSteps((prev) => {
          const idx = prev.findIndex((s, i) => i > 0 && s.lat && haversine(lat, lon, s.lat, s.lon) < 0.15);
          if (idx > 0) {
            setCurrentStepIdx(idx);
            if (voiceRef.current && prev[idx].text !== lastVoiceRef.current) {
              lastVoiceRef.current = prev[idx].text;
              speak(prev[idx].text);
            }
          }
          return prev;
        });
      },
      (err) => console.warn("GPS:", err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
    );
    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  /* ── Poll live AQI at user position every 60s ── */
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/v4/eco-score`, { timeout: 5000 });
        if (res.data?.aqi) setLiveAQI(res.data.aqi);
      } catch { /* silent */ }
    };
    aqiIntervalRef.current = setInterval(poll, 60000);
    return () => clearInterval(aqiIntervalRef.current);
  }, []);

  /* Cleanup voice on unmount */
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  /* ── Toggle voice ── */
  const toggleVoice = useCallback(() => {
    setVoiceEnabled((v) => { if (!v) speak("Voice enabled."); else window.speechSynthesis?.cancel(); return !v; });
  }, []);

  const currentStep = steps[currentStepIdx] || steps[0];
  const nextStep = steps[currentStepIdx + 1];

  /* ── Route badge ── */
  const routeBadge = (() => {
    if (route.name?.includes("Pregnancy") || route.name?.includes("Elder")) return { label: "Pregnancy & Elder", color: "bg-pink-100 text-pink-700 border-pink-200", icon: "🤱" };
    if (route.name?.includes("Bright") || route.name?.includes("Lit")) return { label: "Women Safety", color: "bg-purple-100 text-purple-700 border-purple-200", icon: "💡" };
    if (route.name?.includes("Smog") || route.name?.includes("Eco") || route.name?.includes("Champion")) return { label: "Low Pollution", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "🍃" };
    if (route.name?.includes("Shaded") || route.name?.includes("Canopy")) return { label: "Seasonal Route", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: "☀️" };
    return { label: route.name || "Navigation", color: "bg-gray-100 text-gray-700 border-gray-200", icon: "🗺️" };
  })();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900 select-none">

      {/* ══ FULL-SCREEN MAP ══════════════════════════════════════ */}
      <MapContainer center={userPosition} zoom={14} minZoom={5} maxZoom={18} zoomControl={false} scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", position: "absolute", inset: 0 }}
        whenReady={(map) => { map.target.on("mousedown touchstart", () => setFollowUser(false)); }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO" />
        <ZoomControls />
        <RecenterMap position={userPosition} follow={followUser} />

        {/* Route polyline — AQI colored or plain green */}
        {segments.length > 1
          ? segments.map((seg, i) => { if (i === segments.length - 1) return null; const next = segments[i + 1]; return (<Polyline key={i} positions={[[seg.lat, seg.lon], [next.lat, next.lon]]} pathOptions={{ color: getAQIColor(seg.aqi), weight: 8, opacity: 0.9, lineCap: "round" }} />); })
          : routeGeometry.length > 1 && (<Polyline positions={routeGeometry.map((p) => [p.lat, p.lon])} pathOptions={{ color: "#10b981", weight: 8, opacity: 0.85, lineCap: "round" }} />)}

        {/* Live location */}
        {userPosition && (<>
          <Circle center={userPosition} radius={80} pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.12, weight: 1 }} />
          <Marker position={userPosition} icon={liveIcon}><Popup>📍 You</Popup></Marker>
        </>)}

        {/* Destination */}
        <Marker position={[destinationCoords.lat, destinationCoords.lon]} icon={destIcon}><Popup>🏁 {destination}</Popup></Marker>

        {/* EV stations */}
        {route.evStations?.map((ev) => (<Marker key={ev.id} position={[ev.lat, ev.lon]}><Popup><strong style={{ color: "#10b981" }}>{ev.name}</strong><br /><small>{ev.operator}</small></Popup></Marker>))}
      </MapContainer>

      {/* ══ TOP — INSTRUCTION BANNER ═══════════════════════════ */}
      <div className="absolute top-0 left-0 right-0 z-[600] px-4 pt-4 pb-2 pointer-events-none">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center mb-2">
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${routeBadge.color}`}>{routeBadge.icon} {routeBadge.label}</span>
          </div>
          <div className="bg-white/95 backdrop-blur-md rounded-[1.5rem] shadow-2xl shadow-black/20 px-5 py-4 border border-white/60 pointer-events-auto">
            {loadingSteps ? (
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center animate-pulse shrink-0"><Navigation className="w-6 h-6 text-emerald-400" /></div>
                <p className="text-gray-400 font-bold text-sm">Calculating route steps…</p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/30 shrink-0">{currentStep?.icon || "⬆"}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-black text-base leading-tight">{currentStep?.text}</p>
                  {currentStep?.dist && <p className="text-[10px] text-gray-400 font-bold mt-0.5">in {currentStep.dist}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Step</p>
                  <p className="text-sm font-black text-emerald-600">{currentStepIdx + 1}/{steps.length}</p>
                </div>
              </div>
            )}
            {nextStep && (<div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-gray-400"><ChevronRight className="w-3.5 h-3.5 shrink-0" /><p className="text-xs font-bold truncate">Then: {nextStep.text}</p></div>)}
          </div>
        </div>
      </div>

      {/* ══ RIGHT CONTROLS ════════════════════════════════════════ */}
      <div className="absolute right-4 bottom-52 z-[600] flex flex-col gap-3">
        <button onClick={toggleVoice} className={`w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center transition border ${voiceEnabled ? "bg-emerald-500 text-white border-emerald-600" : "bg-white text-gray-500 border-gray-200"}`}>
          {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
        <button onClick={() => setFollowUser(true)} className={`w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center transition border ${followUser ? "bg-emerald-500 text-white border-emerald-600" : "bg-white text-gray-500 border-gray-200"}`}>
          <RotateCcw className="w-5 h-5" />
        </button>
        <button onClick={() => { window.speechSynthesis?.cancel(); navigate("/routes"); }} className="w-12 h-12 rounded-2xl bg-red-500 text-white shadow-xl flex items-center justify-center hover:bg-red-600 transition border border-red-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ══ BOTTOM PANEL ══════════════════════════════════════════ */}
      <div className="absolute bottom-0 left-0 right-0 z-[600]">
        <div className="mx-4 mb-4">
          <div className="bg-white/95 backdrop-blur-md rounded-[1.5rem] shadow-2xl shadow-black/20 px-5 py-4 border border-white/60">
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">ETA</p><p className="text-base font-black text-gray-900 leading-none">{eta}</p></div>
              <div className="text-center border-l border-gray-100"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Left</p><p className="text-base font-black text-gray-900 leading-none">{remainingDist}</p></div>
              <div className="text-center border-l border-gray-100"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Time</p><p className="text-base font-black text-gray-900 leading-none">{remainingMins} min</p></div>
              <div className="text-center border-l border-gray-100"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">AQI</p><p className="text-base font-black leading-none" style={{ color: getAQIColor(liveAQI) }}>{liveAQI ?? "—"}</p></div>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center border border-red-100 shrink-0"><MapPin className="w-4 h-4 text-red-500" /></div>
              <div className="flex-1 min-w-0"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Destination</p><p className="text-sm font-extrabold text-gray-900 truncate">{destination}</p></div>
              {route.healthAdvice && (<div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-xl shrink-0 max-w-[42%]"><Leaf className="w-3 h-3 text-emerald-500 shrink-0" /><p className="text-[9px] font-black text-emerald-700 truncate">{route.healthAdvice}</p></div>)}
            </div>
          </div>
        </div>
      </div>

      {/* ══ ARRIVAL OVERLAY ════════════════════════════════════ */}
      {arrived && (
        <div className="absolute inset-0 z-[700] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 mx-6 text-center shadow-2xl max-w-sm w-full">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-200"><span className="text-4xl">🏁</span></div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">You've Arrived!</h2>
            <p className="text-gray-500 font-medium text-sm mb-6">You've reached <span className="text-emerald-600 font-black">{destination}</span></p>
            {liveAQI && (<div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-black mb-6" style={{ color: getAQIColor(liveAQI), backgroundColor: `${getAQIColor(liveAQI)}15`, border: `1px solid ${getAQIColor(liveAQI)}30` }}><Wind className="w-4 h-4" />AQI: {liveAQI} · {getAQILabel(liveAQI)}</div>)}
            <button onClick={() => navigate("/routes")} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-200 transition text-base">Back to Routes</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationScreen;
