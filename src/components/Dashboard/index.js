import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../../actions';
import Dashboard from './presenter';

function mapStateToProps(state) {
  const { agreements, attributes, device, services } = state;

  return {
    attributes: attributes,
    device: device,
    services: services,
		agreements: agreements
  };
}

function mapDispatchToProps(dispatch) {
	return {
    onAgreementsGet: bindActionCreators(actions.agreements, dispatch),
    onAttributesGet: bindActionCreators(actions.attributes, dispatch),
    onDeviceGet: bindActionCreators(actions.device, dispatch),
    onServicesGet: bindActionCreators(actions.services, dispatch)
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
