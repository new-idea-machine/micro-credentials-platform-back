import mongoose from "mongoose";
import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import validator from "validator";
import nodemailer from "nodemailer";

dotenv.config();

const connectionString = process.env.MONGO_URL;
const database = await mongoose.connect(connectionString);
const app = express();

console.log(`Connected to ${connectionString}`);

const learnerSchema = new mongoose.Schema({});
const instructorSchema = new mongoose.Schema({});

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  learnerData: mongoose.Schema({ data: { type: learnerSchema } }),
  instructorData: mongoose.Schema({ data: { type: instructorSchema } })
});

const userModel = database.model("users", userSchema);
const learnerModel = database.model("learner", learnerSchema);
const instructorModel = database.model("instructor", instructorSchema);

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
  const authorizationHeaderValue = req.header("Authorization");
  const basicAuthorizationData = /^Basic (\S+)$/gi.exec(authorizationHeaderValue);
  if (!basicAuthorizationData) {
    res.setHeader("WWW-Authenticate", 'Basic realm="user"');
    res.status(401).json({ msg: "Invalid credentials" });
  } else {
    const credentials = atob(basicAuthorizationData[1]).split(":");
    const email = credentials[0];
    const password = credentials[1];
    if (!email || !password) {
      res.setHeader("WWW-Authenticate", 'Basic realm="user"');
      res.status(401).json({ msg: "Invalid credentials" });
    } else {
      try {
        const user = await userModel.findOne({ email }).lean();
        if (!user) {
          res.status(404).json({ msg: "User not found." });
        } else if (password !== user.password) {
          res.setHeader("WWW-Authenticate", 'Basic realm="user"');
          res.status(401).json({ msg: "Invalid credentials." });
        } else {
          const access_token = Date.now().toString(); // temporary placeholder for token generation
          res.status(200).json({
            access_token,
            token_type: "Bearer",
            user_info: {
              name: user.name,
              email,
              learnerData: user.learnerData,
              instructorData: user.instructorData
            }
          });
        }
      } catch {
        res.status(503).json({ msg: "Cant reach server" });
      }
    }
  }
});

app.post("/user", async (req, res) => {
  try {
    const user = req.body;
    const takenEmail = await userModel.findOne({ email: user.userInfo.email });
    if (!user.userInfo.email) {
      res.status(406).json({ msg: "Missing email" });
    } else if (
      typeof user.userInfo.email !== "string" ||
      !validator.isEmail(user.userInfo.email)
    ) {
      res.status(406).json({ msg: "Invalid e-mail address type" });
    } else if (takenEmail) {
      res.status(403).json({ msg: "User already exists (try logging in instead)" });
    } else if (!user.userInfo.name) {
      res.status(406).json({ msg: "Missing name" });
    } else if (typeof user.userInfo.name !== "string") {
      res.status(406).json({ msg: "Invalid name type" });
    } else if (!user.password) {
      res.status(406).json({ msg: "Invalid password" });
    } else if (typeof user.password !== "string") {
      res.status(406).json({ msg: "Invalid password type" });
    } else if (typeof user.isInstructor !== "boolean") {
      res.status(406).json({ msg: "missing learner and instructor data" });
    } else {
      const registrant = new userModel({
        username: user.userInfo.name,
        email: user.userInfo.email,
        password: user.password,
        learnerData: new learnerModel({}),
        instructorData: user.isInstructor ? new instructorModel({}) : null
      });
      const newDocument = await registrant.save();
      res.status(201).json({ userUID: newDocument._id });
    }
  } catch (error) {
    console.log(typeof req.body.userInfo.email);
    res.status(503).json({ msg: "Cant reach server" });
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
