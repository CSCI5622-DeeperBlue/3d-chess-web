import React from 'react';
import ReactDOM from 'react-dom';
import App from '../src/App';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});

// tests the illegal moveset of bishops
// should fail if bishops can make an illegal move
legalMoveset() {

  return "No illegal moves", // stub return
}
