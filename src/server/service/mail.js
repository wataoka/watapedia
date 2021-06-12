const logger = require('@alias/logger')('growi:service:mail');

const nodemailer = require('nodemailer');
const swig = require('swig-templates');


const S2sMessage = require('../models/vo/s2s-message');
const S2sMessageHandlable = require('./s2s-messaging/handlable');


class MailService extends S2sMessageHandlable {

  constructor(crowi) {
    super();

    this.appService = crowi.appService;
    this.configManager = crowi.configManager;
    this.s2sMessagingService = crowi.s2sMessagingService;

    this.mailConfig = {};
    this.mailer = {};

    /**
     * the flag whether mailer is set up successfully
     */
    this.isMailerSetup = false;

    this.initialize();
  }

  /**
   * @inheritdoc
   */
  shouldHandleS2sMessage(s2sMessage) {
    const { eventName, updatedAt } = s2sMessage;
    if (eventName !== 'mailServiceUpdated' || updatedAt == null) {
      return false;
    }

    return this.lastLoadedAt == null || this.lastLoadedAt < new Date(s2sMessage.updatedAt);
  }

  /**
   * @inheritdoc
   */
  async handleS2sMessage(s2sMessage) {
    const { configManager } = this;

    logger.info('Initialize mail settings by pubsub notification');
    await configManager.loadConfigs();
    this.initialize();
  }

  async publishUpdatedMessage() {
    const { s2sMessagingService } = this;

    if (s2sMessagingService != null) {
      const s2sMessage = new S2sMessage('mailServiceUpdated', { updatedAt: new Date() });

      try {
        await s2sMessagingService.publish(s2sMessage);
      }
      catch (e) {
        logger.error('Failed to publish update message with S2sMessagingService: ', e.message);
      }
    }
  }


  initialize() {
    const { appService, configManager } = this;

    this.isMailerSetup = false;

    if (!configManager.getConfig('crowi', 'mail:from')) {
      this.mailer = null;
      return;
    }

    const transmissionMethod = configManager.getConfig('crowi', 'mail:transmissionMethod');

    if (transmissionMethod === 'smtp') {
      this.mailer = this.createSMTPClient();
    }
    else if (transmissionMethod === 'ses') {
      this.mailer = this.createSESClient();
    }
    else {
      this.mailer = null;
    }

    if (this.mailer != null) {
      this.isMailerSetup = true;
    }

    this.mailConfig.from = configManager.getConfig('crowi', 'mail:from');
    this.mailConfig.subject = `${appService.getAppTitle()}からのメール`;

    logger.debug('mailer initialized');
  }

  createSMTPClient(option) {
    const { configManager } = this;

    logger.debug('createSMTPClient option', option);
    if (!option) {
      const host = configManager.getConfig('crowi', 'mail:smtpHost');
      const port = configManager.getConfig('crowi', 'mail:smtpPort');

      if (host == null || port == null) {
        return null;
      }
      option = { // eslint-disable-line no-param-reassign
        host,
        port,
      };

      if (configManager.getConfig('crowi', 'mail:smtpUser') && configManager.getConfig('crowi', 'mail:smtpPassword')) {
        option.auth = {
          user: configManager.getConfig('crowi', 'mail:smtpUser'),
          pass: configManager.getConfig('crowi', 'mail:smtpPassword'),
        };
      }
      if (option.port === 465) {
        option.secure = true;
      }
    }
    option.tls = { rejectUnauthorized: false };

    const client = nodemailer.createTransport(option);

    logger.debug('mailer set up for SMTP', client);

    return client;
  }

  createSESClient(option) {
    const { configManager } = this;

    if (!option) {
      const accessKeyId = configManager.getConfig('crowi', 'mail:sesAccessKeyId');
      const secretAccessKey = configManager.getConfig('crowi', 'mail:sesSecretAccessKey');
      if (accessKeyId == null || secretAccessKey == null) {
        return null;
      }
      option = { // eslint-disable-line no-param-reassign
        accessKeyId,
        secretAccessKey,
      };
    }

    const ses = require('nodemailer-ses-transport');
    const client = nodemailer.createTransport(ses(option));

    logger.debug('mailer set up for SES', client);

    return client;
  }

  setupMailConfig(overrideConfig) {
    const c = overrideConfig;

    let mc = {};
    mc = this.mailConfig;

    mc.to = c.to;
    mc.from = c.from || this.mailConfig.from;
    mc.text = c.text;
    mc.subject = c.subject || this.mailConfig.subject;

    return mc;
  }

  async send(config) {
    if (this.mailer == null) {
      throw new Error('Mailer is not completed to set up. Please set up SMTP or AWS setting.');
    }

    const templateVars = config.vars || {};
    const output = await swig.renderFile(
      config.template,
      templateVars,
    );

    config.text = output;
    return this.mailer.sendMail(this.setupMailConfig(config));
  }

}

module.exports = MailService;
