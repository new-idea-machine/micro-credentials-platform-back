import express from "express";
import { getAll, get, create, removeOne, update, getAuth, resetPasswordReceiver } from "./controller.js";



const router = express.Router();

router.get("/", getAll);

router.get("/user", get);

router.get("/auth", getAuth);

router.post("/auth", create);

router.patch("/user/:id", update);

//Currently empties database, will change to only delete one user when done
router.delete("/", removeOne);

router.get('/reset-password/:token', resetPasswordReceiver);

// Route to update the password
router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;
  // Find the user with the given token and update their password
  console.log(req.body)
  // const user = users.find(user => user.resetToken === token);
  // if (user) {
  //   user.password = password;
  //   delete user.resetToken; // Remove the reset token after the password is updated
  res.status(200).send('Password updated successfully');
  // } else {
  //   res.status(404).send('Invalid or expired token');
  //}
})

export default router;
