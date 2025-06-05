import "dotenv/config";
import JWT from "jsonwebtoken";

const secretKey = process.env.SECRET_KEY;

if (!secretKey) {
  throw new Error("SECRET_KEY is not defined in the environment variables.");
}

let loggedInUsers = [];

/**
 * Generate a JSON web token for a user.
 *
 * This function creates a random token string, signs it using JWT, and stores it in the
 * `loggedInUsers` array along with the user's UID and the current time.  The returned JWT token
 * can then be passed on to the user for future authentication.
 *
 * @param {string} userUid - The user identifier to associate with the web token
 * @param {string} [timeLimit=60] - How long (in minutes) the user can be idle before being
 *   automatically logged out
 * @returns {string} A signed JWT token
 */
function generateToken(userUid, timeLimit = 60) {
  removeExpiredTokens();
  const millisecondsPerMinute = 60000;
  const charString = "ABCDEFGHIJKLMNOPQRSTUVWXYZzyxwvutsrqponmlkjihgfedcba1234567890+/";
  const sessionIdLength = 40;
  let sessionId = "";

  do {
    sessionId = "";
    for (let i = 0; i < sessionIdLength; i++) {
      sessionId += charString.charAt(Math.floor(Math.random() * charString.length));
    }
  } while (loggedInUsers.some((session) => session.sessionId === sessionId));

  const webToken = JWT.sign(sessionId, secretKey);
  loggedInUsers.push({
    sessionId,
    userUid,
    timeLimit: timeLimit * millisecondsPerMinute,
    lastAccessed: new Date(),
  });

  return webToken;
}

function getUserUid(webToken) {
  removeExpiredTokens();
  try {
    const sessionId = JWT.verify(webToken, secretKey);
    const session = loggedInUsers.find((entry) => entry.sessionId === sessionId);
    if (session) {
      session.lastAccessed = new Date();
      return session.userUid;
    }
    return null;
  } catch (error) {
    return null;
  }
}

function logout(webToken) {
  removeExpiredTokens();
  try {
    const sessionId = JWT.verify(webToken, secretKey);
    const initialNumLoggedInUsers = loggedInUsers.length;
    loggedInUsers = loggedInUsers.filter((session) => session.sessionId !== sessionId);
    return loggedInUsers.length < initialNumLoggedInUsers;
  } catch (error) {
    return false;
  }
}

function removeExpiredTokens() {
  const currentTime = new Date().getTime();

  loggedInUsers = loggedInUsers.filter((session) => {
    return currentTime - session.lastAccessed.getTime() < session.timeLimit;
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
