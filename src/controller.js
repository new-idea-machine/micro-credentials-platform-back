import { userModel } from "./model.js";
import validator from "validator";
import * as service from "./service.js";

async function getAll(req, res) {
  try {
    service.getAll();
    res.json({ message: "Success" });
  } catch (error) {
    res.status(503).json({ msg: "Cant reach server" });
  }
}

async function get(req, res) {
  try {
    const password = req.query.password;
    const email = req.query.email;
    if (!email || !password) {
      res.status(406).json({ msg: "No email or password" });
    } else {
      try {
        const user = await userModel.findOne({ email: req.query.email });
        if (!user) {
          res.status(404).json({ msg: "User not found." });
        } else if (password !== user.password) {
          res.status(403).json({ msg: "Incorrect password." });
        } else {
          res.status(200).json(await service.get(user));
        }
      } catch (error) {
        res.status(503).json({ msg: "Cant reach server" });
      }
    }
  } catch (error) {
    res.status(503).json({ msg: "Cant reach server" });
  }
}

async function getAuth(req, res) {
  const authorizationData = service.getAuthorizationData(req);
  if (!authorizationData?.userId) {
    res.setHeader("WWW-Authenticate", 'Basic realm="user"');
    res.status(401).json({ msg: "Invalid credentials" });
  } else {
    try {
      const user = await userModel.findOne({ email: authorizationData.userId }).lean();
      if (!user) {
        res.status(404).json({ msg: "User not found." });
      } else if (authorizationData.password !== user.password) {
        res.setHeader("WWW-Authenticate", 'Basic realm="user"');
        res.status(401).json({ msg: "Invalid credentials." });
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
      res.status(503).json({ msg: "Cant reach server" });
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
    res.status(401).json({ msg: "Invalid credentials" });
  } else if (!user?.name) {
    res.status(406).json({ msg: "Missing name" });
  } else if (typeof user?.name !== "string") {
    res.status(406).json({ msg: "Invalid name type" });
  } else if (typeof user?.isInstructor !== "boolean") {
    res.status(406).json({ msg: "missing learner and instructor data" });
  } else {
    const registrant = new userModel({
      name: user.name,
      email: authorizationData.userId,
      password: authorizationData.password,
      learnerData: {},
      instructorData: user.isInstructor ? {} : null
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
        res.status(403).json({ msg: "User already exists (try logging in instead)" });
      } else if (error?.name === "ValidationError" || error?.name === "CastError") {
        res.status(406).json({ msg: "Invalid data" });
      } else {
        res.status(503).json({ msg: "Cant reach server" });
      }
    }
  }
}

async function update(req, res) {
  try {
    const name = req.params.id;
    const newPassword = req.body.password;
    res.status(201).json(await service.updatePassword(name, newPassword));
  } catch (error) {
    res.status(503).json({ msg: "Cant reach server" });
  }
}

//Currently empties database, will change to only delete one user when done
async function removeOne(req, res) {
  service
    .removeOne()
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + " was not found");
      } else {
        res.status(200).send(req.params.Username + " was deleted.");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
}

export { getAll, get, create, removeOne, update, getAuth };
