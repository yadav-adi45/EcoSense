import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import StateMap from "./StateMap";
import { Activity, CloudSun, Compass, Droplets, Info, Layers, Map as MapIcon, Trees } from "lucide-react";

/* ===== GOOGLE MAPS & LEAFLET CONFIG ===== */
const GOOGLE_TILE_LAYERS = {
  roadmap: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
  satellite: "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
  terrain: "https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
};

/* ===== GOOGLE MAPS STYLE ICONS ===== */
const evIcon = L.divIcon({
  className: "custom-ev-marker",
  html: `<div style="background-color: #10b981; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3); font-size: 13px; font-weight: bold;">⚡</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// Hospital Marker Icon (Red 🏥)
const hospitalIcon = L.divIcon({
  className: "custom-hospital-marker",
  html: `<div style="background-color: #ef4444; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(239,68,68,0.45); font-size: 15px; font-weight: bold; cursor: pointer;">🏥</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Police Station Marker Icon (Blue 🛡️)
const policeIcon = L.divIcon({
  className: "custom-police-marker",
  html: `<div style="background-color: #2563eb; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(37,99,235,0.45); font-size: 15px; font-weight: bold; cursor: pointer;">🛡️</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Focused Location Pulse Marker
const focusedPulseIcon = (isHospital) => L.divIcon({
  className: "custom-focused-marker",
  html: `
    <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: ${isHospital ? 'rgba(239, 68, 68, 0.4)' : 'rgba(37, 99, 235, 0.4)'}; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 34px; height: 34px; border-radius: 50%; background: ${isHospital ? '#ef4444' : '#2563eb'}; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 16px;">
        ${isHospital ? '🏥' : '🛡️'}
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// 1. Custom Google Maps-style Destination Pin (Teardrop Red Pin with inner circle)
const destIcon = L.divIcon({
  className: "custom-dest-pin",
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.45));">
      <svg width="32" height="42" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.37258 0 0 5.37258 0 12C0 20.5 12 32 12 32C12 32 24 20.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="#EA4335"/>
        <circle cx="12" cy="11.5" r="4.5" fill="white"/>
        <circle cx="12" cy="11.5" r="2.5" fill="#B31412"/>
      </svg>
    </div>
  `,
  iconSize: [32, 42],
  iconAnchor: [16, 40],
});

// 2. Custom Google Maps-style Origin Pin (Blue circle with pulse halo)
const originIcon = L.divIcon({
  className: "custom-origin-pin",
  html: `
    <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(66, 133, 244, 0.35);"></div>
      <div style="width: 18px; height: 18px; border-radius: 50%; background: #1a73e8; border: 3.5px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.45);"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
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

/* ===== ECO-MAP STATE ENVIRONMENT DATA (REALISTIC CALIBRATED BASELINE) ===== */
const STATE_ENV_DATA = {
  'AP': { aqi: 72, temp: 32, roadQuality: "88% Smooth", greenery: "Dense Canopy", status: "GOOD", advice: "Smooth roads & clean air. Ideal for EV travel." },
  'AR': { aqi: 35, temp: 22, roadQuality: "70% Bumpy", greenery: "Lush Forest", status: "GOOD", advice: "Extremely clean air, but terrain is rough and bumpy." },
  'AS': { aqi: 58, temp: 26, roadQuality: "75% Smooth", greenery: "Lush Forest", status: "GOOD", advice: "Lush foliage provides great natural canopy shade." },
  'BR': { aqi: 119, temp: 30, roadQuality: "74% Smooth", greenery: "Moderate Grassland", status: "MODERATE", advice: "Gangetic plain dust. Keep car air circulation active." },
  'CH': { aqi: 85, temp: 28, roadQuality: "95% Smooth", greenery: "High Canopy", status: "GOOD", advice: "Well planned urban roads with clean green sectors." },
  'CT': { aqi: 82, temp: 31, roadQuality: "80% Smooth", greenery: "High Canopy", status: "GOOD", advice: "Abundant forests balance local coal-generation emissions." },
  'DL': { aqi: 178, temp: 34, roadQuality: "90% Smooth", greenery: "Low Canopy", status: "MODERATE", advice: "High urban traffic density. Prefer filtered cabin air." },
  'GA': { aqi: 42, temp: 30, roadQuality: "92% Smooth", greenery: "Dense Canopy", status: "GOOD", advice: "Coastal winds keep air fresh. Excellent highway quality." },
  'GJ': { aqi: 115, temp: 35, roadQuality: "92% Smooth", greenery: "Sparse Shrubland", status: "MODERATE", advice: "Industrial corridor air. Smooth expressways." },
  'HR': { aqi: 116, temp: 31, roadQuality: "88% Smooth", greenery: "Moderate Canopy", status: "MODERATE", advice: "Sub-Himalayan & NCR corridors. Favorable daytime transit." },
  'HP': { aqi: 45, temp: 18, roadQuality: "72% Bumpy", greenery: "Lush Forest", status: "GOOD", advice: "Cool mountain air. Smooth driving inside main valleys." },
  'JK': { aqi: 42, temp: 15, roadQuality: "65% Bumpy", greenery: "Lush Forest", status: "GOOD", advice: "Cold alpine climate, check for high elevation rough roads." },
  'JH': { aqi: 104, temp: 28, roadQuality: "78% Smooth", greenery: "Dense Forest Canopy", status: "MODERATE", advice: "Plateau & forest valleys have clean air; mining belts (Dhanbad) have localized dust." },
  'KA': { aqi: 62, temp: 28, roadQuality: "86% Smooth", greenery: "Dense Canopy", status: "GOOD", advice: "Favorable green cover and smooth, well-lit highways." },
  'KL': { aqi: 48, temp: 29, roadQuality: "88% Smooth", greenery: "Lush Forest", status: "GOOD", advice: "High humidity but excellent eco-system air quality." },
  'LA': { aqi: 28, temp: 10, roadQuality: "55% Rough", greenery: "Alpine Meadows", status: "GOOD", advice: "High altitude zone. Cold weather, ensure heavy winter gear." },
  'MP': { aqi: 95, temp: 31, roadQuality: "82% Smooth", greenery: "High Canopy", status: "GOOD", advice: "Dry plateau climate. Road condition is moderately stable." },
  'MH': { aqi: 66, temp: 31, roadQuality: "87% Smooth", greenery: "Moderate Canopy", status: "GOOD", advice: "Coastal sea winds in Mumbai; check central industrial hubs." },
  'MN': { aqi: 38, temp: 23, roadQuality: "68% Bumpy", greenery: "Lush Forest", status: "GOOD", advice: "Pure natural atmosphere with dense forest coverage." },
  'ML': { aqi: 35, temp: 21, roadQuality: "70% Bumpy", greenery: "Lush Forest", status: "GOOD", advice: "Extremely clean air, but persistent high monsoon rainfall." },
  'MZ': { aqi: 32, temp: 22, roadQuality: "62% Bumpy", greenery: "Lush Forest", status: "GOOD", advice: "Pristine mountain forests. Roads are slippery when wet." },
  'NL': { aqi: 42, temp: 22, roadQuality: "64% Bumpy", greenery: "Lush Forest", status: "GOOD", advice: "Low human pollution. Very healthy atmosphere." },
  'OR': { aqi: 83, temp: 31, roadQuality: "79% Smooth", greenery: "High Canopy", status: "GOOD", advice: "Coastal breeze offsets inland industrial zones." },
  'PB': { aqi: 102, temp: 31, roadQuality: "89% Smooth", greenery: "Moderate Canopy", status: "MODERATE", advice: "Agricultural transit routes. Smooth highway networks." },
  'RJ': { aqi: 128, temp: 37, roadQuality: "86% Smooth", greenery: "Desert Scrub", status: "MODERATE", advice: "Desert sand particles and warm daytime temperatures." },
  'SK': { aqi: 30, temp: 17, roadQuality: "60% Bumpy", greenery: "Lush Forest", status: "GOOD", advice: "Pristine ecosystem. Mountain paths require high caution." },
  'TN': { aqi: 68, temp: 33, roadQuality: "90% Smooth", greenery: "Moderate Canopy", status: "GOOD", advice: "Great sea breeze. Smooth and well-lit highway structures." },
  'TG': { aqi: 74, temp: 32, roadQuality: "88% Smooth", greenery: "Moderate Canopy", status: "GOOD", advice: "Warm dry air, solid road construction around cities." },
  'TR': { aqi: 48, temp: 25, roadQuality: "68% Bumpy", greenery: "Dense Canopy", status: "GOOD", advice: "Rich flora. Watch for narrow pathways and potholes." },
  'UP': { aqi: 155, temp: 32, roadQuality: "84% Smooth", greenery: "Moderate Canopy", status: "MODERATE", advice: "High population density in central plains. Use clean routes." },
  'UT': { aqi: 52, temp: 20, roadQuality: "74% Bumpy", greenery: "Lush Forest", status: "GOOD", advice: "Clean mountain valleys, but landslide risk during rains." },
  'WB': { aqi: 120, temp: 30, roadQuality: "78% Smooth", greenery: "Moderate Canopy", status: "MODERATE", advice: "Dense urban concentration. Prefer eco-safe green paths." },
  'AN': { aqi: 25, temp: 28, roadQuality: "80% Smooth", greenery: "Lush Forest", status: "GOOD", advice: "Pure marine atmosphere. No major pollution zones." },
  'DN': { aqi: 75, temp: 30, roadQuality: "85% Smooth", greenery: "Moderate Canopy", status: "GOOD", advice: "Moderate coastal air quality. Paths are well paved." },
  'LD': { aqi: 20, temp: 29, roadQuality: "90% Smooth", greenery: "Dense Canopy", status: "GOOD", advice: "Unpolluted islands. Pure sea breeze and clear skies." },
  'PY': { aqi: 58, temp: 31, roadQuality: "90% Smooth", greenery: "Moderate Canopy", status: "GOOD", advice: "Clean coastal boulevard. Smooth driving parameters." }
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

const RouteMap = ({
  routes = [],
  selectedRouteId = 0,
  origin,
  destination,
  onSelectRoute,
  emergencyPOIs = { hospitals: [], police: [] },
  showHospitals = true,
  showPolice = true,
  focusedLocation = null,
  onSelectFacility = () => {},
  onClearRoute = () => {},
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const layerGroupRef = useRef(null);
  const tileLayerRef = useRef(null);
  const emergencyMarkersRef = useRef({});

  const [mapStyle, setMapStyle] = useState("roadmap");

  // Determine active view: If routes exist, show "map" by default. Otherwise show "heatmap".
  const hasRoutes = routes && routes.length > 0;
  const [userViewOverride, setUserViewOverride] = useState(null); // null | "map" | "heatmap"
  const currentView = userViewOverride || (hasRoutes ? "map" : "heatmap");

  // SVG Heatmap State
  const [selectedState, setSelectedState] = useState(null);
  const [pathData, setPathData] = useState(null);
  const [hoveredState, setHoveredState] = useState(null);
  const [liveStateData, setLiveStateData] = useState(STATE_ENV_DATA);

  // Load live state AQI data
  useEffect(() => {
    fetch("/api/v5/states-aqi")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.states)) {
          const newData = { ...STATE_ENV_DATA };
          data.states.forEach((st) => {
            const stateCode = st.code || STATE_NAME_TO_CODE[st.state] || Object.keys(STATE_NAME_TO_CODE).find(
              (name) => name.toLowerCase() === st.state?.toLowerCase()
            );
            const targetCode = STATE_NAME_TO_CODE[stateCode] || stateCode;
            if (targetCode && newData[targetCode]) {
              newData[targetCode] = {
                ...newData[targetCode],
                aqi: st.aqi,
                status: st.status ? st.status.toUpperCase() : (st.aqi <= 50 ? "GOOD" : st.aqi <= 120 ? "MODERATE" : "SEVERE"),
              };
            }
          });
          setLiveStateData(newData);
        }
      })
      .catch((err) => console.error("Failed to fetch states AQI:", err));
  }, []);

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
    setHoveredState({ name: stateName, code, data: liveStateData[code] });
  }, [liveStateData]);

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

      const initialTileLayer = L.tileLayer(
        GOOGLE_TILE_LAYERS[mapStyle] || GOOGLE_TILE_LAYERS.roadmap,
        {
          attribution: '&copy; <a href="https://maps.google.com/">Google Maps</a>',
          maxZoom: 20,
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
        }
      ).addTo(map);
      tileLayerRef.current = initialTileLayer;

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapRef.current = map;

      const handleResize = () => map.invalidateSize();
      window.addEventListener("resize", handleResize);

      setTimeout(() => map.invalidateSize(), 150);
      setTimeout(() => map.invalidateSize(), 500);
    }
  }, []);

  // Update Google Maps Tile Layer when mapStyle changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newLayer = L.tileLayer(
      GOOGLE_TILE_LAYERS[mapStyle] || GOOGLE_TILE_LAYERS.roadmap,
      {
        attribution: '&copy; <a href="https://maps.google.com/">Google Maps</a>',
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
      }
    ).addTo(map);

    tileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Update Route Layers, Polylines, Markers, and Bounds
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    emergencyMarkersRef.current = {};

    const leafletOrigin = origin || { lat: 28.6139, lon: 77.2090, name: "Delhi" };
    const destPos = destination && destination.lat && destination.lon ? destination : null;

    const bounds = L.latLngBounds();

    // 1. Google Maps-style Origin Marker
    if (leafletOrigin?.lat && leafletOrigin?.lon) {
      const origMarker = L.marker([leafletOrigin.lat, leafletOrigin.lon], {
        icon: originIcon,
      }).bindPopup(`<strong>Origin:</strong> ${leafletOrigin.name || "Delhi"}`);
      layerGroup.addLayer(origMarker);
      bounds.extend([leafletOrigin.lat, leafletOrigin.lon]);
    }

    // 2. Google Maps-style Destination Marker
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

      // Draw non-selected routes in background (dashed gray)
      routes.forEach((route) => {
        if (route.id === activeRoute.id) return;
        if (route.geometry && route.geometry.length > 1) {
          const coords = route.geometry.map((p) => [p.lat, p.lon]);
          const polyline = L.polyline(coords, {
            color: "#94a3b8",
            weight: 5,
            opacity: 0.6,
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



        // 1. Google Maps style Outer Casing (Dark contrast blue casing)
        const fullCoords = segments.map((s) => [s.lat, s.lon]);
        const casingPolyline = L.polyline(fullCoords, {
          color: "#185ABC",
          weight: 10,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        });
        layerGroup.addLayer(casingPolyline);

        // 2. Inner Colored AQI Polyline Segments
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
              weight: 6,
              opacity: 1,
              lineCap: "round",
              lineJoin: "round",
            }
          );

          if (labelIndexes.has(i)) {
            polyline.bindTooltip(
              `
              <div style="
                background: #fff;
                border: 2.5px solid ${segColor};
                border-radius: 10px;
                padding: 5px 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.18);
                font-size: 12px;
                font-weight: 700;
                color: #111;
                min-width: 90px;
                text-align: center;
              ">
                <div style="color: ${segColor}; font-weight: 800; font-size: 11px;">${seg.zone || "Zone"}</div>
                <div style="color: #444; font-weight: 700;">AQI: ${seg.aqi ?? "N/A"}</div>
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
        
        // Double-layer Google Maps Blue Route
        const outerCasing = L.polyline(coords, {
          color: "#185ABC",
          weight: 10,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        });
        layerGroup.addLayer(outerCasing);

        const innerCore = L.polyline(coords, {
          color: "#1A73E8",
          weight: 6,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
        });
        layerGroup.addLayer(innerCore);
        coords.forEach((c) => bounds.extend(c));
      }
    }

    // 4. Render Nearest Hospitals on Map
    if (showHospitals && Array.isArray(emergencyPOIs?.hospitals)) {
      emergencyPOIs.hospitals.forEach((h, idx) => {
        if (h.lat && h.lon) {
          const isFocused = focusedLocation?.id === h.id;
          const hMarker = L.marker([h.lat, h.lon], {
            icon: isFocused ? focusedPulseIcon(true) : hospitalIcon,
            zIndexOffset: isFocused ? 1000 : 350,
          }).bindPopup(`
            <div style="font-family: system-ui, -apple-system, sans-serif; padding: 2px; min-width: 175px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <span style="background: #ef4444; color: white; border-radius: 4px; padding: 1px 6px; font-size: 10px; font-weight: 800;">🏥 #${idx + 1} HOSPITAL</span>
                <span style="font-size: 10px; color: #666; font-weight: 700;">📍 ${h.distFromStart ? (h.distFromStart < 1 ? Math.round(h.distFromStart * 1000) + ' m' : h.distFromStart.toFixed(1) + ' km') : 'Nearby'}</span>
              </div>
              <strong style="font-size: 13px; color: #111; display: block; line-height: 1.2;">${h.name}</strong>
              <span style="font-size: 11px; color: #555; display: block; margin-top: 3px;">${h.address || "Healthcare Facility"}</span>
              <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; font-size: 10px;">
                <span style="color: #ef4444; font-weight: 700;">📞 ${h.phone || "108 / 112"}</span>
                <span style="color: #059669; font-weight: 600;">${h.emergency || "24/7 Care"}</span>
              </div>
            </div>
          `);
          hMarker.on("click", () => onSelectFacility && onSelectFacility(h));
          layerGroup.addLayer(hMarker);
          emergencyMarkersRef.current[h.id] = hMarker;
        }
      });
    }

    // 5. Render Nearest Police Stations on Map
    if (showPolice && Array.isArray(emergencyPOIs?.police)) {
      emergencyPOIs.police.forEach((p, idx) => {
        if (p.lat && p.lon) {
          const isFocused = focusedLocation?.id === p.id;
          const pMarker = L.marker([p.lat, p.lon], {
            icon: isFocused ? focusedPulseIcon(false) : policeIcon,
            zIndexOffset: isFocused ? 1000 : 350,
          }).bindPopup(`
            <div style="font-family: system-ui, -apple-system, sans-serif; padding: 2px; min-width: 175px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <span style="background: #2563eb; color: white; border-radius: 4px; padding: 1px 6px; font-size: 10px; font-weight: 800;">🛡️ #${idx + 1} POLICE</span>
                <span style="font-size: 10px; color: #666; font-weight: 700;">📍 ${p.distFromStart ? (p.distFromStart < 1 ? Math.round(p.distFromStart * 1000) + ' m' : p.distFromStart.toFixed(1) + ' km') : 'Nearby'}</span>
              </div>
              <strong style="font-size: 13px; color: #111; display: block; line-height: 1.2;">${p.name}</strong>
              <span style="font-size: 11px; color: #555; display: block; margin-top: 3px;">${p.address || "Police Station"}</span>
              <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; font-size: 10px;">
                <span style="color: #2563eb; font-weight: 700;">📞 ${p.phone || "100 / 112"}</span>
                <span style="color: #059669; font-weight: 600;">${p.emergency || "Active Patrol"}</span>
              </div>
            </div>
          `);
          pMarker.on("click", () => onSelectFacility && onSelectFacility(p));
          layerGroup.addLayer(pMarker);
          emergencyMarkersRef.current[p.id] = pMarker;
        }
      });
    }

    // Auto-fit bounds unless focusing on a specific facility
    if (!focusedLocation) {
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      } else if (leafletOrigin?.lat && leafletOrigin?.lon) {
        map.setView([leafletOrigin.lat, leafletOrigin.lon], 9);
      }
    }
  }, [routes, selectedRouteId, origin, destination, onSelectRoute, emergencyPOIs, showHospitals, showPolice, focusedLocation, onSelectFacility]);

  // Handle smooth flyTo when user clicks a hospital / police station card (like in EcoStores)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusedLocation || !focusedLocation.lat || !focusedLocation.lon) return;

    map.flyTo([focusedLocation.lat, focusedLocation.lon], 16, {
      animate: true,
      duration: 1.2,
    });

    const marker = emergencyMarkersRef.current[focusedLocation.id];
  }, [focusedLocation]);

  // Invalidate map size when view switches to "map"
  useEffect(() => {
    if (currentView === "map" && mapRef.current) {
      setTimeout(() => mapRef.current.invalidateSize(), 50);
      setTimeout(() => mapRef.current.invalidateSize(), 200);
    }
  }, [currentView]);

  return (
    <div className="relative w-full h-full bg-white overflow-hidden select-none flex flex-col">
      
      {/* ── View & Map Style Switcher (Top-Left) ── */}
      {hasRoutes && (
        <div className="absolute top-4 left-4 z-[500] flex flex-wrap items-center gap-2">
          {/* View Switcher: Route Map vs National AQI */}
          <div className="bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-gray-200/90 flex items-center gap-1">
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
              <span>🚗 Route Map</span>
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
              <span>🗺️ National AQI Heatmap</span>
            </button>
          </div>

          {/* If viewing Heatmap while routes are active, show quick exit/reset button */}
          {currentView === "heatmap" && (
            <button
              type="button"
              onClick={() => {
                setUserViewOverride(null);
                onClearRoute();
              }}
              className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-black flex items-center gap-1.5 transition-all"
              title="Clear searched route and stay on heatmap"
            >
              <span>✕</span>
              <span>Clear Route</span>
            </button>
          )}

          {/* Google Maps Style Switcher (Map / Satellite / Terrain) */}
          {currentView === "map" && (
            <div className="bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-lg border border-gray-200/80 flex items-center gap-1 animate-in fade-in duration-200">
              <button
                type="button"
                onClick={() => setMapStyle("roadmap")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  mapStyle === "roadmap"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Map
              </button>
              <button
                type="button"
                onClick={() => setMapStyle("satellite")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  mapStyle === "satellite"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Satellite
              </button>
              <button
                type="button"
                onClick={() => setMapStyle("terrain")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  mapStyle === "terrain"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Terrain
              </button>
            </div>
          )}
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
            stateData={liveStateData[selectedState]}
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
                <div className="w-full h-full flex items-center justify-center lg:pr-[300px] pb-[320px] lg:pb-0">
                  <svg
                    viewBox="0 0 600 700"
                    preserveAspectRatio="xMidYMid meet"
                    className="w-full h-full max-h-[calc(100vh-8.5rem)] max-w-full drop-shadow-xl transition-transform duration-300"
                  >
                    {Object.entries(pathData).map(([stateName, d]) => {
                      const code = STATE_NAME_TO_CODE[stateName];
                      const stateData = liveStateData[code];
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

                {/* State Hover Info Card (Floating in South-East / Bottom-Right Corner) */}
                <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 w-72 sm:w-[280px] pointer-events-auto">
                  <div className="w-full bg-white/95 backdrop-blur-md shadow-2xl shadow-emerald-950/20 border border-emerald-100/90 rounded-[1.6rem] p-3.5 sm:p-4 transition-all">
                    {hoveredState && hoveredState.data ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm sm:text-base font-black text-emerald-950 uppercase tracking-wider leading-none truncate">
                              {hoveredState.name}
                            </h4>
                            <span className="text-[9px] text-gray-400 font-bold mt-0.5 block">
                              State Level Metrics
                            </span>
                          </div>
                        </div>

                        {/* State Avg AQI */}
                        <div className="border-t border-b border-gray-100/80 py-2 flex items-center justify-between">
                          <div>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                              State Avg AQI
                            </p>
                            <p
                              className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5"
                              style={{ color: getAQIColor(hoveredState.data.aqi) }}
                            >
                              {hoveredState.data.aqi}
                            </p>
                          </div>
                          <span
                            className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm"
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
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-50/90 p-2.5 rounded-xl border border-gray-100/80">
                            <div className="flex items-center gap-1 mb-0.5">
                              <CloudSun className="w-3.5 h-3.5 text-orange-400" />
                              <span className="text-[8px] text-gray-400 font-bold uppercase">Temp</span>
                            </div>
                            <p className="text-xs sm:text-sm font-black text-gray-800">{hoveredState.data.temp}°C</p>
                          </div>
                          <div className="bg-gray-50/90 p-2.5 rounded-xl border border-gray-100/80">
                            <div className="flex items-center gap-1 mb-0.5">
                              <Compass className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-[8px] text-gray-400 font-bold uppercase">Roads</span>
                            </div>
                            <p className="text-[11px] font-black text-gray-800 leading-tight">
                              {hoveredState.data.roadQuality}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-50/90 p-2.5 rounded-xl border border-gray-100/80 flex items-center gap-2">
                          <Trees className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="text-[8px] text-gray-400 font-bold uppercase block">Green Canopy</span>
                            <p className="text-[11px] font-black text-emerald-900 mt-0.5">{hoveredState.data.greenery}</p>
                          </div>
                        </div>

                        {/* Eco Travel Advice */}
                        <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-100/80 flex items-start gap-2">
                          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9px] font-black text-emerald-950 uppercase tracking-wider block leading-none mb-0.5">
                              Eco Travel Advice
                            </span>
                            <p className="text-[10px] text-gray-600 font-medium leading-relaxed">
                              {hoveredState.data.advice}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-2">
                          <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-[11px] font-black text-gray-700 uppercase tracking-wider">
                          Hover over any state
                        </p>
                        <p className="text-[9px] text-gray-400 mt-0.5 max-w-[190px] leading-relaxed">
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
