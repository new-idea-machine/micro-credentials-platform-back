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

//For demoing purpose only and does not represent the final product
//Function to handle the complete process of uploading files and saving metadata
async function createFile(files) {
  const savedFiles = [];

  for (const file of files) {
    const uploadedFile = await uploadFileToGoogleDrive(file);

    //Save file metadata to MongoDB
    const savedFile = await fileModel.create({
      filename: uploadedFile.name,
      driveId: uploadedFile.id,
      mimeType: uploadedFile.mimeType,
      webViewLink: uploadedFile.webViewLink
    });

    //Store the saved file metadata
    savedFiles.push(savedFile);

    //Delete the file from the server after uploading
    fs.unlinkSync(file.path);
  }

  return savedFiles;
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
  createFile,
};
