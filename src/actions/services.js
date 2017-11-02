import queryString from 'query-string';

import * as actionTypes from '../constants/actionTypes';
import { ANAX_URL_BASE } from '../constants/configuration';
import {error} from '../util/msgs';

// TODO: factor our common fetch ... then functionality here and in device

export function services() {
  return function(dispatch) {
    return fetch(`${ANAX_URL_BASE}/service`)
        .then((response) => response.json())
        .then((data) => {
          dispatch(setServices(data.services));

          return data.services;
        })
        .catch((err) => {
          throw error(err, 'error fetching services');
        });
  };
};

export function microservices(env, orgid, username, password) {
  let exchange_api = 'https://exchange.bluehorizon.network/api/v1';
  if (env === 'staging')
    exchange_api = 'https://exchange.staging.bluehorizon.network/api/v1';

    const params = {
      id: `${orgid}/${username}`,
      token: password,
      arch: 'arm',
    };
    const qs = queryString.stringify(params);

  return function(dispatch) {
    return fetch(`${exchange_api}/orgs/${orgid}/microservices?${qs}`)
        .then((response) => response.json())
        .then((data) => {
          dispatch(setMicroservices(data.microservices));
          return data.microservices;
        })
        .catch((err) => {
          throw error(err, 'Error fetching microservices');
        });
  };
};

export function workloads(env, orgid, username, password) {
  let exchange_api = 'https://exchange.bluehorizon.network/api/v1';
  if (env === 'staging')
    exchange_api = 'https://exchange.staging.bluehorizon.network/api/v1';

  const params = {
    id: `${orgid}/${username}`,
    token: password,
    arch: 'arm',
  };
  const qs = queryString.stringify(params);

  return function(dispatch) {
    return fetch(`${exchange_api}/orgs/${orgid}/workloads?${qs}`)
        .then((response) => response.json())
        .then((data) => {
          dispatch(setWorkloads(data.workloads));
          return data.workloads;
        })
        .catch((err) => {
          throw error(err, 'Error fetching workloads');
        });
  };
};

export function setServices(services) {
  return {
    type: actionTypes.SERVICES_SET,
    services,
  };
};

export function setMicroservices(microservices) {
  return {
    type: actionTypes.MICROSERVICES_SET,
    microservices,
  };
};

export function setWorkloads(workloads) {
  return {
    type: actionTypes.WORKLOADS_SET,
    workloads,
  };
};