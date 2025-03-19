import express from "express";
import { getAll, get, create, removeOne, update, getAuth } from "./controller.js";

const router = express.Router();

router.get("/", getAll);

router.get("/auth", getAuth);

router.post("/auth", create);

router.get("/user", get);

router.patch("/user", update);

router.delete("/user", removeOne);

export default router;
