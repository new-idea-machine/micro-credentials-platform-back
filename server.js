import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import nodemailer from "nodemailer";
import { routes } from "./src/index.js";
import { authenticationMiddleware } from "./tokenManager.js";

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

import { getUserUid } from "./tokenManager.js";

app.get("/validate-token", (req, res) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ msg: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  const userUid = getUserUid(token);

  if (userUid) {
    res.status(200).json({ msg: "Valid token", userUid });
  } else {
    res.status(401).json({ msg: "Invalid or expired token" });
  }
});
