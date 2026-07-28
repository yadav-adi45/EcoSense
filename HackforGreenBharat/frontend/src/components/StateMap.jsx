import { useState, useEffect, useMemo } from 'react';
import { getStateMapUrl } from '../utils/stateMapRegistry';
import { Activity, CloudSun, Compass, Droplets, Info } from 'lucide-react';

/* Get color based on environmental AQI score */
const getAQIColor = (aqi) => {
  if (aqi <= 50) return "#10b981";   // Healthy Green
  if (aqi <= 100) return "#84cc16";  // Good Lime
  if (aqi <= 150) return "#eab308";  // Moderate Yellow
  if (aqi <= 200) return "#f97316";  // Unhealthy Orange
  return "#ef4444";                  // Severe Red
};

export default function StateMap({ stateCode, stateData, stateName, onBack }) {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  // Load state map data
  useEffect(() => {
    if (!stateCode) return;

    setLoading(true);
    setError(null);

    const url = getStateMapUrl(stateCode);
    if (!url) {
      setError(`No map configuration found for: ${stateCode}`);
      setLoading(false);
      return;
    }

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: Failed to load state map`);
        return r.json();
      })
      .then((data) => {
        setMapData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [stateCode]);

  // Adjust color brightness for visual depth between districts
  const districtColors = useMemo(() => {
    if (!mapData?.districts) return {};
    const baseColor = getAQIColor(stateData?.aqi || 100);
    const colors = {};
    const districtNames = Object.keys(mapData.districts);

    districtNames.forEach((districtName, i) => {
      const variation = 0.85 + (i % 5) * 0.06;
      colors[districtName] = adjustBrightness(baseColor, variation);
    });

    return colors;
  }, [mapData, stateData]);

  // Dynamic details for districts (derived deterministically based on district name hash)
  const getDistrictDetails = (districtName) => {
    // Generate deterministic hash code from name
    let hash = 0;
    for (let i = 0; i < districtName.length; i++) {
      hash = districtName.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);

    const baseAQI = stateData?.aqi || 80;
    const aqi = Math.max(15, Math.min(500, baseAQI + (hash % 41) - 20));
    const temp = Math.max(10, Math.min(42, (stateData?.temp || 28) + (hash % 7) - 3));
    const humidity = Math.max(20, Math.min(95, 55 + (hash % 31) - 15));
    const windSpeed = Math.max(3, Math.min(25, 8 + (hash % 11) - 5));

    let level = "Good";
    let statusColor = "#10b981";
    let source = "Forests & Natural Canopy";
    if (aqi > 250) {
      level = "Severe";
      statusColor = "#ef4444";
      source = "Industrial Flue & Vehicular Congestion";
    } else if (aqi > 150) {
      level = "Unhealthy";
      statusColor = "#f97316";
      source = "Heavy Diesel Emissions & Construction";
    } else if (aqi > 80) {
      level = "Moderate";
      statusColor = "#eab308";
      source = "Crop Residue & Dust Suspension";
    }

    return { aqi, level, statusColor, temp, humidity, windSpeed, source };
  };

  const hoveredDistrictData = useMemo(() => {
    if (!hoveredDistrict) return null;
    return getDistrictDetails(hoveredDistrict);
  }, [hoveredDistrict, stateData]);

  // Filter districts based on search query
  const filteredDistricts = useMemo(() => {
    if (!mapData?.districts || !searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase().trim();
    return Object.keys(mapData.districts).filter(name =>
      name.toLowerCase().includes(query)
    );
  }, [mapData, searchQuery]);

  const handleMouseMove = (evt) => {
    const container = evt.currentTarget.closest('.relative');
    const rect = container ? container.getBoundingClientRect() : evt.currentTarget.closest('.state-map-wrapper').getBoundingClientRect();
    setMousePos({
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
      containerWidth: rect.width,
      containerHeight: rect.height,
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-gray-500 font-bold">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        Loading district boundaries...
      </div>
    );
  }

  if (error || !mapData) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-red-500 text-center p-6">
        <div className="text-4xl mb-2">⚠️</div>
        <div className="font-extrabold text-lg">Failed to load state map</div>
        <div className="text-xs text-gray-400 mt-1">{error}</div>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold">
          Go Back
        </button>
      </div>
    );
  }

  const districtNames = Object.keys(mapData.districts);

  return (
    <div className="state-map-wrapper w-full relative flex flex-col items-center justify-center p-4">
      
      {/* Header Panel */}
      <div className="w-full flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <button 
            onClick={onBack}
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 font-black flex items-center justify-center transition-all"
            title="Back to India Map"
          >
            ←
          </button>
          <div>
            <h3 className="font-black text-gray-800 text-lg leading-none">📍 {stateName} Districts</h3>
            <span className="text-[10px] font-bold text-gray-400 mt-1 block">Click "←" to view India map</span>
          </div>
        </div>

        {/* State Average AQI Badge */}
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/50">
          <span className="text-[9px] font-black text-gray-400 uppercase">State Avg AQI</span>
          <span 
            className="font-black text-sm px-2 py-0.5 rounded-lg"
            style={{ 
              color: getAQIColor(stateData?.aqi || 100),
              backgroundColor: `${getAQIColor(stateData?.aqi || 100)}15`
            }}
          >
            {stateData?.aqi || "N/A"}
          </span>
        </div>
      </div>

      {/* District Search */}
      <div className="w-full max-w-md relative mb-4">
        <input
          type="text"
          className="w-full h-11 px-4 pr-10 text-xs font-bold bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          placeholder={`Search ${mapData.districtCount} districts in ${stateName}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 font-bold text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* SVG Viewport */}
      <div className="relative w-full max-h-[460px] overflow-hidden flex items-center justify-center">
        <svg
          viewBox={mapData.viewBox}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full max-h-[450px]"
          onMouseMove={handleMouseMove}
        >
          {districtNames.map((districtName) => {
            const isHovered = hoveredDistrict === districtName;
            const isHighlighted = filteredDistricts && filteredDistricts.includes(districtName);
            const isDimmed = filteredDistricts && !isHighlighted;

            return (
              <path
                key={districtName}
                d={mapData.districts[districtName]}
                fill={districtColors[districtName] || getAQIColor(stateData?.aqi || 100)}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth={isHovered || isHighlighted ? 1.5 : 0.55}
                onMouseEnter={() => setHoveredDistrict(districtName)}
                onMouseLeave={() => setHoveredDistrict(null)}
                className="cursor-pointer transition-all duration-200"
                style={{
                  opacity: isDimmed ? 0.25 : 1,
                  filter: isHovered ? 'brightness(1.12)' : 'none',
                }}
              />
            );
          })}
        </svg>

        {/* 📊 District Floating Tooltip adjacent to cursor */}
        {hoveredDistrict && hoveredDistrictData && (
          <div 
            className="absolute z-[1000] w-56 bg-white/95 backdrop-blur-md shadow-2xl shadow-emerald-950/15 border border-emerald-100/60 rounded-[2rem] p-4 pointer-events-none transition-all duration-75"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
              transform: `translate(${
                mousePos.containerWidth
                  ? mousePos.x > mousePos.containerWidth / 2
                    ? "-110%"
                    : "10%"
                  : mousePos.x > 300
                  ? "-110%"
                  : "10%"
              }, ${
                mousePos.containerHeight
                  ? mousePos.y > mousePos.containerHeight / 2
                    ? "-110%"
                    : "10%"
                  : mousePos.y > 280
                  ? "-110%"
                  : "10%"
              })`,
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Activity className="w-3 h-3 text-emerald-600 animate-pulse" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none">{hoveredDistrict}</h4>
                <span className="text-[8px] text-gray-400 font-black mt-0.5 block">{stateName}</span>
              </div>
            </div>

            {/* AQI Indicator */}
            <div className="border-t border-b border-gray-100/60 py-2.5 mb-2.5 flex items-center justify-between">
              <div>
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Air Quality</p>
                <p className="text-2xl font-black tracking-tight" style={{ color: hoveredDistrictData.statusColor }}>
                  {hoveredDistrictData.aqi}
                </p>
              </div>
              <span 
                className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border"
                style={{ 
                  color: hoveredDistrictData.statusColor, 
                  borderColor: `${hoveredDistrictData.statusColor}30`, 
                  backgroundColor: `${hoveredDistrictData.statusColor}10` 
                }}
              >
                {hoveredDistrictData.level}
              </span>
            </div>

            {/* Weather & Temp */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="flex items-center gap-1.5 bg-gray-50/50 p-1.5 rounded-lg border border-gray-100/30">
                <CloudSun className="w-3.5 h-3.5 text-orange-400" />
                <div>
                  <p className="text-[8px] text-gray-400 font-bold uppercase">Temp</p>
                  <p className="text-[10px] font-black text-gray-700">{hoveredDistrictData.temp}°C</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50/50 p-1.5 rounded-lg border border-gray-100/30">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <div>
                  <p className="text-[8px] text-gray-400 font-bold uppercase">Wind</p>
                  <p className="text-[10px] font-black text-gray-700">{hoveredDistrictData.windSpeed}km/h</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-gray-50/50 p-2 rounded-lg border border-gray-100/30 mb-2 text-xs">
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              <div>
                <span className="text-[8px] text-gray-400 font-bold uppercase block leading-none">Humidity</span>
                <span className="font-extrabold text-[10px] text-gray-700">{hoveredDistrictData.humidity}%</span>
              </div>
            </div>

            {/* Primary Source */}
            <div className="bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10 flex items-start gap-1.5">
              <Info className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest block leading-none mb-1">Primary Source</span>
                <p className="text-[9px] text-gray-500 font-bold leading-tight">{hoveredDistrictData.source}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function adjustBrightness(color, factor) {
  let r, g, b;
  if (color.startsWith('#')) {
    r = parseInt(color.slice(1, 3), 16);
    g = parseInt(color.slice(3, 5), 16);
    b = parseInt(color.slice(5, 7), 16);
  } else if (color.startsWith('rgb')) {
    const match = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (match) {
      r = parseInt(match[1], 10);
      g = parseInt(match[2], 10);
      b = parseInt(match[3], 10);
    } else {
      return color;
    }
  } else {
    return color;
  }
  const nr = Math.min(255, Math.max(0, Math.round(r * factor)));
  const ng = Math.min(255, Math.max(0, Math.round(g * factor)));
  const nb = Math.min(255, Math.max(0, Math.round(b * factor)));
  return `rgb(${nr}, ${ng}, ${nb})`;
}
