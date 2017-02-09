import React, { Component } from 'react';
import { Dimmer, Loader, Segment, Container } from 'semantic-ui-react';

// a function component; props are destructured

class Main extends Component {

  componentDidUpdate() {
    const { device, router } = this.props;

    // preconditions: don't want to evaluate further if we're in registration or still fetching device
    if (!(router.isActive({pathname: '/account'}) || device.isFetching) &&
      (!(device.token_valid || 'account' in device))) {
      router.push('/account');
    }

    // TODO: handle ensuring that user doesn't browse to /account if anax device has registration facts
  }

  componentDidMount() {
    const {onDeviceGet, onConfigurationGet} = this.props;

    onConfigurationGet();
    onDeviceGet();
  }

  render() {
    const { children, device } = this.props;

    let view;

    if ('id' in device) {
      view = (
        <section>
          <Container fluid textAlign="right" id="topBar">
            <header>
              <p>id: {device.id}</p>
            </header>
          </Container>

          <br />
          <div style={{"padding": "8%", "paddingTop": "2%"}}>
            {children}
          </div>
        </section>
      );
    } else {
      // TODO: add a timeout here and do better error handling in async fetches so this doesn't remain in error cases
      // TODO: make sure this is actually fetching (or retrying, or transitioning to failure) during the time this is displayed
      view = (
        <Dimmer active inverted>
          <Loader>Loading</Loader>
        </Dimmer>
      );
    }

    return view;
  }
}

export default Main;
