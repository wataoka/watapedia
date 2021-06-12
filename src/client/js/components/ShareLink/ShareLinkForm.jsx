import React from 'react';
import PropTypes from 'prop-types';

import { withTranslation } from 'react-i18next';
import dateFnsFormat from 'date-fns/format';
import parse from 'date-fns/parse';

import { isInteger } from 'core-js/fn/number';
import { withUnstatedContainers } from '../UnstatedUtils';

import { toastSuccess, toastError } from '../../util/apiNotification';

import AppContainer from '../../services/AppContainer';
import PageContainer from '../../services/PageContainer';

class ShareLinkForm extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      expirationType: 'unlimited',
      numberOfDays: '7',
      description: '',
      customExpirationDate: dateFnsFormat(new Date(), 'yyyy-MM-dd'),
      customExpirationTime: dateFnsFormat(new Date(), 'HH:mm'),
    };

    this.handleChangeExpirationType = this.handleChangeExpirationType.bind(this);
    this.handleChangeNumberOfDays = this.handleChangeNumberOfDays.bind(this);
    this.handleChangeDescription = this.handleChangeDescription.bind(this);
    this.handleIssueShareLink = this.handleIssueShareLink.bind(this);
  }

  /**
   * change expirationType
   * @param {string} expirationType
   */
  handleChangeExpirationType(expirationType) {
    this.setState({ expirationType });
  }

  /**
   * change numberOfDays
   * @param {string} numberOfDays
   */
  handleChangeNumberOfDays(numberOfDays) {
    this.setState({ numberOfDays });
  }

  /**
   * change description
   * @param {string} description
   */
  handleChangeDescription(description) {
    this.setState({ description });
  }

  /**
   * change customExpirationDate
   * @param {date} customExpirationDate
   */
  handleChangeCustomExpirationDate(customExpirationDate) {
    this.setState({ customExpirationDate });
  }

  /**
   * change customExpirationTime
   * @param {date} customExpirationTime
   */
  handleChangeCustomExpirationTime(customExpirationTime) {
    this.setState({ customExpirationTime });
  }

  /**
   * Generate expiredAt by expirationType
   */
  generateExpired() {
    const { t } = this.props;
    const { expirationType } = this.state;
    let expiredAt;

    if (expirationType === 'unlimited') {
      return null;
    }

    if (expirationType === 'numberOfDays') {
      if (!isInteger(Number(this.state.numberOfDays))) {
        throw new Error(t('share_links.Invalid_Number_of_Date'));
      }
      const date = new Date();
      date.setDate(date.getDate() + Number(this.state.numberOfDays));
      expiredAt = date;
    }

    if (expirationType === 'custom') {
      const { customExpirationDate, customExpirationTime } = this.state;
      expiredAt = parse(`${customExpirationDate}T${customExpirationTime}`, "yyyy-MM-dd'T'HH:mm", new Date());
    }

    return expiredAt;
  }

  closeForm() {
    const { onCloseForm } = this.props;

    if (onCloseForm == null) {
      return;
    }
    onCloseForm();
  }

  async handleIssueShareLink() {
    const {
      t, appContainer, pageContainer,
    } = this.props;
    const { pageId } = pageContainer.state;
    const { description } = this.state;

    let expiredAt;

    try {
      expiredAt = this.generateExpired();
    }
    catch (err) {
      return toastError(err);
    }

    try {
      await appContainer.apiv3Post('/share-links/', { relatedPage: pageId, expiredAt, description });
      this.closeForm();
      toastSuccess(t('toaster.issue_share_link'));
    }
    catch (err) {
      toastError(err);
    }

  }

  renderExpirationTypeOptions() {
    const { expirationType } = this.state;
    const { t } = this.props;

    return (
      <div className="form-group row">
        <label htmlFor="inputDesc" className="col-md-5 col-form-label">{t('share_links.expire')}</label>
        <div className="col-md-7">


          <div className="custom-control custom-radio form-group ">
            <input
              type="radio"
              className="custom-control-input"
              id="customRadio1"
              name="expirationType"
              value="customRadio1"
              checked={expirationType === 'unlimited'}
              onChange={() => { this.handleChangeExpirationType('unlimited') }}
            />
            <label className="custom-control-label" htmlFor="customRadio1">{t('share_links.Unlimited')}</label>
          </div>

          <div className="custom-control custom-radio  form-group">
            <input
              type="radio"
              className="custom-control-input"
              id="customRadio2"
              value="customRadio2"
              checked={expirationType === 'numberOfDays'}
              onChange={() => { this.handleChangeExpirationType('numberOfDays') }}
              name="expirationType"
            />
            <label className="custom-control-label" htmlFor="customRadio2">
              <div className="row align-items-center m-0">
                <input
                  type="number"
                  min="1"
                  className="col-4"
                  name="expirationType"
                  value={this.state.numberOfDays}
                  onFocus={() => { this.handleChangeExpirationType('numberOfDays') }}
                  onChange={e => this.handleChangeNumberOfDays(Number(e.target.value))}
                />
                <span className="col-auto">{t('share_links.Days')}</span>
              </div>
            </label>
          </div>

          <div className="custom-control custom-radio form-group text-nowrap mb-0">
            <input
              type="radio"
              className="custom-control-input"
              id="customRadio3"
              name="expirationType"
              value="customRadio3"
              checked={expirationType === 'custom'}
              onChange={() => { this.handleChangeExpirationType('custom') }}
            />
            <label className="custom-control-label" htmlFor="customRadio3">
              {t('share_links.Custom')}
            </label>
            <div className="d-inline-flex flex-wrap">
              <input
                type="date"
                className="ml-3 mb-2"
                name="customExpirationDate"
                value={this.state.customExpirationDate}
                onFocus={() => { this.handleChangeExpirationType('custom') }}
                onChange={e => this.handleChangeCustomExpirationDate(e.target.value)}
              />
              <input
                type="time"
                className="ml-3 mb-2"
                name="customExpiration"
                value={this.state.customExpirationTime}
                onFocus={() => { this.handleChangeExpirationType('custom') }}
                onChange={e => this.handleChangeCustomExpirationTime(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderDescriptionForm() {
    const { t } = this.props;
    return (
      <div className="form-group row">
        <label htmlFor="inputDesc" className="col-md-5 col-form-label">{t('share_links.description')}</label>
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            id="inputDesc"
            placeholder={t('share_links.enter_desc')}
            value={this.state.description}
            onChange={e => this.handleChangeDescription(e.target.value)}
          />
        </div>
      </div>
    );
  }

  render() {
    const { t } = this.props;
    return (
      <div className="share-link-form p-3">
        <h3 className="grw-modal-head pb-2"> { t('share_links.share_settings') }</h3>
        <div className=" p-3">
          {this.renderExpirationTypeOptions()}
          {this.renderDescriptionForm()}
          <button type="button" className="btn btn-primary d-block mx-auto px-5" onClick={this.handleIssueShareLink}>
            {t('share_links.Issue')}
          </button>
        </div>
      </div>
    );
  }

}

/**
 * Wrapper component for using unstated
 */
const ShareLinkFormWrapper = withUnstatedContainers(ShareLinkForm, [AppContainer, PageContainer]);

ShareLinkForm.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  pageContainer: PropTypes.instanceOf(PageContainer).isRequired,
  onCloseForm: PropTypes.func,
};

export default withTranslation()(ShareLinkFormWrapper);
