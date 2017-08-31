import * as actionTypes from '../constants/actionTypes';
import * as _ from 'lodash';

const initialState = {
  fields: {
    netspeed: {
      enabled: true,
      testalg: 'closest',
      metered: true,
    },
    sdr: {
      enabled: false,
      metered: true,
    },
    pws: {
      enabled: false,
      wugname: '',
      modelType: 'WS2080A,FineOffsetUSB',
      metered: true,
    },
    citygram: {
      enabled: false,
      email: '',
      password: '',
      description: '',
      name: '',
      nyu_associated: false,
      metered: true,
    },
    purpleair: {
      enabled: false,
      devicehostname: '',
      metered: true,
    },
    cputemp: {
      enabled: false,
      metered: true,
    },
    aural: {
      enabled: false,
      sendAudio: false,
      metered: true,
    }
  }
};

// responsible for merging the existing state (state) w/ the state that comes from the action (in action)
export default function(state, action) {

  switch (action.type) {
    case actionTypes.SERVICES_FORM_UPDATE:
      const { segment, fieldName, value } = action;

      const merged = _.merge({}, state, {fields: {[segment]: {[fieldName]: value}}});
			return merged;

		case actionTypes.SERVICES_FORM_MULTI_UPDATE:
			return _.merge({}, state, action.updateObj);

    default:
      return _.merge({}, initialState, state);
  };
}
