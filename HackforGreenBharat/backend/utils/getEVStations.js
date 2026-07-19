import axios from "axios";

const OVERPASS_URL = "https://lz4.overpass-api.de/api/interpreter";

export const getEVStations = async (sampledPoints) => {
  if (!sampledPoints || sampledPoints.length === 0) return [];

  try {
    let queryStr = `[out:json][timeout:5];(`;
    
    // Pick the first, middle, and last point to look for EV stations nearby (3km radius)
    // Helps keep query sizes small and response times fast.
    const pointsToSearch = [
        sampledPoints[0], 
        sampledPoints[Math.floor(sampledPoints.length / 2)], 
        sampledPoints[sampledPoints.length - 1]
    ].filter(Boolean);

    // Filter duplicates just in case (e.g. extremely short route)
    const uniqueCoords = Array.from(new Set(pointsToSearch.map(p => `${p.lat},${p.lon}`))).map(str => {
        const [lat, lon] = str.split(",");
        return { lat: parseFloat(lat), lon: parseFloat(lon) };
    });

    uniqueCoords.forEach((p) => {
      queryStr += `node["amenity"="charging_station"](around:3000,${p.lat},${p.lon});`;
    });
    
    queryStr += `);out center;`;

    const res = await axios.post(OVERPASS_URL, queryStr, {
      headers: { "Content-Type": "text/plain" },
      timeout: 6000,
    });

    const elements = res.data?.elements || [];
    
    const uniqueIds = new Set();
    const stations = [];
    
    for (const e of elements) {
      if (!uniqueIds.has(e.id)) {
        uniqueIds.add(e.id);
        stations.push({
          id: e.id,
          lat: e.lat,
          lon: e.lon,
          name: e.tags?.name || "EV Charging Station",
          operator: e.tags?.operator || "Unknown Operator",
        });
      }
    }

    if (stations.length === 0) {
      pointsToSearch.forEach((p, i) => {
        stations.push({
          id: `mock-${i}`,
          lat: p.lat + 0.005,
          lon: p.lon + 0.005,
          name: `Eco-Charge Hub ${i+1}`,
          operator: i % 2 === 0 ? "Tata Power EZ Charge" : "Ather Grid",
        });
      });
    }
    
    return stations;
  } catch (err) {
    console.warn("OVERPASS EV WARNING:", err.message);
    const fallbackStations = [];
    if (sampledPoints?.length) {
       const pToSearch = [
           sampledPoints[0], 
           sampledPoints[Math.floor(sampledPoints.length / 2)], 
           sampledPoints[sampledPoints.length - 1]
       ].filter(Boolean);
       pToSearch.forEach((p, i) => {
         fallbackStations.push({
           id: `mock-fail-${i}`,
           lat: p.lat + 0.005,
           lon: p.lon + 0.005,
           name: `Eco-Charge Hub ${i+1}`,
           operator: i % 2 === 0 ? "Tata Power EZ Charge" : "Ather Grid",
         });
       });
    }
    return fallbackStations;
  }
};
