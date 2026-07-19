import axios from "axios";

const cache = new Map();

export const geocodeCity = async (input) => {
  if (!input) return null;
  const key = input.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key);

  try {
    const res = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
      params: {
        q: `${input}, India`,
        key: process.env.OPENCAGE_API_KEY,
        limit: 1,
        no_annotations: 1,
      },
      timeout: 5000,
    });

    if (!res.data?.results?.length) return null;

    const data = res.data.results[0];
    const result = { name: input, lat: data.geometry.lat, lon: data.geometry.lng };
    cache.set(key, result);
    return result;
  } catch {
    // Fallback to Nominatim if OpenCage fails or key missing
    try {
      const res = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: { q: `${input}, India`, format: "json", limit: 1 },
        headers: { "User-Agent": "hackforgreenbharat-app-v3" },
        timeout: 5000,
      });
      if (!res.data?.length) return null;
      const d = res.data[0];
      const result = { name: input, lat: parseFloat(d.lat), lon: parseFloat(d.lon) };
      cache.set(key, result);
      return result;
    } catch {
      return null;
    }
  }
};