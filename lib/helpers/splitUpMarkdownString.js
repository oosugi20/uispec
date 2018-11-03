const _ = require('lodash');
const yaml = require('js-yaml');

const metaPattern    = /^\s*---\s*\n(.|\n)+?\s*---\s*\n/;

/**
 * マークダウン形式のstingをメタとコンテンツに分割したデータを返す。
 * @params {sting} markdownString
 * @return {object}
 */
module.exports = function splitUpMarkdownString(markdownString) {
  const metaPatternRes = metaPattern.exec(markdownString);
  const meta = (metaPatternRes) ? yaml.safeLoad(metaPatternRes[0].replace(/---/g, '')) : {};
  const body = markdownString.replace(metaPattern, '');
  // TODO meta内のyamlがinvalidだったときの処理
  return _.assign({ body }, meta);
};
