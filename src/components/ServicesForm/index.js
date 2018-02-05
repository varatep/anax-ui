import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../../actions';

import * as _ from 'lodash';

// import ServicesForm from './presenter';
import ServicesForm from './mswlPresenter';

const mapStateToProps = (state) => {
  return {
    servicesForm: state.servicesForm,
    deviceForm: state.deviceForm,
    attributes: state.attributes,
    configuration: state.configuration,
    patterns: state.patterns,
    services: state.services,
    accountForm: state.accountForm,
    device: state.device,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onMicroservicesGet: bindActionCreators(actions.microservices, dispatch),
    onWorkloadsGet: bindActionCreators(actions.workloads, dispatch),
    onConfigurationGet: bindActionCreators(actions.configuration, dispatch),
    accountFormDataSubmit: bindActionCreators(actions.accountFormDataSubmit, dispatch),
    acconutFormFieldChange: bindActionCreators(actions.accountFormFieldChange, dispatch),
    deviceFormSubmit: bindActionCreators(actions.deviceFormSubmit, dispatch),
    deviceFormSubmitBlockchain: bindActionCreators(actions.deviceFormSubmitBlockchain, dispatch),
    onSetDeviceConfigured: bindActionCreators(actions.deviceConfigured, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ServicesForm);
