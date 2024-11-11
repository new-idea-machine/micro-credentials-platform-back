import mongoose from "mongoose";
import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import validator from "validator";
import nodemailer from "nodemailer";

function getAuthorizationData(request) {
  /*
  Extract authorization data from an Express.js "Request" object and return an object
  containing this data.  If no recognized authorization data is found then return "null".

  Authorization data is found in the request's "Authorization" header.  The actual members of
  the returned object will depend on the type of authorization in the request.

  If valid HTTP Basic authorization (see RFC 7617) is found then the returned object's members
  will be "userId" and "password".
  */

  const authorizationValue = request.header("Authorization");
  const basicAuthorization = /^Basic (?<credentials64>\S+)$/i.exec(authorizationValue);

  if (basicAuthorization) {
    /*
    With HTTP Basic authorization, the credentials are in the format "<userId>:<password>" but
    encoded in Base64 (see RFC 7617 section 2 for a more detailed description).
    */

    const credentialsText = Buffer.from(basicAuthorization.groups.credentials64, "base64");
    const credentials = /^(?<userId>[^:]*):(?<password>.*)$/i.exec(credentialsText)?.groups;

    return credentials ? { userId: credentials.userId, password: credentials.password } : null;
  } else return null;
}

dotenv.config();

const connectionString = process.env.MONGO_URL;
const database = await mongoose.connect(connectionString);
const app = express();

console.log(`Connected to ${connectionString}`);

const learnerSchema = new mongoose.Schema({});
const instructorSchema = new mongoose.Schema({});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  learnerData: { type: learnerSchema, required: true },
  instructorData: { type: instructorSchema }
});

const userModel = database.model("users", userSchema);

const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json(), urlencodedParser);
app.use(cors());

app.listen(process.env.PORT, () => {
  console.log(`App is Listening on PORT ${process.env.PORT}`);
});

app.get("/", async (req, res) => {
  try {
    const users = await userModel.find();
    console.log(users);
    res.json({ message: "Success" });
  } catch (error) {
    res.status(503).json({ msg: "Cant reach server" });
  }
});

app.get("/auth", async (req, res) => {
  const authorizationData = getAuthorizationData(req);
  if (!authorizationData?.userId) {
    res.setHeader("WWW-Authenticate", 'Basic realm="user"');
    res.status(401).json({ msg: "Invalid credentials" });
  } else {
    try {
      const user = await userModel.findOne({ email: authorizationData.userId }).lean();
      if (!user) {
        res.status(404).json({ msg: "User not found." });
      } else if (authorizationData.password !== user.password) {
        res.setHeader("WWW-Authenticate", 'Basic realm="user"');
        res.status(401).json({ msg: "Invalid credentials." });
      } else {
        const access_token = Date.now().toString(); // temporary placeholder for token generation
        res.status(200).json({
          access_token,
          token_type: "Bearer",
          user_data: {
            name: user.name,
            email: user.email,
            learnerData: user.learnerData,
            instructorData: user.instructorData
          }
        });
      }
    } catch {
      res.status(503).json({ msg: "Cant reach server" });
    }
  }
});

app.post("/auth", async (req, res) => {
  const authorizationData = getAuthorizationData(req);
  const user = req.body;
  if (
    !authorizationData?.userId ||
    !validator.isEmail(authorizationData.userId) ||
    authorizationData?.password === ""
  ) {
    res.setHeader("WWW-Authenticate", 'Basic realm="user"');
    res.status(401).json({ msg: "Invalid credentials" });
  } else if (!user?.name) {
    res.status(406).json({ msg: "Missing name" });
  } else if (typeof user?.name !== "string") {
    res.status(406).json({ msg: "Invalid name type" });
  } else if (typeof user?.isInstructor !== "boolean") {
    res.status(406).json({ msg: "missing learner and instructor data" });
  } else {
    const registrant = new userModel({
      name: user.name,
      email: authorizationData.userId,
      password: authorizationData.password,
      learnerData: {},
      instructorData: user.isInstructor ? {} : null
    });
    try {
      const newDocument = await registrant.save();
      const access_token = Date.now().toString(); // temporary placeholder for token generation
      res.status(201).json({
        access_token,
        token_type: "Bearer",
        user_data: {
          name: newDocument.name,
          email: newDocument.email,
          learnerData: newDocument.learnerData,
          instructorData: newDocument.instructorData
        }
      });
    } catch (error) {
      const duplicateKeyError = 11000;
      if (error?.code === duplicateKeyError) {
        res.status(403).json({ msg: "User already exists (try logging in instead)" });
      } else if (error?.name === "ValidationError" || error?.name === "CastError") {
        res.status(406).json({ msg: "Invalid data" });
      } else {
        res.status(503).json({ msg: "Cant reach server" });
      }
    }
  }
});

//Currently empties database, will change to only delete one user when done
app.delete("/", async (req, res) => {
  await userModel
    .deleteMany({})
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + " was not found");
      } else {
        res.status(200).send(req.params.Username + " was deleted.");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//Change the default response for unhandled requests to status code 400
app.use((req, res) => {
  console.log(`Unhandled request:  ${req.method} ${req.url}`);
  res.status(400).json({ msg: "Request not handled" });
});
// below is for email

// const transporter = nodemailer.createTransport({
//   host: "localhost",
//   port: 587,
//   secure: false, // upgrade later with STARTTLS
//   auth: {
//     user: "username",
//     pass: "password"
//   }
// });

// // async..await is not allowed in global scope, must use a wrapper
// async function main() {
//   // send mail with defined transport object
//   const info = await transporter.sendMail({
//     from: '"Maddison Foo Koch 👻" <bbeam1@gmail.com>', // sender address
//     to: "bar@example.com, bbeam1@gmail.com", // list of receivers
//     subject: "Hello ✔", // Subject line
//     text: "Hello world?", // plain text body
//     html: "<b>Hello world?</b>" // html body
//   });

//   console.log("Message sent: %s", info.messageId);
//   // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
// }

//main().catch(console.error);

// In server.js
import courseModel from './courseschema.js'; // make sure to import your course model

// Route to fetch all courses or by specific instructor
app.get('/courses', async (req, res) => {
  try {
    const instructorId = req.query.instructorId; // optional query parameter to filter by instructor
    const query = instructorId ? { instructorId } : {}; // Filter by instructor if ID provided
    const courses = await courseModel.find(query);
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error fetching courses' });
  }
});

