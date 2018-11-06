const path = require('path');
const _ = require('lodash');
const marked = require('marked');

class FileListDataItem {
  constructor({data, collection}) {
    // mdからのdata
    // - srcFullPath
    // - srcFullDir
    // - srcFileName

    // collectionから必須
    // - srcRootFullDir
    // - serveDir

    const defaultProps = {
      title: '',
      url: '',
      summary: '',
      update: '',
    };
    this.props = _.defaults(data, defaultProps);
    this.collection = collection;

    this.set('servePath', this.computeServePath());
    this.set('serveRelativePath', this.computeServeRelativePath());
    this.set('serveRelativeDir', this.computeServeRelativeDir());
    this.set('depth', this.computeDepth())
    this.set('updateHtml', this.computeUpdateHtml());
  }

  get(propName) {
    return this.props[propName];
  }

  set(propName, value) {
    this.props[propName] = value;
  }

  computeServePath() {
    const srcFullPath = this.get('srcFullPath');
    const srcRootFullDir = this.collection.srcRootFullDir;
    const serveDir = this.collection.serveDir;
    return srcFullPath.replace(srcRootFullDir, serveDir).replace(/\.md$/, '.html');
  }

  computeServeRelativePath() {
    const serveDir = this.collection.serveDir;
    const servePath = this.get('servePath');
    return path.relative(serveDir, servePath);
  }

  computeServeRelativeDir() {
    return path.dirname(this.get('serveRelativePath'));
  }

  computeDepth() {
    const servePathLength = this.get('servePath').split('/').length;
    const serveDirLength = this.collection.serveDir.split('/').length;
    let depth = servePathLength - serveDirLength - 1;
    if (!this.isIndex()) {
      depth++;
    }
    return depth;
  }

  computeUpdateHtml() {
    const updateMarkdown = this.get('update');
    if (!updateMarkdown) {
      return '';
    }

    const markedHtml = marked(updateMarkdown).replace(/<p>|<\/p>/g, '');
    const reg = /<a href="(.*?)">(.*?)<\/a>/;
    const isLink = reg.test(markedHtml);

    if (!isLink) {
      return markedHtml;
    }

    const href = markedHtml.replace(reg, '$1');
    const serveRelativeDir = this.get('serveRelativeDir');
    // TODO 相対パス前提なのでルート相対だった場合の処理
    const resolvedHref = path.join(serveRelativeDir, href);
    const resolvedHtml = markedHtml.replace(reg, '<a href="' + resolvedHref + '">$2</a>');

    return resolvedHtml;
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
      updateHtml: this.get('updateHtml'),
      body: this.get('body'),
    };
  }

  isIndex() {
    const srcFullPath = this.get('srcFullPath');
    return /index\.md$/.test(srcFullPath);
  }
}

module.exports = FileListDataItem;
