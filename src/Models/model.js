// Deprecated

// import mongoose from "mongoose";
// import dotenv from "dotenv";

// dotenv.config();

// const connectionString = process.env.MONGO_URL;

// console.log(`Connected to ${connectionString}`);

// const database = await mongoose.connect(connectionString);

// const learnerSchema = new mongoose.Schema({});
// const instructorSchema = new mongoose.Schema({});

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   learnerData: { type: learnerSchema, required: true },
//   instructorData: { type: instructorSchema }
// });

// const userModel = database.model("users", userSchema);
// const learnerModel = database.model("learner", learnerSchema);
// const instructorModel = database.model("instructor", instructorSchema);

// export { userModel, learnerModel, instructorModel };
