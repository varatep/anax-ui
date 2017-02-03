import {error} from '../util/msgs';

import * as actionTypes from '../constants/actionTypes';
import { ANAX_URL_BASE } from '../constants/configuration';

export function configuration() {
  return function(dispatch) {
    return fetch(`${ANAX_URL_BASE}/status`)
      .then((response) => {
        if (!response.ok) {
          throw error(response, 'Error retrieving token from anax.');
        } else {
          return response.json();
        }
      })
      .then((data) => {
        const {configuration} = data;

        dispatch(
          {
            type: actionTypes.CONFIGURATION_SET,
            configuration: configuration
          }
        );

        // in case caller wants to use it immediately in the view
        return configuration;
      });
  };
};
