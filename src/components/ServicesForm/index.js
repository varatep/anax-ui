import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../../actions';

import * as _ from 'lodash';

// import ServicesForm from './presenter';
import ServicesForm from './mswlPresenter';

// takes as input the state from a reducer
// function mapStateToProps(state) {
//   // no need to do any translation here
//   return {
//     servicesForm: state.servicesForm,
//     deviceForm: state.deviceForm,
//     attributes: state.attributes,
//     configuration: state.configuration,
//   };
// }

// function mapDispatchToProps(dispatch) {
//   return {
//     servicesFormFieldChange: bindActionCreators(actions.servicesFormFieldChange, dispatch),
//     servicesFormSubmit: bindActionCreators(actions.servicesFormSubmit, dispatch),
//     servicesFormMultiFieldChange: bindActionCreators(actions.servicesFormMultiFieldChange, dispatch),
//     onAttributesGet: bindActionCreators(actions.attributes, dispatch)
//   };
// }

const mapStateToProps = (state) => {
  return {
    servicesForm: state.servicesForm,
    deviceForm: state.deviceForm,
    attributes: state.attributes,
    configuration: state.configuration,
    services: state.services,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onMicroservicesGet: bindActionCreators(actions.microservices, dispatch),
    onWorkloadsGet: bindActionCreators(actions.workloads, dispatch),
    onConfigurationGet: bindActionCreators(actions.configuration, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ServicesForm);
