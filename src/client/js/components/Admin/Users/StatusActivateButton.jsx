import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import { withUnstatedContainers } from '../../UnstatedUtils';
import AppContainer from '../../../services/AppContainer';
import AdminUsersContainer from '../../../services/AdminUsersContainer';
import { toastSuccess, toastError } from '../../../util/apiNotification';

class StatusActivateButton extends React.Component {

  constructor(props) {
    super(props);

    this.onClickAcceptBtn = this.onClickAcceptBtn.bind(this);
  }

  async onClickAcceptBtn() {
    const { t } = this.props;

    try {
      const username = await this.props.adminUsersContainer.activateUser(this.props.user._id);
      toastSuccess(t('toaster.activate_user_success', { username }));
    }
    catch (err) {
      toastError(err);
    }
  }

  render() {
    const { t } = this.props;

    return (
      <button className="dropdown-item" type="button" onClick={() => { this.onClickAcceptBtn() }}>
        <i className="icon-fw icon-user-following"></i> {t('admin:user_management.user_table.accept')}
      </button>
    );
  }

}

/**
 * Wrapper component for using unstated
 */
const StatusActivateFormWrapper = withUnstatedContainers(StatusActivateButton, [AppContainer, AdminUsersContainer]);

StatusActivateButton.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  adminUsersContainer: PropTypes.instanceOf(AdminUsersContainer).isRequired,

  user: PropTypes.object.isRequired,
};

export default withTranslation()(StatusActivateFormWrapper);
