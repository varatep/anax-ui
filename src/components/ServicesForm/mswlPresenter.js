// v2 of services form which displays a microservice/workload split
import React, {Component} from 'react';
import * as _ from 'lodash';
import {
  Button,
  Checkbox,
  Container,
  Dimmer,
  Header,
  Form,
  Input,
  Image,
  Divider,
  List,
  Loader,
  Segment,
  Dropdown,
} from 'semantic-ui-react';

import {labelContains} from './helpers.js';

class ServicesForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ephemeral: {
        fetching: true,
        submitting: false,
      },
      location: 'servicesForm',
    };
  }

  componentWillMount() {
    const { onMicroservicesGet, onWorkloadsGet, onConfigurationGet, configuration } = this.props;
    console.log('props in mswl', this.props);

    onConfigurationGet()
        .then((configData) => {
          onMicroservicesGet(configData.exchange_api)
              .then((data) => {
                console.log('got data', data);
              });
        })
  }
  _getMicroserviceIcon(microserviceLabel) {
    const underscoreLabel = _.toLower(microserviceLabel);

    if (labelContains(underscoreLabel, 'netspeed')) return '/images/netspeed.svg';
    if (labelContains(underscoreLabel, 'network')) return '/images/netspeed.svg';
    if (labelContains(underscoreLabel, 'citygram')) return '/images/citygram.svg';
    if (labelContains(underscoreLabel, 'sdr')) return '/images/sdr.svg';
    if (labelContains(underscoreLabel, 'pws')) return '/images/pws.svg';
    // TODO: add location icon
    if (labelContains(underscoreLabel, 'location')) return '/images/gps.svg';
    if (labelContains(underscoreLabel, 'cpu')) return '/images/cputemp.svg';
    if (labelContains(underscoreLabel, 'air pollution')) return '/images/purpleair.svg';
    if (labelContains(underscoreLabel, 'aural')) return '/images/aural.svg';
    if (labelContains(underscoreLabel, 'gps')) return '/images/gps.svg';

    // TODO: add ? icon
    // else
    return '/images/gps.svg';
  }

  _getMicroserviceShortname(microserviceLabel) {
    const underscoreLabel = _.toLower(microserviceLabel);

    if (labelContains(underscoreLabel, 'netspeed')) return 'netspeed';
    if (labelContains(underscoreLabel, 'network')) return 'netspeed';
    if (labelContains(underscoreLabel, 'citygram')) return 'citygram';
    if (labelContains(underscoreLabel, 'sdr')) return 'sdr';
    if (labelContains(underscoreLabel, 'pws')) return 'pws';
    if (labelContains(underscoreLabel, 'location')) return 'location';
    if (labelContains(underscoreLabel, 'cpu')) return 'cputemp';
    if (labelContains(underscoreLabel, 'air pollution')) return 'purpleair';
    if (labelContains(underscoreLabel, 'aural')) return 'aural';
    if (labelContains(underscoreLabel, 'gps')) return 'gps';
    return '';
  }

  _generateMicroserviceSegments(microservices) {
    const { servicesForm } = this.props;
    const segments = _.map(microservices, (microservice) => {
      console.log('microservice.label:', microservice);
      return (
        <Segment padded raised key={microservice.label}>
          <Header size='medium'>{microservice.label}</Header>
          <Image src={this._getMicroserviceIcon(microservice.label)} size='tiny' spaced floated='left' />
          <Checkbox
            style={{marginBottom: '.75em'}}
            toggle
            label={servicesForm.fields[this._getMicroserviceShortname(microservice.label)].enabled
              ? 'enabled' : 'disabled'}
          />
        </Segment>
      );
    });
    return segments;
  }

  render() {
    const { services } = this.props;

    return (
      <div>
        <Header size='large'>Services Selection</Header>
        {typeof services !== 'undefined' 
          && typeof services.microservices !== 'undefined' 
          && this._generateMicroserviceSegments(Object.values(services.microservices))
        }
      </div>
    )
  }
}


export default ServicesForm;