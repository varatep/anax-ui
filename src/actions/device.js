import {error} from '../util/msgs';

import * as actionTypes from '../constants/actionTypes';
import { ANAX_URL_BASE } from '../constants/configuration';

export function device() {
  return function(dispatch) {
    return fetch(`${ANAX_URL_BASE}/horizondevice`)
      .then((response) => {
        if (!response.ok) {
          throw error(response, 'Error retrieving token from anax.');
        } else {
          return response.json();
        }
      })
      .then((data) => {
        dispatch(setDevice(data));
      });
  };
};

export function setDevice(device) {
  return {
    type: actionTypes.DEVICE_SET,
    device
  };
};
