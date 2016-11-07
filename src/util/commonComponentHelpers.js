import {IP_API_URL_BASE} from '../constants/configuration.js';
import * as validator from './validation';
import * as note from './notificationManagement';
import {fieldSplit} from './names';
import {error} from './msgs.js';

export function latLonFetch() {
  // fetches lat / lon from outside service to pre-fill lat / lon fields, returns promise
  return fetch(`${IP_API_URL_BASE}/json`,
  {
    method: 'GET',
    headers: {
      // get around CORS for this
     'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
    }
  })
  .then((response) => {
    // 0 b/c of opaque filtered response; TODO: is this still true?
    if (!(response.ok || response.status === 0)) {
      throw error(response, `Error fetching Latitude and Longitude estimates from http://ip-api.com/. Please check ad blockers or other system components that might block outbound requests to this service.`);
    } else {
      return response.json();
    }
  })
  .then((data) => {
    return {
      latlon: {
        latitude: data.lat,
        longitude: data.lon
      },
      geo_alias: {
        city: data.city,
        country: data.countryCode
      }
    };
  })
  .catch((err) => {
    throw error({}, `Error fetching Latitude and Longitude estimates from http://ip-api.com/. Please check ad blockers or other system components that might block outbound requests to this service.`);
  });
}

export function fieldIsInError(ctxt, field) {
  const [segment, fieldName] = fieldSplit(field);
  return note.segmentMgr(ctxt.state.notificationMgrs, segment).fns.fieldIsInError(fieldName);
}
