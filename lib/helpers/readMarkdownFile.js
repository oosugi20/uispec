const fs = require('fs');
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

  return _.defaults(splited, defaults);
}
