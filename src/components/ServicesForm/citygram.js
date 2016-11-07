import {error} from '../../util/msgs.js';
import { CITYGRAM_URL_BASE } from '../../constants/configuration';

import * as _ from 'lodash';

function pCitygram(email, password, rsdname, rsddesc, lat, lon) {
  const body = {
    email: email,
    password: password,
    rsdname: rsdname,
    rsddesc: rsddesc,
    lat: lat,
    lon: lon
  };

  // do a password empty POST first to check account
  return fetch(`${CITYGRAM_URL_BASE}/ibm_signin`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
  });
}

export function citygramAccount(email, password, rsdname, rsddesc, lat, lon) {
  // returns accepted promise w/ {code: 1} iff logged in with existing account or {code: 2} if logged in with new account. rejected promise {code: -1} if not logged in b/c wrong password or {code: -999} if unknown condition

  return new Promise((resolve, reject) => {
    pCitygram(email, password, rsdname, {})
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw error(response, 'Failed to get proper response from Citygram server.')
      }
    })
    .then((data) => {
      const msg = data.msg.toUpperCase();
      switch (msg.toUpperCase()) {
        case 'NOT MATCHED PASSWORD':
          reject({code: -1});
          break;
        case 'SIGNED UP':
          resolve({code: 2});
          break;
        case 'SIGNED IN':
          resolve({code: 1});
          break;
        default:
          throw error(response, 'Unknown Citygram response.');
      }
    })
    .catch((err) => {
      throw error(err, 'Error using Citygram server.');
    });
  });
}

//export function checkCitygramAccount(email, password, rsdname) {
//
//  // always returns a promise that is accepted iff the account is good; 'code' = 0 if password is right, 1 if password is wrong. Rejects with -1 if request succeeded but any other error condition obtained
//  return new Promise((resolve, reject)  => {
//    // try with an empty password to check account, so sneaky!
//    return pCitygram(email, '', rsdname, {}).then((response) => {
//      if (response.ok && 'status' in response.json()) {
//        const d = response.json().status;
//
//        if (d.status.toUpperCase().startsWith('NOT MATCHED PASS')) {
//
//          // TODO: factor out this nested promise business
//          pCitygram(email, password, rsdname, {}).then((response) => {
//            if (response.ok && 'status' in response.json()) {
//              if (d.status.toUpperCase().startsWith('SIGNED IN')) {
//                resolve({'code': 0});
//              } else if (d.status.toUpperCase().startsWith('SIGNED IN')) {
//                resolve({'code': 1});
//              }
//            }
//          }).catch((err) => {
//            throw error(err, 'Error accessing Citygram server.');
//          });
//        } else {
//          // don't care what other error may have resulted, reject and force creation of account
//          reject({'code': -1});
//        }
//      }
//    }).catch((err) => {
//      throw error(err, 'Error accessing Citygram server.');
//    });
//  });
//}
