import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import device from './device';
import agreements from './agreements';
import services from './services';
import attributes from './attributes';
import configuration from './configuration';

import accountForm from './accountForm';
import deviceForm from './deviceForm';
import servicesForm from './servicesForm';
import patterns from './patterns';

export default combineReducers({
  device,
  services,
  agreements,
  attributes,
  configuration,
  accountForm,
  deviceForm,
  servicesForm,
  patterns,
  routing: routerReducer
});
