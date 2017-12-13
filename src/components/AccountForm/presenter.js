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
        tokenExists: false,
        passwordType: 'password',
      },
      generatedToken: undefined,
      error: undefined,
      fields: {...accountForm.fields},
    };
    this.state = note.newManagers(init, ['account']);
    this.handlePasswordVisibility = this.handlePasswordVisibility.bind(this);
    this.handleAccountToggle = this.handleAccountToggle.bind(this);
    this.handleTokenToggle = this.handleTokenToggle.bind(this);
    this.handleGenerateToken = this.handleGenerateToken.bind(this);
  }

  handleGenerateToken(evt, data) {
    const { onGenerateNodeToken } = this.props;

    onGenerateNodeToken()
        .then((res) => {
          this.setState({generatedToken: res});
          const input = document.querySelector('#tokenInput');
          input.value = res;
          return res;
        })
        .catch((error) => {
          this.setState({error});
        });
  }

  handleAccountToggle(evt, data) {
    this.setState(mergeState(this.state, {errors: undefined, ephemeral: {accountExists: data.checked, tokenExists: false}}), () => {
      this.tokenCheckRef.checked = false;
    });
  }

  handleTokenToggle(evt, data) {
    this.setState(mergeState(this.state, {ephemeral: {tokenExists: data.checked}, errors: undefined}));
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
    const {configuration, accountFormDataSubmit, device, accountForm, accountFormFieldChange, router, setExpectExistingAccount, onSetExpectExistingToken, onCheckAccountCredentials, onCreateExchangeUserAccount} = this.props;

		this.setState(mergeState(this.state, {ephemeral: { submitting: true }}));

    const submitMgr = note.segmentMgr(this.state.notificationMgrs, 'account');
    const allErrors = _.flatMap(_.omit(this.state.notificationMgrs, ['account']), (mgr) => { return mgr.fns.fieldErrorMsgs();});

    if (!_.isEmpty(allErrors)) {
      const newMgr = submitMgr.fns.error('submit', 'Please resolve field errors and submit again.');
      this.setState(mergeState(this.state, mgrUpdateGen(newMgr)));
    } else {
      if (!this.state.ephemeral.accountExists) {
        onCreateExchangeUserAccount(configuration.exchange_api, accountForm.fields.account.organization, accountForm.fields.account.username, accountForm.fields.account.password, accountForm.fields.account.email)
            .then(vals => {
              this.setState(mergeState(this.state, {ephemeral: {submitting: false}}));
              router.push('/setup');
            })
            .catch(err => {
              console.error('Caught error: ', err);
              this.setState(mergeState(this.state, {ephemeral: {submitting: false}, error: err}));
            })
      } else {
        setExpectExistingAccount(expectExistingAccount);

        let username = accountForm.fields.account.username;
        let password = accountForm.fields.account.password;
        if (this.state.ephemeral.tokenExists) {
          username = accountForm.fields.account.deviceid;
          password = accountForm.fields.account.devicetoken;
          onSetExpectExistingToken(true, username, password);
        }

        onCheckAccountCredentials(configuration.exchange_api, accountForm.fields.account.organization, username, password)
            .then(vals => {
              this.setState(mergeState(this.state, {ephemeral: { submitting: false }}));
              router.push('/setup');
            })
            .catch(err => {
              console.log('caught err');
              this.setState(mergeState(this.state, {ephemeral: {submitting: false}, error: err}));
              console.error(err);
            })
        
      }      
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

  componentDidMount() {
    this.setState(Object.assign({}, this.state, {fields: {account: {deviceid: this.props.device.id}}}));
  }

  render() {
    // TODO: make sure returning to this page after reg (like if user hits the back button), causes redirection to dashboard

    let accountForm =
      <Form className="attached fluid segment" onSubmit={(event) => {event.preventDefault();} } id='account'>
        <Checkbox toggle checked={this.state.ephemeral.tokenExists} ref={(c) => {this.tokenCheckRef = c}} label='I have a node ID and token' value={this.state.ephemeral.tokenExists} onChange={this.handleTokenToggle} disabled={!this.state.ephemeral.accountExists} />
        <br /><br />
        <Form.Input
          fluid
          focus
          label='Organization'
          name='account.organization'
          value={this.state.fields.account.organization}
          placeholder='Organization - Default is `public`'
          onChange={this.handleFieldChange}
          error={fieldIsInError(this, 'account.organization')}
          onBlur={this.handleInputBlur}
          disabled={!this.state.ephemeral.accountExists}
        />
        <Form.Input 
          fluid 
          focus 
          label='Username' 
          name='account.username' 
          value={this.state.fields.account.username} 
          placeholder='Username' 
          onChange={this.handleFieldChange} 
          error={fieldIsInError(this, 'account.username')} 
          onBlur={this.handleInputBlur} 
          disabled={this.state.ephemeral.tokenExists}
        />
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
          disabled={this.state.ephemeral.tokenExists}
          icon={<Icon
            name="eye"
            link
            onClick={this.handlePasswordVisibility}
          />}
        />
        <Form.Input
          fluid
          focus
          label='Email'
          name='account.email'
          value={this.state.fields.account.email}
          placeholder='Email'
          onChange={this.handleFieldChange}
          error={fieldIsInError(this, 'account.password')}
          onBlur={this.handleInputBlur}
          disabled={this.state.ephemeral.accountExists}
        />
        <Form.Input fluid focus
          label={<label>Edge Node Name - <small>Enter a name for node {this.props.device.id} that you will easily recognize.</small></label>}
          name='account.devicename'
          value={this.state.fields.account.devicename}
          placeholder='Edge Node Name'
          onChange={this.handleFieldChange}
          error={fieldIsInError(this, 'account.devicename')}
          onBlur={this.handleInputBlur}
        />
        <Form.Input fluid focus
          label={<label>Edge Node ID</label>}
          name='account.deviceid'
          value={this.state.fields.account.deviceid}
          placeholder='Edge Node ID'
          onChange={this.handleFieldChange}
          error={fieldIsInError(this, 'account.deviceid')}
          onBlur={this.handleInputBlur}
        />
        {this.state.ephemeral.tokenExists ?
          <Form.Input fluid focus
            label='Edge Node Token'
            name='account.devicetoken'
            value={this.state.fields.account.devicetoken}
            placeholder='Edge Node Token'
            onChange={this.handleFieldChange}
            error={fieldIsInError(this, 'account.devicetoken')}
            onBlur={this.handleInputBlur}
          />
        :
          <Form.Input fluid focus
            id="tokenInput"
            action={{color: 'teal', labelPosition: 'right', icon: 'write', content: 'Generate token', onClick: this.handleGenerateToken}}
            label='Edge Node Token'
            name='account.devicetoken'
            value={this.state.fields.account.devicetoken}
            placeholder='Edge Node Token'
            onChange={this.handleFieldChange}
            error={fieldIsInError(this, 'account.devicetoken')}
            onBlur={this.handleInputBlur}
          />
        }
        <Button type="button" primary color="blue" onClick={() => {this.handleSubmit(true);}} loading={this.state.ephemeral.submitting} disabled={this.state.ephemeral.submitting}>Continue</Button>
        <Button basic onClick={this.handlePasswordReset}>Reset Password</Button>
      </Form>

    return (
      <div>
        <Header size="large">Account Setup</Header>
        <Segment padded raised>
          <Checkbox toggle label='I have a user account' onChange={this.handleAccountToggle} />

          <Segment padded raised>
            {this.state.ephemeral.accountExists ? 
            <p>Register this edge node with an existing Blue Horizon Exchange user account.</p>
            :
            <p>Register this edge node with a new Blue Horizon Exchange user account in the public organization.</p>
            }
            {/* <NotificationList attached={true} mgr={note.segmentMgr(this.state.notificationMgrs, 'account')} notificationHeader='Account Setup' errHeader='Account Data Error' /> */}
            {typeof this.state.error !== 'undefined' &&
              <Message error>
                <Message.Header>Authentication Error</Message.Header>
                <p>{this.state.error.msg}</p>
              </Message>
            }
            {accountForm}
          </Segment>
        </Segment>
      </div>
    );
  }
}

export default AccountForm;
