import express from "express";
import {
  cityPollutionController,
  getLiveStatesAQI,
  getLiveLocationAQI,
} from "../controller/cityPollutionController.js";

const city = express.Router();

city.post("/city", cityPollutionController);
city.get("/states-aqi", getLiveStatesAQI);
city.get("/live-location", getLiveLocationAQI);

export default city;