//define Global variables:
const url = "https://onetennis.herokuapp.com";
const pointConvert = {
  0: "0",
  1: "15",
  2: "30",
  3: "40",
  4: "Adv",
};

function updateHTMLState() {}

function Match(matchID, homePlayer, awayPlayer, clb, date) {
  this.HTMLElementState = {
    serveSide: "home",
    serveType: "1st",
    decidingPoint: false,
  };
  this.homeColor = "rgba(54,162,235,1)";
  this.awayColor = "yellow";
  //Data structure for a match
  this.data = {
    matchID: matchID || "5ff4993dd7caee067caa766b", //defaul
    result: [],
    homePlayer: homePlayer,
    awayPlayer: awayPlayer,
    clb: "SMT",
    date: "01/02/2021",
    matchName: "Vòng Loại",
    tourName: "Giải SMT Open",
  };

  this.homePlayer = homePlayer;
  this.awayPlayer = awayPlayer;
  let currentSet = new Set();
  this.addSet = function () {
    this.data.result.push(currentSet);
    currentSet = new Set();
  };
  let notWho = function (who) {
    if (who == "home") {
      return "away";
    } else return "home";
  };
  let recordPoint = function (who, obj) {
    //this.currentSet.pointScore[who]++;
    switch (currentSet.pointScore[who]) {
      case 0: //in case of "0","15","30" then increase point for winner
      case 1:
      case 2:
        currentSet.pointScore[who]++;
        document.querySelector("#" + who + "Point").innerHTML =
          pointConvert[currentSet.pointScore[who]];
        break;
      case 3: //incase of who = "40" check if !who
        if (currentSet.pointScore[notWho(who)] == 4) {
          //if notWHo == "Adv"{
          currentSet.pointScore[notWho(who)] = 3; //notWho = "40"
          document.querySelector("#" + notWho(who) + "Point").innerHTML =
            pointConvert[currentSet.pointScore[notWho(who)]];
          break;
        }
        if (currentSet.pointScore[notWho(who)] != 3) {
          //if notWho !="40"
          currentSet.gameScore[who]++;
          document.querySelector("#" + who + "Game").innerHTML =
            currentSet.gameScore[who];
          newGame(obj);
          break;
        } else {
          if (obj.HTMLElementState.decidingPoint == true) {
            currentSet.gameScore[who]++;
            newGame(obj);
          } else currentSet.pointScore[who]++;
          document.querySelector("#" + who + "Point").innerHTML = "Adv";
          break;
        }
      case 4:
        currentSet.gameScore[who]++;
        newGame(obj);
        break;
    }
    //console.log(pointConvert[this.currentSet.pointScore[who]]);
  };

  this.addPoint = function (who, pointType) {
    //who [home,away]
    currentSet.stats.totalPoint++;
    currentSet.stats[who].totalPointWon++;
    currentSet.stats[who][pointType]++;
    if (currentSet.pointScore.serveSide == who) {
      if (document.getElementById("1st2ndServe").checked == false) {
        currentSet.stats[who].totalFirstServe++;
        currentSet.stats[who].firstServeWin++;
      } else {
        currentSet.stats[who].totalSecondServe++;
        currentSet.stats[who].secondServeWin++;
      }
    } else {
      if (document.getElementById("1st2ndServe").checked == false) {
        currentSet.stats[notWho(who)].totalFirstServe++;
      } else {
        currentSet.stats[notWho(who)].totalSecondServe++;
      }
    }

    currentSet.stats[who].totalFirstServeIn =
      currentSet.stats[who].totalFirstServe -
      currentSet.stats[who].totalSecondServe;

    recordPoint(who, this);
    //update to server
    this.updatePoint2Server();
    document.getElementById("1st2ndServe").checked = false;
    this.HTMLElementState.serveType = "1st";
  };

  this.addLostPoint = function (who, pointType) {
    //who [home,away]
    currentSet.stats.totalPoint++;
    currentSet.stats[who][pointType]++;
    currentSet.stats[notWho(who)].totalPointWon++;

    if (currentSet.pointScore.serveSide == who) {
      if (document.getElementById("1st2ndServe").checked == false) {
        currentSet.stats[who].totalFirstServe++;
      } else {
        currentSet.stats[who].totalSecondServe++;
      }
    } else {
      if (document.getElementById("1st2ndServe").checked == false) {
        currentSet.stats[notWho(who)].totalFirstServe++;
        currentSet.stats[notWho(who)].firstServeWin++;
      } else {
        currentSet.stats[notWho(who)].totalSecondServe++;
        currentSet.stats[notWho(who)].secondServeWin++;
      }
    }

    recordPoint(notWho(who), this);
    //update to server
    this.updatePoint2Server();

    document.getElementById("1st2ndServe").checked = false;
    this.HTMLElementState.serveType = "1st";
  };
  let newGame = function (obj) {
    currentSet.pointScore.home = 0;
    currentSet.pointScore.away = 0;
    document.querySelector("#homeGame").innerHTML = currentSet.gameScore.home;
    document.querySelector("#awayGame").innerHTML = currentSet.gameScore.away;
    document.querySelector("#awayPoint").innerHTML = "0";
    document.querySelector("#homePoint").innerHTML = "0";
    document.getElementById("1st2ndServe").checked = false;
    changeServeType(obj);
    document.getElementById("decisionPoint").checked = false;
    //switch Home/Away Serve Side
    if (obj.HTMLElementState.serveSide == "home") {
      document.getElementById("homeAwaySwitch").checked = true; //Switch to Away
      processHomeAwaySwitch(obj, "away");
      obj.HTMLElementState.serveSide = "away";
      currentSet.pointScore.serveSide = "away";
    } else {
      document.getElementById("homeAwaySwitch").checked = false; //Switch to Home
      processHomeAwaySwitch(obj, "home");
      obj.HTMLElementState.serveSide = "home";
      currentSet.pointScore.serveSide = "home";
    }
    obj.updatePoint2Server();
  };

  this.updateScore = function () {
    for (let i = 0; i < this.result.length; i++) {
      console.log("Game", this.result[i].gameScore);
      console.log("Point", this.result[i].pointScore);
    }
    //print out current Set
    console.log("Game", currentSet.gameScore);
    console.log("Point", currentSet.pointScore);
  };

  this.changeName = function (arg) {
    if (arg.length == 2) {
      this.homePlayer = arg[0];
      this.awayPlayer = arg[1];
    } else {
      if (arg.length == 1) {
        this.homePlayer = arg[0];
      }
    }
  };

  this.inputPoint = function (id) {
    console.log(id);
    switch (id) {
      case "homeAwaySwitch":
        processHomeAwaySwitch(this);
        break;
      case "1st2ndServe":
        changeServeType(this);
        break;
      case "decisionPoint":
        decidingPoint(this);
        break;
      case "homeWinPoint":
        this.addPoint("home", "freePoint");
        break;
      case "homeLostPoint":
        revertPoint("home", this);
        break;
      case "awayWinPoint":
        this.addPoint("away", "freePoint");
        break;
      case "awayLostPoint":
        revertPoint("away", this);
        break;
      case "resetPoint":
        resetPoint(this);
        break;
      case "homeWinAce":
        this.addPoint("home", "ACE");
        break;
      case "homeWinWinner":
        this.addPoint("home", "winner");
        break;
      case "homeNetWin":
        this.addPoint("home", "netWin");
        break;
      case "homeDF":
        this.addLostPoint("home", "DF");
        break;
      case "homeUFE":
        this.addLostPoint("home", "UFE");
        break;
      case "homeNetLost":
        this.addLostPoint("home", "netLost");
        break;

      case "awayWinAce":
        this.addPoint("away", "ACE");
        break;
      case "awayWinWinner":
        this.addPoint("away", "winner");
        break;
      case "awayNetWin":
        this.addPoint("away", "netWin");
        break;
      case "awayDF":
        this.addLostPoint("away", "DF");
        break;
      case "awayUFE":
        this.addLostPoint("away", "UFE");
        break;
      case "awayNetLost":
        this.addLostPoint("away", "netLost");
        break;

      case "homeWinGame":
        currentSet.gameScore["home"]++;
        newGame(this);
        break;
      case "homeLostGame":
        currentSet.gameScore["home"]--;
        newGame(this);
        break;
      case "awayWinGame":
        currentSet.gameScore["away"]++;
        newGame(this);
        break;
      case "awayLostGame":
        currentSet.gameScore["away"]--;
        newGame(this);
        break;
    }
  };

  //-----Start define function inside Match Object

  this.newMatch = async function () {
    //newMatch() create new match with {clb, players, date) and send to server
    //Server will return .status = "ok" and .matchID if no error; server returns .status ="error" if error happended.
    let xmlhttp = new XMLHttpRequest(); // new HttpRequest instance
    xmlhttp.open("POST", url + "/newMatch");
    xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlhttp.send(JSON.stringify(this.data));
    let res = null;
    let parrent = this;
    xmlhttp.onreadystatechange = function (id) {
      if (this.readyState == 4 && this.status == 200) {
        res = JSON.parse(this.responseText);
        console.log(res);
        if (res.status == "ok") {
          parrent.data.matchID = res.matchID;
        } else return false;
      } else return false;
    };
  };

  this.updatePoint2Server = async function () {
    //updatePoint2Server() will update current point to server.
    //return .status = "ok" if no error; return .status ="error" if error happended
    let i = this.data.result.length;
    if (i == 0) {
      this.data.result[this.data.result.length] = currentSet;
    } else {
      this.data.result[this.data.result.length - 1] = currentSet;
    }
    let xmlhttp = new XMLHttpRequest(); // new HttpRequest instance
    xmlhttp.open("POST", url + "/updatePoint");
    xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlhttp.send(JSON.stringify(this.data));
    let res = null;
    xmlhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        res = JSON.parse(this.responseText);
        if (res.status == "ok") {
          return true;
        }
        return false;
      }
    };
  };
  this.closeMatch = async function () {
    //closeMatch will take nessesary actions to close the match
  };
  this.getCLB = async function () {
    //getCLB() will get all clubs in database
    //return a arrray of clbName * clbID
  };
  let revertPoint = function (who, obj) {
    if (currentSet.pointScore[who] > 0) {
      currentSet.stats.totalPoint--;
      currentSet.pointScore[who]--;
      //currentSet.stats[who][pointType]++;
      document.querySelector("#" + who + "Point").innerHTML =
        pointConvert[currentSet.pointScore[who]];
      obj.updatePoint2Server();
      document.getElementById("1st2ndServe").checked = false;
      obj.HTMLElementState.serveType = "1st";
    }
  };
  let resetPoint = function (obj) {
    currentSet.pointScore.home = 0;
    currentSet.pointScore.away = 0;
    console.log(obj);
    newGame(obj);
  };
  let decidingPoint = function (obj) {
    var checkBox = document.getElementById("decisionPoint");
    if (checkBox.checked == true) {
      obj.HTMLElementState.decidingPoint = true;
    } else {
      obj.HTMLElementState.decidingPoint = false;
    }
    console.log(obj.HTMLElementState);
  };

  let changeServeType = function (obj) {
    var checkBox = document.getElementById("1st2ndServe");
    if (checkBox.checked == true) {
      console.log("2nd Serve");
      obj.HTMLElementState.serveType = "2nd";
      if (obj.HTMLElementState.serveSide == "home") {
        //currentSet.stats.home.totalSecondServe++;
        document.getElementById("homeDF").disabled = false;
      } else {
        //currentSet.stats.away.totalSecondServe++;
        document.getElementById("awayDF").disabled = false;
      }
    } else {
      console.log("1st Serve");
      obj.HTMLElementState.serveType = "1st";
      if (obj.HTMLElementState.serveSide == "home") {
        document.getElementById("homeDF").disabled = true;
      } else {
        document.getElementById("awayDF").disabled = true;
      }
    }

    obj.updatePoint2Server();
  };
  let processHomeAwaySwitch = function (obj, arg) {
    var checkBox = document.getElementById("homeAwaySwitch");
    if (checkBox.checked == true || arg == "away") {
      console.log("Away");
      obj.HTMLElementState.serveSide = "away";
      currentSet.pointScore.serveSide = "away";
      document.querySelector("#homeServe").style.opacity = 0;
      document.querySelector("#awayServe").style.opacity = 100;
      document.querySelector("#homeWinAce").disabled = true;
      document.querySelector("#homeDF").disabled = true;
      document.querySelector("#awayDF").disabled = true;
      document.querySelector("#awayWinAce").disabled = false;
    }
    if (checkBox.checked == false || arg == "home") {
      console.log("home");
      obj.HTMLElementState.serveSide = "home";
      currentSet.pointScore.serveSide = "home";
      document.querySelector("#homeServe").style.opacity = 100;
      document.querySelector("#awayServe").style.opacity = 0;
      document.querySelector("#awayWinAce").disabled = true;
      document.querySelector("#awayDF").disabled = true;
      document.querySelector("#homeDF").disabled = true;
      document.querySelector("#homeWinAce").disabled = false;
    }
    obj.updatePoint2Server();
  };
}

function Set() {
  this.stats = {
    totalPoint: 0,
    home: {
      totalPointWon: 0,
      freePoint: 0,
      totalFirstServe: 0,
      totalSecondServe: 0,
      secondServeWin: 0,
      firstServeWin: 0,
      totalFirstServeIn: 0,
      ACE: 0,
      DF: 0,
      winner: 0,
      UFE: 0,
      netWin: 0,
      netLost: 0,
    },
    away: {
      totalPointWon: 0,
      freePoint: 0,
      totalFirstServe: 0,
      totalSecondServe: 0,
      secondServeWin: 0,
      firstServeWin: 0,
      totalFirstServeIn: 0,
      ACE: 0,
      DF: 0,
      winner: 0,
      UFE: 0,
      netWin: 0,
      netLost: 0,
    },
  };
  this.gameScore = {
    home: 0,
    away: 0,
  };
  this.pointScore = {
    home: 0,
    away: 0,
    serveSide: "home", //or "away"
  };

  //function in Set Object
}

function getMatchID() {
  //read matchID
  const queryString = window.location.search;
  console.log(queryString);
  const urlParams = new URLSearchParams(queryString);
  const matchID = urlParams.get("id");
  console.log("MatchID:" + matchID);
  return matchID;
}

//-----------BEGIN----------

var M1 = new Match(getMatchID(), "A", "B", "SMT");

console.log("Khoi tao:" + M1);
//Bridge from HTML to JS
function sendToGateway(id) {
  M1.inputPoint(id);
}
