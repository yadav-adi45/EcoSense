import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import OpenAI from "openai";

const cleanAIOutput = (raw) => {
  if (!raw) return "";
  // 1. Strip <think>...</think> and any incomplete <think> tags
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>[\s\S]*/gi, "");
  // 2. Remove markdown code blocks if present
  cleaned = cleaned.replace(/```[\s\S]*?```/gi, "");
  // 3. Remove leading markdown bold headers or bullet points if user just wanted rewritten text
  cleaned = cleaned.trim();
  const lines = cleaned.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length > 0) {
    let first = lines[0].replace(/^\*\*|\*\*$/g, "").replace(/^["'`]|["'`]$/g, "").trim();
    cleaned = first;
  }
  return cleaned.replace(/^["'`]|["'`]$/g, "").trim();
};

export const aiWritingAssistantController = async (req, res) => {
  try {
    const { text, style = "Professional", context = "general" } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please write something first!",
      });
    }

    const systemPrompt = `You are an expert AI Writing and Reply Assistant.
Your task is to rewrite, refine, or draft content according to the requested style: "${style}".

Style Guidelines:
- "Professional": Make the tone formal, polished, grammatically impeccable, polite, and executive.
- "Casual": Make it friendly, relaxed, conversational, and natural.
- "Shorten": Make it concise, punchy, and direct in a single short sentence while preserving all essential facts.
- "Eco-Inspiring": Infuse active sustainability enthusiasm, positive environmental impact, and eco-friendly motivation.
- "Fix Grammar": Fix spelling, punctuation, capitalization, and flow while keeping the original phrasing intact.

CRITICAL INSTRUCTIONS:
- Return ONLY the rewritten text.
- Do NOT include any <think> tags, no reasoning process, no quotes, no introductory text (like "Here is your rewrite:"), no explanations, and no markdown formatting.`;

    const userPrompt = `Input Text: "${text}"
Target Style: ${style}
Context: ${context}

Rewritten Text:`;

    // 1. Primary: Gemini (Super-fast and reliable)
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
        const response = await result.response;
        const rewrittenText = cleanAIOutput(response.text());
        if (rewrittenText) {
          return res.json({
            success: true,
            rewrittenText,
            style,
            provider: "gemini",
          });
        }
      } catch (err) {
        console.warn("Gemini AI rewrite fallback:", err.message);
      }
    }

    // 2. Fallback: OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.3,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });
        const rewrittenText = cleanAIOutput(completion.choices[0]?.message?.content);
        if (rewrittenText) {
          return res.json({
            success: true,
            rewrittenText,
            style,
            provider: "openai",
          });
        }
      } catch (err) {
        console.warn("OpenAI rewrite fallback:", err.message);
      }
    }

    // 3. Fallback: Groq (using non-thinking fast model)
    if (process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const groqModel = "openai/gpt-oss-20b";
        const completion = await groq.chat.completions.create({
          model: groqModel,
          temperature: 0.2,
          max_tokens: 300,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const rewrittenText = cleanAIOutput(completion.choices[0]?.message?.content);
        if (rewrittenText) {
          return res.json({
            success: true,
            rewrittenText,
            style,
            provider: "groq",
          });
        }
      } catch (err) {
        console.warn("Groq AI rewrite fallback:", err.message);
      }
    }

    return res.status(500).json({
      success: false,
      message: "AI service temporarily unavailable. Please try again.",
    });
  } catch (error) {
    console.error("AI Writing Assistant Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to enhance writing",
    });
  }
};
