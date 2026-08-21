import { User } from "../model/UserSchema.js";
import { EcoCoinTransaction } from "../model/EcoCoinTransaction.js";

// @desc   Get user's current EcoCoins balance and summary stats
// @route  GET /api/v12/balance
export const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("ecoCoins lastLoginReward name");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Check if daily login bonus can be claimed today
    let canClaimDaily = true;
    if (user.lastLoginReward) {
      const last = new Date(user.lastLoginReward);
      const now = new Date();
      if (
        last.getFullYear() === now.getFullYear() &&
        last.getMonth() === now.getMonth() &&
        last.getDate() === now.getDate()
      ) {
        canClaimDaily = false;
      }
    }

    // Get total earned & total spent lifetime stats
    const transactions = await EcoCoinTransaction.find({ userId: req.userId });
    let totalEarned = 0;
    let totalSpent = 0;
    transactions.forEach((tx) => {
      if (tx.type === "earn") totalEarned += tx.amount;
      if (tx.type === "spend") totalSpent += tx.amount;
    });

    res.json({
      success: true,
      balance: user.ecoCoins || 0,
      canClaimDaily,
      totalEarned,
      totalSpent,
      totalActions: transactions.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Get paginated transaction history
// @route  GET /api/v12/transactions
export const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;

    const transactions = await EcoCoinTransaction.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await EcoCoinTransaction.countDocuments({ userId: req.userId });

    res.json({
      success: true,
      transactions,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Earn EcoCoins for an environmental action
// @route  POST /api/v12/earn
export const earnCoins = async (req, res) => {
  try {
    const { source, amount, description, relatedId } = req.body;

    const validSources = [
      "eco_route",
      "community_proof",
      "community_like",
      "assessment",
      "daily_login",
      "bonus",
      "rideshare",
    ];

    if (!validSources.includes(source)) {
      return res.status(400).json({ success: false, message: "Invalid reward source" });
    }

    const coinAmount = parseInt(amount);
    if (isNaN(coinAmount) || coinAmount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be greater than 0" });
    }

    // Cap single award security check
    if (coinAmount > 100) {
      return res.status(400).json({ success: false, message: "Award amount exceeds maximum allowed single reward" });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $inc: { ecoCoins: coinAmount } },
      { new: true }
    ).select("ecoCoins");

    const transaction = await EcoCoinTransaction.create({
      userId: req.userId,
      type: "earn",
      amount: coinAmount,
      source,
      description: description || `Earned ${coinAmount} EcoCoins for ${source.replace("_", " ")}`,
      relatedId: relatedId || "",
    });

    res.status(201).json({
      success: true,
      balance: user.ecoCoins,
      earned: coinAmount,
      transaction,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Spend EcoCoins on store product discounts
// @route  POST /api/v12/spend
export const spendCoins = async (req, res) => {
  try {
    const { amount, productId, productName, originalPrice } = req.body;

    const coinAmount = parseInt(amount);
    if (isNaN(coinAmount) || coinAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount to spend" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if ((user.ecoCoins || 0) < coinAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient EcoCoins balance. You have ${user.ecoCoins || 0} coins.`,
      });
    }

    // Apply spend decrement
    user.ecoCoins = (user.ecoCoins || 0) - coinAmount;
    await user.save();

    const transaction = await EcoCoinTransaction.create({
      userId: req.userId,
      type: "spend",
      amount: coinAmount,
      source: "product_discount",
      description: `Redeemed ₹${coinAmount} discount on ${productName || "EcoProduct"}`,
      relatedId: productId || "",
    });

    res.json({
      success: true,
      balance: user.ecoCoins,
      discountApplied: coinAmount,
      transaction,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Claim daily login reward (+5 EcoCoins)
// @route  POST /api/v12/daily-login
export const claimDailyLogin = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const now = new Date();
    if (user.lastLoginReward) {
      const last = new Date(user.lastLoginReward);
      if (
        last.getFullYear() === now.getFullYear() &&
        last.getMonth() === now.getMonth() &&
        last.getDate() === now.getDate()
      ) {
        return res.status(400).json({
          success: false,
          message: "You have already claimed your daily EcoCoins bonus today! Come back tomorrow.",
        });
      }
    }

    const DAILY_BONUS = 5;
    user.ecoCoins = (user.ecoCoins || 0) + DAILY_BONUS;
    user.lastLoginReward = now;
    await user.save();

    const transaction = await EcoCoinTransaction.create({
      userId: req.userId,
      type: "earn",
      amount: DAILY_BONUS,
      source: "daily_login",
      description: `Claimed Daily EcoSense Login Bonus (+${DAILY_BONUS} EcoCoins)`,
    });

    res.json({
      success: true,
      message: `🎉 +${DAILY_BONUS} EcoCoins claimed! Come back tomorrow for more.`,
      balance: user.ecoCoins,
      transaction,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
