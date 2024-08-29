import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const instructorDataSchema = new mongoose.Schema(
  {
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true }]
  },
  { _id: false }
);

// const instructorDataModel = mongoose.model("InstructorData", instructorDataSchema, "Users");

// export { instructorDataModel, instructorDataSchema };
export { instructorDataSchema };
