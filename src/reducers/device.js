import * as actionTypes from '../constants/actionTypes';

const initialState = {'isFetching': true};

// responsible for merging the existing state (state) w/ the state that comes from the action (in action)
export default function(state = initialState, action) {
  switch (action.type) {
    case actionTypes.DEVICE_SET:
      return setDevice(state, action);
    default:
      return state;
  };
}

function setDevice(state, action) {
  const { device } = action;

  // we don't care about the old state (esp. isFetching) so we overwrite it here
  return device;
}
