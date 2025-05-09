const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extends: true }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// connecting with the database
mongoose
  .connect("Add Yours!!")
  .then(() => {
    console.log("connected to database !!");
  })
  .catch((error) => {
    console.log("Issue: ", error);
  });

// creating the  User Schema

const userSchema = mongoose.Schema({
  username: String,
});

// Creating the Exercise Schema
const exerciseSchema = mongoose.Schema({
  userId: String,
  username: String,
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: String,
});

// User Model
const User = mongoose.model("User", userSchema);
// Exercise model
const Exercise = mongoose.model("Exercise", exerciseSchema);

// post request for creating new user
app.post("/api/users", async (req, resp) => {
  const username = req.body.username;
  // creating the instance for new user
  let new_user = new User({ username: username });
  // saving the new user
  new_user = await new_user.save();
  resp.json({ username: new_user.username, _id: new_user._id });
});

// getting all the users
app.get("/api/users", async (req, resp) => {
  const data = await User.find();
  resp.json(data);
});

// creating the exercise for user id : _id 
app.post("/api/users/:_id/exercises", async (req, resp) => {
  const id = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  let date = req.body.date;
  if (!date) {
    date = new Date().toISOString().substring(0, 10);
  }
  // find user 
  let new_user = await User.findById(id);
  //  instance of exercise user : userId
  let new_exercise = new Exercise({
    username: new_user.username,
    description: description,
    duration: Number(duration),
    date: date,
    userId: new_user.id,
  });
  // insert 
  new_exercise = await new_exercise.save();
  resp.json({
    username: new_user.username,
    description: new_exercise.description,
    duration: new_exercise.duration,
    date: new Date(new_exercise.date).toDateString(),
    _id: new_user._id,
  });
});
// get the list of exercise by user id, between from & to date and limit the entries
app.get("/api/users/:_id/logs", async (req, resp) => {
  let id = req.params._id;
  let from = req.query.from || new Date(0).toISOString().substring(0, 10);
  let to = req.query.to || new Date(Date.now()).toISOString().substring(0, 10);
  // console.log(req.query.limit);
  let new_user = await User.findById(id);
  console.log(new_user);
  let limit = Number(req.query.limit) || 0;
  let exercise = await Exercise.find({
    userId: id,
    date: { $gte: from, $lte: to },
  })
    .select("description duration date")
    .limit(limit);

  let parseLog = exercise.map((item) => {
    return {
      description: item.description,
      duration: item.duration,
      date: new Date(item.date).toDateString(),
    };
  });
  // return only number exercise for user : userId 
  resp.json({
    _id: new_user._id,
    username: new_user.username,
    count: parseLog.length,
    log: parseLog,
  });
});

const listener = app.listen(process.env.PORT);
