const _ = require('lodash');

class FileListDataItem {
  constructor({data, srcFullDir, serveDir, collection}) {
    const defaultProps = {
      serveRelativeDir: '',
      depth: '',
      isIndex: false,
      title: '',
      url: '',
      summary: '',
      update: '',
    };
    this.props = _.defaults(data, defaultProps);
  }

  get(propName) {
    return this.props[propName];
  }

  toData() {
    return {
      serveRelativePath: this.get('serveRelativePath'),
      depth: this.get('depth'),
      isIndex: this.isIndex(),
      title: this.get('title'),
      url: this.get('url'),
      summary: this.get('summary'),
      update: this.get('update'),
    };
  }

  isIndex() {
    const srcFullPath = this.get('srcFullPath');
    return /index\.md$/.test(srcFullPath);
  }
}

module.exports = FileListDataItem;
