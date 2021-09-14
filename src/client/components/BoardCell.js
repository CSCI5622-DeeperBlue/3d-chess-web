// @flow
import React from 'react';
import * as BABYLON from 'babylonjs';

//class contains own shape information & relative coordinate position based upon size. 
export default class BoardCell extends React.Component  { 
    
    constructor(props) {
        super(props);

        //update state
        this.state = { 
        } 

        let cellColor; 
        (props.a+props.b)%2? cellColor = BABYLON.Color3.Black() : cellColor = BABYLON.Color3.White();

        var meshMaterial = new BABYLON.StandardMaterial('cell', props.sceneHandle.scene);
        meshMaterial.diffuseColor = cellColor;
        meshMaterial.emissiveColor = cellColor;
        meshMaterial.specularColor = cellColor;
        meshMaterial.emissiveIntensity = 0.1;
        meshMaterial.alpha = 0.2;    
        
        this.state.mesh = BABYLON.Mesh.CreateBox("board", 1, props.sceneHandle.scene);
        this.state.mesh.position = new BABYLON.Vector3(props.x,props.y,props.z);
        this.state.mesh.scaling = new BABYLON.Vector3(props.size, props.size, 1); 
        this.state.mesh.material = meshMaterial;

        //setup actionManagers
        this.state.mesh.actionManager = new BABYLON.ActionManager(props.sceneHandle.scene);

        //broadcast click to listeners
        this.state.mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnLeftPickTrigger, 
                () => { props.layerClickCallback(props.a, props.b, props.c);}
            )
        );
        this.render() // is this correct?     
    }

    setSelected(selected){
        this.state.selected = selected
        this.state.mesh.material.wireframe = this.state.selected
    }
 
    render() {
      
        this.state.mesh.material.wireframe = this.state.selected
        return;
    }
}
