import { google } from "googleapis";
import fs from "fs";
import path from "path";

//For demoing purpose only and does not represent the final product
//Helper function to handle Google Drive authentication
async function getGoogleAuth() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), "googleDriveOAuth.json"),
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
//Access files uploaded to Google Drive
async function accessGoogleDriveFiles(fileId) {
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

export {
  getGoogleAuth,
  uploadFileToGoogleDrive,
  deleteFileFromGoogleDrive,
  accessGoogleDriveFiles
};
