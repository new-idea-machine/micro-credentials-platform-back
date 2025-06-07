/**
 * Authentication token management module.
 *
 * This module provides functionality for generating, validating, and managing authentication
 * tokens using [JSON Web Tokens (JWT's)]{@link https://jwt.io/}.  It manages user sessions
 * and provides authentication middleware for Express.js applications.
 *
 * This module depends on the [jsonwebtoken]{@link https://www.npmjs.com/package/jsonwebtoken}
 * package for creating & verifying JWT's.
 *
 * @example
 * import { generateToken } from "./tokenManager";
 *
 * // Login endpoint handler verifies a user's credentials and needs a JWT for future HTTP
 * // requests.
 * const userUid = await findUser(req.userId, req.password);
 * if (userUid) {
 *   const token = generateToken(userUid);
 *   console.log(`User ${req.userId} logged in successfully -- access token is ${token}`);)
 *   // Login endpoint handler sends response that includes the JWT.
 * }
 *
 * @example
 * import { generateToken, getUserUid } from "./tokenManager";
 *
 * // User has forgotten their password and needs a temporary JWT for password recovery.
 * const userUid = await findUser(req.userId);
 * if (userUid) {
 *   const token = generateToken(userUid, 15);  // 15 minute time limit
 *   // Token is sent to the user via email or SMS for password recovery.
 * }
 *
 * // Password recovery endpoint handler verifies the JWT and sets a new password.
 * const userUid = getUserUid(req.params.token);
 * if (userUid) {
 *   await changeUserPassword(userUid, req.password);
 *   console.log(`Changed password for user ${userUid}.`);
 * }
 *
 * @example
 * import { getUserUid, logout } from "./tokenManager";
 *
 * // Logout endpoint handler logs the user out.
 * const userUid = getUserUid(req.cookies.token);
 * if (logout(req.cookies.token) {
 *   console.log(`User ${userUid} logged out successfully.`);
 * }
 *
 * @module tokenManager
 * @requires dotenv
 * @requires jsonwebtoken
 */

import "dotenv/config";
import JWT from "jsonwebtoken";

/**
 * Secret key used for signing and verifying JWT tokens (retrieved from environment variables).
 *
 * @constant {string}
 * @private
 */
const secretKey = process.env.SECRET_KEY;

if (!secretKey) {
  throw new Error("SECRET_KEY is not defined in the environment variables.");
}

/**
 * Array of active user sessions.
 *
 * When a user logs in, their session information is added to this array.  Every time a user
 * accesses the backend, the session's `.lastAccessed` member is updated to keep the session
 * alive.  A user can be logged out by removing their session from this array, or by not accessing
 * the backend beyond the specified time limit.
 *
 * Each element is an object that represents a session and has the following members:
 * @property {string} sessionId - A unique identifier for the session
 * @property {string} userUid - The user identifier (from Mongoose) associated with this session
 * @property {number} timeLimit - The maximum idle time (in milliseconds) before the session
 *   expires
 * @property {Date} lastAccessed - Timestamp of when the user last accessed the backend
 *
 * @type {Array<{sessionId: string, userUid: string, timeLimit: number, lastAccessed: Date}>}
 * @private
 */
let loggedInUsers = [];

/**
 * Create a session for a user and generate a JSON web token for that user.
 *
 * This function creates a random session identifier, signs it using JWT, and stores it in the
 * `loggedInUsers` array along with the user's UID, the time limit, and the current time.  The
 * returned JWT token can then be passed on to the frontend for future authentication (e.g. HTTP
 * bearer authentication).
 *
 * @param {string} userUid - The user identifier to associate with the web token
 * @param {string} [timeLimit=60] - How long (in minutes) the user can be idle before being
 *   automatically logged out
 * @returns {string} A signed JSON web token
 */
function generateToken(userUid, timeLimit = 60) {
  removeExpiredTokens();

  const millisecondsPerMinute = 60000;
  const charString = "ABCDEFGHIJKLMNOPQRSTUVWXYZzyxwvutsrqponmlkjihgfedcba1234567890+/";
  const sessionIdLength = 40;
  let sessionId = "";

  /*
  This loop ensures that a unique session ID is generated (using characters randomly selected from
  charString) for each user.
  */

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

/**
 * Retrieve the user ID associated with a given JSON web token.
 *
 * This function verifies the token, updates the last accessed time if the token is valid,
 * and returns the associated user ID.
 *
 * @param {string} webToken - The JSON web token (from `generateToken()` to validate
 * @returns {string|null} The user ID if the token is valid and the session exists, `null` if
 *   otherwise
 */
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

/**
 * Log a user out.
 *
 * This function terminates the session associated with the provided token.
 *
 * @param {string} webToken - The JSON web token (from `generateToken()` for the session to
 *   terminate
 * @returns {boolean} `true` if the session was found and terminated, `false` otherwise
 */
function logout(webToken) {
  removeExpiredTokens();

  try {
    const sessionId = JWT.verify(webToken, secretKey);
    const initialNumLoggedInUsers = loggedInUsers.length;

    /*
    A session is terminated by removing it from "loggedInUsers".
    */

    loggedInUsers = loggedInUsers.filter((session) => session.sessionId !== sessionId);

    return loggedInUsers.length < initialNumLoggedInUsers;
  } catch (error) {
    return false;
  }
}

/**
 * Removes expired tokens from the active sessions list.
 *
 * This function filters out sessions that have exceeded their time limit since last access.
 *
 * @private
 */
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
 * \* For Bearer tokens, if the token was created by `generateToken()` and corresponds to a user
 * that's currently logged in then `userUid` will be set to that user -- otherwise, `userUid` will
 * be `null`.
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