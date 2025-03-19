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

const learnerSchema = new mongoose.Schema({});
const instructorSchema = new mongoose.Schema({});

/**
 * User schema for the database.
 *
 * @kind class
 * @property {string} name - The name of the user.
 * @property {string} email - The email of the user (unique).
 * @property {string} password - The user's password (will be encrypted when document is saved).
 * @property {object} learnerData - The learner data associated with the user.
 * @property {object} [instructorData] - The instructor data associated with the user (optional).
 */
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  learnerData: { type: learnerSchema, required: true },
  instructorData: { type: instructorSchema }
});

/**
 * Compares a user-supplied password with the document's encrypted password to see if it matches.
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

//For demoing purpose only and does not represent the final product
//File Schema
const fileSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    //The unique identifier for the file on Google Drive
    driveId: { type: String, required: true },
    //The file’s type, important for determining how the file should be handled or rendered
    mimeType: { type: String, required: true },
    //A URL to access or view the file directly on Google Drive
    webViewLink: { type: String, required: true }
  },
  { timestamps: true }
);

const userModel = database.model("users", userSchema);
const learnerModel = database.model("learner", learnerSchema);
const instructorModel = database.model("instructor", instructorSchema);

//For demoing purpose only and does not represent the final product
const fileModel = database.model("files", fileSchema);

export { database, userModel, learnerModel, instructorModel, fileModel };
