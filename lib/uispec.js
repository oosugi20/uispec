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

  this.dirRegex = new RegExp('^' + this.serveDir);
};


uispec.generate = function () {
  const allMdFilePaths = getAllMdFilePaths();
  _.forEach(allMdFilePaths, (filePath) => {
    const file = fs.readFileSync(filePath);
    const html = marked(file.toString());
    const destPath = path.join(
      process.cwd(),
      filePath.replace(this.srcDir, this.destDir).replace(/\.md$/, '.html')
    );
    const parsedDestPath = path.parse(destPath);
    const destPathDirs = parsedDestPath.dir.split('/').slice(1);
    const destFullPathDirs = _.map(destPathDirs, (val, i) => {
      const parent = destPathDirs.slice(0, i).join('/');
      return path.join('/', parent, val);
    });
    _.forEach(destFullPathDirs, (dir) => {
      try {
        fs.accessSync(dir)
      } catch (err) {
        fs.mkdirSync(dir);
      }
    });
    fs.writeFileSync(destPath, html);
  });
};


uispec.serve = function () {
  return function (req, res, next) {
    const myPath = new MyPath(req);

    if (!myPath.isTargetDir()) {
      next();
      return;
    }

    const mdFile = fs.readFileSync(myPath.targetMdPathAbsolute);
    const html = marked(mdFile.toString());

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(html, 'utf8')
  };
};

class MyPath {
  constructor (req) {
    const dirRegex = uispec.dirRegex;
    const srcDir = uispec.srcDir;
    const url = parseUrl(req);

    this.reqPath = path.parse(url.pathname);
    this.reqLocalDir = this.reqPath.dir.replace(dirRegex, '');

    this.targetMdPath = [
      this.reqLocalDir,
      '/',
      this.reqPath.name,
      '.md',
    ].join('');

    this.targetMdPathAbsolute = path.join(
      process.cwd(),
      srcDir,
      this.targetMdPath,
    );
  }

  isTargetDir () {
    return uispec.dirRegex.test(this.reqPath.dir);
  }
}

function getAllMdFilePaths () {
  const results = [];
  getAllFilePaths(uispec.srcDir);
  return results;

  function getAllFilePaths (dir) {
    const list = fs.readdirSync(dir);

    _.forEach(list, (item) => {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        getAllFilePaths(fullPath);
      } else {
        results.push(fullPath);
      }
    });
  }
}


function createUispec (options) {
  uispec.init(options);
  return uispec;
}
