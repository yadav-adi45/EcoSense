import express from "express";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },

    profile: {
      profilePhoto: {
        type: String,
        default: "",
      },
      bio: {
        type: String,
        default: "",
        maxlength: 350,
      },
      location: {
        type: String,
        default: "",
      },
      phone: {
        type: String,
        default: "",
      },
      interests: {
        type: [String],
        default: [],
      },
    },

    ecoCoins: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastLoginReward: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);