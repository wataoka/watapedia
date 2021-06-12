/* eslint-disable no-useless-escape */
import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import {
  Dropdown, DropdownToggle, DropdownMenu, DropdownItem,
} from 'reactstrap';

import { withUnstatedContainers } from '../../UnstatedUtils';
import { toastSuccess, toastError } from '../../../util/apiNotification';

import AppContainer from '../../../services/AppContainer';

import AdminCustomizeContainer from '../../../services/AdminCustomizeContainer';
import AdminUpdateButtonRow from '../Common/AdminUpdateButtonRow';

class CustomizeHighlightSetting extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      isDropdownOpen: false,
    };

    this.onToggleDropdown = this.onToggleDropdown.bind(this);
    this.onClickSubmit = this.onClickSubmit.bind(this);
  }

  onToggleDropdown() {
    this.setState({ isDropdownOpen: !this.state.isDropdownOpen });
  }

  async onClickSubmit() {
    const { t, adminCustomizeContainer } = this.props;

    try {
      await adminCustomizeContainer.updateHighlightJsStyle();
      toastSuccess(t('toaster.update_successed', { target: t('admin:customize_setting.code_highlight') }));
    }
    catch (err) {
      toastError(err);
    }
  }

  renderHljsDemo() {
    const { adminCustomizeContainer } = this.props;

    /* eslint-disable max-len */
    const html = `<span class="hljs-function"><span class="hljs-keyword">function</span> <span class="hljs-title">MersenneTwister</span>(<span class="hljs-params">seed</span>) </span>{
  <span class="hljs-keyword">if</span> (<span class="hljs-built_in">arguments</span>.length == <span class="hljs-number">0</span>) {
    seed = <span class="hljs-keyword">new</span> <span class="hljs-built_in">Date</span>().getTime();
  }

  <span class="hljs-keyword">this</span>._mt = <span class="hljs-keyword">new</span> <span class="hljs-built_in">Array</span>(<span class="hljs-number">624</span>);
  <span class="hljs-keyword">this</span>.setSeed(seed);
}</span>`;
    /* eslint-enable max-len */

    return (
      <pre className={`hljs ${!adminCustomizeContainer.state.isHighlightJsStyleBorderEnabled && 'hljs-no-border'}`}>
        {/* eslint-disable-next-line react/no-danger */}
        <code dangerouslySetInnerHTML={{ __html: html }}></code>
      </pre>
    );
  }

  render() {
    const { t, adminCustomizeContainer } = this.props;
    const options = adminCustomizeContainer.state.highlightJsCssSelectorOptions;
    const menuItem = [];

    Object.entries(options).forEach((option) => {
      const styleId = option[0];
      const styleName = option[1].name;
      const isBorderEnable = option[1].border;

      menuItem.push(
        <DropdownItem
          key={styleId}
          role="presentation"
          onClick={() => adminCustomizeContainer.switchHighlightJsStyle(styleId, styleName, isBorderEnable)}
        >
          <a role="menuitem">{styleName}</a>
        </DropdownItem>,
      );
    });

    return (
      <React.Fragment>
        <div className="row">
          <div className="col-12">
            <h2 className="admin-setting-header">{t('admin:customize_setting.code_highlight')}</h2>

            <div className="form-group row">
              <div className="offset-md-3 col-md-6 text-left">
                <div className="my-0">
                  <label>{t('admin:customize_setting.theme')}</label>
                </div>
                <Dropdown isOpen={this.state.isDropdownOpen} toggle={this.onToggleDropdown}>
                  <DropdownToggle className="text-right col-6" caret>
                    <span className="float-left">{adminCustomizeContainer.state.currentHighlightJsStyleName}</span>
                  </DropdownToggle>
                  <DropdownMenu className="dropdown-menu" role="menu">
                    {menuItem}
                  </DropdownMenu>
                </Dropdown>
                <p className="form-text text-warning">
                  {/* eslint-disable-next-line react/no-danger */}
                  <span dangerouslySetInnerHTML={{ __html: t('admin:customize_setting.nocdn_desc') }} />
                </p>
              </div>
            </div>

            <div className="form-group row">
              <div className="offset-md-3 col-md-6 text-left">
                <div className="custom-control custom-switch custom-checkbox-success">
                  <input
                    type="checkbox"
                    className="custom-control-input"
                    id="highlightBorder"
                    checked={adminCustomizeContainer.state.isHighlightJsStyleBorderEnabled}
                    onChange={() => { adminCustomizeContainer.switchHighlightJsStyleBorder() }}
                  />
                  <label className="custom-control-label" htmlFor="highlightBorder">
                    <strong>Border</strong>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-text text-muted">
              <label>Examples:</label>
              <div className="wiki">
                {this.renderHljsDemo()}
              </div>
            </div>

            <AdminUpdateButtonRow onClick={this.onClickSubmit} disabled={adminCustomizeContainer.state.retrieveError != null} />
          </div>
        </div>
      </React.Fragment>
    );
  }

}

const CustomizeHighlightSettingWrapper = withUnstatedContainers(CustomizeHighlightSetting, [AppContainer, AdminCustomizeContainer]);

CustomizeHighlightSetting.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  adminCustomizeContainer: PropTypes.instanceOf(AdminCustomizeContainer).isRequired,
};

export default withTranslation()(CustomizeHighlightSettingWrapper);
