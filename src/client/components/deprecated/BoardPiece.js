// @flow
import React from 'react';
import * as BABYLON from 'babylonjs';

//class contains own shape information & relative coordinate position based upon size. 
export default function createBoardPiece() { 
    
    constructor(props) {
        super(props);

        //update state
        this.state = { 
          mesh: {},
          selected:props.selected,
          sceneHandle: props.sceneHandle,
          pieceID: props.pieceID
        };
        var assetsManager = new BABYLON.AssetsManager(this.state.sceneHandle.scene);

        var meshTask = assetsManager.addMeshTask(props.pieceID, "", "public/models/",  "skull.babylon");
          meshTask.onSuccess = function (task) {
          this.state.mesh = task.loadedMeshes[0];
          this.state.mesh = task.loadedMeshes[0].position = BABYLON.Vector3.Zero();
        }
        assetsManager.load()
          // The first parameter can be used to specify which mesh to import. Here we import all meshes

          // BABYLON.SceneLoader.ImportMesh("", "public/models/", "skull.babylon", this.state.sceneHandle.scene,function (newMeshes) {
          //   let mesh = newMeshes[0]
          //   mesh.position =new BABYLON.Vector3(50,50,50)

          //   var meshMaterial = new BABYLON.StandardMaterial('black', props.sceneHandle.scene);
          //   meshMaterial.diffuseColor = props.color;
          //   meshMaterial.emissiveColor = props.color;
          //   meshMaterial.specularColor = props.color;
          //   meshMaterial.emissiveIntensity = 0.1;
          //   meshMaterial.alpha = 0.9;

          //   mesh.name = props.pieceID
          //   mesh.position = props.position;
          //   mesh.material = meshMaterial;
          //    //setup actionManagers
          //   mesh.actionManager = new BABYLON.ActionManager(props.sceneHandle.scene);

          //   //broadcast to listeners
          //   mesh.actionManager.registerAction(
          //     new BABYLON.ExecuteCodeAction(
          //       BABYLON.ActionManager.OnLeftPickTrigger, 
          //       () => { props.pieceClickCallback(props.pieceID);})
          //   );

          //    setfunctionCalback(mesh)
          //   }
          // );

        var meshMaterial = new BABYLON.StandardMaterial('black', props.sceneHandle.scene);
        meshMaterial.diffuseColor = props.color;
        meshMaterial.emissiveColor = props.color;
        meshMaterial.specularColor = props.color;
        meshMaterial.emissiveIntensity = 0.1;
        meshMaterial.alpha = 0.9;

        var test = BABYLON.Mesh.CreateBox("piece",15, props.sceneHandle.scene);

        // this.state.mesh = BABYLON.Mesh.ImportMesh( "", "public/models/", "skull.babylon", this.state.sceneHandle.scene)

        // this.state.mesh.position = props.position;
        // this.state.mesh.material = meshMaterial;
 
        // //setup actionManagers
        // this.state.mesh.actionManager = new BABYLON.ActionManager(props.sceneHandle.scene);

        // //broadcast to listeners
        // this.state.mesh.actionManager.registerAction(
        //   new BABYLON.ExecuteCodeAction(
        //     BABYLON.ActionManager.OnLeftPickTrigger, 
        //     () => { props.pieceClickCallback(this.state.pieceID);})
        // );
    }

    setfunctionCalback(mesh) { 
          console.log(mesh)
    }

    setSelected(selected){
      this.state.selected = selected
      this.render()
    }

    animateMove(position){
      var keysPiece = [];
      var animationBox = new BABYLON.Animation(
        "piece", "position", 60, 
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      keysPiece.push({ frame: 0, value: this.state.mesh.position });
      keysPiece.push({ frame: 120, value: position });
      animationBox.setKeys(keysPiece);
      this.state.mesh.animations.push(animationBox);
      this.state.sceneHandle.scene.beginAnimation(this.state.mesh, 0, 120, false);
    };

    render() {
        this.state.mesh.material.wireframe = this.state.selected
        return;
    }
}