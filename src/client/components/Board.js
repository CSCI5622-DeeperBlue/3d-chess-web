/* eslint-disable react/no-direct-mutation-state */
// @flow
//Board holds the 3D rendering logic and actions for the 3D display. The BablyonJS engine programming paradigm doesn't play well with React concepts, so this is not a component.
//For simplicity this is setup as a normal javascript class with an API to command moves in and a callback for the class to broadcast user events back to the rest of the app
import React from 'react';
import BoardScene from './BoardScene';
import SceneHandler from './SceneHandler';

export default class Board extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sceneHandler: {}, // initial setup
            pieces: [], //an array of meshes of the pieces,named by position
            activePieceID: '',
            board: {},
            loader: {},
            moveDisplay: {},
            whiteScoreDisplay: {},
            blackScoreDisplay: {}
        }
    }

    //TODO: this seems to be breaking react rules, need to make set state and make overall more robust
    componentDidMount() {
        fetch("/api/engine/getBoard")
            .then((res) => res.json())
            .then((res) => {
                this.state.board= res.board;
                // this.state.sceneHandler.drawBoard(this.state.board, this.pieceClickCallback)
                console.log(this.state.board)
            })
    }

    //passed down to the react render div, where it is called once on creation.
    onSceneMount = sceneHandle => {
        console.log(sceneHandle)
        this.state.sceneHandler = new SceneHandler(sceneHandle,
                                                    this.state.board,
                                                    this.layerClickCallback,
                                                    this.pieceClickCallback
                                                );
    }

    // passed to the layer class to call back clicks.
    // checks if the move is valid and moves it if so.
    layerClickCallback(a, b, c) {
        if (this.state.activePieceID) {
            let move = this.getLAN(this.state.activePieceID,a,b,c);
            console.log(move);
            this.textMove(move);
        }
    }

    //toggle or switch selection.
    pieceClickCallback(pieceID) {
        this.setAllUnselected();
        if (this.state.activePieceID !== pieceID) {
            this.state.activePieceID = pieceID;
            this.getPieceByID(pieceID).material.wireframe = true;
        }
    }

    //helper function to remove captured piece
    removePieceByID(pieceID) {
        const pieceIndex = this.state.pieces.findIndex((p) => {
            return p.name === pieceID;
        }); //TODO: refactor

        if (pieceIndex >= 0) {
            let p = this.state.pieces[pieceIndex]
            this.state.pieces.splice[pieceIndex, 1]
            this.state.sceneHandle.scene.removeMesh(p)
        }
    }

    //helper function to return active pieces
    getPieceByID(pieceID) {
        const pieceIndex = this.state.pieces.findIndex((p) => {
            return p.name === pieceID;
        });
        if (pieceIndex >= 0) {
            return this.state.pieces[pieceIndex]
        }
        return false
    }

    //helper function to unselect all pieces/board squares
    setAllUnselected() {
        this.state.activePieceID = ''
        this.state.sceneHandler.setAllUnselected();
    }

    // taeks
    getCoordinates(input) {
        let coordinates = {a:input.toLowerCase().charCodeAt(0) - 97,b:(parseInt(input[1])-1),c:input[2].toUpperCase()};
        switch(coordinates.c) {
            case 'L':
                coordinates.c = 0;
                break;
            case 'M':
                coordinates.c = 1;
                break;
            case 'U':
                coordinates.c = 2;
                break;
            default:
                coordinates.c = "error";
                break;
        }
        console.log(coordinates);
        return coordinates;
    }

    setPieceCoordinates(pid,a,b,c) {
        if (pid[0] == 'w') {
            for (let i = 0; i < this.state.board.whitePieces.length; i++) {
                if(this.state.board.whitePieces[i].pieceID == pid) {
                    this.state.board.whitePieces[i].a = a;
                    this.state.board.whitePieces[i].b = b;
                    this.state.board.whitePieces[i].c = c;
                }
            }
        } else {
            for (let i = 0; i < this.state.board.blackPieces.length; i++) {
                if(this.state.board.blackPieces[i].pieceID == pid) {
                    this.state.board.blackPieces[i].a = a;
                    this.state.board.blackPieces[i].b = b;
                    this.state.board.blackPieces[i].c = c;
                }
            }
        }
    }

    getLAN(pid,a,b,c) {
        let check = 0;
        let lan = "";
        if (pid[0] == 'w') {
            check = this.state.board.whitePieces;
        } else {
            check = this.state.board.blackPieces;
        }
        for (let i = 0; i < check.length; i++) {
            if(check[i].pieceID == pid) {
                lan += String.fromCharCode(97 + check[i].a) + (check[i].b+1)
                switch(check[i].c) {
                    case 0:
                        lan += "l";
                        break;
                    case 1:
                        lan += "m";
                        break;
                    case 2:
                        lan += "u";
                        break;
                }
            }
        }
        lan += String.fromCharCode(97 + a) + (b+1)
        switch(c) {
             case 0:
                lan += "l";
                break;
             case 1:
                lan += "m";
                break;
             case 2:
                lan += "u";
                break;
        }
        return lan;
    }

    textMove(input) {
        if (input.length != 6) {
            console.log(input + " is not a valid move.");
        } else {
            let piece = this.getCoordinates(input.substring(0,3));
            let move = this.getCoordinates(input.substring(3,6));
            if (move.c == "error" || move.a < 0 || move.b < 0 || move.a > 7 || move.b > 7 || piece.c == "error" || piece.a < 0 || piece.b < 0 || piece.a > 7 || piece.b > 7) {
                console.log(input + " is not a valid move.");
            } else {
                move.pieceID = pid;
                fetch('/api/movePiece', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({move:move,text:this.getLAN(move.pieceID,move.a,move.b,move.c)})
                })
                    .then((res) => res.json())
                    .then((res) => {
                        if (res.moveValid) {
                            console.log(res)
                            let p = this.getPieceByID(move.pieceID);
                            if (p) {
                                this.state.SceneHandle.pieceAnimateMove(p, move);
                                this.setPieceCoordinates(move.pieceID,move.a,move.b,move.c);
                                this.state.board.whiteMove = res.whiteMove;
                            }
                            //in the piece is   capture remove from board.
                            if (res.capturedPiece) {
                                this.removePieceByID(res.capturedPiece)
                            }
                            if(res.whiteCheckmated) {
                            this.state.moveDisplay.text = "Black Wins"
                            } else if(res.blackCheckmated) {
                                this.state.moveDisplay.text = "White Wins"
                            } else {
                                res.whiteMove? this.state.moveDisplay.text = "White Move" :this.state.moveDisplay.text = "Black Move"
                            }
                            this.state.whiteScoreDisplay.text = 'White Score is ' + res.score.whiteScore.toString()
                            this.state.blackScoreDisplay.text = 'Black Score is ' + res.score.blackScore.toString()
                        }

                    }
                    )
            }
        }
    }

    render() {
        return (<div className="App-layer" >
            <
                BoardScene
                onSceneMount={
                    this.onSceneMount.bind(this)
                }
                layerClickCallback = {this.layerClickCallback}
                pieceClickCallback = {this.pieceClickCallback}
            /> </div>
        )
    }
}