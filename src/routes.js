import express from "express";
import {
  getAll,
  get,
  create,
  removeOne,
  update,
  getAuth,
  getAllFiles,
  createFile,
  // updateFile,
  deleteFile,
  accessGooleDriveFiles
} from "./controller.js";

const router = express.Router();

router.get("/", getAll);

router.get("/user", get);

router.get("/auth", getAuth);

router.post("/auth", create);

router.patch("/user/:id", update);

//Currently empties database, will change to only delete one user when done
router.delete("/", removeOne);

//For demoing purpose only and does not represent the final product
router.get("/files", getAllFiles);

//For demoing purpose only and does not represent the final product
router.post("/files/upload", createFile);

//For demoing purpose only and does not represent the final product
//router.patch("/files/:fileID", updateFile);

//For demoing purpose only and does not represent the final product
router.delete("/files/:fileID", deleteFile);

// New route to fetch files from Google Drive
router.get("/drive/file/:id", accessGooleDriveFiles);

export default router;
