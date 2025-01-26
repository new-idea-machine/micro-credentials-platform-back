import { userModel, learnerModel, instructorModel, fileModel } from "./model.js";

//For file upload to Google Drive and saving metadata to MongoDB
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { getAuth } from "./controller.js";

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
    learnerData: new learnerModel({}),
    instructorData: user.isInstructor ? new instructorModel({}) : null
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

function getAuthorizationData(request) {
  /*
  Extract authorization data from an Express.js "Request" object and return an object
  containing this data.  If no recognized authorization data is found then return "null".

  Authorization data is found in the request's "Authorization" header.  The actual members of
  the returned object will depend on the type of authorization in the request.

  +--------+------+----------+
  | Scheme | RFC  | Members  |
  +========+======+==========+
  | Basic  | 7617 | userId   |
  |        |      | password |
  +--------+------+----------+
  | Bearer | 6750 | token    |
  +--------+------+----------+
  */

  const authorizationValue = request.header("Authorization");
  const authorization = /^(?<scheme>\S+) (?<parameters>\S+)$/i.exec(authorizationValue)?.groups;

  if (authorization?.scheme === "Basic") {
    /*
    With HTTP Basic authorization, the credentials are in the format "<userId>:<password>" but
    encoded in Base64 (see RFC 7617 section 2 for a more detailed description).
    */

    const credentialsText = Buffer.from(authorization.parameters, "base64");
    const credentials = /^(?<userId>[^:]*):(?<password>.*)$/i.exec(credentialsText)?.groups;

    return credentials ? { userId: credentials.userId, password: credentials.password } : null;
  } else if (authorization?.scheme === "Bearer") {
    /*
    With HTTP Bearer authorization, the token is encoded in Base64 (see RFC 6750 section 2 for
    a more detailed description).
    */

    return { token: Buffer.from(authorization.parameters, "base64") };
  } else return null;
}

//For demoing purpose only and does not represent the final product
//Helper function to handle Google Drive authentication
async function getGoogleAuth() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), "googledrive-api-key.json"),
    scopes: ["https://www.googleapis.com/auth/drive.file"]
  });

  const authClient = await auth.getClient();

  return authClient;
}

//For demoing purpose only and does not represent the final product
//Helper function to upload a file to Google Drive
async function uploadFileToGoogleDrive(auth, file) {
  const drive = google.drive({ version: "v3", auth });

  const fileMetadata = { name: file.originalname };

  const media = {
    mimeType: file.mimetype,
    body: fs.createReadStream(file.path)
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: "id, name, mimeType, webViewLink"
  });

  return response.data;
}

//For demoing purpose only and does not represent the final product
//Function to handle the complete process of uploading files and saving metadata
async function createFile(files) {
  const auth = await getGoogleAuth();
  const savedFiles = [];

  for (const file of files) {
    const uploadedFile = await uploadFileToGoogleDrive(auth, file);

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

async function deleteFileFromGoogleDrive(fileId) {
  const auth = await getGoogleAuth();
  const drive = google.drive({ version: "v3", auth });

  try {
    await drive.files.delete({
      fileId: fileId
    });

    console.log(`File with ID ${fileId} has been deleted from Google Drive`);
  } catch (err) {
    console.error(`Failed to delete file with ID ${fileId}`, err.message);
    throw new Error(`Failed to delete file with ID ${fileId}: ${err.message}`);
  }
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
  const files = await fileModel.find();

  if (!files.length) throw new Error("No files found");

  return files;
}

//For demoing purpose only and does not represent the final product
//Access files uploaded to Google Drive
async function accessGooleDriveFiles(fileId) {
  try {
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: "v3", auth });

    // Get the file metadata to determine the MIME type
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: "mimeType, name"
    });

    const mimeType = fileMetadata.data.mimeType;
    const fileName = fileMetadata.data.name;

    // Get the file content
    const fileStream = await drive.files.get(
      { fileId: fileId, alt: "media" },
      { responseType: "stream" }
    );

    return { fileStream, mimeType, fileName };
  } catch (error) {
    console.error("Error fetching file from Google Drive:", error.message);
    console.error("Error details:", error.response?.data || error.stack);
    throw new Error("Failed to fetch file from Google Drive.");
  }
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
  getAuthorizationData,
  getAllFiles,
  // updateFile,
  deleteFile,
  getGoogleAuth,
  uploadFileToGoogleDrive,
  createFile,
  accessGooleDriveFiles
};
