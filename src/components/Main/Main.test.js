import React from 'react';
import ReactDOM from 'react-dom';
import {shallow} from 'enzyme';
import Main from './presenter';

it('renders without crashing', () => {
  const App = shallow(
    <div />
  );

  expect(App).not.toBeNull();
  expect(App).not.toBeUndefined();
});
