import axios from "axios";
import https from "https";

const cache = new Map();
const agent = new https.Agent({ rejectUnauthorized: false });

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
      timeout: 10000,
      httpsAgent: agent,
    });

    if (!res.data?.results?.length) {
      console.log(`[geocode] OpenCage no results for: ${input}`);
      return null;
    }

    const data = res.data.results[0];
    console.log(`[geocode] OpenCage success for ${input}:`, data.geometry);
    const result = { name: input, lat: data.geometry.lat, lon: data.geometry.lng };
    cache.set(key, result);
    return result;
  } catch (err) {
    console.log(`[geocode] OpenCage failed for ${input}:`, err.message);
    // Fallback to Nominatim if OpenCage fails or key missing
    try {
      const res = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: { q: `${input}, India`, format: "json", limit: 1 },
        headers: { "User-Agent": "hackforgreenbharat-app-v3" },
        timeout: 15000,
        httpsAgent: agent,
      });
      if (!res.data?.length) {
        console.log(`[geocode] Nominatim no results for: ${input}`);
        return null;
      }
      const d = res.data[0];
      console.log(`[geocode] Nominatim success for ${input}:`, d.lat, d.lon);
      const result = { name: input, lat: parseFloat(d.lat), lon: parseFloat(d.lon) };
      cache.set(key, result);
      return result;
    } catch (err2) {
      console.log(`[geocode] Nominatim also failed for ${input}:`, err2.message);
      return null;
    }
  }
};
