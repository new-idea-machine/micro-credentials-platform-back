import fs from "fs";
import { userModel, learnerSchema, instructorSchema, fileModel } from "./model.js";
import { uploadFileToGoogleDrive, deleteFileFromGoogleDrive } from "./googleDrive.js";

async function getAll() {
  const users = await userModel.find();
  console.log(users);
  return users;
}

async function get(user) {
  return { userUID: user._id, name: user.username, email: user.email };
}

async function create(user) {
  const registrant = new userModel({
    username: user.userInfo.name,
    email: user.userInfo.email,
    password: user.password,
    learnerData: new learnerSchema({}),
    instructorData: user.isInstructor ? new instructorSchema({}) : null
  });
  const newDocument = await registrant.save();
  return { userUID: newDocument._id };
}

async function updatePassword(name, newPassword) {
  await userModel.updateOne({ username: name }, { password: newPassword });
}

//Currently empties database, will change to only delete one user when done
async function removeOne() {
  await userModel.deleteMany({});
}

/**
 * Upload files to Google Drive.
 *
 * @param {string} userUid - User ID from the request token
 * @param {Array<object>} files - Array of file objects from Multer
 * @returns {Promise<Array<string>>} Array of URL's to each file (or null's for any failed file
 *   transfers)
 */
async function uploadFiles(userUid, files) {
  if (typeof userUid !== "string") {
    console.error("User ID must be a string");
    throw new TypeError("User ID must be a string");
  }

  if (!Array.isArray(files)) {
    console.error("Files must be an array");
    throw new TypeError("Files must be an array");
  }

  if (!files.every(file => typeof file === "object")) {
    console.error("All files must be objects");
    throw new TypeError("All files must be objects");
  }

  const urls = [];

  /*
  Each file is uploaded to Google Drive and the URL to the file is added to the "urls" array.  If
  an error occurs during the upload then "null" is added to the "urls" array instead.  Each file is
  deleted from the file system after it's been processed (successfully or not).
  */

  for (const file of files) {
    try {
      const uploadedFile = await uploadFileToGoogleDrive(userUid, file);

      urls.push(uploadedFile?.webContentLink);
    } catch (error) {
      console.error(`Error uploading file ${file.originalname}:`, error);
      urls.push(null);
    }

    try {
      fs.unlinkSync(file.path);
    } catch {}
  }

  return urls;
}

//For demoing purpose only and does not represent the final product
async function deleteFile(fileID) {
  //Delete file from Google Drive
  const file = await fileModel.findById(fileID);

  if (!file) throw new Error("File not found in MongoDB");

  await deleteFileFromGoogleDrive(file.driveId);

  //Delete the file metadata from MongoDB

  await fileModel.findByIdAndDelete(fileID);
  console.log(`File with ID ${fileID} deleted from MongoDB`);
}

//For demoing purpose only and does not represent the final product
async function getAllFiles(req, res) {
  return await fileModel.find();
}

//For demoing purpose only and does not represent the final product
// async function updateFile(req, res) {
//   try {
//     const { fileID } = req.params;

//     const updatedFile = await fileModel.findByIdAndUpdate(fileID, req.body, { new: true });

//     if (!updatedFile) {
//       return res.status(401).json({ message: `File is not found.` });
//     } else {
//       return res.status(200).json(updatedFile);
//     }
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send({ message: error.message });
//   }
// }

export {
  getAll,
  get,
  create,
  updatePassword,
  removeOne,
  getAllFiles,
  // updateFile,
  deleteFile,
  uploadFiles,
};
