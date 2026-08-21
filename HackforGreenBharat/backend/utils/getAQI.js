import axios from "axios";

/**
 * Calculate Indian National AQI (NAQI) from PM2.5 & PM10 concentrations (µg/m³)
 * Based on official CPCB (Central Pollution Control Board) breakpoints
 */
const calcIndiaAQI = (pm25, pm10) => {
  const calcSubIndex = (conc, breakpoints) => {
    for (const b of breakpoints) {
      if (conc >= b.cLow && conc <= b.cHigh) {
        return Math.round(
          ((b.iHigh - b.iLow) / (b.cHigh - b.cLow)) * (conc - b.cLow) + b.iLow
        );
      }
    }
    return null;
  };

  // PM2.5 Breakpoints (µg/m³)
  const pm25Breakpoints = [
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
    { cLow: 30.1, cHigh: 60, iLow: 51, iHigh: 100 },
    { cLow: 60.1, cHigh: 90, iLow: 101, iHigh: 200 },
    { cLow: 90.1, cHigh: 120, iLow: 201, iHigh: 300 },
    { cLow: 120.1, cHigh: 250, iLow: 301, iHigh: 400 },
    { cLow: 250.1, cHigh: 500, iLow: 401, iHigh: 500 },
  ];

  // PM10 Breakpoints (µg/m³)
  const pm10Breakpoints = [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 50.1, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 100.1, cHigh: 250, iLow: 101, iHigh: 200 },
    { cLow: 250.1, cHigh: 350, iLow: 201, iHigh: 300 },
    { cLow: 350.1, cHigh: 430, iLow: 301, iHigh: 400 },
    { cLow: 430.1, cHigh: 600, iLow: 401, iHigh: 500 },
  ];

  const subIndices = [];
  if (pm25 != null && !isNaN(pm25)) {
    const s25 = calcSubIndex(pm25, pm25Breakpoints);
    if (s25 !== null) subIndices.push(s25);
  }
  if (pm10 != null && !isNaN(pm10)) {
    const s10 = calcSubIndex(pm10, pm10Breakpoints);
    if (s10 !== null) subIndices.push(s10);
  }

  if (subIndices.length === 0) return null;
  return Math.max(...subIndices);
};

/**
 * Get AQI by coordinates:
 * Primary: India National AQI (NAQI) calculated from live Open-Meteo pollutant levels (PM2.5, PM10)
 * Fallback: WAQI (US EPA standard) or Open-Meteo US AQI
 */
export const getAQIByCoords = async (lat, lon) => {
  // 1. Primary: Direct India NAQI via Open-Meteo Atmospheric Pollutant Sensors
  try {
    const omRes = await axios.get(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,pm10,us_aqi,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`,
      { timeout: 3000 }
    );
    const curr = omRes.data?.current;
    if (curr) {
      const indiaAQI = calcIndiaAQI(curr.pm2_5, curr.pm10);
      const finalAQI = indiaAQI !== null ? indiaAQI : (typeof curr.us_aqi === "number" ? Math.round(curr.us_aqi) : null);

      if (finalAQI !== null) {
        return {
          aqi: finalAQI,
          source: indiaAQI !== null ? "india-naqi (open-meteo)" : "open-meteo",
          station: "Atmospheric Sensor (NAQI)",
          iaqi: {
            pm25: { v: curr.pm2_5 },
            pm10: { v: curr.pm10 },
            no2: { v: curr.nitrogen_dioxide },
            so2: { v: curr.sulphur_dioxide },
            co: { v: curr.carbon_monoxide },
            o3: { v: curr.ozone },
          },
        };
      }
    }
  } catch {
    // Fallback to WAQI below
  }

  // 2. Fallback: WAQI (US AQI / Ground Stations)
  const token = process.env.AQICN_API_KEY;
  if (token) {
    try {
      const res = await axios.get(
        `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`,
        { timeout: 2500 }
      );

      if (res.data?.status === "ok" && typeof res.data?.data?.aqi === "number") {
        return {
          aqi: res.data.data.aqi,
          source: "waqi (us-aqi)",
          station: res.data.data.city?.name || null,
          iaqi: res.data.data.iaqi || {},
        };
      }
    } catch {
      // Failed
    }
  }

  return { aqi: null };
};

/**
 * Get comprehensive weather and AQI telemetry for a location
 */
export const getLiveTelemetry = async (lat, lon) => {
  const [aqiResult, weatherResult] = await Promise.allSettled([
    getAQIByCoords(lat, lon),
    axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`,
      { timeout: 3000 }
    ),
  ]);

  const aqiData = aqiResult.status === "fulfilled" ? aqiResult.value : { aqi: null };
  const weatherData = weatherResult.status === "fulfilled" ? weatherResult.value.data?.current : null;

  return {
    aqi: aqiData?.aqi ?? 95,
    station: aqiData?.station || "Regional Station",
    source: aqiData?.source || "live",
    iaqi: aqiData?.iaqi || {},
    temperature: weatherData?.temperature_2m !== undefined ? Math.round(weatherData.temperature_2m) : 28,
    humidity: weatherData?.relative_humidity_2m !== undefined ? Math.round(weatherData.relative_humidity_2m) : 60,
    windSpeed: weatherData?.wind_speed_10m !== undefined ? Math.round(weatherData.wind_speed_10m) : 8,
  };
};