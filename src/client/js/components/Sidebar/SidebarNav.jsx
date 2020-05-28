import React from 'react';
import PropTypes from 'prop-types';

import { withTranslation } from 'react-i18next';

import { createSubscribedElement } from '../UnstatedUtils';
import AppContainer from '../../services/AppContainer';


class SidebarNav extends React.Component {

  static propTypes = {
    currentContentsId: PropTypes.string,
    onItemSelected: PropTypes.func,
  };

  state = {
  };

  itemSelectedHandler = (contentsId) => {
    const { onItemSelected } = this.props;
    if (onItemSelected != null) {
      onItemSelected(contentsId);
    }
  }

  PrimaryItem = ({ id, label, iconName }) => {
    const isSelected = this.props.currentContentsId === id;

    return (
      <button
        type="button"
        className={`d-block btn btn-primary btn-lg ${isSelected ? 'active' : ''}`}
        onClick={() => this.itemSelectedHandler(id)}
      >
        <i className="material-icons">{iconName}</i>
      </button>
    );
  }

  SecondaryItem({
    label, iconName, href, isBlank,
  }) {
    return (
      <a href={href} className="d-block btn btn-primary" target={`${isBlank ? '_blank' : ''}`}>
        <i className="material-icons">{iconName}</i>
      </a>
    );
  }

  generateIconFactory(classNames) {
    return () => <i className={classNames}></i>;
  }

  render() {
    const { isAdmin, currentUsername } = this.props.appContainer;
    const isLoggedIn = currentUsername != null;

    const { PrimaryItem, SecondaryItem } = this;

    return (
      <div className="grw-sidebar-nav d-flex flex-column justify-content-between">
        <div className="grw-sidebar-nav-primary-container">
          <PrimaryItem id="custom" label="Custom Sidebar" iconName="code" />
          <PrimaryItem id="recent" label="Recent Changes" iconName="update" />
          {/* <PrimaryItem id="tag" label="Tags" iconName="icon-tag" /> */}
          {/* <PrimaryItem id="favorite" label="Favorite" iconName="icon-star" /> */}
        </div>
        <div className="grw-sidebar-nav-secondary-container">
          {isAdmin && <SecondaryItem label="Admin" iconName="settings" href="/admin" />}
          {isLoggedIn && <SecondaryItem label="Draft" iconName="file_copy" href={`/user/${currentUsername}#user-draft-list`} />}
          <SecondaryItem label="Help" iconName="help" href="https://docs.growi.org" isBlank />
          {isLoggedIn && <SecondaryItem label="Trash" iconName="delete" href="/trash" />}
        </div>
      </div>
    );
  }

}

SidebarNav.propTypes = {
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
};

/**
 * Wrapper component for using unstated
 */
const SidebarNavWrapper = (props) => {
  return createSubscribedElement(SidebarNav, props, [AppContainer]);
};

export default withTranslation()(SidebarNavWrapper);