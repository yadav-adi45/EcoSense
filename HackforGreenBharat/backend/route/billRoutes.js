import express from "express";
import multer from "multer";
import { analyzeBill, scanProductVision } from "../controller/billController.js";

const billrouter = express.Router();

// memory only (no storage)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

billrouter.post("/analyze", upload.single("bill"), analyzeBill);
billrouter.post("/scan-product", upload.single("image"), scanProductVision);

export default billrouter;