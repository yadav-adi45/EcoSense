import axios from "axios";

export const OVERPASS_URL = "https://overpass.openstreetmap.fr/api/interpreter";

export const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const fetchNearbyServices = async (lat, lon, radiusM = 8000) => {
  let queryStr = `[out:json][timeout:25];\n(\n`;
  queryStr += `  node["amenity"="hospital"](around:${radiusM},${lat},${lon});\n`;
  queryStr += `  node["amenity"="police"](around:${radiusM},${lat},${lon});\n`;
  queryStr += `);\nout body;`;

  const res = await axios.post(OVERPASS_URL, queryStr, {
    headers: { "Content-Type": "text/plain" },
    timeout: 15000,
  });

  const elements = res.data?.elements || [];
  const seenIds = new Set();
  const hospitals = [];
  const police = [];

  elements.forEach((el) => {
    if (!el.lat || !el.lon || seenIds.has(el.id)) return;
    seenIds.add(el.id);
    const name = el.tags?.name || el.tags?.["name:en"] || "Emergency Facility";
    const dist = haversine(lat, lon, el.lat, el.lon);
    const item = { id: el.id, name, lat: el.lat, lon: el.lon, userDist: dist };
    const a = el.tags?.amenity;
    if (a === "hospital") hospitals.push(item);
    else if (a === "police") police.push(item);
  });

  hospitals.sort((a, b) => a.userDist - b.userDist);
  police.sort((a, b) => a.userDist - b.userDist);

  return { hospitals, police };
};

export const normalizeGeometry = (geom) => {
  if (!Array.isArray(geom) || geom.length === 0) return [];
  return geom
    .map((p) => {
      if (Array.isArray(p) && p.length >= 2) return { lat: Number(p[0]), lon: Number(p[1]) };
      if (p && typeof p === "object" && "lat" in p && "lon" in p)
        return { lat: Number(p.lat), lon: Number(p.lon) };
      return null;
    })
    .filter(Boolean);
};

export const sampleGeometry = (geometry, maxPoints = 10) => {
  const norm = normalizeGeometry(geometry);
  if (norm.length === 0) return [];
  if (norm.length <= maxPoints) return norm;
  const step = Math.floor(norm.length / (maxPoints - 1));
  const pts = [];
  for (let i = 0; i < maxPoints - 1; i++) pts.push(norm[i * step]);
  pts.push(norm[norm.length - 1]);
  return pts;
};

export const fetchRouteEmergency = async (geometry, radiusM = 8000) => {
  if (!geometry || geometry.length === 0) return { hospitals: [], police: [] };
  const anchors = sampleGeometry(geometry, 10);

  let queryStr = `[out:json][timeout:25];\n(\n`;
  anchors.forEach(({ lat, lon }) => {
    queryStr += `  node["amenity"="hospital"](around:${radiusM},${lat},${lon});\n`;
    queryStr += `  node["amenity"="police"](around:${radiusM},${lat},${lon});\n`;
  });
  queryStr += `);\nout body;`;

  const res = await axios.post(OVERPASS_URL, queryStr, {
    headers: { "Content-Type": "text/plain" },
    timeout: 15000,
  });
  const elements = res.data?.elements || [];
  const seenIds = new Set();
  const hospitals = [];
  const police = [];

  elements.forEach((el) => {
    if (!el.lat || !el.lon || seenIds.has(el.id)) return;
    seenIds.add(el.id);
    const name = el.tags?.name || el.tags?.["name:en"] || "Emergency Facility";
    let minRouteDist = Infinity;
    anchors.forEach(({ lat, lon }) => {
      const d = haversine(lat, lon, el.lat, el.lon);
      if (d < minRouteDist) minRouteDist = d;
    });
    const item = { id: el.id, name, lat: el.lat, lon: el.lon, routeDist: minRouteDist, userDist: null };
    const a = el.tags?.amenity;
    if (a === "hospital") hospitals.push(item);
    else if (a === "police") police.push(item);
  });

  return { hospitals, police };
};

export const refreshUserDistances = (items, userLat, userLon) =>
  items
    .map((item) => ({ ...item, userDist: haversine(userLat, userLon, item.lat, item.lon) }))
    .sort((a, b) => a.userDist - b.userDist);
