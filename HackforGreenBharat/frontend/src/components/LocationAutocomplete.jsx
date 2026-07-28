import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { MapPin, Loader2, Search, X } from "lucide-react";

/* ─── Photon API (free, no key, India-focused) ────────────── */
const fetchSuggestions = async (query) => {
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
  placeholder = "Search city or location...",
  icon,
  iconBg = "bg-emerald-50 border-emerald-100",
  iconColor = "text-emerald-500",
  extraDropdownTop,   // optional: JSX rendered at top of dropdown (e.g. "Your location")
}) => {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const skipFetchRef = useRef(false); // skip fetch after selection

  // Sync external value changes (e.g. cleared from outside)
  useEffect(() => { setQuery(value || ""); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced fetch
  const fetchDebounced = useCallback((q) => {
    clearTimeout(debounceRef.current);
    if (q.length < 2) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(q);
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
    setOpen(false);
    setActiveIdx(-1);
    onChange?.(suggestion.label);
    onSelect?.(suggestion);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    const total = suggestions.length + (extraDropdownTop ? 1 : 0);
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, total - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const offset = extraDropdownTop ? 1 : 0;
      if (activeIdx >= offset && suggestions[activeIdx - offset]) handleSelect(suggestions[activeIdx - offset]);
      else setOpen(false);
    }
    else if (e.key === "Escape") setOpen(false);
  };

  const handleClear = () => { setQuery(""); onChange?.(""); setSuggestions([]); setOpen(false); onSelect?.(null); };

  return (
    <div className="flex-1 relative" ref={containerRef}>
      {/* Icon left */}
      <div className={`absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center border z-10 ${iconBg}`}>
        {icon || <MapPin className={`w-4 h-4 ${iconColor}`} />}
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
        className="w-full pl-16 pr-10 h-14 bg-gray-50 border border-gray-100 text-base font-semibold rounded-2xl focus:bg-white focus:border-emerald-400 focus:outline-none transition-all shadow-inner"
      />

      {/* Right: loading or clear */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        {loading
          ? <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
          : query
          ? <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleClear}><X className="w-4 h-4 text-gray-400 hover:text-gray-600" /></button>
          : null}
      </div>

      {/* Dropdown */}
      {open && (extraDropdownTop || suggestions.length > 0 || (query.length >= 2 && !loading)) && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl shadow-emerald-900/10 border border-gray-100 z-[300] overflow-hidden max-h-72 overflow-y-auto">

          {/* Extra slot (e.g. "Your location") */}
          {extraDropdownTop}

          {/* Suggestions */}
          {suggestions.map((s, i) => {
            const offset = extraDropdownTop ? 1 : 0;
            const isActive = activeIdx === i + offset;
            const parts = s.label.split(", ");
            const city = parts[0] || s.label;
            const region = parts.slice(1).join(", ");
            return (
              <button
                key={`${s.lat}-${s.lon}-${i}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isActive ? "bg-emerald-50" : "hover:bg-gray-50"}`}
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
          {!loading && query.length >= 2 && suggestions.length === 0 && !extraDropdownTop && (
            <div className="px-4 py-4 text-sm text-gray-400 font-medium text-center">No locations found.</div>
          )}
          {!loading && query.length >= 2 && suggestions.length === 0 && extraDropdownTop && (
            <div className="px-4 py-3 text-xs text-gray-400 font-medium text-center border-t border-gray-50">No locations found for "{query}"</div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
