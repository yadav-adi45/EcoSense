import express from "express";
import { receiveAlert, getLatestAlert } from "../controller/pathwayController.js";

const pathwayRouter = express.Router();

pathwayRouter.post("/alert", receiveAlert);
pathwayRouter.get("/alert", getLatestAlert);

export default pathwayRouter;
