import { User } from "../model/UserSchema.js";
import Assessment from "../model/Assessment.js";
import { CommunityPost } from "../model/CommunityPost.js";
import { EcoCoinTransaction } from "../model/EcoCoinTransaction.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import OpenAI from "openai";

const cleanAIOutput = (raw) => {
  if (!raw) return "";
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>[\s\S]*/gi, "");
  cleaned = cleaned.replace(/```[\s\S]*?```/gi, "");
  cleaned = cleaned.trim();
  const lines = cleaned.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length > 0) {
    cleaned = lines.join(" ");
  }
  return cleaned.replace(/^["'`]|["'`]$/g, "").trim();
};

// @desc   Get current user's profile and aggregated eco-statistics
// @route  GET /api/v1/profile/me
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 1. Fetch latest Eco Assessment
    const latestAssessment = await Assessment.findOne({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean();

    // 2. Fetch community posts count
    const communityPostsCount = await CommunityPost.countDocuments({ author: req.userId });

    // 3. Fetch EcoCoins transactions summary
    const transactions = await EcoCoinTransaction.find({ userId: req.userId }).lean();
    let totalEcoCoinsEarned = 0;
    let totalEcoCoinsSpent = 0;
    transactions.forEach((tx) => {
      if (tx.type === "earn") totalEcoCoinsEarned += tx.amount;
      if (tx.type === "spend") totalEcoCoinsSpent += tx.amount;
    });

    const ecoScore = latestAssessment?.score || 0;
    const ecoLevel = latestAssessment?.level || (ecoScore > 600 ? "High" : ecoScore > 300 ? "Moderate" : "Low");

    // Dynamic Carbon Saved calculation based on assessment & eco transactions
    const baseKg = Math.round((ecoScore / 900) * 200 + totalEcoCoinsEarned * 0.5);
    const carbonSaved = baseKg > 0 ? `${baseKg} kg` : "45 kg";
    const treesPlanted = Math.max(1, Math.floor(baseKg / 30));

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profile: {
          profilePhoto: user.profile?.profilePhoto || "",
          bio: user.profile?.bio || "",
          location: user.profile?.location || "",
          phone: user.profile?.phone || "",
          interests: user.profile?.interests || [],
        },
        ecoCoins: user.ecoCoins || 0,
        createdAt: user.createdAt,
      },
      stats: {
        ecoScore,
        ecoLevel,
        assessmentId: latestAssessment?._id || null,
        answers: latestAssessment?.answers || null,
        communityPosts: communityPostsCount,
        totalEcoCoinsEarned,
        totalEcoCoinsSpent,
        carbonSaved,
        treesPlanted,
        rank: Math.max(1, Math.min(25, 30 - Math.floor(ecoScore / 35))),
      },
    });
  } catch (error) {
    console.error("getMyProfile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

// @desc   Update user profile (bio, location, phone, interests, profilePhoto)
// @route  PUT /api/v1/profile/update
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { name, bio, location, phone, interests } = req.body;

    if (name && name.trim()) user.name = name.trim();

    if (!user.profile) {
      user.profile = {};
    }

    if (bio !== undefined) user.profile.bio = bio.trim().slice(0, 350);
    if (location !== undefined) user.profile.location = location.trim();
    if (phone !== undefined) user.profile.phone = phone.trim();

    if (interests !== undefined) {
      if (Array.isArray(interests)) {
        user.profile.interests = interests;
      } else if (typeof interests === "string") {
        try {
          user.profile.interests = JSON.parse(interests);
        } catch {
          user.profile.interests = interests.split(",").map((s) => s.trim()).filter(Boolean);
        }
      }
    }

    // Handle photo upload if present
    if (req.file) {
      const fileUri = getDataUri(req.file);
      const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
        folder: "EcoSense/profile",
        resource_type: "image",
      });
      user.profile.profilePhoto = cloudResponse.secure_url;
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully! 🌿",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        ecoCoins: user.ecoCoins || 0,
      },
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
};

// @desc   Generate or enhance personal eco bio using AI
// @route  POST /api/v1/profile/ai-bio
export const generateAIBio = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("name profile ecoCoins");
    const { currentBio = "", interests = [], promptTone = "Inspiring" } = req.body;

    const userName = user?.name || "Eco Citizen";
    const userInterests = interests.length > 0 ? interests.join(", ") : (user?.profile?.interests?.join(", ") || "Clean Air, Sustainable Living, EV Routes");
    const coins = user?.ecoCoins || 0;

    const systemPrompt = `You are the EcoSense AI Personal Branding Assistant for an environmental routing, health intelligence, and sustainability community.
Generate a concise, captivating personal bio (between 120 and 240 characters) suitable for a user's sustainability profile.
Tone style: "${promptTone}".

Key Guidelines:
- Highlight their passion for sustainability, green transit, clean air, and climate action.
- Mention their interests naturally if provided.
- Keep it under 240 characters.
- MUST NOT use quotation marks around the entire output.
- MUST NOT include any <think> tags, explanations, markdown code blocks, or greetings.
- Return ONLY the exact bio text ready to be pasted.`;

    const userPrompt = `User Name: ${userName}
Existing Bio/Notes: "${currentBio || "Looking to reduce carbon footprint, use green transit, and protect clean air."}"
Interests: ${userInterests}
EcoCoins Earned: ${coins}

Generate a short, inspiring bio:`;

    // 1. Primary: Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
        const response = await result.response;
        const generatedBio = cleanAIOutput(response.text());
        if (generatedBio) {
          return res.json({
            success: true,
            generatedBio,
            provider: "gemini",
          });
        }
      } catch (err) {
        console.warn("Gemini AI bio generation fallback:", err.message);
      }
    }

    // 2. Fallback: OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.7,
          max_tokens: 150,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });
        const generatedBio = cleanAIOutput(completion.choices[0]?.message?.content);
        if (generatedBio) {
          return res.json({
            success: true,
            generatedBio,
            provider: "openai",
          });
        }
      } catch (err) {
        console.warn("OpenAI bio generation fallback:", err.message);
      }
    }

    // 3. Fallback: Groq
    if (process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
          model: "openai/gpt-oss-20b",
          temperature: 0.6,
          max_tokens: 150,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });
        const generatedBio = cleanAIOutput(completion.choices[0]?.message?.content);
        if (generatedBio) {
          return res.json({
            success: true,
            generatedBio,
            provider: "groq",
          });
        }
      } catch (err) {
        console.warn("Groq bio generation fallback:", err.message);
      }
    }

    // Fallback template if all AI keys fail
    const defaultBio = `🌱 Green transit advocate & clean air champion. Tracking low-pollution routes and driving daily sustainable impact with EcoSense.`;
    return res.json({
      success: true,
      generatedBio: defaultBio,
      provider: "fallback",
    });
  } catch (error) {
    console.error("generateAIBio error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate bio with AI",
    });
  }
};
