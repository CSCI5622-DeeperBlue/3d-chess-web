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

class GameState {
  constructor() {
    // initializes all pieces
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

    this.board = {
      whitePieces,
      blackPieces,
      whiteMove: true
    };
  }

  //returns current state
  getBoard() {
    return this.board;
  }

  // returns information about a pieces possible moves
  getPieceInformation(pieceID) {
    this._getPieceObject(pieceID)
    return [{a: 1,b: 1,c: 1}, {a: 2,b: 2,c: 2}]
  }

  //returns the piece information based uponw
  _getPieceObject(pieceID)  {

    var playerPieces = []
    var enemyPieces = []
    var piece = {}

    //
    if (this.board.whiteMove) {
      playerPieces = this.board.whitePieces;
      enemyPieces = this.board.blackPieces;
    } else {
      playerPieces = this.board.blackPieces;
      enemyPieces = this.board.whitePieces;
    }

    // find the appropriate piece
    const pieceIndex = playerPieces.findIndex(p => p.pieceID === pieceID);

    if (!(pieceIndex >= 0)) {
      console.log(`Error: couldn't find piece ${pieceID}. Looking for White? ${this.board.whiteMove}`);
      return false
    }

    return { pieceIndex, piece, playerPieces, enemyPieces }
  }

  // evaluates move, returns error if not legal, returns new state if legal
  movePiece(pieceID, move) {

    // select appropriate pieces
    var res = {}; //response object
    var teamPieces = []
    var piece = {}

    //if not a move to the same square ignore
    if (piece.a == move.a && piece.b == move.b && piece.c == move.c) { console.log('beginning and end are same, not a move'); res.moveValid = false; return res; }

    //get information from the board object based upon the ID
    var pieceInfoObj = this._getPieceObject(pieceID)
    if(!pieceInfoObj) {
      res.moveValid = false;
      return res;
    }

    var {pieceIndex, piece, playerPieces, enemyPieces} = pieceInfoObj

    teamPieces = Array.from(playerPieces) // remove reference to state delta.ata
    piece = teamPieces.splice(pieceIndex, 1)[0] // remove the active piece

    //if would kill teammate ignore
    if (this.checkCapture(teamPieces, move).valid) { console.log('would land on own piece, invalid move'); res.moveValid = false;  return res; }

    const moveCapture = this.checkCapture(enemyPieces, move)

    if (!this.checkMoveGeometry(piece, move, moveCapture.valid, teamPieces, enemyPieces)) {
      console.log(`Invalid move shape for ${pieceID}.`);
      res.moveValid = false;
      return res;
    }

    //move is valid
    piece.a = move.a;
    piece.b = move.b;
    piece.c = move.c;
    piece.firstMove = false;
    this.board.whiteMove ? this.board.whitePieces.splice(pieceIndex, 1, piece) : this.board.blackPieces.splice(pieceIndex, 1, piece) // update moved piece

    res.moveValid = true;

    console.log(`#wp ${this.board.whitePieces.length} #bp ${this.board.blackPieces.length}`)
    console.log(`Moved Piece ${pieceID}. to ${move.a} ${move.b} ${move.c}`);
    if (moveCapture.valid) {
      const capturedPiece = enemyPieces.splice(moveCapture.index, 1)[0]
      console.log(`captured enemy piece ${capturedPiece.pieceID}`)
      res.capturedPiece = capturedPiece.pieceID
    }

    if (this.board.whiteMove && this.checkCheckMate(enemyPieces)) {
      res.blackCheckmated = true;
    }else if (!this.board.whiteMove && this.checkCheckMate(enemyPieces)) {
      res.whiteCheckmated = true;
    }

    res.score = this.calculateScore();

    this.board.whiteMove = !this.board.whiteMove;
    res.whiteMove = this.board.whiteMove

    return res;
  }

  //TODO: update this to be proper checkmate
  checkCheckMate(pieces) {
    let index = pieces.findIndex(p => p.type === PIECE_TYPES.king )
    return index<0
  }

  //calculates current board score
  calculateScore(){
    let score = {whiteScore:0,blackScore:0 }
    this.board.whitePieces.forEach(p => score.whiteScore += p.type.value)
    this.board.blackPieces.forEach(p => score.blackScore += p.type.value)

    return score
  }

  //checks if move would go through any other piece. this piece only handles diagonal and straight lines, it is assume that knights do not call it.
  checkMoveBlocked(piece, move, pieces) {
    //creates a vector of all coordinates between start and end pieces, then searches the pieces array to find if they are there

    let aVec = [], bVec = [], cVec = []
    if (move.a > piece.a) { aVec = this.range(piece.a + 1, move.a - 1) } else { aVec = this.range(move.a + 1, piece.a - 1); aVec.reverse() }
    if (move.b > piece.b) { bVec = this.range(piece.b + 1, move.b - 1) } else { bVec = this.range(move.b + 1, piece.b - 1); bVec.reverse() }
    if (move.c > piece.c) { cVec = this.range(piece.c + 1, move.c - 1) } else { cVec = this.range(move.c + 1, piece.c - 1); cVec.reverse() }

    let coords = new Array(Math.max(aVec.length, bVec.length, cVec.length)).fill().map(() => ({ a: piece.a, b: piece.b, c: piece.c }));
    aVec.forEach((x, i) => { coords[i].a = x })
    bVec.forEach((x, i) => { coords[i].b = x })
    cVec.forEach((x, i) => { coords[i].b = x })

    let blockers = []
    console.log("checking for collisions over coords")
    console.log(coords)
    coords.forEach(coord => {
      pieces.forEach(p => {
        if (coord.a === p.a && coord.b === p.b && coord.c === p.c) { blockers.push(p) }
      })
    })
    return blockers
  }

  //helper function to generate range
  range(start, end, length = end - start + 1) { return Array.from({ length }, (_, i) => start + i) }

  //return true if any of the pieces are at the given coordinates.
  checkCapture(pieces, move) {
    let capture = {}
    capture.valid = false
    const index = pieces.findIndex(p => p.a === move.a && p.b === move.b && p.c === move.c);
    if ((index >= 0)) {
      capture.valid = true
      capture.index = index
      console.log(capture)
    }
    return capture;
  }

  // evaluate only the geometry of the move for each of the piece types
  checkMoveGeometry(piece, move, moveCapture, teamPieces, enemyPieces) {
    let delta = {}

    delta.a = move.a - piece.a;
    this.board.whiteMove ? delta.b = move.b - piece.b : delta.b = piece.b - move.b;
    delta.c = move.c - piece.c;

    console.log(`white move? ${this.board.whiteMove} capture? ${moveCapture} moving piece ${piece.pieceID} from ${piece.a} ${piece.b} ${piece.c} to ${move.a} ${move.b} ${move.c} Found deltas for ${piece.pieceID} ${delta.a} ${delta.b} ${delta.c} ${piece.type.name}  `)

    var arr = ([Math.abs(delta.a), Math.abs(delta.b), Math.abs(delta.c)])
    arr.sort();
    console.log(arr)

    switch (piece.type) {
      case PIECE_TYPES.pawn:
        if (this.checkMoveBlocked(piece, move, teamPieces.concat(enemyPieces)).length) return false;
        if (moveCapture) {
          return (Math.abs(delta.a)=== 1 && Math.abs(delta.b) === 1 && (-1 <= delta.c) && (delta.c <= 1));
        } else if (piece.firstMove) {
          return ((delta.a === 0) && (delta.b <= 2)) && (-1 <= delta.c) && (delta.c <= 1);
        } else {
          return ((delta.a === 0) && (delta.b === 1)) && (-1 <= delta.c) && (delta.c <= 1);
        }
      case PIECE_TYPES.knight:
        return (arr[0] === 0 && arr[1] === 1 && arr[2] === 2);
      case PIECE_TYPES.bishop:
        if (this.checkMoveBlocked(piece, move, teamPieces.concat(enemyPieces)).length) return false;
        if (delta.c === 0) {
          return (Math.abs(delta.a) === Math.abs(delta.b));
        } else {
          return (Math.abs(delta.c) === Math.abs(delta.b)) && (Math.abs(delta.c) === Math.abs(delta.a));
        }
      case PIECE_TYPES.rook:
        if (this.checkMoveBlocked(piece, move, teamPieces.concat(enemyPieces)).length) return false;
        return arr[0] === 0 && arr[1] === 0;
      case PIECE_TYPES.queen:
        if (this.checkMoveBlocked(piece, move, teamPieces.concat(enemyPieces)).length) return false;
        if (arr[0] === 0 && arr[1] === 0) {
          return true
        } else if (arr[0] === 0) {
          return arr[1] === arr[2]
        } else {
          return (arr[0] === arr[1]) && (arr[1] === arr[2])
        }
      case PIECE_TYPES.king:
        if (this.checkMoveBlocked(piece, move, teamPieces.concat(enemyPieces)).length) return false;
        if (arr[0] <= 1 && arr[1] <= 1 && arr[2] <= 1) {
          return true
        } else if (piece.firstMove) {
          console.log('need to implement castle')
          return false
        } else {
          return false
        }
      default:
        console.error(`invalid piece type ${piece.type}`)
        return false;
    }
  }

}

module.exports = {
  GameState
};