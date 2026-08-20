import { AnimalReport } from "../model/AnimalReport.js";
import { AnimalRiskSegment } from "../model/AnimalRiskSegment.js";
import { RoadkillObservation } from "../model/RoadkillObservation.js";
import {
  calculateAnimalRisk,
  getCommonAnimals,
  updateAnimalRiskSegment,
} from "../utils/animalRiskScoring.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import DataURIParser from "datauri/parser.js";

const parser = new DataURIParser();

/**
 * POST /api/v12/animal-report
 * User reports an animal sighting
 */
export const reportAnimal = async (req, res) => {
  try {
    const { latitude, longitude, animalType, animalCategory, sightingType, description, weatherCondition } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!latitude || !longitude || !animalType || !sightingType) {
      return res.status(400).json({
        success: false,
        message: "latitude, longitude, animalType, and sightingType are required",
      });
    }

    // Get current time for sighting
    const now = new Date();
    const currentHour = now.getHours();

    // Handle photo upload if provided
    let photoUrl = null;
    if (req.file) {
      try {
        const dataUri = parser.format(req.file.mimetype, req.file.buffer);
        const cloudinaryResult = await uploadToCloudinary(dataUri.content);
        photoUrl = cloudinaryResult.secure_url;
      } catch (uploadError) {
        console.error("[reportAnimal] Photo upload failed:", uploadError.message);
        // Continue without photo
      }
    }

    // Create animal report
    const report = await AnimalReport.create({
      userId,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      animalType: animalType.toLowerCase().trim(),
      animalCategory: animalCategory || "mammal",
      sightingType,
      description: description || "",
      photo: photoUrl,
      timeOfSighting: {
        hour: currentHour,
        date: now,
      },
      weatherCondition: weatherCondition || "clear",
      reportedAt: now,
    });

    // Generate road segment ID based on location (simplified)
    const segmentId = `seg_${latitude.toFixed(3)}_${longitude.toFixed(3)}`;
    report.roadSegmentId = segmentId;
    await report.save();

    // Update animal risk segment asynchronously (don't wait)
    updateAnimalRiskSegment(segmentId, parseFloat(longitude), parseFloat(latitude), currentHour).catch(
      (err) => console.error("[reportAnimal] Risk update failed:", err.message)
    );

    console.log(`[reportAnimal] New report: ${animalType} at (${latitude}, ${longitude}) by user ${userId}`);

    res.status(201).json({
      success: true,
      message: "Animal report submitted successfully",
      report: {
        id: report._id,
        animalType: report.animalType,
        sightingType: report.sightingType,
        location: { lat: latitude, lon: longitude },
        reportedAt: report.reportedAt,
        photo: report.photo,
      },
    });
  } catch (error) {
    console.error("[reportAnimal] Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v12/animal-risk
 * Get animal risk for a specific location
 */
export const getAnimalRisk = async (req, res) => {
  try {
    const { latitude, longitude, hour } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "latitude and longitude query parameters are required",
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const currentHour = hour ? parseInt(hour) : new Date().getHours();

    // Calculate animal risk
    const riskData = await calculateAnimalRisk(lon, lat, currentHour);

    // Get common animals in area
    const commonAnimals = await getCommonAnimals(lon, lat, 5);

    res.json({
      success: true,
      location: { lat, lon },
      animalRisk: riskData.animalRisk,
      riskLevel: riskData.riskLevel,
      breakdown: riskData.breakdown,
      factors: riskData.factors,
      commonAnimals: commonAnimals.slice(0, 5),
      timeOfDay: currentHour,
      warning:
        riskData.animalRisk > 75
          ? "⚠️ Very High Animal Activity Zone - Consider alternative route"
          : riskData.animalRisk > 50
          ? "⚠️ High Animal Activity - Drive carefully"
          : null,
    });
  } catch (error) {
    console.error("[getAnimalRisk] Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v12/animal-hotspots
 * Get all animal risk hotspots in an area
 */
export const getAnimalHotspots = async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "latitude and longitude query parameters are required",
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radiusKm = radius ? parseFloat(radius) : 10;

    // Find high-risk segments nearby
    const hotspots = await AnimalRiskSegment.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lon, lat],
          },
          $maxDistance: radiusKm * 1000,
        },
      },
      animalRisk: { $gte: 50 }, // Only show moderate to very high risk
    })
      .limit(20)
      .lean();

    const formattedHotspots = hotspots.map((h) => ({
      segmentId: h.roadSegmentId,
      location: {
        lat: h.location.coordinates[1],
        lon: h.location.coordinates[0],
      },
      animalRisk: h.animalRisk,
      riskLevel: h.riskLevel,
      animals: h.animals,
      factors: h.animalRiskFactors,
      lastUpdated: h.lastUpdated,
    }));

    res.json({
      success: true,
      hotspots: formattedHotspots,
      count: formattedHotspots.length,
      searchRadius: `${radiusKm} km`,
    });
  } catch (error) {
    console.error("[getAnimalHotspots] Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v12/animal-reports/nearby
 * Get recent animal reports near a location
 */
export const getNearbyReports = async (req, res) => {
  try {
    const { latitude, longitude, radius, days } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "latitude and longitude query parameters are required",
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radiusKm = radius ? parseFloat(radius) : 5;
    const daysBack = days ? parseInt(days) : 30;

    const reports = await AnimalReport.findNearby(lon, lat, radiusKm, daysBack)
      .populate("userId", "name")
      .limit(50)
      .lean();

    const formattedReports = reports.map((r) => ({
      id: r._id,
      animalType: r.animalType,
      sightingType: r.sightingType,
      location: {
        lat: r.location.coordinates[1],
        lon: r.location.coordinates[0],
      },
      reportedBy: r.userId?.name || "Anonymous",
      reportedAt: r.reportedAt,
      photo: r.photo,
      description: r.description,
    }));

    res.json({
      success: true,
      reports: formattedReports,
      count: formattedReports.length,
      searchRadius: `${radiusKm} km`,
      timeRange: `Last ${daysBack} days`,
    });
  } catch (error) {
    console.error("[getNearbyReports] Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v12/animal-stats
 * Get animal statistics for a region
 */
export const getAnimalStats = async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "latitude and longitude query parameters are required",
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radiusKm = radius ? parseFloat(radius) : 10;

    // Get roadkill count
    const roadkillCount = await RoadkillObservation.countInArea(lon, lat, radiusKm, 5);

    // Get user report count
    const userReportCount = await AnimalReport.countInArea(lon, lat, radiusKm, 90);

    // Get common animals
    const commonAnimals = await getCommonAnimals(lon, lat, radiusKm);

    // Get high-risk segments count
    const hotspotCount = await AnimalRiskSegment.countDocuments({
      location: {
        $geoWithin: {
          $centerSphere: [[lon, lat], radiusKm / 6378.1],
        },
      },
      animalRisk: { $gte: 50 },
    });

    res.json({
      success: true,
      stats: {
        roadkillRecords: roadkillCount,
        userReports: userReportCount,
        hotspots: hotspotCount,
        commonAnimals: commonAnimals.slice(0, 10),
        searchRadius: `${radiusKm} km`,
      },
    });
  } catch (error) {
    console.error("[getAnimalStats] Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v12/my-reports
 * Get current user's animal reports
 */
export const getMyReports = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const reports = await AnimalReport.find({ userId })
      .sort({ reportedAt: -1 })
      .limit(50)
      .lean();

    const formattedReports = reports.map((r) => ({
      id: r._id,
      animalType: r.animalType,
      sightingType: r.sightingType,
      location: {
        lat: r.location.coordinates[1],
        lon: r.location.coordinates[0],
      },
      reportedAt: r.reportedAt,
      photo: r.photo,
      description: r.description,
      verified: r.verified,
    }));

    res.json({
      success: true,
      reports: formattedReports,
      count: formattedReports.length,
    });
  } catch (error) {
    console.error("[getMyReports] Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
