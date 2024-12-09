import { userModel } from "./model.js";
import validator from "validator";
import * as service from "./service.js";
import { reverseMultiplyAndSum } from "validator/lib/util/algorithms.js";
import jwt from "jsonwebtoken";
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

/**
 * @description sends email for password recovery, email source will be changed upon front end
 * completion
 * @param {*} req will be altered to recieve email address when front end component complete
 * @param {*} res either ok or cant reach server
 */
async function sendRecoveryEmail(req, res) {
  try {
    const email = process.env.EMAIL;
    await service.passwordRecovery(email).then(res.sendStatus(200));
  } catch (error) {
    res.status(503).json({ msg: "Cant reach server" });
  }
}

/**
 * @description recieves request for password reset from email, res.send being too long
 * is intentional, it wasnt working split up. will be changed to a link to the corresponding
 * front end page when that is ready
 * @param {*} req used for getting token for verification
 * @param {*} res sends relevent error message or form for password reset if successful
 */
async function resetPasswordReceiver(req, res) {
  try {
    const token = jwt.verify(req.params.i, process.env.SECRET_KEY);
    const email = token.name;
    console.log(token);
    if (token) {
      res.send(
        '<form method="post" action="/auth/resetPassword"><input type="password" name="password" required><script>user</script><input type="submit" value="Reset Password"></form>'
      );
    } else {
      res.status(404).send("Invalid or expired token");
    }
  } catch (error) {
    res.status(503).json({ msg: "Cant reach server" });
  }
}

/**
 * @description resets password from form
 * @param {*} req recieves relevent html information
 * @param {*} res sends relevent error message or new password to back end if successful
 */
async function resetPassword(req, res) {
  try {
    const newPassword = req.body.password;
    const email = jwt.verify(req.headers.referer.split("/")[5], process.env.SECRET_KEY).name;
    service.updatePassword(email, newPassword);
  } catch (error) {
    res.status(503).json({ msg: "Cant reach server" });
  }
}

export {
  getAll,
  get,
  create,
  removeOne,
  sendRecoveryEmail,
  getAuth,
  resetPasswordReceiver,
  resetPassword
};
