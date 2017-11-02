import queryString from 'query-string';

import * as actionTypes from '../constants/actionTypes';
import { ANAX_URL_BASE } from '../constants/configuration';
import {error} from '../util/msgs';

export function patterns(env, orgid, username, password) {
  let exchange_api = 'https://exchange.bluehorizon.network/api/v1';
  if (env === 'staging')
    exchange_api = 'https://exchange.staging.bluehorizon.network/api/v1';

  const params = {
    id: `${orgid}/${username}`,
    token: password,
    idfilter: '%arm',
  };
  const qs = queryString.stringify(params);

  return function(dispatch) {
    return fetch(`${exchange_api}/orgs/${orgid}/patterns?${qs}`)
        .then((response) => response.json())
        .then((data) => {
          dispatch(setPatterns(data.patterns));
          return data.patterns;
        })
        .catch((err) => {
          throw error(err, 'Error fetching patterns');
        });
  }
}

export function setPatterns(patterns) {
  return {
    type: actionTypes.PATTERNS_SET,
    patterns,
  };
};
