import fs from 'fs';
import readline from 'readline';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import { RoadkillObservation } from '../model/RoadkillObservation.js';
import { updateAnimalRiskSegment } from '../utils/animalRiskScoring.js';

const BATCH_SIZE = 500;
const INPUT_FILE = path.join(__dirname, '../occurrence.txt');

// Statistics
const stats = {
  total: 0,
  inserted: 0,
  skipped: 0,
  errors: 0,
  duplicates: 0
};

// Validate coordinates
function isValidCoordinate(lat, lng) {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// Parse date from eventDate field
function parseDate(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    return null;
  }
}

// Parse TSV line into object
function parseTSVLine(line, headers) {
  const values = line.split('\t');
  const obj = {};
  headers.forEach((header, index) => {
    obj[header] = values[index] || '';
  });
  return obj;
}

// Convert TSV row to RoadkillObservation document
function convertToRoadkillObservation(row) {
  const lat = parseFloat(row.decimalLatitude);
  const lng = parseFloat(row.decimalLongitude);
  
  // Validation
  if (!row.scientificName || !row.scientificName.trim()) {
    return { error: 'Missing species name' };
  }
  
  if (isNaN(lat) || isNaN(lng) || !isValidCoordinate(lat, lng)) {
    return { error: 'Invalid coordinates' };
  }
  
  const date = parseDate(row.eventDate);
  if (!date) {
    return { error: 'Invalid date' };
  }
  
  // Determine species category from class
  let category = 'other';
  if (row.class) {
    const classLower = row.class.toLowerCase();
    if (classLower === 'mammalia') category = 'mammal';
    else if (classLower === 'aves') category = 'bird';
    else if (classLower === 'reptilia') category = 'reptile';
    else if (classLower === 'amphibia') category = 'amphibian';
  }
  
  // Determine road type from locationRemarks
  let roadType = 'unknown';
  if (row.locationRemarks) {
    const remarks = row.locationRemarks.toLowerCase();
    if (remarks.includes('highway') || remarks.includes('nh')) roadType = 'highway';
    else if (remarks.includes('state') || remarks.includes('sh')) roadType = 'state_road';
    else if (remarks.includes('rural')) roadType = 'rural_road';
    else if (remarks.includes('city') || remarks.includes('urban')) roadType = 'city_road';
  }
  
  // Map to schema
  return {
    doc: {
      datasetSource: 'india_roadkill_monitoring',
      externalId: row.id ? row.id.trim() : undefined,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      species: {
        scientificName: row.scientificName.trim(),
        commonName: row.vernacularName ? row.vernacularName.trim() : undefined,
        category: category
      },
      observationDate: date,
      roadType: roadType,
      locality: row.locality || undefined,
      state: row.county || undefined,
      country: row.country || 'India',
      metadata: {
        photoUrl: row.associatedMedia ? row.associatedMedia.trim() : undefined,
        additionalNotes: row.datasetName || undefined
      }
    }
  };
}

// Batch insert with duplicate detection
async function batchInsert(documents) {
  if (documents.length === 0) return;
  
  try {
    // Check for duplicates by externalId
    const externalIds = documents
      .map(doc => doc.externalId)
      .filter(id => id);
    
    const existing = await RoadkillObservation.find({
      datasetSource: 'india_roadkill_monitoring',
      externalId: { $in: externalIds }
    }).select('externalId');
    
    const existingIds = new Set(existing.map(doc => doc.externalId));
    
    // Filter out duplicates
    const toInsert = documents.filter(doc => {
      if (doc.externalId && existingIds.has(doc.externalId)) {
        stats.duplicates++;
        stats.skipped++;
        return false;
      }
      return true;
    });
    
    if (toInsert.length > 0) {
      const result = await RoadkillObservation.insertMany(toInsert, { ordered: false });
      stats.inserted += result.length;
      
      // Update risk segments for inserted observations (collect unique segments)
      const segments = new Set();
      toInsert.forEach(doc => {
        const lat = doc.location.coordinates[1];
        const lng = doc.location.coordinates[0];
        const segmentLat = Math.floor(lat / 0.01) * 0.01;
        const segmentLng = Math.floor(lng / 0.01) * 0.01;
        const segmentId = `${segmentLat.toFixed(2)}_${segmentLng.toFixed(2)}`;
        segments.add(JSON.stringify({ id: segmentId, lat: segmentLat, lng: segmentLng }));
      });
      
      console.log(`  → Updating ${segments.size} risk segments...`);
      for (const segmentStr of segments) {
        const segment = JSON.parse(segmentStr);
        await updateAnimalRiskSegment(segment.id, segment.lng, segment.lat);
      }
    }
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - some documents were duplicates
      stats.duplicates += documents.length - (error.result?.nInserted || 0);
      stats.inserted += error.result?.nInserted || 0;
      stats.skipped += documents.length - (error.result?.nInserted || 0);
    } else {
      console.error('Batch insert error:', error.message);
      stats.errors += documents.length;
    }
  }
}

// Main import function
async function importRoadkillData() {
  console.log('🚀 Starting India Roadkill Data Import...\n');
  console.log(`Input file: ${INPUT_FILE}`);
  console.log(`Batch size: ${BATCH_SIZE}\n`);
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✓ Connected to MongoDB\n');
    
    // Check if file exists
    if (!fs.existsSync(INPUT_FILE)) {
      throw new Error(`File not found: ${INPUT_FILE}`);
    }
    
    const fileStream = fs.createReadStream(INPUT_FILE);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let headers = null;
    let batch = [];
    let lineNumber = 0;
    
    console.log('Processing file...\n');
    const startTime = Date.now();
    
    for await (const line of rl) {
      lineNumber++;
      
      // Skip empty lines
      if (!line.trim()) continue;
      
      // First line is headers
      if (!headers) {
        headers = line.split('\t');
        console.log(`Found ${headers.length} columns:`, headers.join(', '));
        console.log('');
        continue;
      }
      
      stats.total++;
      
      // Parse TSV line
      const row = parseTSVLine(line, headers);
      const result = convertToRoadkillObservation(row);
      
      if (result.error) {
        stats.errors++;
        if (stats.errors <= 10) {
          console.log(`Line ${lineNumber} error: ${result.error}`);
        }
        continue;
      }
      
      batch.push(result.doc);
      
      // Batch insert when batch is full
      if (batch.length >= BATCH_SIZE) {
        await batchInsert(batch);
        console.log(`Progress: ${stats.total} processed | ${stats.inserted} inserted | ${stats.skipped} skipped | ${stats.errors} errors`);
        batch = [];
      }
    }
    
    // Insert remaining documents
    if (batch.length > 0) {
      await batchInsert(batch);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n✅ Import completed!\n');
    console.log('Final Statistics:');
    console.log(`  Total records: ${stats.total}`);
    console.log(`  Inserted: ${stats.inserted}`);
    console.log(`  Skipped: ${stats.skipped}`);
    console.log(`  Duplicates: ${stats.duplicates}`);
    console.log(`  Errors: ${stats.errors}`);
    console.log(`  Duration: ${duration}s`);
    console.log(`  Rate: ${(stats.total / parseFloat(duration)).toFixed(2)} records/sec`);
    
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

// Run import
importRoadkillData();

export { importRoadkillData };
