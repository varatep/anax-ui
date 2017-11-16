import React, { Component } from 'react';
import { Button, Checkbox, Container, Header, Form, Input, Divider, Segment, Message, List } from 'semantic-ui-react';
import {NotificationList} from '../Notifications';
import {exception} from '../../util/dev';
import {fieldSplit} from '../../util/names';
import {mergeState, mgrUpdateGen} from '../../util/localStateOperations';
import * as _ from 'lodash';
import * as note from '../../util/notificationManagement';
import {doValidation, referrerDomain} from './helpers';
import {latLonFetch, fieldIsInError} from '../../util/commonComponentHelpers';
import {getBaseUrl} from '../../util/envCheck';

class DeviceForm extends Component {

  constructor(props) {
    super(props);

    const {deviceForm} = props;
    const init = {
      ephemeral: {
        latlon_fetching: false,
        preview_loading: false,
        submitting: false
      },
      fields: {...deviceForm.fields}
    };
    this.state = note.newManagers(init, ['submit', 'location', 'motion']);
  }

  /* N.B. all handlers need to be class methods and be bound in constructor *or* use the experimental func syntax in es6 */

  handleCheckboxChange = (event, obj) => {
    const {deviceFormFieldChange} = this.props;
    const [segment, fieldName] = fieldSplit(obj.name);

    deviceFormFieldChange(segment, fieldName, obj.checked);
  }

  handleFieldChange = (event) => {
    const [segment, fieldName] = fieldSplit(event.target.name);

    // N.B. this function *must* be quick and early so that user doesn't get laggy input
    // TODO: instead of waiting on validation here to set the input text state, return a validationResult immediately with the 'input' field set to the updated value and then have a promise resolution entail updating the validation result with other detail

    if (fieldName === 'latitude' || fieldName === 'longitude') {
      const update = {
        ephemeral: {
          preview_loading: true
        }
      };
      this.setState(mergeState(this.state, update));
    }

    doValidation(segment, fieldName, event.target.value)
      .then((validationResult) => {
        if (!validationResult.isError()) {
          // clear these early, let further submits create new ones if necessary
          const newMgr = note.segmentMgr(this.state.notificationMgrs, 'submit').fns.clearDs('errors');
          this.setState(mergeState(this.state, mgrUpdateGen(newMgr)));
        }

        // handleValidationResult always returns a properly-updated state object
        this.setState(note.handleValidationResult(this.state, validationResult));
      });
  }

  handleInputBlur = (event) => {
    const {deviceFormFieldChange} = this.props;
    const [segment, fieldName] = fieldSplit(event.target.name);

    // a mgr is specific to a segment
    const mgr = note.segmentMgr(this.state.notificationMgrs, segment);
    const validationResult = mgr.fns.fieldValidationResult(fieldName);

    // validationResult can be null if there was never a change in the field
    if (validationResult !== null) {
      if (validationResult.isError()) {
        console.log('skipping action dispatch on event', event, 'b/c field is in error. Msg', validationResult.errorMsg);
      } else {
        // save in store; N.B.! Important that we use the value from the mgr b/c it contains the validation outcome with a possibly typed or sanitized value

        deviceFormFieldChange(segment, fieldName, validationResult.value);
      }
    }
  }

  handleLatLonFocus = () => {
    const update = {
      ephemeral: {
        latlon_fetching: false
      }
    };
    this.setState(mergeState(this.state, update));
  }

  handlePreviewLoad = () => {
    const update = {
      ephemeral: {
        preview_loading: false
      }
    }
    this.setState(mergeState(this.state, update));
  }

  handleSubmit = () => {
    const {deviceForm, deviceFormSubmit, deviceFormSubmitBlockchain, router} = this.props;

    this.setState(mergeState(this.state, {ephemeral: { submitting: true }}));

    const submitMgr = note.segmentMgr(this.state.notificationMgrs, 'submit');
    const allErrors = _.flatMap(_.omit(this.state.notificationMgrs, ['submit']), (mgr) => { return mgr.fns.allErrorMsgs();});

    if (!_.isEmpty(allErrors)) {
      const newMgr = submitMgr.fns.error('submit', 'Please resolve field errors and submit again.');
      this.setState(mergeState(this.state, mgrUpdateGen(newMgr)));
    } else {
      if (deviceForm.fields.pattern.usepattern) {
        router.push('/setup/pattern');
      } else {
        router.push('/setup/services');
      }
      // deviceFormSubmit(deviceForm).then((success) => {
      //   deviceFormSubmitBlockchain(deviceForm).then((bcSuccess) => {
      //     router.push('/setup/services');
      //   }).catch((bcErr) => {
      //     const newBCMgr = submitMgr.fns.error('submit', `Blockchain configuration error. ${bcErr.msg}`);
      //     this.setState(mergeState(this.state, {ephemeral: { submitting: false }}));
      //     this.setState(mergeState(this.state, mgrUpdateGen(newMgr)));
      //   });
      // }).catch((err) => {
      //   const newMgr = submitMgr.fns.error('submit', `Location submission error. ${err.msg}`);
      //   this.setState(mergeState(this.state, {ephemeral: { submitting: false }}));
      //   this.setState(mergeState(this.state, mgrUpdateGen(newMgr)));
      // });
    }
  }

  componentDidMount() {
    document.title += ' - Account Setup';

    const {deviceFormFieldChange, deviceFormMultiFieldChange} = this.props;

    // N.B. must not use undefined here or react thinks the input is uncontrolled
    if (this.state.fields.location.latitude === '' || this.state.fields.location.longitude === '') {
      const update = {
        ephemeral: {
          latlon_fetching: true,
          preview_loading: true
        }
      }

      this.setState(mergeState(this.state, update));

      latLonFetch().then((locationData) => {
        if (this.state.ephemeral.latlon_fetching) {
          // still fetching so we're cool to replace the values locally (on page) and then dispatch the change since the handler for change won't be fired but we want to do the same work

          const newState = {
            fields: {
              location: _.merge({}, locationData.latlon, {user_provided_coords: false})
            },
            ephemeral: {
              latlon_fetching: false
            }
          };

          deviceFormMultiFieldChange('location', _.omit(newState, ['ephemeral']));
          this.setState(mergeState(this.state, newState));
        }
      }).catch((err) => {
        const mgr = note.segmentMgr(this.state.notificationMgrs, 'location');
        const newMgr = mgr.fns.error(err.msg);
        const update = {
          ephemeral: {
            latlon_fetching: false
          }
        }
        this.setState(mergeState(this.state, mergeState(update, mgrUpdateGen(newMgr))));
      });
    }
  }

  render() {
    const {configuration} = this.props;

    const envUrl = configuration.exchange_api && getBaseUrl(configuration.exchange_api);

    return (
      <div>
        <Header size='large'>Device Setup</Header>
        {/* <Container fluid>
          <Header size='medium'>Security Considerations</Header>
          <p>Your device is accessible via a default account name and password. It is recommended that you change this password to avoid unwanted access.</p>
          <p>To change your Pi's default password, log in to your Pi via the console (if using an external monitor) or ssh from another computer. For example:</p>
            <pre>$ ssh root@<span id='localIp'>{referrerDomain()}</span></pre>

            <p>(Account name: root, password: horizon)</p>

            <pre>$ passwd</pre>
            <p>(set new password as prompted)</p>
            <p>Additional security advice: Take care to not expose the device management page outside of your LAN. Use proper LAN security measures (strong router passwords, firewall).</p>

        </Container> */}
        <Segment padded>
          <Header size='medium'>Device Location</Header>
          <p>Your device location will be made public by some applications like the <a href={`${envUrl}/map/`} target='_blank'>Horizon Map</a>. Many applications (including the Weather Underground Personal Weather Station publisher and NYU Citygram Sound analysis experiment) require accurate location data to produce useful results.</p>

          <NotificationList attached={true} mgr={note.segmentMgr(this.state.notificationMgrs, 'location')} notificationHeader='Location Setup' errHeader='Location Data Error' />
          <Form className='attached fluid segment' id='location' onSubmit={(event) => {event.preventDefault();}}>
            <Form.Input fluid focus icon='circle thin' loading={this.state.ephemeral.latlon_fetching} label='Latitude' name='location.latitude' value={this.state.fields.location.latitude} onChange={this.handleFieldChange} onFocus={this.handleLatLonFocus} onBlur={this.handleInputBlur} error={fieldIsInError(this, 'location.latitude')} placeholder='Latitude' />
            <Form.Input fluid icon='circle thin' loading={this.state.ephemeral.latlon_fetching} label='Longitude' name='location.longitude' value={this.state.fields.location.longitude} onChange={this.handleFieldChange} onFocus={this.handleLatLonFocus} onBlur={this.handleInputBlur} error={fieldIsInError(this, 'location.longitude')} placeholder='Longitude' />
            <Form.Input 
              fluid 
              icon='circle thin'
              label='Location Accuracy (km) - Used to show a location estimation within a certain km instead of the device&#39;s actual location.' 
              name='location.location_accuracy_km' 
              value={this.state.fields.location.location_accuracy_km} 
              onChange={this.handleFieldChange} 
              onBlur={this.handleInputBlur} 
              error={fieldIsInError(this, 'location.location_accuracy_km')} 
              placeholder='Location Accuracy (km)' 
            />
          </Form>

          <Divider horizontal>Info</Divider>
          <Container fluid>
            <p>Coordinates are in decimal degrees; <em>South</em> latitudes and <em>West</em> longitudes are expressed as negative values. We've pre-filled the fields with discovered values. If you'd like to correct inaccurate discovered values, you might browse to <a href='http://www.latlong.net/' target='_blank'>LatLong.net</a> to find yourself on a world map.</p>
          </Container>
          <Divider horizontal>Map Preview</Divider>
          <Segment textAlign='center' loading={this.state.fields.location.latitude === '' || this.state.fields.location.latitude === '' || this.state.ephemeral.preview_loading} padded>
            <img src={'http://staticmap.openstreetmap.de/staticmap.php?center='+String(this.state.fields.location.latitude)+','+String(this.state.fields.location.longitude)+'&zoom=15&markers='+String(this.state.fields.location.latitude)+','+String(this.state.fields.location.longitude)+',ol-marker'} onLoad={this.handlePreviewLoad} />
          </Segment>
        </Segment>

        <Segment padded>
          <Header size='medium'>Moving Device</Header>
          <p>If your device moves from place to place and is equipped with a GPS sensor, its most current location is useful to some applications. Do you wish to allow applications to read your GPS location data?</p>

          <Form id='motion'>
            <Checkbox style={{marginBottom: '.75em'}} toggle label='Share GPS location data' name='motion.usegps' defaultChecked={this.state.fields.motion.usegps} onChange={this.handleCheckboxChange} />
          </Form>

          <p><strong>Note</strong>: You needn't have a GPS device at this time to opt-in; if you attach a device at a later time the system will make use of it.</p>
        </Segment>

        <Segment padded>
          <Header size='medium'>Blockchain</Header>
          <p>If enabled, agreements made with your device are recorded on Horizon's Ethereum Blockchain.</p>

          <Form id='blockchain'>
            <Checkbox style={{marginBottom: '.75em'}} toggle label='Enable Blockchain for your device' name='blockchain.usebc' defaultChecked={this.state.fields.blockchain.usebc} onChange={this.handleCheckboxChange} />
          </Form>
        </Segment>

        <Segment padded disabled>
          <Header size='medium'>Pattern</Header>
          <p>If enabled, device registration will use a pattern approach instead of a microservice/workload approach.</p>

          <Message>
            <p>Pattern usage is currently required for registration.</p>
          </Message>

          <Form id='pattern'>
            <Checkbox disabled style={{marginBottom: '.75em'}} toggle label='Use pattern registration' name='pattern.usepattern' defaultChecked={this.state.fields.pattern.usepattern} onChange={this.handleCheckboxChange} />
          </Form>
        </Segment>

        <Segment padded>
          <Header size='medium'>Project Involvement</Header>
          <p>This project is under active development and we'd like to hear your feedback in our forum: <a href='https://discourse.bluehorizon.network/' target='_blank'>https://discourse.bluehorizon.network/</a>.</p>
        </Segment>

        <NotificationList attached={false} mgr={note.segmentMgr(this.state.notificationMgrs, 'submit')} notificationHeader='Submission' errHeader='Submission Error' />
        <Button.Group>
          <Button color='blue' onClick={this.handleSubmit} loading={this.state.ephemeral.submitting} disabled={this.state.ephemeral.submitting}>Register Device Settings</Button>
        </Button.Group>
      </div>
    );
  }
}

export default DeviceForm;
