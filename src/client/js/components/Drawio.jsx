import React from 'react';
import PropTypes from 'prop-types';

import { debounce } from 'throttle-debounce';

import { withTranslation } from 'react-i18next';

import AppContainer from '../services/AppContainer';

import { withUnstatedContainers } from './UnstatedUtils';

import NotAvailableForGuest from './NotAvailableForGuest';

class Drawio extends React.Component {

  constructor(props) {
    super(props);

    this.drawioContainer = React.createRef();

    this.style = {
      borderRadius: 3,
      border: '1px solid #d7d7d7',
      margin: '20px 0',
    };

    this.isPreview = this.props.isPreview;
    this.drawioContent = this.props.drawioContent;

    this.onEdit = this.onEdit.bind(this);

    // create debounced method for rendering Drawio
    this.renderDrawioWithDebounce = debounce(200, this.renderDrawio);
  }

  onEdit() {
    const { appContainer, rangeLineNumberOfMarkdown } = this.props;
    const { beginLineNumber, endLineNumber } = rangeLineNumberOfMarkdown;
    appContainer.launchDrawioModal('page', beginLineNumber, endLineNumber);
  }

  componentDidMount() {
    const DrawioViewer = window.GraphViewer;
    if (DrawioViewer != null) {
      this.renderDrawio();
    }
    else {
      this.renderDrawioWithDebounce();
    }
  }

  renderDrawio() {
    const DrawioViewer = window.GraphViewer;
    if (DrawioViewer != null) {
      const mxgraphs = this.drawioContainer.getElementsByClassName('mxgraph');
      if (mxgraphs.length > 0) {
        // GROWI では、mxgraph element は最初のものをレンダリングする前提とする
        const div = mxgraphs[0];

        if (div != null) {
          div.innerHTML = '';
          DrawioViewer.createViewerForElement(div);
        }
      }
    }
    else {
      this.renderDrawioWithDebounce();
    }
  }

  renderContents() {
    return this.drawioContent;
  }

  render() {
    return (
      <div className="editable-with-drawio position-relative">
        { !this.isPreview && (
          <NotAvailableForGuest>
            <button type="button" className="drawio-iframe-trigger position-absolute btn btn-outline-secondary" onClick={this.onEdit}>
              <i className="icon-note mr-1"></i>{this.props.t('Edit')}
            </button>
          </NotAvailableForGuest>
        ) }
        <div
          className="drawio"
          style={this.style}
          ref={(c) => { this.drawioContainer = c }}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: this.renderContents() }}
        >
        </div>
      </div>
    );
  }

}

Drawio.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  appContainer: PropTypes.object.isRequired,

  drawioContent: PropTypes.any.isRequired,
  isPreview: PropTypes.bool,
  rangeLineNumberOfMarkdown: PropTypes.object.isRequired,
};

export default withTranslation()(withUnstatedContainers(Drawio, [AppContainer]));
