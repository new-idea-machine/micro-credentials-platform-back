import express from "express";
import { getAll, get, create, removeOne, update, getAuth } from "../Controllers/controller.js";

const router = express.Router();

router.get("/", getAll);

router.get("/user", get);

router.get("/auth", getAuth);

router.post("/auth", create);

router.patch("/user", update);

//Currently empties database, will change to only delete one user when done
router.delete("/", removeOne);

export default router;
