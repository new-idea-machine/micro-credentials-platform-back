import dotenv from "dotenv";
import { userModel, learnerModel, instructorModel } from "./model.js";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js";
import { ClientSecretCredential } from "@azure/identity";
import crypto from "crypto";
import jwt from "jsonwebtoken";
dotenv.config();

const resetHolder = [{ email: "no", token: "fake" }];

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

async function updatePassword(email, newPassword) {
  await userModel.updateOne({ email: email }, { password: newPassword });
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
//update open api spec?
async function sendEmail(email, content) {
  const credential = new ClientSecretCredential(
    process.env.TENANT_ID, // Directory (tenant) ID
    process.env.APPLICATION_ID, // Application (client) ID
    process.env.APPLICATION_SECRET // Application Secret
  );
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"]
  });
  const client = Client.initWithMiddleware({ debugLogging: true, authProvider });
  const sendMail = {
    message: {
      subject: "Password Reset",
      body: {
        contentType: "Text",
        content: content
      },
      toRecipients: [
        {
          emailAddress: { address: email } // Recipient's e-mail address
        }
      ]
    },
    saveToSentItems: "false"
  };
  client
    .api("/users/donotreply@untappedenergy.ca/sendMail") // Shared mailbox e-mail address
    .header("Content-type", "application/json")
    .post(sendMail, (err, res, rawResponse) => {
      console.log(res);
      console.log(rawResponse);
      console.log(err);
    });
}

async function passwordRecovery(account) {
  const access_token = jwt.sign({ name: account }, process.env.SECRET_KEY, { expiresIn: "1h" });
  sendEmail(
    account,
    `Click the following link to reset your password: http://localhost:5001/auth/recovery/${access_token}"`
  );
}

export {
  getAll,
  get,
  create,
  updatePassword,
  removeOne,
  getAuthorizationData,
  passwordRecovery,
  resetHolder
};
