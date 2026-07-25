import "./config/dns.js"; // Force Google DNS before any network calls
import https from "https";
import axios from "axios";

// Disable SSL verification globally — needed for networks with SSL inspection (antivirus/proxy)
axios.defaults.httpsAgent = new https.Agent({ rejectUnauthorized: false });

import express from "express";
import dotenv from "dotenv";
import database from "./utils/database.js";
import userRouter from "./route/UserRoute.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import geoRouter from "./route/routeRouter.js";
import chat from "./route/chatRoute.js";
import eco from "./route/ecoRoute.js";
import city from "./route/cityPollution.js";
import router from "./route/challengeRoutes.js";
import AiRouter from "./route/ecoAi.js";
import billrouter from "./route/billRoutes.js";
import pathwayRouter from "./route/pathwayRoute.js";
import storeRouter from "./route/storeRoute.js";
import communityRouter from "./route/communityRoutes.js";

dotenv.config();

const app = express();

/* ✅ CORS FIX */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://ecosense-8.onrender.com",
      "https://timely-pastelito-b3d105.netlify.app",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

database();

/* ROUTES */
app.use("/api/v1", userRouter);
app.use("/api/v2", geoRouter);
app.use("/api/v3", chat);
app.use("/api/v4", eco);
app.use("/api/v5", city);
app.use("/api/v6", router);
app.use("/api/v7", AiRouter);
app.use("/api/v8", billrouter);
app.use("/api/v9", pathwayRouter);
app.use("/api/v10", storeRouter);
app.use("/api/v11", communityRouter);

/* PORT (Render compatible) */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});