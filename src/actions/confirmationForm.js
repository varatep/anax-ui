import {error} from '../util/msgs.js';
import * as actionTypes from '../constants/actionTypes';
import { ANAX_URL_BASE } from '../constants/configuration';

export function confirmationFormDataSubmit(deviceForm, servicesForm, confirmationForm) {
  return function(dispatch) {
    return fetch(`${ANAX_URL_BASE}/service/attribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "id": "location",
				"short_type": "location",
				"label": "Registered Location Facts",
				"publishable": false,
				"mappings": {
					"lat": deviceForm.latitude,
					"lon": deviceForm.longitude,
					"user_provided_coords": true,
					"use_gps": deviceForm.usegps
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
};
