import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import OpenAI from "openai";

const cleanAIOutput = (raw) => {
  if (!raw) return "";
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>[\s\S]*/gi, "");
  return cleaned.trim();
};

export const ecoBotController = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        reply: "Please enter a message",
      });
    }

    const systemPrompt = "You are EcoBot, a helpful, enthusiastic, and knowledgeable sustainability and pollution assistant. Give clear, actionable, and practical eco-friendly advice in a friendly tone. Do not output any <think> tags.";

    // 1. Primary: Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(`${systemPrompt}\n\nUser: ${message}`);
        const response = await result.response;
        const text = cleanAIOutput(response.text());
        if (text) {
          return res.json({ reply: text });
        }
      } catch (e) {
        console.warn("EcoBot Gemini fallback:", e.message);
      }
    }

    // 2. Fallback: OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
        });
        const text = cleanAIOutput(response.choices[0]?.message?.content);
        if (text) return res.json({ reply: text });
      } catch (e) {
        console.warn("EcoBot OpenAI fallback:", e.message);
      }
    }

    // 3. Fallback: Groq
    if (process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const response = await groq.chat.completions.create({
          model: "openai/gpt-oss-20b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
        });
        const text = cleanAIOutput(response.choices[0]?.message?.content);
        if (text) return res.json({ reply: text });
      } catch (e) {
        console.warn("EcoBot Groq fallback:", e.message);
      }
    }

    res.json({
      reply: "I'm EcoBot! Try asking me about eco-friendly transport, reducing your carbon footprint, or earning EcoCoins!",
    });
  } catch (error) {
    console.error("EcoBot error:", error);
    res.status(500).json({
      reply: "EcoBot is currently unavailable 🌍",
    });
  }
};