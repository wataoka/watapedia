const logger = require('@alias/logger')('growi:service:PassportService');
const urljoin = require('url-join');
const luceneQueryParser = require('lucene-query-parser');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const LdapStrategy = require('passport-ldapauth');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const OidcStrategy = require('openid-client').Strategy;
const SamlStrategy = require('passport-saml').Strategy;
const OIDCIssuer = require('openid-client').Issuer;
const BasicStrategy = require('passport-http').BasicStrategy;

const S2sMessage = require('../models/vo/s2s-message');
const S2sMessageHandlable = require('./s2s-messaging/handlable');

/**
 * the service class of Passport
 */
class PassportService extends S2sMessageHandlable {

  // see '/lib/form/login.js'
  static get USERNAME_FIELD() { return 'loginForm[username]' }

  static get PASSWORD_FIELD() { return 'loginForm[password]' }

  constructor(crowi) {
    super();

    this.crowi = crowi;
    this.lastLoadedAt = null;

    /**
     * the flag whether LocalStrategy is set up successfully
     */
    this.isLocalStrategySetup = false;

    /**
     * the flag whether LdapStrategy is set up successfully
     */
    this.isLdapStrategySetup = false;

    /**
     * the flag whether GoogleStrategy is set up successfully
     */
    this.isGoogleStrategySetup = false;

    /**
     * the flag whether GitHubStrategy is set up successfully
     */
    this.isGitHubStrategySetup = false;

    /**
     * the flag whether TwitterStrategy is set up successfully
     */
    this.isTwitterStrategySetup = false;

    /**
     * the flag whether OidcStrategy is set up successfully
     */
    this.isOidcStrategySetup = false;

    /**
     * the flag whether SamlStrategy is set up successfully
     */
    this.isSamlStrategySetup = false;

    /**
     * the flag whether BasicStrategy is set up successfully
     */
    this.isBasicStrategySetup = false;

    /**
     * the flag whether serializer/deserializer are set up successfully
     */
    this.isSerializerSetup = false;

    /**
     * the keys of mandatory configs for SAML
     */
    this.mandatoryConfigKeysForSaml = [
      'security:passport-saml:entryPoint',
      'security:passport-saml:issuer',
      'security:passport-saml:cert',
      'security:passport-saml:attrMapId',
      'security:passport-saml:attrMapUsername',
      'security:passport-saml:attrMapMail',
    ];

    this.setupFunction = {
      local: {
        setup: 'setupLocalStrategy',
        reset: 'resetLocalStrategy',
      },
      ldap: {
        setup: 'setupLdapStrategy',
        reset: 'resetLdapStrategy',
      },
      saml: {
        setup: 'setupSamlStrategy',
        reset: 'resetSamlStrategy',
      },
      oidc: {
        setup: 'setupOidcStrategy',
        reset: 'resetOidcStrategy',
      },
      basic: {
        setup: 'setupBasicStrategy',
        reset: 'resetBasicStrategy',
      },
      google: {
        setup: 'setupGoogleStrategy',
        reset: 'resetGoogleStrategy',
      },
      github: {
        setup: 'setupGitHubStrategy',
        reset: 'resetGitHubStrategy',
      },
      twitter: {
        setup: 'setupTwitterStrategy',
        reset: 'resetTwitterStrategy',
      },
    };
  }


  /**
   * @inheritdoc
   */
  shouldHandleS2sMessage(s2sMessage) {
    const { eventName, updatedAt, strategyId } = s2sMessage;
    if (eventName !== 'passportServiceUpdated' || updatedAt == null || strategyId == null) {
      return false;
    }

    return this.lastLoadedAt == null || this.lastLoadedAt < new Date(s2sMessage.updatedAt);
  }

  /**
   * @inheritdoc
   */
  async handleS2sMessage(s2sMessage) {
    const { configManager } = this.crowi;
    const { strategyId } = s2sMessage;

    logger.info('Reset strategy by pubsub notification');
    await configManager.loadConfigs();
    return this.setupStrategyById(strategyId);
  }

  async publishUpdatedMessage(strategyId) {
    const { s2sMessagingService } = this.crowi;

    if (s2sMessagingService != null) {
      const s2sMessage = new S2sMessage('passportStrategyReloaded', {
        updatedAt: new Date(),
        strategyId,
      });

      try {
        await s2sMessagingService.publish(s2sMessage);
      }
      catch (e) {
        logger.error('Failed to publish update message with S2sMessagingService: ', e.message);
      }
    }
  }

  /**
   * get SetupStrategies
   *
   * @return {Array}
   * @memberof PassportService
   */
  getSetupStrategies() {
    const setupStrategies = [];

    if (this.isLocalStrategySetup) { setupStrategies.push('local') }
    if (this.isLdapStrategySetup) { setupStrategies.push('ldap') }
    if (this.isSamlStrategySetup) { setupStrategies.push('saml') }
    if (this.isOidcStrategySetup) { setupStrategies.push('oidc') }
    if (this.isBasicStrategySetup) { setupStrategies.push('basic') }
    if (this.isGoogleStrategySetup) { setupStrategies.push('google') }
    if (this.isGitHubStrategySetup) { setupStrategies.push('github') }
    if (this.isTwitterStrategySetup) { setupStrategies.push('twitter') }

    return setupStrategies;
  }

  /**
   * get SetupFunction
   *
   * @return {Object}
   * @param {string} authId
   */
  getSetupFunction(authId) {
    return this.setupFunction[authId];
  }

  /**
   * setup strategy by target name
   */
  async setupStrategyById(authId) {
    const func = this.getSetupFunction(authId);

    try {
      this[func.setup]();
    }
    catch (err) {
      logger.debug(err);
      this[func.reset]();
    }

    this.lastLoadedAt = new Date();
  }

  /**
   * reset LocalStrategy
   *
   * @memberof PassportService
   */
  resetLocalStrategy() {
    logger.debug('LocalStrategy: reset');
    passport.unuse('local');
    this.isLocalStrategySetup = false;
  }

  /**
   * setup LocalStrategy
   *
   * @memberof PassportService
   */
  setupLocalStrategy() {

    this.resetLocalStrategy();

    const { configManager } = this.crowi;

    const isEnabled = configManager.getConfig('crowi', 'security:passport-local:isEnabled');

    // when disabled
    if (!isEnabled) {
      return;
    }

    logger.debug('LocalStrategy: setting up..');

    const User = this.crowi.model('User');

    passport.use(new LocalStrategy(
      {
        usernameField: PassportService.USERNAME_FIELD,
        passwordField: PassportService.PASSWORD_FIELD,
      },
      (username, password, done) => {
        // find user
        User.findUserByUsernameOrEmail(username, password, (err, user) => {
          if (err) { return done(err) }
          // check existence and password
          if (!user || !user.isPasswordValid(password)) {
            return done(null, false, { message: 'Incorrect credentials.' });
          }
          return done(null, user);
        });
      },
    ));

    this.isLocalStrategySetup = true;
    logger.debug('LocalStrategy: setup is done');
  }

  /**
   * reset LdapStrategy
   *
   * @memberof PassportService
   */
  resetLdapStrategy() {
    logger.debug('LdapStrategy: reset');
    passport.unuse('ldapauth');
    this.isLdapStrategySetup = false;
  }

  /**
   * Asynchronous configuration retrieval
   *
   * @memberof PassportService
   */
  setupLdapStrategy() {

    this.resetLdapStrategy();

    const config = this.crowi.config;
    const { configManager } = this.crowi;

    const isLdapEnabled = configManager.getConfig('crowi', 'security:passport-ldap:isEnabled');

    // when disabled
    if (!isLdapEnabled) {
      return;
    }

    logger.debug('LdapStrategy: setting up..');

    passport.use(new LdapStrategy(this.getLdapConfigurationFunc(config, { passReqToCallback: true }),
      (req, ldapAccountInfo, done) => {
        logger.debug('LDAP authentication has succeeded', ldapAccountInfo);

        // store ldapAccountInfo to req
        req.ldapAccountInfo = ldapAccountInfo;

        done(null, ldapAccountInfo);
      }));

    this.isLdapStrategySetup = true;
    logger.debug('LdapStrategy: setup is done');
  }

  /**
   * return attribute name for mapping to username of Crowi DB
   *
   * @returns
   * @memberof PassportService
   */
  getLdapAttrNameMappedToUsername() {
    return this.crowi.configManager.getConfig('crowi', 'security:passport-ldap:attrMapUsername') || 'uid';
  }

  /**
   * return attribute name for mapping to name of Crowi DB
   *
   * @returns
   * @memberof PassportService
   */
  getLdapAttrNameMappedToName() {
    return this.crowi.configManager.getConfig('crowi', 'security:passport-ldap:attrMapName') || '';
  }

  /**
   * return attribute name for mapping to name of Crowi DB
   *
   * @returns
   * @memberof PassportService
   */
  getLdapAttrNameMappedToMail() {
    return this.crowi.configManager.getConfig('crowi', 'security:passport-ldap:attrMapMail') || 'mail';
  }

  /**
   * CAUTION: this method is capable to use only when `req.body.loginForm` is not null
   *
   * @param {any} req
   * @returns
   * @memberof PassportService
   */
  getLdapAccountIdFromReq(req) {
    return req.body.loginForm.username;
  }

  /**
   * Asynchronous configuration retrieval
   * @see https://github.com/vesse/passport-ldapauth#asynchronous-configuration-retrieval
   *
   * @param {object} config
   * @param {object} opts
   * @returns
   * @memberof PassportService
   */
  getLdapConfigurationFunc(config, opts) {
    /* eslint-disable no-multi-spaces */
    const { configManager } = this.crowi;

    // get configurations
    const isUserBind          = configManager.getConfig('crowi', 'security:passport-ldap:isUserBind');
    const serverUrl           = configManager.getConfig('crowi', 'security:passport-ldap:serverUrl');
    const bindDN              = configManager.getConfig('crowi', 'security:passport-ldap:bindDN');
    const bindCredentials     = configManager.getConfig('crowi', 'security:passport-ldap:bindDNPassword');
    const searchFilter        = configManager.getConfig('crowi', 'security:passport-ldap:searchFilter') || '(uid={{username}})';
    const groupSearchBase     = configManager.getConfig('crowi', 'security:passport-ldap:groupSearchBase');
    const groupSearchFilter   = configManager.getConfig('crowi', 'security:passport-ldap:groupSearchFilter');
    const groupDnProperty     = configManager.getConfig('crowi', 'security:passport-ldap:groupDnProperty') || 'uid';
    /* eslint-enable no-multi-spaces */

    // parse serverUrl
    // see: https://regex101.com/r/0tuYBB/1
    const match = serverUrl.match(/(ldaps?:\/\/[^/]+)\/(.*)?/);
    if (match == null || match.length < 1) {
      logger.debug('LdapStrategy: serverUrl is invalid');
      return (req, callback) => { callback({ message: 'serverUrl is invalid' }) };
    }
    const url = match[1];
    const searchBase = match[2] || '';

    logger.debug(`LdapStrategy: url=${url}`);
    logger.debug(`LdapStrategy: searchBase=${searchBase}`);
    logger.debug(`LdapStrategy: isUserBind=${isUserBind}`);
    if (!isUserBind) {
      logger.debug(`LdapStrategy: bindDN=${bindDN}`);
      logger.debug(`LdapStrategy: bindCredentials=${bindCredentials}`);
    }
    logger.debug(`LdapStrategy: searchFilter=${searchFilter}`);
    logger.debug(`LdapStrategy: groupSearchBase=${groupSearchBase}`);
    logger.debug(`LdapStrategy: groupSearchFilter=${groupSearchFilter}`);
    logger.debug(`LdapStrategy: groupDnProperty=${groupDnProperty}`);

    return (req, callback) => {
      // get credentials from form data
      const loginForm = req.body.loginForm;
      if (!req.form.isValid) {
        return callback({ message: 'Incorrect credentials.' });
      }

      // user bind
      const fixedBindDN = (isUserBind)
        ? bindDN.replace(/{{username}}/, loginForm.username)
        : bindDN;
      const fixedBindCredentials = (isUserBind) ? loginForm.password : bindCredentials;
      let serverOpt = {
        url,
        bindDN: fixedBindDN,
        bindCredentials: fixedBindCredentials,
        searchBase,
        searchFilter,
        attrMapUsername: this.getLdapAttrNameMappedToUsername(),
        attrMapName: this.getLdapAttrNameMappedToName(),
      };

      if (groupSearchBase && groupSearchFilter) {
        serverOpt = Object.assign(serverOpt, { groupSearchBase, groupSearchFilter, groupDnProperty });
      }

      process.nextTick(() => {
        const mergedOpts = Object.assign({
          usernameField: PassportService.USERNAME_FIELD,
          passwordField: PassportService.PASSWORD_FIELD,
          server: serverOpt,
        }, opts);
        logger.debug('ldap configuration: ', mergedOpts);

        // store configuration to req
        req.ldapConfiguration = mergedOpts;

        callback(null, mergedOpts);
      });
    };
  }

  /**
   * Asynchronous configuration retrieval
   *
   * @memberof PassportService
   */
  setupGoogleStrategy() {

    this.resetGoogleStrategy();

    const { configManager } = this.crowi;
    const isGoogleEnabled = configManager.getConfig('crowi', 'security:passport-google:isEnabled');

    // when disabled
    if (!isGoogleEnabled) {
      return;
    }

    logger.debug('GoogleStrategy: setting up..');
    passport.use(
      new GoogleStrategy(
        {
          clientID: configManager.getConfig('crowi', 'security:passport-google:clientId'),
          clientSecret: configManager.getConfig('crowi', 'security:passport-google:clientSecret'),
          callbackURL: (this.crowi.appService.getSiteUrl() != null)
            ? urljoin(this.crowi.appService.getSiteUrl(), '/passport/google/callback') // auto-generated with v3.2.4 and above
            : configManager.getConfig('crowi', 'security:passport-google:callbackUrl'), // DEPRECATED: backward compatible with v3.2.3 and below
          skipUserProfile: false,
        },
        (accessToken, refreshToken, profile, done) => {
          if (profile) {
            return done(null, profile);
          }

          return done(null, false);
        },
      ),
    );

    this.isGoogleStrategySetup = true;
    logger.debug('GoogleStrategy: setup is done');
  }

  /**
   * reset GoogleStrategy
   *
   * @memberof PassportService
   */
  resetGoogleStrategy() {
    logger.debug('GoogleStrategy: reset');
    passport.unuse('google');
    this.isGoogleStrategySetup = false;
  }

  setupGitHubStrategy() {

    this.resetGitHubStrategy();

    const { configManager } = this.crowi;
    const isGitHubEnabled = configManager.getConfig('crowi', 'security:passport-github:isEnabled');

    // when disabled
    if (!isGitHubEnabled) {
      return;
    }

    logger.debug('GitHubStrategy: setting up..');
    passport.use(
      new GitHubStrategy(
        {
          clientID: configManager.getConfig('crowi', 'security:passport-github:clientId'),
          clientSecret: configManager.getConfig('crowi', 'security:passport-github:clientSecret'),
          callbackURL: (this.crowi.appService.getSiteUrl() != null)
            ? urljoin(this.crowi.appService.getSiteUrl(), '/passport/github/callback') // auto-generated with v3.2.4 and above
            : configManager.getConfig('crowi', 'security:passport-github:callbackUrl'), // DEPRECATED: backward compatible with v3.2.3 and below
          skipUserProfile: false,
        },
        (accessToken, refreshToken, profile, done) => {
          if (profile) {
            return done(null, profile);
          }

          return done(null, false);
        },
      ),
    );

    this.isGitHubStrategySetup = true;
    logger.debug('GitHubStrategy: setup is done');
  }

  /**
   * reset GitHubStrategy
   *
   * @memberof PassportService
   */
  resetGitHubStrategy() {
    logger.debug('GitHubStrategy: reset');
    passport.unuse('github');
    this.isGitHubStrategySetup = false;
  }

  setupTwitterStrategy() {

    this.resetTwitterStrategy();

    const { configManager } = this.crowi;
    const isTwitterEnabled = configManager.getConfig('crowi', 'security:passport-twitter:isEnabled');

    // when disabled
    if (!isTwitterEnabled) {
      return;
    }

    logger.debug('TwitterStrategy: setting up..');
    passport.use(
      new TwitterStrategy(
        {
          consumerKey: configManager.getConfig('crowi', 'security:passport-twitter:consumerKey'),
          consumerSecret: configManager.getConfig('crowi', 'security:passport-twitter:consumerSecret'),
          callbackURL: (this.crowi.appService.getSiteUrl() != null)
            ? urljoin(this.crowi.appService.getSiteUrl(), '/passport/twitter/callback') // auto-generated with v3.2.4 and above
            : configManager.getConfig('crowi', 'security:passport-twitter:callbackUrl'), // DEPRECATED: backward compatible with v3.2.3 and below
          skipUserProfile: false,
        },
        (accessToken, refreshToken, profile, done) => {
          if (profile) {
            return done(null, profile);
          }

          return done(null, false);
        },
      ),
    );

    this.isTwitterStrategySetup = true;
    logger.debug('TwitterStrategy: setup is done');
  }

  /**
   * reset TwitterStrategy
   *
   * @memberof PassportService
   */
  resetTwitterStrategy() {
    logger.debug('TwitterStrategy: reset');
    passport.unuse('twitter');
    this.isTwitterStrategySetup = false;
  }

  async setupOidcStrategy() {

    this.resetOidcStrategy();

    const { configManager } = this.crowi;
    const isOidcEnabled = configManager.getConfig('crowi', 'security:passport-oidc:isEnabled');

    // when disabled
    if (!isOidcEnabled) {
      return;
    }

    logger.debug('OidcStrategy: setting up..');

    // setup client
    // extend oidc request timeouts
    OIDCIssuer.defaultHttpOptions = { timeout: 5000 };
    const issuerHost = configManager.getConfig('crowi', 'security:passport-oidc:issuerHost');
    const clientId = configManager.getConfig('crowi', 'security:passport-oidc:clientId');
    const clientSecret = configManager.getConfig('crowi', 'security:passport-oidc:clientSecret');
    const redirectUri = (configManager.getConfig('crowi', 'app:siteUrl') != null)
      ? urljoin(this.crowi.appService.getSiteUrl(), '/passport/oidc/callback')
      : configManager.getConfig('crowi', 'security:passport-oidc:callbackUrl'); // DEPRECATED: backward compatible with v3.2.3 and below
    const oidcIssuer = await OIDCIssuer.discover(issuerHost);
    logger.debug('Discovered issuer %s %O', oidcIssuer.issuer, oidcIssuer.metadata);

    const authorizationEndpoint = configManager.getConfig('crowi', 'security:passport-oidc:authorizationEndpoint');
    if (authorizationEndpoint) {
      oidcIssuer.metadata.authorization_endpoint = authorizationEndpoint;
    }
    const tokenEndpoint = configManager.getConfig('crowi', 'security:passport-oidc:tokenEndpoint');
    if (tokenEndpoint) {
      oidcIssuer.metadata.token_endpoint = tokenEndpoint;
    }
    const revocationEndpoint = configManager.getConfig('crowi', 'security:passport-oidc:revocationEndpoint');
    if (revocationEndpoint) {
      oidcIssuer.metadata.revocation_endpoint = revocationEndpoint;
    }
    const introspectionEndpoint = configManager.getConfig('crowi', 'security:passport-oidc:introspectionEndpoint');
    if (introspectionEndpoint) {
      oidcIssuer.metadata.introspection_endpoint = introspectionEndpoint;
    }
    const userInfoEndpoint = configManager.getConfig('crowi', 'security:passport-oidc:userInfoEndpoint');
    if (userInfoEndpoint) {
      oidcIssuer.metadata.userinfo_endpoint = userInfoEndpoint;
    }
    const endSessionEndpoint = configManager.getConfig('crowi', 'security:passport-oidc:endSessionEndpoint');
    if (endSessionEndpoint) {
      oidcIssuer.metadata.end_session_endpoint = endSessionEndpoint;
    }
    const registrationEndpoint = configManager.getConfig('crowi', 'security:passport-oidc:registrationEndpoint');
    if (registrationEndpoint) {
      oidcIssuer.metadata.registration_endpoint = registrationEndpoint;
    }
    const jwksUri = configManager.getConfig('crowi', 'security:passport-oidc:jwksUri');
    if (jwksUri) {
      oidcIssuer.metadata.jwks_uri = jwksUri;
    }
    logger.debug('Configured issuer %s %O', oidcIssuer.issuer, oidcIssuer.metadata);

    const client = new oidcIssuer.Client({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris: [redirectUri],
      response_types: ['code'],
    });

    passport.use('oidc', new OidcStrategy({
      client,
      params: { scope: 'openid email profile' },
    },
    ((tokenset, userinfo, done) => {
      if (userinfo) {
        return done(null, userinfo);
      }

      return done(null, false);

    })));

    this.isOidcStrategySetup = true;
    logger.debug('OidcStrategy: setup is done');
  }

  /**
   * reset OidcStrategy
   *
   * @memberof PassportService
   */
  resetOidcStrategy() {
    logger.debug('OidcStrategy: reset');
    passport.unuse('oidc');
    this.isOidcStrategySetup = false;
  }

  setupSamlStrategy() {

    this.resetSamlStrategy();

    const { configManager } = this.crowi;
    const isSamlEnabled = configManager.getConfig('crowi', 'security:passport-saml:isEnabled');

    // when disabled
    if (!isSamlEnabled) {
      return;
    }

    logger.debug('SamlStrategy: setting up..');
    passport.use(
      new SamlStrategy(
        {
          entryPoint: configManager.getConfig('crowi', 'security:passport-saml:entryPoint'),
          callbackUrl: (this.crowi.appService.getSiteUrl() != null)
            ? urljoin(this.crowi.appService.getSiteUrl(), '/passport/saml/callback') // auto-generated with v3.2.4 and above
            : configManager.getConfig('crowi', 'security:passport-saml:callbackUrl'), // DEPRECATED: backward compatible with v3.2.3 and below
          issuer: configManager.getConfig('crowi', 'security:passport-saml:issuer'),
          cert: configManager.getConfig('crowi', 'security:passport-saml:cert'),
        },
        (profile, done) => {
          if (profile) {
            return done(null, profile);
          }

          return done(null, false);
        },
      ),
    );

    this.isSamlStrategySetup = true;
    logger.debug('SamlStrategy: setup is done');
  }

  /**
   * reset SamlStrategy
   *
   * @memberof PassportService
   */
  resetSamlStrategy() {
    logger.debug('SamlStrategy: reset');
    passport.unuse('saml');
    this.isSamlStrategySetup = false;
  }

  /**
   * return the keys of the configs mandatory for SAML whose value are empty.
   */
  getSamlMissingMandatoryConfigKeys() {
    const missingRequireds = [];
    for (const key of this.mandatoryConfigKeysForSaml) {
      if (this.crowi.configManager.getConfig('crowi', key) === null) {
        missingRequireds.push(key);
      }
    }
    return missingRequireds;
  }

  /**
   * Parse Attribute-Based Login Control Rule as Lucene Query
   * @param {string} rule Lucene syntax string
   * @returns {object} Expression Tree Structure generated by lucene-query-parser
   * @see https://github.com/thoward/lucene-query-parser.js/wiki
   */
  parseABLCRule(rule) {
    // parse with lucene-query-parser
    // see https://github.com/thoward/lucene-query-parser.js/wiki
    return luceneQueryParser.parse(rule);
  }

  /**
   * Verify that a SAML response meets the attribute-base login control rule
   */
  verifySAMLResponseByABLCRule(response) {
    const rule = this.crowi.configManager.getConfig('crowi', 'security:passport-saml:ABLCRule');
    if (rule == null) {
      logger.debug('There is no ABLCRule.');
      return true;
    }

    const luceneRule = this.parseABLCRule(rule);
    logger.debug({ 'Parsed Rule': JSON.stringify(luceneRule, null, 2) });

    const attributes = this.extractAttributesFromSAMLResponse(response);
    logger.debug({ 'Extracted Attributes': JSON.stringify(attributes, null, 2) });

    return this.evaluateRuleForSamlAttributes(attributes, luceneRule);
  }

  /**
   * Evaluate whether the specified rule is satisfied under the specified attributes
   *
   * @param {object} attributes results by extractAttributesFromSAMLResponse
   * @param {object} luceneRule Expression Tree Structure generated by lucene-query-parser
   * @see https://github.com/thoward/lucene-query-parser.js/wiki
   */
  evaluateRuleForSamlAttributes(attributes, luceneRule) {
    const { left, right, operator } = luceneRule;

    // when combined rules
    if (right != null) {
      return this.evaluateCombinedRulesForSamlAttributes(attributes, left, right, operator);
    }
    if (left != null) {
      return this.evaluateRuleForSamlAttributes(attributes, left);
    }

    const { field, term } = luceneRule;
    if (field === '<implicit>') {
      return attributes[term] != null;
    }

    if (attributes[field] == null) {
      return false;
    }

    return attributes[field].includes(term);
  }

  /**
   * Evaluate whether the specified two rules are satisfied under the specified attributes
   *
   * @param {object} attributes results by extractAttributesFromSAMLResponse
   * @param {object} luceneRuleLeft Expression Tree Structure generated by lucene-query-parser
   * @param {object} luceneRuleRight Expression Tree Structure generated by lucene-query-parser
   * @param {string} luceneOperator operator string expression
   * @see https://github.com/thoward/lucene-query-parser.js/wiki
   */
  evaluateCombinedRulesForSamlAttributes(attributes, luceneRuleLeft, luceneRuleRight, luceneOperator) {
    if (luceneOperator === 'OR') {
      return this.evaluateRuleForSamlAttributes(attributes, luceneRuleLeft) || this.evaluateRuleForSamlAttributes(attributes, luceneRuleRight);
    }
    if (luceneOperator === 'AND') {
      return this.evaluateRuleForSamlAttributes(attributes, luceneRuleLeft) && this.evaluateRuleForSamlAttributes(attributes, luceneRuleRight);
    }
    if (luceneOperator === 'NOT') {
      return this.evaluateRuleForSamlAttributes(attributes, luceneRuleLeft) && !this.evaluateRuleForSamlAttributes(attributes, luceneRuleRight);
    }

    throw new Error(`Unsupported operator: ${luceneOperator}`);
  }

  /**
   * Extract attributes from a SAML response
   *
   * The format of extracted attributes is the following.
   *
   * {
   *    "attribute_name1": ["value1", "value2", ...],
   *    "attribute_name2": ["value1", "value2", ...],
   *    ...
   * }
   */
  extractAttributesFromSAMLResponse(response) {
    const attributeStatement = response.getAssertion().Assertion.AttributeStatement;
    if (attributeStatement == null || attributeStatement[0] == null) {
      return {};
    }

    const attributes = attributeStatement[0].Attribute;
    if (attributes == null) {
      return {};
    }

    const result = {};
    for (const attribute of attributes) {
      const name = attribute.$.Name;
      const attributeValues = attribute.AttributeValue.map(v => v._);
      if (result[name] == null) {
        result[name] = attributeValues;
      }
      else {
        result[name] = result[name].concat(attributeValues);
      }
    }

    return result;
  }

  /**
   * reset BasicStrategy
   *
   * @memberof PassportService
   */
  resetBasicStrategy() {
    logger.debug('BasicStrategy: reset');
    passport.unuse('basic');
    this.isBasicStrategySetup = false;
  }

  /**
   * setup BasicStrategy
   *
   * @memberof PassportService
   */
  setupBasicStrategy() {

    this.resetBasicStrategy();

    const configManager = this.crowi.configManager;
    const isBasicEnabled = configManager.getConfig('crowi', 'security:passport-basic:isEnabled');

    // when disabled
    if (!isBasicEnabled) {
      return;
    }

    logger.debug('BasicStrategy: setting up..');

    passport.use(new BasicStrategy(
      (userId, password, done) => {
        if (userId != null) {
          return done(null, userId);
        }
        return done(null, false, { message: 'Incorrect credentials.' });
      },
    ));

    this.isBasicStrategySetup = true;
    logger.debug('BasicStrategy: setup is done');
  }

  /**
   * setup serializer and deserializer
   *
   * @memberof PassportService
   */
  setupSerializer() {
    // check whether the serializer/deserializer have already been set up
    if (this.isSerializerSetup) {
      throw new Error('serializer/deserializer have already been set up');
    }

    logger.debug('setting up serializer and deserializer');

    const User = this.crowi.model('User');

    passport.serializeUser((user, done) => {
      done(null, user.id);
    });
    passport.deserializeUser(async(id, done) => {
      try {
        const user = await User.findById(id);
        if (user == null) {
          throw new Error('user not found');
        }
        if (user.imageUrlCached == null) {
          await user.updateImageUrlCached();
          await user.save();
        }
        done(null, user);
      }
      catch (err) {
        done(err);
      }
    });

    this.isSerializerSetup = true;
  }

  isSameUsernameTreatedAsIdenticalUser(providerType) {
    const key = `security:passport-${providerType}:isSameUsernameTreatedAsIdenticalUser`;
    return this.crowi.configManager.getConfig('crowi', key);
  }

  isSameEmailTreatedAsIdenticalUser(providerType) {
    const key = `security:passport-${providerType}:isSameEmailTreatedAsIdenticalUser`;
    return this.crowi.configManager.getConfig('crowi', key);
  }

}

module.exports = PassportService;
