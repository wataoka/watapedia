import React from 'react';
import PropTypes from 'prop-types';

import UserPictureList from './UserPictureList';

import { withUnstatedContainers } from '../UnstatedUtils';

import PageContainer from '../../services/PageContainer';

class LikerList extends React.Component {

  render() {
    const { pageContainer } = this.props;
    return (
      <div className="user-list-content text-truncate text-muted text-right">
        <span className="text-info">
          <span className="liker-user-count">{pageContainer.state.sumOfLikers}</span>
          <i className="icon-fw icon-like"></i>
        </span>
        <span className="mr-1">
          <UserPictureList users={pageContainer.state.likerUsers} />
        </span>
      </div>
    );
  }

}

LikerList.propTypes = {
  pageContainer: PropTypes.instanceOf(PageContainer).isRequired,
};

/**
 * Wrapper component for using unstated
 */
const LikerListWrapper = withUnstatedContainers(LikerList, [PageContainer]);

export default (LikerListWrapper);
