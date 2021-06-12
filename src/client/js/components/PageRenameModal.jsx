import React, {
  useState, useEffect, useCallback,
} from 'react';
import PropTypes from 'prop-types';

import {
  Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap';

import { withTranslation } from 'react-i18next';

import { debounce } from 'throttle-debounce';
import { withUnstatedContainers } from './UnstatedUtils';
import { toastError } from '../util/apiNotification';

import AppContainer from '../services/AppContainer';
import PageContainer from '../services/PageContainer';
import ApiErrorMessageList from './PageManagement/ApiErrorMessageList';
import ComparePathsTable from './ComparePathsTable';
import DuplicatedPathsTable from './DuplicatedPathsTable';


const PageRenameModal = (props) => {
  const {
    t, appContainer, pageContainer,
  } = props;

  const { path } = pageContainer.state;

  const { crowi } = appContainer.config;

  const [pageNameInput, setPageNameInput] = useState(path);

  const [errs, setErrs] = useState(null);

  const [subordinatedPages, setSubordinatedPages] = useState([]);
  const [existingPaths, setExistingPaths] = useState([]);
  const [isRenameRecursively, SetIsRenameRecursively] = useState(true);
  const [isRenameRedirect, SetIsRenameRedirect] = useState(false);
  const [isRenameMetadata, SetIsRenameMetadata] = useState(false);
  const [subordinatedError] = useState(null);
  const [isRenameRecursivelyWithoutExistPath, setIsRenameRecursivelyWithoutExistPath] = useState(true);

  function changeIsRenameRecursivelyHandler() {
    SetIsRenameRecursively(!isRenameRecursively);
  }

  function changeIsRenameRecursivelyWithoutExistPathHandler() {
    setIsRenameRecursivelyWithoutExistPath(!isRenameRecursivelyWithoutExistPath);
  }

  function changeIsRenameRedirectHandler() {
    SetIsRenameRedirect(!isRenameRedirect);
  }

  function changeIsRenameMetadataHandler() {
    SetIsRenameMetadata(!isRenameMetadata);
  }

  const updateSubordinatedList = useCallback(async() => {
    try {
      const res = await appContainer.apiv3Get('/pages/subordinated-list', { path });
      const { subordinatedPaths } = res.data;
      setSubordinatedPages(subordinatedPaths);
    }
    catch (err) {
      setErrs(err);
      toastError(t('modal_rename.label.Fail to get subordinated pages'));
    }
  }, [appContainer, path, t]);

  useEffect(() => {
    if (props.isOpen) {
      updateSubordinatedList();
    }
  }, [props.isOpen, updateSubordinatedList]);


  const checkExistPaths = async(newParentPath) => {
    try {
      const res = await appContainer.apiv3Get('/page/exist-paths', { fromPath: path, toPath: newParentPath });
      const { existPaths } = res.data;
      setExistingPaths(existPaths);
    }
    catch (err) {
      setErrs(err);
      toastError(t('modal_rename.label.Fail to get exist path'));
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkExistPathsDebounce = useCallback(
    debounce(1000, checkExistPaths), [],
  );

  useEffect(() => {
    if (pageNameInput !== path) {
      checkExistPathsDebounce(pageNameInput, subordinatedPages);
    }
  }, [pageNameInput, subordinatedPages, path, checkExistPathsDebounce]);

  /**
   * change pageNameInput
   * @param {string} value
   */
  function inputChangeHandler(value) {
    setErrs(null);
    setPageNameInput(value);
  }

  async function rename() {
    setErrs(null);

    try {
      const response = await pageContainer.rename(
        pageNameInput,
        isRenameRecursively,
        isRenameRedirect,
        isRenameMetadata,
      );

      const { page } = response.data;
      const url = new URL(page.path, 'https://dummy');
      url.searchParams.append('renamedFrom', path);
      if (isRenameRedirect) {
        url.searchParams.append('withRedirect', true);
      }

      window.location.href = `${url.pathname}${url.search}`;
    }
    catch (err) {
      setErrs(err);
    }
  }

  return (
    <Modal size="lg" isOpen={props.isOpen} toggle={props.onClose} autoFocus={false}>
      <ModalHeader tag="h4" toggle={props.onClose} className="bg-primary text-light">
        { t('modal_rename.label.Move/Rename page') }
      </ModalHeader>
      <ModalBody>
        <div className="form-group">
          <label>{ t('modal_rename.label.Current page name') }</label><br />
          <code>{ path }</code>
        </div>
        <div className="form-group">
          <label htmlFor="newPageName">{ t('modal_rename.label.New page name') }</label><br />
          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text">{crowi.url}</span>
            </div>
            <form className="flex-fill" onSubmit={(e) => { e.preventDefault(); rename() }}>
              <input
                type="text"
                value={pageNameInput}
                className="form-control"
                onChange={e => inputChangeHandler(e.target.value)}
                required
                autoFocus
              />
            </form>
          </div>
        </div>
        <div className="custom-control custom-checkbox custom-checkbox-warning">
          <input
            className="custom-control-input"
            name="recursively"
            id="cbRenameRecursively"
            type="checkbox"
            checked={isRenameRecursively}
            onChange={changeIsRenameRecursivelyHandler}
          />
          <label className="custom-control-label" htmlFor="cbRenameRecursively">
            { t('modal_rename.label.Recursively') }
            <p className="form-text text-muted mt-0">{ t('modal_rename.help.recursive') }</p>
          </label>
          {existingPaths.length !== 0 && (
          <div
            className="custom-control custom-checkbox custom-checkbox-warning"
            style={{ display: isRenameRecursively ? '' : 'none' }}
          >
            <input
              className="custom-control-input"
              name="withoutExistRecursively"
              id="cbRenamewithoutExistRecursively"
              type="checkbox"
              checked={isRenameRecursivelyWithoutExistPath}
              onChange={changeIsRenameRecursivelyWithoutExistPathHandler}
            />
            <label className="custom-control-label" htmlFor="cbRenamewithoutExistRecursively">
              { t('modal_rename.label.Rename without exist path') }
            </label>
          </div>
          )}
          {isRenameRecursively && <ComparePathsTable subordinatedPages={subordinatedPages} newPagePath={pageNameInput} />}
          {isRenameRecursively && existingPaths.length !== 0 && <DuplicatedPathsTable existingPaths={existingPaths} oldPagePath={pageNameInput} />}
        </div>

        <div className="custom-control custom-checkbox custom-checkbox-success">
          <input
            className="custom-control-input"
            name="create_redirect"
            id="cbRenameRedirect"
            type="checkbox"
            checked={isRenameRedirect}
            onChange={changeIsRenameRedirectHandler}
          />
          <label className="custom-control-label" htmlFor="cbRenameRedirect">
            { t('modal_rename.label.Redirect') }
            <p className="form-text text-muted mt-0">{ t('modal_rename.help.redirect') }</p>
          </label>
        </div>

        <div className="custom-control custom-checkbox custom-checkbox-primary">
          <input
            className="custom-control-input"
            name="remain_metadata"
            id="cbRenameMetadata"
            type="checkbox"
            checked={isRenameMetadata}
            onChange={changeIsRenameMetadataHandler}
          />
          <label className="custom-control-label" htmlFor="cbRenameMetadata">
            { t('modal_rename.label.Do not update metadata') }
            <p className="form-text text-muted mt-0">{ t('modal_rename.help.metadata') }</p>
          </label>
        </div>
        <div> {subordinatedError} </div>
      </ModalBody>
      <ModalFooter>
        <ApiErrorMessageList errs={errs} targetPath={pageNameInput} />
        <button
          type="button"
          className="btn btn-primary"
          onClick={rename}
          disabled={(isRenameRecursively && !isRenameRecursivelyWithoutExistPath && existingPaths.length !== 0)}
        >Rename
        </button>
      </ModalFooter>
    </Modal>
  );
};

/**
 * Wrapper component for using unstated
 */
const PageRenameModalWrapper = withUnstatedContainers(PageRenameModal, [AppContainer, PageContainer]);


PageRenameModal.propTypes = {
  t: PropTypes.func.isRequired, //  i18next
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  pageContainer: PropTypes.instanceOf(PageContainer).isRequired,

  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,

  path: PropTypes.string.isRequired,
};

export default withTranslation()(PageRenameModalWrapper);
