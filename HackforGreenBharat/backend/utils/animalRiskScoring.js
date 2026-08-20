import { RoadkillObservation } from "../model/RoadkillObservation.js";
import { AnimalReport } from "../model/AnimalReport.js";
import { AnimalRiskSegment } from "../model/AnimalRiskSegment.js";

/**
 * Calculate Animal Risk Score (0-100) for a road segment
 * This is a TRANSPARENT algorithm - no ML, fully explainable
 * 
 * Risk Factors:
 * - Historical roadkill count (40%)
 * - Animal observations (25%)
 * - User reports (20%)
 * - Forest proximity (10%)
 * - Water proximity (5%)
 * - Time-of-day multiplier
 */

/* ============ CONFIGURATION ============ */
const WEIGHTS = {
  roadkill: 0.40,
  observations: 0.25,
  userReports: 0.20,
  forestProximity: 0.10,
  waterProximity: 0.05,
};

const SEARCH_RADIUS_KM = 5; // Search within 5km corridor radius
const ROADKILL_YEARS_BACK = 10; // Look at historical roadkill data
const USER_REPORTS_DAYS_BACK = 90; // Last 90 days for user reports

// Peak animal activity hours (dawn and dusk)
const PEAK_HOURS = {
  dawn: { start: 5, end: 8 },
  dusk: { start: 18, end: 22 },
};

/* ============ HELPER FUNCTIONS ============ */

/**
 * Haversine distance calculation (km)
 */
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Normalize a value to 0-100 scale
 */
const normalize = (value, min, max) => {
  if (value <= min) return 0;
  if (value >= max) return 100;
  return ((value - min) / (max - min)) * 100;
};

/**
 * Calculate roadkill factor (0-100)
 * Based on historical roadkill count in the area
 */
const calculateRoadkillFactor = async (lon, lat) => {
  try {
    const count = await RoadkillObservation.countInArea(
      lon,
      lat,
      SEARCH_RADIUS_KM,
      ROADKILL_YEARS_BACK
    );

    // Normalize: 0 roadkills = 0, 10+ roadkills = 100
    return normalize(count, 0, 10);
  } catch (error) {
    console.error("[animalRiskScoring] Roadkill factor error:", error.message);
    return 0;
  }
};

/**
 * Calculate animal observation factor (0-100)
 * Based on iNaturalist, GBIF, and other observation data
 */
const calculateObservationFactor = async (lon, lat) => {
  try {
    // Count observations from non-roadkill sources
    const observationCount = await RoadkillObservation.countDocuments({
      location: {
        $geoWithin: {
          $centerSphere: [[lon, lat], SEARCH_RADIUS_KM / 6378.1],
        },
      },
      datasetSource: { $in: ["inaturalist", "gbif", "other"] },
    });

    // Normalize: 0 observations = 0, 20+ observations = 100
    return normalize(observationCount, 0, 20);
  } catch (error) {
    console.error("[animalRiskScoring] Observation factor error:", error.message);
    return 0;
  }
};

/**
 * Calculate user report factor (0-100)
 * Based on recent user-contributed animal sightings
 */
const calculateUserReportFactor = async (lon, lat) => {
  try {
    const reportCount = await AnimalReport.countInArea(
      lon,
      lat,
      SEARCH_RADIUS_KM,
      USER_REPORTS_DAYS_BACK
    );

    // Normalize: 0 reports = 0, 8+ reports = 100
    return normalize(reportCount, 0, 8);
  } catch (error) {
    console.error("[animalRiskScoring] User report factor error:", error.message);
    return 0;
  }
};

/**
 * Calculate forest proximity factor (0-100)
 * Closer to forest = higher risk
 * 
 * NOTE: This is a placeholder. In production, integrate with:
 * - OpenStreetMap forest/nature reserve data
 * - Protected area databases
 * - Satellite imagery analysis
 */
const calculateForestProximityFactor = (forestDistanceKm) => {
  if (forestDistanceKm === null || forestDistanceKm === undefined) {
    return 30; // Default moderate risk if unknown
  }

  // Normalize: >10km = 0, <1km = 100
  if (forestDistanceKm >= 10) return 0;
  if (forestDistanceKm <= 1) return 100;

  return 100 - normalize(forestDistanceKm, 1, 10);
};

/**
 * Calculate water proximity factor (0-100)
 * Animals often cross roads to reach water sources
 * 
 * NOTE: Placeholder - integrate with water body databases
 */
const calculateWaterProximityFactor = (waterDistanceKm) => {
  if (waterDistanceKm === null || waterDistanceKm === undefined) {
    return 20; // Default low-moderate risk if unknown
  }

  // Normalize: >5km = 0, <0.5km = 100
  if (waterDistanceKm >= 5) return 0;
  if (waterDistanceKm <= 0.5) return 100;

  return 100 - normalize(waterDistanceKm, 0.5, 5);
};

/**
 * Get time-of-day multiplier for animal activity
 * Dawn and dusk have highest activity
 */
const getTimeMultiplier = (currentHour) => {
  if (currentHour === null || currentHour === undefined) {
    return 1.0; // No adjustment if time unknown
  }

  // Dawn period (5-8 AM): 1.5x multiplier
  if (currentHour >= PEAK_HOURS.dawn.start && currentHour < PEAK_HOURS.dawn.end) {
    return 1.5;
  }

  // Dusk period (6-10 PM): 2.0x multiplier (highest activity)
  if (currentHour >= PEAK_HOURS.dusk.start && currentHour < PEAK_HOURS.dusk.end) {
    return 2.0;
  }

  // Night (10 PM - 5 AM): 1.3x multiplier
  if (currentHour >= 22 || currentHour < 5) {
    return 1.3;
  }

  // Daytime (8 AM - 6 PM): 0.7x multiplier (lower activity)
  return 0.7;
};

/**
 * Main function: Calculate Animal Risk Score
 * 
 * @param {number} lon - Longitude
 * @param {number} lat - Latitude
 * @param {number} currentHour - Current hour (0-23), optional
 * @param {number} forestDistanceKm - Distance to nearest forest (optional)
 * @param {number} waterDistanceKm - Distance to nearest water body (optional)
 * @returns {Promise<Object>} Risk score and breakdown
 */
export const calculateAnimalRisk = async (
  lon,
  lat,
  currentHour = null,
  forestDistanceKm = null,
  waterDistanceKm = null
) => {
  try {
    // Calculate individual factors
    const roadkillFactor = await calculateRoadkillFactor(lon, lat);
    const observationFactor = await calculateObservationFactor(lon, lat);
    const userReportFactor = await calculateUserReportFactor(lon, lat);
    const forestFactor = calculateForestProximityFactor(forestDistanceKm);
    const waterFactor = calculateWaterProximityFactor(waterDistanceKm);

    // Calculate base risk (weighted sum)
    const baseRisk =
      roadkillFactor * WEIGHTS.roadkill +
      observationFactor * WEIGHTS.observations +
      userReportFactor * WEIGHTS.userReports +
      forestFactor * WEIGHTS.forestProximity +
      waterFactor * WEIGHTS.waterProximity;

    // Apply time-of-day multiplier
    const timeMultiplier = getTimeMultiplier(currentHour);
    const adjustedRisk = Math.min(baseRisk * timeMultiplier, 100);

    // Determine risk level
    let riskLevel = "Low";
    if (adjustedRisk > 75) riskLevel = "Very High";
    else if (adjustedRisk > 50) riskLevel = "High";
    else if (adjustedRisk > 25) riskLevel = "Moderate";

    return {
      animalRisk: Math.round(adjustedRisk),
      riskLevel,
      breakdown: {
        roadkillFactor: Math.round(roadkillFactor),
        observationFactor: Math.round(observationFactor),
        userReportFactor: Math.round(userReportFactor),
        forestFactor: Math.round(forestFactor),
        waterFactor: Math.round(waterFactor),
        baseRisk: Math.round(baseRisk),
        timeMultiplier: timeMultiplier.toFixed(1),
      },
      factors: {
        roadkillCount: await RoadkillObservation.countInArea(lon, lat, SEARCH_RADIUS_KM, ROADKILL_YEARS_BACK),
        observationCount: await RoadkillObservation.countDocuments({
          location: {
            $geoWithin: {
              $centerSphere: [[lon, lat], SEARCH_RADIUS_KM / 6378.1],
            },
          },
          datasetSource: { $in: ["inaturalist", "gbif", "other"] },
        }),
        userReportCount: await AnimalReport.countInArea(lon, lat, SEARCH_RADIUS_KM, USER_REPORTS_DAYS_BACK),
        forestDistanceKm,
        waterDistanceKm,
      },
    };
  } catch (error) {
    console.error("[calculateAnimalRisk] Error:", error.message);
    return {
      animalRisk: 0,
      riskLevel: "Unknown",
      breakdown: {},
      factors: {},
      error: error.message,
    };
  }
};

/**
 * Calculate animal risk for multiple points along a route
 * 
 * @param {Array} routePoints - Array of {lat, lon} objects
 * @param {number} currentHour - Current hour (0-23)
 * @returns {Promise<Object>} Average risk and segment risks
 */
export const calculateRouteAnimalRisk = async (routePoints, currentHour = null) => {
  try {
    if (!routePoints || routePoints.length === 0) {
      return {
        averageRisk: 0,
        maxRisk: 0,
        riskLevel: "Low",
        segments: [],
      };
    }

    // Calculate risk for each point
    const segmentRisks = await Promise.all(
      routePoints.map(async (point) => {
        const risk = await calculateAnimalRisk(point.lon, point.lat, currentHour);
        return {
          lat: point.lat,
          lon: point.lon,
          animalRisk: risk.animalRisk,
          riskLevel: risk.riskLevel,
          breakdown: risk.breakdown,
        };
      })
    );

    // Calculate average and max risk
    const riskScores = segmentRisks.map((s) => s.animalRisk);
    const averageRisk = Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length);
    const maxRisk = Math.max(...riskScores);

    let overallRiskLevel = "Low";
    if (maxRisk > 75) overallRiskLevel = "Very High";
    else if (maxRisk > 50) overallRiskLevel = "High";
    else if (averageRisk > 25) overallRiskLevel = "Moderate";

    return {
      averageRisk,
      maxRisk,
      riskLevel: overallRiskLevel,
      segments: segmentRisks,
    };
  } catch (error) {
    console.error("[calculateRouteAnimalRisk] Error:", error.message);
    return {
      averageRisk: 0,
      maxRisk: 0,
      riskLevel: "Unknown",
      segments: [],
      error: error.message,
    };
  }
};

/**
 * Get animals commonly seen in an area
 */
export const getCommonAnimals = async (lon, lat, radiusKm = 5) => {
  try {
    const speciesBreakdown = await RoadkillObservation.getSpeciesBreakdown(lon, lat, radiusKm);
    return speciesBreakdown.map((s) => ({
      name: s._id || "Unknown",
      count: s.count,
      category: s.category,
    }));
  } catch (error) {
    console.error("[getCommonAnimals] Error:", error.message);
    return [];
  }
};

/**
 * Update or create an animal risk segment
 */
export const updateAnimalRiskSegment = async (roadSegmentId, lon, lat, currentHour = null) => {
  try {
    const riskData = await calculateAnimalRisk(lon, lat, currentHour);
    const commonAnimals = await getCommonAnimals(lon, lat);

    const segment = await AnimalRiskSegment.findOneAndUpdate(
      { roadSegmentId },
      {
        location: {
          type: "Point",
          coordinates: [lon, lat],
        },
        animalRisk: riskData.animalRisk,
        animalRiskFactors: {
          roadkillCount: riskData.factors.roadkillCount || 0,
          animalObservationCount: riskData.factors.observationCount || 0,
          userReportCount: riskData.factors.userReportCount || 0,
          forestProximityKm: riskData.factors.forestDistanceKm,
          waterProximityKm: riskData.factors.waterDistanceKm,
        },
        animals: commonAnimals.map((a) => a.name),
        riskLevel: riskData.riskLevel,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    segment.updateRiskLevel();
    await segment.save();

    return segment;
  } catch (error) {
    console.error("[updateAnimalRiskSegment] Error:", error.message);
    throw error;
  }
};
