import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import nodemailer from "nodemailer";
import { routes } from "./src/index.js";
import { authenticationMiddleware } from "./tokenManager.js";  // Import the middleware

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

const app = express();

const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json(), urlencodedParser);
app.use(cors());
app.use(authenticationMiddleware);

app.listen(process.env.PORT, () => {
  console.log(`App is Listening on PORT ${process.env.PORT}`);
});

app.use("/", routes);

//Change the default response for unhandled requests to status code 400
app.use((req, res) => {
  console.log(`Unhandled request:  ${req.method} ${req.url}`);
  res.status(400).json({ msg: "Request not handled" });
});

// below is for email

//  const transporter = nodemailer.createTransport({
//   host: 'smtp.ethereal.email',
//   port: 587,
//   auth: {
//       user: 'luis44@ethereal.email',
//       pass: 'bYbMbB29ce34ezNjat'
//   }
// });

// Generate SMTP service account from ethereal.email
// nodemailer.createTestAccount((err, account) => {
//   if (err) {
//     console.error("Failed to create a testing account. " + err.message);
//     return process.exit(1);
//   }

// console.log("Credentials obtained, sending message...");

// Create a SMTP transporter object
// const transporter = nodemailer.createTransport({
//   host: "smtp.ethereal.email",
//   port: 587,
//   auth: {
//     user: "luis44@ethereal.email",
//     pass: "bYbMbB29ce34ezNjat"
//   }
// });

// Message object
// let message = {
//   from: "Sender Name <sender@example.com>",
//   to: "Recipient <recipient@example.com>",
//   subject: "Nodemailer is unicode friendly ✔",
//   text: "Hello to myself!",
//   html: "<p><b>Hello</b> to myself!</p>"
// };

// transporter.sendMail(message, (err, info) => {
//   if (err) {
//     console.log("Error occurred. " + err.message);
//     return process.exit(1);
//   }

//   console.log("Message sent: %s", info.messageId);
//   // Preview only available when sending through an Ethereal account
//   console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
// });
// });

//main().catch(console.error);

// In server.js
import courseModel from './courseSchema.js'; // make sure to import your course model

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
