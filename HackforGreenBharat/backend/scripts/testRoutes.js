import { geocodeCity } from '../utils/geocodeCity.js';
import axios from 'axios';
import { calculateRouteAnimalRisk } from '../utils/animalRiskScoring.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

await mongoose.connect(process.env.MONGODB_URL);

const cityPairs = [
  ['Amravati', 'Wardha'],
  ['Wardha', 'Amravati'],
  ['Nagpur', 'Amravati'],
  ['Lonar', 'Mehkar'],
  ['Amravati', 'Yavatmal'],
  ['Badnera', 'Wardha'],
  ['Chandur Railway', 'Dhamangaon']
];

for (const [c1, c2] of cityPairs) {
  try {
    const o = await geocodeCity(c1);
    const d = await geocodeCity(c2);
    if (!o || !d) continue;

    const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${o.lon},${o.lat};${d.lon},${d.lat}?overview=full&geometries=geojson&alternatives=true`;
    const res = await axios.get(osrmUrl);
    const route = res.data.routes[0];
    const fullGeo = route.geometry.coordinates.map(([lon, lat]) => ({ lat, lon }));
    
    // Sample 8 points
    const step = Math.floor(fullGeo.length / 7);
    const pts = [];
    for (let j = 0; j < 7; j++) pts.push(fullGeo[j * step]);
    pts.push(fullGeo[fullGeo.length - 1]);

    const riskDay = await calculateRouteAnimalRisk(pts, 9);
    const riskDusk = await calculateRouteAnimalRisk(pts, 19);

    console.log(`\n🚗 ${c1} ➔ ${c2}:`);
    console.log(`   Day (9 AM): Avg=${riskDay.averageRisk}, Max=${riskDay.maxRisk}, Level=${riskDay.riskLevel}`);
    console.log(`   Dusk (7 PM): Avg=${riskDusk.averageRisk}, Max=${riskDusk.maxRisk}, Level=${riskDusk.riskLevel}`);
  } catch (err) {
    console.error(`Error for ${c1} -> ${c2}:`, err.message);
  }
}

await mongoose.disconnect();
