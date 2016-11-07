import * as actionTypes from '../constants/actionTypes';
import * as _ from 'lodash';

const initialState = {};

// a ro service, we don't care about local state
export default function(state = initialState, action) {
  switch (action.type) {
    case actionTypes.AGREEMENTS_SET:
      const {agreements} = action;

      // attributes are an array; the id is not a pk
      return agreements;
    default:
      return state;
  };
}
