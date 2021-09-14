//separating the API calls out from the actuall display code, this will likely be a live websockets thing
// in the future.


export default class MoveEngine {

    getBoard() {
        // let board =
        // fetch("/api/engine/getBoard")
        // .then((res) => res.json())
        // .then ((res) => console.log(res))
        // .then((board) => this.setState({ board:board }));
        // return this.state.board;
    }

    //evaluates move and returns move if so
    movePiece(pieceID,a,b,c) {
        let pieces;
        this.state.board.whiteMove? pieces = this.state.board.whitePieces : pieces = this.state.board.blackPieces;

        const pieceIndex = pieces.findIndex((p) => { return p.pieceID === pieceID});

        if(pieceIndex >=0) {
            let piece = {pieceID, a, b, c};
            pieces.splice(pieceIndex, 1, piece);
            this.state.board.whiteMove = !this.state.board.whiteMove;
            console.log(this.state.whiteMove)
            return piece;
        }

        console.log(`Error: couldn't find piece ${pieceID}. Looking for White? ${this.state.board.whiteMove}`);
        return null;

    }

}
