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
    const entry = loggedInUsers.find(
      (entry) => entry.token === decodedToken.token
    );
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
    loggedInUsers = loggedInUsers.filter(
      (entry) => entry.token !== decodedToken.token
    );
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

function authenticationMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    const authHeaderFormat = /^(?<scheme>\S+) +(?<parameters>\S+)$/;
    const authorization = authHeaderFormat.exec(authHeader)?.groups;

    if (authorization?.scheme === "Basic") {
      const basicAuthCredentialsFormat = /^(?<userId>[^:]*):(?<password>.*)$/;
      const credentialsText = Buffer.from(authorization.parameters, "base64").toString();
      const credentials = basicAuthCredentialsFormat.exec(credentialsText)?.groups;

      if (credentials) {
        req.userId = credentials.userId;
        req.password = credentials.password;
      }
    } else if (authorization?.scheme === "Bearer") {
      const bearerToken = authorization.parameters;
      try {
        const decodedToken = JWT.verify(bearerToken, secretKey);
        const entry = loggedInUsers.find((entry) => entry.token === decodedToken.token);
        if (entry) {
          entry.lastAccessed = new Date();
          req.userUid = entry.userUid;
        }

      } catch (error) {

      }
    }
  }
  next();
}

export { generateToken, getUserUid, logout, authenticationMiddleware };
