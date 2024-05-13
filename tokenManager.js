require("dotenv").config();
const secretKey = process.env.SECRET_KEY;
import { JWT } from "jsonwebtoken";
let loggedInUsers = [];

function generateToken(userUid) {
  const payload = { userUid };
  const charString = "ABCDEFGHIJKLMNOPQRSTUVWXYZzyxwvutsrqponmlkjihgfedcba1234567890";
  const tokenLength = 40;
  let token = "";

  do {
    token = "";
    for (let i = 0; i < tokenLength; i++) {
      token += charString.charAt(Math.floor(Math.random() * charString.length));
    }
  } while (loggedInUsers.some((entry) => entry.token === token));

  const jwtPayload = { userUid, token };
  const signedToken = JWT.sign(jwtPayload, secretKey, { expiresIn: "1h" });
  loggedInUsers.push({ token: signedToken, userUid });

  return token;
}

function getUserUid(token) {
  const entry = loggedInUsers.find((entry) => entry.token === token);
  return entry ? entry.userUid : null;
}

function logout(token) {
  const initialLength = loggedInUsers.length;
  loggedInUsers = loggedInUsers.filter((entry) => entry.token !== token);
  return loggedInUsers.length < initialLength;
}

export default { generateToken, getUserUid, logout };
