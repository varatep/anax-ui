import {error} from '../util/msgs.js';
import * as actionTypes from '../constants/actionTypes';
import { ANAX_URL_BASE } from '../constants/configuration';
import queryString from 'query-string';
import {device as deviceFetch} from './device';

export function setExpectExistingAccount(expectExistingAccount) {
  return function(dispatch) {
    return dispatch({
      type: actionTypes.ACCOUNT_FORM_SET_EXPECT,
      expectExistingAccount,
    });
  }
}

export function setExpectExistingToken(expectExistingToken, deviceid, devicetoken) {
  return function(dispatch) {
    return dispatch({
      type: actionTypes.ACCOUNT_FORM_SET_EXPECT_TOKEN,
      expectExistingToken,
      deviceid,
      devicetoken,
    });
  }
}

export function generateNodeToken() {
  return function(dispatch) {
    return fetch(`${ANAX_URL_BASE}/token/random`)
        .then((response) => {
          if (!response.ok) {
            throw error(response, 'Error retrieving token from anax.');
          } else {
            return response.json();
          }
        })
        .then((data) => data.token);
  }
}

export function createExchangeUserAccount(exchange_url_base, organization, username, password, email) {
  return function(dispatch) {
    return fetch(`${exchange_url_base}/orgs/${encodeURIComponent(organization)}/users/${encodeURIComponent(username)}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        password,
        email,
        admin: false,
      })
    })
        .then((response) => {
          if (!response.ok) {
            if (response === 400) {
              throw error(response, `Account "${username}" already exists.`);
            } else {
              throw error(response, `Error creating a new Exchange User account "${username}".`);
            }
          } else {
            return response.json();
          }
        });
  }
}

export function accountFormPasswordReset(exchange_url_base, username, orgid) {
  return function(dispatch) {
    return fetch(`${exchange_url_base}/orgs/${encodeURIComponent(orgid)}/users/${encodeURIComponent(username)}/reset`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: {}
      })
    .then((response) => {
      if (!response.ok) {
        if (response.status === 404) {
          throw error(response, `Account "${username}" not found.`);
        } else {
          // something more generic if other
          throw error(response, `Error resetting password for Exchange account "${username}".`);
        }
      } else {
        return response.json();
      }
    });
  }
}

export function accountFormFieldChange(segment, fieldName, value) {

  return function(dispatch) {
    return dispatch({
      type: actionTypes.ACCOUNT_FORM_UPDATE,
      segment: segment,
      fieldName: fieldName,
      value: value
    });
  }
}

export function accountFormMultiFieldChange(segment, updateObj) {
  return function(dispatch) {
    return dispatch({
      type: actionTypes.ACCOUNT_FORM_MULTI_UPDATE,
      updateObj: updateObj
    });
  }
}

export function checkAccountCredentials(exchange_url_base, organization, username, password) {
  return function(dispatch) {

    const params = {
      username: `${organization}/${username}`,
      password,
    };
    const qs = queryString.stringify(params);

    return fetch(`${exchange_url_base}/orgs/${organization}/users/${username}?${qs}`, {
      method: 'GET',
      headers: {'Content-Type': 'application/json'},
    })
        .then((response) => {
          if (!response.ok) {
            if (response.status === 401) {
              throw error(response, 'Invalid credentials');
            }
            throw error(response, 'Unable to confirm credentials');
          } else {
            return response.json();
          }
        });
  }
}


// TODO: factor out duplicate handling of response.ok in fetch handlers below

export function accountFormDataSubmit(exchange_url_base, nodeId, accountForm, expectExistingAccount, pattern, inputToken) {

  let registerExchangeAccount = () => {
    // TODO: expected that we're creating a new account here; use GET first to check (since existing is 400, not 409) and create a visible error

    // return promise
    return fetch(`${exchange_url_base}/orgs/${encodeURIComponent(accountForm.fields.account.organization)}/users/${encodeURIComponent(accountForm.fields.account.username)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'password': accountForm.fields.account.password,
          'email': accountForm.fields.account.email
        })
      }
    )
    .then((response) => {
      if (!response.ok) {
        if (response.status === 400) {
          throw error(response, 'Unable to create a new Exchange account. Please try another account name or retrieve a lost account password with the "Reset Password" button.');
        }

        throw error(response, `Error creating new Exchange account "${accountForm.fields.account.username}".`);

      } else {
        return response.json();
      }
    });
  }

  let registerExchangeDevice = (token) => {

    const getUrl = `${exchange_url_base}/orgs/${encodeURIComponent(accountForm.fields.account.organization)}/nodes`;
    const regUrl = `${exchange_url_base}/orgs/${encodeURIComponent(accountForm.fields.account.organization)}/nodes/${encodeURIComponent(nodeId)}`;

    const authHeaders = {
      'Authorization': authHeaderValue(`${accountForm.fields.account.organization}/${accountForm.fields.account.username}`, accountForm.fields.account.password),
      'Content-Type': 'application/json'
    };

    let regNew = () => {
      return fetch(regUrl, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            'token': accountForm.fields.account.devicetoken || token,
            'name': accountForm.fields.account.devicename || nodeId,
            'pattern': pattern || '',
            'registeredMicroservices': [],
            'msgEndPoint': '',
            'publicKey': '',
            'softwareVersions': {},
          })
        }
      )
      .then((response) => {
        if (!response.ok) {
          if (response.status == 401)
            throw error(response, `Error associating device in Exchange with account "${accountForm.fields.account.username}". The username and password pair was not valid.`);
          else if (response.status == 403)
            throw error(response, `Error associating device in Exchange with account "${accountForm.fields.account.username}". The node is already owned by another user.`);
          else
            throw error(response, `Error associating device in Exchange with account "${accountForm.fields.account.username}". Please check your account and node configurations.`);
        } else {
          return response.json();
        }
      });
    };

    return fetch(getUrl, {
      method: 'GET',
      headers: authHeaders
    })
    .then(response => {
      if (!response.ok) {
        throw error(response, `Error associating device in Exchange with account "${accountForm.fields.account.username}". Please try again.`);
      } else {
        return response.json();
      }
    }).then(json => {
      if (_.includes(_.keys(json.nodes), nodeId)) {

        // do delete first then regNew()
        return Promise.all([
        // delete first
        fetch(regUrl, {
          method: 'DELETE',
          headers: authHeaders
        })
        .then(response => {
          if (!response.ok) {
            throw error(response, `You can not register a device that is already linked to another account. Please try again.`);
          }
        }), regNew()]);
      } else {
        // just do regNew
        return regNew();
      }
    });
  };

  // anax operation
  let retrieveToken = () => {
    return fetch(`${ANAX_URL_BASE}/token/random`)
      .then((response) => {
        if (!response.ok) {
          throw error(response, 'Error retrieving token from anax.');
        } else {
          return response.json();
        }
      })
    .then((data) => data.token);
  }

  // anax operation; TODO: perhaps handle the 409 more gently
  let persistExchangeAccount = (token) => {
    return fetch(`${ANAX_URL_BASE}/node`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'id': accountForm.fields.account.deviceid || nodeId,
          'name': accountForm.fields.account.devicename || nodeId,
          'token': token,
          'organization': accountForm.fields.account.organization,
          'ha_device': false,
          'pattern': pattern.split('/')[1], // [0] is the org
        })
      }
    )
    .then((response) => {
      if (!response.ok) {
        console.log('response back', response);
        if (response.status == 409)
          throw error(response, 'Error persisting exchange account in anax. It\'s possible that the node is already configured.');
        else
          throw error(response, 'Error persisting exchange account in anax.');
      } else {
        return response.json();
      }
    });
  }

  return function(dispatch) {
    let promises = [retrieveToken()];

    if (!expectExistingAccount) {
      promises.push(registerExchangeAccount());
    }

    return Promise.all(promises)
      .then((results) => {
        const token = inputToken || results[0];

        // first two necessary AJAX calls done, now register device, send one to local anax to record the doings and fetch the update
        return registerExchangeDevice(token)
        .then(() => {
          return persistExchangeAccount(token); // another promise that we only want executed if the exchange reg. succeeded
        });
      })
      .then(() => {
        // persisting exchange account worked so do a dispatch of deviceFetch to update our local state
            // TODO: determine if there is a less nest-y way to handle these dependent promise resolutions
            return dispatch(deviceFetch())
              .then(() => {

                // success, so dispatch updated data (which includes account and device (b/c of name), but never the token)
                return dispatch({
                  type: actionTypes.ACCOUNT_SET,
                  accountForm,
                  nodeId
                });
            });
      })
      .catch((error) => {
        // TODO: possible that the registration data b/n the exchange and anax are out of sync so do whatever is necessary to clean up here
        console.log("Error occurred registering account, device, etc.", error);
        // rethrow
        throw error;
      });
  };
};

function authHeaderValue(username, password) {
  return `Basic ${username}:${password}`;
}
