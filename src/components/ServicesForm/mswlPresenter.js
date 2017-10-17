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
  Grid,
  Label,
  Icon,
  Accordion,
  Popup,
} from 'semantic-ui-react';
import moment from 'moment';

import {labelContains} from './helpers.js';

const parseLastUpdated = (date) => {
  return moment(date.split('[UTC]')[0]).toString();
};

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
    this.handleUserInputChange = this.handleUserInputChange.bind(this);
    this.handleWorkloadEnablement = this.handleWorkloadEnablement.bind(this);
  /**
   * Sets the input in field state.
   * @param {SyntheticEvent} event 
   * @param {object} data 
   */
  handleUserInputChange(event, data) {

    // check for missing props
    if (typeof data === 'undefined') return;

    const fieldNameSplit = data.name.split('#');
    const workloads = this.state.fields.workloads;
    // TODO: this is hacky and mutates... fix ASAP
    for (let i = 0; i < workloads.length; i++) {
      if (workloads[i].originalKey === fieldNameSplit[0]) {
        for (let j = 0; j < workloads[i].userInput.length; j++) {
          if (workloads[i].userInput[j].name === fieldNameSplit[1]) {
            let tmpUserInput = workloads[i].userInput[j];
            if (data.type === 'checkbox') {
              tmpUserInput.defaultValue = data.checked;
            } else if (data.type === 'text') {
              tmpUserInput.defaultValue = data.value;
            }
          }
        }
      }
    }
    this.setState({fields: {...this.state.fields, workloads}});
  }

  /**
   * Handles checkbox toggle for workload enablement
   * @param {SyntheticEvent} event 
   * @param {object} data 
   */
  handleWorkloadEnablement(event, data) {
    console.log('workload enablement', event, data);
    
    const fieldNameSplit = data.name.split('#');
    const workloads = this.state.fields.workloads;
    // TODO: hacky... mutates
    for (let i = 0; i < workloads.length; i++) {
      if (workloads[i].originalKey === fieldNameSplit[0]) {
        workloads[i].enabled = data.checked;
        break;
      }
    }
    this.setState({fields: {...this.state.fields, workloads}});
  }
  }

  componentWillMount() {
    const { onMicroservicesGet, onWorkloadsGet, onConfigurationGet, configuration } = this.props;
    console.log('props in mswl', this.props);

    // onConfigurationGet()
    //     .then((configData) => {
          onMicroservicesGet('configData.exchange_api', 'IBM')
              .then((data) => {
                console.log('got data', data);
              });
        // })
        // .catch((err) => {
        //   console.error(err);
        // })
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

  _generateHardwareList(matchHardware) {

    return (
      <List.Item>
        <List.Content>
          <List.Header>Hardware</List.Header>
          <div style={{paddingLeft: '2%'}}>
            {
              _.map(Object.keys(matchHardware), (hwItem) => {
                return <List.Description key={hwItem}><strong>{hwItem}</strong>: {matchHardware[hwItem]}</List.Description>
              })
            }
          </div>
        </List.Content>
      </List.Item>
    )
  }

  _generateMicroserviceSegments(microservices, msKey) {

    const parseLastUpdated = (date) => {
      return moment(date.split('[UTC]')[0]).toString();
    };

    let segmentRender = <div />;
    const segments = _.map(Object.keys(microservices), (msSegmentKey) => {
      if (msKey === msSegmentKey) {
         segmentRender = _.map(microservices[msSegmentKey], (microservice) => {
          return (
            <Segment padded raised key={microservice.label}>
              <Header size='medium'>{microservice.label} <small>v{microservice.version}</small></Header>
              <Checkbox
                style={{marginBottom: '.75em'}}
                toggle
                label='enabled'
              />
              <Label attached='top right'>
                <Icon name='user outline' />
                {microservice.owner}
              </Label>
              <List>
                <List.Item><strong>Description</strong>: {microservice.description}</List.Item>
                <List.Item><strong>Architecture</strong>: {microservice.arch}</List.Item>
                <List.Item><strong>Last Updated</strong>: {parseLastUpdated(microservice.lastUpdated)}</List.Item>
                <List.Item><strong>Sharable</strong>: {microservice.sharable}</List.Item>
                <List.Item><strong>Public</strong>: {microservice.public.toString()}</List.Item>
                <List.Item><strong>Download URL</strong>: {microservice.downloadUrl}</List.Item>
                <List.Item><strong>Spec Ref</strong>: <a href={microservice.specRef}>{microservice.specRef}</a></List.Item>
                {this._generateHardwareList(microservice.matchHardware)}
              </List>
            </Segment>
          );
        });
      }
    });
    console.log('segments', segments)
    return segmentRender;
  }

  _generateMicroserviceSections(microservices) {
    const { servicesForm } = this.props;
    const orgSections = _.map(Object.keys(microservices), (msKey) => {
    return (
        <Segment vertical key={msKey}>
          <Header size='small'>{msKey}</Header>
          {this._generateMicroserviceSegments(microservices, msKey)}
        </Segment>
      );
    });
    return orgSections;
  }

  render() {
    const { services } = this.props;
    return (
      <div>
        <Header size='large'>Services Selection</Header>
        <Grid columns={2} relaxed>
          <Grid.Column>
            {typeof services !== 'undefined' 
              && typeof services.microservices !== 'undefined' 
              && this._generateMicroserviceSections(services.microservices)
            }
          </Grid.Column>
          <Grid.Column>
            hi
          </Grid.Column>
        </Grid>
      </div>
    )
  }
}


export default ServicesForm;