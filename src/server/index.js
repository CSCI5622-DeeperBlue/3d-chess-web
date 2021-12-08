
const express = require("express");
const os = require("os");
const bodyParser = require("body-parser");
const GameState = require("./GameStatelc0");
const app = express();

app.use(express.static("dist"));
app.use(bodyParser.json());

console.log("starting index.js");
//create a default game
var Game = new GameState.GameStatelc0();

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

app.get("/api/startEngine",(req,res) =>
    {
      // assume white, TODO: update
      Game.initializeGame();

      var movePromise = Game.movePiece();
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
    let move = req.body.move;

    this.board.whiteMove = !this.board.whiteMove;
    res.whiteMove = this.board.whiteMove

    var movePromise = Game.movePiece(move);
    movePromise.then(value => {
      console.log(`next move is ${value}`);
      res.send(value);
    });
  }
);


app.listen(8085, "0.0.0.0", () => console.log("Listening on port 8085!"));


