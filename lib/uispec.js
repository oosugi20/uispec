const _ = require('lodash');
const parseUrl = require('parseurl');
const path = require('path');
const marked = require('marked');
const fs = require('fs');
const del = require('del');
const UiflowsMDRenderer = require('./UiflowsMDRenderer');
const makePageHtml = require('./makePageHtml');
const send = require('send');
const splitInput = require('./splitInput');

module.exports = createUispec;

marked.setOptions({
  renderer: new UiflowsMDRenderer(),
  // renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false,
  highlight: function ( code, lang ) {}
});

const uispec = {};


uispec.init = function (options) {
  const o = _.assign({
    srcDir: 'uispec/',
    serveDir: 'public/',
    destDir: 'public/',
    themeDir: null
  }, options);

  fs.writeFileSync('.uispecconfig', JSON.stringify(o));

  this.srcDir = o.srcDir;
  this.serveDir = path.normalize(o.serveDir);
  this.destDir = o.destDir;
  this.themeDir = o.themeDir;

  this.dirRegex = new RegExp('^' + this.serveDir);
};


uispec.clean = function () {
  del.sync([this.destDir + '**']);
}


uispec.generate = function () {
  const allSrcFilePaths = getAllSrcFilePaths();

  _.forEach(allSrcFilePaths, (filePath) => {
    let destPath, data;

    if (/\.md/.test(filePath)) {
      destPath = path.join(
        process.cwd(),
        filePath.replace(this.srcDir, this.destDir).replace(/\.md$/, '.html')
      );
      const fileDir = path.dirname(filePath);
      const toRoot = path.relative(fileDir, uispec.srcDir);
      data = renderHtml(filePath, fileDir, (toRoot) ? toRoot + '/' : '');
    } else {
      destPath = path.join(
        process.cwd(),
        filePath.replace(this.srcDir, this.destDir)
      );
      data = fs.readFileSync(filePath);
    }

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

    fs.writeFileSync(destPath, data);
  });

  copyThemeResources();
};

function copyThemeResources () {
  const destDir = path.resolve(uispec.destDir);
  const themeDir = uispec.themeDir || path.resolve(__dirname + '/../theme/default/');
  const filePaths = fs.readdirSync(themeDir);

  _.forEach(filePaths, (filePath) => {
    if (/\.html$/.test(filePath)) {
      return;
    }
    const file = fs.readFileSync(path.join(themeDir, filePath));
    const destPath = path.join(destDir, filePath);
    fs.writeFileSync(destPath, file);
  });
}

function renderHtml (mdFullPath, screenReqDir, toRoot) {
  const mdFile = fs.readFileSync(mdFullPath);
  const mdData = splitInput(mdFile.toString());

  const screenPath = path.resolve(screenReqDir, mdData.screen);
  const screenSrcPath = path.resolve(
    process.cwd(),
    screenPath.replace(uispec.serveDir, uispec.srcDir)
  );
  const screenRoot = path.resolve(screenReqDir, toRoot);
  const screenPathFromScreenRoot = screenPath.replace(screenRoot, '.');

  const contents = {
    toRoot   : toRoot,
    editorUrl: toRoot + `_editor.html?src=${screenPathFromScreenRoot}`,
    dir      : '/sampleDir',
    title    : mdData.title,
    screen   : mdData.screen,
    screenFullPath: screenSrcPath,
    body     : marked(mdData.body),
  };

  return  makePageHtml(contents);
}


uispec.serve = function () {
  return function (req, res, next) {
    const myPath = new MyPath(req);

    if (!myPath.isTargetDir()) {
      next();
      return;
    }

    if (!myPath.isHtml() && !myPath.isImg() && !myPath.isEditor()) {
      send(req, myPath.themePath).pipe(res);
      return;
    }

    // TODO 画像はthemeに含まれない想定になってるのをなんとかする
    if (myPath.isImg()) {
      send(req, path.join(
        process.cwd(),
        uispec.srcDir,
        myPath.reqOriginalPath.replace(uispec.serveDir, '')
      )).pipe(res);
      return;
    }

    if (myPath.isEditor()) {
      const editorRoot = path.resolve(__dirname + '/../editor/');
      send(req, path.join(editorRoot, myPath.reqPath.base)).pipe(res);
      return;
    }

    const toRoot = path.relative(myPath.reqPath.dir, uispec.serveDir);
    const html = renderHtml(myPath.targetMdPathAbsolute, myPath.reqPath.dir, (toRoot) ? toRoot + '/' : '');

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(html, 'utf8')
  };
};

class MyPath {
  constructor (req) {
    const dirRegex = uispec.dirRegex;
    const srcDir = uispec.srcDir;
    const themeDir = uispec.themeDir;
    const url = parseUrl(req);

    this.reqOriginalPath = url.pathname;
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

    this.themePath = (themeDir) ?
      path.join(process.cwd(), this.reqPath.base) :
      path.resolve(__dirname + '/../theme/default/' + this.reqPath.base);
  }

  isTargetDir () {
    return uispec.dirRegex.test(this.reqPath.dir);
  }

  isHtml () {
    return this.reqPath.ext === '.html';
  }

  isImg () {
    return /^\.(png|jpeg|jpg|gif)$/.test(this.reqPath.ext);
  }

  isEditor () {
    return /^_editor$/.test(this.reqPath.name);
  }
}

function getAllSrcFilePaths () {
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
