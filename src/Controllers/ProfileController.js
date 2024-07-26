import mongoose from "mongoose";
import { userProfileModel } from "../Models/UserProfileModel.js";
import { userModel } from "../Models/model.js";
import { CustomError } from "../Utils/CustomError.js";
import * as service from "../service.js";

/*
User profile get request method to fetch the user profile contents from the token containing the user UID
*/
async function getProfile(req, res) {
  try {
    const authorizationData = service.getAuthorizationData(req);
    if (!authorizationData?.userId) {
      res.setHeader("WWW-Authenticate", 'Basic realm="user"');
      throw new CustomError("Invalid authorization data", "AuthorizationError", 401);
    }
    try {
      const user = await userProfileModel.findOne({ email: authorizationData.userId }).lean();
      if (!user) {
        throw new CustomError("No linked user profile found", "NotFoundError", 404);
      } else {
        res.status(200).json(user);
      }
    } catch (err) {
      if (err instanceof CustomError) throw err;
      // Handle gateway timeout error
      res.status(504).send();
    }
  } catch (err) {
    res.status(err.status_code).send({ Type: err.name, Error: err.message });
  }
}

/*
User profile post request method to create user profile contents in the database
*/
async function createProfile(req, res, next) {
  try {
    const authorizationData = service.getAuthorizationData(req);
    if (!authorizationData?.userId) {
      res.setHeader("WWW-Authenticate", 'Basic realm="user"');
      throw new CustomError("Invalid authorization data", "AuthorizationError", 401);
    }
    try {
      /*Find the user linked to the user profile in the database.
        This user UID will be used to create a reference to the user model in the user profile schema.*/
      const user = await userModel.findOne({ email: authorizationData.userId }).lean();
      if (!user) {
        // No user found with a potential link to the user profile
        throw new CustomError("No linked user found", "NotFoundError", 404);
      }

      // Check if the user already has a user profile linked to it.
      const existingUserProfile = await userProfileModel
        .findOne({ email: authorizationData.userId })
        .lean();
      if (existingUserProfile)
        throw new CustomError(
          "Profile already exists. Use PATCH to update",
          "ConflictError",
          409
        );

      // Create a new user profile document linked to the user model in the user profile schema.
      const newUserProfile = new userProfileModel({
        userUID: user._id,
        email: authorizationData.userId,
        ...req.body
      });
      const createdUserProfile = await newUserProfile.save();
      res.status(201).json(createdUserProfile);
    } catch (error) {
      if (error instanceof CustomError) throw error;
      else if (error instanceof mongoose.Error.ValidationError)
        throw new CustomError(Object.values(error.errors).toString(), "ValidationError", 400);
      // Handle gateway timeout error
      res.status(504).send(error.message || error);
    }
  } catch (err) {
    res.status(err.status_code).send({ Type: err.name, Error: err.message });
  }
}

/*
User profile patch request method to update the user profile document
*/
async function updateProfile(req, res, next) {
  try {
    const authorizationData = service.getAuthorizationData(req);
    if (!authorizationData?.userId) {
      res.setHeader("WWW-Authenticate", 'Basic realm="user"');
      throw new CustomError("Invalid authorization data", "AuthorizationError", 401);
    }
    try {
      const userProfile = await userProfileModel
        .findOneAndUpdate({ email: authorizationData.userId }, req.body, {
          new: true,
          runValidators: true
        })
        .lean();
      if (!userProfile) {
        throw new CustomError("No linked user profile found", "NotFoundError", 404);
      } else {
        res.status(200).json(userProfile);
      }
    } catch (error) {
      if (error instanceof CustomError) throw error;
      else if (error instanceof mongoose.Error.ValidationError)
        throw new CustomError(Object.values(error.errors).toString(), "ValidationError", 400);
      // Handle gateway timeout error
      res.status(504).send();
    }
  } catch (err) {
    res.status(err.status_code).send({ Type: err.name, Error: err.message });
  }
}

/*
User profile delete request method to delete the user profile document
*/
async function deleteProfile(req, res, next) {
  try {
    const authorizationData = service.getAuthorizationData(req);
    if (!authorizationData?.userId) {
      res.setHeader("WWW-Authenticate", 'Basic realm="user"');
      throw new CustomError("Invalid authorization data", "AuthorizationError", 401);
    }
    try {
      const userProfile = await userProfileModel.findOneAndDelete({
        email: authorizationData.userId
      });
      if (!userProfile) {
        throw new CustomError("No linked user profile found", "NotFoundError", 404);
      } else {
        res.status(200).send();
      }
    } catch (error) {
      if (error instanceof CustomError) throw error;
      // Handle gateway timeout error
      res.status(504).send();
    }
  } catch (err) {
    res.status(err.status_code).send({ Type: err.name, Error: err.message });
  }
}

export { getProfile, createProfile, updateProfile, deleteProfile };
