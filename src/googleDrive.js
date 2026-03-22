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

/**
 * Upload a file to Google Drive, giving it a unique filename.
 *
 * The uploaded file will be named using the pattern: "userUid_timestamp_originalFilename"
 * This naming convention makes it easy to identify the file's owner and original name.
 *
 * If successful, the function returns the uploaded file's metadata from Google Drive (including a
 * direct URL to the file).
 *
 * @param {string} userUid - The unique identifier of the user uploading the file
 * @param {Object} file - The file object from multer containing file information
 * @param {string} file.originalname - The original name of the uploaded file
 * @param {string} file.mimetype - The MIME type of the file
 * @param {string} file.path - The temporary path where the file is stored on the server
 * @returns {Promise<Object>} The uploaded file's metadata from Google Drive
 * @returns {string} return.id - The unique Google Drive file ID
 * @returns {string} return.name - The name of the file in Google Drive
 * @returns {string} return.mimeType - The MIME type of the file
 * @returns {string} return.webContentLink - The direct URL to the file
 * @throws {Error} If parentFolder is not configured
 * @throws {TypeError} If userUid is not a string
 * @throws {TypeError} If file is not an object or missing required members
 *
 * @example
 * const fileData = await uploadFileToGoogleDrive("user123", multerFileObject);
 *
 * console.log(fileData.id); // "1a2b3c4d5e6f7g8h9i0j"
 * console.log(fileData.name); // "user123_1234567890_document.pdf"
 * console.log(fileData.webContentLink); // "https://drive.google.com/uc?id=1a2b3c4d5e6f7g8h9i0j&export=download"
 */
async function uploadFileToGoogleDrive(userUid, file) {
  if (typeof parentFolder !== "string") {
    console.error("Google Drive parent folder is not configured");
    throw new Error("Google Drive is not available");
  }

  if (typeof userUid !== "string") {
    console.error("userUid must be a string");
    throw new TypeError("userUid must be a string");
  }

  if (!(file instanceof Object)) {
    console.error("file must be an object");
    throw new TypeError("file must be an object");
  }

  if (typeof file.originalname !== "string") {
    console.error("file.originalname must be a string");
    throw new TypeError("file.originalname must be a string");
  }

  if (typeof file.mimetype !== "string") {
    console.error("file.mimetype must be a string");
    throw new TypeError("file.mimetype must be a string");
  }

  if (typeof file.path !== "string") {
    console.error("file.path must be a string");
    throw new TypeError("file.path must be a string");
  }

  /*
  First, create the file's metadata that includes a unique filename:
  "userUid_timestamp_originalFilename" (which will also make it easy to identify the file's owner
  and original name).
  */

  const timestamp = Date.now();
  const uniqueFileName = `${userUid}_${timestamp}_${file.originalname}`;

  const fileMetadata = {
    name: uniqueFileName,
    parents: [parentFolder],
    description: `Uploaded by ${userUid} at ${new Date(timestamp).toISOString()}`
  };

  /*
  Next, upload the file's contents to Google Drive.
  */

  const media = {
    mimeType: file.mimetype,
    body: fs.createReadStream(file.path)
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: "id, name, mimeType"
  });

  /*
  After uploading, set the file permissions to make it accessible.  This is necessary for
  webContentLink to be available.

  The permissions call is separate from file creation as the Google Drive API doesn't support
  setting permissions during file creation.

  Note: The webContentLink string has to be constructed manually, but it follows an established,
  predictable pattern ("https://drive.google.com/uc?id=<id>&export=download").
  */

  try {
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: "reader",
        type: "anyone"
      }
    });
  } catch (error) {
    console.error(`Failed to set permissions for file ${response.data.id}:`, error.message);
  }

  response.data.webContentLink = `https://drive.google.com/uc?id=${response.data.id}&export=download`;

  return response.data;
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
