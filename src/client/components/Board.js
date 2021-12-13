/* eslint-disable react/no-direct-mutation-state */
// @flow
//Board holds the 3D rendering logic and actions for the 3D display. The BablyonJS engine programming paradigm doesn't play well with React concepts, so this is not a component.
//For simplicity this is setup as a normal javascript class with an API to command moves in and a callback for the class to broadcast user events back to the rest of the app
import React from 'react';
import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';

import BoardScene from './BoardScene';
import BoardLayer from './BoardLayer';

export default class Board extends React.Component {

    constructor(props) {
        super(props);

        const boardSize = 200;
        const zOffset = 50;
        const coordinates = this.generateBoardIndexes(boardSize, zOffset);
        this.state = {
            sceneHandle: {},
            pieces: [], //an array of meshes of the pieces,named by position
            activePieceID: '',
            boardSize,
            zOffset,
            coordinates,
            board: {},
            layers: [],
            loader: {},
            moveDisplay: {},
            whiteScoreDisplay: {},
            blackScoreDisplay: {},
            ended: false
        }
    }

    //TODO: this seems to be breaking react rules, need to make set state and make overall more robust
    componentDidMount() {
        fetch("/api/engine/getBoard")
            .then((res) => res.json())
            .then((res) => this.setState({
                board: res.board
            }))
            .then(() => {
                // https://doc.babylonjs.com/how_to/how_to_use_assetsmanager
                var assetsManager = new BABYLON.AssetsManager(this.state.sceneHandle.scene);
                // TODO: can speed up load by pre-importing then copying.

                this.state.board.whitePieces.forEach(
                    p => {
                        var meshTask = assetsManager.addMeshTask(p.pieceID, "", "public/models/", `${p.type.name}.obj`);
                        meshTask.onSuccess = (task) => {
                            this.configurePieceMesh(task.loadedMeshes[0], p.pieceID,
                                this.state.coordinates[p.a][p.b][p.c],
                                BABYLON.Color3.White()).bind(this);
                        }
                    }
                );
                this.state.board.blackPieces.forEach(
                    p => {
                        var meshTask = assetsManager.addMeshTask(p.pieceID, "", "public/models/", `${p.type.name}.obj`);
                        meshTask.onSuccess = (task) => {
                            this.configurePieceMesh(task.loadedMeshes[0], p.pieceID,
                                this.state.coordinates[p.a][p.b][p.c],
                                BABYLON.Color3.Black()).bind(this);
                        }
                    }
                );
                assetsManager.load()

            })
    }

    //helper for component did mount
    //used to configure mesh after initial mesh load
    configurePieceMesh(mesh, pieceID, position, color) {
        mesh.name = pieceID

        var meshMaterial = new BABYLON.StandardMaterial(color, this.state.sceneHandle.scene);
        meshMaterial.diffuseColor = color;
        meshMaterial.emissiveColor = color;
        meshMaterial.specularColor = color;
        meshMaterial.emissiveIntensity = 0.1;
        // meshMaterial.alpha = 0.9;

        mesh.position = position;
        mesh.material = meshMaterial;

        //setup actionManagers
        mesh.actionManager = new BABYLON.ActionManager(this.state.sceneHandle.scene);

        //broadcast to listeners
        mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnLeftPickTrigger,
                () => {
                    this.pieceClickCallback(pieceID);
                })
        );
        this.state.pieces.push(mesh)
    }

    // TOOD: fix this to have a simpler startup.Likely Boardscene should call Board instead of vice versa
    //passed down to the react render div, where it is called once on creation.
    onSceneMount = sceneHandle => {
        this.state.sceneHandle = sceneHandle;

        // This creates and positions a free camera (non-mesh)

        this.camera = new BABYLON.ArcRotateCamera(
            "camera1", 2.9, 1.3, 300,
            new BABYLON.Vector3(this.state.boardSize / 2, this.state.boardSize / 2, 50),
            this.state.sceneHandle.scene
        );

        this.camera.upVector = new BABYLON.Vector3(0, 0, 1);
        this.camera.attachControl(this.state.sceneHandle.canvas, true);

        var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        advancedTexture.layer.layerMask = 2;

        var panel3 = new GUI.StackPanel();
        panel3.width = "240px";
        panel3.fontSize = "14px";
        panel3.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        panel3.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        advancedTexture.addControl(panel3);

        let moveDisplay = new GUI.TextBlock();
        moveDisplay.text = "WhiteMove";
        moveDisplay.height = "40px";
        moveDisplay.color = "white";
        moveDisplay.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        moveDisplay.paddingTop = "10px";
        panel3.addControl(moveDisplay);
        this.state.moveDisplay = moveDisplay;

        var whiteScoreDisplay = new GUI.TextBlock();
        whiteScoreDisplay.text = "White Score";
        whiteScoreDisplay.height = "40px";
        whiteScoreDisplay.color = "white";
        whiteScoreDisplay.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        whiteScoreDisplay.paddingTop = "10px";
        panel3.addControl(whiteScoreDisplay);
        this.state.whiteScoreDisplay = whiteScoreDisplay;

        var blackScoreDisplay = new GUI.TextBlock();
        blackScoreDisplay.text = "Black Score";
        blackScoreDisplay.height = "40px";
        blackScoreDisplay.color = "white";
        blackScoreDisplay.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        blackScoreDisplay.paddingTop = "10px";
        panel3.addControl(blackScoreDisplay);
        this.state.blackScoreDisplay = blackScoreDisplay;

        var dim = new GUI.Button.CreateSimpleButton("but", "Get 2D");
        dim.height = "45px";
        dim.background = "gray";
        dim.color="white";
        dim.paddingTop="10px";
        dim.onPointerClickObservable.add( () => {this.toggle2D()});
        panel3.addControl(dim);

        var button = new GUI.Button.CreateSimpleButton("but", "Engine Move");
        button.height = "45px";
        button.background = "gray";
        button.color="white";
        button.paddingTop="10px";
        button.onPointerClickObservable.add( () => {
            fetch("/api/engineMovePiece", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify()
            })
                .then((res) => res.json())
                .then((data) => {this.textMove(data.opponentMove)})
            //setTimeout(()=>{this.getBestMove()},5000);
        });
        panel3.addControl(button);

        var cpu = new GUI.Button.CreateSimpleButton("but", "Auto Play");
        cpu.height = "45px";
        cpu.background = "gray";
        cpu.color="white";
        cpu.paddingTop="10px";
        cpu.onPointerClickObservable.add( () => {this.autoPlay();});
        panel3.addControl(cpu);

        var inputTextDisplay = new GUI.InputText();
        inputTextDisplay.text="Enter Move";
        inputTextDisplay.background = "white";
        inputTextDisplay.color = "gray";
        inputTextDisplay.focusedBackground = "white";
        inputTextDisplay.height="50px";
        inputTextDisplay.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        inputTextDisplay.width="200px";
        inputTextDisplay.paddingTop = "10px";
        inputTextDisplay.onFocusObservable.add(() => {
            if (inputTextDisplay.text == "Enter Move") {
                inputTextDisplay.color = "black";
                inputTextDisplay.text = "";
            }
        });
        inputTextDisplay.onKeyboardEventProcessedObservable.add((input) => {
            if (input.key == "Enter") {
                this.textMove(inputTextDisplay.text);
                inputTextDisplay.text = "Enter Move";
                inputTextDisplay.color = "gray";
            }
        })
        panel3.addControl(inputTextDisplay);

        let i;
        for (i = 0; i < 3; i++) {
            this.state.layers.push(new BoardLayer({
                c: i,
                size: this.state.boardSize,
                layerClickCallback: this.layerClickCallback.bind(this),
                z: this.state.zOffset * i,
                sceneHandle: this.state.sceneHandle
            }))
        }

        this.state.sceneHandle.engine.runRenderLoop(() => {
            if (this.state.sceneHandle.scene) {
                this.state.sceneHandle.scene.render();
            }
        });

    }

    // passed to the layer class to call back clicks.
    // checks if the move is valid and moves it if so.
    layerClickCallback(a, b, c) {
        if (this.state.activePieceID) {
//            let move = {
//                pieceID: this.state.activePieceID,
//                a,
//                b,
//                c
//            }
            let move = this.getLAN(this.state.activePieceID,a,b,c);
            // console.log(move);
            this.textMove(move);
//            fetch('/api/movePiece', {
//                method: 'POST',
//                headers: {
//                    Accept: 'application/json',
//                    'Content-Type': 'application/json'
//                },
//                body: JSON.stringify(move)
//            })
//                .then((res) => res.json())
//                .then((res) => {
//                    if (res.moveValid) {
//                        console.log(res)
//                        this.state.layers[c].setSelected(a, b)
//                        let p = this.getPieceByID(move.pieceID);
//                        if (p) {
//                            this.pieceAnimateMove(p, this.state.coordinates[move.a][move.b][move.c])
//                        }
//
//                        //in the piece is   capture remove from board.
//                        if (res.capturedPiece) {
//                            this.removePieceByID(res.capturedPiece)
//                        }
//                        if(res.whiteCheckmated) {
//                        this.state.moveDisplay.text = "Black Wins"
//                        } else if(res.blackCheckmated) {
//                            this.state.moveDisplay.text = "White Wins"
//                        } else {
//                            res.whiteMove? this.state.moveDisplay.text = "White Move" :this.state.moveDisplay.text = "Black Move"
//                        }
//                        this.state.whiteScoreDisplay.text = 'White Score is ' + res.score.whiteScore.toString()
//                        this.state.blackScoreDisplay.text = 'Black Score is ' + res.score.blackScore.toString()
//
//                    }
//
//                }
//                )
        }
    }

    //toggle or switch selection.
    pieceClickCallback(pieceID) {
        this.setAllUnselected();
        if (this.state.activePieceID !== pieceID) {
            this.state.activePieceID = pieceID;
            this.getPieceByID(pieceID).material.wireframe = true;

            fetch('/api/engine/getPieceInformation', {
                method: 'GET',
                params: {
                    pieceID
                },
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            .then((res) => res.json())
            .then((res) => console.log(res)) /// Ian, update her
        }
    }

    // helper function to animate moves
    pieceAnimateMove(mesh, position) {
        console.log('animating')
        var keysPiece = [];
        var animationBox = new BABYLON.Animation(
            "piece", "position", 60,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );

        keysPiece.push({
            frame: 0,
            value: mesh.position
        });
        keysPiece.push({
            frame: 60,
            value: position
        });
        animationBox.setKeys(keysPiece);
        mesh.animations.push(animationBox);
        this.state.sceneHandle.scene.beginAnimation(mesh, 0, 60, false);
    }

    // returns a list of coordinates on all three boards in. putting this here because instead of
    // in board layers because mathimatically the board layers don't matter.
    // choosing not to do this with agebraic notiation for the second because need solid movement
    generateBoardIndexes(boardSize, zOffset) {
        var boardIndexes = [];
        var increment = boardSize / 8; //size of each cell

        for (var x = 0; x < 9; x++) {
            boardIndexes[x] = [];
            for (var y = 0; y < 9; y++) {
                boardIndexes[x][y] = [
                    new BABYLON.Vector3(increment * (x + 0.5), increment * (y + 0.5), 0),
                    new BABYLON.Vector3(increment * (x + 0.5), increment * (y + 0.5), zOffset),
                    new BABYLON.Vector3(increment * (x + 0.5), increment * (y + 0.5), zOffset * 2)
                ]
            }
        }
        return boardIndexes;
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
        this.state.layers.forEach(l => l.clearAllCells())
        this.state.pieces.forEach(p => p.material.wireframe = false)
        this.state.activePieceID = ''

    }

    getCoordinates(input) {
        let coordinates = {a:Math.abs(input.toLowerCase().charCodeAt(0)-97-7),b:(parseInt(input[1])-1),c:input[2].toUpperCase()};
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
        // console.log(coordinates);
        return coordinates;
    }

    getPieceFromCoordinates(a,b,c) {
        let check = 0;
        if (this.state.board.whiteMove) {
            check = this.state.board.whitePieces;
        } else {
            check = this.state.board.blackPieces;
        }
        for (let i = 0; i < check.length; i++) {
            if(check[i].a == a && check[i].b == b && check[i].c == c) {
                return check[i].pieceID;
            }
        }
        // console.log(check);
        console.log("No piece at coordinates");
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
                let x = Math.abs(check[i].a-7);
                lan += String.fromCharCode(97 + x) + (check[i].b+1);
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
        let x = Math.abs(a-7);
        lan += String.fromCharCode(97 + x) + (b+1)
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

    addLayerToLAN(move) {
        if (move.charAt(2).toLowerCase() != 'm' && move.charAt(2).toLowerCase() != 'u' && move.charAt(2).toLowerCase() != 'l') {
            move = move.substring(0,2) + 'm' + move.substring(2,move.length);       
        }
        if (move.charAt(move.length-1).toLowerCase() != 'm' && move.charAt(move.length-1).toLowerCase() != 'u' && move.charAt(move.length-1).toLowerCase() != 'l') {
            move = move + 'm';       
        }
        console.log(move);
        return move;
    }

    toggle2D() {
        {
            fetch("/api/toggleDimension")
                .then((res) => res.json())
                .then((data) => {location.reload();})
        }
    }

    autoPlay() {
        if (!this.state.ended) {
            setTimeout(() => {
                    this.getBestMove();
                    this.autoPlay();
            },2500);
        }
    }

    getBestMove() {
        console.log("Getting best move");
        fetch("/api/engineMovePiece", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify()
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.ended) {
                    this.state.ended = true;
                    this.state.moveDisplay.text = "Game Ended";
                }
                this.textMove(data.opponentMove);
            })
    }

    textMove(input) {
                input = this.addLayerToLAN(input);

                if (input.length != 6) {
                    console.log(input + " is not a valid move.");
                } else {
                    let piece = this.getCoordinates(input.substring(0,3));
                    let move = this.getCoordinates(input.substring(3,6));
                    if (move.c == "error" || move.a < 0 || move.b < 0 || move.a > 7 || move.b > 7 || piece.c == "error" || piece.a < 0 || piece.b < 0 || piece.a > 7 || piece.b > 7) {
                        console.log(input + " is not a valid move.");
                    } else {
                        let pid = this.getPieceFromCoordinates(piece.a,piece.b,piece.c);
                        move.pieceID = pid;
                        move.textMove = input;
                        fetch('/api/movePiece', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(move)
                        })
                            .then((res) => res.json())
                            .then((res) => {
                                if (res.moveValid) {
                                    let p = this.getPieceByID(move.pieceID);
                                    if (p) {
                                        this.pieceAnimateMove(p, this.state.coordinates[move.a][move.b][move.c]);
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
                                    } else if (this.state.ended) {
                                        this.state.moveDisplay.text = "Game Ended"
                                    } else {
                                        res.whiteMove? this.state.moveDisplay.text = "White Move" :this.state.moveDisplay.text = "Black Move"
                                    }
                                    this.state.whiteScoreDisplay.text = 'White Score is ' + res.score.whiteScore.toString()
                                    this.state.blackScoreDisplay.text = 'Black Score is ' + res.score.blackScore.toString()                  
                                }
                            }) 
                    }

                }
    }

    render() {
        return (<div className="App-layer" >
            <
                BoardScene onSceneMount={
                    this.onSceneMount.bind(this)
                }
            /> </div>
        )
    }
}
