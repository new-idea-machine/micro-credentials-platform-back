import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const learnerDataSchema = new mongoose.Schema({
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }]
});

const learnerDataModel = mongoose.model("LearnerData", learnerDataSchema);

export { learnerDataModel, learnerDataSchema };
