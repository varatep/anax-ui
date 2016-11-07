import React, { Component } from 'react';
import { Button, Checkbox, Container, Dimmer, Header, Form, Input, Image, Divider, List, Loader, Segment, Dropdown } from 'semantic-ui-react';
import {NotificationList} from '../Notifications';
import {exception} from '../../util/dev';
import {fieldSplit} from '../../util/names';
import {mergeState, mgrUpdateGen} from '../../util/localStateOperations';
import * as note from '../../util/notificationManagement';
import * as validator from '../../util/validation';
import {doValidation, checkCitygramAccount} from './helpers';
import {pwsModels, modelFromValue, typeFromValue} from './pwsModels';
import {latLonFetch, fieldIsInError} from '../../util/commonComponentHelpers';
import * as cg from './citygram';
import {error} from '../../util/msgs.js';
import * as _ from 'lodash';

class ServicesForm extends Component {

   // traditional react, use for page-lifecycle state (like error reporting); use redux for app stuff (like validated model values to submit)
  constructor(props) {
    super(props);

    const {servicesForm} = props;
    const init = {
      ephemeral: {
        geo_fetching: true,
        submitting: false
			},
			fields: _.reduce({...servicesForm.fields}, (result, v, k) => { result[k] = _.omit(v, ['enabled']); return result;}, {})
    }

    this.state = note.newManagers(init, ['submit', 'netspeed', 'sdr', 'citygram', 'pws', 'purpleair', 'cputemp']);
  }

  handleCitygramAccount = (event) => {
    // b/c data gets pushed to the store onChange of each field and this is bound to clicks, we can read input field state from the store
    const {attributes, servicesForm, servicesFormMultiFieldChange} = this.props;

    event.preventDefault();
    const mgr = note.segmentMgr(this.state.notificationMgrs, 'citygram');

    // TODO: handle case that the attributes weren't fetched right;
    // TODO: also handle case that attributes don't apply to citygram (b/c they have specified sensor_urls and it isn't one)

		// N.B. the lat / lon are fetched from anax so they are trusted even though they are only in the local state
    cg.citygramAccount(servicesForm.fields.citygram.email, servicesForm.fields.citygram.password, servicesForm.fields.citygram.name, servicesForm.fields.citygram.name, servicesForm.fields.citygram.description, this.state.ephemeral.latitude, this.state.ephemeral.longitude)
      .then((data) => {

        let newMgr;
        switch (data.code) {
          case 1:
            newMgr = mgr.fns.notification('citygram', 'Succeeded authenticating using an existing Citygram account and associating this device with it.');
            break;
          case 2:
            newMgr = mgr.fns.notification('citygram', 'Succeeded creating new Citygram account and associating this device with it.');
            break;
        }

        if (newMgr === undefined) {
          throw error(response, 'Unhandled Citygram server response');
        } else {
          // should lock fields and disable button too
          this.setState(mergeState(this.state, mgrUpdateGen(newMgr)));

          // we do want to track nyu_associated in localstorage b/c once that association is made we don't want the user redoing it even if the page is reloaded or something
          const newState = {
            fields: {
              citygram: {
                nyu_associated: true
              }
            }
          }
          servicesFormMultiFieldChange('citygram', _.omit(newState, ['ephemeral']));
        }
      })
      .catch((error) => {
        console.log('Citygram account setup error', error);
        const newMgr = mgr.fns.error('citygram', 'Failed to associate account, please check your credentials and try again.');
        this.setState(mergeState(this.state, mgrUpdateGen(newMgr)));
      });
  }

  handleDropdownChange = (event, obj) => {
    const {servicesFormFieldChange} = this.props;
    const [segment, fieldName] = fieldSplit(obj.name);

    servicesFormFieldChange(segment, fieldName, obj.value);
  }

  handleFieldChange = (event) => {
    const [segment, fieldName] = fieldSplit(event.target.name);

    // N.B. this function *must* be quick and early so that user doesn't get laggy input
    // TODO: instead of waiting on validation here to set the input text state, return a validationResult immediately with the 'input' field set to the updated value and then have a promise resolution entail updating the validation result with other detail

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

  handleSegmentToggle = (event, obj) => {
    const {servicesFormFieldChange} = this.props;
    const [segment, fieldName] = fieldSplit(obj.name);

    servicesFormFieldChange(segment, fieldName, obj.checked);
  }

  handleInputBlur = (event) => {
		const {servicesFormFieldChange} = this.props;
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

        servicesFormFieldChange(segment, fieldName, validationResult.value);
      }
    }
  }

	// TODO: consolidate common operations with other forms
  handleSubmit = () => {
    const {attributes, servicesForm, servicesFormFieldChange, servicesFormSubmit, router} = this.props;

    this.setState(mergeState(this.state, {ephemeral: { submitting: true }}));

    const submitMgr = note.segmentMgr(this.state.notificationMgrs, 'submit');
    const allErrors = _.flatMap(_.omit(this.state.notificationMgrs, ['submit']), (mgr) => { return mgr.fns.allErrorMsgs();});

    if (!_.isEmpty(allErrors)) {
      const newMgr = submitMgr.fns.error('submit', 'Please resolve field errors and submit again.');
      this.setState(mergeState(this.state, mgrUpdateGen(newMgr)));
    } else {
      servicesFormSubmit(attributes, servicesForm).then((success) => {
				// !!IMPORTANT!! scrub passwords and other sensitive data from local storage before changing route
				servicesFormFieldChange('citygram', 'password', '');
        router.push('/dashboard');
      }).catch((err) => {
				console.log('Service registration failed', err);
        const newMgr = submitMgr.fns.error('submit', `Services submission error. ${err.msg}.`);
        this.setState(mergeState(this.state, {ephemeral: { submitting: false }}));
        this.setState(mergeState(this.state, mgrUpdateGen(newMgr)));
      });
    }
  }

  componentDidMount() {
    document.title += ' - Services Registration';

    const {onAttributesGet, servicesFormFieldChange, servicesFormMultiFieldChange} = this.props;

    // fetch attributes; checked in submit
    onAttributesGet();

		const update = {
			ephemeral: {
				geo_fetching: true
			}
		}

		this.setState(mergeState(this.state, update));

		// TODO: make sure this doesn't happen if the values are already set in the servicesForm

		// we know this may have already been done in a previous setup step but we do it again so this part of the setup in the common case can be done again independently; TODO: cache to save work if the data is already available
		latLonFetch().then((locationData) => {

			const newState = {
				fields: {
					citygram: {
						description: `Edge microphone in ${locationData.geo_alias.city}, ${locationData.geo_alias.country}`
					},
					pws: {
						wugname: `PWS in ${locationData.geo_alias.city}, ${locationData.geo_alias.country}`
					}
				},
				ephemeral: {
					geo_fetching: false
				}
			};

			servicesFormMultiFieldChange('citygram', _.omit(newState, ['ephemeral']));
			this.setState(mergeState(this.state, newState));
		}).catch((err) => {
			console.log('failed to fetch location data', err);
			// TODO: in this case, need to make sure the fields still get set to something and the geo_fetching is set to false; perhaps a device name for the fields?
		});
	}

  render() {
    const {servicesForm, display, router, netspeed} = this.props;

		// options for select
    const netspeedTestAlgs = [
      {
        value: 'closest',
        text: 'Closest Server'
      },
      {
        value: 'random',
        text: 'Random Server'
      },
      {
        value: 'fastest',
        text: 'Fastest Server'
      }
    ];

    return (
      <div>
        <Header size='large'>Services Selection</Header>
        <Segment padded raised>
          <Header size='medium'>Netspeed</Header>
          <Image src='/images/netspeed.svg' size='tiny' spaced floated='left' />
          <Checkbox style={{marginBottom: '.75em'}} toggle label={servicesForm.fields.netspeed.enabled ? 'enabled' : 'disabled'} name='netspeed.enabled' defaultChecked={servicesForm.fields.netspeed.enabled} onChange={this.handleSegmentToggle} />
          <p>Local network monitoring and analysis. Bandwidth, ping, and traceroutes from your device.</p>
          <p><strong>Hardware required</strong>: Internet connectivity</p>
          <Divider horizontal>Detail</Divider>
          <p><a href='http://dyn.com/'>Dyn</a> has partnered with Blue Horizon to demonstrate Dyn's advanced network monitoring technologies on Horizon. Your device will perform network speed and route testing to internet websites (Facebook, Twitter, Netflix, among others) and statistics will be viewable on Dyn and Horizon webpages. No personal information or personal Internet usage data will be gathered or shared.</p>
          <ShowHide visibility={servicesForm.fields.netspeed.enabled}>
            <Form className='attached fluid segment' id='netspeed' onSubmit={(event) => {event.preventDefault();}}>
              <Form.Dropdown placeholder='Bandwidth test target server selection algorithm' selection fluid label='Test Algorithm' name='netspeed.testalg' value={servicesForm.fields.netspeed.testalg} onChange={this.handleDropdownChange} options={netspeedTestAlgs} />
            </Form>
          </ShowHide>
        </Segment>

        <Segment padded raised>
          <Header size='medium'>Citygram</Header>
          <Image src='/images/citygram.svg' size='tiny' spaced floated='left' />
          <Checkbox style={{marginBottom: '.75em'}} toggle label={servicesForm.fields.citygram.enabled ? 'enabled' : 'disabled'} name='citygram.enabled' defaultChecked={servicesForm.fields.citygram.enabled} onChange={this.handleSegmentToggle} />
          <p>Local noise pollution and sound analysis.</p>
          <p><strong>Hardware required</strong>: USB sound card and analog microphone</p>
          <Divider horizontal>Detail</Divider>
          <p><a href='http://www.nyu.edu/'>NYU</a>’s Steinhardt Music School has partnered with Blue Horizon to demonstrate their Citygram noise pollution and characterization community efforts. Your device will sample ambient noise, run sound analyses, and stream data back to NYU’s and IBM’s cloud endpoints. Voice data is not streamed from the device, only facts gathered through DSP: dB levels, spectral information, etc. No personal information will be gathered or shared, and your voice can’t be reverse-engineered from the data stream.</p>
          <ShowHide visibility={servicesForm.fields.citygram.enabled}>
            <Header size='small'>Citygram Account</Header>
            {!servicesForm.fields.citygram.nyu_associated ?
                <p>To configure your Remote Sensing Device (RSD), enter your credentials for NYU's <a href='https://citygramsound.com:4347/indexA1.html'>Citygram</a> system below. If you do not have an account in the Citygram system, a new account will be created for you with the provided credentials.</p>
                :
                <p>Your device has been associated with NYU's Citygram services.</p>
            }
            <NotificationList attached={true} mgr={note.segmentMgr(this.state.notificationMgrs, 'citygram')} notificationHeader='Citygram Service Setup' errHeader='Citygram Service Setup Error' />
            <Form className='attached fluid segment' id='citygram' onSubmit={(event) => {event.preventDefault();}}>
              <Form.Input autoComplete="off" fluid icon='circle thin' loading={this.state.ephemeral.geo_fetching} name='citygram.description' defaultValue={servicesForm.fields.citygram.description} placeholder='Citygram Device Description' disabled={true} />
              <br />
              <Form.Input fluid label='Device Name' name="citygram.name" value={this.state.fields.citygram.name} placeholder="Citygram Device Name" onChange={this.handleFieldChange} error={fieldIsInError(this, 'citygram.name')} onBlur={this.handleInputBlur} disabled={servicesForm.fields.citygram.nyu_associated} />
              <Form.Input fluid label='Email' name='citygram.email' value={this.state.fields.citygram.email} placeholder='Citygram Email' onChange={this.handleFieldChange} error={fieldIsInError(this, 'citygram.email')} onBlur={this.handleInputBlur} disabled={servicesForm.fields.citygram.nyu_associated} />
              <Form.Input fluid label='Password' name='citygram.password' value={this.state.fields.citygram.password} placeholder='Citygram Password' onChange={this.handleFieldChange} error={fieldIsInError(this, 'citygram.password')} onBlur={this.handleInputBlur} disabled={servicesForm.fields.citygram.nyu_associated} />
              {!servicesForm.fields.citygram.nyu_associated ? <Button basic color="blue" onClick={this.handleCitygramAccount}>Associate Device</Button> : <span></span>}
            </Form>
          </ShowHide>
        </Segment>

        <Segment padded raised>
          <Header size="medium">SDR (Software-Defined Radio)</Header>
          <Image src='/images/sdr.svg' size='tiny' spaced floated='left' />
          <Checkbox style={{"marginBottom": ".75em"}} toggle label={servicesForm.fields.sdr.enabled ? 'enabled' : 'disabled'} name='sdr.enabled' defaultChecked={servicesForm.fields.sdr.enabled} onChange={this.handleSegmentToggle} />
          <p><strong>Hardware required</strong>: <a href="https://bluehorizon.network/documentation/rpi2">USB RTL-SDR Kit: Dongle and antenna</a></p>
          <Divider horizontal>Detail</Divider>
          <p>Using the SDR as a sensor, your device will host a radio frequency spectrum analyzer. Users will be able to run waterfall scans from 24Hz-1.8Ghz. The system will gather aircraft data over ADS-B for display on the Horizon website. IBM Watson speech-to-text and sentiment analysis will be run on local radio stations, to show what’s being discussed on airwaves in your area.</p>
          <ShowHide visibility={servicesForm.fields.sdr.enabled}>
          </ShowHide>
        </Segment>

        <Segment padded raised>
          <Header size="medium">Personal Weather Station</Header>
          <Image src='/images/pws.svg' size='tiny' spaced floated='left' />
          <Checkbox style={{"marginBottom": ".75em"}} toggle label={servicesForm.fields.pws.enabled ? 'enabled' : 'disabled'} name='pws.enabled' defaultChecked={servicesForm.fields.pws.enabled} onChange={this.handleSegmentToggle} />
          <p><strong>Hardware required</strong>: A personal weather station. Supported models are listed in <a href="http://www.weewx.com/docs/usersguide.htm#hardware">WeeWX documentation</a>.</p>
          <Divider horizontal>Detail</Divider>
          <p>Weather data from your device will be published on the <a href="http://bluehorizeon.network/map">Blue Horizon map</a> and at <a href="http://www.wunderground.com">weatherunderground.com</a>.</p>
          <ShowHide visibility={servicesForm.fields.pws.enabled}>
            <Form className='attached fluid segment' id='pws' onSubmit={(event) => {event.preventDefault();}}>
              <Form.Input fluid icon='circle thin' loading={this.state.ephemeral.geo_fetching} name='pws.wugname' defaultValue={servicesForm.fields.pws.wugname} placeholder='PWS Name' disabled={true} />
              <Form.Dropdown placeholder='PWS Model Selection' selection fluid label='Weather Station Model Selection' name='pws.modelType' value={servicesForm.fields.pws.modelType} onChange={this.handleDropdownChange} options={pwsModels} />
						</Form>
          </ShowHide>
        </Segment>

        <Segment padded raised>
          <Header size="medium">CPU Temperature Sharing</Header>
          <Image src='/images/cputemp.svg' size='tiny' spaced floated='left' />
          <Checkbox style={{"marginBottom": ".75em"}} toggle label={servicesForm.fields.cputemp.enabled ? 'enabled' : 'disabled'} name='cputemp.enabled' defaultChecked={servicesForm.fields.cputemp.enabled} onChange={this.handleSegmentToggle} />
          <p><strong>Hardware Required: </strong>Pi</p>
          <Divider horizontal>Detail</Divider>
          <p>The CPU Temperature application shares the current temperature of the device’s CPU. This application is intended primarily as an example data source for application developers. Interested developers can follow the instructions in <a href="https://bluehorizon.network/documentation/developer-guide">the Blue Horizon Developers Guide</a> to rapidly develop an application that will send this CPU temperature data to a cloud service for visualization.</p>
          <ShowHide visibility={servicesForm.fields.cputemp.enabled}>
          </ShowHide>
        </Segment>

        <Segment padded raised>
          <Header size="medium">Air Pollution Monitoring</Header>
          <Image src='/images/purpleair.svg' size='tiny' spaced floated='left' />
          <Checkbox style={{"marginBottom": ".75em"}} toggle label={servicesForm.fields.purpleair.enabled ? 'enabled' : 'disabled'} name='purpleair.enabled' defaultChecked={servicesForm.fields.purpleair.enabled} onChange={this.handleSegmentToggle} />
          <p><strong>Hardware Required: </strong>A Purple Air Sensor (cf. <a href="http://www.purpleair.org">purpleair.org</a>)</p>
          <Divider horizontal>Detail</Divider>
          <p>Horizon has partnered with <a href="http://www.purpleair.org">purpleair.org</a> to foster gathering and analysis of air pollution data around the globe.</p>
          <ShowHide visibility={servicesForm.fields.purpleair.enabled}>
            <p>To use your PurpleAir pollution sensor on Horizon:</p>
            <List bulleted>
              <List.Item>Set up the sensor on your home wifi according to the <a href="http://www.purpleair.org/install">installation instructions</a></List.Item>
              <List.Item>Record your sensor’s hostname (for example, <strong><em>airmonitor_b15.local</em></strong>) and enter it in the field below</List.Item>
            </List>
						<NotificationList attached={true} mgr={note.segmentMgr(this.state.notificationMgrs, 'purpleair')} notificationHeader='PurpleAir Service Setup' errHeader='PurpleAir Service Setup Error' />
            <Form className="attached fluid segment" onSubmit={(event) => {event.preventDefault();}} id="purpleair">
              <Form.Input fluid label="Name" name="purpleair.devicehostname" value={this.state.fields.purpleair.devicehostname} onChange={this.handleFieldChange} onBlur={this.handleInputBlur} error={fieldIsInError(this, 'purpleair.devicehostname')} placeholder="PurpleAir device hostname" />
            </Form>
          </ShowHide>
        </Segment>

        <NotificationList attached={false} mgr={note.segmentMgr(this.state.notificationMgrs, 'submit')} notificationHeader='Submission' errHeader='Submission Error' />
        <Button.Group>
          <Button color="blue" onClick={this.handleSubmit} loading={this.state.ephemeral.submitting} disabled={this.state.ephemeral.submitting}>Register Services</Button>
        </Button.Group>
      </div>
    );
  }
}

class ShowHide extends Component {

  render() {
    const {visibility, children} = this.props;

    return (
      <div> {visibility ? children : <span></span> }</div>
    );
  }
}

export default ServicesForm;
