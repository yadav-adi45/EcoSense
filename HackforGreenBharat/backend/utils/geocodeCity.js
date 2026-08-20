import axios from "axios";
import https from "https";

const cache = new Map();
const agent = new https.Agent({ rejectUnauthorized: false });

const POPULAR_CITIES = {
  "delhi": { name: "Delhi", lat: 28.6139, lon: 77.2090 },
  "new delhi": { name: "New Delhi", lat: 28.6139, lon: 77.2090 },
  "jaipur": { name: "Jaipur", lat: 26.9124, lon: 75.7873 },
  "mumbai": { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
  "pune": { name: "Pune", lat: 18.5204, lon: 73.8567 },
  "bengaluru": { name: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  "bangalore": { name: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  "chennai": { name: "Chennai", lat: 13.0827, lon: 80.2707 },
  "kolkata": { name: "Kolkata", lat: 22.5726, lon: 88.3639 },
  "hyderabad": { name: "Hyderabad", lat: 17.3850, lon: 78.4867 },
  "ahmedabad": { name: "Ahmedabad", lat: 23.0225, lon: 72.5714 },
  "chandigarh": { name: "Chandigarh", lat: 30.7333, lon: 76.7794 },
  "bihar": { name: "Bihar (Patna)", lat: 25.5941, lon: 85.1376 },
  "patna": { name: "Patna", lat: 25.5941, lon: 85.1376 },
  "punjab": { name: "Chandigarh", lat: 30.7333, lon: 76.7794 },
  "lucknow": { name: "Lucknow", lat: 26.8467, lon: 80.9462 },
  "agra": { name: "Agra", lat: 27.1767, lon: 78.0081 },
  "kanpur": { name: "Kanpur", lat: 26.4499, lon: 80.3319 },
  "varanasi": { name: "Varanasi", lat: 25.3176, lon: 82.9739 },
  "ranchi": { name: "Ranchi", lat: 23.3441, lon: 85.3096 },
  "bhopal": { name: "Bhopal", lat: 23.2599, lon: 77.4126 },
  "indore": { name: "Indore", lat: 22.7196, lon: 75.8577 },
  "surat": { name: "Surat", lat: 21.1702, lon: 72.8311 },
  "dehradun": { name: "Dehradun", lat: 30.3165, lon: 78.0322 },
  "shimla": { name: "Shimla", lat: 31.1048, lon: 77.1734 },
  "amritsar": { name: "Amritsar", lat: 31.6340, lon: 74.8723 },
  "gurugram": { name: "Gurugram", lat: 28.4595, lon: 77.0266 },
  "noida": { name: "Noida", lat: 28.5355, lon: 77.3910 }
};

export const geocodeCity = async (input) => {
  if (!input) return null;
  const key = input.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key);

  // Check local dictionary first
  for (const [dictKey, dictVal] of Object.entries(POPULAR_CITIES)) {
    if (key === dictKey || key.startsWith(dictKey + ",") || key.includes(" " + dictKey)) {
      cache.set(key, { ...dictVal, name: input });
      return { ...dictVal, name: input };
    }
  }

  try {
    const res = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
      params: {
        q: `${input}, India`,
        key: process.env.OPENCAGE_API_KEY,
        limit: 1,
        no_annotations: 1,
      },
      timeout: 5000,
      httpsAgent: agent,
    });

    if (!res.data?.results?.length) {
      console.log(`[geocode] OpenCage no results for: ${input}`);
    } else {
      const data = res.data.results[0];
      console.log(`[geocode] OpenCage success for ${input}:`, data.geometry);
      const result = { name: input, lat: data.geometry.lat, lon: data.geometry.lng };
      cache.set(key, result);
      return result;
    }
  } catch (err) {
    console.log(`[geocode] OpenCage failed for ${input}:`, err.message);
  }

  // Fallback to Nominatim if OpenCage fails or key missing
  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: { q: `${input}, India`, format: "json", limit: 1 },
      headers: { "User-Agent": "hackforgreenbharat-app-v3" },
      timeout: 6000,
      httpsAgent: agent,
    });
    if (res.data?.length) {
      const d = res.data[0];
      console.log(`[geocode] Nominatim success for ${input}:`, d.lat, d.lon);
      const result = { name: input, lat: parseFloat(d.lat), lon: parseFloat(d.lon) };
      cache.set(key, result);
      return result;
    }
  } catch (err2) {
    console.log(`[geocode] Nominatim also failed for ${input}:`, err2.message);
  }

  // Final fallback to Delhi coordinates if everything fails
  return { name: input, lat: 28.6139, lon: 77.2090 };
};
