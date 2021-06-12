import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import { withUnstatedContainers } from '../../UnstatedUtils';
import { toastSuccess, toastError } from '../../../util/apiNotification';

import AppContainer from '../../../services/AppContainer';

import CustomizeThemeOptions from './CustomizeThemeOptions';
import AdminCustomizeContainer from '../../../services/AdminCustomizeContainer';
import AdminUpdateButtonRow from '../Common/AdminUpdateButtonRow';

class CustomizeThemeSetting extends React.Component {

  constructor(props) {
    super(props);

    this.onClickSubmit = this.onClickSubmit.bind(this);
  }

  async onClickSubmit() {
    const { t, adminCustomizeContainer } = this.props;

    try {
      await adminCustomizeContainer.updateCustomizeTheme();
      toastSuccess(t('toaster.update_successed', { target: t('admin:customize_setting.theme') }));
    }
    catch (err) {
      toastError(err);
    }
  }

  renderDevAlert() {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className="alert alert-warning">
          <strong>DEBUG MESSAGE:</strong> Live preview for theme is disabled in development mode.
        </div>
      );
    }
  }


  render() {
    const { t, adminCustomizeContainer } = this.props;

    return (
      <React.Fragment>
        <div className="row">
          <div className="col-12">
            <h2 className="admin-setting-header">{t('admin:customize_setting.theme')}</h2>
            {this.renderDevAlert()}
            <CustomizeThemeOptions />
            <AdminUpdateButtonRow onClick={this.onClickSubmit} disabled={adminCustomizeContainer.state.retrieveError != null} />
          </div>
        </div>
      </React.Fragment>
    );
  }

}

const CustomizeThemeSettingWrapper = withUnstatedContainers(CustomizeThemeSetting, [AppContainer, AdminCustomizeContainer]);

CustomizeThemeSetting.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  adminCustomizeContainer: PropTypes.instanceOf(AdminCustomizeContainer).isRequired,
};

export default withTranslation()(CustomizeThemeSettingWrapper);
