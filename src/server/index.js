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
child.stdout.setEncoding('utf8');
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stdout);

let moveList = ""

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

app.get("/api/startEngine",(req,res) =>
    {
        //child.stdout.pipe(res);
        moveList = "";
        child.stdin.cork();
        child.stdin.write("setoption name Threads value 1\n");
        child.stdin.uncork();
        child.stdin.cork();
        child.stdin.write("setoption name VerboseMoveStats value false\n");
        child.stdin.uncork();
        child.stdin.cork();
        child.stdin.write("setoption name Ponder value false\n");
        child.stdin.uncork();
        child.stdin.cork();
        child.stdin.write("setoption name UCI_ShowWDL value false\n");
        child.stdin.uncork();
        child.stdin.cork();
        child.stdin.write("ucinewgame\n");
        child.stdin.uncork();
        child.stdin.cork();
        child.stdin.write("position startpos\n");
        child.stdin.uncork();
        child.stdin.cork();
        child.stdin.write("go nodes 1000\n");
        child.stdin.uncork();
        child.stdout.on('data',function(data) {
            res.send({data:data});
        });
    }
);


//expect a JSON object of the type: {pieceID,a,b,c}
app.post("/api/movePiece", (req, res) =>
  {
     let move = req.body.move;
     moveList += (req.body.text + " ");
     console.log("moveList");
     console.log(moveList);
     child.stdin.cork();
     child.stdin.write("position startpos moves "+ moveList + "\n");
     child.stdin.uncork();
     child.stdin.cork();
     child.stdin.write("go nodes 1000\n");
     child.stdin.uncork();
     child.stdout.on('data',function(data) {
        console.log(data);
        res.send(Game.movePiece(move.pieceID,move))
     });
     //res.send(Game.movePiece(move.pieceID, move))
  }
);

//expect a JSON object of the type: {pieceID,a,b,c}
app.post("/api/engineMovePiece",(req,res) =>
    {
        let move = req.body
        child.stdout.pipe(res);
        child.stdin.cork();
        child.stdin.write("position startpos moves "+ move + "\n");
        child.stdin.uncork();
        child.stdin.cork();
        child.stdin.write("go nodes\n");
        child.stdin.uncork();
        child.stdout.on('data',function(data) {
            console.log(data);
            res.send({data:data});
        });
    }
);


app.listen(8085, "0.0.0.0", () => console.log("Listening on port 8085!"));


