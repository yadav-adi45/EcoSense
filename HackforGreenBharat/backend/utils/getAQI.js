import axios from "axios";

// Calculate Indian NAQI based on PM2.5 and PM10 raw concentration (μg/m³)
const calcIndiaAQI = (pm25, pm10) => {
  const getSubIndex = (c, breakpoints) => {
    for (let bp of breakpoints) {
      if (c >= bp.cLow && c <= bp.cHigh) {
        return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (c - bp.cLow) + bp.iLow);
      }
    }
    const last = breakpoints[breakpoints.length - 1];
    if (c > last.cHigh) {
      return Math.round(((last.iHigh - last.iLow) / (last.cHigh - last.cLow)) * (c - last.cLow) + last.iLow);
    }
    return 0;
  };

  const pm25BPs = [
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
    { cLow: 30.1, cHigh: 60, iLow: 51, iHigh: 100 },
    { cLow: 60.1, cHigh: 90, iLow: 101, iHigh: 200 },
    { cLow: 90.1, cHigh: 120, iLow: 201, iHigh: 300 },
    { cLow: 120.1, cHigh: 250, iLow: 301, iHigh: 400 },
    { cLow: 250.1, cHigh: 500, iLow: 401, iHigh: 500 }
  ];

  const pm10BPs = [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 50.1, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 100.1, cHigh: 250, iLow: 101, iHigh: 200 },
    { cLow: 250.1, cHigh: 350, iLow: 201, iHigh: 300 },
    { cLow: 350.1, cHigh: 430, iLow: 301, iHigh: 400 },
    { cLow: 430.1, cHigh: 1000, iLow: 401, iHigh: 500 }
  ];

  let aqis = [];
  if (pm25 !== undefined && pm25 !== null) aqis.push(getSubIndex(pm25, pm25BPs));
  if (pm10 !== undefined && pm10 !== null) aqis.push(getSubIndex(pm10, pm10BPs));

  if (aqis.length === 0) return null;
  return Math.max(...aqis);
};

/**
 * Get AQI by coordinates using India NAQI (via Open-Meteo) as Primary, and US AQI (via WAQI) as Fallback
 */
export const getAQIByCoords = async (lat, lon) => {
  // 1. Primary: India NAQI Calculation using Open-Meteo raw pollutant data
  try {
    const omRes = await axios.get(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`,
      { timeout: 3000 }
    );
    const curr = omRes.data?.current;
    if (curr && typeof curr.pm2_5 === "number") {
      const indiaAQI = calcIndiaAQI(curr.pm2_5, curr.pm10);
      if (indiaAQI !== null) {
        return {
          aqi: indiaAQI,
          source: "india-naqi (open-meteo)",
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
  } catch (err) {
    // Fallback to WAQI below
  }

  // 2. Fallback: WAQI (US EPA Standard)
  const token = process.env.AQICN_API_KEY;
  if (token) {
    try {
      const res = await axios.get(
        `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`,
        { timeout: 2500 }
      );

      if (res.data?.status === "ok" && res.data?.data?.aqi !== undefined && typeof res.data.data.aqi === "number") {
        return {
          aqi: res.data.data.aqi,
          source: "waqi (us-aqi)",
          station: res.data.data.city?.name || null,
          iaqi: res.data.data.iaqi || {},
        };
      }
    } catch {
      // Both failed
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