import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

const TriggerEventCheckBox = (props) => {
  const { t } = props;

  return (
    <div className={`custom-control custom-checkbox custom-checkbox-${props.checkbox}`}>
      <input
        className="custom-control-input"
        type="checkbox"
        id={`trigger-event-${props.event}`}
        checked={props.checked}
        onChange={props.onChange}
      />
      <label className="custom-control-label" htmlFor={`trigger-event-${props.event}`}>
        {props.children}{' '}
        {t(`notification_setting.event_${props.event}`)}
      </label>
    </div>
  );
};


TriggerEventCheckBox.propTypes = {
  t: PropTypes.func.isRequired, // i18next

  checkbox: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  event: PropTypes.string.isRequired,
  children: PropTypes.object.isRequired,
};


export default withTranslation()(TriggerEventCheckBox);
