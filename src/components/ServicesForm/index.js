import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../../actions';

import * as _ from 'lodash';

import ServicesForm from './presenter';

// takes as input the state from a reducer
function mapStateToProps(state) {
  // no need to do any translation here
  return {
    servicesForm: state.servicesForm,
    deviceForm: state.deviceForm,
    attributes: state.attributes
  };
}

function mapDispatchToProps(dispatch) {
  return {
    servicesFormFieldChange: bindActionCreators(actions.servicesFormFieldChange, dispatch),
    servicesFormSubmit: bindActionCreators(actions.servicesFormSubmit, dispatch),
    servicesFormMultiFieldChange: bindActionCreators(actions.servicesFormMultiFieldChange, dispatch),
    onAttributesGet: bindActionCreators(actions.attributes, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ServicesForm);
