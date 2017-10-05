import * as actionTypes from '../constants/actionTypes';
import * as _ from 'lodash';

// a model with the same structure as the API provides, an object wraps the services
const initialState = {
  microservices: undefined,
  workloads: undefined,
};

/**
 * Extracts the organization from a microservice title
 * @param {string} item 
 * @returns {string}
 */
const extractOrg = (item) => {
  return item.split('/')[0];
};

/**
 * Converts a hashmap to an array
 * @param {object} hash 
 * @returns {array}
 */
const hashToArray = (hash) => {
  const keys = Object.keys(hash);
  return _.map(keys, (key) => {
    return { label: key, item: hash[key] };
  });
};

/**
 * Create a hashmap of organizations with microsrvices that belong to that organization
 * @param {array} microservices 
 * @returns {hashmap}
 */
const parseMicroservices = (microservices) => {
  let msHash = {};
  const microservicesArray = hashToArray(microservices);
  
  // add microservice to hash based on orgs
  for (let i = 0; i < microservicesArray.length; i++) {
    const currentOrg = extractOrg(microservicesArray[i].label);

    if (typeof msHash[currentOrg] !== 'undefined') {
      msHash[currentOrg].push(microservicesArray[i].item);
    } else {
      msHash[currentOrg] = [microservicesArray[i].item];
    }
  }

  return msHash;
};

// b/c this is a ro store we don't care about maintaining any local changes to it
export default function(state = initialState, action) {
  switch (action.type) {
    case actionTypes.SERVICES_SET:
      return Object.assign({}, state, action.services);
    case actionTypes.MICROSERVICES_SET:
      return Object.assign({}, state, {
        microservices: parseMicroservices(action.microservices),
      });
    case actionTypes.WORKLOADS_SET:
      return Object.assign({}, state, {
        workloads: action.workloads,
      });
    default:
      return state;
  };
}
