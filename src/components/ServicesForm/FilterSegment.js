import React, {Component} from 'react';
import {
  Accordion,
  Form,
  Icon,
  Popup,
  Radio,
} from 'semantic-ui-react';

import {
  ALL_APPROACH,
  WORKLOAD_APPROACH,
  MICROSERVICE_APPROACH,
} from './helpers';

class FilterSegment extends Component {
  constructor(props) {
    super(props);

    this.handleApproachChange = this.handleApproachChange.bind(this);
  }

  state = {
    currentApproach: ALL_APPROACH,
  }

  handleApproachChange(event, {value}) {
    this.setState({currentApproach: value});
    this.props.updateCurrentApproach(value);
  }

  render() {
    return (
      <div>
        <Accordion styled>
          <Accordion.Title>
            <Icon name='dropdown' />
            Filter
          </Accordion.Title>
          <Accordion.Content>
            <Form widths='equal'>
              <Form.Group grouped>
                <Popup
                  wide
                  trigger={<label>Approach</label>}
                  content='Select whether you want to register your device using a microservice perspective (choose which microservices you want and automatically enable possible workloads), workload perspective (choose which workloads you want and automatically enable required microservices), or view everything at once.'
                />
                <Form.Field 
                  label='Microservice' 
                  value={MICROSERVICE_APPROACH} 
                  checked={this.state.currentApproach === MICROSERVICE_APPROACH} 
                  control={Radio}
                  name='regApproach' 
                  onChange={this.handleApproachChange}
                />
                <Form.Field 
                  label='Workload' 
                  value={WORKLOAD_APPROACH} 
                  checked={this.state.currentApproach === WORKLOAD_APPROACH} 
                  control={Radio}
                  name='regApproach'
                  onChange={this.handleApproachChange}
                />
                <Form.Field 
                  label='View All' 
                  value={ALL_APPROACH} 
                  checked={this.state.currentApproach === ALL_APPROACH} 
                  control={Radio}
                  name='regApproach' 
                  onChange={this.handleApproachChange}
                />
              </Form.Group>
            </Form>
          </Accordion.Content>
        </Accordion>
      </div>
    );
  }
}

export default FilterSegment;