/**
 * MongoDB database, models and schemas.
 *
 * This file defines all MongoDB schemas and models used throughout the application, including
 * User, Course, Module, Assessment, Question, and File schemas.
 *
 * Detailed documentation about the database schema design can be found in the *Backend DB Schema*
 * document.
 *
 * @module model
 * @requires mongoose
 * @requires dotenv
 * @requires bcrypt
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

/**
 * The the cost of processing the data for generating a hash.
 *
 * See {@link https://www.npmjs.com/package/bcrypt#a-note-on-rounds bcrypt -- A Note on Rounds} for
 * more information on what this value means and how it affects performance.
 *
 * @constant
 * @type {number}
 * @default
 */
const BCRYPT_NUM_SALT_ROUNDS = 10;

dotenv.config();

const connectionString = process.env.MONGO_URL;
const database = await mongoose.connect(connectionString);

console.log(`Connected to ${connectionString}`);

/**
 * Learner data schema.
 *
 * @kind class
 * @property {Array<ObjectId>} courses - References to Course documents that the learner is
 * enrolled in.
 */
const learnerSchema = new mongoose.Schema({
  courses: { type: [mongoose.Schema.Types.ObjectId], ref: "courses", required: true }
});

/**
 * Instructor data schema.
 *
 * @kind class
 * @property {Array<ObjectId>} courses - References to the instructor's Course documents.
 */
const instructorSchema = new mongoose.Schema({
  courses: { type: [mongoose.Schema.Types.ObjectId], ref: "courses", required: true }
});

/**
 * User schema for the database.
 *
 * @kind class
 * @property {string} name - The user's full name.
 * @property {string} email - The user's email address (is a unique identifier).
 * @property {string} password - The user's password (will be encrypted when document is saved).
 * @property {object} learnerData - The courses that the user has enrolled in.
 * @property {object} [instructorData] - The courses that the user has created, if applicable
 * (non-`null` indicates that the user is an instructor).
 */
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  learnerData: { type: learnerSchema, required: true },
  instructorData: { type: instructorSchema }
});

/**
 * Compare a user-supplied password with the document's encrypted password to see if it matches.
 *
 * @method
 * @memberof! userSchema
 * @param {!string} password - The user-supplied password
 * @returns {boolean} `true` if the password matches, `false` if it doesn't
 * @throws {TypeError} `TypeError` if `password` is not a string
 */
userSchema.methods.passwordMatches = async function (password) {
  if (typeof password !== "string") throw new TypeError('"password" must be a string');

  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    /*
    If an error is caught here then either the "bcrypt" API has changed or there's a fault with the
    "bcrypt" package.

    For security reasons, it must be assumed that the user-supplied password doesn't match the
    encrypted password.
    */

    console.error(error.name, error.cause);
    return false;
  }
};

userSchema.pre(
  "save",

  /*
  If a document's ".password" member has been modified then encrypt it before storing it in the
  database.

  @param {!function} next - The function that invokes subsequent middleware.
  */
  async function (next) {
    console.assert(typeof next === "function");

    if (this.isModified("password")) {
      try {
        const salt = await bcrypt.genSalt(BCRYPT_NUM_SALT_ROUNDS);
        this.password = await bcrypt.hash(this.password, salt);

        next();
      } catch (error) {
        next(error);
      }
    } else {
      next();
    }
  }
);

/**
 * Question schema for the database.
 *
 * @kind class
 * @property {string} question - The text of the question.
 * @property {Array<string>} options - Array of possible answers (2-26 options).
 * @property {number} [answer] - Index of learner's answer (required for learners, not for
 * instructors).
 * @property {number} correctOption - Index of the correct option.
 * @property {string} explanation - Explanation of the correct answer.
 * @property {Date} creationTime - When this question was created.
 * @property {Date} updateTime - When this question was last updated.
 */
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (options) => {
        return options.length >= 2 && options.length <= 26;
      },
      message: "There must be between 2 and 26 options"
    }
  },
  answer: {
    type: Number,
    validate: {
      validator: (answer) => {
        return answer >= 0 && answer < this.options.length;
      },
      message: "The index of the answer must be at least 0 and less than the number of options"
    }
  },
  correctOption: {
    type: Number,
    required: true,
    validate: {
      validator: (correctOption) => {
        return correctOption >= 0 && correctOption < this.options.length;
      },
      message:
        "The index of the correct option must be at least 0 and less than the number of options"
    }
  },
  explanation: { type: String, required: true },
  creationTime: { type: Date, required: true, default: Date.now },
  updateTime: { type: Date, required: true, default: Date.now }
});

/**
 * Module schema.
 *
 * @kind class
 * @property {string} title - The title of the module.
 * @property {string} description - The description of the module.
 * @property {string} type - Type of module ("Audio", "Video", or "Markdown").
 * @property {Array<Object>} [chapters] - Array of Chapter objects with `title` and `timeIndex` (in
 * seconds) members (for Audio/Video).
 * @property {string} url - Link to the file.
 * @property {Object} [urlAuthentication] - Authentication information for the URL.
 * @property {boolean} [completed] - `true` if the learner has completed this module, `false` if
 * not (required for learners).
 * @property {Date} creationTime - When this module was created.
 * @property {Date} updateTime - When this module was last updated.
 */
const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ["Audio", "Video", "Markdown"]
  },
  chapters: [
    {
      title: { type: String, required: true },
      timeIndex: { type: Number, required: true } // in seconds
    }
  ],
  url: { type: String, required: true },
  urlAuthentication: {
    scheme: String,
    parameters: String
  },
  completed: Boolean,
  creationTime: { type: Date, required: true, default: Date.now },
  updateTime: { type: Date, required: true, default: Date.now }
});

/**
 * Assessment schema for the database.
 *
 * @kind class
 * @property {string} title - The title of the assessment.
 * @property {Array<Question>} questions - Array of Question documents.
 * @property {number} [currentQuestion] - Index of learner's current question (required for
 * learners).
 * @property {Date} creationTime - When this assessment was created.
 * @property {Date} updateTime - When this assessment was last updated.
 */
const assessmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  questions: { type: [questionSchema], required: true },
  currentQuestion: {
    type: Number,
    validate: {
      validator: (currentQuestion) => {
        return currentQuestion >= 0 && currentQuestion <= this.questions.length;
      },
      message:
        "The index of the current question must be at least 0 and less than the number of questions"
    }
  },
  creationTime: { type: Date, required: true, default: Date.now },
  updateTime: { type: Date, required: true, default: Date.now }
});

/**
 * Course schema for the database.
 *
 * @kind class
 * @property {string} title - The title of the course.
 * @property {string} description - The description of the course.
 * @property {ObjectId} instructor - Reference to the the instructor that created this course.
 * @property {Array<Module|Assessment>} components - Array of Module and Assessment documents.
 * @property {number} [currentComponent] - Index of learner's current component (required for
 * learners).
 * @property {boolean} [credentialEarned] - `true` if the learner has earned a credential, `false`
 * if not (required for learners).
 * @property {Date} creationTime - When this course was created.
 * @property {Date} updateTime - When this course was last updated.
 */
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  components: {
    type: [mongoose.Schema.Types.Mixed],
    required: true,
    validate: {
      validator: function (component) {
        return component.every(
          (item) =>
            (item.type && ["Audio", "Video", "Markdown"].includes(item.type)) || // Module
            (item.questions && Array.isArray(item.questions)) // Assessment
        );
      },
      message: "All components must be either Module or Assessment objects"
    }
  },
  currentComponent: {
    type: Number,
    validate: {
      validator: (currentComponent) => {
        return currentComponent >= 0 && currentComponent <= this.components.length;
      },
      message:
        "The index of the current component must be at least 0 and less than the number of components"
    }
  },
  credentialEarned: Boolean,
  creationTime: { type: Date, required: true, default: Date.now },
  updateTime: { type: Date, required: true, default: Date.now }
});

/**
 * File schema for the database.
 *
 * **NOTE:**  This is a temporary schema.  Files are expected to be handled by a `Module` document.
 *
 * @kind class
 * @property {string} filename - The name of the file
 * @property {string} driveId - The unique identifier for the file on Google Drive.
 * @property {string} mimeType - The file's type (important for determining how the file should be
 *                               handled or rendered).
 * @property {string} webViewLink - An URL to access or view the file directly on Google Drive.
 */
const fileSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    driveId: { type: String, required: true },
    mimeType: { type: String, required: true },
    webViewLink: { type: String, required: true }
  },
  { timestamps: true }
);

const userModel = database.model("users", userSchema);
const courseModel = database.model("courses", courseSchema);
const fileModel = database.model("files", fileSchema);

export {
  database,
  userSchema,
  learnerSchema,
  instructorSchema,
  moduleSchema,
  questionSchema,
  assessmentSchema,
  courseSchema,
  userModel,
  courseModel,
  fileModel
};
