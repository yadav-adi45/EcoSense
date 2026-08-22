import express from "express";
import { ecoBotController } from "../controller/chatController.js";
import { aiWritingAssistantController } from "../controller/aiAssistController.js";

const chat = express.Router();

chat.post("/chat", ecoBotController);
chat.post("/ai-write", aiWritingAssistantController);
chat.post("/enhance", aiWritingAssistantController);

export default chat;