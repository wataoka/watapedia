const logger = require('@alias/logger')('growi:service:system-events:SyncPageStatusService');

const S2sMessage = require('../../models/vo/s2s-message');
const { S2cMessagePageUpdated } = require('../../models/vo/s2c-message');
const S2sMessageHandlable = require('../s2s-messaging/handlable');

/**
 * This service notify page status
 *  to clients who are connecting to this server
 *  and also notify to clients connecting to other GROWI servers
 *
 * Sequence:
 *  1. A client A1 connecting to GROWI server A updates a page
 *  2. GROWI server A notify the information
 *    2.1 -- to client A2, A3, ... with SocketIoService
 *    2.2 -- to other GROWI servers with S2sMessagingService
 *  3. GROWI server B, C, ... relay the information to clients B1, B2, .. C1, C2, ... with SocketIoService
 *
 */
class SyncPageStatusService extends S2sMessageHandlable {

  constructor(crowi, s2sMessagingService, socketIoService) {
    super();

    this.crowi = crowi;
    this.s2sMessagingService = s2sMessagingService;
    this.socketIoService = socketIoService;

    this.emitter = crowi.events.page;

    this.initSystemEventListeners();
  }

  /**
   * @inheritdoc
   */
  shouldHandleS2sMessage(s2sMessage) {
    const { eventName } = s2sMessage;
    if (eventName !== 'pageStatusUpdated') {
      return false;
    }

    return true;
  }

  /**
   * @inheritdoc
   */
  async handleS2sMessage(s2sMessage) {
    const { socketIoEventName, s2cMessageBody } = s2sMessage;
    const { socketIoService } = this;

    // emit the updated information to clients
    if (socketIoService.isInitialized) {
      socketIoService.getDefaultSocket().emit(socketIoEventName, s2cMessageBody);
    }
  }

  async publishToOtherServers(socketIoEventName, s2cMessageBody) {
    const { s2sMessagingService } = this;

    if (s2sMessagingService != null) {
      const s2sMessage = new S2sMessage('pageStatusUpdated', { socketIoEventName, s2cMessageBody });

      try {
        await s2sMessagingService.publish(s2sMessage);
      }
      catch (e) {
        logger.error('Failed to publish update message with S2sMessagingService: ', e.message);
      }
    }
  }

  initSystemEventListeners() {
    const { socketIoService } = this;

    // register events
    this.emitter.on('create', (page, user, socketClientId) => {
      logger.debug('\'create\' event emitted.');

      const s2cMessagePageUpdated = new S2cMessagePageUpdated(page, user);
      socketIoService.getDefaultSocket().emit('page:create', { s2cMessagePageUpdated, socketClientId });

      this.publishToOtherServers('page:create', { s2cMessagePageUpdated });
    });
    this.emitter.on('update', (page, user, socketClientId) => {
      logger.debug('\'update\' event emitted.');

      const s2cMessagePageUpdated = new S2cMessagePageUpdated(page, user);
      socketIoService.getDefaultSocket().emit('page:update', { s2cMessagePageUpdated, socketClientId });

      this.publishToOtherServers('page:update', { s2cMessagePageUpdated });
    });
    this.emitter.on('delete', (page, user, socketClientId) => {
      logger.debug('\'delete\' event emitted.');

      const s2cMessagePageUpdated = new S2cMessagePageUpdated(page, user);
      socketIoService.getDefaultSocket().emit('page:delete', { s2cMessagePageUpdated, socketClientId });

      this.publishToOtherServers('page:delete', { s2cMessagePageUpdated });
    });
    this.emitter.on('saveOnHackmd', (page) => {
      const s2cMessagePageUpdated = new S2cMessagePageUpdated(page);
      socketIoService.getDefaultSocket().emit('page:editingWithHackmd', { s2cMessagePageUpdated });
      this.publishToOtherServers('page:editingWithHackmd', { s2cMessagePageUpdated });
    });
  }

}

module.exports = SyncPageStatusService;
