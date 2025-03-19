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

export { getAll, get, create, removeOne, update, getAuth };