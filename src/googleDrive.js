import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { google } from "googleapis";

dotenv.config();

const authenticationKeyFile = path.join(process.cwd(), "googleDriveAuth.json");

if (!fs.existsSync(authenticationKeyFile)) {
  console.log(`Google Authentication key file "${authenticationKeyFile}" not found.`);
  console.log("To access Google Drive, create a service account and download a key file.");
}

const auth = new google.auth.GoogleAuth({
  keyFile: authenticationKeyFile,
  scopes: ["https://www.googleapis.com/auth/drive.file"]
});

google.options({ auth });

const drive = google.drive({ version: "v3" });
const parentFolder = process.env.GOOGLE_DRIVE_MEDIA_FILES_FOLDER;

if (parentFolder) {
  console.log(`Google Drive parent folder ID:  ${parentFolder}`);
} else {
  console.log("Google Drive parent folder not specified.");
  console.log(
    'To access Google Drive, add "GOOGLE_DRIVE_MEDIA_FILES_FOLDER=<folder ID>" to ".env"' +
      "(<folder ID> can be derived from the shared folder's link URL)"
  );
}
// Function to delete all files created by the service account
async function cleanupAllFiles() {
  try {
    // Get list of all files created by this service account
    const response = await drive.files.list({
      pageSize: 100, // Adjust as needed
      fields: "files(id, name)"
    });

    const files = response.data.files;

    if (files.length) {
      console.log(`Found ${files.length} files. Deleting...`);

      // Delete each file
      const deletePromises = files.map((file) => {
        console.log(`Deleting file: ${file.name} (${file.id})`);
        return drive.files
          .delete({
            fileId: file.id
          })
          .catch((err) => {
            console.error(`Failed to delete ${file.name}: ${err.message}`);
          });
      });

      await Promise.all(deletePromises);
      console.log("All files deleted successfully");
    } else {
      console.log("No files found to delete");
    }

    return { success: true, message: `Deleted ${files.length} files` };
  } catch (error) {
    console.error("Error cleaning up files:", error.message);
    return { success: false, error: error.message };
  }
}

// cleanupAllFiles();

//For demoing purpose only and does not represent the final product
//Helper function to upload a file to Google Drive
async function uploadFileToGoogleDrive(file) {
  if (!parentFolder) {
    return undefined;
  } else {
    const fileMetadata = { name: file.originalname, parents: [parentFolder] };

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
}

async function deleteFileFromGoogleDrive(fileId) {
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
  if (!parentFolder) {
    return undefined;
  } else {
    try {
      // Get the file metadata to determine the MIME type
      const fileMetadata = await drive.files.get({
        fileId: fileId,
        fields: "mimeType, name",
        parents: [parentFolder]
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
}

export { uploadFileToGoogleDrive, deleteFileFromGoogleDrive, accessGoogleDriveFiles };
