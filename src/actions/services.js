import * as actionTypes from '../constants/actionTypes';
import { ANAX_URL_BASE } from '../constants/configuration';
import {error} from '../util/msgs';

// TODO: factor our common fetch ... then functionality here and in device

export function services() {
  return function(dispatch) {
    return fetch(`${ANAX_URL_BASE}/service`)
      .then((response) => response.json())
      .then((data) => {
        dispatch(setServices(data.services));

        return data.services;
      })
      .catch((err) => {
        throw error(err, 'error fetching services');
      });
  };
};

export function setServices(services) {
  return {
    type: actionTypes.SERVICES_SET,
    services: services
  };
};
