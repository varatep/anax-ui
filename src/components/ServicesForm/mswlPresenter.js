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
  Modal,
  Message,
} from 'semantic-ui-react';
import moment from 'moment';
import HashMap from 'hashmap';

import {
  labelContains,
  MICROSERVICE_APPROACH,
  WORKLOAD_APPROACH,
  ALL_APPROACH,
} from './helpers.js';

import FilterSegment from './FilterSegment';

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
      isWaitingCreds: true,
      credentials: {
        organization: undefined,
        username: undefined,
        password: undefined,
      },
      location: 'servicesForm',
      fields: undefined,
      filters: {
        currentApproach: ALL_APPROACH,
        microservices: undefined,
        workloads: undefined,
      },
      msUserInputs: new HashMap(),
      userInputs: new HashMap(),
      errors: undefined,
    };

    this.handleUserInputChange = this.handleUserInputChange.bind(this);
    this.handleMSUserInputChange = this.handleMSUserInputChange.bind(this);
    this.handleWorkloadEnablement = this.handleWorkloadEnablement.bind(this);
    this.handleMicroserviceEnablement = this.handleMicroserviceEnablement.bind(this);
    this.handleModalFieldChange = this.handleModalFieldChange.bind(this);    
    this.initData = this.initData.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
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

  handleSubmit() {
    this.setState({ephemeral: {submitting: true}})
    this.removeErrs()
    const {
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
      onSetWorkloadConfig,
      onSetMicroserviceConfig,
    } = this.props
    const {microservices, workloads} = this.state.fields
    const {filteredMs, filteredWls} = this.state.filters
    const {msUserInputs, wlUserInputs: userInputs} = this.state

    console.log('prepareWLAttributesForAPI', this.prepareWLAttributesForAPI())
    console.log('prepareMSAttributesForAPI', this.prepareMSAttributesForAPI())

    accountFormDataSubmit(configuration.exchange_api, accountForm.fields.account.deviceid || device.id, accountForm, true)
        .then((res) => {
          // Need to wait for account form fetch to finish
          setTimeout(() => {
            deviceFormSubmit(deviceForm)
                .then((res) => {
                  deviceFormSubmitBlockchain(deviceForm)
                      .then((res) => {
                        onSetWorkloadConfig(this.prepareWLAttributesForAPI())
                            .then((res) => {
                              onSetMicroserviceConfig(this.prepareMSAttributesForAPI())
                                  .then((res) => {
                                    onSetDeviceConfigured()
                                        .then((res) => {
                                          this.stateFetching(false);
                                          this.stateSubmitting(false);
                                          router.push('/dashboard');
                                        })
                                        .catch((err) => {
                                          this.handleSubmitErr(err)
                                        })
                                  })
                                  .catch((err) => {
                                    this.handleSubmitErr(err)
                                  })
                            })
                            .catch((err) => {
                              this.handleSubmitErr(err)
                            })
                      })
                      .catch((err) => {
                        this.handleSubmitErr(err)
                      })
                })
                .catch((err) => {
                  this.handleSubmitErr(err)
                })
          }, 3000);
        })
        .catch(err => {
          this.handleSubmitErr(err)
        })
    
  }

  handleSubmitErr(err) {
    console.error(err)
    this.stateFetching(false)
    this.stateSubmitting(false)
    this.showErr(err)
    this.forceUpdate()
  }

  prepareMSAttributesForAPI() {
    let parsedAttributes;

    const userInputs = this.state.msUserInputs.values()
    const enabledMicroservices = this.getEnabledMicroservices(true)
    const fullEnabledMicroservices = this.getEnabledMicroservices()
    const attrHM = new HashMap();
    const attrs = _.map(userInputs, (attribute) => {
      if (!enabledMicroservices.includes(attribute.originalKey)) return
      const attrName = attribute.name;
      const key = attribute.originalKey
      if (!attrHM.has(key)) {
        attrHM.set(key, {
          specRef: attribute.specRef,
          organization: attribute.originalKey.split('/')[0],
          sensor_name: attribute.specRef.split('/')[4],
          userInputMappings: {
            [attrName]: attribute.defaultValue,
          },
        });
      } else {
        const tmpAttr = attrHM.get(key);
        attrHM.delete(key);
        tmpAttr.userInputMappings[attribute.name] = attribute.defaultValue;
        attrHM.set(key, tmpAttr);
      }
    });

    _.forEach(fullEnabledMicroservices, (m) => {
      if (!attrHM.keys().includes(m.originalKey)) {
        attrHM.set(m.originalKey, {
          specRef: m.specRef,
          organization: m.originalKey.split('/')[0],
          sensor_name: m.specRef.split('/')[4],
          userInputMappings: {},
        })
      }
    })

    return attrHM;
  }

  prepareWLAttributesForAPI() {
    let parsedAttributes;

    const userInputs = this.state.userInputs.values()
    const enabledWorkloads = this.getEnabledWorkloads(true)
    const fullEnabledWorkloads = this.getEnabledWorkloads()
    // join attributes into one that have the same originalKey
    const attrHM = new HashMap();
    const attrs = _.map(userInputs, (attribute) => {
      if (!enabledWorkloads.includes(attribute.originalKey)) return
      const attrName = attribute.name;
      const key = attribute.originalKey
      if (!attrHM.has(key)) {
        attrHM.set(key, {
          workloadUrl: attribute.workloadUrl,
          organization: attribute.originalKey.split('/')[0],
          userInputMappings: { 
            [attrName]: attribute.defaultValue,
          },
        });
      } else {
        const tmpAttr = attrHM.get(key);
        attrHM.delete(key);
        tmpAttr.userInputMappings[attribute.name] = attribute.defaultValue;
        attrHM.set(key, tmpAttr);
      }
    });

    _.forEach(fullEnabledWorkloads, (w) => {
      if (!attrHM.keys().includes(w.originalKey)) {
        attrHM.set(w.originalKey, {
          workloadUrl: w.workloadUrl,
          organization: w.originalKey.split('/')[0],
          userInputMappings: {},
        })
      }
    })

    return attrHM;
  }

  /**
   * Checks if there are any other microservices w/ same specRef are already enabled.
   * Returns true if checkbox should be usable / enabled. Returns false if checkbox should be disabled.
   * @param {object} currentMS current microservice
   */
  checkSharableMicroservices(currentMS) {
    const {microservices} = this.state.fields

    // can abstract this into a separate method
    currentMS = _.filter(microservices, (m) => {
      return m.originalKey === currentMS.originalKey
    })[0]

    console.log('currentMs', currentMS, microservices)

    if (currentMS.sharable === 'multiple' || currentMS.enabled) return true

    const enabledMsesBySpec = this.getEnabledMicroservices(false, true)

    console.log('enabledMsesBySpec', enabledMsesBySpec)

    return !_.includes(enabledMsesBySpec, currentMS.specRef)
  }

  getEnabledMicroservices(byOriginalKey = false, bySpecRef = false) {
    const {microservices} = this.state.fields

    if (byOriginalKey) {
      return _.chain(microservices)
          .filter((m) => {
            return m.enabled
          })
          .map((m) => {
            return m.originalKey
          })
          .value()
    }

    if (bySpecRef) {
      return _.chain(microservices)
          .filter((m) => {
            return m.enabled
          })
          .map((m) => {
            return m.specRef
          })
          .value()
    }

    return _.filter(microservices, (ms) => {
      return ms.enabled
    })
  }

  getEnabledWorkloads(byOriginalKey = false) {
    const {workloads} = this.state.fields

    if (byOriginalKey) {
      return _.chain(workloads)
          .filter((wl) => {
            return wl.enabled
          })
          .map((w) => {
            return w.originalKey
          })
          .value()
    }

    return _.filter(workloads, (wl) => {
      return wl.enabled
    })
  }

  getPossibleWorkloads() {
    if (this.state.filters.currentApproach !== MICROSERVICE_APPROACH) return [];
    const {workloads} = this.state.fields;
    const enabledMses = this.getEnabledMicroservices();
    const possibleWorkloads = _.filter(workloads, (wl) => {
      const requiredMses = _.map(wl.apiSpec, (spec) => {
        return this._microserviceLookup(spec)[0];
      });
      let isWLPossible = true;

      for (let i = 0; i < requiredMses.length; i++) {
        let isMSFulfilled = false;
        for (let j = 0; j < enabledMses.length; j++) {
          if (requiredMses[i].originalKey === enabledMses[j].originalKey)
            {
              isMSFulfilled = true;
              break;
            }
        }
        if (!isMSFulfilled) {
          isWLPossible = false;
          break;
        }
      }
      return isWLPossible;
    });

    // transform to something readable by render fn
    let orgHash = {};
    const extractOrg = (wl) => {
      return (wl.originalKey.split('/')[0]);
    };
    for (let i = 0; i < possibleWorkloads.length; i++) {
      if (typeof orgHash[extractOrg(possibleWorkloads[i])] === 'undefined') { // DNE
        let tmpObj = {};
        tmpObj[possibleWorkloads[i].originalKey] = possibleWorkloads[i];
        orgHash[extractOrg(possibleWorkloads[i])] = tmpObj;
      } else { // EXISTS
        let tmpObj = orgHash[extractOrg(possibleWorkloads[i])];
        tmpObj[possibleWorkloads[i].originalKey] = possibleWorkloads[i];
        orgHash[extractOrg(possibleWorkloads[i])] = tmpObj;
      }
    }

    return orgHash;
  }
  
  resetAllEnablements() {
    this.setState({fields: undefined}, () => {this.initiateFieldState()});
  }

  updateCurrentApproach(currentApproach) {
    if (currentApproach === ALL_APPROACH)
      this.setState({filters:{currentApproach, workloads: undefined, microservices: undefined}}, () => {this.resetAllEnablements()});
    else
      this.setState({filters:{currentApproach}}, () => {this.resetAllEnablements()});
  }

  /**
   * Sets the input in field state.
   * @param {SyntheticEvent} event 
   * @param {object} data 
   */
  handleUserInputChange(evt, data) {
    const tmpHash = this.state.userInputs;
    const inputClone = tmpHash.get(data.originalKey + '/' + data.name);
    inputClone.defaultValue = data.value;
    tmpHash.set(data.originalKey + '/' + data.name, inputClone);
  }

  handleMSUserInputChange(evt, data) {
    const tmpHash = this.state.msUserInputs;
    const inputClone = tmpHash.get(data.originalKey + '/' + data.name);
    inputClone.defaultValue = data.value;
    tmpHash.set(data.originalKey + '/' + data.name, inputClone);
  }

  /**
   * Handles checkbox toggle for workload enablement
   * @param {SyntheticEvent} event 
   * @param {object} data 
   */
  handleWorkloadEnablement(event, data) {
    const fieldNameSplit = data.name.split('#');
    const workloads = this.state.fields.workloads;
    console.log('workload enablement', event, data, workloads);
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
  }
  
  initData() {
    const { onMicroservicesGet, onWorkloadsGet, onConfigurationGet, configuration } = this.props;
    const { organization, username, password } = this.state.credentials;

    let promises = [
      onMicroservicesGet(configuration.exchange_api, organization, username, password, organization, configuration.architecture),
      onWorkloadsGet(configuration.exchange_api, organization, username, password, organization, configuration.architecture),
    ]

    if (organization !== 'IBM') {
      promises.push(onMicroservicesGet(configuration.exchange_api, organization, username, password, 'IBM', configuration.architecture))
      promises.push(onWorkloadsGet(configuration.exchange_api, organization, username, password, 'IBM', configuration.architecture))
    }

    Promise.all(promises)
        .then(values => {
          this.initiateFieldState();
          this.setState({ephemeral: {fetching: false}, isWaitingCreds: false});
        })
        .catch(err => {
          this.setState({ephemeral: {fetching: false}, isWaitingCreds: true});
          this.showErr(err)
        })
  }

  handleModalFieldChange(e, {name, value}) {
    this.setState({credentials: Object.assign({}, this.state.credentials, {
      [name]: value,
    })});
  }

  componentDidMount() {
    document.title += ' - Citizen Scientist Setup';

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
    // const { onMicroservicesGet, onWorkloadsGet, onConfigurationGet, configuration } = this.props;
    // console.log('props in mswl', this.props);

    // Promise.all([onMicroservicesGet('staging', 'IBM'), onWorkloadsGet('configData.exchange_api', 'IBM')])
    //     .then(values => {
    //       this.initiateFieldState();
    //     })

    // onConfigurationGet()
    //     .then((configData) => {
    //       onMicroservicesGet('configData.exchange_api', 'IBM')
    //           .then((data) => {
    //             console.log('got data', data);
    //           });
    //     // })
    //     // .catch((err) => {
    //     //   console.error(err);
    //     // })
    // onWorkloadsGet('configData.exchange_api', 'IBM')
    //           .then((data) => {
    //             console.log('got data', data);
    //           });
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
            <Segment padded raised key={microservice.label + '-' + microservice.originalKey}>
              <Header size='medium'>{microservice.label} <small>v{microservice.version}</small></Header>
              {!this.checkSharableMicroservices(microservice) && <Message>This microservice has been disabled because you have enabled another microservice with a matching specRef. Please disable the other one if you want to proceed.</Message>}
              <Checkbox
                style={{marginBottom: '.75em'}}
                toggle
                label={this.state.fields && _.find(this.state.fields.microservices, (m) => {return m.originalKey === microservice.originalKey}).enabled ? 'enabled' : 'disabled'}
                name={`${microservice.originalKey}#enablement`}
                onChange={this.handleMicroserviceEnablement}
                disabled={!this.checkSharableMicroservices(microservice)}
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
              {this.generateMSUserInputs(microservice.userInput, microservice.specRef, microservice.originalKey)}
            </Segment>
          );
        });
      }
    });
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
              && microservicesInOrg[j].arch === spec.arch) 
                requiredMicroservices.push(microservicesInOrg[j]);
        }
        return requiredMicroservices;
      }
    }

    return [];
  }

  generateMSUserInputs(unparsedUserInputs, specRef, originalKey) {
    if (unparsedUserInputs.length === 0) return <div />;

    const segments = _.map(unparsedUserInputs, (unparsedInput, idx) => {
      let tmpHash = this.state.msUserInputs;
      if (typeof tmpHash.get(originalKey + '/' + unparsedInput.name) == 'undefined') {
        tmpHash.set(originalKey + '/' + unparsedInput.name, Object.assign({}, unparsedInput, {specRef, originalKey}));
      }
      return (
        <Form.Input
          fluid
          focus
          label={unparsedInput.label}
          key={unparsedInput.name}
          onChange={this.handleMSUserInputChange}
          name={unparsedInput.name}
          originalKey={originalKey}
          defaultValue={unparsedInput.defaultValue}
        />
      );
    });

    let segmentRender = <Segment>
      <Form className="attached fluid" onSubmit={(event) => {event.preventDefault();}} id={unparsedUserInputs[0].originalKey}>
        {segments}
      </Form>
    </Segment>;

    return segmentRender;
  }

  generateUserInputs(unparsedUserInputs, workloadUrl, originalKey) {
    if (unparsedUserInputs.length === 0) return <div />;
    const segments = _.map(unparsedUserInputs, (unparsedInput, idx) => {
      let tmpHash = this.state.userInputs;
      if (typeof tmpHash.get(originalKey + '/' + unparsedInput.name) === 'undefined') {
        tmpHash.set(originalKey + '/' + unparsedInput.name, Object.assign({}, unparsedInput, {workloadUrl, originalKey}));
      }
      return (
        <Form.Input 
          fluid 
          focus 
          label={unparsedInput.label} 
          key={unparsedInput.name} 
          onChange={this.handleUserInputChange} 
          name={unparsedInput.name}
          originalKey={originalKey}
          defaultValue={unparsedInput.defaultValue} 
        />
      );
    });

    let segmentRender = <Segment>
      <Form className="attached fluid" onSubmit={(event) => {event.preventDefault();} } id={unparsedUserInputs[0].originalKey}>
        {segments}
      </Form>
    </Segment>;

    return segmentRender;
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
        renderArr.push(<Label key={mses[i].label}>{mses[i].label} in {mses[i].originalKey.split('/')[0]}</Label>)
      }
    });

    return (
      <List.Item>
        <strong>Required microservices</strong>: {renderArr.length > 0 ? renderArr : 'none'}
      </List.Item>
    );
  }

  _generateWorkloadSegments(workloads, wlKey) {
    let segmentRender = <div />;
    const segments = _.map(Object.keys(workloads), (wlSegmentKey) => {
      if (wlKey === wlSegmentKey) {
         segmentRender = _.map(workloads[wlSegmentKey], (workload, idx) => {
          return (
            <Segment padded raised key={workload.label + '-' + workload.originalKey}>
              <Header size='medium'>{workload.label} <small>v{workload.version}</small></Header>
              <Checkbox
                style={{marginBottom: '.75em'}}
                toggle
                label={this.state.fields && _.find(this.state.fields.workloads, (w) => {return w.originalKey === workload.originalKey}).enabled ? 'enabled' : 'disabled'}
                name={`${workload.originalKey}#enablement`}
                onChange={this.handleWorkloadEnablement}
              />
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
                {this.generateUserInputs(workload.userInput, workload.workloadUrl, workload.originalKey)}
                {this._generateRequiredMicroservices(workload)}
              </List>
            </Segment>
          );
        });
      }
    });
    return segmentRender;
  }

  _generateWorkloadSections(workloads) {
    const { servicesForm } = this.props;

    if (this.state.filters.currentApproach === MICROSERVICE_APPROACH) {
      workloads = this.getPossibleWorkloads();
    }

    const orgSections = _.map(Object.keys(workloads), (wlKey) => {
      return (
        <Segment vertical key={wlKey}>
          <Header size='small'>{wlKey}</Header>
          {this._generateWorkloadSegments(workloads, wlKey)}
        </Segment>
      )
    });

    return orgSections;
  }

  render() {
    const { services } = this.props;
    const readyRender = () => {
      return (<div>
        <Header size='large'>Services Selection</Header>

        {typeof this.state.errors !== 'undefined' &&
          <Message error>
            <Message.Header>An error has occurred</Message.Header>
            <p>{JSON.stringify(this.state.errors)}</p>
          </Message>
        }

        <FilterSegment updateCurrentApproach={this.updateCurrentApproach.bind(this)} />
        <br />
          {typeof this.state.fields !== 'undefined' ? 
            <div>
              <Grid columns={2} relaxed>
                <Grid.Column>
                  <Header size='medium'>Microservices</Header>
                  {typeof services !== 'undefined'
                    && typeof services.microservices !== 'undefined'
                    && this._generateMicroserviceSections(services.microservices)
                  }
                </Grid.Column>
                <Grid.Column>
                <Header size='medium'>Workloads</Header>
                  {typeof services !== 'undefined'
                    && typeof services.workloads !== 'undefined'
                    && this._generateWorkloadSections(services.workloads)
                  }
                </Grid.Column>
              </Grid>
              <Button primary onClick={this.handleSubmit}>Submit</Button>
            </div> : <Header>Loading...</Header>
          }
      </div>)
    }

    return (
      <div>
        <Dimmer inverted active={this.state.ephemeral.submitting}>
          <Loader />
        </Dimmer>
        {
          !this.state.ephemeral.fetching && !this.state.ephemeral.submitting ? readyRender() : <Header>Loading...</Header>
        }
        {
          this.state.isWaitingCreds &&
            <Modal
              open={this.state.isWaitingCreds}
              onClose={this.handleModalClose}
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
      </div>
    );
  }
}


export default ServicesForm;