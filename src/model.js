import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.MONGO_URL;

console.log(`Connected to ${connectionString}`);

const database = await mongoose.connect(connectionString);

const learnerSchema = new mongoose.Schema({});
const instructorSchema = new mongoose.Schema({});

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  learnerData: mongoose.Schema({ data: { type: learnerSchema } }),
  instructorData: mongoose.Schema({ data: { type: instructorSchema } })
});

const userModel = database.model("users", userSchema);
const learnerModel = database.model("learner", learnerSchema);
const instructorModel = database.model("instructor", instructorSchema);

export { userModel, learnerModel, instructorModel };
