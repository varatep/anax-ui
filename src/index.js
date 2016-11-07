import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRedirect, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import { Provider } from 'react-redux';

import * as actions from './actions';
import mainStore from './stores/mainStore';

import Main from './components/Main';
import Dashboard from './components/Dashboard';
import AccountForm from './components/AccountForm';
import Setup from './components/Setup';
import DeviceForm from './components/DeviceForm';
import ServicesForm from './components/ServicesForm';

const store = mainStore();

const history = syncHistoryWithStore(browserHistory, store);

ReactDOM.render(
  <Provider store={store}>
    <Router history={history}>
      <Route path="/" component={Main}>
        <IndexRedirect to="dashboard" />
        <Route path="dashboard" component={Dashboard} />
        <Route path="account" component={AccountForm} />
        <Route path="setup" component={Setup}>
          <IndexRedirect to="device" />
          <Route path="device" component={DeviceForm} />
          <Route path="services" component={ServicesForm} />
        </Route>
      </Route>
    </Router>
  </Provider>,
  document.getElementById('root')
);
