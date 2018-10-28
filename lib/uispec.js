const _ = require('lodash');
const parseUrl = require('parseurl');
const path = require('path');
const marked = require('marked');
const fs = require('fs');

module.exports = createUispec;


const uispec = {};


uispec.init = function (options) {
  const o = _.assign({
    srcDir: 'uispec/',
    serveDir: 'public/',
    destDir: 'public/',
    themaDir: 'thema/'
  }, options);

  this.srcDir = o.srcDir;
  this.serveDir = path.normalize(o.serveDir);
  this.destDir = o.destDir;
  this.themaDir = o.themaDir;

  console.log('uispec#init', this);
};


uispec.serve = function () {
  return function (req, res, next) {
    const url = parseUrl(req);
    //const originalUrl = parseUrl.original(req);
    //const dir = decodeURIComponent(url.pathname);
    //const originalDir = decodeURIComponent(originalUrl.pathname);

    const reqPath = path.parse(url.pathname);
    const dirRegex = new RegExp('^' + uispec.serveDir);
    // TODO /を付ける位置とかいろいろ対応

    if (!dirRegex.test(reqPath.dir)) {
      next();
      return;
    }

    const localDir = reqPath.dir.replace(dirRegex, '');
    const targetPath = [
      localDir,
      '/',
      reqPath.name,
      '.md',
    ].join('');

    const normalizedTargetPath = path.normalize([
      process.cwd(),
      uispec.srcDir,
      targetPath,
    ].join('/'));

    const mdFile = fs.readFileSync(normalizedTargetPath);
    const html = marked(mdFile.toString());

    console.log('normalizedTargetPath:', normalizedTargetPath);
    console.log('targetPath:', targetPath);
    console.log('localDir:', localDir);
    console.log('reqPath:', reqPath);

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    //res.setHeader('Content-Length', Buffer.byteLength(body, 'utf8'))
    res.end(html, 'utf8')
  };
};


function createUispec(options) {
  uispec.init(options);
  return uispec;
}
