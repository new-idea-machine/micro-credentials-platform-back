require("dotenv").config();
const secretKey = process.env.SECRET_KEY;
import JWT from "jsonwebtoken";
let loggedInUsers = [];

function generateToken(userUid) {
  const charString = "ABCDEFGHIJKLMNOPQRSTUVWXYZzyxwvutsrqponmlkjihgfedcba1234567890+/";
  const tokenLength = 40;
  let token = "";


  do {
    token = "";
    for (let i = 0; i < tokenLength; i++) {
      token += charString.charAt(Math.floor(Math.random() * charString.length));
    }
  } while (loggedInUsers.some((entry) => {
    const decoded = JWT.verify(entry.token, secretKey);
    return decoded.token === token;
  }));

  const jwtPayload = { token };
  const signedToken = JWT.sign(jwtPayload, secretKey, { expiresIn: "1h" });
  loggedInUsers.push({ token: signedToken, userUid });

  return signedToken;
}


function getUserUid(signedToken) {
  try {
    const decodedToken = JWT.verify(signedToken, secretKey);
    const entry = loggedInUsers.find((entry) => entry.token === signedToken);
    return entry ? entry.userUid : null;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}


function logout(signedToken) {
  const initialLength = loggedInUsers.length;
  loggedInUsers = loggedInUsers.filter((entry) => entry.token !== signedToken);
  return loggedInUsers.length < initialLength;
}

function removeExpiredTokens() {
  loggedInUsers = loggedInUsers.filter((entry) => {
    try {
      JWT.verify(entry.token, secretKey);
      return true;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return false;
      }
      console.error("Token verification failed:", error);
      return true;
    }
  });

}
setInterval(removeExpiredTokens, 300000);

export default { generateToken, getUserUid, logout, removeExpiredTokens };
