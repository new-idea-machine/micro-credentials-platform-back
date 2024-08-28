import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

const connectionString = process.env.MONGO_URL;

console.log(`Connected to ${connectionString}`);

const database = await mongoose.connect(connectionString);

const learnerSchema = new mongoose.Schema({});
const instructorSchema = new mongoose.Schema({});

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  learnerData: { type: learnerSchema, required: true },
  instructorData: { type: instructorSchema }
});

// Detects change to the password field, both password update and password creation, then hashes the password before persistance
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    try {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
      next(err); // Pass any errors to the next middleware
    }
  } else {
    next();
  }
});

// Method to compare input password with hashed password in DB
userSchema.methods.comparePassword = async function (loginPassword) {
  try {
    return await bcrypt.compare(loginPassword, this.password);
  } catch (err) {
    throw new Error("Error comparing passwords");
  }
};

const userModel = database.model("users", userSchema);
const learnerModel = database.model("learner", learnerSchema);
const instructorModel = database.model("instructor", instructorSchema);

export { userModel, learnerModel, instructorModel };
