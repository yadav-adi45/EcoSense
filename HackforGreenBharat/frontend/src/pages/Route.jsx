import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import RouteMap from "@/components/RouteMap";
import AQIBadge from "../components/AQIBadge";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Navigation,
  Search,
  Clock,
  Route as RouteIcon,
  AlertTriangle,
  ShieldAlert,
  AlertOctagon,
  Eye,
  Flame,
  Gauge,
  Loader2,
  Sparkles,
  Zap,
  Leaf,
  Car,
  Bike,
  Bus,
  PersonStanding,
  X
} from "lucide-react";
import { serverUrl } from "@/main";
import { getCachedRoute, setCachedRoute } from "@/utils/routeCache";
import { toast } from "react-toastify";
import Footer from "@/pages/Footer";
import RouteInsights from "@/components/RouteInsights";

/* Transport mode config */
const TRANSPORT_MODES = [
  {
    id: "car",
    label: "Car",
    emoji: "🚗",
    icon: Car,
    color: "blue",
    tip: "Fastest option with EV charging support",
  },
  {
    id: "bike",
    label: "Bike / Moto",
    emoji: "🏍️",
    icon: Bike,
    color: "orange",
    tip: "Navigate narrow lanes & shortcuts",
  },
  {
    id: "bus",
    label: "Bus / Transit",
    emoji: "🚌",
    icon: Bus,
    color: "purple",
    tip: "Low-emission shared transport",
  },
  {
    id: "walk",
    label: "Walking",
    emoji: "🚶",
    icon: PersonStanding,
    color: "emerald",
    tip: "Healthiest & zero-emission option",
  },
];

const TRANSPORT_COLOR = {
  blue:    { ring: "ring-blue-500",    bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-600",    badge: "bg-blue-500"    },
  orange:  { ring: "ring-orange-500",  bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-600",  badge: "bg-orange-500"  },
  purple:  { ring: "ring-purple-500",  bg: "bg-purple-50",  border: "border-purple-200",  text: "text-purple-600",  badge: "bg-purple-500"  },
  emerald: { ring: "ring-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600", badge: "bg-emerald-500" },
};


const getAQIColor = (aqi) => {
  if (aqi === null) return "#9CA3AF";
  if (aqi <= 50) return "#10B981"; // Emerald
  if (aqi <= 100) return "#FACC15"; // Yellow
  if (aqi <= 150) return "#FB923C"; // Orange
  if (aqi <= 200) return "#EF4444"; // Red
  return "#7F1D1D"; // Dark Red
};

const unlockSpeech = () => {
  if (!("speechSynthesis" in window)) return;
  const msg = new SpeechSynthesisUtterance("");
  msg.volume = 0;
  window.speechSynthesis.speak(msg);
};

const speak = (text) => {
  if (!("speechSynthesis" in window)) return;
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-IN";
  msg.rate = 1;
  msg.volume = 1;
  window.speechSynthesis.speak(msg);
};

const Routes = () => {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState("Delhi");
  const [destination, setDestination] = useState("");
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [transportMode, setTransportMode] = useState("car");

  const [isPregnancyMode, setIsPregnancyMode] = useState(false);
  const [preferWellLit, setPreferWellLit] = useState(false);
  const [season, setSeason] = useState("none");
  const [travelMode, setTravelMode] = useState("driving");
  const [avoidAnimalRisk, setAvoidAnimalRisk] = useState(false);

  const [locatingUser, setLocatingUser] = useState(false);
  const [animalRiskData, setAnimalRiskData] = useState({});

  const handleUseMyLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Reverse geocode to city name using Nominatim
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "User-Agent": "ecosense-app" }, timeout: 8000 }
          );
          const city =
            res.data?.address?.city ||
            res.data?.address?.town ||
            res.data?.address?.village ||
            res.data?.address?.county ||
            "Current Location";
          setOrigin(city);
          setOriginCoords({ lat: latitude, lon: longitude, name: city, fromGPS: true });
          toast.success(`📍 Location set to ${city}`);
        } catch {
          toast.error("Could not detect your city. Please enter it manually.");
        } finally {
          setLocatingUser(false);
        }
      },
      (err) => {
        setLocatingUser(false);
        if (err.code === 1) toast.error("Location permission denied. Please enter your city manually.");
        else toast.error("Could not get your location. Please enter it manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const [triggerSearchOnce, setTriggerSearchOnce] = useState(null);
  const voiceEnabledRef = useRef(true);
  const lastAlertRef = useRef("");

  useEffect(() => {
    if (triggerSearchOnce && destination === triggerSearchOnce) {
      handleSearch();
      setTriggerSearchOnce(null);
    }
  }, [destination, triggerSearchOnce]);

  useEffect(() => {
    if (origin.trim() && destination.trim()) {
      handleSearch();
    }
  }, [travelMode, isPregnancyMode, preferWellLit, season, avoidAnimalRisk]);

  useEffect(() => {
    if (!routes.length) return;
    const activeRoute = routes.find((r) => r.id === selectedRoute) || routes[0];
    const segments = activeRoute?.pollutionSegments;
    if (!segments?.length) return;
    const high = segments.find((s) => s.aqi >= 150);
    if (!high) return;
    const level = high.aqi >= 200 ? "SEVERE" : "HIGH";
    if (lastAlertRef.current === level) return;
    lastAlertRef.current = level;
    const message = level === "SEVERE" ? "Severe pollution ahead. Close windows." : "High pollution detected ahead. Wear a mask.";
    toast.warn(message, { position: "top-center", autoClose: 5000 });
    if (voiceEnabledRef.current) speak(message);
  }, [routes, selectedRoute]);

  // Function to fetch animal risk for a route
  const fetchAnimalRiskForRoute = async (pollutionSegments) => {
    if (!pollutionSegments || pollutionSegments.length === 0) {
      return { animalRisk: 0, maxRisk: 0, riskLevel: "Low", hasHighRisk: false, commonAnimals: [], animals: [] };
    }

    const currentHour = new Date().getHours();
    const riskPromises = [];

    // Sample points along the route
    const numPoints = Math.min(pollutionSegments.length, 8);
    const step = Math.max(1, Math.floor(pollutionSegments.length / numPoints));
    const sampleIndices = [];
    for (let idx = 0; idx < pollutionSegments.length; idx += step) {
      sampleIndices.push(idx);
    }
    if (sampleIndices[sampleIndices.length - 1] !== pollutionSegments.length - 1) {
      sampleIndices.push(pollutionSegments.length - 1);
    }

    for (const index of sampleIndices) {
      const segment = pollutionSegments[index];
      if (segment && segment.lat && segment.lon) {
        riskPromises.push(
          axios.get(`${serverUrl}/api/v12/animal-risk`, {
            params: {
              latitude: segment.lat,
              longitude: segment.lon,
              hour: currentHour
            }
          }).then(res => res.data).catch(() => ({ animalRisk: 0, riskLevel: "Low", commonAnimals: [] }))
        );
      }
    }

    const riskResults = await Promise.all(riskPromises);
    const maxRisk = Math.max(...riskResults.map(r => r.animalRisk || 0), 0);
    const maxRiskData = riskResults.find(r => r.animalRisk === maxRisk) || riskResults[0] || {};

    // Collect all unique animals observed along sampled points
    const animalsMap = new Map();
    riskResults.forEach(res => {
      if (res.commonAnimals && Array.isArray(res.commonAnimals)) {
        res.commonAnimals.forEach(a => {
          if (!animalsMap.has(a.name)) {
            animalsMap.set(a.name, a);
          }
        });
      }
    });
    const combinedAnimals = Array.from(animalsMap.values());

    return {
      animalRisk: maxRisk,
      maxRisk: maxRisk,
      riskLevel: maxRiskData.riskLevel || (maxRisk > 75 ? "Very High" : maxRisk > 50 ? "High" : maxRisk > 25 ? "Moderate" : "Low"),
      hasHighRisk: maxRisk >= 35,
      commonAnimals: combinedAnimals.length > 0 ? combinedAnimals : (maxRiskData.commonAnimals || []),
      animals: combinedAnimals.length > 0 ? combinedAnimals : (maxRiskData.commonAnimals || [])
    };
  };

  const handleSearch = async () => {
    console.log('🔍 handleSearch called - searching from', origin, 'to', destination);
    unlockSpeech();
    if (!origin || !destination) {
      toast.error("Please enter both an origin and destination.");
      return;
    }
    setRoutes([]);
    setSelectedRoute(0);
    setLoading(true);
    try {
      const prefs = { isPregnancyMode, preferWellLit, season, travelMode, avoidAnimalRisk };
      // Use the plain city name (not "City, State" label) for geocoding
      const originCity = originCoords?.name || origin.split(",")[0].trim();
      const destinationCity = destinationCoords?.name || destination.split(",")[0].trim();
      const cached = getCachedRoute(originCity, destinationCity, prefs);
      if (cached && cached.routes && cached.routes[0]?.animalRisk) {
        console.log('📦 Using CACHED route with animal risk');
        setRoutes(cached.routes || []);
        setSelectedRoute(0);
        setOriginCoords(cached.origin);
        setDestinationCoords(cached.destination);
        setLoading(false);
        return;
      }
      const fastRes = await axios.post(`${serverUrl}/api/v2/routes?fast=true`, {
        originCity,
        destinationCity,
        preferences: prefs,
        ...(originCoords?.fromGPS && { originCoords })
      });
      if (fastRes.data.success) {
        setRoutes(fastRes.data.routes);
        setOriginCoords(fastRes.data.origin);
        setDestinationCoords(fastRes.data.destination);
        setLoading(false);
      }
      const eliteRes = await axios.post(`${serverUrl}/api/v2/routes`, {
        originCity,
        destinationCity,
        preferences: prefs,
        ...(originCoords?.fromGPS && { originCoords })
      });
      if (eliteRes.data.success) {
        const routesData = eliteRes.data.routes || [];
        
        // 🐾 Fetch animal risk for all routes
        console.log('🐾 Fetching animal risk for', routesData.length, 'routes...');
        for (let i = 0; i < routesData.length; i++) {
          try {
            const route = routesData[i];
            const riskData = await fetchAnimalRiskForRoute(route.pollutionSegments);
            route.animalRisk = riskData;
            console.log(`✅ Route ${i + 1} animal risk:`, riskData);
          } catch (error) {
            console.error(`❌ Failed to fetch animal risk for route ${i + 1}:`, error);
          }
        }
        
        setCachedRoute(originCity, destinationCity, { ...eliteRes.data, routes: routesData }, prefs);
        setRoutes(routesData);
        setOriginCoords(eliteRes.data.origin);
        setDestinationCoords(eliteRes.data.destination);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Had trouble finding that path.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0faf5] pb-24">
      <Navbar />

      <main className="container mx-auto px-6 pt-32 pb-12">
        {/* HERO SECTION */}
        <div className="text-center mb-16 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-emerald-100/30 blur-[120px] rounded-full -z-10"></div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-600 tracking-wide uppercase">AI Optimized Nav</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-none mb-6">
            Smart Path, <span className="text-emerald-500">Pure Air.</span>
          </h1>
          <p className="text-gray-500 text-base font-medium max-w-xl mx-auto leading-relaxed">
            Personalized routes that prioritize your respiratory health by avoiding high-AQI zones in real-time.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* SEARCH & MAP COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            {/* Search Input Card */}
            <Card className="border-none bg-white rounded-[2rem] shadow-lg shadow-emerald-900/5 p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-4">
                {/* ── ORIGIN ── */}
                <LocationAutocomplete
                  value={origin}
                  onChange={(v) => { setOrigin(v); if (!v) setOriginCoords(null); }}
                  onSelect={(s) => {
                    if (!s) { setOriginCoords(null); return; }
                    setOrigin(s.label);
                    setOriginCoords({ lat: s.lat, lon: s.lon, name: s.name, fromGPS: false });
                  }}
                  placeholder="Origin city..."
                  iconBg="bg-emerald-50 border-emerald-100"
                  iconColor="text-emerald-500"
                  extraDropdownTop={
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleUseMyLocation()}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-sky-50 transition-colors border-b border-gray-50 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0 group-hover:bg-sky-200 transition-colors">
                        {locatingUser
                          ? <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
                          : <Navigation className="w-5 h-5 text-sky-600" />}
                      </div>
                      <span className="text-sm font-black text-gray-800">
                        {locatingUser ? "Detecting your location…" : "Your location"}
                      </span>
                    </button>
                  }
                />

                {/* ── DESTINATION ── */}
                <LocationAutocomplete
                  value={destination}
                  onChange={(v) => { setDestination(v); if (!v) setDestinationCoords(null); }}
                  onSelect={(s) => {
                    if (!s) { setDestinationCoords(null); return; }
                    setDestination(s.label);
                    setDestinationCoords({ lat: s.lat, lon: s.lon, name: s.name });
                  }}
                  placeholder="Destination city..."
                  iconBg="bg-red-50 border-red-100"
                  iconColor="text-red-500"
                  icon={<Navigation className="w-4 h-4 text-red-500" />}
                />
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 text-base active:scale-95 transition-all flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <Search className="w-5 h-5" /> Find Routes
                    </>
                  )}
                </Button>
              </div>

              {/* Travel Mode Selector */}
              <div className="mt-5 pt-5 border-t border-gray-100">
                <span className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Travel Mode</span>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: "driving",  emoji: "🚗", label: "Car"     },
                    { id: "cycling",  emoji: "🚲", label: "Bicycle" },
                    { id: "foot",     emoji: "🚶", label: "Walk"    },
                    { id: "bike",     emoji: "🛵", label: "Bike"    },
                    { id: "bus",      emoji: "🚌", label: "Bus"     },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => { setTravelMode(mode.id); setRoutes([]); }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-black transition-all duration-200 ${
                        travelMode === mode.id
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200"
                          : "bg-gray-50 text-gray-600 border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50"
                      }`}
                    >
                      <span className="text-base leading-none">{mode.emoji}</span>
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferences Selection */}
              <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Pregnancy / Elderly Switch */}
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 hover:bg-emerald-50/50 rounded-2xl border border-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={isPregnancyMode}
                    onChange={(e) => setIsPregnancyMode(e.target.checked)}
                    className="w-5 h-5 rounded-lg text-emerald-500 border-gray-300 focus:ring-emerald-400 accent-emerald-500"
                  />
                  <div>
                    <span className="block text-xs font-black text-gray-800">Pregnancy & Elder Mode</span>
                    <span className="block text-[10px] text-gray-400 font-bold">Pothole-free & smooth ride</span>
                  </div>
                </label>

                {/* Avoid Animal Risk Switch */}
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 hover:bg-emerald-50/50 rounded-2xl border border-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={avoidAnimalRisk}
                    onChange={(e) => setAvoidAnimalRisk(e.target.checked)}
                    className="w-5 h-5 rounded-lg text-emerald-500 border-gray-300 focus:ring-emerald-400 accent-emerald-500"
                  />
                  <div>
                    <span className="block text-xs font-black text-gray-800">Avoid Animal Risk</span>
                    <span className="block text-[10px] text-gray-400 font-bold">Avoid roads prone to animal accidents</span>
                  </div>
                </label>

                {/* Well-Lit Switch */}
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 hover:bg-emerald-50/50 rounded-2xl border border-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={preferWellLit}
                    onChange={(e) => setPreferWellLit(e.target.checked)}
                    className="w-5 h-5 rounded-lg text-emerald-500 border-gray-300 focus:ring-emerald-400 accent-emerald-500"
                  />
                  <div>
                    <span className="block text-xs font-black text-gray-800">Well-Lit Roads</span>
                    <span className="block text-[10px] text-gray-400 font-bold">Prioritize street lights</span>
                  </div>
                </label>

                {/* Seasonal Dropdown */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex-1">
                    <span className="block text-xs font-black text-gray-800">Seasonal Conditions</span>
                    <select
                      value={season}
                      onChange={(e) => setSeason(e.target.value)}
                      className="mt-1 w-full bg-transparent text-[10px] font-bold text-gray-500 border-none p-0 focus:ring-0 cursor-pointer outline-none"
                    >
                      <option value="none">Standard Routing</option>
                      <option value="winter">Winter (Smog-Avoidance)</option>
                      <option value="summer">Summer (Shaded Canopy)</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Map Viewer Card */}
            <Card className="border-none bg-white rounded-[2rem] shadow-xl shadow-emerald-900/10 overflow-hidden relative">
              <CardContent className={`p-0 relative overflow-hidden transition-all duration-500 ${isNavigating ? 'h-[80vh] md:h-[720px]' : 'h-[60vh] md:h-[600px]'}`}>
                <RouteMap
                  routes={routes}
                  selectedRouteId={selectedRoute}
                  origin={originCoords}
                  destination={destinationCoords}
                  onSelectRoute={setSelectedRoute}
                  isNavigating={isNavigating}
                  onExitNav={() => setIsNavigating(false)}
                  transportMode={transportMode}
                  onSelectDestination={(destName) => {
                    setDestination(destName);
                    setTriggerSearchOnce(destName);
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* SUGGESTED ROUTES COLUMN */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <Zap className="w-6 h-6 text-emerald-500" />
                    Routes
                </h2>
                {routes.length > 0 && <span className="px-3 py-1 bg-white border border-emerald-100 rounded-full text-[10px] font-black text-emerald-600 uppercase italic">Smart Choice Ready</span>}
            </div>

            {loading && routes.length === 0 ? (
                [1,2,3].map(i => (
                    <Card key={i} className="bg-white/50 border-none rounded-3xl h-24 animate-pulse mb-4"></Card>
                ))
            ) : routes.length > 0 ? (
                <div className="space-y-4">
                    {routes.map((route) => (
                      <Card
                        key={route.id}
                        onClick={() => setSelectedRoute(route.id)}
                        className={`cursor-pointer transition-all duration-500 border-2 rounded-[1.5rem] p-6 relative overflow-hidden ${
                          selectedRoute === route.id
                            ? "border-emerald-500 bg-white shadow-2xl shadow-emerald-900/10 -translate-y-1"
                            : "border-transparent bg-white/60 hover:border-emerald-100 hover:bg-white"
                        }`}
                      >
                         {selectedRoute === route.id && <div className="absolute top-0 right-0 p-4"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div></div>}
                        <CardContent className="p-0">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className={`text-lg font-extrabold tracking-tighter leading-none ${selectedRoute === route.id ? 'text-emerald-600' : 'text-gray-800'}`}>
                                    {route.name}
                                </h3>
                                <div className="flex gap-2 mt-2">
                                    {route.avgAQI < 60 && <span className="bg-emerald-50 text-emerald-600 text-[9px] px-2 py-0.5 rounded-lg border border-emerald-100 uppercase font-black tracking-widest">Elite Air</span>}
                                    {route.name.includes("Swift") && <span className="bg-orange-50 text-orange-600 text-[9px] px-2 py-0.5 rounded-lg border border-orange-100 uppercase font-black tracking-widest">Nitro</span>}
                                    {route.evStations?.length > 0 && <span className="bg-blue-50 text-blue-600 text-[9px] px-2 py-0.5 rounded-lg border border-blue-100 uppercase font-black tracking-widest">🔋 {route.evStations.length} EV Stations</span>}
                                    {((route.animalRisk && (route.animalRisk.maxRisk > 25 || route.animalRisk.hasHighRisk)) || (route.maxAnimalRisk > 25)) && (
                                      <span className={`text-[9px] px-2 py-0.5 rounded-lg border uppercase font-black tracking-widest ${
                                        (route.animalRisk?.maxRisk > 75 || route.maxAnimalRisk > 75)
                                          ? 'bg-red-50 text-red-600 border-red-200'
                                          : (route.animalRisk?.maxRisk > 50 || route.maxAnimalRisk > 50)
                                          ? 'bg-orange-50 text-orange-600 border-orange-200'
                                          : 'bg-amber-50 text-amber-700 border-amber-200'
                                      }`}>
                                        🐾 {route.animalRisk?.riskLevel || route.animalRiskLevel || 'High'} Wildlife Risk
                                      </span>
                                    )}
                                </div>
                            </div>
                            <AQIBadge value={route.avgAQI} size="lg" />
                          </div>

                          <div className="flex gap-4 text-gray-500 text-sm font-bold bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 mb-6">
                            <span className="flex items-center gap-2">
                              <Clock className="w-5 h-5 text-orange-400" />
                              {route.duration}
                            </span>
                            <div className="w-px h-5 bg-gray-200"></div>
                            <span className="flex items-center gap-2">
                              <RouteIcon className="w-5 h-5 text-emerald-400" />
                              {route.distance}
                            </span>
                          </div>

                          {/* Human Health Insight */}
                          {selectedRoute === route.id && (
                             <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
                                    {route.pollutionSegments?.slice(0, 10).map((s, i) => (
                                        <div key={i} className="h-full flex-1" style={{ backgroundColor: getAQIColor(s.aqi), opacity: s.aqi ? 1 : 0.1 }}></div>
                                    ))}
                                </div>
                                <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-[1.2rem]">
                                    <p className="text-gray-900 font-black text-sm mb-1 uppercase tracking-tight flex items-center gap-2">
                                        <Leaf className="w-4 h-4 text-emerald-500" /> Wellness Intel
                                    </p>
                                    <p className="text-gray-600 font-medium text-xs leading-relaxed italic mb-2">"{route.healthAdvice}"</p>
                                    {route.travelTip && (
                                      <p className="text-emerald-800 font-bold text-[10px] uppercase tracking-wider mt-2">
                                        💡 {route.travelTip}
                                      </p>
                                    )}
                                </div>

                                {/* Forest Danger / Wildlife Hazard Alert Card */}
                                {((route.animalRisk && (route.animalRisk.hasHighRisk || route.animalRisk.maxRisk > 25)) || route.maxAnimalRisk > 25 || route.animalWarning) && (
                                  <div className="relative overflow-hidden rounded-[1.4rem] border-2 border-amber-500/50 bg-gradient-to-br from-[#1c1208] via-[#141b12] to-[#260a0a] text-white shadow-2xl shadow-red-950/40 animate-in fade-in zoom-in-95 duration-500">
                                    {/* Hazard Barricade Striping on Top */}
                                    <div className="h-2 w-full bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_12px,#000_12px,#000_24px)] opacity-90 shadow-sm"></div>

                                    {/* Ambient Warning Glow Blur */}
                                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
                                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-red-600/20 rounded-full blur-3xl pointer-events-none"></div>

                                    <div className="p-5 relative z-10 space-y-4">
                                      {/* Header Row */}
                                      <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
                                        <div className="flex items-center gap-2.5">
                                          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
                                            <AlertTriangle className="w-5 h-5 animate-pulse text-amber-400" />
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-[10px] font-black tracking-[0.2em] text-red-400 uppercase">
                                                FOREST DANGER ZONE
                                              </span>
                                              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                                            </div>
                                            <h4 className="text-sm font-black text-amber-200 tracking-tight flex items-center gap-1.5">
                                              🐾 Wildlife Collision Corridor
                                            </h4>
                                          </div>
                                        </div>

                                        <div className="text-right">
                                          <span className="inline-block px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/50 text-[10px] font-black uppercase text-red-300 tracking-wider">
                                            {route.animalRisk?.riskLevel || route.animalRiskLevel || 'High'} Hazard
                                          </span>
                                        </div>
                                      </div>

                                      {/* Main Alert Message */}
                                      <div className="bg-black/40 border border-amber-500/30 p-3.5 rounded-xl backdrop-blur-sm">
                                        <p className="text-xs font-bold text-amber-100/90 leading-relaxed">
                                          {route.animalWarning || (
                                            `⚠️ Severe animal accident history along this route. Dense wildlife movement (especially venomous reptiles & wild mammals) recorded in adjacent forest corridors.`
                                          )}
                                        </p>
                                      </div>

                                      {/* Tactical Driver Directives (Forest Signboard Style) */}
                                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/20 text-amber-200/90">
                                          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                                          <span className="font-bold">Speed Limit: &lt; 40 km/h</span>
                                        </div>
                                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-200/90">
                                          <Eye className="w-4 h-4 text-red-400 shrink-0" />
                                          <span className="font-bold">Scan Road Shoulders</span>
                                        </div>
                                      </div>

                                      {/* Species Detection Breakdown */}
                                      {((route.animalRisk?.commonAnimals && route.animalRisk.commonAnimals.length > 0) || (route.animalRisk?.animals && route.animalRisk.animals.length > 0)) && (
                                        <div className="pt-2 border-t border-white/10">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400/80">
                                              Threat Species Documented Nearby:
                                            </span>
                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Roadkill Database</span>
                                          </div>
                                          <div className="flex flex-wrap gap-1.5">
                                            {(route.animalRisk?.commonAnimals || route.animalRisk?.animals || []).slice(0, 5).map((animal, idx) => (
                                              <span
                                                key={idx}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/60 rounded-lg text-[10px] font-bold text-amber-200 border border-amber-500/30 hover:border-amber-400 transition-colors shadow-sm"
                                              >
                                                <span>
                                                  {animal.category === 'mammal'
                                                    ? '🦝'
                                                    : animal.category === 'bird'
                                                    ? '🦅'
                                                    : animal.category === 'reptile' || animal.category === 'other'
                                                    ? '🐍'
                                                    : '🐾'}
                                                </span>
                                                <span>{animal.name}</span>
                                                {animal.count && (
                                                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-[9px] text-amber-300 font-mono">
                                                    ×{animal.count}
                                                  </span>
                                                )}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                 {/* ── Route Insights (expandable) ── */}
                                <RouteInsights
                                  route={route}
                                  originCoords={originCoords}
                                  destinationCoords={destinationCoords}
                                />
                             </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
            ) : (
                <div className="p-12 text-center bg-white/40 border border-emerald-100 rounded-[2.5rem] border-dashed">
                    <RouteIcon className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
                    <p className="text-emerald-900 font-black text-lg">Path Not Found</p>
                    <p className="text-emerald-600/60 text-xs font-medium mt-1">Start your journey by entering a destination city above.</p>
                </div>
            )}
          </div>
        </div>

        {/* EV STATIONS SECTION */}
        {routes.find((r) => r.id === selectedRoute)?.evStations?.length > 0 && (
            <div className="mt-16 animate-in fade-in duration-1000">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
                        <Zap className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">Charging Infrastructure</h3>
                        <p className="text-gray-500 font-medium">Available EV charging stations along your route.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routes.find((r) => r.id === selectedRoute).evStations.map((ev, i) => (
                        <div key={ev.id} className="p-6 bg-white rounded-[1.5rem] border border-blue-50 shadow-sm hover:shadow-xl transition-all duration-500 relative group overflow-hidden">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50/50 rounded-full blur-3xl -z-10 group-hover:bg-blue-50 transition-colors"></div>
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                                    <Zap className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[.2em] mb-1">Type</p>
                                    <p className="font-black uppercase text-sm text-blue-500">Fast Charge</p>
                                </div>
                            </div>
                            <h4 className="text-lg font-extrabold text-gray-800 tracking-tight mb-2 truncate">{ev.name}</h4>
                            <p className="text-xs font-bold text-gray-400 mb-6">{ev.lat?.toFixed(3)}°N, {ev.lon?.toFixed(3)}°E</p>
                            
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">Operator<br/>Network</p>
                                <div className="w-px h-6 bg-gray-200 mx-2"></div>
                                <p className="text-sm font-extrabold tracking-tighter text-gray-700 uppercase">{ev.operator}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* BOTTOM SECTION - AIR QUALITY LOG */}
        {routes.find((r) => r.id === selectedRoute)?.pollutionSegments?.length > 0 && (
            <div className="mt-16 animate-in fade-in duration-1000">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm">
                        <Zap className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">Segment Analysis</h3>
                        <p className="text-gray-500 font-medium">Deep-dive into air quality data across your selected journey.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routes.find((r) => r.id === selectedRoute)?.pollutionSegments.slice(0, 6).map((s, i) => (
                        <div key={i} className="p-6 bg-white rounded-[1.5rem] border border-emerald-50 shadow-sm hover:shadow-xl transition-all duration-500 relative group overflow-hidden">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50/50 rounded-full blur-3xl -z-10 group-hover:bg-emerald-50 transition-colors"></div>
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center font-black text-gray-300 border border-gray-100">
                                    {i + 1}
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[.2em] mb-1">Status</p>
                                    <p className={`font-black uppercase text-sm ${s.zone === "High" ? 'text-red-500' : s.zone === "Medium" ? 'text-orange-500' : 'text-emerald-500'}`}>{s.zone || "SAFE"}</p>
                                </div>
                            </div>
                            <h4 className="text-lg font-extrabold text-gray-800 tracking-tight mb-2 truncate uppercase">{s.area || "Checkpoint"}</h4>
                            <p className="text-xs font-bold text-gray-400 mb-6">{s.lat?.toFixed(3)}°N, {s.lon?.toFixed(3)}°E</p>
                            
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">Air Quality<br/>Index</p>
                                <div className="w-px h-6 bg-gray-200 mx-2"></div>
                                <p className="text-2xl font-extrabold tracking-tighter" style={{ color: getAQIColor(s.aqi) }}>{s.aqi ?? "N/A"}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>

      {routes.length > 0 && (
        <div className="fixed bottom-10 right-10 z-[100] animate-bounce-slow">
          <Button
            onClick={() => {
              if (isNavigating) {
                // Already in nav state — just reset (user navigated back from /navigation)
                setIsNavigating(false);
                return;
              }

              if (!originCoords || !destinationCoords) {
                toast.error("Please search for a route first.");
                return;
              }

              const ua = navigator.userAgent || '';
              const isAndroid = /android/i.test(ua);
              const isIOS = /iphone|ipad|ipod/i.test(ua);
              const isMobile = isAndroid || isIOS;

              const destLat = destinationCoords.lat;
              const destLon = destinationCoords.lon;
              const origLat = originCoords.lat;
              const origLon = originCoords.lon;

              // Map travelMode → Google Maps web param
              let gmTravelMode = 'driving';
              if (travelMode === 'cycling' || travelMode === 'bike') gmTravelMode = 'bicycling';
              else if (travelMode === 'foot') gmTravelMode = 'walking';
              else if (travelMode === 'bus') gmTravelMode = 'transit';

              if (isMobile) {
                // ── Mobile: launch Google Maps native app ──────────────
                const webFallbackUrl =
                  `https://www.google.com/maps/dir/?api=1` +
                  `&origin=${encodeURIComponent(`${origLat},${origLon}`)}` +
                  `&destination=${encodeURIComponent(`${destLat},${destLon}`)}` +
                  `&travelmode=${gmTravelMode}`;

                if (isAndroid) {
                  // Android navigation intent mode: d/w/b/r
                  let androidMode = 'd';
                  if (travelMode === 'cycling' || travelMode === 'bike') androidMode = 'b';
                  else if (travelMode === 'foot') androidMode = 'w';
                  else if (travelMode === 'bus') androidMode = 'r';

                  const intentUrl =
                    `intent://maps.google.com/maps?saddr=${origLat},${origLon}` +
                    `&daddr=${destLat},${destLon}` +
                    `&directionsmode=${gmTravelMode}` +
                    `#Intent;scheme=https;package=com.google.android.apps.maps;` +
                    `S.browser_fallback_url=${encodeURIComponent(webFallbackUrl)};end`;

                  const navIntent = `google.navigation:q=${destLat},${destLon}&mode=${androidMode}`;
                  let appLaunched = false;
                  const onHide = () => { appLaunched = true; };
                  document.addEventListener('visibilitychange', onHide, { once: true });

                  const a = document.createElement('a');
                  a.href = navIntent;
                  a.style.display = 'none';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);

                  setTimeout(() => {
                    document.removeEventListener('visibilitychange', onHide);
                    if (!appLaunched) {
                      const w = window.open(intentUrl, '_blank', 'noopener,noreferrer');
                      if (!w) window.location.href = webFallbackUrl;
                    }
                  }, 1500);

                } else {
                  // iOS: comgooglemaps:// scheme
                  const iosNavUrl =
                    `comgooglemaps://?saddr=${origLat},${origLon}` +
                    `&daddr=${destLat},${destLon}` +
                    `&directionsmode=${gmTravelMode === 'bicycling' ? 'bicycling' : gmTravelMode === 'walking' ? 'walking' : gmTravelMode === 'transit' ? 'transit' : 'driving'}`;

                  let appLaunched = false;
                  const onHide = () => { appLaunched = true; };
                  document.addEventListener('visibilitychange', onHide, { once: true });
                  window.location.href = iosNavUrl;

                  setTimeout(() => {
                    document.removeEventListener('visibilitychange', onHide);
                    if (!appLaunched) {
                      const w = window.open(webFallbackUrl, '_blank', 'noopener,noreferrer');
                      if (!w) window.location.href = webFallbackUrl;
                    }
                  }, 1500);
                }

                // Mobile: mark navigating so button flips to EXIT
                setIsNavigating(true);

              } else {
                // ── Desktop: open in-app EcoSense NavigationScreen ─────
                const activeRoute = routes.find((r) => r.id === selectedRoute) || routes[0];
                setIsNavigating(true);
                navigate('/navigation', {
                  state: {
                    route:             activeRoute,
                    origin:            origin,
                    destination:       destination,
                    originCoords:      originCoords,
                    destinationCoords: destinationCoords,
                    travelMode:        travelMode,
                  },
                });
              }
            }}
            className={`${isNavigating ? 'bg-red-500 hover:bg-red-600 shadow-red-400/30' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-400/30'} h-14 px-8 shadow-xl text-white font-bold text-base flex items-center gap-3 rounded-full group transition-all`}
          >
            <Navigation className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            {isNavigating ? "EXIT NAVIGATION" : "START NAVIGATION"}
          </Button>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default Routes;
