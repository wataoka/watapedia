import React from 'react';
import PropTypes from 'prop-types';

import { noop } from 'lodash/noop';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';

import UserPicture from './User/UserPicture';
import PageListMeta from './PageList/PageListMeta';
import PagePathLabel from './PageList/PagePathLabel';
import AppContainer from '../services/AppContainer';
import { withUnstatedContainers } from './UnstatedUtils';

class SearchTypeahead extends React.Component {

  constructor(props) {

    super(props);

    this.state = {
      input: this.props.keywordOnInit,
      pages: [],
      isLoading: false,
      searchError: null,
    };

    this.restoreInitialData = this.restoreInitialData.bind(this);
    this.clearKeyword = this.clearKeyword.bind(this);
    this.changeKeyword = this.changeKeyword.bind(this);
    this.search = this.search.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.dispatchSubmit = this.dispatchSubmit.bind(this);
    this.getEmptyLabel = this.getEmptyLabel.bind(this);
    this.getResetFormButton = this.getResetFormButton.bind(this);
    this.renderMenuItemChildren = this.renderMenuItemChildren.bind(this);
    this.getTypeahead = this.getTypeahead.bind(this);
  }

  /**
   * Get instance of AsyncTypeahead
   */
  getTypeahead() {
    return this.typeahead ? this.typeahead.getInstance() : null;
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  /**
   * Initialize keywordyword
   */
  restoreInitialData() {
    this.changeKeyword(this.props.keywordOnInit);
  }

  /**
   * clear keyword
   */
  clearKeyword(text) {
    this.changeKeyword('');
  }

  /**
   * change keyword
   */
  changeKeyword(text) {
    // see https://github.com/ericgio/react-bootstrap-typeahead/issues/266#issuecomment-414987723
    const instance = this.typeahead.getInstance();
    instance.clear();
    instance.setState({ text });
  }

  search(keyword) {

    if (keyword === '') {
      return;
    }

    this.setState({ isLoading: true });

    this.props.appContainer.apiGet('/search', { q: keyword })
      .then((res) => { this.onSearchSuccess(res) })
      .catch((err) => { this.onSearchError(err) });
  }

  /**
   * Callback function which is occured when search is exit successfully
   * @param {*} pages
   */
  onSearchSuccess(res) {
    this.setState({
      isLoading: false,
      pages: res.data,
    });
    if (this.props.onSearchSuccess != null) {
      this.props.onSearchSuccess(res);
    }
  }

  /**
   * Callback function which is occured when search is exit abnormaly
   * @param {*} err
   */
  onSearchError(err) {
    this.setState({
      isLoading: false,
      searchError: err,
    });
    if (this.props.onSearchError != null) {
      this.props.onSearchError(err);
    }
  }

  onInputChange(text) {
    this.setState({ input: text });
    this.props.onInputChange(text);
    if (text === '') {
      this.setState({ pages: [] });
    }
  }

  onKeyDown(event) {
    if (event.keyCode === 13) {
      this.dispatchSubmit();
    }
  }

  dispatchSubmit() {
    if (this.props.onSubmit != null) {
      this.props.onSubmit(this.state.input);
    }
  }

  getEmptyLabel() {
    const { emptyLabel, helpElement } = this.props;
    const { input } = this.state;

    // show help element if empty
    if (input.length === 0) {
      return helpElement;
    }

    // use props.emptyLabel as is if defined
    if (emptyLabel !== undefined) {
      return this.props.emptyLabel;
    }

    let emptyLabelExceptError = 'No matches found on title...';
    if (this.props.emptyLabelExceptError !== undefined) {
      emptyLabelExceptError = this.props.emptyLabelExceptError;
    }

    return (this.state.searchError !== null)
      ? 'Error on searching.'
      : emptyLabelExceptError;
  }

  /**
   * Get restore form button to initialize button
   */
  getResetFormButton() {
    const isClearBtn = this.props.behaviorOfResetBtn === 'clear';
    const initialKeyword = isClearBtn ? '' : this.props.keywordOnInit;
    const isHidden = this.state.input === initialKeyword;
    const resetForm = isClearBtn ? this.clearKeyword : this.restoreInitialData;

    return isHidden ? (
      <span />
    ) : (
      <button type="button" className="btn btn-link search-clear" onMouseDown={resetForm}>
        <i className="icon-close" />
      </button>
    );
  }

  renderMenuItemChildren(option, props, index) {
    const page = option;
    return (
      <span>
        <UserPicture user={page.lastUpdateUser} size="sm" noLink />
        <span className="ml-1 text-break text-wrap"><PagePathLabel page={page} /></span>
        <PageListMeta page={page} />
      </span>
    );
  }

  render() {
    const defaultSelected = (this.props.keywordOnInit !== '')
      ? [{ path: this.props.keywordOnInit }]
      : [];
    const inputProps = { autoComplete: 'off' };
    if (this.props.inputName != null) {
      inputProps.name = this.props.inputName;
    }

    const resetFormButton = this.getResetFormButton();

    return (
      <div className="search-typeahead">
        <AsyncTypeahead
          {...this.props}
          id="search-typeahead-asynctypeahead"
          ref={(c) => { this.typeahead = c }}
          inputProps={inputProps}
          isLoading={this.state.isLoading}
          labelKey="path"
          minLength={0}
          options={this.state.pages} // Search result (Some page names)
          promptText={this.props.helpElement}
          emptyLabel={this.getEmptyLabel()}
          align="left"
          submitFormOnEnter
          onSearch={this.search}
          onInputChange={this.onInputChange}
          onKeyDown={this.onKeyDown}
          renderMenuItemChildren={this.renderMenuItemChildren}
          caseSensitive={false}
          defaultSelected={defaultSelected}
          autoFocus={this.props.autoFocus}
          onBlur={this.props.onBlur}
          onFocus={this.props.onFocus}
        />
        {resetFormButton}
      </div>
    );
  }

}

/**
 * Wrapper component for using unstated
 */
const SearchTypeaheadWrapper = withUnstatedContainers(SearchTypeahead, [AppContainer]);

/**
 * Properties
 */
SearchTypeahead.propTypes = {
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,

  onSearchSuccess: PropTypes.func,
  onSearchError:   PropTypes.func,
  onChange:        PropTypes.func,
  onBlur:          PropTypes.func,
  onFocus:         PropTypes.func,
  onSubmit:        PropTypes.func,
  onInputChange:   PropTypes.func,
  inputName:       PropTypes.string,
  emptyLabel:      PropTypes.string,
  emptyLabelExceptError: PropTypes.string,
  placeholder:     PropTypes.string,
  keywordOnInit:   PropTypes.string,
  helpElement:     PropTypes.object,
  autoFocus:       PropTypes.bool,
  behaviorOfResetBtn: PropTypes.oneOf(['restore', 'clear']),
};

/**
 * Properties
 */
SearchTypeahead.defaultProps = {
  onSearchSuccess: noop,
  onSearchError:   noop,
  onChange:        noop,
  placeholder:     '',
  keywordOnInit:   '',
  behaviorOfResetBtn: 'restore',
  autoFocus:       false,
  onInputChange: () => {},
};

export default SearchTypeaheadWrapper;
