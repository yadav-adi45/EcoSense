import express from "express";
import {
  reportAnimal,
  getAnimalRisk,
  getAnimalHotspots,
  getNearbyReports,
  getAnimalStats,
  getMyReports,
} from "../controller/animalController.js";
import isAuthenticated from "../middleware/isAuthenticated.js";
import { upload } from "../middleware/multer.js";

const animalRouter = express.Router();

// POST: Report animal sighting (authenticated, with photo upload)
animalRouter.post("/animal-report", isAuthenticated, upload.single("photo"), reportAnimal);

// GET: Get animal risk for a location
animalRouter.get("/animal-risk", getAnimalRisk);

// GET: Get animal hotspots in an area
animalRouter.get("/animal-hotspots", getAnimalHotspots);

// GET: Get nearby animal reports
animalRouter.get("/animal-reports/nearby", getNearbyReports);

// GET: Get animal statistics for a region
animalRouter.get("/animal-stats", getAnimalStats);

// GET: Get current user's reports (authenticated)
animalRouter.get("/my-reports", isAuthenticated, getMyReports);

export default animalRouter;
