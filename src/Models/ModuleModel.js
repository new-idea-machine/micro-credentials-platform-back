import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Enum for module schema type attribute
const MODULE_SCHEMA_TYPE_ENUM = ["Audio", "Video", "Markdown"];

const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  timeIndex: { type: Number }
});

const urlSchema = new mongoose.Schema({
  scheme: { type: String, required: true },
  parameters: { type: String }
});

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: mongoose.Schema.Types.String, enum: MODULE_SCHEMA_TYPE_ENUM },
    chapters: [chapterSchema],
    url: { type: String },
    urlAuthentication: urlSchema,
    completed: { type: Boolean }
  },
  { timestamps: true }
);

const moduleModel = mongoose.model("Module", moduleSchema);

moduleSchema.pre("validate", function (next) {
  //Checks for chapters: This field will only be present if the "type" field is Audio or Video
  if (this.type === "Audio" || this.type === "Video") {
    if (!this.chapters || this.chapters.length === 0) {
      throw new Error("Chapters field is required when type is Audio or Video");
    }
  }
  next();
});

export { moduleModel, moduleSchema };
