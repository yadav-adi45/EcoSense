import express from "express";
import {
  createPost,
  getPosts,
  likePost,
  addComment,
  deletePost,
} from "../controller/communityController.js";
import isAuthenticated from "../middleware/isAuthenticated.js";

const communityRouter = express.Router();

communityRouter.post("/post", isAuthenticated, createPost);
communityRouter.get("/posts", getPosts);
communityRouter.put("/like/:id", isAuthenticated, likePost);
communityRouter.post("/comment/:id", isAuthenticated, addComment);
communityRouter.delete("/post/:id", isAuthenticated, deletePost);

export default communityRouter;
