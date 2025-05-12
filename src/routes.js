import express from "express";
import {
  getAll,
  get,
  create,
  removeOne,
  sendRecoveryEmail,
  getAuth,
  resetPasswordReceiver,
  update,
  authBasic
} from "./controller.js";

import dotenv from "dotenv";
dotenv.config();
const router = express.Router();

router.get("/", getAll);

router.get("/auth", getAuth);

router.post("/auth", create);

router.get("/user", get);

router.patch("/user", update);

//Currently empties database, will change to only delete one user when done
router.delete("/", removeOne);

router.get("/auth/recovery", sendRecoveryEmail);

router.get("/auth/recovery/:token", authBasic, resetPasswordReceiver);

export default router;
