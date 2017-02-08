import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../../actions';
import AccountForm from './presenter';

function mapStateToProps(state) {
  return {
    accountForm: state.accountForm,
    device: state.device,
    configuration: state.configuration
  };
}

function mapDispatchToProps(dispatch) {
  return {
    accountFormFieldChange: bindActionCreators(actions.accountFormFieldChange, dispatch),
    accountFormMultiFieldChange: bindActionCreators(actions.accountFormMultiFieldChange, dispatch),
    accountFormPasswordReset: bindActionCreators(actions.accountFormPasswordReset, dispatch),
    accountFormDataSubmit: bindActionCreators(actions.accountFormDataSubmit, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountForm);
