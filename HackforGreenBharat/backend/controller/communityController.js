import { CommunityPost } from "../model/CommunityPost.js";
import { User } from "../model/UserSchema.js";
import { EcoCoinTransaction } from "../model/EcoCoinTransaction.js";

// @desc  Create a new post
export const createPost = async (req, res) => {
  try {
    const { text, postType, rideDetails, proofDetails, image } = req.body;
    if (!text) return res.status(400).json({ message: "Post text is required" });

    const post = await CommunityPost.create({
      author: req.userId,
      text,
      image: image || "",
      postType: postType || "thought",
      rideDetails: postType === "rideshare" ? rideDetails : {},
      proofDetails: postType === "proof" ? proofDetails : {},
    });

    let earnedCoins = 0;

    // 🪙 Award +15 EcoCoins for reporting hazard/proof or +10 for rideshare
    if (postType === "proof") {
      earnedCoins = 15;
      await User.findByIdAndUpdate(req.userId, { $inc: { ecoCoins: earnedCoins } });
      await EcoCoinTransaction.create({
        userId: req.userId,
        type: "earn",
        amount: earnedCoins,
        source: "community_proof",
        description: `Earned +15 EcoCoins for reporting ${proofDetails?.issueType || "environmental hazard"} proof`,
        relatedId: post._id.toString(),
      });
    } else if (postType === "rideshare") {
      earnedCoins = 10;
      await User.findByIdAndUpdate(req.userId, { $inc: { ecoCoins: earnedCoins } });
      await EcoCoinTransaction.create({
        userId: req.userId,
        type: "earn",
        amount: earnedCoins,
        source: "rideshare",
        description: `Earned +10 EcoCoins for offering carpool/rideshare route`,
        relatedId: post._id.toString(),
      });
    }

    const populated = await post.populate("author", "name profile ecoCoins");
    res.status(201).json({ success: true, post: populated, earnedCoins });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get feed posts (newest first, paginated, optional type filter)
export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const filter = {};
    if (req.query.type && req.query.type !== "all") {
      filter.postType = req.query.type;
    }

    const posts = await CommunityPost.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "name profile ecoCoins")
      .populate("comments.author", "name profile");

    const total = await CommunityPost.countDocuments(filter);
    res.json({ success: true, posts, total, page });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Toggle like on a post
export const likePost = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.userId;
    const alreadyLiked = post.likes.map((id) => id.toString()).includes(userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(req.userId);

      // 🪙 Award +2 EcoCoins to post author if liked by someone else
      if (post.author && post.author.toString() !== userId) {
        try {
          await User.findByIdAndUpdate(post.author, { $inc: { ecoCoins: 2 } });
          await EcoCoinTransaction.create({
            userId: post.author,
            type: "earn",
            amount: 2,
            source: "community_like",
            description: `Earned +2 EcoCoins: Community member appreciated your post/report`,
            relatedId: post._id.toString(),
          });
        } catch (coinErr) {
          console.warn("Could not award like coin:", coinErr.message);
        }
      }
    }

    await post.save();
    res.json({
      success: true,
      likes: post.likes.length,
      liked: !alreadyLiked,
      authorRewarded: !alreadyLiked && Boolean(post.author && post.author.toString() !== userId),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Add a comment
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment text required" });

    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ author: req.userId, text });
    await post.save();

    const updated = await CommunityPost.findById(req.params.id).populate(
      "comments.author",
      "name profile"
    );
    res.json({ success: true, comments: updated.comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Delete own post
export const deletePost = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await post.deleteOne();
    res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
