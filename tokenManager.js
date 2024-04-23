require("dotenv").config();
const secretKey = process.env.SECRET_KEY;
import { JWT } from "jsonwebtoken";
let tokenUserCorr = [];

function generateToken(userUid) {
  const payload = { userUid };
  const currentDate = new Date().toISOString();
  const charString = "ABCDEFGHIJKLMNOPQRSTUVWXYZzyxwvutsrqponmlkjihgfedcba1234567890";
  const tokenLength = 40;
  let token = "";

  token = JWT.sign(payload, secretKey, { expiresIn: "1h" });

  for (let i = 0; i < currentDate.length; i++) {
    token += charString.charAt(currentDate.charCodeAt(i) % charString.length);
  }

  for (let i = 0; i < tokenLength - currentDate.length; i++) {
    token += charString.charAt(Math.floor(Math.random() * charString.length));
  }

  tokenUserCorr.push({ token, userUid });
  return token;
}

function getUserUid(token) {
  const entry = tokenUserCorr.find((entry) => entry.token === token);
  return entry ? entry.userUid : null;
}

function logout(token) {
  const initialLength = tokenUserCorr.length;
  tokenUserCorr = tokenUserCorr.filter((entry) => entry.token !== token);
  if (tokenUserCorr.length < initialLength) {
    return "Logout successful";
  } else {
    return "Logout failed: Token not found";
  }
}

export default { generateToken, getUserUid, logout };
