import mongoose from "mongoose";

const roadkillObservationSchema = new mongoose.Schema(
  {
    datasetSource: {
      type: String,
      required: true,
      enum: [
        "india_roadkill_monitoring",
        "global_roadkill",
        "anamalai_hills",
        "tirupati",
        "inaturalist",
        "gbif",
        "user_report",
        "other",
      ],
    },
    externalId: {
      type: String,
      index: true,
      sparse: true,
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
    species: {
      commonName: {
        type: String,
        trim: true,
      },
      scientificName: {
        type: String,
        trim: true,
      },
      category: {
        type: String,
        enum: ["mammal", "bird", "reptile", "amphibian", "other"],
        default: "mammal",
      },
    },
    observationDate: {
      type: Date,
      required: true,
    },
    observationTime: {
      hour: {
        type: Number,
        min: 0,
        max: 23,
      },
      minute: {
        type: Number,
        min: 0,
        max: 59,
      },
    },
    roadType: {
      type: String,
      enum: ["highway", "state_road", "rural_road", "city_road", "unknown"],
      default: "unknown",
    },
    locality: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      default: "India",
    },
    metadata: {
      photoUrl: String,
      observerName: String,
      weatherCondition: String,
      trafficDensity: String,
      vegetationType: String,
      additionalNotes: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    roadSegmentId: {
      type: String,
      index: true,
    },
    importedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Geospatial index
roadkillObservationSchema.index({ location: "2dsphere" });

// Compound indexes
roadkillObservationSchema.index({ datasetSource: 1, observationDate: -1 });
roadkillObservationSchema.index({ "species.category": 1, observationDate: -1 });
roadkillObservationSchema.index({ roadSegmentId: 1, observationDate: -1 });

// Prevent duplicate imports from same dataset
roadkillObservationSchema.index({ datasetSource: 1, externalId: 1 }, { unique: true, sparse: true });

// Static method to find observations near location
roadkillObservationSchema.statics.findNearby = function (lon, lat, maxDistanceKm = 5, yearsBack = 5) {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - yearsBack);

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
    observationDate: { $gte: cutoffDate },
  });
};

// Static method to count roadkills in area
roadkillObservationSchema.statics.countInArea = function (lon, lat, radiusKm = 2, yearsBack = 5) {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - yearsBack);

  return this.countDocuments({
    location: {
      $geoWithin: {
        $centerSphere: [[lon, lat], radiusKm / 6378.1],
      },
    },
    observationDate: { $gte: cutoffDate },
  });
};

// Static method to get species breakdown
roadkillObservationSchema.statics.getSpeciesBreakdown = async function (lon, lat, radiusKm = 5) {
  return this.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [lon, lat] },
        distanceField: "distance",
        maxDistance: radiusKm * 1000,
        spherical: true,
      },
    },
    {
      $group: {
        _id: "$species.commonName",
        count: { $sum: 1 },
        category: { $first: "$species.category" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
};

export const RoadkillObservation = mongoose.model("RoadkillObservation", roadkillObservationSchema);
