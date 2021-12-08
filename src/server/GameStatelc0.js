const { spawn } = require('child_process');

/**
 * Uses Coordinates of:
 * a0 = white king rook, a7 = white queen rook
 * b0 = white back row, b7 = black back row
 * z0 = bottom layer, white king side. z2 = top layer
 */


/**
 * stores the status of a single game, checks moves, updelta.ates game, and calculates win
 *
 *
 */

//https://en.wikipedia.org/wiki/Chess_piece_relative_value#Standard_valuations
const PIECE_TYPES = {
  pawn: {name: 'pawn', value: 1},
  knight: {name: 'knight', value: 3},
  bishop: {name: 'bishop', value: 3},
  rook: {name: 'rook', value: 5},
  queen: {name: 'queen', value: 9},
  king: {name: 'king', value: 0}
};
Object.freeze(PIECE_TYPES);

class GameStatelc0 {
  constructor() {
    // initializes all pieces
    this.moveList = "";
    this.board = this.getStartingBoard();
    this.child = this._StreamInitialize();
  }

  getStartingBoard() {
    const whitePieces = [
      { pieceID: 'wkr', a: 0, b: 0, c: 1, type: PIECE_TYPES.rook, firstMove: true },
      { pieceID: 'wkk', a: 1, b: 0, c: 1, type: PIECE_TYPES.knight, firstMove: true },
      { pieceID: 'wkb', a: 2, b: 0, c: 1, type: PIECE_TYPES.bishop, firstMove: true },
      { pieceID: 'wk', a: 3, b: 0, c: 1, type: PIECE_TYPES.king, firstMove: true },
      { pieceID: 'wq', a: 4, b: 0, c: 1, type: PIECE_TYPES.queen, firstMove: true },
      { pieceID: 'wqb', a: 5, b: 0, c: 1, type: PIECE_TYPES.bishop, firstMove: true },
      { pieceID: 'wqk', a: 6, b: 0, c: 1, type: PIECE_TYPES.knight, firstMove: true },
      { pieceID: 'wqr', a: 7, b: 0, c: 1, type: PIECE_TYPES.rook, firstMove: true },
      { pieceID: 'wp1', a: 0, b: 1, c: 1, type: PIECE_TYPES.pawn, firstMove: true },
      { pieceID: 'wp2', a: 1, b: 1, c: 1, type: PIECE_TYPES.pawn, firstMove: true },
      { pieceID: 'wp3', a: 2, b: 1, c: 1, type: PIECE_TYPES.pawn, firstMove: true },
      { pieceID: 'wp4', a: 3, b: 1, c: 1, type: PIECE_TYPES.pawn, firstMove: true },
      { pieceID: 'wp5', a: 4, b: 1, c: 1, type: PIECE_TYPES.pawn, firstMove: true },
      { pieceID: 'wp6', a: 5, b: 1, c: 1, type: PIECE_TYPES.pawn, firstMove: true },
      { pieceID: 'wp7', a: 6, b: 1, c: 1, type: PIECE_TYPES.pawn, firstMove: true },
      { pieceID: 'wp8', a: 7, b: 1, c: 1, type: PIECE_TYPES.pawn, firstMove: true }
    ];

    const blackPieces = [
      { pieceID: 'bkr', a: 0, b: 7, c: 1, type: PIECE_TYPES.rook, firstMove: true },
      { pieceID: 'bkk', a: 1, b: 7, c: 1, type: PIECE_TYPES.knight, firstMove: true },
      { pieceID: 'bkb', a: 2, b: 7, c: 1, type: PIECE_TYPES.bishop, firstMove: true },
      { pieceID: 'bk', a: 3, b: 7, c: 1, type: PIECE_TYPES.king, firstMove: true },
      { pieceID: 'bq', a: 4, b: 7, c: 1, type: PIECE_TYPES.queen, firstMove: true },
      { pieceID: 'bqb', a: 5, b: 7, c: 1, type: PIECE_TYPES.bishop, firstMove: true },
      { pieceID: 'bqk', a: 6, b: 7, c: 1, type: PIECE_TYPES.knight, firstMove: true },
      { pieceID: 'bqr', a: 7, b: 7, c: 1, type: PIECE_TYPES.rook, firstMove: true },
      { pieceID: 'bp1', a: 0, b: 6, c: 1, type: PIECE_TYPES.pawn, firstMove: true },
      { pieceID: 'bp2', a: 1, b: 6, c: 1, type: PIECE_TYPES.pawn, firstMove: true },
      { pieceID: 'bp3', a: 2, b: 6, c: 1, type: PIECE_TYPES.pawn, firstMove: true },
      { pieceID: 'bp4', a: 3, b: 6, c: 1, type: PIECE_TYPES.pawn, firstMove: true },
      { pieceID: 'bp5', a: 4, b: 6, c: 1, type: PIECE_TYPES.pawn, firstMove: true },
      { pieceID: 'bp6', a: 5, b: 6, c: 1, type: PIECE_TYPES.pawn, firstMove: true },
      { pieceID: 'bp7', a: 6, b: 6, c: 1, type: PIECE_TYPES.pawn, firstMove: true },
      { pieceID: 'bp8', a: 7, b: 6, c: 1, type: PIECE_TYPES.pawn, firstMove: true }
    ];

    const board = {
      whitePieces,
      blackPieces,
      whiteMove: true
    };
    return board;
  }
  // helper to initialize this.child stream
  _StreamInitialize(verbose) {
    this.child = spawn('lc0',{shell:true});
    this.child.stdin.setEncoding = 'utf-8';
    this.child.stdout.setEncoding('utf8');
    if(verbose) {
      this.child.stdout.pipe(process.stdout);
      this.child.stderr.pipe(process.stdout);
    }
    this.child.stdin.write("setoption name Threads value 1\n");
    this.child.stdin.write("setoption name VerboseMoveStats value false\n");
    this.child.stdin.write("setoption name Ponder value false\n");
    this.child.stdin.write("setoption name UCI_ShowWDL value false\n");
    return this.child
  }

  _StreamUciNewGame() {
    this.child.stdin.write("ucinewgame\n"); //resets history in engine
  }


  _StreamUciSetPositionAndMove(move) {
    var uciMoves = "position startpos"; // will always start from start position
    if (move) { this.moveList = this.moveList + move; }
    if (this.moveList) { uciMoves = uciMoves + this.moveList}
    uciMoves = uciMoves + "\n"

    this.child.stdin.write(uciMoves);
    process.nextTick(() => this.child.stdin.uncork());
    this.child.stdin.write("go nodes 1000\n");
    return this._StreamResolveChildGoNodesResponse(this.child);
  }

  _StreamResolveChildGoNodesResponse(child) {
    var movePromise = new Promise((resolve) => {
      child.stdout.on('data',function(data){
        var childResponseArr = data.split(' ');
        if (childResponseArr[0] === 'bestmove') {
          let responseData = childResponseArr[1]
          console.log(`responseData is ${responseData}`);
          if (responseData.length === 4) {
            responseData = `${responseData.slice(0,2)}m${responseData.slice(2,4)}m`;
            console.log (`WARNING, updated from 2d format to middle layer: ${responseData}`)
          }
          resolve(
            {
              moveValid:  true,
              score: {whiteScore:0,blackScore:0 },
              opponentMove: responseData
            } )
        }
      });
    });
    return movePromise
  }

  getBoard() { return this.board;}
  getMoveList() { return this.moveList; }

  initializeGame() {
    this.moveList = "";
    this.board = this.getStartingBoard();
    this._StreamUciNewGame();
  }
  // evaluates move, returns error if not legal, returns new state if legal
  movePiece(pieceID, move) {

    //returns a promise
    return this._StreamUciSetPositionAndMove(move);

  }

}

module.exports = {
  GameStatelc0
};