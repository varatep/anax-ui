import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../../actions';

import DeviceForm from './presenter';

// takes as input the state from a reducer
function mapStateToProps(state) {

  return {
    deviceForm: state.deviceForm,
    configuration: state.configuration,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    deviceFormFieldChange: bindActionCreators(actions.deviceFormFieldChange, dispatch),
    deviceFormMultiFieldChange: bindActionCreators(actions.deviceFormMultiFieldChange, dispatch),
    deviceFormSubmit: bindActionCreators(actions.deviceFormSubmit, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DeviceForm);
