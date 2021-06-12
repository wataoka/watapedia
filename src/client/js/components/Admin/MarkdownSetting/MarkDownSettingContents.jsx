import React from 'react';
import { Card, CardBody } from 'reactstrap';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import LineBreakForm from './LineBreakForm';
import IndentForm from './IndentForm';
import PresentationForm from './PresentationForm';
import XssForm from './XssForm';


class MarkDownSettingContents extends React.Component {

  render() {
    const { t } = this.props;
    return (
      <React.Fragment>
        {/* Line Break Setting */}
        <h2 className="admin-setting-header">{t('admin:markdown_setting.lineBreak_header')}</h2>
        <Card className="card well my-3">
          <CardBody className="px-0 py-2">{ t('admin:markdown_setting.lineBreak_desc') }</CardBody>
        </Card>
        <LineBreakForm />

        {/* Indent Setting */}
        <h2 className="admin-setting-header">{t('admin:markdown_setting.indent_header')}</h2>
        <Card className="card well my-3">
          <CardBody className="px-0 py-2">{t('admin:markdown_setting.indent_desc') }</CardBody>
        </Card>
        <IndentForm />

        {/* Presentation Setting */}
        <h2 className="admin-setting-header">{ t('admin:markdown_setting.presentation_header') }</h2>
        <Card className="card well my-3">
          <CardBody className="px-0 py-2">{ t('admin:markdown_setting.presentation_desc') }</CardBody>
        </Card>
        <PresentationForm />

        {/* XSS Setting */}
        <h2 className="admin-setting-header">{ t('admin:markdown_setting.xss_header') }</h2>
        <Card className="card well my-3">
          <CardBody className="px-0 py-2">{ t('admin:markdown_setting.xss_desc') }</CardBody>
        </Card>
        <XssForm />
      </React.Fragment>
    );
  }

}

MarkDownSettingContents.propTypes = {
  t: PropTypes.func.isRequired, // i18next
};

export default withTranslation()(MarkDownSettingContents);
