import express from "express";
import {
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile
} from "../Controllers/ProfileController.js";

const ProfileRouter = express.Router();

// Get a user profile
ProfileRouter.get("/", getProfile);

// Create a new profile for the user
ProfileRouter.post("/", createProfile);

// Update a user profile for the user
ProfileRouter.patch("/", updateProfile);

// Delete a user profile
ProfileRouter.delete("/", deleteProfile);

export { ProfileRouter };
