/**
 * Controller module for handling HTTP requests and responses.
 *
 * Refer to the OpenAPI specification (`/openapi.yaml`) and cross-reference `/src/routes.js` for
 * details regarding each handler's expected request and response.
 *
 * @module controller
 */

import { database, userModel } from "./model.js";
import validator from "validator";
import { generateToken, getUserUid } from "../tokenManager.js";

/**
 * Check to see if the database is online.
 *
 * @see "GET /" in "/openapi.yaml" for details.
 *
 * @param {Object} req - Express request object (not actually used by this function)
 * @param {Object} res - Express response object
 */
function getAll(req, res) {
    const connected = 1;

    res.status(database.readyState === connected ? 200 : 504).send();
}

/**
 * Retrieve a specific user by their bearer token.
 *
 * @see "GET /user" in "/openapi.yaml" for details.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function get(req, res) {
  if (!("userUid" in req)) {
    res.setHeader("WWW-Authenticate", 'Bearer realm="user"');
    res.status(401).send();
  } else {
    try {
      const user = await userModel.findOne({ email: getUserUid(req.userUid) }).lean();
      if (!user) {
        res.status(404).send();
      } else {
        res.status(200).json({
          name: user.name,
          email: user.email,
          learnerData: user.learnerData,
          instructorData: user.instructorData
        });
      }
    } catch {
      res.status(504).send();
    }
  }
}

/**
 * Authenticate a user with their credentials and send back an access token.
  *
 * @see "GET /auth" in "/openapi.yaml" for details.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
*/
async function getAuth(req, res) {
  if (!("userId" in req) || !("password" in req)) {
    res.setHeader("WWW-Authenticate", 'Basic realm="user"');
    res.status(401).send();
  } else {
    try {
      const user = await userModel.findOne({ email: req.userId }).lean();
      if (!user) {
        res.status(404).send();
      }
      // Compares the provided password with the stored hashed password
      const userRecord = await userModel.findById(user._id);
      const passwordsMatch = await userRecord.passwordMatches(req.password);

      if (!passwordsMatch) {
        res.setHeader("WWW-Authenticate", 'Basic realm="user"');
        res.status(401).send();
      } else {
        const access_token = generateToken(req.userId);
        res.status(200).json({
          access_token,
          token_type: "Bearer",
          user_data: {
            name: user.name,
            email: user.email,
            learnerData: user.learnerData,
            instructorData: user.instructorData
          }
        });
      }
    } catch {
      res.status(504).send();
    }
  }
}

/**
 * Create a new user in the database
 *
 * @see "POST /auth" in "/openapi.yaml" for details.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function create(req, res) {
  const user = req.body;
  if (!("userId" in req) || !("password" in req)) {
    res.setHeader("WWW-Authenticate", 'Basic realm="user"');
    res.status(406).send();
  } else if (!validator.isEmail(req.userId)) {
    res.status(406).send();
  } else if (typeof user?.name !== "string") {
    res.status(406).send();
  } else if (typeof user?.isInstructor !== "boolean") {
    res.status(406).send();
  } else {
    const registrant = new userModel({
      name: user.name,
      email: req.userId,
      password: req.password,
      learnerData: {},
      instructorData: user.isInstructor ? {} : null
    });
    try {
      const newDocument = await registrant.save();
      const access_token = generateToken(req.userId);
      res.status(201).json({
        access_token,
        token_type: "Bearer",
        user_data: {
          name: newDocument.name,
          email: newDocument.email,
          learnerData: newDocument.learnerData,
          instructorData: newDocument.instructorData
        }
      });
    } catch (error) {
      const duplicateKeyError = 11000;
      if (error?.code === duplicateKeyError) {
        res.status(403).send();
      } else if (error?.name === "ValidationError" || error?.name === "CastError") {
        res.status(406).send();
      } else {
        res.status(504).send();
      }
    }
  }
}

/**
 * Update an existing user's information.
 *
 * @see "PATCH /user" in "/openapi.yaml" for details.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function update(req, res) {
  if (!("userUid" in req)) {
    res.setHeader("WWW-Authenticate", 'Bearer realm="user"');
    res.status(401).send();
  } else {
    try {
      const user = await userModel
        .findOneAndUpdate({ email: getUserUid(req.userUid) }, req.body)
        .lean();
      if (!user) {
        res.status(406).send();
      } else {
        res.status(200).json({
          name: user.name,
          email: user.email,
          learnerData: user.learnerData,
          instructorData: user.instructorData
        });
      }
    } catch {
      res.status(504).send();
    }
  }
}

/**
 * Delete a user from the database.
 *
 * @see "DELETE /user" in "/openapi.yaml" for details.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function removeOne(req, res) {
  if (!("userUid" in req)) {
    res.setHeader("WWW-Authenticate", 'Bearer realm="user"');
    res.status(401).send();
  } else {
    try {
      await userModel.findOneAndDelete({ email: getUserUid(req.userUid) });
      res.status(200).send();
    } catch {
      res.status(504).send();
    }
  }
}

//For demoing purpose only and does not represent the final product
async function getAllFiles(req, res) {
  try {
    const files = await service.getAllFiles();
    res.status(200).json(files);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
}

//For demoing purpose only and does not represent the final product
async function createFile(req, res) {
  await upload.array("files", 10)(req, res, async function (err) {
    if (err) {
      return res.status(400).send({ message: `File upload failed. ${err}` });
    }

    try {
      //Call processFiles to handle the uploaded files

      const savedFiles = await service.createFile(req.files);

      //Respond with the saved file metadata
      res.status(200).json(savedFiles);
    } catch (err) {
      res.status(500).send({ message: err.message });
    }
  });
}

//For demoing purpose only and does not represent the final product
// async function updateFile(req, res) {
//   service.updateFile(req, res);
// }

//For demoing purpose only and does not represent the final product
async function deleteFile(req, res) {
  try {
    const { fileID } = req.params;
    await service.deleteFile(fileID);
    res.status(200).json({ message: `File deleted successfully.` });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
}

//For demoing purpose only and does not represent the final product
//Access files uploaded to Google Drive
async function accessGooleDriveFiles(req, res) {
  try {
    const fileId = req.params.id;

    // Call the getFile function from service.js
    const { fileStream, mimeType, fileName } = await service.accessGooleDriveFiles(fileId);

    // Set the response headers
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

    // Pipe the file content to the response
    fileStream.data.pipe(res);
  } catch (error) {
    console.error("Error from controller:", error);
    console.error("Error details:", error.response?.data || error.stack);
    res.status(500).json({ message: error.message });
  }
}

export {
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
};
