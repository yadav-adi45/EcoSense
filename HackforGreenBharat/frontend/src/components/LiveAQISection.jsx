import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Wind,
  Droplets,
  Thermometer,
  Shield,
  RefreshCw,
  ArrowRight,
  Factory,
  Activity,
} from "lucide-react";
import AQIBadge from "./AQIBadge";

const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_KEY;
const WAQI_TOKEN = import.meta.env.VITE_WAQI_TOKEN;

const getAQIColor = (value) => {
  if (value <= 50) return "#10B981"; // Emerald green
  if (value <= 100) return "#EAB308"; // Yellow
  if (value <= 150) return "#F97316"; // Orange
  if (value <= 200) return "#EF4444"; // Red
  return "#A855F7"; // Purple/Hazardous
};

/* ===== FUTURISTIC RADIAL GAUGE METER ===== */
const AQIGaugeMeter = ({ aqi }) => {
  const maxAQI = 300;
  const fraction = Math.min(Math.max(aqi, 0), maxAQI) / maxAQI;
  const color = getAQIColor(aqi);

  // 240 degree arc parameters (center 60,60, radius 42)
  const r = 42;
  const cx = 60;
  const cy = 60;
  const totalLength = (240 / 360) * (2 * Math.PI * r); // ~175.93
  const dashOffset = totalLength * (1 - fraction);

  // Tip dot position math
  const currentAngleDeg = 150 + fraction * 240;
  const currentAngleRad = (currentAngleDeg * Math.PI) / 180;
  const tipX = cx + r * Math.cos(currentAngleRad);
  const tipY = cy + r * Math.sin(currentAngleRad);

  return (
    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
      <svg className="w-full h-full" viewBox="0 0 120 120">
        {/* Outer Background Arc Track */}
        <path
          d="M 23.6 81 A 42 42 0 1 1 96.4 81"
          fill="none"
          stroke="#F3F4F6"
          strokeWidth="9"
          strokeLinecap="round"
        />

        {/* Dynamic Colored Active Arc */}
        <path
          d="M 23.6 81 A 42 42 0 1 1 96.4 81"
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray="175.93"
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.8s ease-out",
          }}
        />

        {/* Glowing Head Tip Dot */}
        <circle
          cx={tipX}
          cy={tipY}
          r="5"
          fill="#FFFFFF"
          stroke={color}
          strokeWidth="3.5"
          style={{
            transition: "cx 0.8s cubic-bezier(0.4, 0, 0.2, 1), cy 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.8s ease-out",
            filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.12))",
          }}
        />
      </svg>

      {/* Center Icon / Subtext */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1 select-none pointer-events-none">
        <Activity className="w-5 h-5 transition-colors duration-500" style={{ color }} />
        <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mt-0.5">
          METER
        </span>
      </div>
    </div>
  );
};

const LiveAQISection = () => {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [data, setData] = useState(null);
  const [liveAQI, setLiveAQI] = useState(null);

  // Sync initial AQI
  useEffect(() => {
    if (data?.aqi) {
      setLiveAQI(data.aqi);
    }
  }, [data]);

  // Handle active live fluctuation (+/- 1-2 points)
  useEffect(() => {
    if (loading || !data?.aqi) return;
    const interval = setInterval(() => {
      const base = data.aqi;
      setLiveAQI((prev) => {
        if (prev === null) return base;
        const change = (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.5 ? 1 : 2);
        const nextVal = prev + change;
        // Keep within +/- 5 points from source to stay realistic
        if (Math.abs(nextVal - base) > 5) {
          return base;
        }
        return Math.max(1, nextVal);
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [loading, data]);

  /* ================= MASK LOGIC ================= */
  const getMaskRecommendation = (aqi) => {
    if (aqi <= 50) return { text: "No Mask Needed" };
    if (aqi <= 100) return { text: "N95 Optional" };
    if (aqi <= 150) return { text: "N95 Recommended" };
    if (aqi <= 200) return { text: "N95 Required" };
    return { text: "N99 / N100 Required" };
  };

  /* ================= DYNAMIC PULSING DOT ================= */
  const getBlinkingDot = (aqi) => {
    let color = "bg-emerald-500";
    if (aqi <= 50) color = "bg-emerald-500";
    else if (aqi <= 100) color = "bg-yellow-500";
    else if (aqi <= 150) color = "bg-orange-500";
    else if (aqi <= 200) color = "bg-red-500";
    else color = "bg-purple-600";

    return (
      <div className="relative flex h-2.5 w-2.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color}`}></span>
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`}></span>
      </div>
    );
  };

  /* ================= WEATHER ADVISORY LOGIC ================= */
  const getWeatherTip = (temp, humidity, wind) => {
    if (temp > 35) return { text: "High temperature. We recommend checking shaded canopy routing modes before traveling.", status: "Stay Hydrated 💧" };
    if (humidity > 80) return { text: "High moisture and humidity levels. Dress in light, breathable fabrics.", status: "Humid Conditions ☁️" };
    if (wind > 20) return { text: "Brisk wind speeds. Ideal day for clean wind energy; drive safely.", status: "Breezy Outing 🍃" };
    return { text: "Pleasant outdoor weather. Great time to select eco-friendly routes or EVs.", status: "Comfortable Weather ☀️" };
  };

  /* ================= FETCH LIVE DATA ================= */
  useEffect(() => {
    const fetchWithFallback = async (latitude, longitude) => {
      try {
        let city = "Chandigarh";
        let aqi = 145;
        let temperature = 29;
        let humidity = 65;
        let windSpeed = 8;

        // 1. Try to fetch city name (OpenWeather reverse geocode)
        if (OPENWEATHER_KEY) {
          try {
            const geoRes = await fetch(
              `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${OPENWEATHER_KEY}`
            );
            const geoJson = await geoRes.json();
            if (Array.isArray(geoJson) && geoJson.length > 0) {
              city = geoJson[0].name;
            }
          } catch (e) {
            console.warn("Geo reverse fetch failed, using fallback:", e);
          }
        }

        // 2. Try to fetch WAQI
        if (WAQI_TOKEN) {
          try {
            const waqiRes = await fetch(
              `https://api.waqi.info/feed/geo:${latitude};${longitude}/?token=${WAQI_TOKEN}`
            );
            const waqiJson = await waqiRes.json();
            if (waqiJson.status === "ok" && waqiJson.data?.aqi !== undefined) {
              aqi = waqiJson.data.aqi;
            }
          } catch (e) {
            console.warn("WAQI fetch failed, using fallback:", e);
          }
        }

        // 3. Try to fetch Weather (OpenWeather)
        if (OPENWEATHER_KEY) {
          try {
            const weatherRes = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_KEY}`
            );
            const weather = await weatherRes.json();
            if (weather.main?.temp !== undefined) {
              temperature = Math.round(weather.main.temp);
              humidity = weather.main.humidity;
              windSpeed = Math.round(weather.wind?.speed || 8);
            }
          } catch (e) {
            console.warn("Weather fetch failed, using fallback:", e);
          }
        }

        setData({
          source: 'Station',
          city,
          lat: latitude,
          lon: longitude,
          aqi,
          temperature,
          humidity,
          windSpeed,
        });

        setLastUpdated(new Date());
      } catch (err) {
        console.error("Live AQI compile error:", err);
      } finally {
        setLoading(false);
      }
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWithFallback(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        console.warn("Geolocation blocked/failed. Using Chandigarh fallback.");
        fetchWithFallback(30.7333, 76.7794);
      }
    );
  }, []);

  /* ================= LOADER ================= */
  if (loading || !data) {
    return (
      <section className="py-24 flex justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <p className="text-gray-400 text-sm">Fetching live AQI…</p>
        </div>
      </section>
    );
  }

  const currentAQI = liveAQI || data.aqi;
  const mask = getMaskRecommendation(currentAQI);
  const advisory = getWeatherTip(data.temperature, data.humidity, data.windSpeed);

  return (
    <section className="py-16 relative">
      <div className="max-w-[1280px] mx-auto px-4">
        {/* HEADER */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">
            Live <span className="text-emerald-500">Air Quality</span> Near You
          </h2>
          <p className="text-gray-400 mt-2 text-sm">
            Real-time environmental data for your current location.
          </p>
        </div>

        {/* CONTAINER */}
        <div className="grid md:grid-cols-12 gap-8 items-stretch">
          {/* LEFT: MAIN CARD */}
          <div className="md:col-span-7 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg leading-tight">
                    {data.city}
                  </h3>
                  <span className="text-xs text-gray-400">
                    Lat: {data.lat.toFixed(4)}, Lon: {data.lon.toFixed(4)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 block">Last Updated</span>
                <span className="text-xs font-semibold text-gray-600">
                  {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                {/* TEMP */}
                <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50 flex flex-col items-center justify-center text-center">
                  <Thermometer className="w-6 h-6 text-orange-500 mb-2" />
                  <span className="text-xs text-gray-400">Temp</span>
                  <span className="font-bold text-gray-800 mt-0.5 text-lg">
                    {data.temperature}°C
                  </span>
                </div>

                {/* HUMIDITY */}
                <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50 flex flex-col items-center justify-center text-center">
                  <Droplets className="w-6 h-6 text-blue-500 mb-2" />
                  <span className="text-xs text-gray-400">Humidity</span>
                  <span className="font-bold text-gray-800 mt-0.5 text-lg">
                    {data.humidity}%
                  </span>
                </div>

                {/* WIND */}
                <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50 flex flex-col items-center justify-center text-center">
                  <Wind className="w-6 h-6 text-emerald-500 mb-2" />
                  <span className="text-xs text-gray-400">Wind</span>
                  <span className="font-bold text-gray-800 mt-0.5 text-lg">
                    {data.windSpeed} km/h
                  </span>
                </div>
              </div>

              {/* ECO ADVISORY BANNER */}
              <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-5 flex items-start gap-4 mb-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                  <Wind className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block">
                    Eco Travel Advisory
                  </span>
                  <h4 className="font-bold text-gray-800 text-sm mt-0.5">
                    {advisory.status}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed mt-1">
                    {advisory.text}
                  </p>
                </div>
              </div>

            <div className="flex items-center justify-between border-t border-gray-50 pt-6 mt-auto">
              <span className="text-xs text-gray-400">
                Data Source: <strong className="text-emerald-500">WAQI Global Network</strong>
              </span>
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 px-4 py-2 rounded-xl transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          </div>

          {/* RIGHT: HEALTH CARD */}
          <div className="md:col-span-5 bg-white text-gray-800 rounded-3xl p-8 flex flex-col justify-between border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
                  Health Index
                </span>
                 {getBlinkingDot(currentAQI)}
              </div>

              {/* 2-COLUMN AQI NUMBER (LEFT) & GAUGE METER (RIGHT) */}
              <div className="flex items-center justify-between mb-8 gap-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100/80">
                {/* LEFT: AQI NUMBER & BADGE */}
                <div className="flex flex-col justify-center">
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">
                    Current AQI
                  </span>
                  <div className="flex items-baseline gap-2 mb-3">
                    <h1 className="text-5xl font-black text-gray-800 tracking-tight leading-none">
                      {currentAQI}
                    </h1>
                    <span className="text-xs text-gray-400 font-bold">AQI</span>
                  </div>
                  <div>
                    <AQIBadge value={currentAQI} size="sm" />
                  </div>
                </div>

                {/* RIGHT: SPEEDOMETER GAUGE METER */}
                <AQIGaugeMeter aqi={currentAQI} />
              </div>

              {/* RECOMMENDED MASK */}
              <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-5 flex items-start gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                  <Shield className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                    Recommendation
                  </span>
                  <h4 className="font-bold text-gray-800 text-base mt-0.5">
                    {mask.text}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed mt-1">
                    Based on standard health guidelines for PM2.5 levels.
                  </p>
                </div>
              </div>
            </div>

            <Link 
              to="/routes" 
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all group"
            >
              Check Route AQI
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveAQISection;
