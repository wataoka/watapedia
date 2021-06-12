/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import { withUnstatedContainers } from '../../UnstatedUtils';
import { toastSuccess, toastError } from '../../../util/apiNotification';

import AppContainer from '../../../services/AppContainer';
import AdminGeneralSecurityContainer from '../../../services/AdminGeneralSecurityContainer';

class SecuritySetting extends React.Component {

  constructor(props) {
    super(props);

    this.putSecuritySetting = this.putSecuritySetting.bind(this);
  }

  async putSecuritySetting() {
    const { t, adminGeneralSecurityContainer } = this.props;
    try {
      await adminGeneralSecurityContainer.updateGeneralSecuritySetting();
      toastSuccess(t('security_setting.updated_general_security_setting'));
    }
    catch (err) {
      toastError(err);
    }
  }

  render() {
    const { t, adminGeneralSecurityContainer } = this.props;
    const { currentRestrictGuestMode, currentPageCompleteDeletionAuthority } = adminGeneralSecurityContainer.state;

    return (
      <React.Fragment>
        <h2 className="alert-anchor border-bottom">
          {t('security_settings')}
        </h2>

        {adminGeneralSecurityContainer.retrieveError != null && (
          <div className="alert alert-danger">
            <p>{t('Error occurred')} : {adminGeneralSecurityContainer.retrieveError}</p>
          </div>
        )}

        <h4 className="mt-4">{ t('security_setting.page_list_and_search_results') }</h4>
        <table className="table table-bordered col-lg-9 mb-5">
          <thead>
            <tr>
              <th scope="col">{ t('scope_of_page_disclosure') }</th>
              <th scope="col">{ t('set_point') }</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">{ t('Public') }</th>
              <td>{ t('always_displayed') }</td>
            </tr>
            <tr>
              <th scope="row">{ t('Anyone with the link') }</th>
              <td>{ t('always_hidden') }</td>
            </tr>
            <tr>
              <th scope="row">{ t('Only me') }</th>
              <td>
                <div className="custom-control custom-switch custom-checkbox-success">
                  <input
                    type="checkbox"
                    className="custom-control-input"
                    id="isShowRestrictedByOwner"
                    checked={adminGeneralSecurityContainer.state.isShowRestrictedByOwner}
                    onChange={() => { adminGeneralSecurityContainer.switchIsShowRestrictedByOwner() }}
                  />
                  <label className="custom-control-label" htmlFor="isShowRestrictedByOwner">
                    {t('displayed_or_hidden')}
                  </label>
                </div>
              </td>
            </tr>
            <tr>
              <th scope="row">{ t('Only inside the group') }</th>
              <td>
                <div className="custom-control custom-switch custom-checkbox-success">
                  <input
                    type="checkbox"
                    className="custom-control-input"
                    id="isShowRestrictedByGroup"
                    checked={adminGeneralSecurityContainer.state.isShowRestrictedByGroup}
                    onChange={() => { adminGeneralSecurityContainer.switchIsShowRestrictedByGroup() }}
                  />
                  <label className="custom-control-label" htmlFor="isShowRestrictedByGroup">
                    {t('displayed_or_hidden')}
                  </label>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <h4>{t('security_setting.page_access_and_delete_rights')}</h4>
        <div className="row mb-4">
          <div className="col-md-3 text-md-right py-2">
            <strong>{t('security_setting.Guest Users Access')}</strong>
          </div>
          <div className="col-md-9">
            <div className="dropdown">
              <button
                className={`btn btn-outline-secondary dropdown-toggle text-right col-12
                            col-md-auto ${adminGeneralSecurityContainer.isWikiModeForced && 'disabled'}`}
                type="button"
                id="dropdownMenuButton"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="true"
              >
                <span className="float-left">
                  {currentRestrictGuestMode === 'Deny' && t('security_setting.guest_mode.deny')}
                  {currentRestrictGuestMode === 'Readonly' && t('security_setting.guest_mode.readonly')}
                </span>
              </button>
              <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                <button className="dropdown-item" type="button" onClick={() => { adminGeneralSecurityContainer.changeRestrictGuestMode('Deny') }}>
                  {t('security_setting.guest_mode.deny')}
                </button>
                <button className="dropdown-item" type="button" onClick={() => { adminGeneralSecurityContainer.changeRestrictGuestMode('Readonly') }}>
                  {t('security_setting.guest_mode.readonly')}
                </button>
              </div>
            </div>
            {adminGeneralSecurityContainer.isWikiModeForced && (
              <p className="alert alert-warning mt-2 text-left offset-3 col-6">
                <i className="icon-exclamation icon-fw">
                </i><b>FIXED</b><br />
                <b
                  dangerouslySetInnerHTML={{
                    __html: t('security_setting.Fixed by env var',
                      { forcewikimode: 'FORCE_WIKI_MODE', wikimode: adminGeneralSecurityContainer.state.wikiMode }),
                  }}
                />
              </p>
            )}
          </div>
        </div>
        <div className="row mb-4">
          <div className="col-md-3 text-md-right mb-2">
            <strong>{t('security_setting.complete_deletion')}</strong>
          </div>
          <div className="col-md-6">
            <div className="dropdown">
              <button
                className="btn btn-outline-secondary dropdown-toggle text-right col-12 col-md-auto"
                type="button"
                id="dropdownMenuButton"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="true"
              >
                <span className="float-left">
                  {currentPageCompleteDeletionAuthority === 'anyOne' && t('security_setting.anyone')}
                  {currentPageCompleteDeletionAuthority === 'adminOnly' && t('security_setting.admin_only')}
                  {(currentPageCompleteDeletionAuthority === 'adminAndAuthor' || currentPageCompleteDeletionAuthority == null)
                      && t('security_setting.admin_and_author')}
                </span>
              </button>
              <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                <button className="dropdown-item" type="button" onClick={() => { adminGeneralSecurityContainer.changePageCompleteDeletionAuthority('anyOne') }}>
                  {t('security_setting.anyone')}
                </button>
                <button
                  className="dropdown-item"
                  type="button"
                  onClick={() => { adminGeneralSecurityContainer.changePageCompleteDeletionAuthority('adminOnly') }}
                >
                  {t('security_setting.admin_only')}
                </button>
                <button
                  className="dropdown-item"
                  type="button"
                  onClick={() => { adminGeneralSecurityContainer.changePageCompleteDeletionAuthority('adminAndAuthor') }}
                >
                  {t('security_setting.admin_and_author')}
                </button>
              </div>
              <p className="form-text text-muted small">
                {t('security_setting.complete_deletion_explain')}
              </p>
            </div>
          </div>
        </div>

        <h4>{t('security_setting.session')}</h4>
        <div className="form-group row">
          <label className="text-left text-md-right col-md-3 col-form-label">{t('security_setting.max_age')}</label>
          <div className="col-md-6">
            <input
              className="form-control col-md-3"
              type="text"
              defaultValue={adminGeneralSecurityContainer.state.sessionMaxAge || ''}
              onChange={(e) => {
                adminGeneralSecurityContainer.setSessionMaxAge(e.target.value);
              }}
              placeholder="2592000000"
            />
            {/* eslint-disable-next-line react/no-danger */}
            <p className="form-text text-muted" dangerouslySetInnerHTML={{ __html: t('security_setting.max_age_desc') }} />
            <p className="card well">
              <span className="text-warning">
                <i className="icon-info"></i> {t('security_setting.max_age_caution')}
              </span>
            </p>
          </div>
        </div>

        <div className="row my-3">
          <div className="text-center text-md-left offset-md-3 col-md-5">
            <button type="button" className="btn btn-primary" disabled={adminGeneralSecurityContainer.retrieveError != null} onClick={this.putSecuritySetting}>
              {t('Update')}
            </button>
          </div>
        </div>
      </React.Fragment>
    );
  }

}

SecuritySetting.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  csrf: PropTypes.string,
  adminGeneralSecurityContainer: PropTypes.instanceOf(AdminGeneralSecurityContainer).isRequired,
};

const SecuritySettingWrapper = withUnstatedContainers(SecuritySetting, [AppContainer, AdminGeneralSecurityContainer]);

export default withTranslation()(SecuritySettingWrapper);
