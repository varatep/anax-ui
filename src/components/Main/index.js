import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../../actions';
import Main from './presenter';

// takes as input the state from a reducer
function mapStateToProps(state) {
  // no need to do any translation here
  return state;
}

function mapDispatchToProps(dispatch) {
  return {
    onDeviceGet: bindActionCreators(actions.device, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Main);
