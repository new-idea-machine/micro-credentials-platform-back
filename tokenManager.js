import "dotenv/config";
import JWT from "jsonwebtoken";
const secretKey = process.env.SECRET_KEY;
let loggedInUsers = [];

function generateToken(userUid) {
  removeExpiredTokens();
  const charString =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZzyxwvutsrqponmlkjihgfedcba1234567890+/";
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
    console.error("Token verification failed:", error);
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
    console.error("Token verification failed during logout:", error);
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
      console.error("Token verification failed:", error);
      return true;
    }
  });
}

function tokenMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    let token = null;
    if (/^Bearer +(?<token>\S+)$/.exec(authHeader)?.groups?.token) {
      token = /^Bearer +(?<token>\S+)$/.exec(authHeader).groups.token;
    } else if (/^Basic +(?<token>\S+)$/.exec(authHeader)?.groups?.token) {
      token = /^Basic +(?<token>\S+)$/.exec(authHeader).groups.token;
    }

    if (token) {
      try {
        const decodedToken = JWT.verify(token, secretKey);
        const entry = loggedInUsers.find(
          (entry) => entry.token === decodedToken.token
        );
        if (entry) {
          entry.lastAccessed = new Date();
          req.userUid = entry.userUid;
        } else {
          req.userUid = null;
        }
      } catch (error) {
        console.error("Token verification failed:", error);
        req.userUid = null;
      }
    } else {
      req.userUid = null;
    }
  } else {
    req.userUid = null;
  }
  next();
}

export { generateToken, getUserUid, logout, tokenMiddleware };
