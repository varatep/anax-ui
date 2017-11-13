import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import {
  Button, Header, Form, Input, Divider, Segment,
  Message, List, Checkbox, Grid, Icon, Label,
} from 'semantic-ui-react';
import * as _ from 'lodash';
import * as note from '../../util/notificationManagement';
import {mergeState, mgrUpdateGen} from '../../util/localStateOperations';
import {doValidation, referrerDomain} from './helpers';
import {NotificationList} from '../Notifications';
import {exception} from '../../util/dev';
import {fieldSplit} from '../../util/names';
import {fieldIsInError} from '../../util/commonComponentHelpers';

class AccountForm extends Component {

  constructor(props) {
    super(props);

    const {accountForm} = props;

    const init = {
      ephemeral: {
        submitting: false,
        accountExists: false,
        passwordType: 'password',
      },
      fields: {...accountForm.fields},
    };
    this.state = note.newManagers(init, ['account']);
    this.handlePasswordVisibility = this.handlePasswordVisibility.bind(this);
		console.log('state', this.state);
		console.log('accountForm', accountForm);
  }

  handleFieldChange = (event) => {
    // N.B. this function *must* be quick and early so that user doesn't get laggy input
    const [segment, fieldName] = fieldSplit(event.target.name);

    let fieldType = event.target.name.split('.')[event.target.name.split('.').length - 1];
    let fieldValue = event.target.value;
    const accountFormTemplate = `{"fields":{"account":{"${fieldType}":"${fieldValue}"}}}`;
    this.setState(mergeState(this.state, JSON.parse(accountFormTemplate)));

    // TODO: instead of waiting on validation here to set the input text state, return a validationResult immediately with the 'input' field set to the updated value and then have a promise resolution entail updating the validation result with other detail

    doValidation(segment, fieldName, event.target.value)
      .then((validationResult) => {
        if (!validationResult.isError()) {
          // clear these early, let further submits create new ones if necessary
          const newMgr = note.segmentMgr(this.state.notificationMgrs, 'account').fns.clearDs('errors');
          this.setState(mergeState(this.state, mgrUpdateGen(newMgr)));
        }

        // handleValidationResult always returns a properly-updated state object
        this.setState(note.handleValidationResult(this.state, validationResult));
      });
  }

  handleInputBlur = (event) => {
    const {accountFormFieldChange} = this.props;
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

        accountFormFieldChange(segment, fieldName, validationResult.value);
      }
    }
  }

  handleSubmit = (expectExistingAccount) => {
    const {configuration, accountFormDataSubmit, device, accountForm, accountFormFieldChange, router, setExpectExistingAccount} = this.props;

        // .then(() => {
        //   router.push('/setup');
        // })
        // .catch((err) => {
        //   const newMgr = submitMgr.fns.error('account', `Error in setting account existance expectations. ${err.msg}`);
        // })

		this.setState(mergeState(this.state, {ephemeral: { submitting: true }}));

    const submitMgr = note.segmentMgr(this.state.notificationMgrs, 'account');
    const allErrors = _.flatMap(_.omit(this.state.notificationMgrs, ['account']), (mgr) => { return mgr.fns.fieldErrorMsgs();});

    if (!_.isEmpty(allErrors)) {
      const newMgr = submitMgr.fns.error('submit', 'Please resolve field errors and submit again.');
      this.setState(mergeState(this.state, mgrUpdateGen(newMgr)));
    } else {
      setExpectExistingAccount(expectExistingAccount);
      this.setState(mergeState(this.state, {ephemeral: { submitting: false }}));
      router.push('/setup');
      // accountFormDataSubmit(configuration.exchange_api, device.id, accountForm, expectExistingAccount).then((success) => {
			// 	accountFormFieldChange('account', 'password', '');
      //   router.push('/setup');
      // }).catch((err) => {
      //   const newMgr = submitMgr.fns.error('account', `Account data submission error. ${err.msg}`);
      //   this.setState(mergeState(this.state, {ephemeral: { submitting: false }}));
      //   this.setState(mergeState(this.state, mgrUpdateGen(newMgr)));
      // });
    }
	}

// TODO: update
  handlePasswordReset = (event) => {
    const {configuration, accountFormNotification, accountFormPasswordReset, accountForm} = this.props;

		const mgr = note.segmentMgr(this.state.notificationMgrs, 'account');

    if (this.state.fields.account.username === '') {
			const newMgr = mgr.fns.error('account', 'Form incomplete.');
			this.setState(mergeState(this.state, mgrUpdateGen(newMgr)));
    } else {
			accountFormPasswordReset(configuration.exchange_api, accountForm.fields.account.username)
				.then(() => {
					const newMgr = mgr.fns.notification('account', 'Succeeded issuing password reset, please check your email inbox for a password reset message.');
					this.setState(mergeState(this.state, mgrUpdateGen(newMgr)));
				})
					.catch((err) => {
					console.log('Password reset failed', err);
					const newMgr = mgr.fns.error('account', `Reset error. ${err.msg}.`);
					this.setState(mergeState(this.state, mgrUpdateGen(newMgr)));
				});
			}
  }

  // handler for semantic checkbox toggle between new account and
  //  existing account
  handleAccountToggle = (event, checkboxProps) => {
    const newMgr = note.segmentMgr(this.state.notificationMgrs, 'account').fns.clearDs('fieldValidationResults');
    this.setState(mergeState(this.state, { ephemeral: { accountExists: checkboxProps.checked }}));
    this.setState(mergeState(this.state, mgrUpdateGen(newMgr)), function() {
      this.setState(mergeState(this.state, { ephemeral: { accountExists: checkboxProps.checked }}));
    });
  }

  handlePasswordVisibility(evt) {
    console.log('evt', evt);
    if (this.state.ephemeral.passwordType === 'password') {
      this.setState(mergeState(this.state, {
        ephemeral: {
          passwordType: 'text',
        }
      }));
    } else {
      this.setState(mergeState(this.state, {
        ephemeral: {
          passwordType: 'password',
        }
      }));
    }

  }

  componentWillMount() {
    document.title += ' - Account Setup';

    const {device, router} = this.props;

    if ('account' in device) {
      console.log('redirecting to dashboard');
      // user has already registered, send 'em to the dash!
      router.push('/dashboard');
    }
  }

  render() {
    // TODO: make sure returning to this page after reg (like if user hits the back button), causes redirection to dashboard

    let accountForm;

    !this.state.ephemeral.accountExists ? accountForm =
      <Form className="attached fluid segment" onSubmit={(event) => {event.preventDefault();} } id='account'>
        <Form.Input fluid focus label='Organization' name='account.organization' value={this.state.fields.account.organization} placeholder='Organization - Enter `public` for default' onChange={this.handleFieldChange} error={fieldIsInError(this, 'account.organization')} onBlur={this.handleInputBlur} />
        <Form.Input fluid focus label='Username' name='account.username' value={this.state.fields.account.username} placeholder='Username' onChange={this.handleFieldChange} error={fieldIsInError(this, 'account.username')} onBlur={this.handleInputBlur} />
        <Form.Input
          fluid
          label='Password'
          name='account.password'
          type={this.state.ephemeral.passwordType}
          value={this.state.fields.account.password}
          placeholder='Password'
          onChange={this.handleFieldChange}
          error={fieldIsInError(this, 'account.password')}
          placeholder="Password" onBlur={this.handleInputBlur}
          icon={<Icon
            name="eye"
            link
            onClick={this.handlePasswordVisibility}
          />}
        />
        <Form.Input fluid label='Email' name='account.email' value={this.state.fields.account.email} placeholder='Email address' onChange={this.handleFieldChange} error={fieldIsInError(this, 'account.email')} placeholder='Email address' onBlur={this.handleInputBlur} />
        <Form.Input fluid focus
          label={<label>Device Name - <small>Enter a name for device {this.props.device.id} that you will easily recognize.</small></label>}
          name='account.devicename'
          value={this.state.fields.account.devicename}
          placeholder='Device Name'
          onChange={this.handleFieldChange}
          error={fieldIsInError(this, 'account.devicename')}
          onBlur={this.handleInputBlur}
        />
        <Button type="button" primary color="blue" onClick={() => {this.handleSubmit(false);}} loading={this.state.ephemeral.submitting} disabled={this.state.ephemeral.submitting}>Continue</Button>
      </Form>
      : accountForm =
      <Form className="attached fluid segment" onSubmit={(event) => {event.preventDefault();} } id='account'>
        <Form.Input fluid focus label='Organization' name='account.organization' value={this.state.fields.account.organization} placeholder='Organization - Default is `public`' onChange={this.handleFieldChange} error={fieldIsInError(this, 'account.organization')} onBlur={this.handleInputBlur} />
        <Form.Input fluid focus label='Username' name='account.username' value={this.state.fields.account.username} placeholder='Username' onChange={this.handleFieldChange} error={fieldIsInError(this, 'account.username')} onBlur={this.handleInputBlur} />
        <Form.Input
          fluid
          label='Password'
          name='account.password'
          type={this.state.ephemeral.passwordType}
          value={this.state.fields.account.password}
          placeholder='Password'
          onChange={this.handleFieldChange}
          error={fieldIsInError(this, 'account.password')}
          placeholder="Password"
          onBlur={this.handleInputBlur}
          icon={<Icon
            name="eye"
            link
            onClick={this.handlePasswordVisibility}
          />}
        />
        <Form.Input fluid focus
          label={<label>Device Name - <small>Enter a name for device {this.props.device.id} that you will easily recognize.</small></label>}
          name='account.devicename'
          value={this.state.fields.account.devicename}
          placeholder='Device Name'
          onChange={this.handleFieldChange}
          error={fieldIsInError(this, 'account.devicename')}
          onBlur={this.handleInputBlur}
        />
        <Button type="button" primary color="blue" onClick={() => {this.handleSubmit(true);}} loading={this.state.ephemeral.submitting} disabled={this.state.ephemeral.submitting}>Continue</Button>
        <Button basic onClick={this.handlePasswordReset}>Reset Password</Button>
      </Form>;
    return (
      <div>
        <Header size="large">Account Setup</Header>
        <Segment padded raised>
          <p>Register this device with an existing Blue Horizon Exchange user account or create a new account and register this device to it.</p>
          <Checkbox
            toggle
            onChange={this.handleAccountToggle}
            label={<label>I have an account with Horizon.</label>}
          />
          <br /><br />

					<NotificationList attached={true} mgr={note.segmentMgr(this.state.notificationMgrs, 'account')} notificationHeader='Account Setup' errHeader='Account Data Error' />
          {accountForm}
        </Segment>
      </div>
    );
  }
}

export default AccountForm;
