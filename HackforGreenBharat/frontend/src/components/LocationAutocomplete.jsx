import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { MapPin, Loader2, Search, X, ArrowRight, Route as RouteIcon, Navigation } from "lucide-react";

/* ─── Fast Local Geocoding Table for Major Indian Cities ─────── */
export const POPULAR_INDIAN_CITIES = {
  "delhi": { name: "Delhi", label: "New Delhi, Delhi", lat: 28.6139, lon: 77.2090 },
  "new delhi": { name: "New Delhi", label: "New Delhi, Delhi", lat: 28.6139, lon: 77.2090 },
  "jaipur": { name: "Jaipur", label: "Jaipur, Rajasthan", lat: 26.9124, lon: 75.7873 },
  "mumbai": { name: "Mumbai", label: "Mumbai, Maharashtra", lat: 19.0760, lon: 72.8777 },
  "pune": { name: "Pune", label: "Pune, Maharashtra", lat: 18.5204, lon: 73.8567 },
  "bengaluru": { name: "Bengaluru", label: "Bengaluru, Karnataka", lat: 12.9716, lon: 77.5946 },
  "bangalore": { name: "Bengaluru", label: "Bengaluru, Karnataka", lat: 12.9716, lon: 77.5946 },
  "chennai": { name: "Chennai", label: "Chennai, Tamil Nadu", lat: 13.0827, lon: 80.2707 },
  "kolkata": { name: "Kolkata", label: "Kolkata, West Bengal", lat: 22.5726, lon: 88.3639 },
  "hyderabad": { name: "Hyderabad", label: "Hyderabad, Telangana", lat: 17.3850, lon: 78.4867 },
  "ahmedabad": { name: "Ahmedabad", label: "Ahmedabad, Gujarat", lat: 23.0225, lon: 72.5714 },
  "chandigarh": { name: "Chandigarh", label: "Chandigarh, Punjab", lat: 30.7333, lon: 76.7794 },
  "agra": { name: "Agra", label: "Agra, Uttar Pradesh", lat: 27.1767, lon: 78.0081 },
  "lucknow": { name: "Lucknow", label: "Lucknow, Uttar Pradesh", lat: 26.8467, lon: 80.9462 },
  "kanpur": { name: "Kanpur", label: "Kanpur, Uttar Pradesh", lat: 26.4499, lon: 80.3319 },
  "varanasi": { name: "Varanasi", label: "Varanasi, Uttar Pradesh", lat: 25.3176, lon: 82.9739 },
  "ranchi": { name: "Ranchi", label: "Ranchi, Jharkhand", lat: 23.3441, lon: 85.3096 },
  "patna": { name: "Patna", label: "Patna, Bihar", lat: 25.5941, lon: 85.1376 },
  "bhopal": { name: "Bhopal", label: "Bhopal, Madhya Pradesh", lat: 23.2599, lon: 77.4126 },
  "indore": { name: "Indore", label: "Indore, Madhya Pradesh", lat: 22.7196, lon: 75.8577 },
  "surat": { name: "Surat", label: "Surat, Gujarat", lat: 21.1702, lon: 72.8311 },
  "vadodara": { name: "Vadodara", label: "Vadodara, Gujarat", lat: 22.3072, lon: 73.1812 },
  "kochi": { name: "Kochi", label: "Kochi, Kerala", lat: 9.9312, lon: 76.2673 },
  "goa": { name: "Goa", label: "Panaji, Goa", lat: 15.4909, lon: 73.8278 },
  "dehradun": { name: "Dehradun", label: "Dehradun, Uttarakhand", lat: 30.3165, lon: 78.0322 },
  "shimla": { name: "Shimla", label: "Shimla, Himachal Pradesh", lat: 31.1048, lon: 77.1734 },
  "amritsar": { name: "Amritsar", label: "Amritsar, Punjab", lat: 31.6340, lon: 74.8723 },
  "udaipur": { name: "Udaipur", label: "Udaipur, Rajasthan", lat: 24.5854, lon: 73.7125 },
  "jodhpur": { name: "Jodhpur", label: "Jodhpur, Rajasthan", lat: 26.2389, lon: 73.0243 },
  "navi mumbai": { name: "Navi Mumbai", label: "Navi Mumbai, Maharashtra", lat: 19.0330, lon: 73.0297 },
  "gurugram": { name: "Gurugram", label: "Gurugram, Haryana", lat: 28.4595, lon: 77.0266 },
  "noida": { name: "Noida", label: "Noida, Uttar Pradesh", lat: 28.5355, lon: 77.3910 }
};

/* ─── Parse "A to B" / "A -> B" Route Pattern ─────────────────── */
export const parseRouteQuery = (query) => {
  if (!query || typeof query !== "string") return null;
  const q = query.trim();
  const cleanQ = q.replace(/^from\s+/i, "");
  
  const match = cleanQ.match(/^(.+?)\s+(?:to|->|-->|-|towards)\s+(.+)$/i);
  if (match) {
    const from = match[1].trim();
    const to = match[2].trim();
    if (from.length >= 2 && to.length >= 2) {
      return { from, to };
    }
  }
  return null;
};

/* ─── Geocode a Single Location ───────────────────────────────── */
export const geocodeLocation = async (query) => {
  if (!query) return null;
  const normalized = query.toLowerCase().trim().replace(/,/g, " ");
  
  for (const [key, val] of Object.entries(POPULAR_INDIAN_CITIES)) {
    if (normalized === key || normalized.startsWith(key + " ") || normalized.includes(" " + key)) {
      return { ...val };
    }
  }
  
  try {
    const res = await axios.get("https://photon.komoot.io/api/", {
      params: {
        q: query + " India",
        limit: 1,
        lang: "en",
        bbox: "68.1766451354,6.7546077636,97.4025614766,35.5087008962",
      },
      timeout: 5000,
    });
    const f = res.data?.features?.[0];
    if (f && f.geometry?.coordinates) {
      const p = f.properties;
      const name = p.name || p.city || p.town || query;
      const state = p.state || "";
      const label = state ? `${name}, ${state}` : name;
      return {
        name,
        label,
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        state,
      };
    }
  } catch {
    // fallback
  }
  
  return { name: query, label: query, lat: 28.6139, lon: 77.2090 };
};

/* ─── Photon API (free, no key, India-focused) ────────────── */
export const fetchSuggestions = async (query) => {
  if (!query || query.length < 2) return [];
  try {
    const res = await axios.get("https://photon.komoot.io/api/", {
      params: {
        q: query + " India",
        limit: 8,
        lang: "en",
        bbox: "68.1766451354,6.7546077636,97.4025614766,35.5087008962", // India bounding box
      },
      timeout: 6000,
    });
    return (res.data?.features || [])
      .filter((f) => f.properties?.country === "India" || f.properties?.country === "IN")
      .map((f) => {
        const p = f.properties;
        const name = p.name || p.city || p.town || p.village || "";
        const state = p.state || "";
        const district = p.district || p.county || "";
        const label = district && district !== name
          ? `${name}, ${district}, ${state}`
          : state
          ? `${name}, ${state}`
          : name;
        return {
          label: label.trim(),
          name,
          lat: f.geometry?.coordinates?.[1],
          lon: f.geometry?.coordinates?.[0],
          state,
          district,
          type: p.type || p.osm_value || "",
        };
      })
      .filter((s) => s.name && s.lat && s.lon);
  } catch {
    return [];
  }
};

/* ─── Highlight matching text ─────────────────────────────── */
const Highlight = ({ text, query }) => {
  if (!query) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-emerald-100 text-emerald-800 rounded px-0.5 font-black not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
};

/* ─── Main component ──────────────────────────────────────── */
const LocationAutocomplete = ({
  value,
  onChange,
  onSelect,
  onRouteQuerySelect, // Callback when user selects a "Delhi to Jaipur" route suggestion
  placeholder = "Search city or location...",
  icon,
  iconBg = "bg-emerald-50 border-emerald-100",
  iconColor = "text-emerald-500",
  extraDropdownTop,
  size = "md",
}) => {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [routeSuggestion, setRouteSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const skipFetchRef = useRef(false);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchDebounced = useCallback((q) => {
    clearTimeout(debounceRef.current);
    
    // Check if query is a route pattern like "Delhi to Jaipur"
    const parsed = parseRouteQuery(q);
    if (parsed) {
      setRouteSuggestion({
        from: parsed.from,
        to: parsed.to,
        label: `${parsed.from} ➔ ${parsed.to}`,
      });
    } else {
      setRouteSuggestion(null);
    }

    if (q.length < 2) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const searchTerm = parsed ? parsed.to : q;
      const results = await fetchSuggestions(searchTerm);
      setSuggestions(results);
      setLoading(false);
      setActiveIdx(-1);
    }, 300);
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    onChange?.(q);
    if (skipFetchRef.current) { skipFetchRef.current = false; return; }
    setOpen(true);
    fetchDebounced(q);
  };

  const handleSelect = (suggestion) => {
    skipFetchRef.current = true;
    setQuery(suggestion.label);
    setSuggestions([]);
    setRouteSuggestion(null);
    setOpen(false);
    setActiveIdx(-1);
    onChange?.(suggestion.label);
    onSelect?.(suggestion);
  };

  const handleSelectRoute = (route) => {
    skipFetchRef.current = true;
    setOpen(false);
    setSuggestions([]);
    setRouteSuggestion(null);
    if (onRouteQuerySelect) {
      onRouteQuerySelect(route);
    } else {
      setQuery(route.to);
      onChange?.(route.to);
    }
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === "Enter") {
      const parsed = parseRouteQuery(query);
      if (parsed && onRouteQuerySelect) {
        e.preventDefault();
        handleSelectRoute(parsed);
        return;
      }
    }
  };

  const handleClear = () => {
    setQuery("");
    onChange?.("");
    setSuggestions([]);
    setRouteSuggestion(null);
    setOpen(false);
    onSelect?.(null);
  };

  const isSm = size === "sm";

  return (
    <div className="flex-1 relative" ref={containerRef}>
      {/* Icon left */}
      <div className={`absolute ${isSm ? "left-2.5 w-6 h-6 rounded-lg" : "left-3.5 w-8 h-8 rounded-xl"} top-1/2 -translate-y-1/2 flex items-center justify-center border z-10 ${iconBg}`}>
        {icon || <MapPin className={`${isSm ? "w-3.5 h-3.5" : "w-4 h-4"} ${iconColor}`} />}
      </div>

      {/* Input */}
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => { setOpen(true); if (query.length >= 2 && !skipFetchRef.current) fetchDebounced(query); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full ${
          isSm
            ? "pl-10 pr-8 h-9.5 text-xs font-semibold rounded-xl"
            : "pl-14 pr-10 h-12 text-sm font-semibold rounded-2xl"
        } bg-white border border-gray-200/80 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all shadow-sm placeholder:text-gray-400 placeholder:font-normal`}
      />

      {/* Right: loading or clear */}
      <div className={`absolute ${isSm ? "right-2.5" : "right-3.5"} top-1/2 -translate-y-1/2`}>
        {loading
          ? <Loader2 className={`${isSm ? "w-3.5 h-3.5" : "w-4 h-4"} text-emerald-500 animate-spin`} />
          : query
          ? <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleClear}><X className={`${isSm ? "w-3.5 h-3.5" : "w-4 h-4"} text-gray-400 hover:text-gray-600`} /></button>
          : null}
      </div>

      {/* Dropdown */}
      {open && (extraDropdownTop || routeSuggestion || suggestions.length > 0 || (query.length >= 2 && !loading)) && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl shadow-emerald-900/15 border border-gray-100 z-[500] overflow-hidden max-h-72 overflow-y-auto">

          {/* 1. Direct Route Parse Suggestion (e.g. "Delhi to Jaipur" -> Auto Fill Both) */}
          {routeSuggestion && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectRoute(routeSuggestion)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-50/70 hover:bg-emerald-100/70 transition-colors border-b border-emerald-100 text-left group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-emerald-900 uppercase">Directions Route</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-200/70 text-[9px] font-black text-emerald-800">Auto-Fill</span>
                </div>
                <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5 mt-0.5 truncate">
                  <span className="text-emerald-700 font-extrabold">{routeSuggestion.from}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-emerald-700 font-extrabold">{routeSuggestion.to}</span>
                </p>
              </div>
            </button>
          )}

          {/* Extra slot (e.g. "Your location") */}
          {extraDropdownTop}

          {/* Suggestions */}
          {suggestions.map((s, i) => {
            const parts = s.label.split(", ");
            const city = parts[0] || s.label;
            const region = parts.slice(1).join(", ");
            return (
              <button
                key={`${s.lat}-${s.lon}-${i}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 border-b border-gray-50 last:border-0"
              >
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">
                    <Highlight text={city} query={query} />
                  </p>
                  {region && <p className="text-[11px] text-gray-400 font-medium truncate">{region}</p>}
                </div>
              </button>
            );
          })}

          {/* No results */}
          {!loading && query.length >= 2 && suggestions.length === 0 && !extraDropdownTop && !routeSuggestion && (
            <div className="px-4 py-4 text-sm text-gray-400 font-medium text-center">No locations found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
