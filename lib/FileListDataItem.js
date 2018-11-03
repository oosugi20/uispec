const path = require('path');
const _ = require('lodash');

class FileListDataItem {
  constructor({data, collection}) {
    const defaultProps = {
      title: '',
      url: '',
      summary: '',
      update: '',
    };
    this.props = _.defaults(data, defaultProps);
    this.collection = collection;

    //const servePath = mdData.srcFullPath.replace(srcRootFullDir, uispec.serveDir + '/').replace(/\.md$/, '.html');
    this.props.servePath = this.get('srcFullPath')
      .replace(this.collection.srcRootFullDir, this.collection.serveDir)
      .replace(/\.md$/, '.html');
    //const serveRelativePath = path.relative(uispec.serveDir, servePath);
    this.props.serveRelativePath = path.relative(this.collection.serveDir, this.get('servePath'));
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
