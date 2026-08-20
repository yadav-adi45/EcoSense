import mongoose from "mongoose";

const animalRiskSegmentSchema = new mongoose.Schema(
  {
    roadSegmentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
    animalRisk: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    animalRiskFactors: {
      roadkillCount: {
        type: Number,
        default: 0,
      },
      animalObservationCount: {
        type: Number,
        default: 0,
      },
      userReportCount: {
        type: Number,
        default: 0,
      },
      forestProximityKm: {
        type: Number,
        default: null,
      },
      waterProximityKm: {
        type: Number,
        default: null,
      },
    },
    peakActivity: {
      startHour: {
        type: Number,
        min: 0,
        max: 23,
        default: 18, // 6 PM default
      },
      endHour: {
        type: Number,
        min: 0,
        max: 23,
        default: 22, // 10 PM default
      },
    },
    animals: [
      {
        type: String,
        lowercase: true,
      },
    ],
    riskLevel: {
      type: String,
      enum: ["Low", "Moderate", "High", "Very High"],
      default: "Low",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Geospatial index for location-based queries
animalRiskSegmentSchema.index({ location: "2dsphere" });

// Compound index for efficient querying
animalRiskSegmentSchema.index({ animalRisk: -1, lastUpdated: -1 });

// Method to update risk level based on animalRisk score
animalRiskSegmentSchema.methods.updateRiskLevel = function () {
  if (this.animalRisk <= 25) {
    this.riskLevel = "Low";
  } else if (this.animalRisk <= 50) {
    this.riskLevel = "Moderate";
  } else if (this.animalRisk <= 75) {
    this.riskLevel = "High";
  } else {
    this.riskLevel = "Very High";
  }
};

// Static method to find segments near a location
animalRiskSegmentSchema.statics.findNearby = function (lon, lat, maxDistanceKm = 5) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lon, lat],
        },
        $maxDistance: maxDistanceKm * 1000, // Convert km to meters
      },
    },
  });
};

export const AnimalRiskSegment = mongoose.model("AnimalRiskSegment", animalRiskSegmentSchema);
