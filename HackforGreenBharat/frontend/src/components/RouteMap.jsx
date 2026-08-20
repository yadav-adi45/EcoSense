import { useEffect, useState, useMemo, Fragment, useRef, useCallback } from "react";
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

/* ===== GOOGLE MAPS STYLE ICONS ===== */
const evIcon = L.divIcon({
  className: "custom-ev-marker",
  html: `<div style="background-color: #0f9d58; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.35); font-size: 13px;">⚡</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const originIcon = L.divIcon({
  className: "google-origin-marker",
  html: `
    <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(66, 133, 244, 0.3); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 18px; height: 18px; border-radius: 50%; background: #1a73e8; border: 3.5px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const destIcon = L.divIcon({
  className: "google-dest-marker",
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));">
      <svg width="30" height="40" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.37258 0 0 5.37258 0 12C0 20.5 12 32 12 32C12 32 24 20.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="#EA4335"/>
        <circle cx="12" cy="11.5" r="4.5" fill="white"/>
        <circle cx="12" cy="11.5" r="2.5" fill="#B31412"/>
      </svg>
    </div>
  `,
  iconSize: [30, 40],
  iconAnchor: [15, 38],
});

const animalHazardIcon = L.divIcon({
  className: "wildlife-hazard-marker",
  html: `
    <div style="background: #dc2626; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(220,38,38,0.5); font-size: 13px; animation: pulse 2s infinite;">
      🐾
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
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
      map.invalidateSize({ animate: false });
      const t1 = setTimeout(() => map.invalidateSize({ animate: true }), 100);
      const t2 = setTimeout(() => map.invalidateSize({ animate: true }), 400);
      const t3 = setTimeout(() => map.invalidateSize({ animate: true }), 800);
      const t4 = setTimeout(() => map.invalidateSize({ animate: true }), 1200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [map, isActive]);
  return null;
};

/* ===== MAIN MAP ORCHESTRATOR ===== */
const RouteMap = ({ routes, selectedRouteId, origin, destination, onSelectRoute }) => {
  const [selectedState, setSelectedState] = useState(null);
  const [pathData, setPathData] = useState(null);
  const [hoveredState, setHoveredState] = useState(null);

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

  const handleMouseLeave = () => {};

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

  const [mapStyle, setMapStyle] = useState("roadmap");

  const TILE_LAYERS = {
    roadmap: {
      url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
      attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
    },
    satellite: {
      url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      attribution: '&copy; <a href="https://www.google.com/maps">Google Maps Satellite</a>',
    },
    terrain: {
      url: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
      attribution: '&copy; <a href="https://www.google.com/maps">Google Maps Terrain</a>',
    },
  };

  return (
    <div className="relative w-full h-full rounded-[3rem] bg-white overflow-hidden" style={{ overflow: "visible" }}>
      
      {/* 🗺️ LEAFLET MAP VIEW WRAPPER */}
      <div 
        className="absolute inset-0 w-full h-full rounded-[3rem] overflow-hidden bg-slate-100 transition-opacity duration-700 ease-out"
        style={{ 
          opacity: mapOpacity, 
          zIndex: showLeafletMap ? 10 : 1,
          pointerEvents: showLeafletMap ? "auto" : "none" 
        }}
      >
        {/* Google Maps Style Layer Switcher Floating Control */}
        <div className="absolute top-4 right-4 z-[400] flex bg-white/95 backdrop-blur-md rounded-2xl p-1 shadow-lg shadow-black/10 border border-gray-200/90 text-xs font-bold text-gray-700">
          <button
            type="button"
            onClick={() => setMapStyle("roadmap")}
            className={`px-3 py-1.5 rounded-xl transition-all ${mapStyle === "roadmap" ? "bg-blue-600 text-white shadow-sm font-black" : "hover:bg-gray-100 text-gray-600 font-bold"}`}
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => setMapStyle("satellite")}
            className={`px-3 py-1.5 rounded-xl transition-all ${mapStyle === "satellite" ? "bg-blue-600 text-white shadow-sm font-black" : "hover:bg-gray-100 text-gray-600 font-bold"}`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => setMapStyle("terrain")}
            className={`px-3 py-1.5 rounded-xl transition-all ${mapStyle === "terrain" ? "bg-blue-600 text-white shadow-sm font-black" : "hover:bg-gray-100 text-gray-600 font-bold"}`}
          >
            Terrain
          </button>
        </div>

        <MapContainer
          center={[22.5, 78.9]}
          zoom={4.2}
          minZoom={3}
          maxZoom={20}
          zoomSnap={0.5}
          zoomDelta={0.5}
          wheelPxPerZoomLevel={100}
          scrollWheelZoom={true}
          dragging={true}
          doubleClickZoom={true}
          zoomControl={true}
          style={{ height: "100%", width: "100%" }}
          className="h-full w-full rounded-[3rem]"
        >
          <TileLayer
            key={mapStyle}
            url={TILE_LAYERS[mapStyle]?.url || TILE_LAYERS.roadmap.url}
            attribution={TILE_LAYERS[mapStyle]?.attribution || TILE_LAYERS.roadmap.attribution}
            maxNativeZoom={19}
            maxZoom={20}
            keepBuffer={8}
            crossOrigin="anonymous"
          />

          <InvalidateSizeHelper isActive={showLeafletMap} />

          {destination && <FitBounds origin={leafletOrigin} destination={destination} />}

          {/* Origin & Destination Google-Style Pins */}
          <Marker position={originPos} icon={originIcon}>
            <Popup>
              <div className="text-xs font-black text-gray-800">
                <span className="text-blue-600">● START:</span> {leafletOrigin.name}
              </div>
            </Popup>
          </Marker>

          {destPos && (
            <Marker position={destPos} icon={destIcon}>
              <Popup>
                <div className="text-xs font-black text-gray-800">
                  <span className="text-red-600">📍 DESTINATION:</span> {destination?.name}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Render Full Curved Road Geometries (Google Maps Navigation Style) */}
          {routes.map((route) => {
            const isSelected = route.id === selectedRouteId;
            const fullRoadCoords = route.geometry?.map((p) => [p.lat, p.lon]) || [];

            if (isSelected) {
              const evMarkers = (route.evStations || []).map((ev) => (
                <Marker key={`ev-${ev.id}`} position={[ev.lat, ev.lon]} icon={evIcon}>
                  <Popup>
                    <div style={{ fontWeight: 800, color: "#0f9d58", textTransform: "uppercase" }}>{ev.name}</div>
                    <div style={{ fontSize: "11px", color: "#555" }}>EV Fast Charger • {ev.operator}</div>
                  </Popup>
                </Marker>
              ));

              // Wildlife hazard markers along route
              const hazardMarkers = (route.pollutionSegments || [])
                .filter((seg) => (route.animalRisk?.maxRisk > 40 || route.maxAnimalRisk > 40) && seg.lat && seg.lon)
                .slice(0, 2)
                .map((seg, idx) => (
                  <Marker key={`hazard-${idx}`} position={[seg.lat, seg.lon]} icon={animalHazardIcon}>
                    <Popup>
                      <div className="text-xs font-black text-red-600 uppercase">🐾 Wildlife Danger Zone</div>
                      <div className="text-[11px] text-gray-600">High animal crossing accident record</div>
                    </Popup>
                  </Marker>
                ));

              // Air Quality Checkpoint badges
              const aqiMarkers = (route.pollutionSegments || []).map((seg, i) => {
                if (!labelIndexes.has(i) || !seg.lat || !seg.lon) return null;
                const segColor = getRouteSegmentAQIColor(seg.aqi);
                return (
                  <Marker
                    key={`aqi-checkpoint-${i}`}
                    position={[seg.lat, seg.lon]}
                    icon={L.divIcon({
                      className: "aqi-pill-marker",
                      html: `
                        <div style="background: white; border: 2px solid ${segColor}; border-radius: 20px; padding: 3px 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.25); font-size: 11px; font-weight: 800; color: #1f2937; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
                          <span style="width: 7px; height: 7px; border-radius: 50%; background: ${segColor};"></span>
                          <span>AQI ${seg.aqi ?? 'N/A'}</span>
                        </div>
                      `,
                      iconSize: [80, 24],
                      iconAnchor: [40, 12],
                    })}
                  >
                    <Popup>
                      <div className="text-xs font-bold text-gray-800">
                        <div><strong>Area:</strong> {seg.area || 'Checkpoint'}</div>
                        <div><strong>Air Quality:</strong> {seg.zone} (AQI: {seg.aqi})</div>
                      </div>
                    </Popup>
                  </Marker>
                );
              });

              return (
                <Fragment key={`selected-route-${route.id}`}>
                  {/* Google Maps Route Casing (Dark Blue Outer Border) */}
                  <Polyline
                    positions={fullRoadCoords}
                    pathOptions={{
                      color: "#185ABC",
                      weight: 8,
                      opacity: 0.95,
                      lineCap: "round",
                      lineJoin: "round",
                    }}
                  />
                  {/* Google Maps Route Core (Vibrant Blue Highway) */}
                  <Polyline
                    positions={fullRoadCoords}
                    pathOptions={{
                      color: "#1A73E8",
                      weight: 5,
                      opacity: 1,
                      lineCap: "round",
                      lineJoin: "round",
                    }}
                  />
                  {evMarkers}
                  {hazardMarkers}
                  {aqiMarkers}
                </Fragment>
              );
            }

            // Unselected Alternative Routes (Google Maps Grey Route)
            return (
              <Polyline
                key={`alt-route-${route.id}`}
                positions={fullRoadCoords}
                pathOptions={{
                  color: "#9AA0A6",
                  weight: 5,
                  opacity: 0.7,
                  lineCap: "round",
                  lineJoin: "round",
                }}
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

              {/* SVG Map + Static Info Card side by side */}
              {pathData ? (
                <div className="relative w-full flex gap-3 items-start">

                  {/* SVG Map */}
                  <div className="flex-1 min-w-0">
                    <svg
                      viewBox="0 0 600 700"
                      preserveAspectRatio="xMidYMid meet"
                      className="w-full max-h-[420px]"
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
                            onMouseEnter={() => handleStateHover(stateName)}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => handleStateClick(stateName)}
                            className="cursor-pointer transition-all duration-200"
                            style={{ filter: hoveredState?.name === stateName ? "brightness(1.1)" : "none" }}
                          />
                        );
                      })}
                    </svg>
                  </div>

                  {/* 📊 Static Info Card — fixed at right side, never moves */}
                  <div className="w-52 shrink-0 self-end mb-4">
                    <div
                      className="w-full bg-white/95 backdrop-blur-md shadow-2xl shadow-emerald-950/15 border border-emerald-100/60 rounded-[1.5rem] p-4"
                      style={{ transition: "opacity 200ms ease" }}
                    >
                      {hoveredState && hoveredState.data ? (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                              <Activity className="w-3 h-3 text-emerald-600 animate-pulse" />
                            </div>
                            <div>
                              <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none">{hoveredState.name}</h4>
                              <span className="text-[8px] text-gray-400 font-black mt-0.5 block">State Level Metrics</span>
                            </div>
                          </div>

                          {/* AQI Indicator */}
                          <div className="border-t border-b border-gray-100/60 py-2 mb-2 flex items-center justify-between">
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
                                backgroundColor: `${getAQIColor(hoveredState.data.aqi)}10`,
                              }}
                            >
                              {getAQILabel(hoveredState.data.aqi)}
                            </span>
                          </div>

                          {/* Temp + Roads */}
                          <div className="grid grid-cols-2 gap-1.5 mb-2">
                            <div className="flex items-center gap-1 bg-gray-50/50 p-1.5 rounded-lg border border-gray-100/30">
                              <CloudSun className="w-3 h-3 text-orange-400 shrink-0" />
                              <div>
                                <p className="text-[7px] text-gray-400 font-bold uppercase">Temp</p>
                                <p className="text-[9px] font-black text-gray-700">{hoveredState.data.temp}°C</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-50/50 p-1.5 rounded-lg border border-gray-100/30">
                              <Compass className="w-3 h-3 text-emerald-400 shrink-0" />
                              <div>
                                <p className="text-[7px] text-gray-400 font-bold uppercase">Roads</p>
                                <p className="text-[8px] font-black text-gray-700 leading-tight">{hoveredState.data.roadQuality}</p>
                              </div>
                            </div>
                          </div>

                          {/* Greenery */}
                          <div className="flex items-center gap-1.5 bg-gray-50/50 p-1.5 rounded-lg border border-gray-100/30 mb-2">
                            <Droplets className="w-3 h-3 text-blue-400 shrink-0" />
                            <div>
                              <span className="text-[7px] text-gray-400 font-bold uppercase block leading-none">Green Canopy</span>
                              <span className="font-extrabold text-[9px] text-gray-700">{hoveredState.data.greenery}</span>
                            </div>
                          </div>

                          {/* Advice */}
                          <div className="bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10 flex items-start gap-1.5">
                            <Info className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[7px] font-black text-emerald-800 uppercase tracking-widest block leading-none mb-1">Eco Travel Advice</span>
                              <p className="text-[8px] text-gray-500 font-bold leading-tight">{hoveredState.data.advice}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Placeholder when no state is hovered */
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-2">
                            <Activity className="w-4 h-4 text-emerald-300" />
                          </div>
                          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Hover a state</p>
                          <p className="text-[8px] text-gray-300 font-bold mt-0.5">to see metrics</p>
                        </div>
                      )}
                    </div>
                  </div>

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
