import * as actionTypes from '../constants/actionTypes';
import * as _ from 'lodash';

const initialState = [];

// a ro service, we don't care about local state
export default function(state = initialState, action) {
  switch (action.type) {
    case actionTypes.ATTRIBUTES_SET:
      const {attributes} = action;

      // attributes are an array; the id is not a pk
      return attributes;
    default:
      return state;
  };
}
