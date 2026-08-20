import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import { RoadkillObservation } from '../model/RoadkillObservation.js';
import { updateAnimalRiskSegment } from '../utils/animalRiskScoring.js';

/**
 * Update risk segments for all imported roadkill data
 */
async function updateAllRiskSegments() {
  console.log('🔄 Updating animal risk segments...\n');
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✓ Connected to MongoDB\n');
    
    // Get all roadkill observations
    const observations = await RoadkillObservation.find({
      datasetSource: 'india_roadkill_monitoring'
    }).select('location');
    
    console.log(`Found ${observations.length} roadkill observations\n`);
    
    // Collect unique segments (grid resolution: 0.01 degrees ≈ 1.1km)
    const segmentsMap = new Map();
    
    observations.forEach(obs => {
      const lng = obs.location.coordinates[0];
      const lat = obs.location.coordinates[1];
      
      const segmentLat = Math.floor(lat / 0.01) * 0.01;
      const segmentLng = Math.floor(lng / 0.01) * 0.01;
      const segmentId = `${segmentLat.toFixed(2)}_${segmentLng.toFixed(2)}`;
      
      if (!segmentsMap.has(segmentId)) {
        segmentsMap.set(segmentId, {
          id: segmentId,
          lat: segmentLat,
          lng: segmentLng
        });
      }
    });
    
    const segments = Array.from(segmentsMap.values());
    console.log(`Identified ${segments.length} unique road segments to update\n`);
    
    // Update each segment
    let processed = 0;
    let errors = 0;
    const startTime = Date.now();
    
    for (const segment of segments) {
      try {
        await updateAnimalRiskSegment(segment.id, segment.lng, segment.lat);
        processed++;
        
        if (processed % 10 === 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          const rate = (processed / parseFloat(elapsed)).toFixed(1);
          console.log(`Progress: ${processed}/${segments.length} segments (${rate}/sec)`);
        }
      } catch (error) {
        errors++;
        if (errors <= 5) {
          console.error(`Error updating segment ${segment.id}:`, error.message);
        }
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n✅ Update completed!\n');
    console.log('Statistics:');
    console.log(`  Total segments: ${segments.length}`);
    console.log(`  Processed: ${processed}`);
    console.log(`  Errors: ${errors}`);
    console.log(`  Duration: ${duration}s`);
    console.log(`  Rate: ${(processed / parseFloat(duration)).toFixed(2)} segments/sec`);
    
  } catch (error) {
    console.error('\n❌ Update failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

// Run update
updateAllRiskSegments();

export { updateAllRiskSegments };
