import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const assessmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    currentQuestion: { type: Number }
  },
  { timestamps: true }
);

assessmentSchema.pre("validate", function (next) {
  // Checks for currentQuestion: The currentQuestion length should be between [0, length of Questions]
  if (this.currentQuestion < 0 || this.currentQuestion > this.questions.length) {
    throw new Error(
      "Current question must be at least 0 and no greater than " + this.questions.length
    );
  }
  next();
});

const assessmentModel = mongoose.model("Assessment", assessmentSchema, "Courses");

export { assessmentModel, assessmentSchema };
