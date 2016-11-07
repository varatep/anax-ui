import * as actionTypes from '../constants/actionTypes';
import { ANAX_URL_BASE } from '../constants/configuration';

// dispatches and returns promise so it can be used elsewhere
export function agreements() {
  return function(dispatch) {
    return fetch(`${ANAX_URL_BASE}/agreement`)
      .then((response) => response.json())
      .then((data) => {
        dispatch({
          type: actionTypes.AGREEMENTS_SET,
          agreements: data.agreements
        });

        return data;
      })
      .catch((error) => {
        console.error(error);
      });
  };
};
