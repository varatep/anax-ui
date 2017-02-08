import * as actionTypes from '../constants/actionTypes';

const initialState = {};

// responsible for merging the existing state (state) w/ the state that comes from the action (in action)
export default function(state = initialState, action) {
  switch (action.type) {
    case actionTypes.CONFIGURATION_SET:
      console.log('action.type: ', action.type);
      return setConfiguration(state, action);
    default:
      return state;
  };
}

function setConfiguration(state, action) {
  const { configuration } = action;

  return configuration;
}
