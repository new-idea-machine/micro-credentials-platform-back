import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const learnerDataSchema = new mongoose.Schema(
  {
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }]
  },
  { _id: false }
);

// const learnerDataModel = mongoose.model("LearnerData", learnerDataSchema, "Users");

// export { learnerDataModel, learnerDataSchema };
export { learnerDataSchema };
