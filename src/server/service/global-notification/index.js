const logger = require('@alias/logger')('growi:service:GlobalNotificationService');
const GloabalNotificationSlack = require('./global-notification-slack');
const GloabalNotificationMail = require('./global-notification-mail');

/**
 * service class of GlobalNotificationSetting
 */
class GlobalNotificationService {

  constructor(crowi) {
    this.crowi = crowi;
    this.defaultLang = 'en_US'; // TODO: get defaultLang from app global config

    this.gloabalNotificationMail = new GloabalNotificationMail(crowi);
    this.gloabalNotificationSlack = new GloabalNotificationSlack(crowi);

    this.Page = this.crowi.model('Page');

  }


  /**
   * fire global notification
   *
   * @memberof GlobalNotificationService
   *
   * @param {string} event event name triggered
   * @param {string} page page triggered the event
   * @param {User} triggeredBy user who triggered the event
   * @param {object} vars event specific vars
   */
  async fire(event, page, triggeredBy, vars = {}) {
    logger.debug(`global notficatoin event ${event} was triggered`);

    // validation
    if (event == null || page.path == null || triggeredBy == null) {
      throw new Error(`invalid vars supplied to GlobalNotificationSlackService.generateOption for event ${event}`);
    }

    if (!this.isSendNotification(page.grant)) {
      logger.info('this page does not send notifications');
      return;
    }

    await Promise.all([
      this.gloabalNotificationMail.fire(event, page.path, triggeredBy, vars),
      this.gloabalNotificationSlack.fire(event, page.id, page.path, triggeredBy, vars),
    ]);
  }

  /**
   * fire global notification
   *
   * @memberof GlobalNotificationService
   *
   * @param {number} grant page grant
   * @return {boolean} isSendNotification
   */
  isSendNotification(grant) {
    switch (grant) {
      case this.Page.GRANT_PUBLIC:
        return true;
      case this.Page.GRANT_RESTRICTED:
        return false;
      case this.Page.GRANT_SPECIFIED:
        return false;
      case this.Page.GRANT_OWNER:
        return (this.crowi.configManager.getConfig('notification', 'notification:owner-page:isEnabled') || false);
      case this.Page.GRANT_USER_GROUP:
        return (this.crowi.configManager.getConfig('notification', 'notification:group-page:isEnabled') || false);
    }
  }

}

module.exports = GlobalNotificationService;
