const { spawn } = require('child_process');
const express = require("express");
const os = require("os");
const bodyParser = require("body-parser");

const app = express();
let GameState = require("./GameState");
let lc0 = require("./lc0");
const path = require ( 'path' );
const { dirname } = require("path");

console.log("starting");
app.use(express.static("dist"));
app.use(bodyParser.json());


//create a default game
let Game = new GameState.GameState();
var Engine = new lc0.lc0()
Engine.initializeGame();

let moveList = " moves";
let depth = 5;

app.use(express.static("dist"));


//returns username in the form { username:<username>}
app.get("/api/users/getUsername", (req, res) =>
  res.send({ username: os.userInfo().username })
);

//returns the current state of the board
app.get("/api/engine/getBoard", (req, res) =>
    res.send({ board: Game.getBoard() })
);

/**
 * expects a pieceID
 * returns piece possible moves in the form
 *  [{ a,b,c}, ... ]
**/
app.get("/api/engine/getPieceInformation", (req, res) =>
  {
    let pieceID = req.params;
    console.log(pieceID);
    res.send(Game.getPieceInformation(pieceID));
  }
);

app.post("/api/startEngine",(req,res) =>
    { 
        Engine.initializeGame();
        var movePromise = Engine.movePiece();
        movePromise.then(value => {
          console.log("/api/StartEngine");
          console.log(`next move is ${value.opponentMove}`);
          res.send(value);
        });
      }
);

//expect a JSON object of the type: {pieceID,a,b,c}
app.post("/api/movePiece", (req, res) =>
  {
    let move = req.body;
    moveList += " " + move.textMove;
    res.send(Game.movePiece(move.pieceID, move));
  }
);

app.post("/api/engineMovePiece",(req,res) =>
    { 
      console.log(moveList);
      var movePromise = Engine.movePiece("asd",moveList);
      movePromise.then(value => {
        console.log("/api/StartEngine");
        console.log(`next move is ${value.opponentMove}`);
        res.send(value);
      });
    }
);


app.listen(8085, "0.0.0.0", () => console.log("Listening on port 8085!"));
