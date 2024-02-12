import mongoose from "mongoose";
import dotenv from "dotenv";
import express from "express"
import bodyParser from "body-parser"
import cors from "cors"
import validator from 'validator';
dotenv.config()
const connectionString = process.env.MONGO_URL
const database = await mongoose.connect(connectionString);
const app = express();

console.log(`Connected to ${connectionString}`);

const userSchema = mongoose.Schema({ 
    username: String, 
    email: String, 
    password: String, 
    isInstructor: { type: Boolean, default: false } });
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
    const user = req.body
    const validEmail = validator.isEmail(user.userInfo.email)
    const takenEmail = await userModel.findOne({ email: user.userInfo.email })
    if (takenEmail) {
        res.status(403).json({msg:'test'})
    } else if (!validEmail) {
        res.status(406).json({msg:'test'})
    } else if (!user.password) {
        res.status(406).json({msg:'test'})
    }
    else {
        const registrant = new userModel({
            username: user.userInfo.name,
            email: user.userInfo.email,
            password: user.password,
            isInstructor: user.isInstructor
        })
        const newDocument = await registrant.save()
        res.status(201).json({ userUID: newDocument._id })
    }
})


app.delete("/", async (req, res) => {
    await userModel.deleteMany({}).then((user) => {
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