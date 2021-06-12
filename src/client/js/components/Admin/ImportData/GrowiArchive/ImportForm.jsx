import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import GrowiArchiveImportOption from '@commons/models/admin/growi-archive-import-option';
import ImportOptionForPages from '@commons/models/admin/import-option-for-pages';
import ImportOptionForRevisions from '@commons/models/admin/import-option-for-revisions';

import { withUnstatedContainers } from '../../../UnstatedUtils';
import AppContainer from '../../../../services/AppContainer';
import AdminSocketIoContainer from '../../../../services/AdminSocketIoContainer';
import { toastSuccess, toastError } from '../../../../util/apiNotification';


import ImportCollectionItem, { DEFAULT_MODE, MODE_RESTRICTED_COLLECTION } from './ImportCollectionItem';
import ImportCollectionConfigurationModal from './ImportCollectionConfigurationModal';
import ErrorViewer from './ErrorViewer';


const GROUPS_PAGE = [
  'pages', 'revisions', 'tags', 'pagetagrelations',
];
const GROUPS_USER = [
  'users', 'externalaccounts', 'usergroups', 'usergrouprelations',
];
const GROUPS_CONFIG = [
  'configs', 'updateposts', 'globalnotificationsettings',
];
const ALL_GROUPED_COLLECTIONS = GROUPS_PAGE.concat(GROUPS_USER).concat(GROUPS_CONFIG);

const IMPORT_OPTION_CLASS_MAPPING = {
  pages: ImportOptionForPages,
  revisions: ImportOptionForRevisions,
};

class ImportForm extends React.Component {

  constructor(props) {
    super(props);

    this.initialState = {
      isImporting: false,
      isImported: false,
      progressMap: [],
      errorsMap: [],

      selectedCollections: new Set(),

      // store relations from collection name to file name
      collectionNameToFileNameMap: {},
      // store relations from collection name to GrowiArchiveImportOption instance
      optionsMap: {},

      isConfigurationModalOpen: false,
      collectionNameForConfiguration: null,

      isErrorsViewerOpen: false,
      collectionNameForErrorsViewer: null,

      canImport: false,
      warnForPageGroups: [],
      warnForUserGroups: [],
      warnForConfigGroups: [],
      warnForOtherGroups: [],
    };

    this.props.innerFileStats.forEach((fileStat) => {
      const { fileName, collectionName } = fileStat;
      this.initialState.collectionNameToFileNameMap[collectionName] = fileName;

      // determine initial mode
      const initialMode = (MODE_RESTRICTED_COLLECTION[collectionName] != null)
        ? MODE_RESTRICTED_COLLECTION[collectionName][0]
        : DEFAULT_MODE;
      // create GrowiArchiveImportOption instance
      const ImportOption = IMPORT_OPTION_CLASS_MAPPING[collectionName] || GrowiArchiveImportOption;
      this.initialState.optionsMap[collectionName] = new ImportOption(initialMode);
    });

    this.state = this.initialState;

    this.toggleCheckbox = this.toggleCheckbox.bind(this);
    this.checkAll = this.checkAll.bind(this);
    this.uncheckAll = this.uncheckAll.bind(this);
    this.updateOption = this.updateOption.bind(this);
    this.openConfigurationModal = this.openConfigurationModal.bind(this);
    this.showErrorsViewer = this.showErrorsViewer.bind(this);
    this.validate = this.validate.bind(this);
    this.import = this.import.bind(this);
  }

  get allCollectionNames() {
    return Object.keys(this.state.collectionNameToFileNameMap);
  }

  componentWillMount() {
    this.setupWebsocketEventHandler();
  }

  componentWillUnmount() {
    this.teardownWebsocketEventHandler();
  }

  setupWebsocketEventHandler() {
    const socket = this.props.adminSocketIoContainer.getSocket();

    // websocket event
    // eslint-disable-next-line object-curly-newline
    socket.on('admin:onProgressForImport', ({ collectionName, collectionProgress, appendedErrors }) => {
      const { progressMap, errorsMap } = this.state;
      progressMap[collectionName] = collectionProgress;

      const errors = errorsMap[collectionName] || [];
      errorsMap[collectionName] = errors.concat(appendedErrors);

      this.setState({
        isImporting: true,
        progressMap,
        errorsMap,
      });
    });

    // websocket event
    socket.on('admin:onTerminateForImport', () => {
      this.setState({
        isImporting: false,
        isImported: true,
      });

      toastSuccess(undefined, 'Import process has completed.');
    });

    // websocket event
    socket.on('admin:onErrorForImport', (err) => {
      this.setState({
        isImporting: false,
        isImported: false,
      });

      toastError(err, 'Import process has failed.');
    });
  }

  teardownWebsocketEventHandler() {
    const socket = this.props.adminSocketIoContainer.getSocket();

    socket.removeAllListeners('admin:onProgressForImport');
    socket.removeAllListeners('admin:onTerminateForImport');
  }

  async toggleCheckbox(collectionName, bool) {
    const selectedCollections = new Set(this.state.selectedCollections);
    if (bool) {
      selectedCollections.add(collectionName);
    }
    else {
      selectedCollections.delete(collectionName);
    }

    await this.setState({ selectedCollections });

    this.validate();
  }

  async checkAll() {
    await this.setState({ selectedCollections: new Set(this.allCollectionNames) });
    this.validate();
  }

  async uncheckAll() {
    await this.setState({ selectedCollections: new Set() });
    this.validate();
  }

  updateOption(collectionName, data) {
    const { optionsMap } = this.state;
    const options = optionsMap[collectionName];

    // merge
    Object.assign(options, data);

    optionsMap[collectionName] = options;
    this.setState({ optionsMap });
  }

  openConfigurationModal(collectionName) {
    this.setState({ isConfigurationModalOpen: true, collectionNameForConfiguration: collectionName });
  }

  showErrorsViewer(collectionName) {
    this.setState({ isErrorsViewerOpen: true, collectionNameForErrorsViewer: collectionName });
  }

  async validate() {
    // init errors
    await this.setState({
      warnForPageGroups: [],
      warnForUserGroups: [],
      warnForConfigGroups: [],
      warnForOtherGroups: [],
    });

    await this.validateCollectionSize();
    await this.validatePagesCollectionPairs();
    await this.validateExternalAccounts();
    await this.validateUserGroups();
    await this.validateUserGroupRelations();

    const errors = [
      ...this.state.warnForPageGroups,
      ...this.state.warnForUserGroups,
      ...this.state.warnForConfigGroups,
      ...this.state.warnForOtherGroups,
    ];
    const canImport = errors.length === 0;

    this.setState({ canImport });
  }

  async validateCollectionSize(validationErrors) {
    const { t } = this.props;
    const { warnForOtherGroups, selectedCollections } = this.state;

    if (selectedCollections.size === 0) {
      warnForOtherGroups.push(t('admin:importer_management.growi_settings.errors.at_least_one'));
    }

    this.setState({ warnForOtherGroups });
  }

  async validatePagesCollectionPairs() {
    const { t } = this.props;
    const { warnForPageGroups, selectedCollections } = this.state;

    const pageRelatedCollectionsLength = ['pages', 'revisions'].filter((collectionName) => {
      return selectedCollections.has(collectionName);
    }).length;

    // MUST be included both or neither when importing
    if (pageRelatedCollectionsLength !== 0 && pageRelatedCollectionsLength !== 2) {
      warnForPageGroups.push(t('admin:importer_management.growi_settings.errors.page_and_revision'));
    }

    this.setState({ warnForPageGroups });
  }

  async validateExternalAccounts() {
    const { t } = this.props;
    const { warnForUserGroups, selectedCollections } = this.state;

    // MUST include also 'users' if 'externalaccounts' is selected
    if (selectedCollections.has('externalaccounts')) {
      if (!selectedCollections.has('users')) {
        warnForUserGroups.push(t('admin:importer_management.growi_settings.errors.depends', { target: 'Users', condition: 'Externalaccounts' }));
      }
    }

    this.setState({ warnForUserGroups });
  }

  async validateUserGroups() {
    const { t } = this.props;
    const { warnForUserGroups, selectedCollections } = this.state;

    // MUST include also 'users' if 'usergroups' is selected
    if (selectedCollections.has('usergroups')) {
      if (!selectedCollections.has('users')) {
        warnForUserGroups.push(t('admin:importer_management.growi_settings.errors.depends', { target: 'Users', condition: 'Usergroups' }));
      }
    }

    this.setState({ warnForUserGroups });
  }

  async validateUserGroupRelations() {
    const { t } = this.props;
    const { warnForUserGroups, selectedCollections } = this.state;

    // MUST include also 'usergroups' if 'usergrouprelations' is selected
    if (selectedCollections.has('usergrouprelations')) {
      if (!selectedCollections.has('usergroups')) {
        warnForUserGroups.push(t('admin:importer_management.growi_settings.errors.depends', { target: 'Usergroups', condition: 'Usergrouprelations' }));
      }
    }

    this.setState({ warnForUserGroups });
  }

  async import() {
    const { appContainer, fileName, onPostImport } = this.props;
    const { selectedCollections, optionsMap } = this.state;

    // init progress data
    await this.setState({
      isImporting: true,
      progressMap: [],
      errorsMap: [],
    });

    try {
      // TODO: use appContainer.apiv3.post
      await appContainer.apiv3Post('/import', {
        fileName,
        collections: Array.from(selectedCollections),
        optionsMap,
      });

      if (onPostImport != null) {
        onPostImport();
      }

      toastSuccess(undefined, 'Import process has requested.');
    }
    catch (err) {
      toastError(err, 'Import request failed.');
    }
  }

  renderWarnForGroups(errors, key) {
    if (errors.length === 0) {
      return null;
    }

    return (
      <div key={key} className="alert alert-warning">
        <ul>
          {errors.map((error, index) => {
            // eslint-disable-next-line react/no-array-index-key
            return <li key={`${key}-${index}`}>{error}</li>;
          })}
        </ul>
      </div>
    );
  }

  renderGroups(groupList, groupName, errors) {
    const collectionNames = groupList.filter((collectionName) => {
      return this.allCollectionNames.includes(collectionName);
    });

    if (collectionNames.length === 0) {
      return null;
    }

    return (
      <div className="mt-4">
        <legend>{groupName} Collections</legend>
        {this.renderImportItems(collectionNames)}
        {this.renderWarnForGroups(errors, `warnFor${groupName}`)}
      </div>
    );
  }

  renderOthers() {
    const collectionNames = this.allCollectionNames.filter((collectionName) => {
      return !ALL_GROUPED_COLLECTIONS.includes(collectionName);
    });

    return this.renderGroups(collectionNames, 'Other', this.state.warnForOtherGroups);
  }

  renderImportItems(collectionNames) {
    const {
      isImporting,
      isImported,
      progressMap,
      errorsMap,

      selectedCollections,
      optionsMap,
    } = this.state;

    return (
      <div className="row">
        {collectionNames.map((collectionName) => {
          const collectionProgress = progressMap[collectionName];
          const errors = errorsMap[collectionName];
          const isConfigButtonAvailable = Object.keys(IMPORT_OPTION_CLASS_MAPPING).includes(collectionName);

          return (
            <div className="col-md-6 my-1" key={collectionName}>
              <ImportCollectionItem
                isImporting={isImporting}
                isImported={collectionProgress ? isImported : false}
                insertedCount={collectionProgress ? collectionProgress.insertedCount : 0}
                modifiedCount={collectionProgress ? collectionProgress.modifiedCount : 0}
                errorsCount={errors ? errors.length : 0}

                collectionName={collectionName}
                isSelected={selectedCollections.has(collectionName)}
                option={optionsMap[collectionName]}

                isConfigButtonAvailable={isConfigButtonAvailable}

                onChange={this.toggleCheckbox}
                onOptionChange={this.updateOption}
                onConfigButtonClicked={this.openConfigurationModal}
                onErrorLinkClicked={this.showErrorsViewer}
              />
            </div>
          );
        })}
      </div>
    );
  }

  renderConfigurationModal() {
    const { isConfigurationModalOpen, collectionNameForConfiguration: collectionName, optionsMap } = this.state;

    if (collectionName == null) {
      return null;
    }

    return (
      <ImportCollectionConfigurationModal
        isOpen={isConfigurationModalOpen}
        onClose={() => this.setState({ isConfigurationModalOpen: false })}
        onOptionChange={this.updateOption}
        collectionName={collectionName}
        option={optionsMap[collectionName]}
      />
    );
  }

  renderErrorsViewer() {
    const { isErrorsViewerOpen, errorsMap, collectionNameForErrorsViewer } = this.state;
    const errors = errorsMap[collectionNameForErrorsViewer];

    return (
      <ErrorViewer
        isOpen={isErrorsViewerOpen}
        onClose={() => this.setState({ isErrorsViewerOpen: false })}
        errors={errors}
      />
    );
  }

  render() {
    const { t } = this.props;
    const {
      canImport, isImporting,
      warnForPageGroups, warnForUserGroups, warnForConfigGroups,
    } = this.state;

    return (
      <>
        <form className="form-inline">
          <div className="form-group">
            <button type="button" className="btn btn-sm btn-outline-secondary mr-2" onClick={this.checkAll}>
              <i className="fa fa-check-square-o"></i> {t('admin:export_management.check_all')}
            </button>
          </div>
          <div className="form-group">
            <button type="button" className="btn btn-sm btn-outline-secondary mr-2" onClick={this.uncheckAll}>
              <i className="fa fa-square-o"></i> {t('admin:export_management.uncheck_all')}
            </button>
          </div>
        </form>

        <div className="card well small my-4">
          <ul>
            <li>{t('admin:importer_management.growi_settings.description_of_import_mode.about')}</li>
            <ul>
              <li>{t('admin:importer_management.growi_settings.description_of_import_mode.insert')}</li>
              <li>{t('admin:importer_management.growi_settings.description_of_import_mode.upsert')}</li>
              <li>{t('admin:importer_management.growi_settings.description_of_import_mode.flash_and_insert')}</li>
            </ul>
          </ul>
        </div>

        {this.renderGroups(GROUPS_PAGE, 'Page', warnForPageGroups)}
        {this.renderGroups(GROUPS_USER, 'User', warnForUserGroups)}
        {this.renderGroups(GROUPS_CONFIG, 'Config', warnForConfigGroups)}
        {this.renderOthers()}

        <div className="mt-4 text-center">
          <button type="button" className="btn btn-outline-secondary mx-1" onClick={this.props.onDiscard}>
            {t('admin:importer_management.growi_settings.discard')}
          </button>
          <button type="button" className="btn btn-primary mx-1" onClick={this.import} disabled={!canImport || isImporting}>
            {t('admin:importer_management.import')}
          </button>
        </div>

        {this.renderConfigurationModal()}
        {this.renderErrorsViewer()}
      </>
    );
  }

}

ImportForm.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  adminSocketIoContainer: PropTypes.instanceOf(AdminSocketIoContainer).isRequired,

  fileName: PropTypes.string,
  innerFileStats: PropTypes.arrayOf(PropTypes.object).isRequired,
  onDiscard: PropTypes.func.isRequired,
  onPostImport: PropTypes.func,
};

/**
 * Wrapper component for using unstated
 */
const ImportFormWrapper = withUnstatedContainers(ImportForm, [AppContainer, AdminSocketIoContainer]);

export default withTranslation()(ImportFormWrapper);
