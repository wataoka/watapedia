module.exports = {
  default: 'info',

  // 'express-session': 'debug',

  /*
   * configure level for server
   */
  // 'express:*': 'debug',
  // 'growi:*': 'debug',
  'growi:crowi': 'debug',
  // 'growi:crow:dev': 'debug',
  'growi:crowi:express-init': 'debug',
  'growi:models:external-account': 'debug',
  // 'growi:routes:login': 'debug',
  'growi:routes:login-passport': 'debug',
  'growi:middleware:safe-redirect': 'debug',
  'growi:service:PassportService': 'debug',
  'growi:service:s2s-messaging:*': 'debug',
  // 'growi:service:socket-io': 'debug',
  // 'growi:service:ConfigManager': 'debug',
  // 'growi:service:mail': 'debug',
  'growi:lib:search': 'debug',
  // 'growi:service:GlobalNotification': 'debug',
  // 'growi:lib:importer': 'debug',
  // 'growi:routes:page': 'debug',
  'growi-plugin:*': 'debug',
  // 'growi:InterceptorManager': 'debug',

  /*
   * configure level for client
   */
  'growi:cli:bootstrap': 'debug',
  'growi:cli:app': 'debug',
  'growi:services:*': 'debug',
  // 'growi:StaffCredit': 'debug',
  // 'growi:cli:StickyStretchableScroller': 'debug',

};
