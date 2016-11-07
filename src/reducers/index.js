import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import device from './device';
import agreements from './agreements';
import services from './services';
import attributes from './attributes';

import accountForm from './accountForm';
import deviceForm from './deviceForm';
import servicesForm from './servicesForm';

export default combineReducers({
  device,
  services,
  agreements,
  attributes,
  accountForm,
  deviceForm,
  servicesForm,
  routing: routerReducer
});
