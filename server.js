import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { routes } from "./src/index.js";
import "isomorphic-fetch";

dotenv.config();
const app = express();

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
