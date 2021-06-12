import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap';

import { withTranslation } from 'react-i18next';
import { withUnstatedContainers } from './UnstatedUtils';

import SocketIoContainer from '../services/SocketIoContainer';
import AppContainer from '../services/AppContainer';
import ApiErrorMessageList from './PageManagement/ApiErrorMessageList';

const EmptyTrashModal = (props) => {
  const {
    t, isOpen, onClose, appContainer, socketIoContainer,
  } = props;

  const [errs, setErrs] = useState(null);

  async function emptyTrash() {
    setErrs(null);

    try {
      await appContainer.apiv3Delete('/pages/empty-trash', { socketClientId: socketIoContainer.getSocketClientId() });
      window.location.reload();
    }
    catch (err) {
      setErrs(err);
    }
  }

  function emptyButtonHandler() {
    emptyTrash();
  }

  return (
    <Modal isOpen={isOpen} toggle={onClose} className="grw-create-page">
      <ModalHeader tag="h4" toggle={onClose} className="bg-danger text-light">
        { t('modal_empty.empty_the_trash')}
      </ModalHeader>
      <ModalBody>
        { t('modal_empty.notice')}
      </ModalBody>
      <ModalFooter>
        <ApiErrorMessageList errs={errs} />
        <button type="button" className="btn btn-danger" onClick={emptyButtonHandler}>
          <i className="icon-trash mr-2" aria-hidden="true"></i> Empty
        </button>
      </ModalFooter>
    </Modal>
  );
};

/**
 * Wrapper component for using unstated
 */
const EmptyTrashModalWrapper = withUnstatedContainers(EmptyTrashModal, [AppContainer, SocketIoContainer]);


EmptyTrashModal.propTypes = {
  t: PropTypes.func.isRequired, //  i18next
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  socketIoContainer: PropTypes.instanceOf(SocketIoContainer),

  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default withTranslation()(EmptyTrashModalWrapper);
