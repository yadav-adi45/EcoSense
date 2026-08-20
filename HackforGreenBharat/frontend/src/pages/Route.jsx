import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import RouteMap from "@/components/RouteMap";
import AQIBadge from "../components/AQIBadge";
import LocationAutocomplete, { geocodeLocation, parseRouteQuery } from "@/components/LocationAutocomplete";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Navigation,
  Search,
  Clock,
  Route as RouteIcon,
  AlertTriangle,
  Loader2,
  Sparkles,
  Zap,
  Leaf,
  Car,
  Bike,
  Bus,
  PersonStanding,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  BatteryCharging,
  ShieldCheck,
  Compass,
  Info,
  CheckCircle2,
} from "lucide-react";
import { serverUrl } from "@/main";
import { getCachedRoute, setCachedRoute } from "@/utils/routeCache";
import { toast } from "react-toastify";
import RouteInsights from "@/components/RouteInsights";

/* Transport mode config */
const TRANSPORT_MODES = [
  { id: "driving", emoji: "🚗", label: "Car", icon: Car },
  { id: "bike", emoji: "🏍️", label: "Moto", icon: Bike },
  { id: "bus", emoji: "🚌", label: "Transit", icon: Bus },
  { id: "cycling", emoji: "🚲", label: "Bicycle", icon: Bike },
  { id: "foot", emoji: "🚶", label: "Walk", icon: PersonStanding },
];

const getAQIColor = (aqi) => {
  if (aqi === null || aqi === undefined) return "#9CA3AF";
  if (aqi <= 50) return "#10B981"; // Emerald
  if (aqi <= 100) return "#FACC15"; // Yellow
  if (aqi <= 150) return "#FB923C"; // Orange
  if (aqi <= 200) return "#EF4444"; // Red
  return "#7F1D1D"; // Dark Red
};

const getAQILabel = (aqi) => {
  if (aqi === null || aqi === undefined) return "Unknown";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive";
  if (aqi <= 200) return "Unhealthy";
  return "Hazardous";
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
  const [originCoords, setOriginCoords] = useState({ lat: 28.6139, lon: 77.2090, name: "Delhi" });
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const [isPregnancyMode, setIsPregnancyMode] = useState(false);
  const [preferWellLit, setPreferWellLit] = useState(false);
  const [season, setSeason] = useState("none");
  const [travelMode, setTravelMode] = useState("driving");
  const [showPreferences, setShowPreferences] = useState(false);
  const [showEVList, setShowEVList] = useState(false);
  const [showSegmentsList, setShowSegmentsList] = useState(false);

  const [locatingUser, setLocatingUser] = useState(false);
  const [triggerSearchOnce, setTriggerSearchOnce] = useState(null);
  const voiceEnabledRef = useRef(true);
  const lastAlertRef = useRef("");

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

  const handleSwapLocations = () => {
    const tempOrigin = origin;
    const tempOriginCoords = originCoords;
    setOrigin(destination);
    setOriginCoords(destinationCoords);
    setDestination(tempOrigin);
    setDestinationCoords(tempOriginCoords);
    if (tempOrigin && destination) {
      setRoutes([]);
    }
  };

  /* ─── Auto-Fill & Route when query is "Delhi to Jaipur" ─── */
  const handleSelectRoutePair = async ({ from, to }) => {
    toast.info(`🛣️ Routing: ${from} ➔ ${to}`, { autoClose: 2000 });
    setLoading(true);
    try {
      const [fromGeo, toGeo] = await Promise.all([
        geocodeLocation(from),
        geocodeLocation(to),
      ]);

      const finalOriginName = fromGeo?.label || from;
      const finalDestName = toGeo?.label || to;

      setOrigin(finalOriginName);
      setOriginCoords({
        lat: fromGeo?.lat || 28.6139,
        lon: fromGeo?.lon || 77.2090,
        name: fromGeo?.name || from,
      });

      setDestination(finalDestName);
      setDestinationCoords({
        lat: toGeo?.lat || 26.9124,
        lon: toGeo?.lon || 75.7873,
        name: toGeo?.name || to,
      });

      setTriggerSearchOnce(finalDestName);
    } catch (err) {
      console.error("Failed to parse route pair:", err);
    } finally {
      setLoading(false);
    }
  };

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
  }, [travelMode, isPregnancyMode, preferWellLit, season]);

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
    const message =
      level === "SEVERE"
        ? "Severe pollution ahead. Close windows."
        : "High pollution detected ahead. Wear a mask.";
    toast.warn(message, { position: "top-center", autoClose: 5000 });
    if (voiceEnabledRef.current) speak(message);
  }, [routes, selectedRoute]);

  const handleSearch = async () => {
    unlockSpeech();
    if (!origin || !destination) {
      toast.error("Please enter both a starting location and destination.");
      return;
    }
    setRoutes([]);
    setSelectedRoute(0);
    setLoading(true);
    try {
      const prefs = { isPregnancyMode, preferWellLit, season, travelMode };
      const originCity = originCoords?.name || origin.split(",")[0].trim();
      const destinationCity = destinationCoords?.name || destination.split(",")[0].trim();
      const cached = getCachedRoute(originCity, destinationCity, prefs);
      if (cached) {
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
        ...(originCoords?.fromGPS && { originCoords }),
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
        ...(originCoords?.fromGPS && { originCoords }),
      });
      if (eliteRes.data.success) {
        setCachedRoute(originCity, destinationCity, eliteRes.data, prefs);
        setRoutes(eliteRes.data.routes || []);
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

  const handleStartNavigation = () => {
    if (isNavigating) {
      setIsNavigating(false);
      return;
    }

    if (!originCoords || !destinationCoords) {
      toast.error("Please search for a route first.");
      return;
    }

    const ua = navigator.userAgent || "";
    const isAndroid = /android/i.test(ua);
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isMobile = isAndroid || isIOS;

    const destLat = destinationCoords.lat;
    const destLon = destinationCoords.lon;
    const origLat = originCoords.lat;
    const origLon = originCoords.lon;

    let gmTravelMode = "driving";
    if (travelMode === "cycling" || travelMode === "bike") gmTravelMode = "bicycling";
    else if (travelMode === "foot") gmTravelMode = "walking";
    else if (travelMode === "bus") gmTravelMode = "transit";

    if (isMobile) {
      const webFallbackUrl =
        `https://www.google.com/maps/dir/?api=1` +
        `&origin=${encodeURIComponent(`${origLat},${origLon}`)}` +
        `&destination=${encodeURIComponent(`${destLat},${destLon}`)}` +
        `&travelmode=${gmTravelMode}`;

      if (isAndroid) {
        let androidMode = "d";
        if (travelMode === "cycling" || travelMode === "bike") androidMode = "b";
        else if (travelMode === "foot") androidMode = "w";
        else if (travelMode === "bus") androidMode = "r";

        const intentUrl =
          `intent://maps.google.com/maps?saddr=${origLat},${origLon}` +
          `&daddr=${destLat},${destLon}` +
          `&directionsmode=${gmTravelMode}` +
          `#Intent;scheme=https;package=com.google.android.apps.maps;` +
          `S.browser_fallback_url=${encodeURIComponent(webFallbackUrl)};end`;

        const navIntent = `google.navigation:q=${destLat},${destLon}&mode=${androidMode}`;
        let appLaunched = false;
        const onHide = () => {
          appLaunched = true;
        };
        document.addEventListener("visibilitychange", onHide, { once: true });

        const a = document.createElement("a");
        a.href = navIntent;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => {
          document.removeEventListener("visibilitychange", onHide);
          if (!appLaunched) {
            const w = window.open(intentUrl, "_blank", "noopener,noreferrer");
            if (!w) window.location.href = webFallbackUrl;
          }
        }, 1500);
      } else {
        const iosNavUrl =
          `comgooglemaps://?saddr=${origLat},${origLon}` +
          `&daddr=${destLat},${destLon}` +
          `&directionsmode=${
            gmTravelMode === "bicycling"
              ? "bicycling"
              : gmTravelMode === "walking"
              ? "walking"
              : gmTravelMode === "transit"
              ? "transit"
              : "driving"
          }`;

        let appLaunched = false;
        const onHide = () => {
          appLaunched = true;
        };
        document.addEventListener("visibilitychange", onHide, { once: true });
        window.location.href = iosNavUrl;

        setTimeout(() => {
          document.removeEventListener("visibilitychange", onHide);
          if (!appLaunched) {
            const w = window.open(webFallbackUrl, "_blank", "noopener,noreferrer");
            if (!w) window.location.href = webFallbackUrl;
          }
        }, 1500);
      }

      setIsNavigating(true);
    } else {
      const activeRoute = routes.find((r) => r.id === selectedRoute) || routes[0];
      setIsNavigating(true);
      navigate("/navigation", {
        state: {
          route: activeRoute,
          origin: origin,
          destination: destination,
          originCoords: originCoords,
          destinationCoords: destinationCoords,
          travelMode: travelMode,
        },
      });
    }
  };

  const activeRoute = routes.find((r) => r.id === selectedRoute) || routes[0];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#f0faf5] flex flex-col pt-20">
      <Navbar />

      {/* TWO-COLUMN GOOGLE MAPS-STYLE ROUTE INTERFACE */}
      <div className="flex-1 flex flex-col lg:flex-row w-full h-[calc(100vh-5rem)] overflow-hidden">
        
        {/* ─── 1. LEFT SIDEBAR (35% ON DESKTOP, 100% MOBILE) ─── */}
        <aside className="w-full lg:w-[35%] xl:w-[35%] h-full flex flex-col bg-white border-r border-emerald-100 shadow-xl z-20 overflow-y-auto shrink-0">
          <div className="p-4 sm:p-5 space-y-4">
            
            {/* Sidebar Branding & Status */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-gray-900 leading-tight">EcoSense Directions</h2>
                  <p className="text-[10px] text-gray-400 font-bold">AI Clean-Air Route Planner</p>
                </div>
              </div>
              {routes.length > 0 && (
                <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                  {routes.length} Paths Ready
                </span>
              )}
            </div>

            {/* ─── GOOGLE MAPS UNIFIED ROUTE SEARCH BAR (AUTO-FILLS FROM & TO) ─── */}
            <div className="relative bg-white rounded-2xl p-3 border border-emerald-200/80 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Route Search</span>
                </span>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  Auto-fills below
                </span>
              </div>
              <LocationAutocomplete
                value=""
                onChange={() => {}}
                onSelect={async (s) => {
                  if (s) {
                    setDestination(s.label);
                    setDestinationCoords({ lat: s.lat, lon: s.lon, name: s.name });
                    setTriggerSearchOnce(s.label);
                  }
                }}
                onRouteQuerySelect={handleSelectRoutePair}
                placeholder="Search route (e.g. 'Delhi to Jaipur')..."
                iconBg="bg-emerald-500 text-white border-emerald-600 shadow-sm"
                icon={<Search className="w-4 h-4 text-white" />}
              />
            </div>

            {/* ─── 2. SOURCE & DESTINATION STACKED INPUTS ─── */}
            <div className="relative bg-gray-50/90 rounded-2xl p-3.5 border border-gray-200/70 shadow-sm space-y-2">
              
              {/* Origin / Starting Location */}
              <div className="relative">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">From (Starting Point)</span>
                </div>
                <LocationAutocomplete
                  value={origin}
                  onChange={(v) => {
                    setOrigin(v);
                    if (!v) setOriginCoords(null);
                  }}
                  onSelect={(s) => {
                    if (!s) {
                      setOriginCoords(null);
                      return;
                    }
                    setOrigin(s.label);
                    setOriginCoords({ lat: s.lat, lon: s.lon, name: s.name, fromGPS: false });
                  }}
                  onRouteQuerySelect={handleSelectRoutePair}
                  placeholder="Starting location or 'Delhi to Jaipur'..."
                  iconBg="bg-emerald-100 border-emerald-200 text-emerald-600"
                  icon={<MapPin className="w-4 h-4 text-emerald-600" />}
                  extraDropdownTop={
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleUseMyLocation()}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors border-b border-gray-100 group text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
                        {locatingUser ? (
                          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                        ) : (
                          <Navigation className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-black text-gray-800 block">
                          {locatingUser ? "Detecting location…" : "Your current location"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">Use GPS position</span>
                      </div>
                    </button>
                  }
                />
              </div>

              {/* Swap Locations Button */}
              <div className="flex justify-end -my-1.5 pr-3 z-10">
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  title="Swap starting location and destination"
                  className="w-7 h-7 rounded-full bg-white border border-gray-200 hover:border-emerald-400 text-gray-500 hover:text-emerald-600 flex items-center justify-center shadow-sm hover:shadow transition-all duration-200 hover:rotate-180 active:scale-95"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Destination */}
              <div className="relative">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">To (Destination)</span>
                </div>
                <LocationAutocomplete
                  value={destination}
                  onChange={(v) => {
                    setDestination(v);
                    if (!v) setDestinationCoords(null);
                  }}
                  onSelect={(s) => {
                    if (!s) {
                      setDestinationCoords(null);
                      return;
                    }
                    setDestination(s.label);
                    setDestinationCoords({ lat: s.lat, lon: s.lon, name: s.name });
                  }}
                  onRouteQuerySelect={handleSelectRoutePair}
                  placeholder="Destination or 'Delhi to Jaipur'..."
                  iconBg="bg-red-100 border-red-200 text-red-600"
                  icon={<Navigation className="w-4 h-4 text-red-500" />}
                />
              </div>
            </div>

            {/* Travel Mode Selector */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Travel Mode</span>
              <div className="flex items-center justify-between gap-1.5 p-1.5 bg-gray-100/80 rounded-2xl border border-gray-200/50">
                {TRANSPORT_MODES.map((mode) => {
                  const isActive = travelMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setTravelMode(mode.id);
                        setRoutes([]);
                      }}
                      className={`flex-1 flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-black transition-all duration-200 ${
                        isActive
                          ? "bg-white text-emerald-600 shadow-sm border border-emerald-200/70 scale-[1.02]"
                          : "text-gray-500 hover:text-gray-800 hover:bg-white/50"
                      }`}
                    >
                      <span className="text-base leading-none mb-1">{mode.emoji}</span>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── DIRECTLY VISIBLE ROUTE PREFERENCES (2x2 GRID MATCHING PAPER SKETCH) ─── */}
            <div className="border border-gray-200/80 rounded-2xl p-3.5 bg-white shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-black text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                  <span>Route Preferences</span>
                </span>
                {(isPregnancyMode || preferWellLit || season !== "none") && (
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    Active
                  </span>
                )}
              </div>

              {/* 2-Column Grid as sketched */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-1 border-t border-gray-100">
                {/* Left Column: 1. Pregnancy & Elder mode */}
                <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded-xl hover:bg-emerald-50/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={isPregnancyMode}
                    onChange={(e) => setIsPregnancyMode(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-500 border-gray-300 focus:ring-emerald-400 accent-emerald-500 shrink-0"
                  />
                  <span className="text-xs font-bold text-gray-800 leading-snug">
                    Pregnancy &amp; Elder mode
                  </span>
                </label>

                {/* Right Column: 1. Winter (Smog-Avoidance) */}
                <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded-xl hover:bg-emerald-50/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={season === "winter"}
                    onChange={(e) => setSeason(e.target.checked ? "winter" : "none")}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-500 border-gray-300 focus:ring-emerald-400 accent-emerald-500 shrink-0"
                  />
                  <span className="text-xs font-bold text-gray-800 leading-snug">
                    Winter (Smog-Avoidance)
                  </span>
                </label>

                {/* Left Column: 2. Well-Lit Road */}
                <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded-xl hover:bg-emerald-50/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={preferWellLit}
                    onChange={(e) => setPreferWellLit(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-500 border-gray-300 focus:ring-emerald-400 accent-emerald-500 shrink-0"
                  />
                  <span className="text-xs font-bold text-gray-800 leading-snug">
                    Well-Lit Road
                  </span>
                </label>

                {/* Right Column: 2. Summer (Shaded Canopy) */}
                <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded-xl hover:bg-emerald-50/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={season === "summer"}
                    onChange={(e) => setSeason(e.target.checked ? "summer" : "none")}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-500 border-gray-300 focus:ring-emerald-400 accent-emerald-500 shrink-0"
                  />
                  <span className="text-xs font-bold text-gray-800 leading-snug">
                    Summer (Shaded Canopy)
                  </span>
                </label>
              </div>
            </div>

            {/* ─── 3. FIND ROUTES BUTTON ─── */}
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Calculating Clean Routes...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Find Routes</span>
                </>
              )}
            </Button>

            {/* ─── 4. ROUTE INFORMATION CARD & RESULTS (IN LEFT SIDEBAR) ─── */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              {loading && routes.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-gray-100/70 border border-gray-200 rounded-2xl p-4 h-28 animate-pulse" />
                  ))}
                </div>
              ) : routes.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Suggested Routes
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      {routes.length} Available
                    </span>
                  </div>

                  {routes.map((route) => {
                    const isSelected = selectedRoute === route.id;
                    return (
                      <Card
                        key={route.id}
                        onClick={() => setSelectedRoute(route.id)}
                        className={`cursor-pointer transition-all duration-300 border-2 rounded-2xl p-4 relative overflow-hidden ${
                          isSelected
                            ? "border-emerald-500 bg-white shadow-lg shadow-emerald-900/10"
                            : "border-gray-100 bg-gray-50/70 hover:border-emerald-200 hover:bg-white"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200 text-[9px] font-black uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            Selected
                          </div>
                        )}

                        <CardContent className="p-0 space-y-3">
                          {/* Route Name & Badges */}
                          <div className="pr-16">
                            <h3 className={`text-base font-extrabold leading-tight ${isSelected ? "text-emerald-700" : "text-gray-800"}`}>
                              {route.name}
                            </h3>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {route.avgAQI < 60 && (
                                <span className="bg-emerald-50 text-emerald-700 text-[9px] px-2 py-0.5 rounded-md border border-emerald-200 uppercase font-black tracking-wider">
                                  🌿 Elite Air
                                </span>
                              )}
                              {route.name?.includes("Swift") && (
                                <span className="bg-orange-50 text-orange-700 text-[9px] px-2 py-0.5 rounded-md border border-orange-200 uppercase font-black tracking-wider">
                                  ⚡ Swift
                                </span>
                              )}
                              {route.evStations?.length > 0 && (
                                <span className="bg-blue-50 text-blue-700 text-[9px] px-2 py-0.5 rounded-md border border-blue-200 uppercase font-black tracking-wider">
                                  🔋 {route.evStations.length} EV
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Metrics Bar */}
                          <div className="flex items-center justify-between gap-2 bg-gray-50/90 p-3 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3 text-xs font-bold text-gray-700">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-orange-500" />
                                {route.duration}
                              </span>
                              <div className="w-px h-4 bg-gray-200" />
                              <span className="flex items-center gap-1.5">
                                <RouteIcon className="w-4 h-4 text-emerald-500" />
                                {route.distance}
                              </span>
                            </div>
                            <div className="text-right">
                              <AQIBadge value={route.avgAQI} size="sm" />
                            </div>
                          </div>

                          {/* Selected Route Detailed Summary */}
                          {isSelected && (
                            <div className="space-y-3 pt-2 border-t border-gray-100 animate-in fade-in duration-300">
                              
                              {/* Pollution Gradient Progress */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                  <span>Route Pollution Profile</span>
                                  <span>Avg AQI: {route.avgAQI}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
                                  {route.pollutionSegments?.slice(0, 15).map((s, i) => (
                                    <div
                                      key={i}
                                      className="h-full flex-1"
                                      style={{
                                        backgroundColor: getAQIColor(s.aqi),
                                        opacity: s.aqi ? 1 : 0.2,
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>

                              {/* Wellness Intel */}
                              <div className="p-3.5 bg-emerald-50/80 border border-emerald-100 rounded-xl space-y-1.5">
                                <p className="text-emerald-900 font-black text-xs uppercase tracking-tight flex items-center gap-1.5">
                                  <Leaf className="w-3.5 h-3.5 text-emerald-600" /> Wellness Intel
                                </p>
                                <p className="text-gray-600 font-medium text-xs leading-relaxed italic">
                                  "{route.healthAdvice}"
                                </p>
                                {route.travelTip && (
                                  <p className="text-emerald-800 font-bold text-[10px] uppercase tracking-wider pt-1 border-t border-emerald-100/60">
                                    💡 {route.travelTip}
                                  </p>
                                )}
                              </div>

                              {/* Route Insights Accordion */}
                              <RouteInsights
                                route={route}
                                originCoords={originCoords}
                                destinationCoords={destinationCoords}
                              />

                              {/* EV Stations Summary (Collapsible if present) */}
                              {route.evStations?.length > 0 && (
                                <div className="border border-blue-100 rounded-xl overflow-hidden bg-blue-50/30">
                                  <button
                                    type="button"
                                    onClick={() => setShowEVList((v) => !v)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-blue-50 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <BatteryCharging className="w-3.5 h-3.5 text-blue-600" />
                                      <span className="text-xs font-black text-blue-900">
                                        EV Stations ({route.evStations.length})
                                      </span>
                                    </div>
                                    {showEVList ? (
                                      <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                                    )}
                                  </button>

                                  {showEVList && (
                                    <div className="p-2.5 space-y-2 bg-white border-t border-blue-100 text-xs">
                                      {route.evStations.map((ev) => (
                                        <div key={ev.id} className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                          <p className="font-bold text-gray-800 truncate">{ev.name}</p>
                                          <p className="text-[10px] text-gray-500">Operator: {ev.operator}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Pollution Segments Breakdown (Collapsible) */}
                              {route.pollutionSegments?.length > 0 && (
                                <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                                  <button
                                    type="button"
                                    onClick={() => setShowSegmentsList((v) => !v)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-100/60 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Info className="w-3.5 h-3.5 text-gray-600" />
                                      <span className="text-xs font-black text-gray-800">
                                        Segment Checkpoints ({route.pollutionSegments.length})
                                      </span>
                                    </div>
                                    {showSegmentsList ? (
                                      <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                    )}
                                  </button>

                                  {showSegmentsList && (
                                    <div className="p-2 space-y-1.5 bg-white border-t border-gray-100 max-h-48 overflow-y-auto">
                                      {route.pollutionSegments.map((seg, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between p-1.5 rounded-lg bg-gray-50 text-[11px]"
                                        >
                                          <span className="font-bold text-gray-700 truncate max-w-[150px]">
                                            {seg.area || `Checkpoint ${idx + 1}`}
                                          </span>
                                          <span
                                            className="font-black px-2 py-0.5 rounded text-[10px]"
                                            style={{
                                              color: getAQIColor(seg.aqi),
                                              backgroundColor: `${getAQIColor(seg.aqi)}15`,
                                            }}
                                          >
                                            AQI {seg.aqi ?? "N/A"}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Start Navigation Action in Sidebar */}
                              <Button
                                onClick={handleStartNavigation}
                                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                              >
                                <Navigation className="w-4 h-4" />
                                Start Navigation
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                /* Empty / Initial State */
                <div className="p-6 text-center bg-gray-50/80 border border-emerald-100/80 rounded-2xl border-dashed space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100/70 text-emerald-600 flex items-center justify-center mx-auto">
                    <RouteIcon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-black text-gray-800">Plan a Clean Journey</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Enter your starting point and destination above, then click <strong className="text-emerald-700">Find Routes</strong> to compare real-time air quality along each path.
                  </p>
                </div>
              )}
            </div>

          </div>
        </aside>

        {/* ─── 5. RIGHT MAP CONTAINER (65% ON DESKTOP, 100% MOBILE) ─── */}
        <main className="w-full lg:w-[65%] xl:w-[65%] h-full relative overflow-hidden bg-white flex-1">
          <RouteMap
            routes={routes}
            selectedRouteId={selectedRoute}
            origin={originCoords}
            destination={destinationCoords}
            onSelectRoute={setSelectedRoute}
            isNavigating={isNavigating}
            onExitNav={() => setIsNavigating(false)}
            transportMode={travelMode}
            onSelectDestination={(destName) => {
              setDestination(destName);
              setTriggerSearchOnce(destName);
            }}
          />

          {/* Floating Navigation Button on Map (Bottom-Right) */}
          {routes.length > 0 && (
            <div className="absolute bottom-6 right-6 z-[400] animate-in fade-in slide-in-from-bottom-3 duration-300">
              <Button
                onClick={handleStartNavigation}
                className={`${
                  isNavigating
                    ? "bg-red-500 hover:bg-red-600 shadow-red-500/30"
                    : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30"
                } h-13 px-6 shadow-2xl text-white font-black text-sm flex items-center gap-2.5 rounded-full group transition-all transform hover:scale-105 active:scale-95`}
              >
                <Navigation className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span>{isNavigating ? "EXIT NAVIGATION" : "START NAVIGATION"}</span>
                {activeRoute && (
                  <span className="ml-1 pl-2 border-l border-white/30 text-xs font-semibold opacity-90">
                    {activeRoute.duration}
                  </span>
                )}
              </Button>
            </div>
          )}

          {/* Floating Route Quick Info Pill (Top-Right of Map) */}
          {activeRoute && (
            <div className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-gray-800">{activeRoute.name}</span>
              </div>
              <div className="w-px h-3.5 bg-gray-200" />
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <span>{activeRoute.distance}</span>
                <span>•</span>
                <span>{activeRoute.duration}</span>
              </div>
              <div className="w-px h-3.5 bg-gray-200" />
              <AQIBadge value={activeRoute.avgAQI} size="sm" />
            </div>
          )}
        </main>

      </div>
    </div>
  );
};

export default Routes;
