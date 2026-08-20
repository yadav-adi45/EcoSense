import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import { RoadkillObservation } from '../model/RoadkillObservation.js';
import { AnimalRiskSegment } from '../model/AnimalRiskSegment.js';

async function verifyImport() {
  console.log('🔍 Verifying roadkill data import...\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✓ Connected to MongoDB\n');
    
    // Count roadkill observations
    const roadkillCount = await RoadkillObservation.countDocuments({
      datasetSource: 'india_roadkill_monitoring'
    });
    console.log(`📊 Roadkill Observations: ${roadkillCount}`);
    
    // Get sample roadkill observation
    const sampleRoadkill = await RoadkillObservation.findOne({
      datasetSource: 'india_roadkill_monitoring'
    });
    
    if (sampleRoadkill) {
      console.log('\n📝 Sample Roadkill Observation:');
      console.log(`  Species: ${sampleRoadkill.species.scientificName} (${sampleRoadkill.species.commonName || 'N/A'})`);
      console.log(`  Category: ${sampleRoadkill.species.category}`);
      console.log(`  Location: [${sampleRoadkill.location.coordinates.join(', ')}]`);
      console.log(`  Date: ${sampleRoadkill.observationDate.toISOString()}`);
      console.log(`  Road Type: ${sampleRoadkill.roadType}`);
      console.log(`  State: ${sampleRoadkill.state || 'N/A'}`);
    }
    
    // Count animal risk segments
    const segmentCount = await AnimalRiskSegment.countDocuments();
    console.log(`\n🗺️  Animal Risk Segments: ${segmentCount}`);
    
    // Get high-risk segments
    const highRiskSegments = await AnimalRiskSegment.find({
      animalRisk: { $gte: 50 }
    }).sort({ animalRisk: -1 }).limit(5);
    
    if (highRiskSegments.length > 0) {
      console.log('\n⚠️  Top 5 High-Risk Segments:');
      highRiskSegments.forEach((segment, index) => {
        console.log(`\n  ${index + 1}. Segment ${segment.roadSegmentId}`);
        console.log(`     Risk: ${segment.animalRisk}/100 (${segment.riskLevel})`);
        console.log(`     Location: [${segment.location.coordinates.join(', ')}]`);
        console.log(`     Roadkills: ${segment.animalRiskFactors.roadkillCount}`);
        console.log(`     Animals: ${segment.animals.join(', ') || 'None'}`);
      });
    }
    
    // Get species distribution
    const speciesDistribution = await RoadkillObservation.aggregate([
      { $match: { datasetSource: 'india_roadkill_monitoring' } },
      { $group: { 
        _id: '$species.category', 
        count: { $sum: 1 } 
      }},
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n🐾 Species Category Distribution:');
    speciesDistribution.forEach(cat => {
      console.log(`  ${cat._id}: ${cat.count}`);
    });
    
    // Get date range
    const dateRange = await RoadkillObservation.aggregate([
      { $match: { datasetSource: 'india_roadkill_monitoring' } },
      { $group: {
        _id: null,
        minDate: { $min: '$observationDate' },
        maxDate: { $max: '$observationDate' }
      }}
    ]);
    
    if (dateRange.length > 0) {
      console.log('\n📅 Date Range:');
      console.log(`  From: ${dateRange[0].minDate.toISOString().split('T')[0]}`);
      console.log(`  To: ${dateRange[0].maxDate.toISOString().split('T')[0]}`);
    }
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

verifyImport();
