// @flow
import React from 'react';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';

// type SceneProps = {
//   engineOptions : null,
//   adaptToDeviceRatio : null,
//   onSceneMount : null,
//   width : null,
//   height : null
// };

export default class BoardScene extends React.Component {

  constructor(props) {
    super(props);
    this.engine = null; 
    this.scene = null;
    this.canvas = null;
  }

  onResizeWindow = () => {
    if (this.engine) {
      this.engine.resize();
    }
  }

  //initializes board. 
  componentDidMount () {
    this.engine = new BABYLON.Engine(
        this.canvas,
        true,
        this.props.engineOptions,
        this.props.adaptToDeviceRatio
    );

    let scene = new BABYLON.Scene(this.engine);
    this.scene = scene;

    if (typeof this.props.onSceneMount === 'function') {
      this.props.onSceneMount({
        scene,
        engine: this.engine,
        canvas: this.canvas
      });
    } else {
      console.error('error in BoardScene,onSceneMount function not available');
    }

    // Resize the babylon engine when the window is resized
    window.addEventListener('resize', this.onResizeWindow);
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.onResizeWindow);
  }

  onCanvasLoaded = c => {
    if (c !== null) {
      this.canvas = c;
    }
  }
  
  render () {
    // 'rest' can contain additional properties that you can flow through to canvas:
    // (id, className, etc.)
    let { width, height, ...rest } = this.props;

    let opts = {};

    if (width !== undefined && height !== undefined) {
      opts.width = width;
      opts.height = height;
    }

    return (
      <canvas className = "App-canvas"
        {...opts}
        ref={this.onCanvasLoaded}
      />
    )
  }
}
