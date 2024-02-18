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

const learnerSchema = new mongoose.Schema({});
const instructorSchema = new mongoose.Schema({});

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    learnerData: mongoose.Schema({ data: { type: learnerSchema } }),
    instructorData: mongoose.Schema({ data: { type: instructorSchema } })
});


const userModel = database.model("users", userSchema);
const learnerModel = database.model("learner", learnerSchema);
const instructorModel = database.model("instructor", instructorSchema);

const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json(), urlencodedParser);
app.use(cors());

app.listen(process.env.PORT, () => {
    console.log(`App is Listening on PORT ${process.env.PORT}`)
});

app.get("/", async (req, res) => {
    try
    {
        const users = await userModel.find();
        console.log(users)
        res.json({ message: "Success" })
    }
    catch (error)
    {
        res.status(503).json({ msg: 'Cant reach server' })
    }
});

app.post("/user", async (req, res) => {
    try
    {
        const user = req.body
        const validEmail = validator.isEmail(user.userInfo.email)
        const takenEmail = await userModel.findOne({ email: user.userInfo.email })
        if (takenEmail)
        {
            res.status(403).json({ msg: 'User already exists (try logging in instead)' })
        } else if (!validEmail)
        {
            res.status(406).json({ msg: 'Invalid e-mail address' })
        } else if (!user.password)
        {
            res.status(406).json({ msg: 'Invalid password' })
        }
        else
        {
            const registrant = new userModel({
                username: user.userInfo.name,
                email: user.userInfo.email,
                password: user.password,
                learnerData: new learnerModel({}),
                instructorData: (user.isInstructor ? new instructorModel({}) : null)
            })
            const newDocument = await registrant.save()
            res.status(201).json({ userUID: newDocument._id })
        }
    }
    catch (error)
    {
        res.status(503).json({ msg: 'Cant reach server' })
    }
});

//Currently empties database, will change to only delete one user when done
app.delete("/", async (req, res) => {
    await userModel.deleteMany({}).then((user) => {
        if (!user)
        {
            res.status(400).send(req.params.Username + ' was not found');
        } else
        {
            res.status(200).send(req.params.Username + ' was deleted.');
        }
    })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});
