import { userModel, learnerModel, instructorModel, fileModel } from "./model.js";

async function getAll() {
  const users = await userModel.find();
  console.log(users);
  return users;
}

async function get(user) {
  return { userUID: user._id, name: user.username, email: user.email };
}

async function create(user) {
  const registrant = new userModel({
    username: user.userInfo.name,
    email: user.userInfo.email,
    password: user.password,
    learnerData: new learnerModel({}),
    instructorData: user.isInstructor ? new instructorModel({}) : null
  });
  const newDocument = await registrant.save();
  return { userUID: newDocument._id };
}

async function updatePassword(name, newPassword) {
  await userModel.updateOne({ username: name }, { password: newPassword });
}

//Currently empties database, will change to only delete one user when done
async function removeOne() {
  await userModel.deleteMany({});
}

function getAuthorizationData(request) {
  /*
  Extract authorization data from an Express.js "Request" object and return an object
  containing this data.  If no recognized authorization data is found then return "null".

  Authorization data is found in the request's "Authorization" header.  The actual members of
  the returned object will depend on the type of authorization in the request.

  +--------+------+----------+
  | Scheme | RFC  | Members  |
  +========+======+==========+
  | Basic  | 7617 | userId   |
  |        |      | password |
  +--------+------+----------+
  | Bearer | 6750 | token    |
  +--------+------+----------+
  */

  const authorizationValue = request.header("Authorization");
  const authorization = /^(?<scheme>\S+) (?<parameters>\S+)$/i.exec(authorizationValue)?.groups;

  if (authorization?.scheme === "Basic") {
    /*
    With HTTP Basic authorization, the credentials are in the format "<userId>:<password>" but
    encoded in Base64 (see RFC 7617 section 2 for a more detailed description).
    */

    const credentialsText = Buffer.from(authorization.parameters, "base64");
    const credentials = /^(?<userId>[^:]*):(?<password>.*)$/i.exec(credentialsText)?.groups;

    return credentials ? { userId: credentials.userId, password: credentials.password } : null;
  } else if (authorization?.scheme === "Bearer") {
    /*
    With HTTP Bearer authorization, the token is encoded in Base64 (see RFC 6750 section 2 for
    a more detailed description).
    */

    return { token: Buffer.from(authorization.parameters, "base64") };
  } else return null;
}

//For demoing purpose only and does not represent the final product
async function getAllFiles(req, res) {
  try {
    const files = await fileModel.find();
    console.log(files);
    res.status(200).json(files);
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
}

//For demoing purpose only and does not represent the final product
async function createFile(req, res) {
  try {
    const newFile = {
      filename: req.body.filename,
      url: req.body.url
    };
    const createdFile = await fileModel.create(newFile);
    res.status(200).json(createdFile);
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
}

//For demoing purpose only and does not represent the final product
async function updateFile(req, res) {
  try {
    const { fileID } = req.params;

    const updatedFile = await fileModel.findByIdAndUpdate(fileID, req.body, { new: true });

    if (!updatedFile) {
      return res.status(401).json({ message: `File is not found.` });
    } else {
      return res.status(200).json(updatedFile);
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
}

//For demoing purpose only and does not represent the final product
async function deleteFile(req, res) {
  try {
    console.log(`entered deleteFile function`);
    const { fileID } = req.params;
    console.log(`fileID is ${fileID}`);

    const deletedFile = await fileModel.findByIdAndDelete(fileID);

    if (!deletedFile) {
      return res.status(401).json({ message: `File is not found.` });
    } else {
      return res.status(200).json({ message: `File deleted successfully.` });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
}

export {
  getAll,
  get,
  create,
  updatePassword,
  removeOne,
  getAuthorizationData,
  getAllFiles,
  createFile,
  updateFile,
  deleteFile
};
