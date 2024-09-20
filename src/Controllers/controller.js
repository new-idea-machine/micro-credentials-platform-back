import { userModel } from "../Models/UserModel.js";
import validator from "validator";
import * as service from "../service.js";

async function getAll(req, res) {
  try {
    service.getAll();
    res.send();
  } catch (error) {
    res.status(504).send();
  }
}

async function get(req, res) {
  const authorizationData = service.getAuthorizationData(req);
  if (!authorizationData?.userId) {
    res.setHeader("WWW-Authenticate", 'Basic realm="user"');
    res.status(401).send();
  } else {
    try {
      const user = await userModel.findOne({ email: authorizationData.userId }).lean();
      if (!user) {
        res.status(404).send();
      } else if (authorizationData.password !== user.password) {
        res.setHeader("WWW-Authenticate", 'Basic realm="user"');
        res.status(401).send();
      } else {
        const access_token = Date.now().toString(); // temporary placeholder for token generation
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

async function getAuth(req, res) {
  const authorizationData = service.getAuthorizationData(req);
  if (!authorizationData?.userId) {
    res.setHeader("WWW-Authenticate", 'Basic realm="user"');
    res.status(401).send();
  } else {
    try {
      const user = await userModel.findOne({ email: authorizationData.userId }).lean();
      if (!user) {
        res.status(404).send();
      } else if (authorizationData.password !== user.password) {
        res.setHeader("WWW-Authenticate", 'Basic realm="user"');
        res.status(401).send();
      } else {
        // temporary placeholder for token generation
        const access_token = Date.now().toString();
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

async function create(req, res) {
  const authorizationData = service.getAuthorizationData(req);
  const user = req.body;
  if (
    !authorizationData?.userId ||
    !validator.isEmail(authorizationData.userId) ||
    authorizationData?.password === ""
  ) {
    res.setHeader("WWW-Authenticate", 'Basic realm="user"');
    res.status(401).send();
  } else if (typeof user?.name !== "string") {
    res.status(406).send();
  } else if (typeof user?.isInstructor !== "boolean") {
    res.status(406).send();
  } else {
    const registrant = new userModel({
      name: user.name,
      email: authorizationData.userId,
      password: authorizationData.password,
      learnerData: user.learnerData,
      instructorData: user.isInstructor
        ? user.instructorData
          ? user.instructorData
          : null
        : null
    });
    try {
      const newDocument = await registrant.save();
      const access_token = Date.now().toString(); // temporary placeholder for token generation
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

async function update(req, res) {
  /*
  Method to update the user profile document with request body data.

  Accepts: application/json request body
  Returns: Status Code, Updated User Document
  Headers: should contain authorization header
          Authorization: Basic <base64 encoded username:password>
          Authorization: Bearer <access token>
  */
  try {
    const authorizationData = service.getAuthorizationData(req);
    const updateUserRequest = req.body;
    const nonUpdatablePaths = ["learnerData", "instructorData"];

    // If the authorization data does not contain user ID respond with Unauthorized Access Error
    if (!authorizationData?.userId) {
      res.setHeader("WWW-Authenticate", 'Basic realm="user"');
      res.status(401).send();
    }

    // Remove the keys from request body for non updatable paths
    nonUpdatablePaths.forEach((key) => {
      if (updateUserRequest.hasOwnProperty(key)) res.status(400).send();
    });

    // Find the user in the database by the user ID and update if the user exists
    const savedUser = await userModel.findOneAndUpdate(
      { email: authorizationData.userId },
      { ...updateUserRequest },
      { new: true }
    );

    // If user does not exist in database respond with Not Found Error
    if (!savedUser) res.status(404).send();
    // If user exists, respond with updated user data
    res.status(200).send(savedUser);
  } catch (error) {
    res.status(504).send();
  }
}

//Currently empties database, will change to only delete one user when done
async function removeOne(req, res) {
  service
    .removeOne()
    .then((user) => {
      if (!user) {
        res.status(404).send();
      } else {
        res.status(200).send();
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(504).send();
    });
}

export { getAll, get, create, removeOne, update, getAuth };
