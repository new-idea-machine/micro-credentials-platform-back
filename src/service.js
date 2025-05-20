import dotenv from "dotenv";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js";
import { ClientSecretCredential } from "@azure/identity";
import jwt from "jsonwebtoken";
import fs from "fs";
import { userModel, learnerSchema, instructorSchema, fileModel } from "./model.js";
import { uploadFileToGoogleDrive, deleteFileFromGoogleDrive } from "./googleDrive.js";
dotenv.config();

const resetHolder = [{ email: "no", token: "fake" }];

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

async function updatePassword(email, newPassword) {
  await userModel.updateOne({ email: email }, { password: newPassword });
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
//update open api spec?
async function sendEmail(email, content) {
  const credential = new ClientSecretCredential(
    process.env.TENANT_ID, // Directory (tenant) ID
    process.env.APPLICATION_ID, // Application (client) ID
    process.env.APPLICATION_SECRET // Application Secret
  );
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"]
  });
  const client = Client.initWithMiddleware({ debugLogging: true, authProvider });
  const sendMail = {
    message: {
      subject: "Password Reset",
      body: {
        contentType: "Text",
        content: content
      },
      toRecipients: [
        {
          emailAddress: { address: email } // Recipient's e-mail address
        }
      ]
    },
    saveToSentItems: "false"
  };
  client
    .api("/users/donotreply@untappedenergy.ca/sendMail") // Shared mailbox e-mail address
    .header("Content-type", "application/json")
    .post(sendMail, (err, res, rawResponse) => {
      console.log(res);
      console.log(rawResponse);
      console.log(err);
    });
}

async function passwordRecovery(account, token) {
  // const access_token = jwt.sign({ name: account }, process.env.SECRET_KEY, {
  //   expiresIn: "20m"
  // });
  const access_token = token;
  sendEmail(
    account,
    `Click the following link to reset your password: ${process.env.URL}${access_token}"`
  );
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
  getAuthorizationData,
  passwordRecovery,
  sendEmail,
  getAllFiles,
  // updateFile,
  deleteFile,
  createFile
};
