import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import loggerFactory from '@alias/logger';

import { withUnstatedContainers } from '../../UnstatedUtils';
import { toastSuccess, toastError } from '../../../util/apiNotification';

import AppContainer from '../../../services/AppContainer';
import AdminNotificationContainer from '../../../services/AdminNotificationContainer';
import UserNotificationRow from './UserNotificationRow';

const logger = loggerFactory('growi:slackAppConfiguration');

class UserTriggerNotification extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      pathPattern: '',
      channel: '',
    };

    this.changePathPattern = this.changePathPattern.bind(this);
    this.changeChannel = this.changeChannel.bind(this);
    this.validateForm = this.validateForm.bind(this);
    this.onClickSubmit = this.onClickSubmit.bind(this);
    this.onClickDeleteBtn = this.onClickDeleteBtn.bind(this);

  }

  /**
   * Change pathPattern
   */
  changePathPattern(pathPattern) {
    this.setState({ pathPattern });
  }

  /**
   * Change channel
   */
  changeChannel(channel) {
    this.setState({ channel });
  }

  validateForm() {
    return this.state.pathPattern !== '' && this.state.channel !== '';
  }

  async onClickSubmit() {
    const { t, adminNotificationContainer } = this.props;

    try {
      await adminNotificationContainer.addNotificationPattern(this.state.pathPattern, this.state.channel);
      toastSuccess(t('notification_setting.add_notification_pattern'));
      this.setState({ pathPattern: '', channel: '' });
    }
    catch (err) {
      toastError(err);
      logger.error(err);
    }
  }

  async onClickDeleteBtn(notificationIdForDelete) {
    const { t, adminNotificationContainer } = this.props;

    try {
      const deletedNotificaton = await adminNotificationContainer.deleteUserTriggerNotificationPattern(notificationIdForDelete);
      toastSuccess(t('notification_setting.delete_notification_pattern', { path: deletedNotificaton.pathPattern }));
    }
    catch (err) {
      toastError(err);
      logger.error(err);
    }
  }

  render() {
    const { t, adminNotificationContainer } = this.props;
    const userNotifications = adminNotificationContainer.state.userNotifications || [];

    return (
      <React.Fragment>
        <h2 className="border-bottom my-4">{t('notification_setting.user_trigger_notification_header')}</h2>

        <table className="table table-bordered">
          <thead>
            <tr>
              <th>{t('notification_setting.pattern')}</th>
              <th>{t('notification_setting.channel')}</th>
              <th />
            </tr>
          </thead>
          <tbody className="admin-notif-list">
            <tr>
              <td>
                <input
                  className="form-control"
                  type="text"
                  name="pathPattern"
                  value={this.state.pathPattern}
                  placeholder="e.g. /projects/xxx/MTG/*"
                  onChange={(e) => { this.changePathPattern(e.target.value) }}
                />
                <p className="p-2 mb-0">
                  {/* eslint-disable-next-line react/no-danger */}
                  <span dangerouslySetInnerHTML={{ __html: t('notification_setting.pattern_desc') }} />
                </p>
              </td>

              <td>
                <div className="input-group notify-to-option" id="slack-input">
                  <div className="input-group-prepend">
                    <span className="input-group-text"><i className="fa fa-hashtag" /></span>
                  </div>
                  <input
                    className="form-control form-inline"
                    type="text"
                    name="channel"
                    value={this.state.channel}
                    placeholder="e.g. project-xxx"
                    onChange={(e) => { this.changeChannel(e.target.value) }}
                  />
                </div>
                <p className="p-2 mb-0">
                  {/* eslint-disable-next-line react/no-danger */}
                  <span dangerouslySetInnerHTML={{ __html: t('notification_setting.channel_desc') }} />
                </p>
              </td>
              <td>
                <button type="button" className="btn btn-primary" disabled={!this.validateForm()} onClick={this.onClickSubmit}>{t('add')}</button>
              </td>
            </tr>
            {userNotifications.length > 0 && userNotifications.map((notification) => {
              return <UserNotificationRow notification={notification} onClickDeleteBtn={this.onClickDeleteBtn} key={notification._id} />;
            })}
          </tbody>
        </table>
      </React.Fragment>
    );
  }


}


const UserTriggerNotificationWrapper = withUnstatedContainers(UserTriggerNotification, [AppContainer, AdminNotificationContainer]);

UserTriggerNotification.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  adminNotificationContainer: PropTypes.instanceOf(AdminNotificationContainer).isRequired,

};

export default withTranslation()(UserTriggerNotificationWrapper);
