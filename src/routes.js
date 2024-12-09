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
import jwt from "jsonwebtoken";

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

router.get("/auth/recovery/:i", authenticateToken, resetPasswordReceiver);

// needs to be changed to patch when front end done, the form I'm sending for now only accepts
// get and post
router.post("/auth/resetPassword", resetPassword);

function authenticateToken(req, res, next) {
  const token = req.params.i;
  if (token === null) return res.sendStatus(403);
  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

export default router;
