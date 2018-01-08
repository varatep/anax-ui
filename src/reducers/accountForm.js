import * as actionTypes from '../constants/actionTypes';
import * as _ from 'lodash';

const initialState = {
	fields: {
		account: {
			password: '',
			username: '',
			email: '',
      devicename: '',
      deviceid: '',
      devicetoken: '',
      organization: 'public',
    },
  },
  expectExistingAccount: false,
  expectExistingToken: false,
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
    case actionTypes.ACCOUNT_FORM_SET_EXPECT:
      return _.merge({}, state, {expectExistingAccount: action.expectExistingAccount});
    case actionTypes.ACCOUNT_FORM_SET_EXPECT_TOKEN:
      return _.merge({}, state, {expectExistingToken: action.expectExistingToken, fields: {account: {username: action.deviceid, password: action.devicetoken}}});
    default:
      return _.merge({}, initialState, state);
  };
}
