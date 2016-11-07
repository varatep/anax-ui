import * as actionTypes from '../constants/actionTypes';
import { ANAX_URL_BASE } from '../constants/configuration';

// dispatches and returns promise so it can be used elsewhere
export function attributes() {
  return function(dispatch) {
    return fetch(`${ANAX_URL_BASE}/service/attribute`)
      .then((response) => response.json())
      .then((data) => {
        dispatch({
          type: actionTypes.ATTRIBUTES_SET,
          attributes: data.attributes
        });

        return data;
      })
      .catch((error) => {
        console.error(error);
      });
  };
};
