/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import { withUnstatedContainers } from '../../UnstatedUtils';
import { toastSuccess, toastError } from '../../../util/apiNotification';

import AppContainer from '../../../services/AppContainer';
import AdminGeneralSecurityContainer from '../../../services/AdminGeneralSecurityContainer';
import AdminSamlSecurityContainer from '../../../services/AdminSamlSecurityContainer';

class SamlSecurityManagementContents extends React.Component {

  constructor(props) {
    super(props);

    this.onClickSubmit = this.onClickSubmit.bind(this);
  }

  async onClickSubmit() {
    const { t, adminSamlSecurityContainer, adminGeneralSecurityContainer } = this.props;

    try {
      await adminSamlSecurityContainer.updateSamlSetting();
      await adminGeneralSecurityContainer.retrieveSetupStratedies();
      toastSuccess(t('security_setting.SAML.updated_saml'));
    }
    catch (err) {
      toastError(err);
    }
  }

  render() {
    const { t, adminGeneralSecurityContainer, adminSamlSecurityContainer } = this.props;
    const { useOnlyEnvVars } = adminSamlSecurityContainer.state;
    const { isSamlEnabled } = adminGeneralSecurityContainer.state;

    return (
      <React.Fragment>

        <h2 className="alert-anchor border-bottom">
          {t('security_setting.SAML.name')}
        </h2>

        {useOnlyEnvVars && (
          <p
            className="alert alert-info"
            dangerouslySetInnerHTML={{ __html: t('security_setting.SAML.note for the only env option', { env: 'SAML_USES_ONLY_ENV_VARS_FOR_SOME_OPTIONS' }) }}
          />
        )}

        <div className="row form-group mb-5">
          <div className="col-6 offset-3">
            <div className="custom-control custom-switch custom-checkbox-success">
              <input
                id="isSamlEnabled"
                className="custom-control-input"
                type="checkbox"
                checked={adminGeneralSecurityContainer.state.isSamlEnabled}
                onChange={() => { adminGeneralSecurityContainer.switchIsSamlEnabled() }}
                disabled={adminSamlSecurityContainer.state.useOnlyEnvVars}
              />
              <label className="custom-control-label" htmlFor="isSamlEnabled">
                {t('security_setting.SAML.enable_saml')}
              </label>
            </div>
            {(!adminGeneralSecurityContainer.state.setupStrategies.includes('ldap') && isSamlEnabled)
              && <div className="badge badge-warning">{t('security_setting.setup_is_not_yet_complete')}</div>}
          </div>
        </div>

        <div className="row form-group mb-5">
          <label className="text-left text-md-right col-md-3 col-form-label">{t('security_setting.callback_URL')}</label>
          <div className="col-md-6">
            <input
              className="form-control"
              type="text"
              defaultValue={adminSamlSecurityContainer.state.callbackUrl}
              readOnly
            />
            <p className="form-text text-muted small">{t('security_setting.desc_of_callback_URL', { AuthName: 'SAML Identity' })}</p>
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

        {isSamlEnabled && (
          <React.Fragment>

            {(adminSamlSecurityContainer.state.missingMandatoryConfigKeys.length !== 0) && (
              <div className="alert alert-danger">
                {t('security_setting.missing mandatory configs')}
                <ul>
                  {adminSamlSecurityContainer.state.missingMandatoryConfigKeys.map((configKey) => {
                    const key = configKey.replace('security:passport-saml:', '');
                    return <li key={configKey}>{t(`security_setting.form_item_name.${key}`)}</li>;
                  })}
                </ul>
              </div>
            )}


            <h3 className="alert-anchor border-bottom">
              Basic Settings
            </h3>

            <table className={`table settings-table ${adminSamlSecurityContainer.state.useOnlyEnvVars && 'use-only-env-vars'}`}>
              <colgroup>
                <col className="item-name" />
                <col className="from-db" />
                <col className="from-env-vars" />
              </colgroup>
              <thead>
                <tr><th></th><th>Database</th><th>Environment variables</th></tr>
              </thead>
              <tbody>
                <tr>
                  <th>{t('security_setting.form_item_name.entryPoint')}</th>
                  <td>
                    <input
                      className="form-control"
                      type="text"
                      name="samlEntryPoint"
                      readOnly={useOnlyEnvVars}
                      defaultValue={adminSamlSecurityContainer.state.samlEntryPoint}
                      onChange={e => adminSamlSecurityContainer.changeSamlEntryPoint(e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="form-control"
                      type="text"
                      value={adminSamlSecurityContainer.state.envEntryPoint || ''}
                      readOnly
                    />
                    <p className="form-text text-muted">
                      <small dangerouslySetInnerHTML={{ __html: t('security_setting.SAML.Use env var if empty', { env: 'SAML_ENTRY_POINT' }) }} />
                    </p>
                  </td>
                </tr>
                <tr>
                  <th>{t('security_setting.form_item_name.issuer')}</th>
                  <td>
                    <input
                      className="form-control"
                      type="text"
                      name="samlEnvVarissuer"
                      readOnly={useOnlyEnvVars}
                      defaultValue={adminSamlSecurityContainer.state.samlIssuer}
                      onChange={e => adminSamlSecurityContainer.changeSamlIssuer(e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="form-control"
                      type="text"
                      value={adminSamlSecurityContainer.state.envIssuer || ''}
                      readOnly
                    />
                    <p className="form-text text-muted">
                      <small dangerouslySetInnerHTML={{ __html: t('security_setting.SAML.Use env var if empty', { env: 'SAML_ISSUER' }) }} />
                    </p>
                  </td>
                </tr>
                <tr>
                  <th>{t('security_setting.form_item_name.cert')}</th>
                  <td>
                    <textarea
                      className="form-control form-control-sm"
                      type="text"
                      rows="5"
                      name="samlCert"
                      readOnly={useOnlyEnvVars}
                      defaultValue={adminSamlSecurityContainer.state.samlCert}
                      onChange={e => adminSamlSecurityContainer.changeSamlCert(e.target.value)}
                    />
                    <p>
                      <small>
                        {t('security_setting.SAML.cert_detail')}
                      </small>
                    </p>
                    <div>
                      <small>
                        e.g.
                        <pre className="well card">{`-----BEGIN CERTIFICATE-----
MIICBzCCAXACCQD4US7+0A/b/zANBgkqhkiG9w0BAQsFADBIMQswCQYDVQQGEwJK
UDEOMAwGA1UECAwFVG9reW8xFTATBgNVBAoMDFdFU0VFSywgSW5jLjESMBAGA1UE
...
crmVwBzbloUO2l6k1ibwD2WVwpdxMKIF5z58HfKAvxZAzCHE7kMEZr1ge30WRXQA
pWVdnzS1VCO8fKsJ7YYIr+JmHvseph3kFUOI5RqkCcMZlKUv83aUThsTHw==
-----END CERTIFICATE-----
                        `}
                        </pre>
                      </small>
                    </div>
                  </td>
                  <td>
                    <textarea
                      className="form-control form-control-sm"
                      type="text"
                      rows="5"
                      readOnly
                      value={adminSamlSecurityContainer.state.envCert || ''}
                    />
                    <p className="form-text text-muted">
                      <small dangerouslySetInnerHTML={{ __html: t('security_setting.SAML.Use env var if empty', { env: 'SAML_CERT' }) }} />
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>

            <h3 className="alert-anchor border-bottom">
              Attribute Mapping
            </h3>

            <table className={`table settings-table ${adminSamlSecurityContainer.state.useOnlyEnvVars && 'use-only-env-vars'}`}>
              <colgroup>
                <col className="item-name" />
                <col className="from-db" />
                <col className="from-env-vars" />
              </colgroup>
              <thead>
                <tr><th></th><th>Database</th><th>Environment variables</th></tr>
              </thead>
              <tbody>
                <tr>
                  <th>{t('security_setting.form_item_name.attrMapId')}</th>
                  <td>
                    <input
                      className="form-control"
                      type="text"
                      readOnly={useOnlyEnvVars}
                      defaultValue={adminSamlSecurityContainer.state.samlAttrMapId}
                      onChange={e => adminSamlSecurityContainer.changeSamlAttrMapId(e.target.value)}
                    />
                    <p className="form-text text-muted">
                      <small>
                        {t('security_setting.SAML.id_detail')}
                      </small>
                    </p>
                  </td>
                  <td>
                    <input
                      className="form-control"
                      type="text"
                      value={adminSamlSecurityContainer.state.envAttrMapId || ''}
                      readOnly
                    />
                    <p className="form-text text-muted">
                      <small dangerouslySetInnerHTML={{ __html: t('security_setting.SAML.Use env var if empty', { env: 'SAML_ATTR_MAPPING_ID' }) }} />
                    </p>
                  </td>
                </tr>
                <tr>
                  <th>{t('security_setting.form_item_name.attrMapUsername')}</th>
                  <td>
                    <input
                      className="form-control"
                      type="text"
                      readOnly={useOnlyEnvVars}
                      defaultValue={adminSamlSecurityContainer.state.samlAttrMapUsername}
                      onChange={e => adminSamlSecurityContainer.changeSamlAttrMapUserName(e.target.value)}
                    />
                    <p className="form-text text-muted">
                      <small dangerouslySetInnerHTML={{ __html: t('security_setting.SAML.username_detail') }} />
                    </p>
                  </td>
                  <td>
                    <input
                      className="form-control"
                      type="text"
                      value={adminSamlSecurityContainer.state.envAttrMapUsername || ''}
                      readOnly
                    />
                    <p className="form-text text-muted">
                      <small dangerouslySetInnerHTML={{ __html: t('security_setting.SAML.Use env var if empty', { env: 'SAML_ATTR_MAPPING_USERNAME' }) }} />
                    </p>
                  </td>
                </tr>
                <tr>
                  <th>{t('security_setting.form_item_name.attrMapMail')}</th>
                  <td>
                    <input
                      className="form-control"
                      type="text"
                      readOnly={useOnlyEnvVars}
                      defaultValue={adminSamlSecurityContainer.state.samlAttrMapMail}
                      onChange={e => adminSamlSecurityContainer.changeSamlAttrMapMail(e.target.value)}
                    />
                    <p className="form-text text-muted">
                      <small dangerouslySetInnerHTML={{ __html: t('security_setting.SAML.mapping_detail', { target: 'Email' }) }} />
                    </p>
                  </td>
                  <td>
                    <input
                      className="form-control"
                      type="text"
                      value={adminSamlSecurityContainer.state.envAttrMapMail || ''}
                      readOnly
                    />
                    <p className="form-text text-muted">
                      <small dangerouslySetInnerHTML={{ __html: t('security_setting.SAML.Use env var if empty', { env: 'SAML_ATTR_MAPPING_MAIL' }) }} />
                    </p>
                  </td>
                </tr>
                <tr>
                  <th>{t('security_setting.form_item_name.attrMapFirstName')}</th>
                  <td>
                    <input
                      className="form-control"
                      type="text"
                      readOnly={useOnlyEnvVars}
                      defaultValue={adminSamlSecurityContainer.state.samlAttrMapFirstName}
                      onChange={e => adminSamlSecurityContainer.changeSamlAttrMapFirstName(e.target.value)}
                    />
                    <p className="form-text text-muted">
                      {/* eslint-disable-next-line max-len */}
                      <small dangerouslySetInnerHTML={{ __html: t('security_setting.SAML.mapping_detail', { target: t('security_setting.form_item_name.attrMapFirstName') }) }} />
                    </p>
                  </td>
                  <td>
                    <input
                      className="form-control"
                      type="text"
                      value={adminSamlSecurityContainer.state.envAttrMapFirstName || ''}
                      readOnly
                    />
                    <p className="form-text text-muted">
                      <small>
                        <span dangerouslySetInnerHTML={{ __html: t('security_setting.SAML.Use env var if empty', { env: 'SAML_ATTR_MAPPING_FIRST_NAME' }) }} />
                        <br />
                        <span dangerouslySetInnerHTML={{ __html: t('security_setting.Use default if both are empty', { target: 'firstName' }) }} />
                      </small>
                    </p>
                  </td>
                </tr>
                <tr>
                  <th>{t('security_setting.form_item_name.attrMapLastName')}</th>
                  <td>
                    <input
                      className="form-control"
                      type="text"
                      readOnly={useOnlyEnvVars}
                      defaultValue={adminSamlSecurityContainer.state.samlAttrMapLastName}
                      onChange={e => adminSamlSecurityContainer.changeSamlAttrMapLastName(e.target.value)}
                    />
                    <p className="form-text text-muted">
                      {/* eslint-disable-next-line max-len */}
                      <small dangerouslySetInnerHTML={{ __html: t('security_setting.SAML.mapping_detail', { target: t('security_setting.form_item_name.attrMapLastName') }) }} />
                    </p>
                  </td>
                  <td>
                    <input
                      className="form-control"
                      type="text"
                      value={adminSamlSecurityContainer.state.envAttrMapLastName || ''}
                      readOnly
                    />
                    <p className="form-text text-muted">
                      <small>
                        <span dangerouslySetInnerHTML={{ __html: t('security_setting.SAML.Use env var if empty', { env: 'SAML_ATTR_MAPPING_LAST_NAME' }) }} />
                        <br />
                        <span dangerouslySetInnerHTML={{ __html: t('security_setting.Use default if both are empty', { target: 'lastName' }) }} />
                      </small>
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>

            <h3 className="alert-anchor border-bottom">
              Attribute Mapping Options
            </h3>

            <div className="row form-group mb-5">
              <div className="offset-md-3 col-md-6 text-left">
                <div className="custom-control custom-checkbox custom-checkbox-success">
                  <input
                    id="bindByUserName-SAML"
                    className="custom-control-input"
                    type="checkbox"
                    checked={adminSamlSecurityContainer.state.isSameUsernameTreatedAsIdenticalUser || false}
                    onChange={() => { adminSamlSecurityContainer.switchIsSameUsernameTreatedAsIdenticalUser() }}
                  />
                  <label
                    className="custom-control-label"
                    htmlFor="bindByUserName-SAML"
                    dangerouslySetInnerHTML={{ __html: t('security_setting.Treat username matching as identical') }}
                  />
                </div>
                <p className="form-text text-muted">
                  <small dangerouslySetInnerHTML={{ __html: t('security_setting.Treat username matching as identical_warn') }} />
                </p>
              </div>
            </div>

            <div className="row form-group mb-5">
              <div className="offset-md-3 col-md-6 text-left">
                <div className="custom-control custom-checkbox custom-checkbox-success">
                  <input
                    id="bindByEmail-SAML"
                    className="custom-control-input"
                    type="checkbox"
                    checked={adminSamlSecurityContainer.state.isSameEmailTreatedAsIdenticalUser || false}
                    onChange={() => { adminSamlSecurityContainer.switchIsSameEmailTreatedAsIdenticalUser() }}
                  />
                  <label
                    className="custom-control-label"
                    htmlFor="bindByEmail-SAML"
                    dangerouslySetInnerHTML={{ __html: t('security_setting.Treat email matching as identical') }}
                  />
                </div>
                <p className="form-text text-muted">
                  <small dangerouslySetInnerHTML={{ __html: t('security_setting.Treat email matching as identical_warn') }} />
                </p>
              </div>
            </div>

            <h3 className="alert-anchor border-bottom">
              Attribute-based Login Control
            </h3>

            <p className="form-text text-muted">
              <small dangerouslySetInnerHTML={{ __html: t('security_setting.SAML.attr_based_login_control_detail') }} />
            </p>

            <table className={`table settings-table ${useOnlyEnvVars && 'use-only-env-vars'}`}>
              <colgroup>
                <col className="item-name" />
                <col className="from-db" />
                <col className="from-env-vars" />
              </colgroup>
              <thead>
                <tr><th></th><th>Database</th><th>Environment variables</th></tr>
              </thead>
              <tbody>
                <tr>
                  <th>
                    { t('security_setting.form_item_name.ABLCRule') }
                  </th>
                  <td>
                    <input
                      className="form-control"
                      type="text"
                      defaultValue={adminSamlSecurityContainer.state.samlABLCRule || ''}
                      onChange={(e) => { adminSamlSecurityContainer.changeSamlABLCRule(e.target.value) }}
                      readOnly={useOnlyEnvVars}
                    />
                    <p className="form-text text-muted">
                      <small>
                        <span dangerouslySetInnerHTML={{ __html: t('security_setting.SAML.attr_based_login_control_rule_detail') }} />
                        <span dangerouslySetInnerHTML={{ __html: t('security_setting.SAML.attr_based_login_control_rule_example') }} />
                      </small>
                    </p>
                  </td>
                  <td>
                    <input
                      className="form-control"
                      type="text"
                      value={adminSamlSecurityContainer.state.envABLCRule || ''}
                      readOnly
                    />
                    <p className="form-text text-muted">
                      <small dangerouslySetInnerHTML={{ __html: t('security_setting.SAML.Use env var if empty', { env: 'SAML_ABLC_RULE' }) }} />
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="row my-3">
              <div className="offset-3 col-5">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={adminSamlSecurityContainer.state.retrieveError != null}
                  onClick={this.onClickSubmit}
                >
                  {t('Update')}
                </button>
              </div>
            </div>

          </React.Fragment>
        )}

      </React.Fragment>
    );

  }

}

SamlSecurityManagementContents.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  adminGeneralSecurityContainer: PropTypes.instanceOf(AdminGeneralSecurityContainer).isRequired,
  adminSamlSecurityContainer: PropTypes.instanceOf(AdminSamlSecurityContainer).isRequired,
};

const SamlSecurityManagementContentsWrapper = withUnstatedContainers(SamlSecurityManagementContents, [
  AppContainer,
  AdminGeneralSecurityContainer,
  AdminSamlSecurityContainer,
]);

export default withTranslation()(SamlSecurityManagementContentsWrapper);
