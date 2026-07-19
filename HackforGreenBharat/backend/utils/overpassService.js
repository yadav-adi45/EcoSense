import axios from "axios";

const OVERPASS_URL = "https://overpass.openstreetmap.fr/api/interpreter";
const cache = new Map();

/**
 * Fetch road attributes (lit, surface, smoothness, canopy) near a coordinate
 * Rounding lat/lon to 3 decimal places (~110m grid) for high cache hits.
 */
export const getRoadAttributes = async (lat, lon) => {
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const query = `
    [out:json][timeout:3];
    (
      way["highway"](around:300,${lat},${lon});
      way["leisure"="park"](around:300,${lat},${lon});
      way["landuse"="forest"](around:300,${lat},${lon});
      way["natural"="wood"](around:300,${lat},${lon});
    );
    out tags;
  `;

  try {
    const res = await axios.post(OVERPASS_URL, query, {
      headers: { "Content-Type": "text/plain" },
      timeout: 3000,
    });

    let hasLit = false;
    let smoothnessScore = 5; // Default average smoothness (scale of 1-10)
    let isPaved = true;
    let greenCover = 0; // Count of nearby parks/forests

    const elements = res.data.elements || [];
    for (const el of elements) {
      const tags = el.tags || {};

      // 1. Lit checks
      if (tags.lit === "yes" || tags.lit === "true" || tags.lit === "public") {
        hasLit = true;
      } else if (tags.highway && ["motorway", "trunk", "primary", "secondary"].includes(tags.highway)) {
        // High likelihood of street lighting on major arterial roads
        hasLit = true;
      }

      // 2. Smoothness and surface checks
      if (tags.smoothness) {
        if (["excellent", "good"].includes(tags.smoothness)) smoothnessScore = 9;
        else if (tags.smoothness === "intermediate") smoothnessScore = 7;
        else if (["bad", "very_bad", "horrible", "rough", "very_rough"].includes(tags.smoothness)) smoothnessScore = 2;
      }

      if (tags.surface) {
        if (["asphalt", "concrete", "paved"].includes(tags.surface)) {
          isPaved = true;
        } else if (["unpaved", "gravel", "dirt", "sand", "ground", "grass"].includes(tags.surface)) {
          isPaved = false;
          smoothnessScore = Math.min(smoothnessScore, 3); // Unpaved implies bumpy
        }
      }

      // 3. Canopy / green cover checks
      if (tags.leisure === "park" || tags.landuse === "forest" || tags.natural === "wood") {
        greenCover++;
      }
    }

    const result = {
      hasLit,
      smoothnessScore,
      isPaved,
      greenCover,
    };

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    // Default fallback values if Overpass is down or times out
    return {
      hasLit: true,
      smoothnessScore: 6,
      isPaved: true,
      greenCover: 0,
    };
  }
};
