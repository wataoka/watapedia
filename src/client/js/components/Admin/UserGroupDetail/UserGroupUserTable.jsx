import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import dateFnsFormat from 'date-fns/format';

import UserPicture from '../../User/UserPicture';
import { withUnstatedContainers } from '../../UnstatedUtils';
import AppContainer from '../../../services/AppContainer';
import AdminUserGroupDetailContainer from '../../../services/AdminUserGroupDetailContainer';
import { toastSuccess, toastError } from '../../../util/apiNotification';

class UserGroupUserTable extends React.Component {

  constructor(props) {
    super(props);

    this.xss = window.xss;

    this.removeUser = this.removeUser.bind(this);
  }

  async removeUser(username) {
    try {
      await this.props.adminUserGroupDetailContainer.removeUserByUsername(username);
      toastSuccess(`Removed "${this.xss.process(username)}" from "${this.xss.process(this.props.adminUserGroupDetailContainer.state.userGroup.name)}"`);
    }
    catch (err) {
      // eslint-disable-next-line max-len
      toastError(new Error(`Unable to remove "${this.xss.process(username)}" from "${this.xss.process(this.props.adminUserGroupDetailContainer.state.userGroup.name)}"`));
    }
  }

  render() {
    const { t, adminUserGroupDetailContainer } = this.props;

    return (
      <table className="table table-bordered table-user-list">
        <thead>
          <tr>
            <th width="100px">#</th>
            <th>
              {t('username')}
            </th>
            <th>{t('Name')}</th>
            <th width="100px">{t('Created')}</th>
            <th width="160px">{t('Last_Login')}</th>
            <th width="70px"></th>
          </tr>
        </thead>
        <tbody>
          {adminUserGroupDetailContainer.state.userGroupRelations.map((sRelation) => {
            const { relatedUser } = sRelation;

            return (
              <tr key={sRelation._id}>
                <td>
                  <UserPicture user={relatedUser} className="picture rounded-circle" />
                </td>
                <td>
                  <strong>{relatedUser.username}</strong>
                </td>
                <td>{relatedUser.name}</td>
                <td>{relatedUser.createdAt ? dateFnsFormat(new Date(relatedUser.createdAt), 'yyyy-MM-dd') : ''}</td>
                <td>{relatedUser.lastLoginAt ? dateFnsFormat(new Date(relatedUser.lastLoginAt), 'yyyy-MM-dd HH:mm:ss') : ''}</td>
                <td>
                  <div className="btn-group admin-user-menu">
                    <button
                      type="button"
                      id={`admin-group-menu-button-${relatedUser._id}`}
                      className="btn btn-outline-secondary btn-sm dropdown-toggle"
                      data-toggle="dropdown"
                    >
                      <i className="icon-settings"></i>
                    </button>
                    <div className="dropdown-menu" role="menu" aria-labelledby={`admin-group-menu-button-${relatedUser._id}`}>
                      <button
                        className="dropdown-item"
                        type="button"
                        onClick={() => {
                          return this.removeUser(relatedUser.username);
                        }}
                      >
                        <i className="icon-fw icon-user-unfollow"></i> {t('admin:user_group_management.remove_from_group')}
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}

          <tr>
            <td></td>
            <td className="text-center">
              <button className="btn btn-outline-secondary" type="button" onClick={adminUserGroupDetailContainer.openUserGroupUserModal}>
                <i className="ti-plus"></i>
              </button>
            </td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>

        </tbody>
      </table>
    );
  }

}

UserGroupUserTable.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  adminUserGroupDetailContainer: PropTypes.instanceOf(AdminUserGroupDetailContainer).isRequired,
};

/**
 * Wrapper component for using unstated
 */
const UserGroupUserTableWrapper = withUnstatedContainers(UserGroupUserTable, [AppContainer, AdminUserGroupDetailContainer]);

export default withTranslation()(UserGroupUserTableWrapper);
