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

const { customAlphabet } = require("nanoid");
const alphabet = "123456789QWERTYUIPASDFGHJKLZXCVBNM";
const nanoid = customAlphabet(alphabet, 6);

let tempData = {
  matchID: "001",
  liveScoreID: "ABC123",
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
  liveScoreID: String,
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
  await mongoose.connect(
    "mongodb+srv://ngocgl:N17t03n75@cluster0.26ide.mongodb.net/match?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );
  console.log("end connect");
  match = new mongoose.model("match", matchSchema);
  newMatch = new match(tempData);
  newMatch.matchID = newMatch._id;
  newMatch.matchID.toString();
  newMatch.liveScoreID = nanoid();
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
  let match = new mongoose.model("match", matchSchema);
  return await match.findOneAndUpdate(filter, update, { new: true });
}
//find a record
async function findMatch(id) {
  console.log("Start");
  await mongoose.connect(
    "mongodb+srv://ngocgl:N17t03n75@cluster0.26ide.mongodb.net/match?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );
  console.log("end connect");
  let match = new mongoose.model("match", matchSchema);
  //if length of id > 6 that mean the id is match ID else it's live score ID
  if (id.length > 6) {
    return await match.findOne({ matchID: id }, function (err, qResult) {
      if (err) {
        console.log(`error while requery db. Error#:${err}`);
        return false;
      } else {
        console.log("Match found" + qResult || "Empty");
        return qResult;
      }
    });
  } else {
    return await match.findOne({ liveScoreID: id }, function (err, qResult) {
      if (err) {
        console.log(`error while requery db. Error#:${err}`);
        return false;
      } else {
        console.log("Match found" + qResult || "Empty");
        return qResult;
      }
    });
  }
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
        liveScoreID: newMatch.liveScoreID,
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
      console.log("Emit:" + "/display/" + data.liveScoreID);
      io.emit("/display/" + data.liveScoreID, value); //emit to display client the resutl.
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

app.post("/getMatchData", function (req, res, next) {
  let matchID = req.body.matchID;
  findMatch(matchID).then(
    function (value) {
      console.log(`Point 1:${value}`);
      if (value == null || false) {
        res.json({ status: "match not found" });
      } else {
        res.json({
          status: "ok",
          data: value,
        });
      }
    },
    function (err) {
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
app.get("/display/:liveScoreID", function (req, res, next) {
  console.log("live score ID = " + req.params.liveScoreID);
  findMatch(req.params.liveScoreID).then(
    function (value) {
      console.log(`Point 1:${value}`);
      if (value == null || false) {
        res.send("<h1> Match not found </h1>");
      } else {
        res.sendFile(__dirname + "/display/basicboard.html");
        res.redirect(
          "../display/basicboard.html?" +
            "matchID=" +
            value.matchID +
            "&liveScoreID=" +
            value.liveScoreID +
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

app.get("/viewstats/:liveScoreID", function (req, res, next) {
  console.log("LiVE SCORE ID = " + req.params.liveScoreID);
  findMatch(req.params.liveScoreID).then(
    function (value) {
      console.log(`Point 1:${value}`);
      if (value == null || false) {
        res.send("<h1> Match not found </h1>");
      } else {
        res.sendFile(__dirname + "/display/matchstats.html");
        res.redirect(
          "../display/matchstats.html?" +
            "matchID=" +
            value.matchID +
            "&liveScoreID=" +
            value.liveScoreID +
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

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});
