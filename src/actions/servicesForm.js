import {error} from '../util/msgs.js';
import * as actionTypes from '../constants/actionTypes';
import { ANAX_URL_BASE } from '../constants/configuration';
import * as pays from './servicesRequests';
import * as _ from 'lodash';

export function servicesFormFieldChange(segment, fieldName, value) {
  return dispatch => dispatch({
    type: actionTypes.SERVICES_FORM_UPDATE,
    segment: segment,
    fieldName: fieldName,
    value: value
  });
}

export function servicesFormMultiFieldChange(segment, updateObj) {
  return function(dispatch) {
    return dispatch({
      type: actionTypes.SERVICES_FORM_MULTI_UPDATE,
      updateObj: updateObj
    });
  };
}

// useGps is in here only for compat
export function servicesFormSubmit(attributes, servicesForm) {

	const loc = _.filter(attributes, (attr) => { return (attr.id === 'location' && attr.sensor_urls.length === 0); });
	if (loc.length !== 1) {
		throw error({}, 'Unexpected attributes state; looking for single location');
	}

	let doFetch = (body) => {
    return fetch(`${ANAX_URL_BASE}/service`,
			{
        method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
	}

	const promises = _.filter(_.map(servicesForm.fields, (wl, name) => {
		if (wl.enabled) {
			switch (name) {
				case 'citygram':
					return doFetch(pays.citygramService(wl.description, wl.email, wl.name, wl.password, 256));
					break;
				case 'cputemp':
					return doFetch(pays.cputempService(128));
					break;
				case 'netspeed':
					return doFetch(pays.netspeedService(wl.testalg, 128));
					break;
				case 'purpleair':
					return doFetch(pays.purpleairService(wl.devicehostname, 128));
					break;
				case 'pws':
					return doFetch(pays.pwsService(wl.wugname, wl.model, wl.type, 128));
					break;
				case 'sdr':
					return doFetch(pays.sdrService(128));
					break;
				default:
					throw error({}, 'Unknown workload name', name);
			}
		}
	}), (pr) => { return !!pr; });

  // compat; only here so that it gets created at the same time as other services
  promises.push(doFetch(pays.locationService(loc[0].mappings.use_gps, 128)));

  // TODO: this will only work first-time; needs to be smarter about conflicts and such to be re-executable
  return function(dispatch) {
    return Promise.all(promises)
		.then((responses) => {

			_.each(responses, (resp, key) => {
				if (resp.ok) {
					console.log('Successful registration of service', resp);
				} else {
					throw error(resp, 'Service registration failed');
				}
			});
		});
  };
}
