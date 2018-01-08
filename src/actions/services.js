import queryString from 'query-string';

import * as actionTypes from '../constants/actionTypes';
import { ANAX_URL_BASE } from '../constants/configuration';
import {error} from '../util/msgs';

// TODO: factor our common fetch ... then functionality here and in device

export function services() {
  return function(dispatch) {
    return fetch(`${ANAX_URL_BASE}/microservice/config`)
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

export function microservices(exchange_api, orgid, username, password, queryOrg) {
    const params = {
      id: `${orgid}/${username}`,
      token: password,
    };
    const qs = queryString.stringify(params);

  return function(dispatch) {
    return fetch(`${exchange_api}/orgs/${queryOrg}/microservices?${qs}`)
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

export function workloads(exchange_api, orgid, username, password, queryOrg) {
  const params = {
    id: `${orgid}/${username}`,
    token: password,
  };
  const qs = queryString.stringify(params);

  return function(dispatch) {
    return fetch(`${exchange_api}/orgs/${queryOrg}/workloads?${qs}`)
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

export function workloadConfig(workloads) {
  return fetch(`${ANAX_URL_BASE}/workload/config`, {
    method: 'POST',
  })
      .then((response) => response.json())
      .then((data) => {
        return data;
      })
      .catch((err) => {
        throw error(err, 'Error setting workload config');
      });
};

export function microserviceConfig(microservices) {
  return fetch(`${ANAX_URL_BASE}/microservice/config`)
      .then((response) => response.json())
      .then((data) => {
        return data;
      })
      .catch((err) => {
        throw error(err, 'Error setting microservice config');
      });
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