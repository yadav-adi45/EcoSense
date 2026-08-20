import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import { calculateAnimalRisk, getCommonAnimals } from '../utils/animalRiskScoring.js';
import { AnimalRiskSegment } from '../model/AnimalRiskSegment.js';

async function testAnimalRiskAPI() {
  console.log('🧪 Testing Animal Risk API...\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✓ Connected to MongoDB\n');
    
    // Get a segment with roadkill data
    const segment = await AnimalRiskSegment.findOne({
      'animalRiskFactors.roadkillCount': { $gt: 0 }
    }).sort({ animalRisk: -1 });
    
    if (!segment) {
      console.log('❌ No segments found with roadkill data');
      return;
    }
    
    const [lng, lat] = segment.location.coordinates;
    
    console.log('📍 Testing location:');
    console.log(`   Coordinates: [${lng}, ${lat}]`);
    console.log(`   Segment ID: ${segment.roadSegmentId}\n`);
    
    // Test calculateAnimalRisk
    console.log('1️⃣  Testing calculateAnimalRisk()...');
    const riskData = await calculateAnimalRisk(lng, lat, 19); // 7 PM (dusk)
    
    console.log('\n   Risk Score:', riskData.animalRisk);
    console.log('   Risk Level:', riskData.riskLevel);
    console.log('\n   Breakdown:');
    console.log('   - Roadkill Factor:', riskData.breakdown.roadkillFactor);
    console.log('   - Observation Factor:', riskData.breakdown.observationFactor);
    console.log('   - User Report Factor:', riskData.breakdown.userReportFactor);
    console.log('   - Forest Factor:', riskData.breakdown.forestFactor);
    console.log('   - Water Factor:', riskData.breakdown.waterFactor);
    console.log('   - Base Risk:', riskData.breakdown.baseRisk);
    console.log('   - Time Multiplier:', riskData.breakdown.timeMultiplier);
    
    console.log('\n   Factors:');
    console.log('   - Roadkill Count:', riskData.factors.roadkillCount);
    console.log('   - Observation Count:', riskData.factors.observationCount);
    console.log('   - User Report Count:', riskData.factors.userReportCount);
    
    // Test getCommonAnimals
    console.log('\n\n2️⃣  Testing getCommonAnimals()...');
    const animals = await getCommonAnimals(lng, lat, 5);
    
    if (animals.length > 0) {
      console.log(`\n   Found ${animals.length} species nearby:\n`);
      animals.slice(0, 10).forEach((animal, index) => {
        console.log(`   ${index + 1}. ${animal.name} (${animal.category}) - ${animal.count} observations`);
      });
    } else {
      console.log('   No animals found nearby');
    }
    
    // Test time-of-day variations
    console.log('\n\n3️⃣  Testing Time-of-Day Variations...\n');
    
    const testTimes = [
      { hour: 6, label: 'Dawn (6 AM)' },
      { hour: 12, label: 'Noon' },
      { hour: 19, label: 'Dusk (7 PM)' },
      { hour: 23, label: 'Night (11 PM)' }
    ];
    
    for (const time of testTimes) {
      const timeRisk = await calculateAnimalRisk(lng, lat, time.hour);
      console.log(`   ${time.label}: ${timeRisk.animalRisk}/100 (multiplier: ${timeRisk.breakdown.timeMultiplier}x)`);
    }
    
    console.log('\n✅ Tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

testAnimalRiskAPI();
