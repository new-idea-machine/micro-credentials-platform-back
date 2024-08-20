import mongoose from "mongoose";
import dotenv from "dotenv";
import { learnerDataSchema } from "./LearnerDataModel.js";
import { instructorDataSchema } from "./InstructorDataModel.js";

dotenv.config();

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    learnerData: { type: learnerDataSchema, required: false },
    instructorData: {
      type: instructorDataSchema,
      required: false
    }
  },
  { timestamps: true }
);

const userModel = mongoose.model("User", userSchema, "Users");

export { userModel, userSchema };
