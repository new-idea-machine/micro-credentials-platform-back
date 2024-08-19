import mongoose from "mongoose";
import dotenv from "dotenv";

//package for password encryption
import bcrypt from "bcrypt";

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

// Detects change to the password field, both password update and password creation, then hashes the password before persistance
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    try {
      const hashedPassword = await bcrypt.hash(this.password, 10);
      this.password = hashedPassword;
      this.set(`password`, this.password);
    } catch (err) {
      next(err); // Pass any errors to the next middleware
    }
  } else {
    next();
  }
});

userSchema.methods.comparePassword = async function (loginPassword) {
  try {
    return await bcrypt.compare(loginPassword, this.password);
  } catch (err) {
    throw new Error("Error comparing passwords");
  }
};

const userModel = mongoose.model("User", userSchema, "Users");

export { userModel, userSchema };
