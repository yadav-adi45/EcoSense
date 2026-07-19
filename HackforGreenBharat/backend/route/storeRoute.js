import express from "express";
import { getEcoStores } from "../controller/storeController.js";

const storeRouter = express.Router();

storeRouter.get("/store", getEcoStores);

export default storeRouter;
