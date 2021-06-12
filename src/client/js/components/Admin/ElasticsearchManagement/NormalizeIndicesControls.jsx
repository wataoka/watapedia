import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import { withUnstatedContainers } from '../../UnstatedUtils';

class NormalizeIndicesControls extends React.PureComponent {

  render() {
    const { t, isNormalized, isRebuildingProcessing } = this.props;

    const isEnabled = (isNormalized != null) && !isNormalized && !isRebuildingProcessing;

    return (
      <>
        <button
          type="submit"
          className={`btn ${isEnabled ? 'btn-outline-info' : 'btn-outline-secondary'}`}
          onClick={() => { this.props.onNormalizingRequested() }}
          disabled={!isEnabled}
        >
          { t('full_text_search_management.normalize_button') }
        </button>

        <p className="form-text text-muted">
          { t('full_text_search_management.normalize_description') }<br />
        </p>
      </>
    );
  }

}

/**
 * Wrapper component for using unstated
 */
const NormalizeIndicesControlsWrapper = withUnstatedContainers(NormalizeIndicesControls, []);

NormalizeIndicesControls.propTypes = {
  t: PropTypes.func.isRequired, // i18next

  isRebuildingProcessing: PropTypes.bool.isRequired,
  onNormalizingRequested: PropTypes.func.isRequired,
  isNormalized: PropTypes.bool,
};

export default withTranslation()(NormalizeIndicesControlsWrapper);
