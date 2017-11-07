import * as actionTypes from '../constants/actionTypes';
import * as _ from 'lodash';

// N.B. must not use undefined here or react thinks the input is uncontrolled; react recommends empty string
export const initialState = {
	fields: {
    location: {
			latitude: '',
			longitude: '',
			user_provided_coords: true
		},
		motion: {
			usegps: false
		},
		blockchain: {
			usebc: false
		},
		pattern: {
			usepattern: false
		},
	}
};

// responsible for merging the existing state (state) w/ the state that comes from the action (in action)
export default function(state, action) {

  switch (action.type) {
    case actionTypes.DEVICE_FORM_UPDATE:
      const { segment, fieldName, value } = action;
      return _.merge({}, state, {fields: {[segment]: {[fieldName]: value}}});

    case actionTypes.DEVICE_FORM_MULTI_UPDATE:
      return _.merge({}, state, action.updateObj);
    default:
			// b/c initialState has some keys that the persistent storage doesn't (on purpose), always merge the initial state w/ the incoming one
			return _.merge({}, initialState, state);
  }
}
