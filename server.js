import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { routes } from "./src/index.js";
import { authenticationMiddleware } from "./tokenManager.js";

dotenv.config();
const app = express();

// app.use((req, res, next) => {
//   console.log(req.headers["authorization"]);
//   next();
// });

const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json(), urlencodedParser);
app.use(cors());

app.listen(process.env.PORT, () => {
  console.log(`App is Listening on PORT ${process.env.PORT}`);
});

app.use("/", routes);

//Change the default response for unhandled requests to status code 400
app.use((req, res) => {
  console.log(`Unhandled request:  ${req.method} ${req.url}`);
  res.status(400).json({ msg: "Request not handled" });
});

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
