import queryString from 'query-string';

import * as actionTypes from '../constants/actionTypes';
import { ANAX_URL_BASE } from '../constants/configuration';
import {error} from '../util/msgs';

export function patterns(exchange_api, arch, orgid, username, password) {

  const params = {
    id: `${orgid}/${username}`,
    token: password,
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

export function patchPattern(pattern) {
  return fetch(`${ANAX_URL_BASE}/node`, {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    body: {
      pattern,
    }
  })
      .then((response) => response.json())
      .then((data) => {
        dispatchEvent(patchedPattern(data));
        return data;
      })
      .catch((err) => {
        throw err(err, 'Error saving pattern');
      });
};

export function setPatterns(patterns) {
  return {
    type: actionTypes.PATTERNS_SET,
    patterns,
  };
};

export function patchedPattern(result) {
  return {
    type: actionTypes.PATTERN_PATCHED,
    result,
  };
};