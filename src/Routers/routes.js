import express from "express";
import { getAll, get, create, removeOne, update, getAuth } from "../Controllers/controller.js";
import { ProfileRouter } from "./ProfileRouter.js";

const router = express.Router();

router.get("/", getAll);

router.get("/user", get);

router.get("/auth", getAuth);

router.post("/auth", create);

router.patch("/user/:id", update);

//Currently empties database, will change to only delete one user when done
router.delete("/", removeOne);

router.use("/profile", ProfileRouter);

export default router;
