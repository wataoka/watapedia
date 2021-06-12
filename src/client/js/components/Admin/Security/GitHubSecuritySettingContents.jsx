/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import { withUnstatedContainers } from '../../UnstatedUtils';
import { toastSuccess, toastError } from '../../../util/apiNotification';

import AdminGeneralSecurityContainer from '../../../services/AdminGeneralSecurityContainer';
import AdminGitHubSecurityContainer from '../../../services/AdminGitHubSecurityContainer';

class GitHubSecurityManagementContents extends React.Component {

  constructor(props) {
    super(props);

    this.onClickSubmit = this.onClickSubmit.bind(this);
  }

  async onClickSubmit() {
    const { t, adminGitHubSecurityContainer, adminGeneralSecurityContainer } = this.props;

    try {
      await adminGitHubSecurityContainer.updateGitHubSetting();
      await adminGeneralSecurityContainer.retrieveSetupStratedies();
      toastSuccess(t('security_setting.OAuth.GitHub.updated_github'));
    }
    catch (err) {
      toastError(err);
    }
  }

  render() {
    const { t, adminGeneralSecurityContainer, adminGitHubSecurityContainer } = this.props;
    const { isGitHubEnabled } = adminGeneralSecurityContainer.state;

    return (

      <React.Fragment>

        <h2 className="alert-anchor border-bottom">
          {t('security_setting.OAuth.GitHub.name')}
        </h2>

        {adminGitHubSecurityContainer.state.retrieveError != null && (
          <div className="alert alert-danger">
            <p>{t('Error occurred')} : {adminGitHubSecurityContainer.state.retrieveError}</p>
          </div>
        )}

        <div className="form-group row">
          <div className="col-6 offset-3">
            <div className="custom-control custom-switch custom-checkbox-success">
              <input
                id="isGitHubEnabled"
                className="custom-control-input"
                type="checkbox"
                checked={adminGeneralSecurityContainer.state.isGitHubEnabled || false}
                onChange={() => { adminGeneralSecurityContainer.switchIsGitHubOAuthEnabled() }}
              />
              <label className="custom-control-label" htmlFor="isGitHubEnabled">
                {t('security_setting.OAuth.GitHub.enable_github')}
              </label>
            </div>
            {(!adminGeneralSecurityContainer.state.setupStrategies.includes('github') && isGitHubEnabled)
              && <div className="badge badge-warning">{t('security_setting.setup_is_not_yet_complete')}</div>}
          </div>
        </div>

        <div className="row mb-5">
          <label className="col-12 col-md-3 text-left text-md-right py-2">{t('security_setting.callback_URL')}</label>
          <div className="col-12 col-md-6">
            <input
              className="form-control"
              type="text"
              value={adminGitHubSecurityContainer.state.appSiteUrl}
              readOnly
            />
            <p className="form-text text-muted small">{t('security_setting.desc_of_callback_URL', { AuthName: 'OAuth' })}</p>
            {!adminGeneralSecurityContainer.state.appSiteUrl && (
              <div className="alert alert-danger">
                <i
                  className="icon-exclamation"
                  // eslint-disable-next-line max-len
                  dangerouslySetInnerHTML={{ __html: t('security_setting.alert_siteUrl_is_not_set', { link: `<a href="/admin/app">${t('App Settings')}<i class="icon-login"></i></a>` }) }}
                />
              </div>
            )}
          </div>
        </div>


        {isGitHubEnabled && (
          <React.Fragment>

            <h3 className="border-bottom">{t('security_setting.configuration')}</h3>

            <div className="row mb-5">
              <label htmlFor="githubClientId" className="col-3 text-right py-2">{t('security_setting.clientID')}</label>
              <div className="col-6">
                <input
                  className="form-control"
                  type="text"
                  name="githubClientId"
                  value={adminGitHubSecurityContainer.state.githubClientId || ''}
                  onChange={e => adminGitHubSecurityContainer.changeGitHubClientId(e.target.value)}
                />
                <p className="form-text text-muted">
                  <small dangerouslySetInnerHTML={{ __html: t('security_setting.Use env var if empty', { env: 'OAUTH_GITHUB_CLIENT_ID' }) }} />
                </p>
              </div>
            </div>

            <div className="row mb-5">
              <label htmlFor="githubClientSecret" className="col-3 text-right py-2">{t('security_setting.client_secret')}</label>
              <div className="col-6">
                <input
                  className="form-control"
                  type="text"
                  name="githubClientSecret"
                  defaultValue={adminGitHubSecurityContainer.state.githubClientSecret || ''}
                  onChange={e => adminGitHubSecurityContainer.changeGitHubClientSecret(e.target.value)}
                />
                <p className="form-text text-muted">
                  <small dangerouslySetInnerHTML={{ __html: t('security_setting.Use env var if empty', { env: 'OAUTH_GITHUB_CLIENT_SECRET' }) }} />
                </p>
              </div>
            </div>

            <div className="row mb-5">
              <div className="offset-3 col-6 text-left">
                <div className="custom-control custom-checkbox custom-checkbox-success">
                  <input
                    id="bindByUserNameGitHub"
                    className="custom-control-input"
                    type="checkbox"
                    checked={adminGitHubSecurityContainer.state.isSameUsernameTreatedAsIdenticalUser || false}
                    onChange={() => { adminGitHubSecurityContainer.switchIsSameUsernameTreatedAsIdenticalUser() }}
                  />
                  <label
                    className="custom-control-label"
                    htmlFor="bindByUserNameGitHub"
                    dangerouslySetInnerHTML={{ __html: t('security_setting.Treat email matching as identical') }}
                  />
                </div>
                <p className="form-text text-muted">
                  <small dangerouslySetInnerHTML={{ __html: t('security_setting.Treat email matching as identical_warn') }} />
                </p>
              </div>
            </div>

            <div className="row my-3">
              <div className="offset-3 col-5">
                <div className="btn btn-primary" disabled={adminGitHubSecurityContainer.state.retrieveError != null} onClick={this.onClickSubmit}>
                  {t('Update')}
                </div>
              </div>
            </div>

          </React.Fragment>
        )}

        <hr />

        <div style={{ minHeight: '300px' }}>
          <h4>
            <i className="icon-question" aria-hidden="true"></i>
            <a href="#collapseHelpForGitHubOauth" data-toggle="collapse"> {t('security_setting.OAuth.how_to.github')}</a>
          </h4>
          <ol id="collapseHelpForGitHubOauth" className="collapse">
            {/* eslint-disable-next-line max-len */}
            <li dangerouslySetInnerHTML={{ __html: t('security_setting.OAuth.GitHub.register_1', { link: '<a href="https://github.com/settings/developers" target=_blank>GitHub Developer Settings</a>' }) }} />
            <li dangerouslySetInnerHTML={{ __html: t('security_setting.OAuth.GitHub.register_2', { url: adminGitHubSecurityContainer.state.callbackUrl }) }} />
            <li dangerouslySetInnerHTML={{ __html: t('security_setting.OAuth.GitHub.register_3') }} />
          </ol>
        </div>

      </React.Fragment>


    );
  }

}


GitHubSecurityManagementContents.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  adminGeneralSecurityContainer: PropTypes.instanceOf(AdminGeneralSecurityContainer).isRequired,
  adminGitHubSecurityContainer: PropTypes.instanceOf(AdminGitHubSecurityContainer).isRequired,
};

const GitHubSecurityManagementContentsWrapper = withUnstatedContainers(GitHubSecurityManagementContents, [
  AdminGeneralSecurityContainer,
  AdminGitHubSecurityContainer,
]);

export default withTranslation()(GitHubSecurityManagementContentsWrapper);
