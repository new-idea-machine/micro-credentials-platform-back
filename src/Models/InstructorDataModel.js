import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const instructorDataSchema = new mongoose.Schema({
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }]
});

const instructorDataModel = mongoose.model("InstructorData", instructorDataSchema);

export { instructorDataModel, instructorDataSchema };
