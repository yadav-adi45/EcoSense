import axios from "axios";

const cache = new Map();

export const reverseGeocode = async (lat, lon) => {
  const roundedLat = parseFloat(lat).toFixed(2);
  const roundedLon = parseFloat(lon).toFixed(2);
  const cacheKey = `${roundedLat},${roundedLon}`;

  if (cache.has(cacheKey)) return cache.get(cacheKey);

  // Try OpenCage first (no rate limit per-call), fallback to Nominatim
  const opencageKey = process.env.OPENCAGE_API_KEY;
  
  try {
    let result = "Along Route";

    if (opencageKey) {
      const res = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
        params: { q: `${lat}+${lon}`, key: opencageKey, limit: 1, no_annotations: 1 },
        timeout: 3000,
      });
      const d = res.data.results?.[0]?.components;
      if (d) {
        result = d.suburb || d.city_district || d.city || d.town || d.village || d.state || "Along Route";
      }
    } else {
      // Fallback to Nominatim
      const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
        params: { lat, lon, format: "json" },
        headers: { "User-Agent": "hackforgreenbharat-app-v3" },
        timeout: 3000,
      });
      const d = res.data?.address;
      if (d) {
        result = d.suburb || d.city_district || d.city || d.town || d.village || d.state || "Along Route";
      }
    }

    cache.set(cacheKey, result);
    return result;
  } catch {
    cache.set(cacheKey, "Along Route");
    return "Along Route";
  }
};