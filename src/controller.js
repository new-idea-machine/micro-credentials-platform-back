import { userModel } from "./model.js";
import validator from "validator";
import * as service from "./service.js";
import jwt from "jsonwebtoken";
import { authenticationMiddleware } from "../tokenManager.js";
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
        res.status(403).send();
      } else if (error?.name === "ValidationError" || error?.name === "CastError") {
        res.status(406).send();
      } else {
        res.status(504).send();
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

/**
 * @description sends email for password recovery, email source will be changed upon front end
 * completion
 * @param {*} req will be altered to recieve email address when front end component complete
 * @param {*} res either ok or cant reach server
 */
async function sendRecoveryEmail(req, res) {
  try {
    // jimmy to add authmiddleware to server first
    const authHeader = req.headers["authorization"];
    const token = authHeader.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    const email = decodedToken.name;
    console.log(email);
    const checkedEmail = await userModel.findOne({ email: email }).lean();
    if (checkedEmail) {
      await service.passwordRecovery(email).then(res.sendStatus(200));
    } else {
      await service
        .sendEmail(
          email,
          "Password recovery was requested for this e-mail address but there isn't an account associated with it."
        )
        .then(res.sendStatus(200));
    }
    //await service.passwordRecovery(email).then(res.sendStatus(200))
  } catch (error) {
    res.status(504);
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
    const authHeader = req.headers["authorization"];
    const token = authHeader.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    const email = decodedToken.name;
    const password = req.token || "newpass";
    if (token) {
      console.log("test");
      await service.updatePassword(email, password).then(res.sendStatus(200));
      // res.send(
      //   '<form method="post" action="/auth/resetPassword"><input type="password" name="password" required><script>user</script><input type="submit" value="Reset Password"></form>'
      // );
    } else {
      res.status(401);
      console.log("test123");
    }
  } catch (error) {
    res.status(504);
  }
}

// /**
//  * @description resets password from form
//  * @param {*} req recieves relevent html information
//  * @param {*} res sends relevent error message or new password to back end if successful
//  */
// async function resetPassword(req, res) {
//   try {
//     const newPassword = req.body.password;
//     const email = jwt.verify(req.headers.referer.split("/")[5], process.env.SECRET_KEY).name;
//     service.updatePassword(email, newPassword);
//   } catch (error) {
//     res.status(503).json({ msg: "Cant reach server" });
//   }
// }

export { getAll, get, create, removeOne, sendRecoveryEmail, getAuth, resetPasswordReceiver };
