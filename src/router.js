import express from "express";
import {
  getAll,
  get,
  create,
  removeOne,
  update,
  getAuth,
  getAllFiles,
  uploadFiles,
  // updateFile,
  deleteFile,
  accessGoogleDriveFiles
} from "./Controllers/controller.js";

const router = express.Router();

router.get("/", getAll);

router.get("/auth", getAuth);

router.post("/auth", create);

router.get("/user", get);

router.patch("/user", update);

router.delete("/user", removeOne);

//For demoing purpose only and does not represent the final product
router.get("/files", getAllFiles);

// New file upload endpoint
router.post("/files", uploadFiles);

//For demoing purpose only and does not represent the final product
//router.patch("/files/:fileID", updateFile);

//For demoing purpose only and does not represent the final product
router.delete("/files/:fileID", deleteFile);

// New route to fetch files from Google Drive
router.get("/drive/file/:id", accessGoogleDriveFiles);

export default router;
