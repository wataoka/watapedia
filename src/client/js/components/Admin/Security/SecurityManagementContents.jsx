import React, { Fragment, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import { TabContent, TabPane } from 'reactstrap';

import LdapSecuritySetting from './LdapSecuritySetting';
import LocalSecuritySetting from './LocalSecuritySetting';
import SamlSecuritySetting from './SamlSecuritySetting';
import OidcSecuritySetting from './OidcSecuritySetting';
import SecuritySetting from './SecuritySetting';
import BasicSecuritySetting from './BasicSecuritySetting';
import GoogleSecuritySetting from './GoogleSecuritySetting';
import GitHubSecuritySetting from './GitHubSecuritySetting';
import TwitterSecuritySetting from './TwitterSecuritySetting';
import FacebookSecuritySetting from './FacebookSecuritySetting';
import ShareLinkSetting from './ShareLinkSetting';

import CustomNav from '../../CustomNavigation/CustomNav';

function SecurityManagementContents(props) {
  const { t } = props;

  const [activeTab, setActiveTab] = useState('passport_local');
  const [activeComponents, setActiveComponents] = useState(new Set(['passport_local']));

  const switchActiveTab = (selectedTab) => {
    setActiveTab(selectedTab);
    setActiveComponents(activeComponents.add(selectedTab));
  };

  const navTabMapping = useMemo(() => {
    return {
      passport_local: {
        Icon: () => <i className="fa fa-users" />,
        i18n: 'ID/Pass',
        index: 0,
      },
      passport_ldap: {
        Icon: () => <i className="fa fa-sitemap" />,
        i18n: 'LDAP',
        index: 1,
      },
      passport_saml: {
        Icon: () => <i className="fa fa-key" />,
        i18n: 'SAML',
        index: 2,
      },
      passport_oidc: {
        Icon: () => <i className="fa fa-key" />,
        i18n: 'OIDC',
        index: 3,
      },
      passport_basic: {
        Icon: () => <i className="fa fa-lock" />,
        i18n: 'BASIC',
        index: 4,
      },
      passport_google: {
        Icon: () => <i className="fa fa-google" />,
        i18n: 'Google',
        index: 5,
      },
      passport_github: {
        Icon: () => <i className="fa fa-github" />,
        i18n: 'GitHub',
        index: 6,
      },
      passport_twitter: {
        Icon: () => <i className="fa fa-twitter" />,
        i18n: 'Twitter',
        index: 7,
      },
      passport_facebook: {
        Icon: () => <i className="fa fa-facebook" />,
        i18n: '(TBD) Facebook',
        index: 8,
      },
    };
  }, []);


  return (
    <Fragment>
      <div className="mb-5">
        <SecuritySetting />
      </div>

      {/* Shared Link List */}
      <div className="mb-5">
        <ShareLinkSetting />
      </div>


      {/* XSS configuration link */}
      <div className="mb-5">
        <h2 className="border-bottom">{t('security_setting.xss_prevent_setting')}</h2>
        <div className="text-center">
          <a style={{ fontSize: 'large' }} href="/admin/markdown/#preventXSS">
            <i className="fa-fw icon-login"></i> {t('security_setting.xss_prevent_setting_link')}
          </a>
        </div>
      </div>

      <div className="auth-mechanism-configurations">
        <h2 className="border-bottom">{t('security_setting.Authentication mechanism settings')}</h2>
        <CustomNav
          activeTab={activeTab}
          navTabMapping={navTabMapping}
          onNavSelected={switchActiveTab}
          hideBorderBottom
          breakpointToSwitchDropdownDown="md"
        />
        <TabContent activeTab={activeTab} className="p-5">
          <TabPane tabId="passport_local">
            {activeComponents.has('passport_local') && <LocalSecuritySetting />}
          </TabPane>
          <TabPane tabId="passport_ldap">
            {activeComponents.has('passport_ldap') && <LdapSecuritySetting />}
          </TabPane>
          <TabPane tabId="passport_saml">
            {activeComponents.has('passport_saml') && <SamlSecuritySetting />}
          </TabPane>
          <TabPane tabId="passport_oidc">
            {activeComponents.has('passport_oidc') && <OidcSecuritySetting />}
          </TabPane>
          <TabPane tabId="passport_basic">
            {activeComponents.has('passport_basic') && <BasicSecuritySetting />}
          </TabPane>
          <TabPane tabId="passport_google">
            {activeComponents.has('passport_google') && <GoogleSecuritySetting />}
          </TabPane>
          <TabPane tabId="passport_github">
            {activeComponents.has('passport_github') && <GitHubSecuritySetting />}
          </TabPane>
          <TabPane tabId="passport_twitter">
            {activeComponents.has('passport_twitter') && <TwitterSecuritySetting />}
          </TabPane>
          <TabPane tabId="passport_facebook">
            {activeComponents.has('passport_facebook') && <FacebookSecuritySetting />}
          </TabPane>
        </TabContent>
      </div>
    </Fragment>
  );

}

SecurityManagementContents.propTypes = {
  t: PropTypes.func.isRequired, // i18next
};

export default withTranslation()(SecurityManagementContents);
