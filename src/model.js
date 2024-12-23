import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

const BCRYPT_NUM_SALT_ROUNDS = 10;

dotenv.config();

const connectionString = process.env.MONGO_URL;

console.log(`Connected to ${connectionString}`);

const database = await mongoose.connect(connectionString);

const learnerSchema = new mongoose.Schema({});
const instructorSchema = new mongoose.Schema({});
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  learnerData: { type: learnerSchema, required: true },
  instructorData: { type: instructorSchema }
});

// Detects change to the password field, both password update and password creation, then hashes the password before persistance
userSchema.pre("save", async function (next) {
    console.assert(typeof next === "function");
    if (this.isModified("password")) {
      try {
        const salt = await bcrypt.genSalt(BCRYPT_NUM_SALT_ROUNDS);
        this.password = await bcrypt.hash(this.password, salt);
        next();
      } catch (error) {
        next(error);
      }
    } else {
      next();
    }
  });

// Method to compare input password with hashed password in DB
userSchema.methods.passwordMatches = async function (password) {
  if (typeof password !== "string")
    throw new TypeError("\"password\" must be a string");
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    /*
    If an error is caught here then either the "bcrypt" API has changed or there's a fault with the
    "bcrypt" package.

    For security reasons, it must be assumed that the user-supplied password doesn't match the
    encrypted password.
    */

    console.error(error.name, error.cause);
    return false;
  }
};

const userModel = database.model("users", userSchema);
const learnerModel = database.model("learner", learnerSchema);
const instructorModel = database.model("instructor", instructorSchema);

export { userModel, learnerModel, instructorModel };
