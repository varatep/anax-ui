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
 * @param {array} mswl 
 * @returns {hashmap}
 */
const parseMSWLSplit = (mswl) => {
  let msHash = {};
  const mswlArray = hashToArray(mswl);

  // add microservice to hash based on orgs
  for (let i = 0; i < mswlArray.length; i++) {
    const currentOrg = extractOrg(mswlArray[i].label);

    let item = Object.assign({}, mswlArray[i].item, {
      originalKey: mswlArray[i].label,
    });

    if (typeof msHash[currentOrg] !== 'undefined') {
      msHash[currentOrg].push(item);
    } else {
      msHash[currentOrg] = [item];
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
        microservices: parseMSWLSplit(action.microservices),
      });
    case actionTypes.WORKLOADS_SET:
      return Object.assign({}, state, {
        workloads: parseMSWLSplit(action.workloads),
      });
    default:
      return state;
  };
}
