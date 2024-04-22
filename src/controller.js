import { userModel } from "./model.js";
import validator from "validator";
import * as service from "./service.js";

//this file decides what does the work

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

async function create(req, res) {
  try {
    const user = req.body;
    const takenEmail = await userModel.findOne({ email: user.userInfo.email });
    if (!user.userInfo.email) {
      res.status(406).json({ msg: "Missing email" });
    } else if (
      typeof user.userInfo.email !== "string" ||
      !validator.isEmail(user.userInfo.email)
    ) {
      res.status(406).json({ msg: "Invalid e-mail address type" });
    } else if (takenEmail) {
      res.status(403).json({ msg: "User already exists (try logging in instead)" });
    } else if (!user.userInfo.name) {
      res.status(406).json({ msg: "Missing name" });
    } else if (typeof user.userInfo.name !== "string") {
      res.status(406).json({ msg: "Invalid name type" });
    } else if (!user.password) {
      res.status(406).json({ msg: "Invalid password" });
    } else if (typeof user.password !== "string") {
      res.status(406).json({ msg: "Invalid password type" });
    } else if (typeof user.isInstructor !== "boolean") {
      res.status(406).json({ msg: "missing learner and instructor data" });
    } else {
      res.status(201).json(await service.create(user));
    }
  } catch (error) {
    console.log(typeof req.body.userInfo.email);
    res.status(503).json({ msg: "Cant reach server" });
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

export { getAll, get, create, removeOne, update };
