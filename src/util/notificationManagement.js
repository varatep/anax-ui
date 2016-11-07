import * as _ from 'lodash';
import * as msgs from './msgs';

import {exception} from './dev';

// expects an array mgrs of notificationManagers, each with a segmentName
// returns matching manager
export function segmentMgr(mgrs, segmentName) {
  const matches = _.filter(mgrs, (mgr) => { return mgr.fns.doesManage(segmentName); });
  if (matches.length !== 1) {
    throw exception(`unsupported segment matches among ${_.map(mgrs, (mgr) => { return mgr.segmentName; })} with ${segmentName}`);
  }

  return matches[0];
}

export function mergeMgrs(mgrs, updated) {
  return _.map(mgrs, (mgr) => {
    if (mgr.fns.doesManage(updated.segmentName)) {
      return updated;
    } else {
      return mgr;
    }
  });
}

// a convenience function that will instantiate managers and attach them to the state
export function newManagers(state, segmentNames) {
  state.notificationMgrs = _.map(segmentNames, (name) => {
    return managerInstance(name, state);
  });

  return state;
}

// always returns a new notification manager instance for a segment. The segmentName is the top-level key. This is for easy merging with other segments
export function managerInstance(segmentName, state) {
  const mgr = {
    [segmentName]: {
      fieldValidationResults: {},
      errors: {},
      notifications: {},
    }
  };

  // add a convenience curried function set
  mgr['fns'] = fns(mgr)(segmentName);
  mgr['segmentName'] = segmentName;

  return mgr;
}

// 'field' means 'segment.fieldName';
// always returns a properly-updated state object
export function handleValidationResult(state, validationResult) {

  const fieldUpdate = _.merge({}, state.fields, {[validationResult.segment] : {[validationResult.fieldName] : validationResult.input}});
  const mgr = this.segmentMgr(state.notificationMgrs, validationResult.segment);
  const newMgr = mgr.fns.recordFieldValidationResult(validationResult.fieldName, validationResult);
  return _.merge({}, state, {notificationMgrs: mergeMgrs(state.notificationMgrs, newMgr), fields: fieldUpdate});
}

function fns(mgr) {
  let deepAddOrReplace = function(segmentName, dsId, key, value) {
    if (!segmentName || !dsId || !key || !value) {
      throw this.exception('Illegal input value(s)');
    }

    const ds = _.merge({}, _.omit(mgr[segmentName][dsId], key));
    const newSegment = _.merge({[dsId]: ds}, {
        [dsId]: {
          [key]: value
        }
      });

    // merge existing ds with new one
    return _.merge(managerInstance(segmentName), {[segmentName]: newSegment});
  }

  let clear = function(segmentName, dsId) {
    const newDs = _.merge({}, _.omit(mgr[segmentName], dsId));
    const newSegment = _.merge(newDs, _.omit(mgr[segmentName], dsId));
    return _.merge(managerInstance(segmentName), {[segmentName]: newSegment});
  }

  let values = function(segmentName, dsId, mapFn = (val) => {return val;}, keepFn = (val) => {return (val !== undefined && val !== null);}) {
    if (!segmentName) {
      throw this.exception('Illegal input values');
    }

    return _.filter(_.map(_.values(mgr[segmentName][dsId]), mapFn), keepFn);
  }

  let retrieve = function(segmentName, dsId, key) {
    if (_.has(mgr[segmentName][dsId], key)) {
      return mgr[segmentName][dsId][key];
    } else {
      return null;
    }
  }

  return function(segmentName) {
    const fieldsInError = () => {
      return values(segmentName, 'fieldValidationResults', (result) => {
      if (result.isError()) {
        return result.fieldName;
      } else {
        return "";
      }
    }, (name) => {
      return (name !== "");
    })};

    const errorMsgs = () => {
      return _.curry(values)(segmentName, 'errors');
    };

    const fieldErrorMsgs = () => {
      return _.curry(values)(segmentName, 'fieldValidationResults', (val) => { return val.errorMsg; });
    };

    return {
      // for retrieving a copy of just the data w/out the functions. great for serializing or rendering or whatever
      messages: () => {
        return _.cloneDeep(_.omit(mgr, ['fn']));
      },

      clearDs: _.curry(clear)(segmentName),

      recordFieldValidationResult: _.curry(deepAddOrReplace)(segmentName, 'fieldValidationResults'),
      fieldValidationResult: _.curry(retrieve)(segmentName, 'fieldValidationResults'),

      fieldsInError: fieldsInError,

      fieldIsInError: (fieldName) => {
        return _.includes(fieldsInError(), fieldName);
      },

      fieldErrorMsgs: fieldErrorMsgs,

      error: _.curry(deepAddOrReplace)(segmentName, 'errors'),
      errorMsgs: errorMsgs,

      allErrorMsgs: () => {
        const all = _.union(errorMsgs(), fieldErrorMsgs());
        return _.filter(_.uniq(_.union(all), (msg) => {return msg !== undefined}));
      },

      notification: _.curry(deepAddOrReplace)(segmentName, 'notifications'),
      notifications: () => {
        return _.curry(values)(segmentName, 'notifications');
      },

      doesManage: (segment) => {
        return segmentName === segment;
      }
    };
  };
}
