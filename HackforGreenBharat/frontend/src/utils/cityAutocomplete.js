import axios from "axios";

export const cityAutocomplete = async (query) => {
  if (!query || query.length < 1) return [];

  try {
    // 🚀 Using Photon API (Komoot) - Excellent for Autocomplete & Free
    const res = await axios.get("https://photon.komoot.io/api/", {
      params: {
        q: query,
        limit: 10,
        lang: "en",
      },
    });

    if (!res.data.features?.length) return [];

    // 1️⃣ Map & Filter for Places (Cities, Towns, etc.)
    let cities = res.data.features
      .map((f) => {
        const p = f.properties;

        // We generally want places, not random shops
        // Photon usually ranks well, but let's be safe
        const city = p.name;
        const state = p.state || p.county || p.country;

        if (!city) return null;

        return {
          city: city,
          label: `${city}${state ? ", " + state : ""}`,
          raw: p // keep raw data if needed later
        };
      })
      .filter(Boolean);

    // 2️⃣ Remove Duplicates (by city name)
    const seen = new Set();
    cities = cities.filter((c) => {
      // Create a unique key based on name and state to allow same city names in different states
      const key = (c.city + (c.label || "")).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return cities.slice(0, 5);
  } catch (err) {
    console.error("Autocomplete failed:", err.message);
    return [];
  }
};
