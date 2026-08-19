import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import StateMap from "./StateMap";
import { Activity, CloudSun, Compass, Droplets, Info, Layers, Map as MapIcon, Trees } from "lucide-react";

/* ===== LEAFLET ICONS ===== */
const evIcon = L.divIcon({
  className: "custom-ev-marker",
  html: `<div style="background-color: #10b981; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-size: 14px; font-weight: bold;">⚡</div>`,
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
  'AP': { aqi: 75, temp: 32, roadQuality: "88% Smooth", greenery: "Dense Canopy", status: "GOOD", advice: "Smooth roads & clean air. Ideal for EV travel." },
  'AR': { aqi: 35, temp: 22, roadQuality: "70% Bumpy", greenery: "Lush Forest", status: "GOOD", advice: "Extremely clean air, but terrain is rough and bumpy." },
  'AS': { aqi: 62, temp: 26, roadQuality: "75% Smooth", greenery: "Lush Forest", status: "GOOD", advice: "Lush foliage provides great natural canopy shade." },
  'BR': { aqi: 185, temp: 30, roadQuality: "68% Bumpy", greenery: "Moderate Grassland", status: "SEVERE", advice: "Elevated particulate pollution. Wear protective masks." },
  'CH': { aqi: 110, temp: 28, roadQuality: "95% Smooth", greenery: "High Canopy", status: "MODERATE", advice: "Perfect urban roads but moderate air haze present." },
  'CT': { aqi: 95, temp: 31, roadQuality: "80% Smooth", greenery: "High Canopy", status: "GOOD", advice: "Abundant forests balance local coal-generation emissions." },
  'DL': { aqi: 340, temp: 35, roadQuality: "90% Smooth", greenery: "Low Canopy", status: "SEVERE", advice: "Critical pollution levels. Restrict outdoor workouts." },
  'GA': { aqi: 45, temp: 30, roadQuality: "92% Smooth", greenery: "Dense Canopy", status: "GOOD", advice: "Coastal winds keep air fresh. Excellent highway quality." },
  'GJ': { aqi: 140, temp: 36, roadQuality: "92% Smooth", greenery: "Sparse Shrubland", status: "MODERATE", advice: "High heat index. Keep hydrated during daytime travel." },
  'HR': { aqi: 240, temp: 33, roadQuality: "86% Smooth", greenery: "Low Canopy", status: "SEVERE", advice: "Heavy agrarian stubble haze. Prefer indoor routing." },
  'HP': { aqi: 48, temp: 18, roadQuality: "72% Bumpy", greenery: "Lush Forest", status: "GOOD", advice: "Cool mountain air. Smooth driving inside main valleys." },
  'JK': { aqi: 42, temp: 15, roadQuality: "65% Bumpy", greenery: "Lush Forest", status: "GOOD", advice: "Cold climate, check for high elevation rough roads." },
  'JH': { aqi: 125, temp: 29, roadQuality: "76% Smooth", greenery: "High Canopy", status: "MODERATE", advice: "Industrial dust particles suspended. Watch out for road works." },
  'KA': { aqi: 68, temp: 28, roadQuality: "85% Smooth", greenery: "Dense Canopy", status: "GOOD", advice: "Favorable green cover and smooth, well-lit highways." },
  'KL': { aqi: 52, temp: 29, roadQuality: "88% Smooth", greenery: "Lush Forest", status: "GOOD", advice: "High humidity but excellent eco-system air quality." },
  'LA': { aqi: 30, temp: 10, roadQuality: "55% Rough", greenery: "Alpine Meadows", status: "GOOD", advice: "High altitude zone. Cold weather, ensure heavy winter gear." },
  'MP': { aqi: 115, temp: 32, roadQuality: "82% Smooth", greenery: "High Canopy", status: "MODERATE", advice: "Dry inland climate. Road condition is moderately stable." },
  'MH': { aqi: 135, temp: 31, roadQuality: "87% Smooth", greenery: "Moderate Canopy", status: "MODERATE", advice: "Urban vehicular dust. Good streetlights on central corridors." },
  'MN': { aqi: 40, temp: 23, roadQuality: "68% Bumpy", greenery: "Lush Forest", status: "GOOD", advice: "Pure natural atmosphere with dense forest coverage." },
  'ML': { aqi: 38, temp: 21, roadQuality: "70% Bumpy", greenery: "Lush Forest", status: "GOOD", advice: "Extremely clean air, but persistent high monsoon rainfall." },
  'MZ': { aqi: 35, temp: 22, roadQuality: "62% Bumpy", greenery: "Lush Forest", status: "GOOD", advice: "Pristine mountain forests. Roads are slippery when wet." },
  'NL': { aqi: 45, temp: 22, roadQuality: "64% Bumpy", greenery: "Lush Forest", status: "GOOD", advice: "Low human pollution. Very healthy atmosphere." },
  'OR': { aqi: 88, temp: 31, roadQuality: "79% Smooth", greenery: "High Canopy", status: "GOOD", advice: "Coastal breeze offsets inland industrial zones." },
  'PB': { aqi: 195, temp: 32, roadQuality: "89% Smooth", greenery: "Low Canopy", status: "SEVERE", advice: "Seasonal crop harvesting dust. High particulate matter." },
  'RJ': { aqi: 155, temp: 38, roadQuality: "85% Smooth", greenery: "Desert Scrub", status: "MODERATE", advice: "Desert sand particles and extreme summer heat waves." },
  'SK': { aqi: 32, temp: 17, roadQuality: "60% Bumpy", greenery: "Lush Forest", status: "GOOD", advice: "Pristine ecosystem. Mountain paths require high caution." },
  'TN': { aqi: 78, temp: 33, roadQuality: "90% Smooth", greenery: "Moderate Canopy", status: "GOOD", advice: "Great sea breeze. Smooth and well-lit highway structures." },
  'TG': { aqi: 85, temp: 32, roadQuality: "88% Smooth", greenery: "Moderate Canopy", status: "GOOD", advice: "Warm dry air, solid road construction around cities." },
  'TR': { aqi: 50, temp: 25, roadQuality: "68% Bumpy", greenery: "Dense Canopy", status: "GOOD", advice: "Rich flora. Watch for narrow pathways and potholes." },
  'UP': { aqi: 220, temp: 33, roadQuality: "82% Smooth", greenery: "Low Canopy", status: "SEVERE", advice: "Heavy smog in Gangetic plain. Mask recommended." },
  'UT': { aqi: 55, temp: 20, roadQuality: "74% Bumpy", greenery: "Lush Forest", status: "GOOD", advice: "Clean mountain valleys, but landslide risk during rains." },
  'WB': { aqi: 165, temp: 30, roadQuality: "78% Smooth", greenery: "Moderate Canopy", status: "MODERATE", advice: "Dense urban concentration. Prefer eco-safe green paths." },
  'AN': { aqi: 25, temp: 28, roadQuality: "80% Smooth", greenery: "Lush Forest", status: "GOOD", advice: "Pure marine atmosphere. No major pollution zones." },
  'DN': { aqi: 90, temp: 30, roadQuality: "85% Smooth", greenery: "Moderate Canopy", status: "GOOD", advice: "Moderate coastal air quality. Paths are well paved." },
  'LD': { aqi: 20, temp: 29, roadQuality: "90% Smooth", greenery: "Dense Canopy", status: "GOOD", advice: "Unpolluted islands. Pure sea breeze and clear skies." },
  'PY': { aqi: 65, temp: 31, roadQuality: "90% Smooth", greenery: "Moderate Canopy", status: "GOOD", advice: "Clean coastal boulevard. Smooth driving parameters." }
};

const getAQIColor = (aqi) => {
  if (aqi <= 50) return "rgba(16, 185, 129, 0.85)";
  if (aqi <= 100) return "rgba(132, 204, 22, 0.85)";
  if (aqi <= 150) return "rgba(234, 179, 8, 0.85)";
  if (aqi <= 200) return "rgba(249, 115, 22, 0.85)";
  return "rgba(239, 68, 68, 0.85)";
};

const getRouteSegmentAQIColor = (aqi) => {
  if (aqi === null || aqi === undefined) return "#9CA3AF";
  if (aqi <= 50) return "#16a34a";
  if (aqi <= 100) return "#ca8a04";
  if (aqi <= 150) return "#ea580c";
  if (aqi <= 200) return "#dc2626";
  return "#7c3aed";
};

const getLabelCount = (distanceKm) => {
  if (distanceKm < 50) return 2;
  if (distanceKm < 200) return 3;
  return 5;
};

const RouteMap = ({ routes = [], selectedRouteId = 0, origin, destination, onSelectRoute }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const layerGroupRef = useRef(null);

  // Determine active view: If routes exist, show "map" by default. Otherwise show "heatmap".
  const hasRoutes = routes && routes.length > 0;
  const [userViewOverride, setUserViewOverride] = useState(null); // null | "map" | "heatmap"
  const currentView = userViewOverride || (hasRoutes ? "map" : "heatmap");

  // SVG Heatmap State
  const [selectedState, setSelectedState] = useState(null);
  const [pathData, setPathData] = useState(null);
  const [hoveredState, setHoveredState] = useState(null);

  // Load India SVG paths for Heatmap view
  useEffect(() => {
    fetch("/india-paths.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setPathData(data))
      .catch((err) => console.error("Failed to load map paths:", err));
  }, []);

  const handleStateHover = useCallback((stateName) => {
    const code = STATE_NAME_TO_CODE[stateName];
    if (!code) return;
    setHoveredState({ name: stateName, code, data: STATE_ENV_DATA[code] });
  }, []);

  const handleStateClick = (stateName) => {
    const code = STATE_NAME_TO_CODE[stateName];
    if (code) {
      setSelectedState(code);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [22.5, 78.9],
        zoom: 5,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapRef.current = map;

      const handleResize = () => map.invalidateSize();
      window.addEventListener("resize", handleResize);

      setTimeout(() => map.invalidateSize(), 150);
      setTimeout(() => map.invalidateSize(), 500);
    }
  }, []);

  // Update Route Layers, Polylines, Markers, and Bounds
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const leafletOrigin = origin || { lat: 28.6139, lon: 77.2090, name: "Delhi" };
    const destPos = destination && destination.lat && destination.lon ? destination : null;

    const bounds = L.latLngBounds();

    // 1. Origin Marker
    if (leafletOrigin?.lat && leafletOrigin?.lon) {
      const origMarker = L.marker([leafletOrigin.lat, leafletOrigin.lon], {
        icon: originIcon,
      }).bindPopup(`<strong>Origin:</strong> ${leafletOrigin.name || "Delhi"}`);
      layerGroup.addLayer(origMarker);
      bounds.extend([leafletOrigin.lat, leafletOrigin.lon]);
    }

    // 2. Destination Marker
    if (destPos?.lat && destPos?.lon) {
      const destMarker = L.marker([destPos.lat, destPos.lon], {
        icon: destIcon,
      }).bindPopup(`<strong>Destination:</strong> ${destPos.name || "Destination"}`);
      layerGroup.addLayer(destMarker);
      bounds.extend([destPos.lat, destPos.lon]);
    }

    // 3. Render Routes
    if (routes && routes.length > 0) {
      const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

      // Draw non-selected routes in background (dashed)
      routes.forEach((route) => {
        if (route.id === activeRoute.id) return;
        if (route.geometry && route.geometry.length > 1) {
          const coords = route.geometry.map((p) => [p.lat, p.lon]);
          const polyline = L.polyline(coords, {
            color: "#94a3b8",
            weight: 5,
            opacity: 0.5,
            dashArray: "8 5",
          });
          polyline.on("click", () => onSelectRoute && onSelectRoute(route.id));
          layerGroup.addLayer(polyline);
        }
      });

      // Draw active selected route
      if (activeRoute.pollutionSegments && activeRoute.pollutionSegments.length > 1) {
        const segments = activeRoute.pollutionSegments.filter(
          (s) => s && s.lat != null && s.lon != null
        );

        const totalSegs = segments.length;
        const distanceKm = parseFloat(activeRoute.distance) || 100;
        const labelsToShow = getLabelCount(distanceKm);
        const labelIndexes = new Set();
        for (let i = 0; i < labelsToShow; i++) {
          labelIndexes.add(Math.floor((i * totalSegs) / labelsToShow));
        }

        // Add EV station markers
        (activeRoute.evStations || []).forEach((ev) => {
          if (ev.lat && ev.lon) {
            const evMarker = L.marker([ev.lat, ev.lon], { icon: evIcon }).bindPopup(`
              <div style="font-weight:700; color:#10b981; text-transform:uppercase;">⚡ ${ev.name}</div>
              <div style="font-size:11px; color:#666;">Operator: ${ev.operator || "EV Network"}</div>
            `);
            layerGroup.addLayer(evMarker);
          }
        });

        // Add colored AQI polyline segments
        for (let i = 0; i < segments.length - 1; i++) {
          const seg = segments[i];
          const nextSeg = segments[i + 1];
          const segColor = getRouteSegmentAQIColor(seg.aqi);

          const polyline = L.polyline(
            [
              [seg.lat, seg.lon],
              [nextSeg.lat, nextSeg.lon],
            ],
            {
              color: segColor,
              weight: 8,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            }
          );

          if (labelIndexes.has(i)) {
            polyline.bindTooltip(
              `
              <div style="
                background: #fff;
                border: 3px solid ${segColor};
                border-radius: 10px;
                padding: 6px 12px;
                box-shadow: 0 2px 12px rgba(0,0,0,0.15);
                font-size: 13px;
                font-weight: 700;
                color: #111;
                min-width: 100px;
                text-align: center;
              ">
                <div style="color: ${segColor}; font-weight: 800;">${seg.zone || "Zone"}</div>
                <div style="color: #555; font-weight: 600;">AQI: ${seg.aqi ?? "N/A"}</div>
              </div>
            `,
              { permanent: true, direction: "top", opacity: 1 }
            );
          }

          polyline.on("click", () => onSelectRoute && onSelectRoute(activeRoute.id));
          layerGroup.addLayer(polyline);
          bounds.extend([seg.lat, seg.lon]);
        }
      } else if (activeRoute.geometry && activeRoute.geometry.length > 1) {
        const coords = activeRoute.geometry.map((p) => [p.lat, p.lon]);
        const polyline = L.polyline(coords, {
          color: "#10b981",
          weight: 7,
          opacity: 0.9,
        });
        layerGroup.addLayer(polyline);
        coords.forEach((c) => bounds.extend(c));
      }
    }

    // Auto-fit bounds
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    } else if (leafletOrigin?.lat && leafletOrigin?.lon) {
      map.setView([leafletOrigin.lat, leafletOrigin.lon], 9);
    }
  }, [routes, selectedRouteId, origin, destination, onSelectRoute]);

  // Invalidate map size when view switches to "map"
  useEffect(() => {
    if (currentView === "map" && mapRef.current) {
      setTimeout(() => mapRef.current.invalidateSize(), 50);
      setTimeout(() => mapRef.current.invalidateSize(), 200);
    }
  }, [currentView]);

  return (
    <div className="relative w-full h-full bg-white overflow-hidden select-none flex flex-col">
      
      {/* ── View Switcher Pill (Top-Left) ── */}
      {hasRoutes && (
        <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-lg border border-gray-200/80 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setUserViewOverride("map")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              currentView === "map"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Route Map</span>
          </button>
          <button
            type="button"
            onClick={() => setUserViewOverride("heatmap")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              currentView === "heatmap"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>National AQI</span>
          </button>
        </div>
      )}

      {/* ════ VIEW 1: LEAFLET ROUTE MAP ════ */}
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{
          display: currentView === "map" ? "block" : "none",
          height: "100%",
          width: "100%",
        }}
      />

      {/* ════ VIEW 2: NATIONAL HEALTH INDEX HEATMAP (FIRST IMAGE) ════ */}
      <div
        className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#f0faf5] to-white p-2 sm:p-4 flex flex-col"
        style={{
          display: currentView === "heatmap" ? "flex" : "none",
          height: "100%",
          width: "100%",
        }}
      >
        {selectedState ? (
          <StateMap
            stateCode={selectedState}
            stateData={STATE_ENV_DATA[selectedState]}
            stateName={STATE_CODE_TO_NAME[selectedState]}
            onBack={() => setSelectedState(null)}
          />
        ) : (
          <div className="w-full h-full flex flex-col relative">
            
            {/* Header & AQI Scale Legend */}
            <div className="w-full flex items-center justify-between border-b border-emerald-100/60 pb-1.5 mb-1 z-10 shrink-0 px-2">
              <div>
                <h3 className="font-black text-gray-900 text-base sm:text-lg flex items-center gap-2">
                  <span>🗺️</span> National Health Index
                </h3>
                <span className="text-xs font-bold text-gray-400 mt-0.5 block">
                  Click any state to explore district-level details
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase">AQI Scale</span>
                <div className="flex items-center gap-2 bg-white border border-gray-200/80 p-1.5 rounded-xl text-[10px] font-black text-gray-600 shadow-sm">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Good
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" /> Moderate
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /> Severe
                  </span>
                </div>
              </div>
            </div>

            {/* Main Interactive Map Canvas + Floating South-East Info Card */}
            {pathData ? (
              <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
                
                {/* SVG India Map — Natural Size */}
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    viewBox="0 0 600 700"
                    preserveAspectRatio="xMidYMid meet"
                    className="w-full h-full max-h-[calc(100vh-8.5rem)] max-w-full drop-shadow-xl transition-transform duration-300"
                  >
                    {Object.entries(pathData).map(([stateName, d]) => {
                      const code = STATE_NAME_TO_CODE[stateName];
                      const stateData = STATE_ENV_DATA[code];
                      const fillColor = stateData
                        ? getAQIColor(stateData.aqi)
                        : "rgba(200, 200, 200, 0.4)";
                      const isHovered = hoveredState?.name === stateName;

                      return (
                        <path
                          key={stateName}
                          d={d}
                          fill={fillColor}
                          stroke="rgba(255, 255, 255, 0.85)"
                          strokeWidth={isHovered ? 2.5 : 0.8}
                          onMouseEnter={() => handleStateHover(stateName)}
                          onClick={() => handleStateClick(stateName)}
                          className="cursor-pointer transition-all duration-200"
                          style={{
                            filter: isHovered
                              ? "brightness(1.15) drop-shadow(0 4px 12px rgba(0,0,0,0.3))"
                              : "none",
                            transform: isHovered ? "scale(1.01)" : "scale(1)",
                            transformOrigin: "center",
                          }}
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* State Hover Info Card (Floating in South-East / Sri Lanka ocean area) */}
                <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-7 z-30 w-80 sm:w-[340px] pointer-events-auto">
                  <div className="w-full bg-white/95 backdrop-blur-md shadow-2xl shadow-emerald-950/20 border border-emerald-100/90 rounded-[2.2rem] p-5 sm:p-6 transition-all">
                    {hoveredState && hoveredState.data ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <Activity className="w-4.5 h-4.5 text-emerald-600 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-base font-black text-emerald-950 uppercase tracking-wider leading-none">
                              {hoveredState.name}
                            </h4>
                            <span className="text-[10px] text-gray-400 font-bold mt-1 block">
                              State Level Metrics
                            </span>
                          </div>
                        </div>

                        {/* State Avg AQI */}
                        <div className="border-t border-b border-gray-100/80 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              State Avg AQI
                            </p>
                            <p
                              className="text-3xl sm:text-4xl font-black tracking-tight mt-0.5"
                              style={{ color: getAQIColor(hoveredState.data.aqi) }}
                            >
                              {hoveredState.data.aqi}
                            </p>
                          </div>
                          <span
                            className="px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border shadow-sm"
                            style={{
                              color: getAQIColor(hoveredState.data.aqi),
                              borderColor: `${getAQIColor(hoveredState.data.aqi)}40`,
                              backgroundColor: `${getAQIColor(hoveredState.data.aqi)}15`,
                            }}
                          >
                            {hoveredState.data.status || "GOOD"}
                          </span>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="bg-gray-50/90 p-3 rounded-2xl border border-gray-100/80">
                            <div className="flex items-center gap-1.5 mb-1">
                              <CloudSun className="w-4 h-4 text-orange-400" />
                              <span className="text-[9px] text-gray-400 font-bold uppercase">Temp</span>
                            </div>
                            <p className="text-sm font-black text-gray-800">{hoveredState.data.temp}°C</p>
                          </div>
                          <div className="bg-gray-50/90 p-3 rounded-2xl border border-gray-100/80">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Compass className="w-4 h-4 text-emerald-500" />
                              <span className="text-[9px] text-gray-400 font-bold uppercase">Roads</span>
                            </div>
                            <p className="text-xs font-black text-gray-800 leading-tight">
                              {hoveredState.data.roadQuality}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-50/90 p-3 rounded-2xl border border-gray-100/80 flex items-center gap-2.5">
                          <Trees className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                          <div>
                            <span className="text-[9px] text-gray-400 font-bold uppercase block">Green Canopy</span>
                            <p className="text-xs font-black text-emerald-900 mt-0.5">{hoveredState.data.greenery}</p>
                          </div>
                        </div>

                        {/* Eco Travel Advice */}
                        <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-100/80 flex items-start gap-2.5">
                          <Info className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-black text-emerald-950 uppercase tracking-wider block leading-none mb-1">
                              Eco Travel Advice
                            </span>
                            <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                              {hoveredState.data.advice}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                          <Activity className="w-6 h-6 text-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-xs font-black text-gray-700 uppercase tracking-wider">
                          Hover over any state
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 max-w-[200px] leading-relaxed">
                          to view real-time state air quality, road index & canopy metrics
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                Loading national health index data...
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default RouteMap;
