import * as actionTypes from '../constants/actionTypes';
import * as _ from 'lodash';

const initialState = {};

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
 * Create a hashmap of organizations with patterns that belong to that organization
 * @param {array} pattern 
 * @returns {hashmap}
 */
const parsePattern = (pattern) => {
  let patternHash = {};
  const patternArray = hashToArray(pattern);

  // add microservice to hash based on orgs
  for (let i = 0; i < patternArray.length; i++) {
    const currentOrg = extractOrg(patternArray[i].label);

    let item = Object.assign({}, patternArray[i].item, {
      originalKey: patternArray[i].label,
    });

    if (typeof patternHash[currentOrg] !== 'undefined') {
      patternHash[currentOrg].push(item);
    } else {
      patternHash[currentOrg] = [item];
    }
  }

  return patternHash;
};

export default function(state = initialState, action) {
  switch(action.type) {
    case actionTypes.PATTERNS_GET:
      return Object.assign({}, state);
    case actionTypes.PATTERNS_SET:
      return Object.assign({}, state, parsePattern(action.patterns));
    default:
      return state;
  }
}