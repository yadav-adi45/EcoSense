import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  ChevronDown, ChevronUp, Hospital, ShieldCheck, Zap, Fuel,
  Pill, Landmark, UtensilsCrossed, Wrench, Star, Thermometer,
  Wind, Droplets, Eye, CloudSun, AlertTriangle, TrendingUp,
  MapPin, Loader2, RefreshCw, CheckCircle2, XCircle, Info,
} from "lucide-react";

/* ─── Overpass API ─────────────────────────────────────────── */
const OVERPASS_URL = "https://overpass.openstreetmap.fr/api/interpreter";

/* haversine in km */
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

const fmtDist = (km) =>
  km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;

/* ─── AQI helpers ──────────────────────────────────────────── */
const aqiColor = (v) => {
  if (!v) return "#9CA3AF";
  if (v <= 50)  return "#16a34a";
  if (v <= 100) return "#ca8a04";
  if (v <= 150) return "#ea580c";
  if (v <= 200) return "#dc2626";
  return "#7c3aed";
};
const aqiLabel = (v) => {
  if (!v)       return "Unknown";
  if (v <= 50)  return "Good";
  if (v <= 100) return "Moderate";
  if (v <= 150) return "Unhealthy";
  if (v <= 200) return "Very Unhealthy";
  return "Severe";
};

/* ─── WMO weather code → label ─────────────────────────────── */
const weatherLabel = (code) => {
  if (code == null) return "—";
  if (code === 0)   return "☀️ Clear";
  if (code <= 3)    return "🌤 Partly Cloudy";
  if (code <= 48)   return "🌫 Foggy";
  if (code <= 67)   return "🌧 Rainy";
  if (code <= 77)   return "❄️ Snowy";
  if (code <= 82)   return "🌦 Showers";
  return "⛈ Thunderstorm";
};

/* ─── Fetch all POIs in ONE Overpass query ─────────────────── */
const fetchPOIs = async (midLat, midLon, radiusKm = 15) => {
  const r = Math.round(radiusKm * 1000);
  const query = `
[out:json][timeout:25];
(
  node["amenity"="hospital"](around:${r},${midLat},${midLon});
  node["amenity"="clinic"](around:${r},${midLat},${midLon});
  node["amenity"="police"](around:${r},${midLat},${midLon});
  node["amenity"="fuel"](around:${r},${midLat},${midLon});
  node["amenity"="pharmacy"](around:${r},${midLat},${midLon});
  node["amenity"="atm"](around:${r},${midLat},${midLon});
  node["amenity"="bank"]["atm"="yes"](around:${r},${midLat},${midLon});
  node["amenity"="restaurant"](around:${r},${midLat},${midLon});
  node["amenity"="fast_food"](around:${r},${midLat},${midLon});
  node["amenity"="food_court"](around:${r},${midLat},${midLon});
  node["shop"="car_repair"](around:${r},${midLat},${midLon});
  node["amenity"="car_repair"](around:${r},${midLat},${midLon});
  node["shop"="tyres"](around:${r},${midLat},${midLon});
  node["amenity"="charging_station"](around:${r},${midLat},${midLon});
  node["barrier"="toll_booth"](around:${r},${midLat},${midLon});
);
out body;`;
  const res = await axios.post(OVERPASS_URL, query, {
    headers: { "Content-Type": "text/plain" },
    timeout: 28000,
  });
  return res.data.elements || [];
};

/* ─── Fetch weather from Open-Meteo ────────────────────────── */
const fetchWeather = async (lat, lon) => {
  const res = await axios.get(
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,visibility` +
    `&timezone=auto`,
    { timeout: 8000 }
  );
  const c = res.data?.current;
  if (!c) return null;
  return {
    temp:       c.temperature_2m,
    humidity:   c.relative_humidity_2m,
    wind:       c.wind_speed_10m,
    code:       c.weather_code,
    visibility: c.visibility != null ? `${(c.visibility / 1000).toFixed(1)} km` : "—",
  };
};

/* ─── Classify and sort POIs ───────────────────────────────── */
const classify = (elements, midLat, midLon) => {
  const hospitals   = [];
  const police      = [];
  const ev          = [];
  const fuel        = [];
  const pharmacy    = [];
  const atm         = [];
  const restaurants = [];
  const garages     = [];
  const tolls       = [];

  elements.forEach((el) => {
    if (!el.lat || !el.lon) return;
    const dist = haversine(midLat, midLon, el.lat, el.lon);
    const name = el.tags?.name || el.tags?.["name:en"] || el.tags?.amenity || el.tags?.shop || "Unnamed";
    const item = { name, dist, lat: el.lat, lon: el.lon };
    const a = el.tags?.amenity;
    const s = el.tags?.shop;

    if (a === "hospital" || a === "clinic")         hospitals.push(item);
    else if (a === "police")                        police.push(item);
    else if (a === "charging_station")              ev.push(item);
    else if (a === "fuel")                          fuel.push(item);
    else if (a === "pharmacy")                      pharmacy.push(item);
    else if (a === "atm" || el.tags?.atm === "yes") atm.push(item);
    else if (a === "restaurant" || a === "fast_food" || a === "food_court") restaurants.push(item);
    else if (s === "car_repair" || a === "car_repair" || s === "tyres")     garages.push(item);
    else if (el.tags?.barrier === "toll_booth")     tolls.push(item);
  });

  const top5 = (arr) => arr.sort((a, b) => a.dist - b.dist).slice(0, 5);
  return {
    hospitals:   top5(hospitals),
    police:      top5(police),
    ev:          top5(ev),
    fuel:        top5(fuel),
    pharmacy:    top5(pharmacy),
    atm:         top5(atm),
    restaurants: top5(restaurants),
    garages:     top5(garages),
    tolls,
    counts: {
      hospitals:   hospitals.length,
      police:      police.length,
      ev:          ev.length,
      fuel:        fuel.length,
      pharmacy:    pharmacy.length,
      restaurants: restaurants.length,
      atm:         atm.length,
    },
  };
};

/* ─── Safety score derived from real data ──────────────────── */
const calcSafety = (pois, aqi) => {
  const policeScore    = Math.min(100, pois.police.length    * 20);
  const medicalScore   = Math.min(100, pois.hospitals.length * 20);
  const aqiScore       = aqi == null ? 50 : aqi <= 50 ? 100 : aqi <= 100 ? 80 : aqi <= 150 ? 55 : aqi <= 200 ? 30 : 10;
  const nightScore     = Math.min(100, (pois.police.length * 15) + (pois.hospitals.length * 10));
  const overall        = Math.round((policeScore + medicalScore + aqiScore + nightScore) / 4);
  return { overall, policeScore, medicalScore, aqiScore, nightScore };
};

/* ─── AI recommendation from real route data ───────────────── */
const buildRecommendation = (route, pois, weather, safety) => {
  const parts = [];
  const aqi = route.avgAQI;

  if (aqi <= 50)       parts.push("Air quality is excellent on this route — ideal conditions for travel.");
  else if (aqi <= 100) parts.push("Moderate air quality — no special precautions needed.");
  else if (aqi <= 150) parts.push("Elevated pollution detected. Consider wearing a mask.");
  else                 parts.push("High pollution alert. Keep windows closed and limit exposure.");

  if (pois.hospitals.length >= 3)  parts.push(`Good medical coverage with ${pois.hospitals.length} hospitals nearby.`);
  else if (pois.hospitals.length === 0) parts.push("No hospitals found near this route — carry a basic first-aid kit.");

  if (pois.police.length >= 2) parts.push("Strong police presence along the route.");
  else parts.push("Limited police stations detected — stay alert, especially at night.");

  if (pois.fuel.length === 0 && pois.ev.length === 0) parts.push("No fuel stations or EV chargers nearby — ensure a full tank/charge before starting.");
  else if (pois.ev.length > 0) parts.push(`${pois.ev.length} EV charging station${pois.ev.length > 1 ? "s" : ""} available en route.`);
  else parts.push(`${pois.fuel.length} fuel station${pois.fuel.length > 1 ? "s" : ""} along the way.`);

  if (weather) {
    if (weather.code >= 61 && weather.code <= 82) parts.push("Rain expected — drive carefully and allow extra travel time.");
    else if (weather.code >= 45 && weather.code <= 48) parts.push("Foggy conditions — reduce speed and use headlights.");
    else if (weather.temp > 38) parts.push("Extreme heat expected. Stay hydrated and check tyre pressure.");
  }

  if (pois.tolls.length > 0) parts.push(`${pois.tolls.length} toll booth${pois.tolls.length > 1 ? "s" : ""} on this route — keep change or a FASTag ready.`);

  return parts.join(" ");
};

/* ─── Small reusable UI pieces ─────────────────────────────── */
const SectionToggle = ({ icon: Icon, label, color, count, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/70 hover:bg-gray-100/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-gray-700 uppercase tracking-widest">{label}</span>
          {count != null && (
            <span className="text-[9px] font-black text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4 pt-2 bg-white">{children}</div>}
    </div>
  );
};

const POIList = ({ items, emptyMsg }) => {
  if (!items || items.length === 0)
    return <p className="text-[11px] text-gray-400 font-bold italic py-1">{emptyMsg}</p>;
  return (
    <ul className="space-y-2 mt-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-black text-gray-400 w-4 shrink-0">{i + 1}.</span>
            <span className="text-[11px] font-bold text-gray-700 truncate">{item.name}</span>
          </div>
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
            {fmtDist(item.dist)}
          </span>
        </li>
      ))}
    </ul>
  );
};

const ScoreBar = ({ label, value, color }) => (
  <div className="mb-2">
    <div className="flex justify-between items-center mb-1">
      <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-[10px] font-black" style={{ color }}>{value}/100</span>
    </div>
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

const EnvRow = ({ label, value, icon: Icon, iconColor }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
    <div className="flex items-center gap-2">
      <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
      <span className="text-[11px] font-bold text-gray-500">{label}</span>
    </div>
    <span className="text-[11px] font-black text-gray-800">{value ?? "—"}</span>
  </div>
);

const RoadRow = ({ label, value, good }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
    <span className="text-[11px] font-bold text-gray-500">{label}</span>
    <div className="flex items-center gap-1.5">
      {good != null && (
        good
          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          : <XCircle className="w-3.5 h-3.5 text-red-400" />
      )}
      <span className="text-[11px] font-black text-gray-800">{value}</span>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════
   MAIN EXPORT
════════════════════════════════════════════════════════════ */
const RouteInsights = ({ route, originCoords, destinationCoords }) => {
  const [expanded, setExpanded] = useState(false);
  const [status,   setStatus]   = useState("idle"); // idle | loading | done | error
  const [pois,     setPois]     = useState(null);
  const [weather,  setWeather]  = useState(null);
  const fetchedRef = useRef(false);

  /* ── Pick midpoint from pollutionSegments, falling back to coords ── */
  const midpoint = (() => {
    const segs = route?.pollutionSegments;
    if (segs?.length) {
      const mid = segs[Math.floor(segs.length / 2)];
      return { lat: mid.lat, lon: mid.lon };
    }
    if (originCoords && destinationCoords) {
      return {
        lat: (originCoords.lat + destinationCoords.lat) / 2,
        lon: (originCoords.lon + destinationCoords.lon) / 2,
      };
    }
    return null;
  })();

  /* ── Radius scaled to route distance ── */
  const distKm = parseFloat(route?.distance) || 100;
  const radiusKm = Math.min(50, Math.max(10, distKm * 0.15));

  /* ── Load data when panel is first opened ── */
  const load = useCallback(async () => {
    if (!midpoint) { setStatus("error"); return; }
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setStatus("loading");
    try {
      const [elements, wx] = await Promise.all([
        fetchPOIs(midpoint.lat, midpoint.lon, radiusKm),
        fetchWeather(
          destinationCoords?.lat ?? midpoint.lat,
          destinationCoords?.lon ?? midpoint.lon
        ),
      ]);
      setPois(classify(elements, midpoint.lat, midpoint.lon));
      setWeather(wx);
      setStatus("done");
    } catch (err) {
      console.error("RouteInsights fetch failed:", err);
      setStatus("error");
    }
  }, [midpoint?.lat, midpoint?.lon]);

  const handleToggle = () => {
    if (!expanded) load();
    setExpanded((e) => !e);
  };

  const handleRetry = () => {
    fetchedRef.current = false;
    load();
  };

  /* ── Derived values (only when data is ready) ── */
  const safety      = pois ? calcSafety(pois, route.avgAQI) : null;
  const aiRec       = pois ? buildRecommendation(route, pois, weather, safety) : null;

  /* ── Traffic level derived from segments AQI as a proxy ── */
  const avgAQI      = route?.avgAQI ?? null;
  const trafficLevel =
    avgAQI == null ? "Unknown"
    : avgAQI <= 60  ? "Light"
    : avgAQI <= 120 ? "Moderate"
    : "Heavy";
  const trafficColor =
    trafficLevel === "Light" ? "text-emerald-600"
    : trafficLevel === "Moderate" ? "text-amber-600"
    : "text-red-500";

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      {/* ── Toggle header ── */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-100 rounded-2xl hover:from-emerald-100 hover:to-blue-100 transition-all duration-200 group"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
            <Info className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-black text-gray-700 uppercase tracking-widest">Route Insights</span>
          {status === "loading" && <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />}
          {status === "done" && pois && (
            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              {pois.counts.hospitals + pois.counts.police + pois.counts.fuel + pois.counts.pharmacy + pois.counts.atm + pois.counts.restaurants} POIs
            </span>
          )}
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
          : <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />}
      </button>

      {/* ── Panel content ── */}
      {expanded && (
        <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">

          {/* Loading state */}
          {status === "loading" && (
            <div className="flex items-center justify-center gap-3 py-8 bg-gray-50 rounded-2xl border border-gray-100">
              <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Fetching route data…</span>
            </div>
          )}

          {/* Error state */}
          {status === "error" && (
            <div className="flex flex-col items-center gap-3 py-6 bg-red-50 rounded-2xl border border-red-100">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <p className="text-xs font-black text-red-500">Could not load route insights.</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 rounded-xl text-xs font-black text-red-500 hover:bg-red-50 transition"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          {/* ── DATA READY ── */}
          {status === "done" && pois && (
            <>
              {/* 13. Route Statistics summary strip */}
              <div className="grid grid-cols-4 gap-1.5 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                {[
                  { emoji: "🏥", label: "Hospitals",  count: pois.counts.hospitals   },
                  { emoji: "🚔", label: "Police",     count: pois.counts.police      },
                  { emoji: "⚡", label: "EV",          count: pois.counts.ev          },
                  { emoji: "⛽", label: "Fuel",        count: pois.counts.fuel        },
                  { emoji: "💊", label: "Pharmacy",   count: pois.counts.pharmacy    },
                  { emoji: "🍽️", label: "Food",        count: pois.counts.restaurants },
                  { emoji: "🏧", label: "ATMs",        count: pois.counts.atm         },
                  { emoji: "🔧", label: "Garages",    count: pois.garages.length      },
                ].map(({ emoji, label, count }) => (
                  <div key={label} className="flex flex-col items-center justify-center bg-white rounded-xl p-2 border border-gray-100 text-center">
                    <span className="text-base leading-none mb-1">{emoji}</span>
                    <span className="text-xs font-black text-gray-900">{count}</span>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider leading-none mt-0.5">{label}</span>
                  </div>
                ))}
              </div>

              {/* 12. AI Recommendation */}
              {aiRec && (
                <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-100 rounded-2xl">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Star className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">AI Recommendation</span>
                  </div>
                  <p className="text-[11px] text-gray-700 font-medium leading-relaxed">{aiRec}</p>
                </div>
              )}

              {/* 9. Route Safety Summary */}
              {safety && (
                <SectionToggle icon={ShieldCheck} label="Safety Summary" color="bg-emerald-100 text-emerald-600" count={safety.overall + "/100"}>
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="text-2xl font-black"
                        style={{ color: safety.overall >= 70 ? "#16a34a" : safety.overall >= 40 ? "#ca8a04" : "#dc2626" }}
                      >
                        {safety.overall}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Overall Safety Score</p>
                        <p className="text-[10px] font-bold text-gray-600">
                          {safety.overall >= 70 ? "Safe Route" : safety.overall >= 40 ? "Moderate Caution" : "Exercise Caution"}
                        </p>
                      </div>
                    </div>
                    <ScoreBar label="Police Coverage"       value={safety.policeScore}  color="#3b82f6" />
                    <ScoreBar label="Medical Accessibility" value={safety.medicalScore} color="#10b981" />
                    <ScoreBar label="AQI Rating"            value={safety.aqiScore}     color={aqiColor(avgAQI)} />
                    <ScoreBar label="Night Safety"          value={safety.nightScore}   color="#8b5cf6" />
                  </div>
                </SectionToggle>
              )}

              {/* 10. Environmental Information */}
              <SectionToggle icon={CloudSun} label="Environment" color="bg-sky-100 text-sky-600">
                <div className="mt-1">
                  <EnvRow label="AQI" value={`${avgAQI ?? "—"} — ${aqiLabel(avgAQI)}`} icon={Wind} iconColor={`text-[${aqiColor(avgAQI)}]`} />
                  {weather && <>
                    <EnvRow label="Temperature"   value={`${weather.temp}°C`}          icon={Thermometer}  iconColor="text-orange-400" />
                    <EnvRow label="Weather"        value={weatherLabel(weather.code)}   icon={CloudSun}     iconColor="text-sky-400"    />
                    <EnvRow label="Humidity"       value={`${weather.humidity}%`}       icon={Droplets}     iconColor="text-blue-400"   />
                    <EnvRow label="Wind Speed"     value={`${weather.wind} km/h`}       icon={Wind}         iconColor="text-gray-400"   />
                    <EnvRow label="Visibility"     value={weather.visibility}           icon={Eye}          iconColor="text-indigo-400" />
                  </>}
                  {!weather && <p className="text-[11px] text-gray-400 italic py-1">Weather data unavailable.</p>}
                </div>
              </SectionToggle>

              {/* 11. Road Information */}
              <SectionToggle icon={TrendingUp} label="Road Info" color="bg-orange-100 text-orange-600">
                <div className="mt-1">
                  <RoadRow label="Traffic Level"       value={<span className={`font-black text-[11px] ${trafficColor}`}>{trafficLevel}</span>} />
                  <RoadRow label="Toll Roads"          value={pois.tolls.length > 0 ? `${pois.tolls.length} toll booth${pois.tolls.length > 1 ? "s" : ""}` : "None detected"} good={pois.tolls.length === 0} />
                  <RoadRow label="Road Closures"       value="No data available" />
                  <RoadRow label="Accident-prone Areas" value={avgAQI > 150 ? "High-risk zone (high AQI)" : "No known hotspots"} good={avgAQI == null || avgAQI <= 150} />
                </div>
              </SectionToggle>

              {/* 1. Hospitals */}
              <SectionToggle icon={Hospital} label="Hospitals" color="bg-red-100 text-red-600" count={pois.counts.hospitals}>
                <POIList items={pois.hospitals} emptyMsg="No hospitals found within range." />
              </SectionToggle>

              {/* 2. Police Stations */}
              <SectionToggle icon={ShieldCheck} label="Police Stations" color="bg-blue-100 text-blue-600" count={pois.counts.police}>
                <POIList items={pois.police} emptyMsg="No police stations found within range." />
              </SectionToggle>

              {/* 3. EV Charging Stations */}
              <SectionToggle icon={Zap} label="EV Charging" color="bg-emerald-100 text-emerald-600" count={pois.counts.ev}>
                <POIList items={pois.ev} emptyMsg="No EV charging stations found within range." />
              </SectionToggle>

              {/* 4. Petrol Pumps */}
              <SectionToggle icon={Fuel} label="Petrol Pumps" color="bg-yellow-100 text-yellow-700" count={pois.counts.fuel}>
                <POIList items={pois.fuel} emptyMsg="No petrol pumps found within range." />
              </SectionToggle>

              {/* 5. Pharmacies */}
              <SectionToggle icon={Pill} label="Pharmacies" color="bg-pink-100 text-pink-600" count={pois.counts.pharmacy}>
                <POIList items={pois.pharmacy} emptyMsg="No pharmacies found within range." />
              </SectionToggle>

              {/* 6. ATMs */}
              <SectionToggle icon={Landmark} label="ATMs" color="bg-violet-100 text-violet-600" count={pois.counts.atm}>
                <POIList items={pois.atm} emptyMsg="No ATMs found within range." />
              </SectionToggle>

              {/* 7. Restaurants */}
              <SectionToggle icon={UtensilsCrossed} label="Restaurants / Food" color="bg-amber-100 text-amber-700" count={pois.counts.restaurants}>
                <POIList items={pois.restaurants} emptyMsg="No restaurants found within range." />
              </SectionToggle>

              {/* 8. Repair Garages */}
              <SectionToggle icon={Wrench} label="Repair Garages" color="bg-gray-200 text-gray-600" count={pois.garages.length}>
                <POIList items={pois.garages} emptyMsg="No repair garages found within range." />
              </SectionToggle>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RouteInsights;
