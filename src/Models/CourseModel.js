import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    components: [{ type: mongoose.Schema.Types.Mixed }],
    currentComponent: { type: Number },
    credentialEarned: { type: Number }
  },
  { timestamps: true }
);

const courseModel = mongoose.model("Course", courseSchema);

courseSchema.pre("validate", function (next) {
  // Checks for components: The acceptable components should be Module or Assessment
  if (this.components.type !== "Module" || this.components.type !== "Assessment") {
    throw new Error("Components must be a Module or Assessment type.");
  }

  // Checks for currentComponent: The currentComponent should be within the range of components
  if (this.currentComponent < 0 && this.currentComponent > this.components.length) {
    throw new Error(
      "Component length must be atleast 0 and no greater than " + this.components.length
    );
  }
  this.markModified("components");
  next();
});

export { courseModel, courseSchema };
