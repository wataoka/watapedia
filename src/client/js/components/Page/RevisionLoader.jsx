import React from 'react';
import PropTypes from 'prop-types';

import { Waypoint } from 'react-waypoint';

import { withUnstatedContainers } from '../UnstatedUtils';
import GrowiRenderer from '../../util/GrowiRenderer';
import AppContainer from '../../services/AppContainer';

import RevisionRenderer from './RevisionRenderer';

/**
 * Load data from server and render RevisionBody component
 */
class RevisionLoader extends React.Component {

  constructor(props) {
    super(props);
    this.logger = require('@alias/logger')('growi:Page:RevisionLoader');

    this.state = {
      markdown: '',
      isLoading: false,
      isLoaded: false,
      errors: null,
    };

    this.loadData = this.loadData.bind(this);
    this.onWaypointChange = this.onWaypointChange.bind(this);
  }

  componentWillMount() {
    if (!this.props.lazy) {
      this.loadData();
    }
  }

  async loadData() {
    if (!this.state.isLoaded && !this.state.isLoading) {
      this.setState({ isLoading: true });
    }

    const { pageId, revisionId } = this.props;


    // load data with REST API
    try {
      const res = await this.props.appContainer.apiv3Get(`/revisions/${revisionId}`, { pageId });

      this.setState({
        markdown: res.data.revision.body,
        errors: null,
      });

      if (this.props.onRevisionLoaded != null) {
        this.props.onRevisionLoaded(res.data.revision);
      }
    }
    catch (errors) {
      this.setState({ errors });
    }
    finally {
      this.setState({ isLoaded: true, isLoading: false });
    }

  }

  onWaypointChange(event) {
    if (event.currentPosition === Waypoint.above || event.currentPosition === Waypoint.inside) {
      this.loadData();
    }
  }

  render() {
    // ----- before load -----
    if (this.props.lazy && !this.state.isLoaded) {
      return (
        <Waypoint onPositionChange={this.onWaypointChange} bottomOffset="-100px">
          <div className="wiki"></div>
        </Waypoint>
      );
    }

    // ----- loading -----
    if (this.state.isLoading) {
      return (
        <div className="wiki">
          <div className="text-muted text-center">
            <i className="fa fa-2x fa-spinner fa-pulse mr-1"></i>
          </div>
        </div>
      );
    }

    // ----- after load -----
    let markdown = this.state.markdown;
    if (this.state.errors != null) {
      const errorMessages = this.state.errors.map((error) => {
        return `<span class="text-muted"><em>${error.message}</em></span>`;
      });
      markdown = errorMessages.join('');
    }

    return (
      <RevisionRenderer
        growiRenderer={this.props.growiRenderer}
        markdown={markdown}
        highlightKeywords={this.props.highlightKeywords}
      />
    );
  }

}

/**
 * Wrapper component for using unstated
 */
const RevisionLoaderWrapper = withUnstatedContainers(RevisionLoader, [AppContainer]);

RevisionLoader.propTypes = {
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,

  growiRenderer: PropTypes.instanceOf(GrowiRenderer).isRequired,
  pageId: PropTypes.string.isRequired,
  revisionId: PropTypes.string.isRequired,
  lazy: PropTypes.bool,
  onRevisionLoaded: PropTypes.func,
  highlightKeywords: PropTypes.string,
};

export default RevisionLoaderWrapper;
