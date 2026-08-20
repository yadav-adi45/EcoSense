import mongoose from "mongoose";

const animalReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    animalType: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    animalCategory: {
      type: String,
      enum: ["mammal", "bird", "reptile", "other"],
      default: "mammal",
    },
    sightingType: {
      type: String,
      enum: ["alive", "roadkill", "crossing", "near_road"],
      required: true,
    },
    description: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    photo: {
      type: String, // Cloudinary URL
      default: null,
    },
    reportedAt: {
      type: Date,
      default: Date.now,
    },
    timeOfSighting: {
      hour: {
        type: Number,
        min: 0,
        max: 23,
      },
      date: {
        type: Date,
      },
    },
    verified: {
      type: Boolean,
      default: false,
    },
    confidence: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    roadSegmentId: {
      type: String,
      index: true,
    },
    weatherCondition: {
      type: String,
      enum: ["clear", "rainy", "foggy", "other"],
      default: "clear",
    },
  },
  { timestamps: true }
);

// Geospatial index for location queries
animalReportSchema.index({ location: "2dsphere" });

// Compound indexes for efficient querying
animalReportSchema.index({ sightingType: 1, reportedAt: -1 });
animalReportSchema.index({ userId: 1, reportedAt: -1 });
animalReportSchema.index({ roadSegmentId: 1, animalType: 1 });

// Static method to find reports near a location
animalReportSchema.statics.findNearby = function (lon, lat, maxDistanceKm = 2, daysBack = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  return this.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lon, lat],
        },
        $maxDistance: maxDistanceKm * 1000,
      },
    },
    reportedAt: { $gte: cutoffDate },
  });
};

// Static method to count reports in an area
animalReportSchema.statics.countInArea = function (lon, lat, radiusKm = 1, daysBack = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  return this.countDocuments({
    location: {
      $geoWithin: {
        $centerSphere: [[lon, lat], radiusKm / 6378.1], // Earth radius in km
      },
    },
    reportedAt: { $gte: cutoffDate },
  });
};

export const AnimalReport = mongoose.model("AnimalReport", animalReportSchema);
