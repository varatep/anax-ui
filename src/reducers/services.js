import * as actionTypes from '../constants/actionTypes';
import * as _ from 'lodash';

// a model with the same structure as the API provides, an object wraps the services
const initialState = {};

// b/c this is a ro store we don't care about maintaining any local changes to it
export default function(state = initialState, action) {
  switch (action.type) {
    case actionTypes.SERVICES_SET:
      return action.services;
    default:
      return state;
  };
}
