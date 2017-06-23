import { createStore, applyMiddleware } from 'redux';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import { browserHistory } from 'react-router';
import { routerMiddleware } from 'react-router-redux';
import rootReducer from '../reducers/index';

import {loadState, saveState} from '../util/localStorage';

import * as _ from 'lodash';

const logger = createLogger();
const router = routerMiddleware(browserHistory);

const createStoreWithMiddleware = applyMiddleware(thunk, router, logger)(createStore);

export default function mainStore(initialState) {
  const persistedState = loadState();

  // TODO: determine if it's cool to replace initialState with persistedState here
  const store = createStoreWithMiddleware(rootReducer, _.merge(initialState, persistedState));

  store.subscribe(() => {
    saveState({
      // allows saving to local storage of passwords from forms; up to the page to hose passwords before route changes
      // accountForm: store.getState().accountForm,
      deviceForm: store.getState().deviceForm,
      servicesForm: store.getState().servicesForm,
    });
  });

  return store;
}
