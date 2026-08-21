import { useEffect, useState, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/pages/Footer";
import { AuthContext } from "./context/context";
import { serverUrl } from "@/main";
import { getAuthHeaders } from "@/utils/auth";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  Wind,
  Droplets,
  Thermometer,
  Shield,
  RefreshCw,
  Activity,
  AlertTriangle,
  Heart,
  ChevronRight,
  ShieldCheck,
  Brain,
  Award,
  Navigation,
  ExternalLink,
  Plus,
  Eye,
  Crosshair
} from "lucide-react";

import { fetchNearbyServices, haversine } from "@/services/nearbyServices";

// Recenter Leaflet Map Helper
const RecenterMap = ({ position, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, zoom || map.getZoom(), { animate: true, duration: 0.8 });
    }
  }, [position, map, zoom]);
  return null;
};

// Custom Pins for Leaflet
const userIcon = L.divIcon({
  className: "custom-user-pin",
  html: `
    <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
      <div class="animate-ping" style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(16, 185, 129, 0.4);"></div>
      <div style="position: absolute; width: 20px; height: 20px; border-radius: 50%; background: rgba(16, 185, 129, 0.2); border: 2px solid #10b981;"></div>
      <div style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; border: 1.5px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.3);"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const hospitalIcon = L.divIcon({
  className: "custom-hospital-marker",
  html: `<div style="background-color: #ef4444; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.35); font-size: 14px; font-weight: bold; cursor: pointer;">🏥</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const policeIcon = L.divIcon({
  className: "custom-police-marker",
  html: `<div style="background-color: #3b82f6; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.35); font-size: 14px; font-weight: bold; cursor: pointer;">🛡️</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const DEFAULT_ASSESSMENT = {
  score: 642,
  level: "Moderate Pollution Impact",
  aiExplanation: "Your current lifestyle shows a moderate ecological footprint and air pollution impact. Swapping out older appliances, selecting low-pollution routes, and using public transit or EVs can easily boost your overall score.",
};

const calculateScoreAndRisk = (aqiVal, tempVal, weatherVal) => {
  let score = 100;
  
  // AQI deducts score
  if (aqiVal <= 50) {
    score -= (aqiVal / 50) * 8;
  } else if (aqiVal <= 100) {
    score -= 8 + ((aqiVal - 50) / 50) * 15;
  } else if (aqiVal <= 150) {
    score -= 23 + ((aqiVal - 100) / 50) * 20;
  } else {
    score -= 43 + ((aqiVal - 150) / 350) * 45;
  }
  
  // Temperature deducts score
  if (tempVal > 35 || tempVal < 10) {
    score -= 6;
  }
  
  // Weather deducts score
  const weatherLower = weatherVal ? weatherVal.toLowerCase() : "";
  if (weatherLower.includes("rain") || weatherLower.includes("drizzle") || weatherLower.includes("shower")) {
    score -= 8;
  } else if (weatherLower.includes("thunderstorm") || weatherLower.includes("storm")) {
    score -= 12;
  } else if (weatherLower.includes("haze") || weatherLower.includes("mist") || weatherLower.includes("fog")) {
    score -= 4;
  }
  
  score = Math.max(10, Math.min(100, Math.round(score)));
  
  let level = "GOOD";
  let risk = "Low";
  let advice = "Air quality is good. This is a suitable time for outdoor travel.";
  let alert = null;
  
  if (score < 50) {
    level = "POOR";
    risk = "High";
    advice = "High pollution or poor conditions detected. EcoSense recommends choosing safe, low-pollution routes and limiting exposure.";
    alert = { priority: "High", title: "Severe Environment Alert", text: "Poor conditions and high particulate levels. Limit outdoor exposure." };
  } else if (score < 75) {
    level = "MODERATE";
    risk = "Moderate";
    advice = "Air quality is moderate. Consider checking a low-pollution route before travelling to minimize particulate exposure.";
    alert = { priority: "Moderate", title: "Moderate Air Haze", text: "Air quality has increased. Consider choosing clean pathways." };
  } else {
    level = "GOOD";
    risk = "Low";
    advice = "Ecosystem metrics are healthy. Ideal day for choosing active mobility or carbon-neutral options!";
  }
  
  // Specific weather alerts
  if (weatherLower.includes("rain") || weatherLower.includes("storm") || weatherLower.includes("drizzle")) {
    alert = { priority: "Moderate", title: "Weather Alert", text: "Rain expected. Road conditions and visibility may be affected." };
  }
  
  return { score, level, risk, advice, alert };
};

const ServiceSkeleton = () => (
  <div className="animate-pulse space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
        <div className="flex items-center gap-3 w-full min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-150 rounded w-1/2" />
          </div>
        </div>
        <div className="w-14 h-8 bg-gray-200 rounded-lg shrink-0 ml-2" />
      </div>
    ))}
  </div>
);

const Dasboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  
  // Geolocation & Live API States
  const [coords, setCoords] = useState({ lat: 30.7333, lon: 76.7794 }); // Chandigarh default
  const [locationName, setLocationName] = useState("Chandigarh");
  const [locationDenied, setLocationDenied] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [aqi, setAqi] = useState(112);
  const [temp, setTemp] = useState(26);
  const [weather, setWeather] = useState("Partly Cloudy");
  const [humidity, setHumidity] = useState(65);
  const [windSpeed, setWindSpeed] = useState(8);

  // Safety facilities
  const [hospitals, setHospitals] = useState([]);
  const [police, setPolice] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [viewAllHospitals, setViewAllHospitals] = useState(false);
  const [viewAllPolice, setViewAllPolice] = useState(false);
  
  // Map toggles
  const [showPollution, setShowPollution] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showPolice, setShowPolice] = useState(true);

  // Route statistics from history
  const [impactStats, setImpactStats] = useState(null);

  // Load latest habits assessment
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch(`${serverUrl}/api/v4/eco/latest`, {
          credentials: "include",
          headers: { ...getAuthHeaders() },
        });
        const data = await res.json();
        if (data && data.success && data.assessment) {
          setAssessment(data.assessment);
        } else {
          setAssessment(DEFAULT_ASSESSMENT);
        }
      } catch (err) {
        console.warn("Using default habits assessment fallback:", err);
        setAssessment(DEFAULT_ASSESSMENT);
      }
    };
    fetchLatest();
  }, []);

  // Sync Geolocation and fetch live data
  const handleGetLocation = () => {
    setLoadingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCoords({ lat, lon });
        setLocationDenied(false);
        fetchLiveEnvironment(lat, lon);
      },
      (err) => {
        console.warn("Geolocation blocked/failed. Using Chandigarh fallback.", err);
        setLocationDenied(true);
        setCoords({ lat: 30.7333, lon: 76.7794 });
        fetchLiveEnvironment(30.7333, 76.7794);
      }
    );
  };

  useEffect(() => {
    handleGetLocation();
  }, []);

  // Fetch AQI, Weather, and Overpass safety facilities
  const fetchLiveEnvironment = async (lat, lon) => {
    const WAQI_TOKEN = import.meta.env.VITE_WAQI_TOKEN || "c735ac3261f6c1abf9c208ee0c19622025abe1b7";
    const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_KEY;

    let cName = "Chandigarh";
    let aqiVal = 112;
    let tempVal = 26;
    let weatherVal = "Partly Cloudy";
    let humidVal = 65;
    let windVal = 8;

    // 1. Try OpenWeather Reverse Geocoding
    if (OPENWEATHER_KEY) {
      try {
        const geoRes = await fetch(
          `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_KEY}`
        );
        const geoJson = await geoRes.json();
        if (Array.isArray(geoJson) && geoJson.length > 0) {
          cName = geoJson[0].name;
        }
      } catch (e) {
        console.warn("Reverse geo failed:", e);
      }

      // 2. Try OpenWeather Current Weather
      try {
        const weatherRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_KEY}`
        );
        const wData = await weatherRes.json();
        if (wData.main) {
          tempVal = Math.round(wData.main.temp);
          humidVal = wData.main.humidity;
          windVal = Math.round(wData.wind?.speed || 8);
          if (wData.weather?.[0]) {
            weatherVal = wData.weather[0].main;
          }
        }
      } catch (e) {
        console.warn("Weather fetch failed:", e);
      }
    }

    // 3. Try WAQI feed
    try {
      const waqiRes = await fetch(
        `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_TOKEN}`
      );
      const waqiJson = await waqiRes.json();
      if (waqiJson.status === "ok" && waqiJson.data?.aqi !== undefined) {
        aqiVal = waqiJson.data.aqi;
        if (waqiJson.data.city?.name && !OPENWEATHER_KEY) {
          cName = waqiJson.data.city.name.split(",")[0];
        }
      }
    } catch (e) {
      console.warn("WAQI fetch failed:", e);
    }

    setLocationName(cName);
    setAqi(aqiVal);
    setTemp(tempVal);
    setWeather(weatherVal);
    setHumidity(humidVal);
    setWindSpeed(windVal);
    setLastUpdated(new Date());

    // 4. Fetch Emergency Services
    setLoadingServices(true);
    try {
      const { hospitals: hospArr, police: polArr } = await fetchNearbyServices(lat, lon, 8000);
      setHospitals(hospArr);
      setPolice(polArr);
    } catch (err) {
      console.warn("Overpass query failed:", err);
      setHospitals([]);
      setPolice([]);
    } finally {
      setLoadingServices(false);
      setLoadingGeo(false);
    }
  };

  // Load Route Travel History from Local Storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ecosense_route_history");
      if (raw) {
        const history = JSON.parse(raw);
        if (history && history.length > 0) {
          const totalRoutes = history.length;
          const ecoRoutes = history.filter((h) => h.isEco).length;

          let totalDist = 0;
          history.forEach((h) => {
            const num = parseFloat(h.distance);
            if (!isNaN(num)) {
              totalDist += num;
            }
          });

          let totalPollutionReduced = 0;
          let countEco = 0;
          history.forEach((h) => {
            if (h.isEco) {
              totalPollutionReduced += h.pollutionReduced || 22;
              countEco++;
            }
          });
          const avgReduced = countEco > 0 ? Math.round(totalPollutionReduced / totalRoutes) : 0;

          setImpactStats({
            routesExplored: totalRoutes,
            distance: totalDist.toFixed(1) + " km",
            ecoFriendly: ecoRoutes,
            pollutionReduced: avgReduced > 0 ? avgReduced + "%" : "22%",
          });
        }
      }
    } catch (e) {
      console.warn("Failed to load route history stats:", e);
    }
  }, []);

  // Reset or seed route history for demonstration/mock purpose
  const handleSeedHistory = () => {
    const demoHistory = [
      { id: "d1", date: new Date().toISOString(), origin: "Metro Sector 15", destination: "Central Office Park", distance: "8.4 km", duration: "18 min", avgAQI: 85, isEco: true, pollutionReduced: 25 },
      { id: "d2", date: new Date().toISOString(), origin: "St. John Square", destination: "Valley Mall", distance: "12.2 km", duration: "25 min", avgAQI: 124, isEco: false, pollutionReduced: 0 },
      { id: "d3", date: new Date().toISOString(), origin: "City Heights", destination: "Green Park Community", distance: "5.1 km", duration: "11 min", avgAQI: 42, isEco: true, pollutionReduced: 30 },
    ];
    localStorage.setItem("ecosense_route_history", JSON.stringify(demoHistory));
    window.location.reload();
  };

  // Calculate Environmental Intelligence parameters
  const scoreMeta = calculateScoreAndRisk(aqi, temp, weather);

  // Dynamic pollution zones for map
  const pollutionZones = [
    { name: "Clean Air Park Zone", level: "low", aqi: 35, lat: coords.lat + 0.005, lon: coords.lon - 0.007, radius: 450 },
    { name: "City Traffic Center Haze", level: "moderate", aqi: 112, lat: coords.lat - 0.004, lon: coords.lon + 0.006, radius: 550 },
    { name: "Industrial Corridor Hotspot", level: "high", aqi: 220, lat: coords.lat + 0.011, lon: coords.lon + 0.013, radius: 700 },
  ];

  // Helper for safety services navigation
  const handleViewSafetyOnMap = () => {
    navigate("/navigation", {
      state: {
        originCoords: { lat: coords.lat, lon: coords.lon },
        navigationMode: "live"
      }
    });
  };

  const handleFocusFacility = (facility, isHospital) => {
    navigate("/navigation", {
      state: {
        originCoords: { lat: coords.lat, lon: coords.lon },
        navigationMode: "live",
        focusedFacility: {
          id: facility.id,
          lat: facility.lat,
          lon: facility.lon,
          type: isHospital ? "hospital" : "police"
        }
      }
    });
  };

  const policeStations = police;
  const nearestHospital = [...hospitals]
    .sort((a, b) => (a.distance ?? a.userDist ?? 0) - (b.distance ?? b.userDist ?? 0))[0];

  const nearestPoliceStation = [...policeStations]
    .sort((a, b) => (a.distance ?? a.userDist ?? 0) - (b.distance ?? b.userDist ?? 0))[0];

  const getDistanceText = (item) => {
    const dist = item.distance ?? item.userDist;
    if (dist === undefined || dist === null) return "";
    if (dist < 1) {
      return `Distance: ${Math.round(dist * 1000)} m`;
    }
    return `Distance: ${dist.toFixed(1)} km`;
  };

  return (
    <div className="min-h-screen w-full bg-[#f6faf8] pb-24 text-gray-800 font-sans">
      <Navbar />

      <main className="pt-28 pb-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* HEADER / BANNER */}
          <div className="flex flex-col lg:flex-row justify-between items-stretch gap-6 relative">
            
            {/* Left section: Greeting & Summary info */}
            <div className="flex-1 bg-white rounded-3xl p-8 border border-emerald-100/50 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-100/40 blur-3xl opacity-60 rounded-full pointer-events-none" />
              
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-600 tracking-wide uppercase">
                    Environmental Intelligence
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
                  Good Afternoon,{" "}
                  <span className="text-emerald-500">
                    {user?.name?.split(" ")[0] || "Eco Explorer"}
                  </span>{" "}
                  👋
                </h1>
                <p className="text-gray-500 text-sm md:text-base font-normal max-w-2xl leading-relaxed">
                  Your environment is being analyzed in real-time. Air quality is currently{" "}
                  <strong className="text-emerald-600 uppercase font-extrabold">{scoreMeta.level}</strong>. 
                  EcoSense recommends checking a low-pollution route before travelling.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 items-center">
                <Link to="/routes">
                  <button className="h-12 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all active:scale-95 flex items-center gap-2">
                    Find Eco Route
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                {locationDenied && (
                  <button 
                    onClick={handleGetLocation}
                    className="h-12 px-4 border border-red-200 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-red-100/50"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Location Blocked. Enable access.
                  </button>
                )}
                {!impactStats && (
                  <button 
                    onClick={handleSeedHistory}
                    className="h-10 px-4 border border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50 rounded-xl text-xs font-bold"
                  >
                    🚀 Load Demo Travel History
                  </button>
                )}
              </div>
            </div>

            {/* Right section: Calculated EcoSense Score */}
            <div className="w-full lg:w-[360px] bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-8 shadow-xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Wind size={150} />
              </div>
              
              <div>
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest block">
                  EcoSense Environmental Score
                </span>
                <p className="text-[10px] text-emerald-400 font-bold uppercase mt-1">
                  Based on Live Localized Parameters
                </p>
              </div>

              <div className="my-6 flex items-baseline gap-2">
                <span className="text-6xl font-black tracking-tighter text-emerald-300">
                  {scoreMeta.score}
                </span>
                <span className="text-emerald-400 font-bold">/ 100</span>
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold tracking-wider bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 uppercase">
                  {scoreMeta.level}
                </span>
                <p className="text-xs text-emerald-100/70 mt-3 leading-relaxed">
                  Calculated dynamically from live AQI, current temperature, and atmospheric pressure.
                </p>
              </div>
            </div>
          </div>

          {/* LIVE SNAPSHOT TILES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Tile 1: AQI */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                  <Wind className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Air Quality
                </span>
              </div>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{aqi}</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold mt-1 text-yellow-600">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Moderate
              </span>
            </div>

            {/* Tile 2: Temperature */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Temperature
                </span>
              </div>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{temp}°C</p>
              <span className="text-xs text-gray-400 block mt-1">Real-feel calibrated</span>
            </div>

            {/* Tile 3: Weather */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center border border-sky-100">
                  <Droplets className="w-4 h-4 text-sky-500" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Weather
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-1 truncate">
                {weather}
              </p>
              <span className="text-xs text-gray-400 block mt-1">Local station readout</span>
            </div>

            {/* Tile 4: Environmental Risk */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                  <Shield className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Risk Level
                </span>
              </div>
              <p className="text-3xl font-extrabold text-gray-950 mt-1 capitalize">{scoreMeta.risk}</p>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold mt-1 ${scoreMeta.risk === 'Low' ? 'text-emerald-600' : 'text-yellow-600'}`}>
                <span className={`w-2 h-2 rounded-full ${scoreMeta.risk === 'Low' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                {scoreMeta.risk === 'Low' ? 'Safe travel' : 'Caution advised'}
              </span>
            </div>
          </div>

          {/* LARGE INTERACTIVE RISK MAP */}
          <div id="environmental-risk-map" className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-50 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                  <span>🗺️</span> Environmental Risk Map
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Interactive real-time map displaying location, pollution index overlays, and emergency facilities
                </p>
              </div>

              {/* Map controls */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <button
                  onClick={() => setShowPollution(!showPollution)}
                  className={`px-3 py-1.5 rounded-xl border transition-all ${
                    showPollution ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white text-gray-400"
                  }`}
                >
                  {showPollution ? "🟢 Pollution Zones On" : "🔘 Pollution Zones Off"}
                </button>
                <button
                  onClick={() => setShowHospitals(!showHospitals)}
                  className={`px-3 py-1.5 rounded-xl border transition-all ${
                    showHospitals ? "bg-red-50 border-red-200 text-red-700" : "bg-white text-gray-400"
                  }`}
                >
                  {showHospitals ? "🏥 Hospitals On" : "🔘 Hospitals Off"}
                </button>
                <button
                  onClick={() => setShowPolice(!showPolice)}
                  className={`px-3 py-1.5 rounded-xl border transition-all ${
                    showPolice ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white text-gray-400"
                  }`}
                >
                  {showPolice ? "🛡️ Police On" : "🔘 Police Off"}
                </button>
                <button
                  onClick={handleGetLocation}
                  className="px-3 py-1.5 rounded-xl border bg-gray-50 text-gray-700 hover:bg-gray-100 flex items-center gap-1.5"
                >
                  <Crosshair className="w-3.5 h-3.5 text-gray-500" />
                  Recenter
                </button>
              </div>
            </div>

            {/* Map Container */}
            <div className="w-full relative h-[400px] md:h-[460px] rounded-2xl overflow-hidden shadow-inner border border-gray-100 z-10">
              {loadingGeo ? (
                <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center gap-4 z-20">
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" />
                  <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
                    Positioning Environment Map...
                  </p>
                </div>
              ) : (
                <MapContainer
                  center={[coords.lat, coords.lon]}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution="&copy; CARTO"
                  />
                  <RecenterMap position={[coords.lat, coords.lon]} />

                  {/* Pulsing User Coordinates */}
                  <Marker position={[coords.lat, coords.lon]} icon={userIcon}>
                    <Popup>
                      <div className="font-bold text-emerald-800">Your Current Zone</div>
                      <div className="text-xs text-gray-400">Lat: {coords.lat.toFixed(4)}, Lon: {coords.lon.toFixed(4)}</div>
                    </Popup>
                  </Marker>

                  {/* Pollution Circle Overlays */}
                  {showPollution &&
                    pollutionZones.map((zone, idx) => (
                      <Circle
                        key={idx}
                        center={[zone.lat, zone.lon]}
                        radius={zone.radius}
                        pathOptions={{
                          fillColor: zone.level === "low" ? "#10b981" : zone.level === "moderate" ? "#eab308" : "#ef4444",
                          color: zone.level === "low" ? "#10b981" : zone.level === "moderate" ? "#eab308" : "#ef4444",
                          fillOpacity: 0.22,
                          weight: 1.5,
                        }}
                      >
                        <Popup>
                          <div className="font-bold uppercase text-[10px] text-gray-500">EcoSense Overlay</div>
                          <div className="font-bold text-gray-900 text-sm">{zone.name}</div>
                          <div className="text-xs font-semibold mt-1">
                            AQI: <span className="font-extrabold">{zone.aqi}</span> ({zone.level.toUpperCase()})
                          </div>
                        </Popup>
                      </Circle>
                    ))}

                  {/* Emergency Hospitals */}
                  {showHospitals &&
                    hospitals.map((h) => (
                      <Marker key={h.id} position={[h.lat, h.lon]} icon={hospitalIcon}>
                        <Popup>
                          <div className="font-bold text-red-600 text-xs">🏥 HOSPITAL SERVICES</div>
                          <div className="font-bold text-gray-900 text-sm mt-0.5">{h.name}</div>
                          <div className="text-[11px] text-gray-500 mt-1">
                            Distance: <span className="font-bold">{h.userDist.toFixed(2)} km</span>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                  {/* Police Stations */}
                  {showPolice &&
                    police.map((p) => (
                      <Marker key={p.id} position={[p.lat, p.lon]} icon={policeIcon}>
                        <Popup>
                          <div className="font-bold text-blue-600 text-xs">🛡️ PUBLIC SAFETY</div>
                          <div className="font-bold text-gray-900 text-sm mt-0.5">{p.name}</div>
                          <div className="text-[11px] text-gray-500 mt-1">
                            Distance: <span className="font-bold">{p.userDist.toFixed(2)} km</span>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                </MapContainer>
              )}
            </div>

            {/* Map Legend & Secondary CTA */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-gray-700">
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-50" />
                  🟢 Low Pollution
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-yellow-500/20 border border-yellow-50" />
                  🟡 Moderate Pollution
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-red-500/20 border border-red-50" />
                  🔴 High Pollution
                </span>
              </div>

              <Link to="/routes">
                <button className="h-10 px-5 bg-gray-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5">
                  Find Eco Route
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </button>
              </Link>
            </div>
          </div>

          {/* SMART ADVISOR AND AQI TREND */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Panel 1: EcoSense Smart Advisor */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
                  <h3 className="font-extrabold text-gray-900 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500 shadow-md">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    🤖 EcoSense Smart Advisor
                  </h3>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase">
                    Smart Environmental Insight
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0 border border-purple-200">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-purple-600 font-extrabold block">
                        EcoSense Recommendation
                      </span>
                      <h4 className="font-extrabold text-gray-900 text-sm mt-0.5">
                        Clean Travel Advice
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed mt-1 font-medium">
                        "{scoreMeta.advice}"
                      </p>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                      <Wind className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-extrabold block">
                        Smart Environmental Insight
                      </span>
                      <h4 className="font-extrabold text-gray-900 text-sm mt-0.5">
                        Habit assessment analysis
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed mt-1">
                        "{assessment?.aiExplanation || DEFAULT_ASSESSMENT.aiExplanation}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 items-center justify-end">
                <Link to="/pollution">
                  <button className="h-10 px-4 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all">
                    View Pollution
                  </button>
                </Link>
                <Link to="/routes">
                  <button className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all">
                    View Safer Route
                  </button>
                </Link>
              </div>
            </div>

            {/* Panel 2: AQI Trend */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
                  <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    📈 Air Quality Trend
                  </h3>
                  <div className="text-right">
                    <span className="text-[9px] text-gray-400 font-bold block">Current Day Readings</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-center">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Yesterday</span>
                    <span className="text-lg font-extrabold text-gray-800 mt-1 block">N/A</span>
                  </div>
                  <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 text-center">
                    <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-wider block">Today</span>
                    <span className="text-lg font-extrabold text-gray-800 mt-1 block">{aqi}</span>
                  </div>
                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-center">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Change</span>
                    <span className="text-lg font-extrabold text-gray-800 mt-1 block">N/A</span>
                  </div>
                </div>

                {/* SVG Empty State Line Chart */}
                <div className="relative h-44 w-full bg-emerald-50/10 rounded-2xl border border-dashed border-emerald-200/60 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-gray-900 font-bold text-xs uppercase tracking-wider">Historical data is not yet available.</p>
                  <p className="text-gray-400 text-[10px] mt-1 max-w-[240px] leading-relaxed">
                    Weekly performance trends will display here as your daily route tracking points accumulate.
                  </p>
                </div>
              </div>

              <div className="mt-6 text-right">
                <span className="text-[10px] text-gray-400 font-semibold italic">
                  * Historical tracking logs PM2.5 readings automatically.
                </span>
              </div>
            </div>

          </div>

          {/* ECO IMPACT AND SAFETY SERVICES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Panel 1: Your Eco Travel Impact */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
                  <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="text-lg">🌱</span> Your Eco Travel Impact
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                    Active Stats
                  </span>
                </div>

                {impactStats ? (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/50">
                      <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-wider block">Routes Explored</span>
                      <p className="text-3xl font-black text-emerald-950 mt-1">{impactStats.routesExplored}</p>
                      <span className="text-[10px] text-emerald-600/80 font-bold block mt-1">Unique navigation cycles</span>
                    </div>

                    <div className="bg-teal-50/40 p-4 rounded-2xl border border-teal-100/50">
                      <span className="text-[9px] text-teal-600 font-extrabold uppercase tracking-wider block">Distance Travelled</span>
                      <p className="text-3xl font-black text-teal-950 mt-1">{impactStats.distance}</p>
                      <span className="text-[10px] text-teal-600/80 font-bold block mt-1">AQI-optimized routing</span>
                    </div>

                    <div className="bg-sky-50/40 p-4 rounded-2xl border border-sky-100/50">
                      <span className="text-[9px] text-sky-600 font-extrabold uppercase tracking-wider block">Eco-Friendly Routes</span>
                      <p className="text-3xl font-black text-sky-950 mt-1">{impactStats.ecoFriendly}</p>
                      <span className="text-[10px] text-sky-600/80 font-bold block mt-1">Lowest-emission pathways</span>
                    </div>

                    <div className="bg-emerald-800 text-white p-4 rounded-2xl border border-emerald-900 relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-2 translate-y-2">
                        <Wind size={60} />
                      </div>
                      <span className="text-[9px] text-emerald-300 font-extrabold uppercase tracking-wider block">Estimated Exposure Reduced</span>
                      <p className="text-3xl font-black text-white mt-1">{impactStats.pollutionReduced}</p>
                      <span className="text-[10px] text-emerald-200/80 font-bold block mt-1">Average PM2.5 bypass</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <span className="text-3xl mb-2">🚗</span>
                    <p className="text-gray-900 font-bold text-sm">No route history yet.</p>
                    <p className="text-gray-400 text-xs max-w-xs mt-1">
                      Navigate using active Eco Routes to capture carbon offsets and pollution-reduced metrics.
                    </p>
                    <Link to="/routes" className="mt-4">
                      <button className="h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all">
                        Explore Eco Routes
                      </button>
                    </Link>
                  </div>
                )}
              </div>

              {impactStats && (
                <div className="mt-6 text-right">
                  <button 
                    onClick={() => {
                      localStorage.removeItem("ecosense_route_history");
                      window.location.reload();
                    }}
                    className="text-[10px] font-bold text-gray-400 hover:text-red-500"
                  >
                    Clear Travel Logs
                  </button>
                </div>
              )}
            </div>

            {/* Panel 2: Nearby Safety and Emergency */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="border-b border-gray-50 pb-4 mb-4">
                  <h3 className="font-black text-red-600 text-xs tracking-widest uppercase">
                    EMERGENCY QUICK ACCESS
                  </h3>
                </div>

                {loadingServices ? (
                  <div className="animate-pulse space-y-4">
                    <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                      <div className="flex items-center gap-3 w-full min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 border border-red-200" />
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-150 rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                      <div className="flex items-center gap-3 w-full min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200" />
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-150 rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* HOSPITAL ROW */}
                    {nearestHospital ? (
                      <div
                        onClick={() => handleFocusFacility(nearestHospital, true)}
                        className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 hover:border-red-500/25 hover:bg-red-500/10 rounded-2xl cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 border border-red-200">
                            <span className="text-lg">🏥</span>
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-extrabold text-gray-900 text-sm truncate max-w-[220px] md:max-w-[320px]" title={nearestHospital.name}>
                              {nearestHospital.name}
                            </h5>
                            <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
                              {getDistanceText(nearestHospital)}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 border border-red-200">
                          <span className="text-lg">🏥</span>
                        </div>
                        <p className="text-xs text-red-600 font-semibold italic">
                          🏥 No nearby hospital found
                        </p>
                      </div>
                    )}

                    {/* POLICE ROW */}
                    {nearestPoliceStation ? (
                      <div
                        onClick={() => handleFocusFacility(nearestPoliceStation, false)}
                        className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/25 hover:bg-blue-500/10 rounded-2xl cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                            <span className="text-lg">🛡️</span>
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-extrabold text-gray-900 text-sm truncate max-w-[220px] md:max-w-[320px]" title={nearestPoliceStation.name}>
                              {nearestPoliceStation.name}
                            </h5>
                            <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
                              {getDistanceText(nearestPoliceStation)}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                          <span className="text-lg">🛡️</span>
                        </div>
                        <p className="text-xs text-blue-600 font-semibold italic">
                          🛡️ No nearby police station found
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-8 bg-gray-50 p-3 rounded-xl text-center text-[10px] text-gray-400 font-medium">
                🚨 Contact emergency responder dispatch directly if facing critical alerts.
              </div>
            </div>

          </div>

          {/* ENVIRONMENTAL ALERTS AND ECO CHALLENGE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Panel 1: Environmental Alerts */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
                <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                  <span className="text-lg">⚠️</span> Environmental Alerts
                </h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Live Incidents</span>
              </div>

              <div className="space-y-3">
                {scoreMeta.alert ? (
                  <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                    scoreMeta.alert.priority === "High" 
                      ? "bg-rose-50 border-rose-100 text-rose-800" 
                      : "bg-amber-50 border-amber-100 text-amber-800"
                  }`}>
                    <AlertTriangle className={`w-5 h-5 shrink-0 ${scoreMeta.alert.priority === "High" ? "text-rose-500" : "text-amber-500"}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm">{scoreMeta.alert.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                          scoreMeta.alert.priority === "High" 
                            ? "bg-rose-100 border-rose-200 text-rose-700" 
                            : "bg-amber-100 border-amber-200 text-amber-700"
                        }`}>
                          {scoreMeta.alert.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                        {scoreMeta.alert.text}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <div>
                      <span className="font-extrabold text-xs block">All Systems Normal</span>
                      <span className="text-[10px] text-gray-500 font-medium block mt-0.5">No critical AQI or weather incidents flagged.</span>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-amber-50/50 border border-amber-100 text-amber-800 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs block">Pollution Hotspot Detected</span>
                      <span className="px-2 py-0.5 bg-amber-100 border border-amber-200 text-amber-700 rounded text-[8px] font-black uppercase">
                        Moderate
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium mt-1 leading-relaxed">
                      A higher-pollution area is detected near active commercial sectors. Selecting clean transit modes is advised.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 2: Eco Challenge */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
                  <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="text-lg">🏆</span> Weekly Eco Challenge
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                    Earn Points
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-100/80 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-sm text-emerald-950 block">
                        Choose 3 Eco-Friendly Routes
                      </span>
                      <span className="text-xs text-emerald-700 font-bold block mt-0.5">
                        Weekly commuters target
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-xl text-[10px] font-extrabold">
                        +50 Points
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs font-bold text-gray-600 mb-2">
                      <span>Weekly Challenge Progress</span>
                      <span>
                        {impactStats ? Math.min(impactStats.ecoFriendly, 3) : 2} / 3 routes
                      </span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                        style={{ 
                          width: impactStats 
                            ? `${Math.min((impactStats.ecoFriendly / 3) * 100, 100)}%` 
                            : "66%" 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center text-xs font-semibold text-gray-400">
                Eco points can be spent in the <Link to="/eco-store" className="text-emerald-600 underline">EcoStore</Link> to unlock rewards!
              </div>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dasboard;
