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
  Modal,
  Message,
} from 'semantic-ui-react';
import moment from 'moment';

const parseLastUpdated = (date) => {
  return moment(date.split('[UTC]')[0]).toString();
};

class PatternView extends Component {

  constructor(props) {
    super(props);

    this.state = {
      ephemeral: {
        fetching: true,
        submitting: false,
      },
      isWaitingCreds: true,
      credentials: {
        organization: undefined,
        username: undefined,
        password: undefined,
      },
      location: 'patternView',
      patterns: undefined,
      selectedPattern: undefined,
      isSelectActive: true,
      fields: {
        microservices: undefined,
        workloads: undefined,
      },
      errors: undefined,
    };

    this.handleAccordionClick = this.handleAccordionClick.bind(this);
    this.handleDropdownChange = this.handleDropdownChange.bind(this);
    this.handleModalFieldChange = this.handleModalFieldChange.bind(this);
    this.initData = this.initData.bind(this);
    this.savePattern = this.savePattern.bind(this);
  }

  componentDidMount() {
    document.title += ' - Pattern Setup';

    if (typeof this.props.accountForm.fields.account.organization !== 'undefined'
        && this.props.accountForm.fields.account.username !== ''
        && this.props.accountForm.fields.account.password !== ''
        && this.props.accountForm.fields.account.organization !== '')

      this.setState({isWaitingCreds: false, credentials: {
        organization: this.props.accountForm.fields.account.organization,
        username: this.props.accountForm.fields.account.username,
        password: this.props.accountForm.fields.account.password,
      }}, () => {
        this.initData();
      });
  }

  componentWillMount() {
    const {onConfigurationGet} = this.props;
    onConfigurationGet()
        .then(configData => {
          console.log('Fetched config data successfully: ', configData);
        })
        .catch(err => {
          console.error('Error fetching config data', err);
          this.showErr(err);
          throw err;
        });
  }

  stateSubmitting(val) {
    this.setState({ephemeral: Object.assign({}, this.state.ephemeral, {submitting: val}) });
  }

  stateFetching(val) {
    this.setState({ ephemeral: Object.assign({}, this.state.ephemeral, {fetching: val}) });
  }

  showErr(err) {
    this.setState({errors: err});
  }

  removeErrs() {
    this.setState({errors: undefined});
  }

  savePattern() {

    this.removeErrs();

    const {
      onSavePattern, 
      accountFormDataSubmit, 
      accountFormFieldChange, 
      deviceFormSubmit, 
      deviceFormSubmitBlockchain, 
      router, 
      deviceForm, 
      accountForm,
      device,
      configuration,
      onSetDeviceConfigured,
    } = this.props;
    this.setState({ephemeral: {submitting: true}});

    // CB hell... would prefer promise-sequential
    accountFormDataSubmit(configuration.exchange_api, accountForm.fields.account.deviceid || device.id, accountForm, true, this.state.selectedPattern)
        .then((res) => {
          // Need to wait for account form fetch to finish
          setTimeout(() => {
            deviceFormSubmit(deviceForm)
                .then((res) => {
                  deviceFormSubmitBlockchain(deviceForm)
                      .then((res) => {
                        onSetDeviceConfigured()
                            .then((res) => {
                              this.stateFetching(false);
                              this.stateSubmitting(false);
                              router.push('/dashboard');
                            })
                            .catch((err) => {
                              console.error(err);
                              this.stateFetching(false);
                              this.stateSubmitting(false);
                              this.showErr(err);
                            })
                      })
                      .catch((err) => {
                        console.error(err);
                        this.stateFetching(false);
                        this.stateSubmitting(false);
                        this.showErr(err);
                      })
                })
                .catch((err) => {
                  console.error(err);
                  this.stateFetching(false);
                  this.stateSubmitting(false);
                  this.showErr(err);
                })
          }, 3000);
        })
        .catch(err => {
          console.error(err);
          this.stateFetching(false);
          this.stateSubmitting(false);
          this.showErr(err);
        })
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
  }

  initData() {
    const {onPatternsGet, configuration} = this.props;
    const {organization, username, password} = this.state.credentials;

    onPatternsGet(configuration.exchange_api, configuration.architecture, organization, username, password)
        .then(values => {
          this.setState({ephemeral: {fetching: false}, isWaitingCreds: false});
        })
        .catch(err => {
          this.showErr(err);
          this.setState({ephemeral: {fetching: false}, isWaitingCreds: false});
        });
  }

  handleModalFieldChange(e, {name, value}) {
    this.setState({credentials: Object.assign({}, this.state.credentials, {
      [name]: value,
    })}, () => {console.log('set state', this.state)});
  }

  getPatternInfo(originalKey) {
    const {patterns} = this.props;
    const org = originalKey.split('/')[0];

    for (let i = 0; i < patterns[org].length; i++) {
      if (patterns[org][i].originalKey === originalKey) return patterns[org][i];
    }

    return null;
  }

  handleAccordionClick(e, titleProps) {
    this.setState({ isSelectActive: !this.state.isSelectActive });
  }

  handleDropdownChange(e, data) {
    // data.value is the originalKey prop
    this.setState({selectedPattern: data.value, errors: undefined});
  }

  // gets workload version based on priority
  getLatestWorkloadVersion(workloadVersions) {
    // higher priority is smaller value. max is 100
    let highestPriority = "101";
    let versionForPriority = undefined;
    for (let i = 0; i < workloadVersions.length; i++) {
      if (workloadVersions[i].priority.priority_value < highestPriority) {
        highestPriority = workloadVersions[i].priority.priority_value;
        versionForPriority = workloadVersions[i].version;
      }
    }

    return versionForPriority;
  }

  /**
   * Get required microservices for a given workoad
   * @param {object} workload
   * @returns {object}
   */
  getRequiredMicroservices(workload) {
    const { microservices } = this.props.services;
    const workloadApiSpec = workload.apiSpec;
    const msesForSpec = _.map(workloadApiSpec, (spec) => {
      return this._microserviceLookup(spec);
    });

    return msesForSpec[0];
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
   * Returns microservices and workloads for a given pattern
   * @param {object} wls hashmap of obj with keys as org names and values as array
   */
  filterMSWLForPattern(wls) {

    let microservices = {};
    let workloads = {};

    const currentPattern = this.getPatternInfo(this.state.selectedPattern);

    // loop thru workloads in selected pattern and append to workloads var based on org
    for (let i = 0; i < currentPattern.workloads.length; i++) {
      const compWorkload = {
        workloadArch: currentPattern.workloads[i].workloadArch,
        workloadOrgId: currentPattern.workloads[i].workloadOrgid,
        workloadUrl: currentPattern.workloads[i].workloadUrl,
        workloadVersion: this.getLatestWorkloadVersion(currentPattern.workloads[i].workloadVersions),
      };

      if (typeof wls == 'undefined') return {microservices, workloads};
      const wlsKeys = Object.keys(wls);
      // loop thru unfiltered renderable workloads
      for (let j = 0; j < wlsKeys.length; j++) {
        // check for org match
        if (wlsKeys[j] === compWorkload.workloadOrgId) {
          const workloadOrg = wlsKeys[j];
          let wlToAdd = undefined;

          // find the single instance of a workload
          const workloadsInOrg = wls[workloadOrg];
          for (let k = 0; k < workloadsInOrg.length; k++) {
            if (workloadsInOrg[k].arch === compWorkload.workloadArch &&
                workloadsInOrg[k].workloadUrl === compWorkload.workloadUrl &&
                workloadsInOrg[k].version === compWorkload.workloadVersion) {
                  wlToAdd = workloadsInOrg[k];
                }
          }

          if (typeof workloads[workloadOrg] !== 'undefined') {
            let tmpArr = workloads[workloadOrg];
            tmpArr.push(wlToAdd);
            workloads[workloadOrg] = tmpArr;
          } else {
            workloads[workloadOrg] = [wlToAdd];
          }
        }
      }
    }

    // we have the filtered workloads, now get the microservices for each filtered workload
    const filteredWLKeys = Object.keys(workloads);
    let filteredMSArr = [];
    for (let i = 0; i < filteredWLKeys.length; i++) {
      // array of workloads
      const filteredOrgWLs = workloads[filteredWLKeys];
      for (let j = 0; j < filteredOrgWLs.length; j++) {
        const microservicesForWL = this.getRequiredMicroservices(filteredOrgWLs[j]);
        filteredMSArr = filteredMSArr.concat(microservicesForWL);
      }
    }
    
    // remove duplicate mses
    let tracker = {};
    for (let i = 0; i < filteredMSArr.length; i++) {
      if (typeof tracker[filteredMSArr[i].specRef] === 'undefined') {
        tracker[filteredMSArr[i].specRef] = filteredMSArr[i];
      }
    }

    const dedupedFilteredMS = Object.values(tracker);
    
    // transfer deduped mses into renderable hash
    for (let i = 0; i < dedupedFilteredMS.length; i++) {
      const msOrg = dedupedFilteredMS[i].originalKey.split('/')[0];
      if (typeof microservices[msOrg] === 'undefined') {
        microservices[msOrg] = [dedupedFilteredMS[i]];
      } else {
        let tmpArr = microservices[msOrg];
        tmpArr.push(dedupedFilteredMS[i]);
        microservices[msOrg] = tmpArr;
      }
    }

    return {
      microservices,
      workloads,
    };
  }

  generateWorkloadSegments(workloads, wlKey) {
    let segmentRender = <div />;
    const segments = _.map(Object.keys(workloads), (wlSegmentKey) => {
      if (wlKey === wlSegmentKey) {
         segmentRender = _.map(workloads[wlSegmentKey], (workload, idx) => {
          return (
            <Segment padded raised key={workload.label}>
              <Header size='medium'>{workload.label} <small>v{workload.version}</small></Header>
              <Label attached='top right'>
                <Icon name='user' />
                {workload.owner}
              </Label>
              <List>
                <List.Item><strong>Description</strong>: {workload.description}</List.Item>
                <List.Item><strong>Architecture</strong>: {workload.arch}</List.Item>
                <List.Item><strong>Last Updated</strong>: {parseLastUpdated(workload.lastUpdated)}</List.Item>
                <List.Item><strong>Public</strong>: {workload.public.toString()}</List.Item>
                <List.Item><strong>Workload URL</strong>: <a href={workload.specRef}>{workload.workloadUrl}</a></List.Item>
              </List>
            </Segment>
          );
        });
      }
    });
    return segmentRender;
  }

  generateWorkloadSections(workloads) {
    workloads = this.filterMSWLForPattern(workloads).workloads;
    const orgSections = _.map(Object.keys(workloads), (wlKey) => {
      return (
        <Segment vertical key={wlKey}>
          <Header size='small'>{wlKey}</Header>
          {this.generateWorkloadSegments(workloads, wlKey)}
        </Segment>
      )
    });

    return orgSections;
  }

  /**
   * Generate single renderable microservice item
   * @param {array} microservices 
   * @param {string} msKey 
   */
  generateMicroserviceSegments(microservices, msKey) {
    let segmentRender = <div />;
    const segments = _.map(Object.keys(microservices), (msSegmentKey) => {
      if (msKey === msSegmentKey) {
         segmentRender = _.map(microservices[msSegmentKey], (microservice, idx) => {
          return (
            <Segment padded raised key={microservice.label}>
              <Header size='medium'>{microservice.label} <small>v{microservice.version}</small></Header>
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
    return segmentRender;
  }

  generateMicroserviceSections(workloads) {
    const microservices = this.filterMSWLForPattern(workloads).microservices;
    const orgSections = _.map(Object.keys(microservices), (msKey) => {
    return (
        <Segment vertical key={msKey}>
          <Header size='small'>{msKey}</Header>
          {this.generateMicroserviceSegments(microservices, msKey)}
        </Segment>
      );
    });
    return orgSections;
  }

  generatePatternDetailedSection() {
    const {selectedPattern} = this.state;
    const {organization, username, password} = this.state.credentials;
    const {onMicroservicesGet, onWorkloadsGet, services, configuration} = this.props;

    const pattern = this.getPatternInfo(selectedPattern);

    if (typeof this.state.fields.microservices === 'undefined' && typeof this.state.fields.workloads === 'undefined') {

      // arr of workloads
      const patternWLs = pattern.workloads;
      let promises = [onMicroservicesGet(configuration.exchange_api, organization, username, password, organization), onWorkloadsGet(configuration.exchange_api, organization, username, password, organization)];

      let orgHistory = [];
      for (let i = 0; i < patternWLs.length; i++) {
        if (patternWLs[i].workloadOrgid !== organization && orgHistory.indexOf(patternWLs[i].workloadOrgid) === -1) {
          orgHistory.push(patternWLs[i].workloadOrgid);
          promises.push(onMicroservicesGet(configuration.exchange_api, organization, username, password, patternWLs[i].workloadOrgid));
          promises.push(onWorkloadsGet(configuration.exchange_api, organization, username, password, patternWLs[i].workloadOrgid));
        }
      }

      Promise.all(promises)
          .then(values => {
            this.initiateFieldState();
          })
          .catch(err => {
            this.showErr(err);
          })
    }

    const {microservices, workloads} = this.state.fields;

    return (
      <Grid columns={2} relaxed>
        <Grid.Column>
          <Header size='medium'>Microservices</Header>
            {this.generateMicroserviceSections(services.workloads)}
        </Grid.Column>
        <Grid.Column>
          <Header size='medium'>Workloads</Header>
            {this.generateWorkloadSections(services.workloads)}
        </Grid.Column>
      </Grid>
    );
  }

  generateCurrentPatternDescription() {
    const {selectedPattern} = this.state;

    const pattern = this.getPatternInfo(selectedPattern);
    
    return (<div>
      <Header>Currently selected pattern:</Header>
      <p>
        {pattern.label}
        <br />
        {pattern.owner}
        <br />
        {pattern.description}
      </p>
    </div>);
  }

  generatePatternSelectionSection() {
    const { isSelectActive } = this.state;

    // patterns is a hashmap of organizations containing an array of patterns
    const { patterns } = this.props;

    let patternOptions = [];
    const patternKeys = Object.keys(patterns);

    if (patternKeys.length === 0) {
      return (
        <Message warning>
          <Message.Header>
            No Patterns
          </Message.Header>
          <p>There are currently no patterns. Please check back later.</p>
        </Message>
      )
    }

    let _this = this;
    for (let i = 0; i < patternKeys.length; i++) {
      const patternsInOrg = _.map(patterns[patternKeys[i]], (pattern) => { // map thru pattern in org
        return {
          text: pattern.label,
          value: pattern.originalKey,
          label: <Label><Icon name='user' />{pattern.owner}</Label>,
        };
      });
      Array.prototype.push.apply(patternOptions, patternsInOrg);
    }

    return (
      <Accordion fluid styled>
        <Accordion.Title active={isSelectActive} onClick={this.handleAccordionClick}>
          <Icon name='dropdown' />
          Select a pattern
        </Accordion.Title>
        <Accordion.Content active={isSelectActive}>
          <Dropdown fluid placeholder='Select pattern' selection options={patternOptions} onChange={this.handleDropdownChange}/>
          {typeof this.state.selectedPattern !== 'undefined' &&
            <div>
              <Divider />
              {this.generateCurrentPatternDescription()}
            </div>
          }
        </Accordion.Content>
      </Accordion>
    )
  }

  render() {

    const readyRender = () => {
      console.log('error state', this.state.errors);
      return <div>
        {typeof this.state.errors !== 'undefined' &&
          <Message error>
            <Message.Header>An error has occurred</Message.Header>
            <p>{JSON.stringify(this.state.errors)}</p>
          </Message>
        }
        {typeof this.state.errors === 'undefined' && this.generatePatternSelectionSection()}
      </div>
    };

    return (
      <div>
        <Dimmer inverted active={this.state.ephemeral.submitting}>
          <Loader />
        </Dimmer>
        {
          !this.state.ephemeral.fetching && !this.state.ephemeral.submitting ? readyRender() : <Header>Loading...</Header>
        }
        {this.state.isWaitingCreds &&
          <Modal
            open={this.state.isWaitingCreds}
            size='small'
          >
            <Header content='Authorization' />
            <Modal.Content>
              <Form>
                <Form.Field
                  width={6}
                  id='form-input-control-org'
                  control={Input}
                  name='organization'
                  label='Organization'
                  placeholder='Organization'
                  onChange={this.handleModalFieldChange}
                />
                <Form.Field 
                  width={6} 
                  id='form-input-control-username' 
                  control={Input} 
                  name='username'
                  label='Username' 
                  placeholder='Username without organization id' 
                  onChange={this.handleModalFieldChange}
                />
                <Form.Field 
                  width={6} 
                  id='form-input-control-password' 
                  control={Input} 
                  type='password' 
                  name='password'
                  label='Password' 
                  placeholder='Password' 
                  onChange={this.handleModalFieldChange} 
                />
              </Form>
            </Modal.Content>
            <Modal.Actions>
              <Button primary type='submit' onClick={this.initData}>Submit</Button>
            </Modal.Actions>
          </Modal>
          }
        <br />
        {typeof this.state.selectedPattern !== 'undefined' && this.generatePatternDetailedSection()}
        {typeof this.state.selectedPattern !== 'undefined' && <Button onClick={this.savePattern} primary>Confirm</Button>}
      </div>
    );
  }
}

export default PatternView;