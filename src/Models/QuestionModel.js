import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    answer: { type: Number },
    correctOption: { type: Number, required: true },
    explanation: { type: String }
  },
  { timestamps: true }
);

const questionModel = mongoose.model("Question", questionSchema);

questionSchema.pre("validate", function (next) {
  // Checks for options: The length of options must be between 2 and 26
  if (this.options.length < 2 || this.options.length > 26) {
    throw new Error("The number of options must be between 2 and 26");
  }
  // Checks for answer: The answer number must be between 0 and the length of options
  if (this.answer < 0 || this.answer >= this.options.length) {
    throw new Error("The answer number must be between 0 and " + this.options.length);
  }
  next();
});

export { questionModel, questionSchema };
