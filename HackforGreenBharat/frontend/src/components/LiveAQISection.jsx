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
} from "lucide-react";
import AQIBadge from "./AQIBadge";

const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_KEY;
const WAQI_TOKEN = import.meta.env.VITE_WAQI_TOKEN;

const LiveAQISection = () => {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [data, setData] = useState(null);

  /* ================= MASK LOGIC ================= */
  const getMaskRecommendation = (aqi) => {
    if (aqi <= 50) return { text: "No Mask Needed", icon: "😊" };
    if (aqi <= 100) return { text: "N95 Optional", icon: "😐" };
    if (aqi <= 150) return { text: "N95 Recommended", icon: "😷" };
    if (aqi <= 200) return { text: "N95 Required", icon: "😷" };
    return { text: "N99 / N100 Required", icon: "🤢" };
  };

  /* ================= FETCH LIVE DATA ================= */
  useEffect(() => {
    // 1. Initial Real Data Fetch
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;

          const geoRes = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${OPENWEATHER_KEY}`
          );
          const geoJson = await geoRes.json();
          const city = Array.isArray(geoJson) && geoJson.length > 0 ? geoJson[0].name : "Unknown";

          const waqiRes = await fetch(
            `https://api.waqi.info/feed/geo:${latitude};${longitude}/?token=${WAQI_TOKEN}`
          );
          const waqiJson = await waqiRes.json();
          const aqi = waqiJson.status === "ok" && waqiJson.data?.aqi ? waqiJson.data.aqi : 150;

          const weatherRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_KEY}`
          );
          const weather = await weatherRes.json();

          setData({
            source: 'Station',
            city,
            lat: latitude,
            lon: longitude,
            aqi,
            temperature: Math.round(weather.main.temp),
            humidity: weather.main.humidity,
            windSpeed: Math.round(weather.wind.speed),
          });

          setLastUpdated(new Date());
        } catch (err) {
          console.error("Live AQI error:", err);
        } finally {
          setLoading(false);
        }
      },
      () => setLoading(false)
    );

    return () => {};
  }, []);

  /* ================= LOADER ================= */
  if (loading || !data) {
    return (
      <section className="py-24 flex justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-4 border-green-500/20 border-t-green-500 animate-spin" />
          <p className="text-gray-400 text-sm">Fetching live AQI…</p>
        </div>
      </section>
    );
  }

  const mask = getMaskRecommendation(data.aqi);

  return (
    <section className="py-16 relative">
      <div className="max-w-[1280px] mx-auto px-4">
        {/* HEADER */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">
            Current Air Quality In{" "}
            <span className="text-emerald-500 font-bold">
              {data.city}
            </span>
          </h2>

          <div className="mt-3 flex justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {data.lat.toFixed(4)}, {data.lon.toFixed(4)}
            </span>
            <span className="flex items-center gap-1">
              <RefreshCw size={14} /> {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 mb-8">
          {/* AQI */}
          <div className="p-8 bg-[#e8f5e9] border border-emerald-200 rounded-2xl text-center shadow-md">
            <p className="text-xs uppercase text-gray-500 tracking-widest mb-3">
              Air Quality Index
            </p>
            <p className="text-6xl font-bold text-emerald-600 mb-3">
              {data.aqi}
            </p>
            <AQIBadge value={data.aqi} size="lg" />
          </div>

          {/* MASK */}
          <div className="p-8 bg-[#e8f5e9] border border-emerald-200 rounded-2xl shadow-md">
            <p className="text-xs uppercase text-gray-500 tracking-widest mb-4">
              Mask Recommendation
            </p>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-emerald-100 flex items-center justify-center text-4xl">
                {mask.icon}
              </div>
              <div>
                <p className="text-xl font-semibold text-emerald-700">
                  {mask.text}
                </p>
                <p className="text-sm text-gray-500">Based on AQI</p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 bg-emerald-100 border border-emerald-300 px-4 py-3 rounded-xl">
              <Shield size={16} className="text-emerald-600" />
              <span className="text-sm text-gray-600">
                Outdoor activities: Avoid
              </span>
            </div>
          </div>

          {/* WEATHER */}
          <div className="p-8 bg-[#e8f5e9] border border-emerald-200 rounded-2xl shadow-md">
            <Stat icon={<Thermometer />} label="Temperature" value={`${data.temperature}°C`} />
            <Stat icon={<Droplets />} label="Humidity" value={`${data.humidity}%`} />
            <Stat icon={<Wind />} label="Wind Speed" value={`${data.windSpeed} km/h`} />
          </div>
        </div>

        {/* POLLUTION LINK */}
        <Link to="/pollution" className="block">
          <div className="flex items-center justify-between p-5 rounded-2xl border border-red-300/40 bg-red-50 hover:bg-red-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-4">
              <Factory className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="text-base font-semibold text-red-500">
                  View Pollution Sources &amp; Solutions
                </h3>
                <p className="text-sm text-gray-500">
                  Learn what causes pollution and how to reduce it
                </p>
              </div>
            </div>
            <ArrowRight className="text-red-400" />
          </div>
        </Link>
      </div>
    </section>
  );
};

/* SMALL STAT */
const Stat = ({ icon, label, value }) => (
  <div className="flex justify-between items-center mb-5 last:mb-0">
    <div className="flex items-center gap-3 text-gray-600">
      {icon}
      <span>{label}</span>
    </div>
    <span className="font-bold text-gray-800">{value}</span>
  </div>
);

export default LiveAQISection;
