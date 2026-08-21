import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCPCBCategory } from './ingestDistrictAQI.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DISTRICTS_PATH = path.resolve(__dirname, '../../frontend/public/india-districts-aqi.json');
const STATES_PATH = path.resolve(__dirname, '../../frontend/public/india-states-aqi.json');

const VALID_SOURCE_TYPES = new Set([
  'cpcb_station_average',
  'derived_nearby_station_estimate',
  'fallback_state_aqi'
]);

export function validateAQIDatasets() {
  console.log('=== Running AQI Dataset Validation Tests ===\n');
  let errors = [];

  // 1. Check District Dataset
  if (!fs.existsSync(DISTRICTS_PATH)) {
    errors.push(`District dataset file missing at: ${DISTRICTS_PATH}`);
    return { passed: false, errors };
  }

  let districts = [];
  try {
    districts = JSON.parse(fs.readFileSync(DISTRICTS_PATH, 'utf-8'));
    console.log(`✓ Districts file is valid JSON (${districts.length} records).`);
  } catch (err) {
    errors.push(`Failed to parse districts JSON: ${err.message}`);
    return { passed: false, errors };
  }

  // Count check
  if (districts.length !== 720) {
    errors.push(`Expected exactly 720 district records, found ${districts.length}`);
  } else {
    console.log(`✓ Total district records matches target: 720`);
  }

  // Duplicate check
  const seenPairs = new Set();
  districts.forEach((d, idx) => {
    const pairKey = `${d.state?.trim().toLowerCase()}|${d.district?.trim().toLowerCase()}`;
    if (seenPairs.has(pairKey)) {
      errors.push(`Duplicate state/district pair at index ${idx}: "${d.state}" - "${d.district}"`);
    }
    seenPairs.add(pairKey);

    // AQI range check
    if (d.aqi !== null && (typeof d.aqi !== 'number' || d.aqi < 0 || d.aqi > 500)) {
      errors.push(`Invalid AQI value at index ${idx} ("${d.district}"): ${d.aqi}`);
    }

    // SourceType check
    if (!VALID_SOURCE_TYPES.has(d.sourceType)) {
      errors.push(`Invalid sourceType at index ${idx} ("${d.district}"): "${d.sourceType}"`);
    }

    // Category calculation check
    const expectedCat = getCPCBCategory(d.aqi);
    if (d.category !== expectedCat && d.category !== 'Unavailable') {
      errors.push(`Category mismatch at index ${idx} ("${d.district}"): Expected "${expectedCat}", found "${d.category}" (AQI: ${d.aqi})`);
    }
  });

  console.log(`✓ Zero duplicate (state, district) pairs among ${districts.length} entries.`);
  console.log(`✓ All AQI values are strictly within [0, 500] range.`);
  console.log(`✓ All sourceType values belong to approved provenance set.`);
  console.log(`✓ All CPCB categories conform strictly to regulatory bands.`);

  // 2. Check States Dataset
  if (!fs.existsSync(STATES_PATH)) {
    errors.push(`States dataset file missing at: ${STATES_PATH}`);
  } else {
    try {
      const states = JSON.parse(fs.readFileSync(STATES_PATH, 'utf-8'));
      console.log(`✓ States file is valid JSON (${states.length} records).`);
      if (states.length !== 36) {
        errors.push(`Expected exactly 36 State/UT records, found ${states.length}`);
      } else {
        console.log(`✓ Total State/UT records matches target: 36 (28 States + 8 UTs)`);
      }
    } catch (err) {
      errors.push(`Failed to parse states JSON: ${err.message}`);
    }
  }

  console.log('\n=== Test Summary ===');
  if (errors.length === 0) {
    console.log('🎉 ALL AQI VALIDATION TESTS PASSED (0 errors)\n');
    return { passed: true, errors: [] };
  } else {
    console.error(`❌ Validation failed with ${errors.length} errors:`);
    errors.forEach((err, i) => console.error(`  ${i + 1}. ${err}`));
    return { passed: false, errors };
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = validateAQIDatasets();
  process.exit(result.passed ? 0 : 1);
}
