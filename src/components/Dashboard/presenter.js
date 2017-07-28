import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import {
  Button,
  Dimmer,
  Container,
  Header,
  Segment,
  Label,
  Loader,
  Progress,
  List,
  Menu,
  Input,
} from 'semantic-ui-react';
import * as _ from 'lodash';
import Highlight from 'react-highlight';
import {services} from '../../actions/services';
import {
  mergeState,
  mgrUpdateGen,
} from '../../util/localStateOperations';
import TerminatedAgreements from './terminatedAgreements';

class Dashboard extends Component {

  constructor(props) {
    super(props);

    const init = {
      ephemeral: {
        fetching: true,
        interval: undefined,
      },
      activeItem: 'active',
      services: [], // enriched
      terminatedAgreementsFilter: '',
    };

    this.state = init;

    this.handleItemClick = this.handleItemClick.bind(this);
    this.updateTerminatedAgreementsFilter = this.updateTerminatedAgreementsFilter.bind(this);
  }

  componentWillMount() {
    document.title += ' - Dashboard';

    const {onAttributesGet, onAgreementsGet, onDeviceGet, onServicesGet, router} = this.props;

    // to get something as soon as possible
    onAttributesGet()
      .then((data) => {
        if (!!data && 'attributes' in data) {
          this.setState(mergeState(this.state, {services: _.filter(data.attributes, {id: 'compute'}), ephemeral: { fetching: false}}));

          const enrichFn = this.enrich([onServicesGet, onAgreementsGet], router);
          // get it started
          enrichFn();

          // schedule
          this.setState(mergeState(this.state, {ephemeral: {interval: setInterval(enrichFn, 2000)}}));
        }
      });
    onDeviceGet();
  }

  componentWillUnmount() {
    clearInterval(this.state.ephemeral.interval);
  }

  enrich(fns, router) {

    let hydrate = (computeAttrs, serviceData, agreementData) => {
      return _.map(computeAttrs, (compute) => {

        // TODO: expand to accommodate more sensor urls and more applicable enrichments
        const policy = _.filter(serviceData, (d) => { return compute.sensor_urls[0] === d.policy.apiSpec[0].specRef;});
        const active = _.filter(agreementData.agreements.active, (a) => { return compute.sensor_urls[0] === a.sensor_url;});
        const archived = _.filter(agreementData.agreements.archived, (a) => { return compute.sensor_urls[0] === a.sensor_url;});

        return {...compute, ...policy[0], agreements: {active, archived}};
      });
    }

    return () => {
      // TODO: do this better; componentWillUnmount isn't doing it but that's the right way to handle this
      if (!router.isActive({pathname: '/dashboard'})) {
        return;
      }

      Promise.all(_.map(fns, (fn) => {return fn();})).then((responses) => {

        this.setState(mergeState(this.state, {
          services: hydrate(this.state.services, responses[0], responses[1])
        }));
      });
    };
  }

  sortedTerminatedAgreementsByTime() {
    return _.orderBy(this.props.agreements.archived, (ag) => ag.agreement_terminated_time, ['desc'])
  }

  handleItemClick(e, {name}) {
    let that = this;
    this.setState({ activeItem: name }, () => {
    });
  }

  updateTerminatedAgreementsFilter = _.debounce((e, data) => {
    this.setState({terminatedAgreementsFilter: data.value}, () => {
    });
  }, 500)

  render() {
    const { attributes, device, router } = this.props;

    let prettyTime = (stamp) => {
      const d = new Date(0);
      d.setUTCSeconds(stamp);

      return moment(d).format('MMMM DD, hh:mm A');
    }

    let view;

    if (_.isEmpty(this.state.services)) {
      view = (
        <Segment padded>
          <p>Your device is not configured to execute any services.</p>
          <Button fluid primary color="blue" onClick={() => {router.push('/setup');}}>Begin Setup</Button>
        </Segment>
      );
    } else {
      const reduceNum = (n) => {
        return n > 0 ? 1 : 0;
      }
      const sVal = (serv) => {
        if ('agreements' in serv && serv.agreements.active.length > 0) {
          const ag = serv.agreements.active[0];
          return reduceNum(ag.agreement_creation_time) +
                 reduceNum(ag.agreement_accepted_time) +
                 reduceNum(ag.agreement_finalized_time) +
                 reduceNum(ag.agreement_execution_start_time) +
                 reduceNum(ag.agreement_data_received_time);
        } else {
          return 0;
        }
      }

      const sortedServ = this.state.services.slice(0).sort((o, o2) => {
        const s = sVal(o);
        const s2 = sVal(o2);

        // reverse sort
        if (s > s2) {
          return -1;
        } else if (s < s2) {
          return 1;
        } else {
          return 0;
        }
      });

      view = (_.map(sortedServ, (it) => {

          // can't assume there is one
          var newestArch = null;
          let color, percent, tag;

          if (!'policy' in it) {
            color = 'yellow';
            percent = 0;
            tag = 'Initializing';
          } else if ('agreements' in it) {
            // assume only a single agreement here, this may change in the future

            if (it.agreements.active.length > 0) {
              const ag = it.agreements.active[0];

              if (ag.agreement_execution_start_time > 0) {
                color = 'blue';
                percent = 100;
                tag = 'Executing';
              } else if (ag.agreement_accepted_time > 0) {
                color = 'teal';
                percent = 70;
                tag = 'In Agreement';
              } else {
                color = 'orange';
                percent = 50;
                tag = 'Agreement Proposed';
              }
            } else {
              color = 'grey';
              percent = 40;
              tag = 'Available for Agreement';
            }

            if (it.agreements.archived.length > 0) {
              newestArch = it.agreements.archived[it.agreements.archived.length-1];
            }
          }

          return (
            <Segment key={it.sensor_urls.join('/')}>

              <Header size="medium">{it.label}</Header>
              <Progress percent={percent} attached="top" color={color} />
              <Label as="span" color={color} attached="top right">{tag}</Label>

              <List divided relaxed>
                <List.Item>
                  <List.Content>
                    <List.Header>Compute Resources</List.Header>
                    <List.Description><strong>CPUs</strong>: {it.mappings.cpus}, <strong>RAM</strong>: {it.mappings.ram} MB</List.Description>
                  </List.Content>
                </List.Item>
                {'agreements' in it ?
                <List.Item>
                  <List.Content>
                    {it.agreements.active.length > 0 ?
                      <span>
                        <List.Header>Active Agreement</List.Header>
                          <div style={{"paddingLeft": "2%"}}>
                            <List.Description><strong>Id</strong>: <span style={{fontFamily: 'mono'}}>{it.agreements.active[0].current_agreement_id}</span></List.Description>
                            <br />
                            <List.Description><strong>Counterparty</strong>: {it.agreements.active[0].consumer_id}</List.Description>
                            {it.agreements.active[0].agreement_accepted_time > 0 ?
                                <List.Description><strong>Counterparty accepted at</strong>: {prettyTime(it.agreements.active[0].agreement_accepted_time)}</List.Description>
                                :
                                <span></span>
                            }
                            {it.agreements.active[0].agreement_execution_start_time > 0 ?
                                <List.Description><strong>Workload pattern deployed at</strong>: {prettyTime(it.agreements.active[0].agreement_execution_start_time)}</List.Description>
                                :
                                <span></span>
                            }
                            {it.agreements.active[0].agreement_data_received_time > 0 ?
                                <List.Description><strong>Agreement data received by counterparty at</strong>: {prettyTime(it.agreements.active[0].agreement_data_received_time)}</List.Description>
                                :
                                <span></span>
                            }
                            {it.agreements.active[0].agreement_finalized_time > 0 ?
                                <List.Description><strong>Agreement finalized at</strong>: {prettyTime(it.agreements.active[0].agreement_finalized_time)}</List.Description>
                                :
                                <span></span>
                            }
                            {it.agreements.active[0].agreement_protocol && 
                              <List.Description><strong>Agreement Protocol</strong>: {it.agreements.active[0].agreement_protocol}</List.Description>
                            }
                          </div>
                        </span>
                        :
                        <span></span>
                    }
                    <br />
                    <List.Description><strong>Archived Agreements</strong>: {it.agreements.archived.length}</List.Description>
                    {newestArch !== null ?
                        <div style={{"paddingLeft": "2%"}}>
                          <List.Description><strong>Terminated Time</strong>: {prettyTime(newestArch.agreement_terminated_time)}, <strong>Terminated Reason</strong>: {newestArch.terminated_reason}, <strong>Terminated Description</strong>: {newestArch.terminated_description}</List.Description>
                        </div>
                        :
                        <span></span>
                    }

                    {it.agreements.active[0].metering_notification.start_time > 0 &&
                      <div>
                        <br />
                        <List.Description><strong>Metering Information</strong></List.Description>
                        <div style={{paddingLeft: `2%`}}>
                          <List.Description><strong>Token Amount</strong>: {it.agreements.active[0].metering_notification.amount}</List.Description>
                          <List.Description><strong>Start Time</strong>: {prettyTime(it.agreements.active[0].metering_notification.start_time)}</List.Description>
                          <List.Description><strong>Current Time</strong>: {prettyTime(it.agreements.active[0].metering_notification.current_time)}</List.Description>
                          <List.Description><strong>Missed Data Count</strong>: {it.agreements.active[0].metering_notification.missed_time}</List.Description>
                        </div>
                      </div>
                    }
                  </List.Content>
                </List.Item>
                    :
                    <span></span>
                }
              </List>
            </Segment>
          );
        })
      );
    }

    return (
      <div>
        <Header size="large">{'name' in device ? `${device.name} ` : '' }</Header>
        {!this.state.ephemeral.fetching ?
          <div>
            <Menu pointing secondary>
              <Menu.Item name='active' active={this.state.activeItem === 'active'} onClick={this.handleItemClick} />
              <Menu.Item name='terminated-agreements' active={this.state.activeItem === 'terminated-agreements'} onClick={this.handleItemClick} />
              { this.state.activeItem === 'terminated-agreements' &&
                <Menu.Menu position='right'>
                  <Menu.Item>
                    <Input icon='search' placeholder='Search...' onChange={this.updateTerminatedAgreementsFilter} />
                  </Menu.Item>
                </Menu.Menu>
              }
            </Menu>
            { this.state.activeItem === 'active' && view }
            { this.state.activeItem === 'terminated-agreements' && <TerminatedAgreements agreements={this.sortedTerminatedAgreementsByTime()} filter={this.state.terminatedAgreementsFilter} /> }
          </div>
          : ''}
      </div>
    );
  }
}

export default Dashboard;
