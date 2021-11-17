const { spawn } = require('child_process');
const express = require("express");
const os = require("os");
const bodyParser = require("body-parser");

const app = express();
let GameState = require("./GameState");

console.log("starting");
app.use(express.static("dist"));
app.use(bodyParser.json());


//create a default game
let Game = new GameState.GameState();
const child = spawn('lc0',{shell:true});
child.stdin.setEncoding = 'utf-8';
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stdout);

child.stdin.cork();
child.stdin.write("isready\n");
child.stdin.uncork();

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
    let pieceID = req.params
    console.log(pieceID)
    res.send(Game.getPieceInformation(pieceID))
  }
);


//expect a JSON object of the type: {pieceID,a,b,c}
app.post("/api/movePiece", (req, res) =>
  {
    let move = req.body
    res.send(Game.movePiece(move.pieceID, move))
  }
);

app.get("/api/lc0/getBestMove", (req,res) =>
    {

    }
);

app.listen(8085, "0.0.0.0", () => console.log("Listening on port 8085!"));


