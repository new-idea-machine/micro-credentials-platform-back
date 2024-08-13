import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    learnerData: { type: mongoose.Schema.Types.ObjectId, ref: "LearnerData", required: false },
    instructorData: { type: mongoose.Schema.Types.ObjectId, ref: "InstructorData" }
  },
  { timestamps: true }
);

const userModel = mongoose.model("User", userSchema, "Users");

export { userModel, userSchema };
