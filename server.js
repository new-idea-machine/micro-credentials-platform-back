import mongoose from "mongoose";
import dotenv from "dotenv";
import express from "express"
import bodyParser from "body-parser"
import cors from "cors"

dotenv.config({ path: "./config.env" });

const connectionString = process.env.MONGO_URL
const database = await mongoose.connect(connectionString);
const app = express();

console.log(`Connected to ${connectionString}`);

const userSchema = mongoose.Schema({ username: String, email: String });
const userModel = database.model("users", userSchema);
const users = await userModel.find();


const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json(), urlencodedParser)
app.use(cors())


app.listen(process.env.PORT, () => {
    console.log(`App is Listening on PORT ${process.env.PORT}`)
})

app.get("/", async (req, res) => {
    const users2 = await userModel.find();
    console.log(users2)
    res.json({ message: "Success" })
})

app.post("/user", async (req, res) => {
    const user = req.body.userInfo
    //console.log(user)
    console.log(users)
    const takenUsername = await userModel.findOne({ username: user.name })
    //const takenEmail = await userModel.findOne({ email: user.email })
    if (takenEmail || takenUsername) {
        res.sendStatus(400)
    } else {
        const registrant = new userModel({
            username: user.name,
            email: user.email
        })
        registrant.save()
        res.sendStatus(200)
    }
})


app.delete("/", async (req, res) => {
    await userModel.deleteOne({ username: 'Test Learner User' }).then((user) => {
        if (!user) {
            res.status(400).send(req.params.Username + ' was not found');
        } else {
            res.status(200).send(req.params.Username + ' was deleted.');
        }
    })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
})

console.log(users);