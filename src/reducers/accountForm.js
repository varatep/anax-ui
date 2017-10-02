import * as actionTypes from '../constants/actionTypes';
import * as _ from 'lodash';

const initialState = {
	fields: {
		account: {
			password: '',
			username: '',
			email: '',
      devicename: '',
      organization: 'public',
		}
	}
};

// responsible for merging the existing state (state) w/ the state that comes from the action (in action)
export default function(state, action) {
  switch (action.type) {
    case actionTypes.ACCOUNT_FORM_UPDATE:
      const { segment, fieldName, value } = action;

      const merged = _.merge({}, state, {fields: {[segment]: {[fieldName]: value}}});
      return merged;
    case actionTypes.ACCOUNT_FORM_MULTI_UPDATE:
			return _.merge({}, state, action.updateObj);
    default:
      return _.merge({}, initialState, state);
  };
}
