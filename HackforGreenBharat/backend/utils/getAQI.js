import axios from "axios";

// AQICN is faster for Indian cities (~200ms) vs open-meteo (~1-3s)
const AQICN_KEY = process.env.AQICN_API_KEY;

export const getAQIByCoords = async (lat, lon) => {
  try {
    const res = await axios.get(
      `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${AQICN_KEY}`,
      { timeout: 2500 }
    );

    if (res.data?.status === "ok" && res.data?.data?.aqi !== undefined) {
      return { aqi: res.data.data.aqi };
    }

    return { aqi: null };
  } catch {
    // Silent fallback
    return { aqi: null };
  }
};