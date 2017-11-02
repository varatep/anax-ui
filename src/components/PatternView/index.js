import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../../actions';

// import ServicesForm from './presenter';
import PatternView from './presenter';

const mapStateToProps = (state) => {
  return {
    servicesForm: state.servicesForm,
    deviceForm: state.deviceForm,
    attributes: state.attributes,
    configuration: state.configuration,
    patterns: state.patterns,
    services: state.services,
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    onPatternsGet: bindActionCreators(actions.patterns, dispatch),
    onMicroservicesGet: bindActionCreators(actions.microservices, dispatch),
    onWorkloadsGet: bindActionCreators(actions.workloads, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(PatternView);
