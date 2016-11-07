import * as _ from 'lodash';
import * as note from './notificationManagement';

export function mergeState(existingState, updateGen) {
  if (typeof(updateGen) === 'function') {
    return _.merge({}, existingState, updateGen(existingState));
  } else {
    return _.merge({}, existingState, updateGen);
  }
}

export function mgrUpdateGen(newMgr) {
  return function(state) {
    return {
      notificationMgrs: note.mergeMgrs(state.notificationMgrs, newMgr)
    }
  };
}
