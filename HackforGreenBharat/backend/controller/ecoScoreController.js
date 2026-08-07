import Groq from "groq-sdk";
import Assessment from "../model/Assessment.js";

// helper to clean ```json blocks
const cleanJSON = (text) =>
  text.replace(/```json|```/g, "").trim();

export const ecoScoreController = async (req, res) => {
  const userId = req.userId;
  const { answers } = req.body;

  let result;
  let useFallback = false;

  if (!process.env.GROQ_API_KEY) {
    useFallback = true;
  } else {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 15000 });
      const prompt = `
You are an environmental pollution expert.

Analyze pollution using PERSONAL and AREA factors.

User data:
${JSON.stringify(answers, null, 2)}

SCORING RULES:
- 0–400  = High Pollution Impact
- 401–700 = Moderate Pollution Impact
- 701–900 = Low Pollution Impact

Return ONLY valid JSON:
{
  "score": number,
  "level": string,
  "explanation": string,
  "precautions": {
    "personal": [string, string, string],
    "area": [string, string, string]
  }
}
`;
      const aiRes = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      });
      result = JSON.parse(
        cleanJSON(aiRes.choices[0].message.content)
      );
    } catch (e) {
      console.warn("Groq API failed. Reverting to rule-based fallback:", e);
      useFallback = true;
    }
  }

  if (useFallback) {
    let score = 550;
    const electricity = Number(answers?.electricity || 300);
    score -= (electricity / 1000) * 150;

    const transport = answers?.transport || "public";
    if (transport === "bike" || transport === "walk") score += 120;
    else if (transport === "electric") score += 100;
    else if (transport === "public") score += 60;
    else if (transport === "carpool") score += 30;
    else if (transport === "personal") score -= 80;

    const distance = Number(answers?.distance || 15);
    score -= (distance / 100) * 80;

    const diet = answers?.diet || "omnivore";
    if (diet === "vegan") score += 80;
    else if (diet === "vegetarian") score += 60;
    else if (diet === "flexitarian") score += 30;
    else if (diet === "omnivore") score -= 30;

    const recycling = answers?.recycling || "sometimes";
    if (recycling === "always") score += 60;
    else if (recycling === "mostly") score += 40;
    else if (recycling === "sometimes") score += 10;
    else if (recycling === "never") score -= 40;

    const home = answers?.home || "some";
    if (home === "all") score += 60;
    else if (home === "most") score += 40;
    else if (home === "some") score += 15;
    else if (home === "none") score -= 20;

    score = Math.max(50, Math.min(900, Math.round(score)));

    let level = "Moderate Pollution Impact";
    if (score >= 701) level = "Low Pollution Impact";
    else if (score < 401) level = "High Pollution Impact";

    result = {
      score,
      level,
      explanation: `Your calculated environmental impact score is ${score}/900. Your primary eco-drivers are transportation modes and dietary habits. Minimizing standby electricity consumption and switching to energy-efficient LED modules could easily elevate your rating further.`,
      precautions: {
        personal: [
          "Swap standard incandescent bulbs with smart energy-saving LED alternatives.",
          "Use active transportation (walking or biking) for short grocery commutes under 2 km.",
          "Verify and replace dusty home air-conditioner filters regularly to maintain efficiency."
        ],
        area: [
          "Organize localized waste segregation seminars with resident association committees.",
          "Request local municipal offices to install public solar charging hubs on streets.",
          "Collaborate with nearby schools to advocate for clean-air school zones."
        ]
      }
    };
  }

  try {
    const savedAssessment = await Assessment.create({
      userId,
      answers,
      score: result.score,
      level: result.level,
      aiExplanation: result.explanation,
      precautions: result.precautions,
    });

    const populatedAssessment = await Assessment.findById(
      savedAssessment._id
    ).populate("userId", "name email profile");

    res.json({
      success: true,
      assessment: populatedAssessment,
    });
  } catch (error) {
    console.error("EcoScore Database Error:", error);
    // If database save fails, return calculated result directly so frontend doesn't crash
    res.json({
      success: true,
      assessment: {
        score: result.score,
        level: result.level,
        aiExplanation: result.explanation,
        precautions: result.precautions,
        answers
      }
    });
  }
};

export const getLatestAssessment = async (req, res) => {
  try {
    const userId = req.userId;

    const assessment = await Assessment.findOne({ userId })
      .populate("userId", "name email profile")
      .sort({ createdAt: -1 });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "No assessment found",
      });
    }

    res.json({
      success: true,
      assessment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch latest assessment",
    });
  }
};

export const updateEcoAssessment = async (req, res) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 15000 });
  try {
    const userId = req.userId;
    const { assessmentId } = req.params;
    const { answers } = req.body;

    const assessment = await Assessment.findOne({
      _id: assessmentId,
      userId,
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    const prompt = `
You are an environmental pollution expert.

Analyze pollution using PERSONAL and AREA factors.

User data:
${JSON.stringify(answers, null, 2)}

SCORING RULES:
- 0–400  = High Pollution Impact
- 401–700 = Moderate Pollution Impact
- 701–900 = Low Pollution Impact

Return ONLY valid JSON:
{
  "score": number,
  "level": string,
  "explanation": string,
  "precautions": {
    "personal": [string, string, string],
    "area": [string, string, string]
  }
}
`;

    const aiRes = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });

    const result = JSON.parse(
      cleanJSON(aiRes.choices[0].message.content)
    );

    const score = Math.max(0, Math.min(900, result.score));

    assessment.answers = answers;
    assessment.score = score;
    assessment.level = result.level;
    assessment.aiExplanation = result.explanation;
    assessment.precautions = result.precautions;

    await assessment.save();

    const populatedAssessment = await Assessment.findById(
      assessment._id
    ).populate("userId", "name email profile");

    res.json({
      success: true,
      assessment: populatedAssessment,
    });
  } catch (error) {
    console.error("Update Assessment Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update assessment",
    });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Assessment.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$userId",
          score: { $first: "$score" },
          level: { $first: "$level" },
          createdAt: { $first: "$createdAt" },
        },
      },
      { $sort: { score: 1 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          name: "$user.name",
          email: "$user.email",
          avatar: "$user.profile.profilePhoto",
          score: 1,
          level: 1,
        },
      },
    ]);

    const ranked = leaderboard.map((u, index) => ({
      rank: index + 1,
      ...u,
    }));

    res.status(200).json({
      success: true,
      totalUsers: ranked.length,
      leaderboard: ranked,
    });
  } catch (error) {
    console.error("Leaderboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard",
    });
  }
};