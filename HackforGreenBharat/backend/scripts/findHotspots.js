import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

await mongoose.connect(process.env.MONGODB_URL);
const Roadkill = mongoose.connection.db.collection('roadkillobservations');

const states = await Roadkill.distinct('state');
console.log('States / Locations in Roadkill db:', states);

const samples = await Roadkill.aggregate([
  { $group: {
      _id: '$state',
      count: { $sum: 1 },
      avgLon: { $avg: { $arrayElemAt: ['$location.coordinates', 0] } },
      avgLat: { $avg: { $arrayElemAt: ['$location.coordinates', 1] } }
    }
  },
  { $sort: { count: -1 } }
]).toArray();
console.log('Breakdown by location:', samples);

const segments = await mongoose.connection.db.collection('animalrisksegments').find({ animalRisk: { $gt: 40 } }).sort({ animalRisk: -1 }).limit(10).toArray();
console.log('High risk segments:', JSON.stringify(segments.map(s => ({ id: s.roadSegmentId, risk: s.animalRisk, loc: s.location.coordinates, animals: s.animals, roadkills: s.animalRiskFactors.roadkillCount })), null, 2));

await mongoose.disconnect();
