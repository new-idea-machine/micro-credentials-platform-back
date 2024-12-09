import express from "express";
import {
  getAll,
  get,
  create,
  removeOne,
  sendRecoveryEmail,
  getAuth,
  resetPasswordReceiver,
  resetPassword
} from "./controller.js";

import dotenv from "dotenv";
dotenv.config();
const router = express.Router();

router.get("/", getAll);

router.get("/user", get);

router.get("/auth", getAuth);

router.post("/auth", create);

//Currently empties database, will change to only delete one user when done
router.delete("/", removeOne);

router.get("/auth/recovery", sendRecoveryEmail);

router.get("/auth/recovery/:i", resetPasswordReceiver);

// needs to be changed to patch when front end done, the form I'm sending for now only accepts
// get and post
router.post("/auth/resetPassword", resetPassword);

export default router;
