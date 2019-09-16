const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const splitUpMarkdownString = require('./splitUpMarkdownString');

module.exports = function readMarkdownFile(fileFullPath) {
  const mdFile = fs.readFileSync(fileFullPath);
  const mdStr = mdFile.toString();
  const defaults = {
    title: '',
    screen: '',
    url: '',
    summary: '',
    update: '',
    body: '',
  };
  const splited = splitUpMarkdownString(mdStr);

  return _.assign({
    srcFullPath: fileFullPath,
    srcFullDir: path.dirname(fileFullPath),
    srcFileName: path.basename(fileFullPath),
  }, defaults, splited);
}
