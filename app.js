const { WSASERVICE_NOT_FOUND } = require("constants");

const bodyParser = require("body-parser");
var fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { stringify } = require("querystring");
const { on } = require("process");

const app = require("express")();
const http = require("http").Server(app);
var serveStatic = require("serve-static");
var express = require("express");
const io = require("socket.io")(http);
const PORT = process.env.PORT || 3000;

let tempData = {
  matchID: "001",
  homePlayer: "ABC",
  awayPlayer: "Ngoc",
  clb: "SMT",
  finalScore: "0-0",
  roundName: "Vòng Loại",
  tourName: "Giải SMT Open",
  date: Date(),
  result: [
    {
      stats: {},
      gameScore: {
        home: 0,
        away: 0,
      },
      pointScore: {
        home: 0,
        away: 0,
        serveSide: "home",
      },
    },
  ],
};
const matchSchema = new mongoose.Schema({
  matchID: mongoose.ObjectId,
  clb: String,
  homePlayer: String,
  awayPlayer: String,
  finalScore: String,
  date: Date,
  result: [
    {
      stats: Object,
      gameScore: Object,
      pointScore: Object,
    },
  ],
  roundName: String,
  tourName: String,
});

var match;
var docLength;
var newMatch;

async function matchInit(data) {
  console.log("Start");
  await mongoose.connect("mongodb://localhost:27017/sbdsata");
  console.log("end connect");
  match = new mongoose.model("match", matchSchema);
  newMatch = new match(tempData);
  newMatch.matchID = newMatch._id;
  newMatch.matchID.toString();
  newMatch.awayPlayer = data.awayPlayer;
  newMatch.homePlayer = data.homePlayer;
  newMatch.roundName = data.roundName;
  newMatch.tourName = data.tourName;
  newMatch.save();
  console.log(newMatch);
}

async function updateMatch(data) {
  //newMatch.result = data.result;
  //newMatch.homePlayer = data.homePlayer;
  //newMatch.awayPlayer = data.awayPlayer;
  console.log("SENT FROM CONTROLBOARD:" + JSON.stringify(data));

  const filter = { matchID: data.matchID };
  const update = { result: data.result };

  // `doc` is the document _AFTER_ `update` was applied
  return await match.findOneAndUpdate(filter, update, { new: true });
}

//find a record
async function findMatch(id) {
  console.log("Start");
  await mongoose.connect("mongodb://localhost:27017/sbdsata");
  console.log("end connect");
  let match = new mongoose.model("match", matchSchema);
  return await match.findOne({ matchID: id }, function (err, qResult) {
    if (err) {
      console.log(`error while requery db. Error#:${err}`);
      return false;
    } else {
      console.log("Match found" + qResult || "Empty");
      return qResult;
    }
  });
}

//mongoose.find((err,docs)=>{
//    if (!err){
//        console.log(docs);
//    } else{
//        console.log(err);
//    }
//});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/control", express.static("control"));
app.use("/display", express.static("display"));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

http.listen(PORT, function () {
  console.log("http server is starting on port:" + PORT);
});

app.get("/", function (rep, res) {
  res.sendFile(__dirname + "/index.html");
});
app.get("/controlBoard/:id", function (rep, res) {
  res.sendFile(__dirname + "/control.html");
});
app.post("/match", function (req, res, next) {
  console.log(req.body);
  updateMatch(req.body);
  res.json({ state: true });
});

app.post("/newMatch", function (req, res, next) {
  console.log(req.body);
  let data = req.body;
  matchInit(data).then(
    function (value) {
      res.json({
        status: "ok",
        matchID: newMatch.matchID,
      });
    },
    function (error) {
      res.json({ status: "error" });
    }
  );
});

app.get("/data.js", function (req, res, next) {
  res.send(`window.SERVER_DATA={"PORT":${PORT}}`);
});

app.post("/updatePoint", function (req, res, next) {
  let data = req.body;
  updateMatch(data).then(
    function (value) {
      console.log("Emit:" + "/display/" + data.matchID);
      io.emit("/display/" + data.matchID, value); //emit to display client the resutl.
      res.json({
        status: "ok",
        updated: value,
      });
    },
    function (error) {
      res.json({ status: "error" });
    }
  );
});

app.get("/match", function (req, res, next) {
  console.log(req.body);
  console.log(newMatch.matchID);
  res.json(newMatch.matchID);
});

//------------SOCKET.IO -----------
app.get("/display/:matchID", function (req, res, next) {
  console.log("Match ID = " + req.params.matchID);
  findMatch(req.params.matchID).then(
    function (value) {
      console.log(`Point 1:${value}`);
      if (value == null || false) {
        res.send("<h1> Match not found </h1>");
      } else {
        res.sendFile(__dirname + "/display/basicboard.html");
        res.redirect(
          "../display/basicboard.html?" +
            "matchID=" +
            req.params.matchID +
            "&tourName=" +
            value.tourName +
            "&matchName=" +
            value.roundName +
            "&homePlayer=" +
            value.homePlayer +
            "&awayPlayer=" +
            value.awayPlayer +
            "&homeGameScore=" +
            value.result[0].gameScore.home +
            "&awayGameScore=" +
            value.result[0].gameScore.away +
            "&homePointScore=" +
            value.result[0].pointScore.home +
            "&awayPointScore=" +
            value.result[0].pointScore.away +
            "&serveSide=" +
            value.result[0].pointScore.serveSide
        );
      }
    },
    function (err) {
      console.log("can't find match. Error:" + err);
    }
  );
});

app.get("/viewstats/:matchID", function (req, res, next) {
  console.log("Match ID = " + req.params.matchID);
  findMatch(req.params.matchID).then(
    function (value) {
      console.log(`Point 1:${value}`);
      if (value == null || false) {
        res.send("<h1> Match not found </h1>");
      } else {
        res.sendFile(__dirname + "/display/matchstats.html");
        res.redirect(
          "../display/matchstats.html?" + "matchID=" + req.params.matchID
        );
      }
    },
    function (err) {
      console.log("can't find match. Error:" + err);
    }
  );
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});
