import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import { withUnstatedContainers } from '../../UnstatedUtils';
import AppContainer from '../../../services/AppContainer';
import { toastSuccess, toastError } from '../../../util/apiNotification';
import AdminUsersContainer from '../../../services/AdminUsersContainer';

class StatusSuspendedButton extends React.Component {

  constructor(props) {
    super(props);

    this.onClickDeactiveBtn = this.onClickDeactiveBtn.bind(this);
  }

  async onClickDeactiveBtn() {
    const { t } = this.props;

    try {
      const username = await this.props.adminUsersContainer.deactivateUser(this.props.user._id);
      toastSuccess(t('toaster.deactivate_user_success', { username }));
    }
    catch (err) {
      toastError(err);
    }
  }

  renderSuspendedBtn() {
    const { t } = this.props;

    return (
      <button className="dropdown-item" type="button" onClick={() => { this.onClickDeactiveBtn() }}>
        <i className="icon-fw icon-ban"></i> {t('admin:user_management.user_table.deactivate_account')}
      </button>
    );
  }

  renderSuspendedAlert() {
    const { t } = this.props;

    return (
      <div className="px-4">
        <i className="icon-fw icon-ban mb-2"></i>{t('admin:user_management.user_table.deactivate_account')}
        <p className="alert alert-danger">{t('admin:user_management.user_table.your_own')}</p>
      </div>
    );
  }

  render() {
    const { user } = this.props;
    const { currentUsername } = this.props.appContainer;

    return (
      <Fragment>
        {user.username !== currentUsername ? this.renderSuspendedBtn()
          : this.renderSuspendedAlert()}
      </Fragment>
    );
  }

}

/**
 * Wrapper component for using unstated
 */
const StatusSuspendedFormWrapper = withUnstatedContainers(StatusSuspendedButton, [AppContainer, AdminUsersContainer]);

StatusSuspendedButton.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  adminUsersContainer: PropTypes.instanceOf(AdminUsersContainer).isRequired,

  user: PropTypes.object.isRequired,
};

export default withTranslation()(StatusSuspendedFormWrapper);
