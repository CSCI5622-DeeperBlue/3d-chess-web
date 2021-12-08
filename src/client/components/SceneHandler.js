// @flow
import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import 'babylonjs-loaders';

import BoardLayer from './BoardLayer';

export default class SceneHandler {
    constructor(sceneHandle, board, layerClickCallback, pieceClickCallback) {

        //controls board sizing.
        const boardSize = 200;
        const zOffset = 50;

        this.layers = [];
        this.sceneHandle = sceneHandle;
        this.engine = BABYLON.Engine;
        this.scene = BABYLON.Scene;
        this.canvas = BABYLON.canvas;
        // https://doc.babylonjs.com/how_to/how_to_use_assetsmanager
        this.assetsManager = new BABYLON.AssetsManager(this.sceneHandle.scene);
        this.coordinates = this.generateBoardIndexes(boardSize, zOffset);
        this.initializeScene(layerClickCallback);

        // this.drawBoard(board, pieceClickCallback)
    }

    // initialize scene handler.
    initializeScene(layerClickCallback) {
         // This creates and positions a free camera (non-mesh)
        this.camera = new BABYLON.ArcRotateCamera(
            "camera1", 2.9, 1.3, 300,
            new BABYLON.Vector3(this.boardSize / 2, this.boardSize / 2, 50),
            this.sceneHandle.scene
        );

        this.camera.upVector = new BABYLON.Vector3(0, 0, 1);
        this.camera.attachControl(this.sceneHandle.canvas, true);

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
        this.moveDisplay = moveDisplay;

        var whiteScoreDisplay = new GUI.TextBlock();
        whiteScoreDisplay.text = "White Score";
        whiteScoreDisplay.height = "40px";
        whiteScoreDisplay.color = "white";
        whiteScoreDisplay.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        whiteScoreDisplay.paddingTop = "10px";
        panel3.addControl(whiteScoreDisplay);
        this.whiteScoreDisplay = whiteScoreDisplay;

        var blackScoreDisplay = new GUI.TextBlock();
        blackScoreDisplay.text = "Black Score";
        blackScoreDisplay.height = "40px";
        blackScoreDisplay.color = "white";
        blackScoreDisplay.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        blackScoreDisplay.paddingTop = "10px";
        panel3.addControl(blackScoreDisplay);
        this.blackScoreDisplay = blackScoreDisplay;

        var button = new GUI.Button.CreateSimpleButton("but", "Start Lc0 as White");
        button.height = "40px";
        button.background = "gray";
        button.color="white";
        button.onPointerClickObservable.add(function() {
            fetch("/api/startEngine")
            .then((res) => res.json())
            .then((data) => {
                this.SceneHandlepieceAnimateMovePgn(data.opponentMove)
                console.log(data);
            });
        });
        panel3.addControl(button);

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

        console.log('creating layers')
        let i;
        for (i = 0; i < 3; i++) {
            this.layers.push(new BoardLayer({
                c: i,
                size: this.boardSize,
                layerClickCallback: layerClickCallback.bind(this),
                z: this.zOffset * i,
                sceneHandle: this.sceneHandle
            }))
        }

        this.sceneHandle.engine.runRenderLoop(() => {
            if (this.sceneHandle.scene) {
                this.sceneHandle.scene.render();
            }
        });
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

    // takes board format returned by /api/getBoard and draws it
    drawBoard(board, pieceClickCallback){
        // TODO: can speed up load by pre-importing then copying.
        console.log(board)
        board.whitePieces.forEach(
            p => {
                var meshTask = this.assetsManager.addMeshTask(p.pieceID, "", "public/models/", `${p.type.name}.obj`);
                meshTask.onSuccess = (task) => {
                    this.configurePieceMesh(task.loadedMeshes[0], p.pieceID,
                        this.coordinates[p.a][p.b][p.c],
                        BABYLON.Color3.White()).bind(this);
                }
            }
        );
        this.board.blackPieces.forEach(
            p => {
                var meshTask = this.assetsManager.addMeshTask(p.pieceID, "", "public/models/", `${p.type.name}.obj`);
                meshTask.onSuccess = (task) => {
                    this.configurePieceMesh(task.loadedMeshes[0], p.pieceID,
                        this.coordinates[p.a][p.b][p.c],
                        BABYLON.Color3.Black(),
                        pieceClickCallback
                        ).bind(this);
                }
            }
        );
        this.assetsManager.load()
    }

    //helper for component did mount
    //used to configure mesh after initial mesh load
    configurePieceMesh(mesh, pieceID, position, color, pieceClickCallback) {
        mesh.name = pieceID

        var meshMaterial = new BABYLON.StandardMaterial(color, this.sceneHandle.scene);
        meshMaterial.diffuseColor = color;
        meshMaterial.emissiveColor = color;
        meshMaterial.specularColor = color;
        meshMaterial.emissiveIntensity = 0.1;

        mesh.position = position;
        mesh.material = meshMaterial;

        //setup actionManagers
        mesh.actionManager = new BABYLON.ActionManager(this.sceneHandle.scene);

        //broadcast to listeners
        mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnLeftPickTrigger,
                () => {
                    pieceClickCallback(pieceID);
                })
        );
        this.pieces.push(mesh)
    }

    //expects a move in a,b,c coordinates.
    pieceAnimateMove(mesh, move) {
        var position = this.coordinates[move.a][move.b][move.c]
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
            frame: 120,
            value: position
        });
        animationBox.setKeys(keysPiece);
        mesh.animations.push(animationBox);
        this.scene.beginAnimation(mesh, 0, 120, false);
    }

    // sets all meshes unselected
    setAllUnselected() {
        this.layers.forEach(l => l.clearAllCells())
        this.pieces.forEach(p => p.material.wireframe = false)
    }
}
