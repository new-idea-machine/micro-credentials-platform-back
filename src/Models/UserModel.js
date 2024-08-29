import mongoose from "mongoose";
import dotenv from "dotenv";
import { learnerDataSchema } from "./LearnerDataModel.js";
import { instructorDataSchema } from "./InstructorDataModel.js";

dotenv.config();

const connectionString = process.env.MONGO_URL;

console.log(`Connected to ${connectionString}`);

await mongoose.connect(connectionString);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    learnerData: { type: learnerDataSchema, required: true },
    instructorData: {
      type: instructorDataSchema
    }
  },
  { timestamps: true }
);

const userModel = mongoose.model("User", userSchema, "Users");

export { userModel, userSchema };
