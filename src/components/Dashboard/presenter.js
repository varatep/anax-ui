import React, {Component} from 'react';
import ReactDOM from 'react-dom';
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
} from 'semantic-ui-react';
import Highlight from 'react-highlight';
import {services} from '../../actions/services';
import * as _ from 'lodash';
import {
  mergeState,
  mgrUpdateGen,
} from '../../util/localStateOperations';
import moment from 'moment';

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
    };

    this.state = init;

    this.handleItemClick = this.handleItemClick.bind(this);
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

  handleItemClick(e, {name}) {
    console.log('activeItem name', name);
    let that = this;
    this.setState({ activeItem: name }, () => {
      console.log('activeItem state', that.state.activeItem);
    });
  }

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

    let archivedView;

    if (_.isEmpty(this.state.services)) {
      view = (
        <Segment padded>
          <p>Your device is not configured to execute any services.</p>
          <Button fluid primary color="blue" onClick={() => {router.push('/setup');}}>Begin Setup</Button>
        </Segment>
      );
    } else {
      const archivedAgreements = this.props.agreements.archived;
      let archivedSegments = [];

      archivedView = _.map(archivedAgreements, (ag) => {
        return (
          <Segment key={ag.current_agreement_id}>
            <Header size="medium">{ag.current_agreement_id}</Header>
            <Progress percent={40} attached="top" color={'grey'} />
            <Label as="span" color={'grey'} attached="top right">{'Terminated'}</Label>

            <List divided relaxed>
              <List.Item>
                <List.Content>
                  <List.Header>
                    Agreement Information
                  </List.Header>
                  <div style={{'paddingLeft': '2%'}}>
                    <List.Description><strong>Id</strong>: {ag.current_agreement_id}</List.Description>
                    <br />
                    <List.Description><strong>Name</strong>: {ag.name}</List.Description>
                    <List.Description><strong>Sensor URL</strong>: {ag.sensor_url}</List.Description>
                    <List.Description><strong>Consumer ID</strong>: {ag.consumer_id}</List.Description>
                    <List.Description><strong>Counterparty Address</strong>: {ag.counterparty_address}</List.Description>
                    { ag.agreement_creation_time > 0 &&
                      <List.Description><strong>Agreement creation time</strong>: {prettyTime(ag.agreement_creation_time)}</List.Description> }
                    { ag.agreement_accepted_time > 0 &&
                      <List.Description><strong>Agreement accepted time</strong>: {prettyTime(ag.agreement_accepted_time)}</List.Description> }
                    { ag.agreement_finalized_time > 0 &&
                      <List.Description><strong>Agreement finalized time</strong>: {prettyTime(ag.agreement_finalized_time)}</List.Description> }
                    { ag.agreement_terminated_time > 0 &&
                      <List.Description><strong>Agreement terminated time</strong>: {prettyTime(ag.agreement_terminated_time)}</List.Description> }
                    { ag.agreement_force_terminated_time > 0 &&
                      <List.Description><strong>Agreement force terminated time</strong>: {prettyTime(ag.agreement_force_terminated_time)}</List.Description> }
                    { ag.agreement_execution_start_time > 0 &&
                      <List.Description><strong>Agreement execution start time</strong>: {prettyTime(ag.agreement_execution_start_time)}</List.Description> }
                    { ag.agreement_data_received_time > 0 &&
                      <List.Description><strong>Agreement data received time</strong>: {prettyTime(ag.agreement_data_received_time)}</List.Description> }
                    {/* <List.Description><pre>Proposal</pre>: {ag.proposal}</List.Description> */}
                    <List.Description><strong>Proposal Sig</strong>: <Highlight className='javascript'>{ag.proposal_sig}</Highlight></List.Description>
                    <List.Description><strong>Agreement Protocol</strong>: {ag.agreement_protocol}</List.Description>
                    <List.Description><strong>Protocol Version</strong>: {ag.protocol_version}</List.Description>
                    <List.Description><strong>Terminated Reason</strong>: {ag.terminated_reason}</List.Description>
                    <List.Description><strong>Terminated Description</strong>: {ag.terminated_description}</List.Description>
                    { ag.agreement_protocol_terminated_time > 0 &&
                      <List.Description><strong>Agreement Protocol Terminated Time</strong>: {prettyTime(ag.agreement_protocol_terminated_time)}</List.Description> }
                    { ag.workload_terminated_time > 0 &&
                      <List.Description><strong>Workload Terminated Terminated Time</strong>: {prettyTime(ag.workload_terminated_time)}</List.Description> }
                  </div>
                </List.Content>
              </List.Item>
            </List>
          </Segment>
        )
      });
    }

    return (
      <div>
        <Header size="large">{'name' in device ? `${device.name} ` : '' }</Header>
        {!this.state.ephemeral.fetching ?
          <div>
            <Menu pointing secondary>
              <Menu.Item name='active' active={this.state.activeItem === 'active'} onClick={this.handleItemClick} />
              <Menu.Item name='terminated-agreements' active={this.state.activeItem === 'archived'} onClick={this.handleItemClick} />
            </Menu>
            { this.state.activeItem === 'active' && view }
            { this.state.activeItem === 'terminated-agreements' && archivedView }
          </div>
          : ''}
      </div>
    );
  }
}

export default Dashboard;
