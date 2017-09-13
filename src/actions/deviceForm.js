import {error} from '../util/msgs.js';
import * as actionTypes from '../constants/actionTypes';
import * as validator from '../util/validation';
import { ANAX_URL_BASE, IP_API_URL_BASE } from '../constants/configuration';

export function deviceFormSubmit(deviceForm) {
  return function(dispatch) {
    // N.B. we leave the registration of the 'location' service to the next page for now; should probably be here in the future
    // TODO: fix the API to accept floats and not strings

    return fetch(`${ANAX_URL_BASE}/service/attribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'location',
        short_type: 'location',
        label: 'Registered Location Facts',
        publishable: false,
        mappings: {
          lat: String(deviceForm.fields.location.latitude),
          lon: String(deviceForm.fields.location.longitude),
          user_provided_coords: deviceForm.fields.location.user_provided_coords,
          use_gps: deviceForm.fields.motion.usegps
        }
      })
    })
    .then((response) => {
      if (!response.ok) {
        throw error(response, 'Error saving location information in anax.');
      } else {
        return response.json();
      }
    });
  };
}

export function deviceFormSubmitBlockchain(deviceForm) {
  return function(dispatch) {
    let protocols = [{Basic:[]}];
    if (deviceForm.fields.blockchain.usebc) {
      protocols = [
        {
          "Citizen Scientist": [
            {
              "name": "bluehorizon",
              "type": "ethereum"
            }
          ]
        }
      ];
    }
    return fetch(`${ANAX_URL_BASE}/service/attribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'agreementprotocol',
        short_type: 'agreementprotocol',
        label: 'Agreement Protocols',
        publishable: true,
        mappings: {
          protocols
        }
      })
    })
    .then((response) => {
      if (!response.ok) {
        throw error(response, 'Error saving Blockchain configuration in anax.');
      } else {
        return response.json();
      }
    });
  }
}

export function deviceFormFieldChange(segment, fieldName, value) {

  return function(dispatch) {
    return dispatch({
      type: actionTypes.DEVICE_FORM_UPDATE,
      segment: segment,
      fieldName: fieldName,
      value: value
    });
  }
}

export function deviceFormMultiFieldChange(segment, updateObj) {
  return function(dispatch) {
    return dispatch({
      type: actionTypes.DEVICE_FORM_MULTI_UPDATE,
      updateObj: updateObj
    });
  }
}
