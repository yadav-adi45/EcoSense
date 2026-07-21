import { useEffect, useState, useMemo, Fragment, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import StateMap from "./StateMap";
import { Activity, CloudSun, Compass, Droplets, Info } from "lucide-react";

/* ===== LEAFLET ICONS ===== */
const evIcon = L.divIcon({
  className: "custom-ev-marker",
  html: `<div style="background-color: #10b981; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-size: 14px;">⚡</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const originIcon = new L.Icon({
  iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/red-pushpin.png",
  iconSize: [32, 32],
  iconAnchor: [10, 32],
});

const destIcon = new L.Icon({
  iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/blue-pushpin.png",
  iconSize: [32, 32],
  iconAnchor: [10, 32],
});

/* ===== STATE MAP LOOKUPS ===== */
const STATE_NAME_TO_CODE = {
  'Andhra Pradesh': 'AP', 'Arunachal Pradesh': 'AR', 'Assam': 'AS', 'Bihar': 'BR',
  'Chhattisgarh': 'CT', 'Goa': 'GA', 'Gujarat': 'GJ', 'Haryana': 'HR',
  'Himachal Pradesh': 'HP', 'Jharkhand': 'JH', 'Karnataka': 'KA', 'Kerala': 'KL',
  'Madhya Pradesh': 'MP', 'Maharashtra': 'MH', 'Manipur': 'MN', 'Meghalaya': 'ML',
  'Mizoram': 'MZ', 'Nagaland': 'NL', 'Odisha': 'OR', 'Punjab': 'PB',
  'Rajasthan': 'RJ', 'Sikkim': 'SK', 'Tamil Nadu': 'TN', 'Telangana': 'TG',
  'Tripura': 'TR', 'Uttar Pradesh': 'UP', 'Uttarakhand': 'UT', 'West Bengal': 'WB',
  'Delhi': 'DL', 'Jammu and Kashmir': 'JK', 'Ladakh': 'LA', 'Chandigarh': 'CH',
  'Puducherry': 'PY', 'Andaman and Nicobar Islands': 'AN',
  'Dadra and Nagar Haveli and Daman and Diu': 'DN', 'Lakshadweep': 'LD'
};

const STATE_CODE_TO_NAME = Object.fromEntries(
  Object.entries(STATE_NAME_TO_CODE).map(([name, code]) => [code, name])
);

/* ===== ECO-MAP STATE ENVIRONMENT DATA ===== */
const STATE_ENV_DATA = {
  'AP': { aqi: 75, temp: 32, roadQuality: "88% Smooth", greenery: "Dense Canopy", status: "Healthy", advice: "Smooth roads & clean air. Ideal for EV travel." },
  'AR': { aqi: 35, temp: 22, roadQuality: "70% Bumpy", greenery: "Lush Forest", status: "Excellent", advice: "Extremely clean air, but terrain is rough and bumpy." },
  'AS': { aqi: 62, temp: 26, roadQuality: "75% Smooth", greenery: "Lush Forest", status: "Good", advice: "Lush foliage provides great natural canopy shade." },
  'BR': { aqi: 185, temp: 30, roadQuality: "68% Bumpy", greenery: "Moderate Grassland", status: "Unhealthy", advice: "Elevated particulate pollution. Wear protective masks." },
  'CH': { aqi: 110, temp: 28, roadQuality: "95% Smooth", greenery: "High Canopy", status: "Moderate", advice: "Perfect urban roads but moderate air haze present." },
  'CT': { aqi: 95, temp: 31, roadQuality: "80% Smooth", greenery: "High Canopy", status: "Moderate", advice: "Abundant forests balance local coal-generation emissions." },
  'DL': { aqi: 340, temp: 35, roadQuality: "90% Smooth", greenery: "Low Canopy", status: "Severe", advice: "Critical pollution levels. Restrict outdoor workouts." },
  'GA': { aqi: 45, temp: 30, roadQuality: "92% Smooth", greenery: "Dense Canopy", status: "Excellent", advice: "Coastal winds keep air fresh. Excellent highway quality." },
  'GJ': { aqi: 140, temp: 36, roadQuality: "92% Smooth", greenery: "Sparse Shrubland", status: "Moderate", advice: "High heat index. Keep hydrated during daytime travel." },
  'HR': { aqi: 240, temp: 33, roadQuality: "86% Smooth", greenery: "Low Canopy", status: "Severe", advice: "Heavy agrarian stubble haze. Prefer indoor routing." },
  'HP': { aqi: 48, temp: 18, roadQuality: "72% Bumpy", greenery: "Lush Forest", status: "Excellent", advice: "Cool mountain air. Smooth driving inside main valleys." },
  'JK': { aqi: 42, temp: 15, roadQuality: "65% Bumpy", greenery: "Lush Forest", status: "Excellent", advice: "Cold climate, check for high elevation rough roads." },
  'JH': { aqi: 125, temp: 29, roadQuality: "76% Smooth", greenery: "High Canopy", status: "Moderate", advice: "Industrial dust particles suspended. Watch out for road works." },
  'KA': { aqi: 68, temp: 28, roadQuality: "85% Smooth", greenery: "Dense Canopy", status: "Healthy", advice: "Favorable green cover and smooth, well-lit highways." },
  'KL': { aqi: 52, temp: 29, roadQuality: "88% Smooth", greenery: "Lush Forest", status: "Excellent", advice: "High humidity but excellent eco-system air quality." },
  'LA': { aqi: 30, temp: 10, roadQuality: "55% Rough", greenery: "Alpine Meadows", status: "Excellent", advice: "High altitude zone. Cold weather, ensure heavy winter gear." },
  'MP': { aqi: 115, temp: 32, roadQuality: "82% Smooth", greenery: "High Canopy", status: "Moderate", advice: "Dry inland climate. Road condition is moderately stable." },
  'MH': { aqi: 135, temp: 31, roadQuality: "87% Smooth", greenery: "Moderate Canopy", status: "Moderate", advice: "Urban vehicular dust. Good streetlights on central corridors." },
  'MN': { aqi: 40, temp: 23, roadQuality: "68% Bumpy", greenery: "Lush Forest", status: "Excellent", advice: "Pure natural atmosphere with dense forest coverage." },
  'ML': { aqi: 38, temp: 21, roadQuality: "70% Bumpy", greenery: "Lush Forest", status: "Excellent", advice: "Extremely clean air, but persistent high monsoon rainfall." },
  'MZ': { aqi: 35, temp: 22, roadQuality: "62% Bumpy", greenery: "Lush Forest", status: "Excellent", advice: "Pristine mountain forests. Roads are slippery when wet." },
  'NL': { aqi: 45, temp: 22, roadQuality: "64% Bumpy", greenery: "Lush Forest", status: "Excellent", advice: "Low human pollution. Very healthy atmosphere." },
  'OR': { aqi: 88, temp: 31, roadQuality: "79% Smooth", greenery: "High Canopy", status: "Moderate", advice: "Coastal breeze offsets inland industrial zones." },
  'PB': { aqi: 195, temp: 32, roadQuality: "89% Smooth", greenery: "Low Canopy", status: "Unhealthy", advice: "Seasonal crop harvesting dust. High particulate matter." },
  'RJ': { aqi: 155, temp: 38, roadQuality: "85% Smooth", greenery: "Desert Scrub", status: "Unhealthy", advice: "Desert sand particles and extreme summer heat waves." },
  'SK': { aqi: 32, temp: 17, roadQuality: "60% Bumpy", greenery: "Lush Forest", status: "Excellent", advice: "Pristine ecosystem. Mountain paths require high caution." },
  'TN': { aqi: 78, temp: 33, roadQuality: "90% Smooth", greenery: "Moderate Canopy", status: "Healthy", advice: "Great sea breeze. Smooth and well-lit highway structures." },
  'TG': { aqi: 85, temp: 32, roadQuality: "88% Smooth", greenery: "Moderate Canopy", status: "Healthy", advice: "Warm dry air, solid road construction around cities." },
  'TR': { aqi: 50, temp: 25, roadQuality: "68% Bumpy", greenery: "Dense Canopy", status: "Good", advice: "Rich flora. Watch for narrow pathways and potholes." },
  'UP': { aqi: 220, temp: 33, roadQuality: "82% Smooth", greenery: "Low Canopy", status: "Severe", advice: "Heavy smog in Gangetic plain. Mask recommended." },
  'UT': { aqi: 55, temp: 20, roadQuality: "74% Bumpy", greenery: "Lush Forest", status: "Excellent", advice: "Clean mountain valleys, but landslide risk during rains." },
  'WB': { aqi: 165, temp: 30, roadQuality: "78% Smooth", greenery: "Moderate Canopy", status: "Unhealthy", advice: "Dense urban concentration. Prefer eco-safe green paths." },
  'AN': { aqi: 25, temp: 28, roadQuality: "80% Smooth", greenery: "Lush Forest", status: "Excellent", advice: "Pure marine atmosphere. No major pollution zones." },
  'DN': { aqi: 90, temp: 30, roadQuality: "85% Smooth", greenery: "Moderate Canopy", status: "Moderate", advice: "Moderate coastal air quality. Paths are well paved." },
  'LD': { aqi: 20, temp: 29, roadQuality: "90% Smooth", greenery: "Dense Canopy", status: "Excellent", advice: "Unpolluted islands. Pure sea breeze and clear skies." },
  'PY': { aqi: 65, temp: 31, roadQuality: "90% Smooth", greenery: "Moderate Canopy", status: "Healthy", advice: "Clean coastal boulevard. Smooth driving parameters." }
};

/* Get risk color scale matching CivicShield heat map styles */
const getAQIColor = (aqi) => {
  if (aqi <= 50) return "rgba(16, 185, 129, 0.85)";   // Clean emerald
  if (aqi <= 100) return "rgba(132, 204, 22, 0.85)";  // Good lime
  if (aqi <= 150) return "rgba(234, 179, 8, 0.85)";   // Moderate yellow
  if (aqi <= 200) return "rgba(249, 115, 22, 0.85)";   // Unhealthy orange
  return "rgba(239, 68, 68, 0.85)";                  // Severe red
};

const getAQILabel = (aqi) => {
  if (aqi <= 50) return "Healthy";
  if (aqi <= 100) return "Good";
  if (aqi <= 150) return "Moderate";
  if (aqi <= 200) return "Unhealthy";
  return "Severe";
};

/* ===== HELPERS ===== */
const getRouteSegmentAQIColor = (aqi) => {
  if (aqi === null || aqi === undefined) return "#9CA3AF";
  if (aqi <= 50) return "#16a34a";   // green
  if (aqi <= 100) return "#ca8a04";  // yellow
  if (aqi <= 150) return "#ea580c";  // orange
  if (aqi <= 200) return "#dc2626";  // red
  return "#7c3aed";                  // purple
};

const getLabelCount = (distanceKm) => {
  if (distanceKm < 50) return 2;
  if (distanceKm < 200) return 3;
  return 5;
};

/* ===== AUTO FIT MAP ===== */
const FitBounds = ({ origin, destination }) => {
  const map = useMap();
  useEffect(() => {
    if (!origin || !destination) return;
    const bounds = L.latLngBounds(
      [origin.lat, origin.lon],
      [destination.lat, destination.lon]
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, origin, destination]);
  return null;
};

/* ===== INVALIDATE MAP SIZE HELPER ===== */
const InvalidateSizeHelper = ({ isActive }) => {
  const map = useMap();
  useEffect(() => {
    if (isActive) {
      // Small timeout ensures container display transition is fully done
      const timer = setTimeout(() => {
        map.invalidateSize({ animate: true });
        console.log("[RouteMap] Invalidated Leaflet size to force tile load");
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [map, isActive]);
  return null;
};

/* ===== MAIN MAP ORCHESTRATOR ===== */
const RouteMap = ({ routes, selectedRouteId, origin, destination, onSelectRoute }) => {
  const [selectedState, setSelectedState] = useState(null);
  const [pathData, setPathData] = useState(null);
  const [hoveredState, setHoveredState] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [showHoverBox, setShowHoverBox] = useState(false);
  const tooltipRef = useRef(null);
  const mapContainerRef = useRef(null);

  // Transition States for Smooth space-to-ground Zoom Animation
  const [heatmapScale, setHeatmapScale] = useState(1);
  const [heatmapOpacity, setHeatmapOpacity] = useState(1);
  const [mapOpacity, setMapOpacity] = useState(0);

  const showLeafletMap = destination !== null;

  // Load India SVG paths
  useEffect(() => {
    fetch('/india-paths.json')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setPathData(data))
      .catch((err) => console.error('Failed to load map paths:', err));
  }, []);

  // Manage Zoom Scale transition when Destination is searched
  useEffect(() => {
    if (showLeafletMap) {
      // Zoom out/into the ground: SVG scale up to 8x and fade out
      setHeatmapScale(8);
      setHeatmapOpacity(0);
      
      const timer = setTimeout(() => {
        setMapOpacity(1);
      }, 150);

      return () => clearTimeout(timer);
    } else {
      // Reset back to initial space-view SVG Heatmap of India
      setHeatmapScale(1);
      setHeatmapOpacity(1);
      setMapOpacity(0);
      setSelectedState(null);
    }
  }, [showLeafletMap]);

  const handleStateHover = useCallback((stateName, evt) => {
    const code = STATE_NAME_TO_CODE[stateName];
    if (!code) return;

    // Use raw viewport coordinates — the tooltip will be fixed-positioned
    const cursorX = evt.clientX;
    const cursorY = evt.clientY;

    // Tooltip dimensions from last known render, or safe defaults
    const tipW = tooltipRef.current?.offsetWidth  || 240;
    const tipH = tooltipRef.current?.offsetHeight || 300;

    const OFFSET = 14; // gap from cursor
    const PAD    = 8;  // minimum gap from viewport edge

    const vW = window.innerWidth;
    const vH = window.innerHeight;

    // Prefer right; flip left if it overflows right edge
    let x = cursorX + OFFSET;
    if (x + tipW > vW - PAD) {
      x = cursorX - tipW - OFFSET;
    }
    // Hard-clamp to never exit left edge
    x = Math.max(PAD, x);

    // Prefer below; flip above if it overflows bottom edge
    let y = cursorY + OFFSET;
    if (y + tipH > vH - PAD) {
      y = cursorY - tipH - OFFSET;
    }
    // Hard-clamp to never exit top edge
    y = Math.max(PAD, y);

    setHoveredState({ name: stateName, code, data: STATE_ENV_DATA[code] });
    setTooltipPos({ x, y });
    setShowHoverBox(true);
  }, []);

  const handleStateClick = (stateName) => {
    const code = STATE_NAME_TO_CODE[stateName];
    if (code) {
      setSelectedState(code);
      setShowHoverBox(false);
    }
  };

  const handleMouseLeave = () => {
    setShowHoverBox(false);
  };

  const leafletOrigin = origin || { lat: 28.6139, lon: 77.2090, name: "Delhi" };
  const originPos = [leafletOrigin.lat, leafletOrigin.lon];
  const destPos = destination ? [destination.lat, destination.lon] : null;

  const selectedRoute = routes.find((r) => r.id === selectedRouteId);
  const labelIndexes = new Set();

  if (selectedRoute?.pollutionSegments?.length) {
    const total = selectedRoute.pollutionSegments.length;
    const distanceKm = parseFloat(selectedRoute.distance);
    const labelsToShow = getLabelCount(distanceKm);
    for (let i = 0; i < labelsToShow; i++) {
      labelIndexes.add(Math.floor((i * total) / labelsToShow));
    }
  }

  return (
    <div className="relative w-full h-full rounded-[3rem] bg-white" style={{ overflow: "visible" }}>
      
      {/* 🗺️ LEAFLET MAP VIEW WRAPPER (Always mounted to prevent React unmount/removeChild DOM crashes) */}
      <div 
        className="absolute inset-0 w-full h-full rounded-[3rem] overflow-hidden bg-emerald-50/10 transition-opacity duration-700 ease-out"
        style={{ 
          opacity: mapOpacity, 
          zIndex: showLeafletMap ? 10 : 1,
          pointerEvents: showLeafletMap ? "auto" : "none" 
        }}
      >
        <MapContainer
          center={[22.5, 78.9]}
          zoom={4.2}
          minZoom={3}
          maxZoom={18}
          scrollWheelZoom={true}
          dragging={true}
          doubleClickZoom={true}
          zoomControl={true}
          style={{ height: "100%", width: "100%", filter: "hue-rotate(85deg) saturate(105%) brightness(1.02) contrast(95%)" }}
          className="h-full w-full rounded-[3rem]"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          <InvalidateSizeHelper isActive={showLeafletMap} />

          {destination && <FitBounds origin={leafletOrigin} destination={destination} />}

          <Marker position={originPos} icon={originIcon}>
            <Popup><strong>Origin:</strong> {leafletOrigin.name}</Popup>
          </Marker>
          {destPos && <Marker position={destPos} icon={destIcon}>
            <Popup><strong>Destination:</strong> {destination?.name}</Popup>
          </Marker>}

          {routes.map((route) => {
            const isSelected = route.id === selectedRouteId;

            if (isSelected && route.pollutionSegments?.length > 1) {
              const evMarkers = (route.evStations || []).map((ev) => (
                <Marker key={`ev-${ev.id}`} position={[ev.lat, ev.lon]} icon={evIcon}>
                  <Popup>
                    <div style={{ fontWeight: 700, color: "#10b981", textTransform: "uppercase" }}>{ev.name}</div>
                    <div style={{ fontSize: "11px", color: "#666" }}>Operator: {ev.operator}</div>
                  </Popup>
                </Marker>
              ));

              const routeLines = route.pollutionSegments.map((seg, i) => {
                if (i === route.pollutionSegments.length - 1) return null;
                const segColor = getRouteSegmentAQIColor(seg.aqi);
                const nextSeg = route.pollutionSegments[i + 1];

                return (
                  <Fragment key={`${route.id}-seg-${i}`}>
                    <Polyline
                      positions={[[seg.lat, seg.lon], [nextSeg.lat, nextSeg.lon]]}
                      pathOptions={{ color: segColor, weight: 8, opacity: 0.85, lineCap: "round" }}
                      eventHandlers={{ click: () => onSelectRoute && onSelectRoute(route.id) }}
                    >
                      {labelIndexes.has(i) && (
                        <Tooltip permanent direction="top" opacity={1}>
                          <div style={{
                            background: "#fff",
                            border: `3px solid ${segColor}`,
                            borderRadius: "10px",
                            padding: "6px 12px",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#111",
                            minWidth: "100px",
                            textAlign: "center",
                          }}>
                            <div style={{ color: segColor, fontWeight: 800 }}>{seg.zone || "Unknown"}</div>
                            <div style={{ color: "#555", fontWeight: 600 }}>AQI: {seg.aqi ?? "N/A"}</div>
                          </div>
                        </Tooltip>
                      )}
                    </Polyline>
                  </Fragment>
                );
              });

              return [...evMarkers, ...routeLines];
            }

            const positions = route.geometry?.map((p) => [p.lat, p.lon]) || [];
            const colors = ["#3b82f6", "#8b5cf6", "#f59e0b"];
            const routeColor = colors[route.id % colors.length] || "#9CA3AF";

            return (
              <Polyline
                key={route.id}
                positions={positions}
                pathOptions={{ color: routeColor, weight: 5, opacity: 0.45, dashArray: "8 4" }}
                eventHandlers={{ click: () => onSelectRoute && onSelectRoute(route.id) }}
              />
            );
          })}
        </MapContainer>
      </div>

      {/* 🗺️ DYNAMIC CIVICSHIELD-STYLE SVG HEATMAP VIEW WRAPPER */}
      <div 
        className="absolute inset-0 w-full h-full transition-all duration-700 ease-out origin-center"
        style={{ 
          opacity: heatmapOpacity,
          transform: `scale(${heatmapScale})`,
          zIndex: !showLeafletMap ? 10 : 1,
          pointerEvents: !showLeafletMap ? "auto" : "none",
          overflow: "visible",
        }}
      >
        <div className="map-container-relative w-full h-full flex flex-col items-center justify-center p-4 relative bg-gradient-to-b from-[#f0faf5] to-white rounded-[3rem]" style={{ overflow: "visible" }}>
          {selectedState ? (
            /* District-level State Map View */
            <StateMap 
              stateCode={selectedState} 
              stateData={STATE_ENV_DATA[selectedState]} 
              stateName={STATE_CODE_TO_NAME[selectedState]} 
              onBack={() => setSelectedState(null)} 
            />
          ) : (
            /* National India Heatmap View */
            <div className="w-full flex flex-col items-center">
              
              {/* Legend and Title Bar */}
              <div className="w-full flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                <div>
                  <h3 className="font-black text-gray-800 text-base leading-none">🗺️ National Health Index</h3>
                  <span className="text-[10px] font-bold text-gray-400 mt-1 block">Click any state to explore district-level details</span>
                </div>
                
                {/* Color Scale Legend */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase">AQI Scale</span>
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/50 p-1 rounded-xl text-[8px] font-black text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981]" /> Good</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#eab308]" /> Moderate</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4444]" /> Severe</span>
                  </div>
                </div>
              </div>

              {/* SVG Map of India */}
              {pathData ? (
                <div ref={mapContainerRef} className="relative w-full max-h-[460px] flex items-center justify-center" style={{ overflow: "visible" }}>
                  <svg 
                    viewBox="0 0 600 700" 
                    preserveAspectRatio="xMidYMid meet"
                    className="w-full h-full max-h-[450px]"
                  >
                    {Object.entries(pathData).map(([stateName, d]) => {
                      const code = STATE_NAME_TO_CODE[stateName];
                      const stateData = STATE_ENV_DATA[code];
                      const fillColor = stateData ? getAQIColor(stateData.aqi) : "rgba(200, 200, 200, 0.4)";

                      return (
                        <path
                          key={stateName}
                          d={d}
                          fill={fillColor}
                          stroke="rgba(255, 255, 255, 0.55)"
                          strokeWidth={hoveredState?.name === stateName ? 1.5 : 0.55}
                          onMouseEnter={(e) => handleStateHover(stateName, e)}
                          onMouseMove={(e) => handleStateHover(stateName, e)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => handleStateClick(stateName)}
                          className="cursor-pointer transition-all duration-200"
                          style={{
                            filter: hoveredState?.name === stateName ? "brightness(1.1)" : "none"
                          }}
                        />
                      );
                    })}
                  </svg>

                  {/* 📊 Smart-positioned State Tooltip — rendered via Portal into document.body
                       so it can never be clipped by any overflow:hidden ancestor */}
                  {showHoverBox && hoveredState && hoveredState.data && createPortal(
                    <div 
                      ref={tooltipRef}
                      className="w-60 bg-white/95 backdrop-blur-md shadow-2xl shadow-emerald-950/15 border border-emerald-100/60 rounded-[2rem] p-5 pointer-events-none"
                      style={{
                        position: "fixed",
                        left: tooltipPos.x,
                        top:  tooltipPos.y,
                        zIndex: 99999,
                        transition: "left 60ms ease-out, top 60ms ease-out",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <Activity className="w-3 h-3 text-emerald-600 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black text-emerald-800 uppercase tracking-widest leading-none">{hoveredState.name}</h4>
                          <span className="text-[8px] text-gray-400 font-black mt-0.5 block">State Level Metrics</span>
                        </div>
                      </div>

                      {/* AQI Indicator */}
                      <div className="border-t border-b border-gray-100/60 py-2.5 mb-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">State Avg AQI</p>
                          <p className="text-2xl font-black tracking-tight" style={{ color: getAQIColor(hoveredState.data.aqi) }}>
                            {hoveredState.data.aqi}
                          </p>
                        </div>
                        <span 
                          className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border"
                          style={{ 
                            color: getAQIColor(hoveredState.data.aqi), 
                            borderColor: `${getAQIColor(hoveredState.data.aqi)}30`, 
                            backgroundColor: `${getAQIColor(hoveredState.data.aqi)}10` 
                          }}
                        >
                          {getAQILabel(hoveredState.data.aqi)}
                        </span>
                      </div>

                      {/* Weather, Temp, Greenery */}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="flex items-center gap-1.5 bg-gray-50/50 p-1.5 rounded-lg border border-gray-100/30">
                          <CloudSun className="w-3.5 h-3.5 text-orange-400" />
                          <div>
                            <p className="text-[8px] text-gray-400 font-bold uppercase">Temp</p>
                            <p className="text-[10px] font-black text-gray-700">{hoveredState.data.temp}°C</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50/50 p-1.5 rounded-lg border border-gray-100/30">
                          <Compass className="w-3.5 h-3.5 text-emerald-400" />
                          <div>
                            <p className="text-[8px] text-gray-400 font-bold uppercase">Roads</p>
                            <p className="text-[9px] font-black text-gray-700 leading-tight">{hoveredState.data.roadQuality}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 bg-gray-50/50 p-2 rounded-lg border border-gray-100/30 mb-2 text-xs">
                        <Droplets className="w-3.5 h-3.5 text-blue-400" />
                        <div>
                          <span className="text-[8px] text-gray-400 font-bold uppercase block leading-none">Green Canopy</span>
                          <span className="font-extrabold text-[10px] text-gray-700">{hoveredState.data.greenery}</span>
                        </div>
                      </div>

                      {/* Primary Source */}
                      <div className="bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10 flex items-start gap-1.5">
                        <Info className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest block leading-none mb-1">Eco Travel Advice</span>
                          <p className="text-[9px] text-gray-500 font-bold leading-tight">{hoveredState.data.advice}</p>
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                  Loading national map data...
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default RouteMap;
