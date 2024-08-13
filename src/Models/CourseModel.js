import mongoose from "mongoose";
import dotenv from "dotenv";
import { moduleSchema } from "./ModuleModel.js";
import { assessmentSchema } from "./AssessmentModel.js";

dotenv.config();

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    components: [{ type: mongoose.Schema.Types.Mixed, of: [moduleSchema, assessmentSchema] }],
    currentComponent: { type: Number },
    credentialEarned: { type: Boolean }
  },
  { timestamps: true }
);

courseSchema.pre("validate", function (next) {
  // Checks for components: The acceptable components should be Module or Assessment
  // if (
  //   this.components.type instanceof moduleSchema ||
  //   this.components.type instanceof assessmentSchema
  // ) {
  //   throw new Error("Components must be a Module or Assessment type.");
  // }

  // Checks for currentComponent: The currentComponent should be within the range of components
  if (this.currentComponent < 0 || this.currentComponent > this.components.length) {
    throw new Error(
      "Component length must be atleast 0 and no greater than " + this.components.length
    );
  }
  this.markModified("components");
  next();
});

const courseModel = mongoose.model("Course", courseSchema);

export { courseModel, courseSchema };
