import express from "express";
import isAuthenticated from "../middleware/isAuthenticated.js";
import { singleUpload } from "../middleware/multer.js";
import {
  getMyProfile,
  updateProfile,
  generateAIBio,
} from "../controller/profileController.js";

const profileRouter = express.Router();

// GET current logged-in user profile & stats
profileRouter.get("/profile/me", isAuthenticated, getMyProfile);

// UPDATE profile (bio, location, phone, interests, and profile photo)
profileRouter.put("/profile/update", isAuthenticated, singleUpload, updateProfile);

// AI-powered Bio generator & refiner
profileRouter.post("/profile/ai-bio", isAuthenticated, generateAIBio);

export default profileRouter;
