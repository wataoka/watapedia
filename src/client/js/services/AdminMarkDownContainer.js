import { Container } from 'unstated';

/**
 * Service container for admin markdown setting page (MarkDownSetting.jsx)
 * @extends {Container} unstated Container
 */
export default class AdminMarkDownContainer extends Container {

  constructor(appContainer) {
    super();

    this.appContainer = appContainer;
    this.dummyIsEnabledLinebreaks = 0;
    this.dummyIsEnabledLinebreaksForError = 1;

    this.state = {
      retrieveError: null,
      // set dummy value tile for using suspense
      isEnabledLinebreaks: this.dummyIsEnabledLinebreaks,
      isEnabledLinebreaksInComments: false,
      adminPreferredIndentSize: 4,
      isIndentSizeForced: false,
      pageBreakSeparator: 1,
      pageBreakCustomSeparator: '',
      isEnabledXss: false,
      xssOption: 1,
      tagWhiteList: '',
      attrWhiteList: '',
    };

    this.switchEnableXss = this.switchEnableXss.bind(this);
    this.setAdminPreferredIndentSize = this.setAdminPreferredIndentSize.bind(this);
  }

  /**
   * Workaround for the mangling in production build to break constructor.name
   */
  static getClassName() {
    return 'AdminMarkDownContainer';
  }

  /**
   * retrieve markdown data
   */
  async retrieveMarkdownData() {
    const response = await this.appContainer.apiv3.get('/markdown-setting/');
    const { markdownParams } = response.data;

    this.setState({
      isEnabledLinebreaks: markdownParams.isEnabledLinebreaks,
      isEnabledLinebreaksInComments: markdownParams.isEnabledLinebreaksInComments,
      adminPreferredIndentSize: markdownParams.adminPreferredIndentSize,
      isIndentSizeForced: markdownParams.isIndentSizeForced,
      pageBreakSeparator: markdownParams.pageBreakSeparator,
      pageBreakCustomSeparator: markdownParams.pageBreakCustomSeparator || '',
      isEnabledXss: markdownParams.isEnabledXss,
      xssOption: markdownParams.xssOption,
      tagWhiteList: markdownParams.tagWhiteList || '',
      attrWhiteList: markdownParams.attrWhiteList || '',
    });
  }

  setAdminPreferredIndentSize(adminPreferredIndentSize) {
    this.setState({ adminPreferredIndentSize });
  }

  /**
   * Switch PageBreakSeparator
   */
  switchPageBreakSeparator(pageBreakSeparator) {
    this.setState({ pageBreakSeparator });
  }

  /**
   * Set PageBreakCustomSeparator
   */
  setPageBreakCustomSeparator(pageBreakCustomSeparator) {
    this.setState({ pageBreakCustomSeparator });
  }

  /**
   * Switch enableXss
   */
  switchEnableXss() {
    if (this.state.isEnabledXss) {
      this.setState({ xssOption: null });
    }
    this.setState({ isEnabledXss: !this.state.isEnabledXss });
  }

  /**
   * Update LineBreak Setting
   */
  async updateLineBreakSetting() {

    const response = await this.appContainer.apiv3.put('/markdown-setting/lineBreak', {
      isEnabledLinebreaks: this.state.isEnabledLinebreaks,
      isEnabledLinebreaksInComments: this.state.isEnabledLinebreaksInComments,
    });

    return response;
  }

  /**
   * Update
   */
  async updateIndentSetting() {

    const response = await this.appContainer.apiv3.put('/markdown-setting/indent', {
      adminPreferredIndentSize: this.state.adminPreferredIndentSize,
      isIndentSizeForced: this.state.isIndentSizeForced,
    });

    return response;
  }

  /**
   * Update Xss Setting
   */
  async updateXssSetting() {
    let { tagWhiteList, attrWhiteList } = this.state;

    tagWhiteList = Array.isArray(tagWhiteList) ? tagWhiteList : tagWhiteList.split(',');
    attrWhiteList = Array.isArray(attrWhiteList) ? attrWhiteList : attrWhiteList.split(',');

    const response = await this.appContainer.apiv3.put('/markdown-setting/xss', {
      isEnabledXss: this.state.isEnabledXss,
      xssOption: this.state.xssOption,
      tagWhiteList,
      attrWhiteList,
    });

    return response;
  }

  /**
   * Update Presentation Setting
   */
  async updatePresentationSetting() {

    const response = await this.appContainer.apiv3.put('/markdown-setting/presentation', {
      pageBreakSeparator: this.state.pageBreakSeparator,
      pageBreakCustomSeparator: this.state.pageBreakCustomSeparator,
    });

    this.setState({
      pageBreakSeparator: response.data.presentationParams.pageBreakSeparator,
      pageBreakCustomSeparator: response.data.presentationParams.pageBreakCustomSeparator,
    });
    return response;
  }

}
