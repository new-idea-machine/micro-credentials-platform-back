import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.MONGO_URL;

console.log(`Connected to ${connectionString}`);

const database = await mongoose.connect(connectionString);

const learnerSchema = new mongoose.Schema({});

const userProfileSchema = new mongoose.Schema({
  userUID: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "users" },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  data: { type: learnerSchema }
});

const userProfileModel = database.model("userProfiles", userProfileSchema);

export { userProfileModel };
