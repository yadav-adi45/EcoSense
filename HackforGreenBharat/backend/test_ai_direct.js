import "dotenv/config";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function testKeys() {
  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const models = await groq.models.list();
      console.log("Groq available models:", models.data.map(m => m.id).slice(0, 5));
    } catch (e) {
      console.error("Groq list error:", e.message);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are an AI Writing Assistant. Rewrite "yeah ok I will send it tomorrow" in style "Professional". Return ONLY the rewritten sentence.`;
      const res = await model.generateContent(prompt);
      console.log("Gemini rewrite test:", res.response.text().trim());
    } catch (e) {
      console.error("Gemini error:", e.message);
    }
  }
}

testKeys();
