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
      fields: undefined,
    };

    this.handleUserInputChange = this.handleUserInputChange.bind(this);
    this.handleWorkloadEnablement = this.handleWorkloadEnablement.bind(this);
    this.handleMicroserviceEnablement = this.handleMicroserviceEnablement.bind(this);
  }

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

  /**
   * Handles checkbox toggle for microservice enablement
   * @param {SyntheticEvent} event 
   * @param {object} data 
   */
  handleMicroserviceEnablement(event, data) {
    const fieldNameSplit = data.name.split('#');
    const mses = this.state.fields.microservices;
    for (let i = 0; i < mses.length; i++) {
      if (mses[i].originalKey === fieldNameSplit[0]) {
        mses[i].enabled = data.checked;
        break;
      }
    }
    this.setState({fields: {...this.state.fields, microservices: mses}});
  }

  /**
   * Finds either a microservice or workload (given by `from`) using the originalKey.
   * @param {string} originalKey original key from api
   * @param {string} from from microservice or workload
   */
  findServiceByOriginalKey(originalKey, from) {
    if (from === 'workload' || from === 'workloads') {
      // workloads is an array of workloads
      const {workloads} = this.state.fields;
      return _.filter(workloads, {originalKey})[0];
    } else if (from === 'microservice' || from === 'microservices') {
      // microservices is an array of microservices
      const {microservices} = this.state.fields;
      return _.filter(microservices, (ms) => {
        return ms.originalKey === originalKey;
      })[0];
    }

    // means the method did not receive correct `from` parameter
    return null;
  }

  /**
   * Finds an individual user input object from field state
   * @param {string} originalKey original key from api
   * @param {string} name name of user input
   * @param {string} from from microservice or workload
   */
  findUserInputByName(originalKey, name, from) {
    // workloads is an array of workloads
    const {workloads} = this.state.fields;
    const found = this.findServiceByOriginalKey(originalKey, from);
    return _.filter(found.userInput, {name})[0];
  }

  /**
   * Prepare the state that handle microservices, workloads, and user input values.
   */
  initiateFieldState() {
    // workloads and microservices are arrays of objects with key `org` and value `array`
    const { microservices, workloads } = this.props.services;

    // All we need from each workload is the enabled property and user input
    let workloadFields = [];
    const workloadKeys = Object.keys(workloads);
    for (let i = 0; i < workloadKeys.length; i++) {
      let currentWorkload;
      for (let j = 0; j < workloads[workloadKeys[i]].length; j++) {
        currentWorkload = workloads[workloadKeys[i]][j];
        workloadFields.push(Object.assign({}, currentWorkload, {
          enabled: false,
        }));
      }
    }

    // All we need from each microservice is the enabled property
    let microserviceFields = [];
    const microserviceKeys = Object.keys(microservices);
    for (let i = 0; i < microserviceKeys.length; i++) {
      let currentMicroservice;
      for (let j = 0; j < microservices[microserviceKeys[i]].length; j++) {
        currentMicroservice = microservices[microserviceKeys[i]][j];
        microserviceFields.push(Object.assign({}, currentMicroservice, {
          enabled: false,
        }));
      }
    }

    this.setState({fields: {
      microservices: microserviceFields,
      workloads: workloadFields,
    }});
    console.log('set state for field', this.state.fields)
  }

  componentWillMount() {
    const { onMicroservicesGet, onWorkloadsGet, onConfigurationGet, configuration } = this.props;
    console.log('props in mswl', this.props);

    Promise.all([onMicroservicesGet('configData.exchange_api', 'IBM'), onWorkloadsGet('configData.exchange_api', 'IBM')])
        .then(values => {
          this.initiateFieldState();
        })

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

  /**
   * Generate a list of hardwares required for a given workload
   * @param {object} matchHardware 
   */
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

  /**
   * Generate single renderable microservice item
   * @param {array} microservices 
   * @param {string} msKey 
   */
  _generateMicroserviceSegments(microservices, msKey) {
    let segmentRender = <div />;
    const segments = _.map(Object.keys(microservices), (msSegmentKey) => {
      if (msKey === msSegmentKey) {
         segmentRender = _.map(microservices[msSegmentKey], (microservice, idx) => {
          return (
            <Segment padded raised key={microservice.label}>
              <Header size='medium'>{microservice.label} <small>v{microservice.version}</small></Header>
              <Checkbox
                style={{marginBottom: '.75em'}}
                toggle
                label={this.state.fields.microservices[idx].enabled ? 'enabled' : 'disabled'}
                name={`${microservice.originalKey}#enablement`}
                onChange={this.handleMicroserviceEnablement}
              />
              <Label attached='top right'>
                <Icon name='user' />
                {microservice.owner}
              </Label>
              <List>
                <List.Item><strong>Description</strong>: {microservice.description}</List.Item>
                <List.Item><strong>Architecture</strong>: {microservice.arch}</List.Item>
                <List.Item><strong>Last Updated</strong>: {parseLastUpdated(microservice.lastUpdated)}</List.Item>
                <List.Item><strong>Sharable</strong>: {microservice.sharable}</List.Item>
                <List.Item><strong>Public</strong>: {microservice.public.toString()}</List.Item>
                <List.Item><strong>Spec Ref</strong>: <a href={microservice.specRef}>{microservice.specRef}</a></List.Item>
              </List>
            </Segment>
          );
        });
      }
    });
    console.log('segments', segments)
    return segmentRender;
  }

  /**
   * Generate renderable segment that lists microservices
   * @param {array} microservices 
   */
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

  /**
   * Find microservices for a given workload api spec
   * @param {object} spec 
   */
  _microserviceLookup(spec) {
    const {microservices} = this.props.services;
    const msKeys = Object.keys(microservices);
    for (let i = 0; i < msKeys.length; i++) {
      if (msKeys[i] === spec.org) {
        const microservicesInOrg = microservices[msKeys[i]];
        let requiredMicroservices = [];
        for (let j = 0; j < microservicesInOrg.length; j++) {
          if (microservicesInOrg[j].specRef === spec.specRef
              && microservicesInOrg[j].version === spec.version
              && microservicesInOrg[j].arch === spec.arch) 
                requiredMicroservices.push(microservicesInOrg[j]);
        }
        return requiredMicroservices;
      }
    }

    return [];
  }

  /**
   * Generates a renderable user input form
   * @param {object} workload 
   */
  _generateUserInputs(workload) {
    const userInputs = workload.userInput;

    // check to see if we don't even need to start assigning vars
    if (userInputs.length === 0) {
      return <div />;
    }
    
    const genInput = (userInput) => {
      if (userInput.type === 'string') {
        return (<Form.Field key={userInput.name}>
          <label>{userInput.label}</label>
          <Input 
            placeholder={userInput.defaultValue || userInput.label} 
            name={`${workload.originalKey}#${userInput.name}`}
            onChange={this.handleUserInputChange}
          />
        </Form.Field>);
      } else if (userInput.type === 'boolean') {
        return (<Form.Field key={userInput.name}>
          <Checkbox 
            toggle 
            label={userInput.label} 
            name={`${workload.originalKey}#${userInput.name}`}
            onChange={this.handleUserInputChange}
          />
        </Form.Field>);
      }
    };

    return (<Segment><Form>
      {_.map(userInputs, genInput)}
    </Form></Segment>);
  }

  /**
   * Generates a renderable list of required microservices for a given workload based off of the workload pattern
   * @param {object} workload
   * @returns {object}
   */
  _generateRequiredMicroservices(workload) {
    const { microservices } = this.props.services;
    const workloadApiSpec = workload.apiSpec;
    const msesForSpec = _.map(workloadApiSpec, (spec) => {
      return this._microserviceLookup(spec);
    });
    let renderArr = [];
    const msRender = _.map(msesForSpec, (mses) => {
      for (let i = 0; i < mses.length; i++) {
        renderArr.push(<Label key={mses[i].label}>{mses[i].label}</Label>)
      }
    });

    return (
      <List.Item>
        <strong>Required microservices</strong>: {renderArr}
      </List.Item>
    );
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