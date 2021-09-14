// @flow
import React from "react";
import PlayerInformation from "./components/PlayerInformation";
import Board from "./components/Board";
import "./App.css";

function App() {
  return (
    <div className="App">
      <PlayerInformation className="Player-information" />
      <Board className="App-board" />
    </div>
  );
}

export default App;
