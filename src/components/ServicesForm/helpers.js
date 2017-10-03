import {IP_API_URL_BASE} from '../../constants/configuration.js';
import * as validator from '../../util/validation';
import * as note from '../../util/notificationManagement';
import {fieldSplit} from '../../util/names';
import {error} from '../../util/msgs.js';
import * as _ from 'lodash';

import { CITYGRAM_URL_BASE } from '../../constants/configuration';

export function labelContains(microserviceLabel, comparator) {
  if (microserviceLabel.indexOf(comparator) >= 0) return true;
  return false;
}

export function doValidation(segment, fieldName, text) {
  // could chain multiple validators, all that's required is we return a promise; could do more inbetween if desired
  switch (fieldName) {
    case 'devicehostname':
      return validator.validHostname(segment, fieldName, text, '');
    case 'email':
      return validator.validEmail(segment, fieldName, text);
    case 'name':
      return validator.validText(segment, fieldName, text);
    case 'password':
      return validator.validText(segment, fieldName, text);
    default:
      console.log('noop validation / type coercion for fieldName', fieldName);
      return validator.noop(segment, fieldName, text);
  }
}

export function fieldIsInError(ctxt, field) {
  const [segment, fieldName] = fieldSplit(field);
  return note.segmentMgr(ctxt.state.notificationMgrs, segment).fns.fieldIsInError(fieldName);
}

// TODO: check that this works ok
function pCitygram(email, password, rsdname, bodySupplement) {
  const body = _.merge(
    {
    'email': email,
    'password': password,
    'rsdname': rsdname
    },
    bodySupplement
  );

  // do a password empty POST first to check account
  return fetch(`${CITYGRAM_URL_BASE}/ibm_signin`,
    {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
  });
}

export function checkCitygramAccount(email, password, rsdname) {
  // always returns a promise that is accepted iff the account is good; 'code' = 0 if password is right, 1 if password is wrong. Rejects with -1 if request succeeded but any other error condition obtained
  return function(dispatch) {
    return new Promise((resolve, reject)  => {
      // try with an empty password to check account, so sneaky!
      return pCitygram(email, '', rsdname, {}).then((response) => {
        if (response.ok && 'status' in response.json()) {
          const d = response.json().status;

          if (d.status.toUpperCase().startsWith('NOT MATCHED PASS')) {

            // TODO: factor out this nested promise business
            pCitygram(email, password, rsdname, {}).then((response) => {
              if (response.ok && 'status' in response.json()) {
                if (d.status.toUpperCase().startsWith('SIGNED IN')) {
                  resolve({'code': 0});
                } else if (d.status.toUpperCase().startsWith('SIGNED IN')) {
                  resolve({'code': 1});
                }
              }
            }).catch((err) => {
              throw error(err, 'Error accessing Citygram server.');
            });
          } else {
            // don't care what other error may have resulted, reject and force creation of account
            reject({'code': -1});
          }
        }
      }).catch((err) => {
        throw error(err, 'Error accessing Citygram server.');
      });
    });
  };
};

export function createCitygramAccount(email, password) {
  return dispatch => dispatch({
  });
};
