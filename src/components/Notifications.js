import React, { Component } from 'react';
import { Button, Checkbox, Container, Header, Form, Input, Divider, Segment, Message, List } from 'semantic-ui-react';

import * as _ from 'lodash';

export class NotificationList extends Component {

  render() {
    const {mgr, notificationHeader, errHeader, attached} = this.props;

    const errors = mgr.fns.allErrorMsgs();
    const notifications = mgr.fns.notifications();

    // TODO: consolidate markup
    return (
      <div>
        {_.isEmpty(notifications) ?
        <span></span>
          :
        <Message positive attached={attached}>
          <Message.Header>{notificationHeader}</Message.Header>
          <List>
            {_.map(notifications, (msg, index) => {
              return <List.Item key={index}>{msg}</List.Item>
            })}
          </List>
        </Message>
        }
        {_.isEmpty(errors) ?
        <span></span>
          :
        <Message negative attached={attached}>
          <Message.Header>{errHeader}</Message.Header>
          <List>
            {_.map(errors, (msg, index) => {
              return <List.Item key={index}>{msg}</List.Item>
            })}
          </List>
        </Message>
        }
      </div>
      );
  }
}
