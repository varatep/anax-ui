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

const combineSplit = (hash1, hash2) => {
  if (typeof hash1 === 'undefined') {
    hash1 = {};
  }
  if (typeof hash2 === 'undefined') {
    hash2 = {};
  }

  let newHash = {};

  const hash1Keys = Object.keys(hash1);

  for (let i = 0; i < hash1Keys.length; i++) {
    newHash[hash1Keys[i]] = hash1[hash1Keys[i]];
  }

  const parsedHash2 = parseMSWLSplit(hash2);

  const hash2Keys = Object.keys(parsedHash2);

  for (let i = 0; i < hash2Keys.length; i++) {
    newHash[hash2Keys[i]] = parsedHash2[hash2Keys[i]];
  }

  return newHash;
};

export default function(state = initialState, action) {
  switch (action.type) {
    case actionTypes.SERVICES_SET:
      return Object.assign({}, state, action.services);
    case actionTypes.MICROSERVICES_SET:
      return Object.assign({}, state, {
        microservices: combineSplit(state.microservices, action.microservices),
      });
    case actionTypes.WORKLOADS_SET:
      return Object.assign({}, state, {
        workloads: combineSplit(state.workloads, action.workloads),
      });
    default:
      return state;
  };
}
