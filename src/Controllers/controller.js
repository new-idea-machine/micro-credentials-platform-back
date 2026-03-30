/**
 * Controller module for handling HTTP requests and responses.
 *
 * Refer to the OpenAPI specification (`/openapi.yaml`) and cross-reference `/src/router.js` for
 * details regarding each handler's expected request and response.
 *
 * @module controller
 */

import validator from "validator";
import multer from "multer";
import { database, userModel } from "../model.js";
import { generateToken } from "../../tokenManager.js";
import * as service from "../service.js";
import * as googleDrive from "../googleDrive.js";

const upload = multer({ dest: "uploads/" });

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
      const user = await userModel.findById(req.userUid).lean();
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
      const user = await userModel.findOne({ email: req.userId });
      if (!user) {
        res.status(404).send();
        return;
      }
      // Compares the provided password with the stored hashed password
      const passwordsMatch = await user.passwordMatches(req.password);

      if (!passwordsMatch) {
        res.setHeader("WWW-Authenticate", 'Basic realm="user"');
        res.status(401).send();
      } else {
        const access_token = generateToken(user._id.toString());
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
      const access_token = generateToken(newDocument._id.toString());
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
        console.log(error);
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
        .findByIdAndUpdate(req.userUid, req.body, { new: true })
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
      await userModel.findOneAndDelete({ email: req.userUid });
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

/**
 * Upload multiple files to Google Drive
 *
 * @see "paths:/files:post" in "/openapi.yaml" for details.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function uploadFiles(req, res) {
  if (!("userUid" in req)) {
    res.setHeader("WWW-Authenticate", 'Bearer realm="user"');
    res.status(401).send();
    return;
  }

  try {
    /*
    First, the user is checked to ensure that they're an instructor.  Only instructors can upload
    files.
    */

    const user = await userModel.findById(req.userUid).lean();

    if (!user) {
      res.status(401).send();
      return;
    }

    if (!user.instructorData) {
      res.status(403).send();
      return;
    }

    /*
    Next, Multer is used to process the incoming files, then the files are all transferred to the
    file server and their URL's are returned.  If no files were found in the request or if there
    was an error transferring the files then an appropriate result code is sent back.
    */

    await upload.array("files")(req, res, async function (err) {
      if (err) {
        res.status(406).send();
        return;
      }

      if (req?.files?.length === undefined || req.files.length === 0) {
        return res.status(406).send();
      }

      try {
        const fileUrls = await service.uploadFiles(req.userUid, req.files);

        res.status(201).json(fileUrls);
      } catch (error) {
        console.error("Error uploading files:", error);
        res.status(504).send();
      }
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(504).send();
  }
}

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
async function accessGoogleDriveFiles(req, res) {
  try {
    const fileId = req.params.id;

    // Call the getFile function from service.js
    const { fileStream, mimeType, fileName } = await googleDrive.accessGoogleDriveFiles(fileId);

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

/**
 * Create a new course
 *
 * @see "POST /courses" in "/openapi.yaml" for details.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createCourse(req, res) {
  if (!("userUid" in req)) {
    res.setHeader("WWW-Authenticate", 'Bearer realm="user"');
    res.status(401).send();

    return;
  }

  try {
    /*
    First, the user is checked to ensure that they're an instructor.  Only instructors can create
    courses.
    */

    const user = await userModel.findById(req.userUid).lean();

    if (!user) {
      res.status(401).send();

      return;
    }

    if (!user.instructorData) {
      res.status(403).send();

      return;
    }

    /*
    Next, the course data is validated.  If any required fields are missing or have invalid values
    then an appropriate error code is returned.
    */

    const course = req.body;

    if (
      typeof course?.UID !== "string" ||
      course.UID !== "" ||
      typeof course?.instructor !== "string" ||
      course.instructor !== req.userUid ||
      typeof course?.title !== "string" ||
      typeof course?.description !== "string" ||
      typeof course?.price !== "number" ||
      course.price < 0 ||
      typeof course?.duration !== "number" ||
      course.duration < 0
    ) {
      res.status(406).send();

      return;
    }

    /*
    TODO:  Call service function to create the course

    const courseUid = await service.createCourse(course);
    res.status(201).send(courseUid);
    */

    res.status(501).send(); // Not implemented yet
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(504).send();
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
  uploadFiles,
  // updateFile,
  deleteFile,
  accessGoogleDriveFiles,
  createCourse
};
