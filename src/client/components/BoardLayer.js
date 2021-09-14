// @flow
import BoardCell from './BoardCell'; 

//class contains own shape information & relative coordinate position based upon size. 
export default class BoardLayer { 
    constructor(props) {
        //update state
        this.state = { 
            layerClickCallback: props.layerClickCallback, 
            cells: []
        } 

        //create box for cell, so can create selection click
        const size = props.size/8; //size of each cell
        for (var a = 0; a < 8 ; a++) {
            let row = []
            for (var b = 0; b < 8 ; b++) {
                let x = size*(a+0.5); 
                let y = size*(b+0.5); 
                row.push(
                    new BoardCell({
                        a, b, c: props.c, 
                        x, y, z: props.z, 
                        size,
                        layerClickCallback: props.layerClickCallback,
                        sceneHandle: props.sceneHandle,
                        selected: false})
                );
            }
            this.state.cells.push(row)
        }
    }

    //sets a certain cell selected.
    setSelected(x,y) { 
        this.state.cells[x][y].setSelected(true)
    }
    clearAllCells() { 
        this.state.cells.forEach(elements => {
            elements.forEach(element => {
                element.setSelected(false)
                element.render()}
             )
        });
    }

    render() {
  
        return;
    }
}
