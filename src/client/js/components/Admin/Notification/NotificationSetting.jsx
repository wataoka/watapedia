import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import loggerFactory from '@alias/logger';

import { TabContent, TabPane } from 'reactstrap';
import { withUnstatedContainers } from '../../UnstatedUtils';
import { toastError } from '../../../util/apiNotification';
import toArrayIfNot from '../../../../../lib/util/toArrayIfNot';
import { withLoadingSppiner } from '../../SuspenseUtils';

import AdminNotificationContainer from '../../../services/AdminNotificationContainer';

import { CustomNavTab } from '../../CustomNavigation/CustomNav';

import SlackAppConfiguration from './SlackAppConfiguration';
import UserTriggerNotification from './UserTriggerNotification';
import GlobalNotification from './GlobalNotification';

const logger = loggerFactory('growi:NotificationSetting');

let retrieveErrors = null;
function NotificationSetting(props) {
  const { adminNotificationContainer } = props;

  const [activeTab, setActiveTab] = useState('slack_configuration');
  const [activeComponents, setActiveComponents] = useState(new Set(['slack_configuration']));

  const switchActiveTab = (selectedTab) => {
    setActiveTab(selectedTab);
    setActiveComponents(activeComponents.add(selectedTab));
  };

  if (adminNotificationContainer.state.webhookUrl === adminNotificationContainer.dummyWebhookUrl) {
    throw (async() => {
      try {
        await adminNotificationContainer.retrieveNotificationData();
      }
      catch (err) {
        const errs = toArrayIfNot(err);
        toastError(errs);
        logger.error(errs);
        retrieveErrors = errs;
        adminNotificationContainer.setState({ webhookUrl: adminNotificationContainer.dummyWebhookUrlForError });
      }
    })();
  }

  if (adminNotificationContainer.state.webhookUrl === adminNotificationContainer.dummyWebhookUrlForError) {
    throw new Error(`${retrieveErrors.length} errors occured`);
  }

  const navTabMapping = useMemo(() => {
    return {
      slack_configuration: {
        Icon: () => <i className="icon-settings" />,
        i18n: 'Slack configuration',
        index: 0,
      },
      user_trigger_notification: {
        Icon: () => <i className="icon-settings" />,
        i18n: 'User trigger notification',
        index: 1,
      },
      global_notification: {
        Icon: () => <i className="icon-settings" />,
        i18n: 'Global notification',
        index: 2,
      },
    };
  }, []);

  return (
    <>
      <CustomNavTab activeTab={activeTab} navTabMapping={navTabMapping} onNavSelected={switchActiveTab} hideBorderBottom />

      <TabContent activeTab={activeTab} className="p-5">
        <TabPane tabId="slack_configuration">
          {activeComponents.has('slack_configuration') && <SlackAppConfiguration />}
        </TabPane>
        <TabPane tabId="user_trigger_notification">
          {activeComponents.has('user_trigger_notification') && <UserTriggerNotification />}
        </TabPane>
        <TabPane tabId="global_notification">
          {activeComponents.has('global_notification') && <GlobalNotification />}
        </TabPane>
      </TabContent>
    </>
  );
}

const NotificationSettingWithUnstatedContainer = withUnstatedContainers(withLoadingSppiner(NotificationSetting), [AdminNotificationContainer]);

NotificationSetting.propTypes = {
  adminNotificationContainer: PropTypes.instanceOf(AdminNotificationContainer).isRequired,
};

export default NotificationSettingWithUnstatedContainer;
