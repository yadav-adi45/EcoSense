import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

const communityPostSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 1000 },
    image: { type: String, default: "" },
    postType: {
      type: String,
      default: "thought",
    },
    rideDetails: {
      from: { type: String, default: "" },
      to: { type: String, default: "" },
      date: { type: String, default: "" },
      seats: { type: Number, default: 1 },
    },
    proofDetails: {
      issueType: { type: String, default: "" },
      location: { type: String, default: "" },
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
  },
  { timestamps: true }
);

export const CommunityPost = mongoose.model("CommunityPost", communityPostSchema);
