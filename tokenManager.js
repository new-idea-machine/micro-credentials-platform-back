import "dotenv/config";
import JWT from "jsonwebtoken";

const secretKey = process.env.SECRET_KEY;

if (!secretKey) {
  throw new Error("SECRET_KEY is not defined in the environment variables.");
}

let loggedInUsers = [];

function generateToken(userUid) {
  removeExpiredTokens();
  const charString = "ABCDEFGHIJKLMNOPQRSTUVWXYZzyxwvutsrqponmlkjihgfedcba1234567890+/";
  const tokenLength = 40;
  let token = "";

  do {
    token = "";
    for (let i = 0; i < tokenLength; i++) {
      token += charString.charAt(Math.floor(Math.random() * charString.length));
    }
  } while (loggedInUsers.some((entry) => entry.token === token));

  const jwtPayload = { token };
  const signedToken = JWT.sign(jwtPayload, secretKey, { expiresIn: "1h" });
  loggedInUsers.push({ token, userUid, lastAccessed: new Date() });

  return signedToken;
}

function getUserUid(signedToken) {
  removeExpiredTokens();
  try {
    const decodedToken = JWT.verify(signedToken, secretKey);
    const entry = loggedInUsers.find((entry) => entry.token === decodedToken.token);
    if (entry) {
      entry.lastAccessed = new Date();
      return entry.userUid;
    }
    return null;
  } catch (error) {
    return null;
  }
}

function logout(signedToken) {
  removeExpiredTokens();
  try {
    const decodedToken = JWT.verify(signedToken, secretKey);
    const initialLength = loggedInUsers.length;
    loggedInUsers = loggedInUsers.filter((entry) => entry.token !== decodedToken.token);
    return loggedInUsers.length < initialLength;
  } catch (error) {
    return false;
  }
}

function removeExpiredTokens() {
  loggedInUsers = loggedInUsers.filter((entry) => {
    try {
      JWT.verify(entry.token, secretKey);
      return true;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return false;
      }
      return true;
    }
  });
}

/**
 * Extract authorization data from an Express.js `Request` object and add it as members to that
 * object.  If no recognized authorization data is found then no changes are made.
 *
 * Authorization data is found in the request object's `Authorization` header.  The actual members
 * that will be added to that object depend on the type of authorization.
 *
 * | Scheme | RFC  | Members     |
 * |--------|------|-------------|
 * | Basic  | 7617 | userId      |
 * |        |      | password    |
 * | Bearer | 6750 | bearerToken |
 * |        |      | userUid*    |
 *
 * \* For Bearer tokens, if the token corresponds to a user that's already logged in then `userUid`
 * will be set for that user -- otherwise, `userUid` will be `null`.
 *
 * @param {Object} req - Express.js Request object
 * @param {Object} res - Express.js Response object
 * @param {Function} next - Express.js next() middleware function
 */
function authenticationMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (authHeader) {
    /*
    Authorization header credentials are in the format "<scheme> <parameters>".  The format of
    "parameters" depends on the authorization scheme.

    See RFC 9110 section 11.4 for a more detailed description.
    */

    const authCredentialsFormat = /^(?<scheme>\S+) +(?<parameters>\S+)$/;
    const authCredentials = authCredentialsFormat.exec(authHeader)?.groups;

    if (authCredentials?.scheme === "Basic") {
      /*
      With HTTP Basic authorization, the parameters are in the format "<userId>:<password>" but
      encoded in Base64 (see RFC 7617 section 2 for a more detailed description).
      */

      const decodedParameters = Buffer.from(authCredentials.parameters, "base64").toString();
      const basicAuthParametersFormat = /^(?<userId>[^:]*):(?<password>.*)$/;
      const basicAuthParameters = basicAuthParametersFormat.exec(decodedParameters)?.groups;

      if (basicAuthParameters) {
        req.userId = basicAuthParameters.userId;
        req.password = basicAuthParameters.password;
      }
    } else if (authCredentials?.scheme === "Bearer") {
      /*
      With HTTP Bearer authorization, the bearer token is sent as-is without encoding (see RFC 6750
      section 2 for a more detailed description).
      */

      const bearerToken = authCredentials.parameters;

      req.bearerToken = bearerToken;
      req.userUid = getUserUid(bearerToken);
    }
  }

  next();
}

export { generateToken, getUserUid, logout, authenticationMiddleware };
