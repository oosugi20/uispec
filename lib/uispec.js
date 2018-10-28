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
const url = require('url');

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
    srcDir: 'src/uispec/',
    serveDir: '/_uispec',
    destDir: 'dest/uispec/',
    themeDir: null
  }, options);

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
  this.clean();
  const allSrcFilePaths = getAllSrcFilePaths({ onlyMd: false });

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
  // TODO path.sep()
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
  copyEditor();
};

function copyEditor () {
  const destDir = path.resolve(uispec.destDir);
  const editorDir = path.resolve(__dirname + '/../editor/');
  const filePaths = fs.readdirSync(editorDir);
  _.forEach(filePaths, (filePath) => {
    const file = fs.readFileSync(path.join(editorDir, filePath));
    const destPath = path.join(destDir, filePath);
    fs.writeFileSync(destPath, file);
  });
};

function copyThemeResources () {
  const destDir = path.resolve(uispec.destDir);
  const themeDir = uispec.themeDir || path.resolve(__dirname + '/../theme/default/');
  const filePaths = fs.readdirSync(themeDir);

  _.forEach(filePaths, (filePath) => {
    if (/\.tmpl$/.test(filePath)) {
      return;
    }
    const file = fs.readFileSync(path.join(themeDir, filePath));
    const destPath = path.join(destDir, filePath);
    fs.writeFileSync(destPath, file);
  });
}

function readMdData (mdFullPath) {
  const mdFile = fs.readFileSync(mdFullPath);
  return splitInput(mdFile.toString());
}

function renderHtml (mdFullPath, screenReqDir, toRoot) {
  const mdData = readMdData(mdFullPath);

  const screenPath = path.resolve(screenReqDir, mdData.screen);
  const screenPathName = url.parse(screenPath).pathname;
  const screenSrcPath = path.resolve(
    process.cwd(),
    screenPathName.replace(uispec.serveDir, uispec.srcDir)
  );
  const screenRoot = path.resolve(screenReqDir, toRoot);
  const screenPathFromScreenRoot = screenPath.replace(screenRoot, '.');

  const contents = {
    toRoot   : toRoot,
    editorUrl: toRoot + `_editor.html?src=${screenPathFromScreenRoot}`,
    dir      : '/sampleDir', // TODO 現状使ってない、、、？
    title    : mdData.title,
    screen   : mdData.screen,
    screenFullPath: screenSrcPath,
    body     : marked(mdData.body),
  };

  // TODO テンプレートファイル名固定をなんとかする？
  const templateFileName = '_template.tmpl';
  const templatePath = (uispec.themeDir) ?
    path.join(uispec.themeDir, templateFileName) :
    path.resolve(__dirname + '/../theme/default/' + templateFileName);
  return  makePageHtml(contents, templatePath);
}


uispec.serve = function () {
  // TODO 毎回取ったら重そうだから、最初に保持しとこうとしたけど、
  // mdファイルを更新したときにうまくいかないので、、、、
  //let allMdFilePaths = getAllSrcFilePaths({ onlyMd: true });
  //const filelistData = {};
  //filelistData.items = _.map(allMdFilePaths, (mdFilePath) => {
  //  return getFilelistData(mdFilePath);
  //});
  //console.log(filelistData)

  const filelistTmplFile = fs.readFileSync(path.resolve(__dirname + '/../filelist/_filelist.tmpl'));
  const filelistTmpl = _.template(filelistTmplFile.toString());


  return function (req, res, next) {
    const myPath = new MyPath(req);

    if (!myPath.isTargetDir()) {
      next();
      return;
    }

    // htmlでも画像でもeditor用ファイルでもなければテーマのcssやjs等のリソースとして取り扱う
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

    if (myPath.isFileList()) {
      // TODO 以下、差分更新しようと思ったけど、追加削除はOKだが更新ファイルが。。。
      //const newAllMdFilePaths = getAllSrcFilePaths({ onlyMd: true });
      //const removed = _.difference(allMdFilePaths, newAllMdFilePaths);
      //const added = _.difference(newAllMdFilePaths, allMdFilePaths);
      //allMdFilePaths = newAllMdFilePaths;
      //_.remove(filelistData.items, (item) => {
      //  return _.includes(removed, item.srcPath);
      //});
      //_.forEach(added, (mdFilePath) => {
      //  filelistData.items.push( getFilelistData(mdFilePath) );
      //});

      const allMdFilePaths = getAllSrcFilePaths({ onlyMd: true });
      const filelistData = {};
      filelistData.items = _.map(allMdFilePaths, (mdFilePath) => {
        return getFilelistData(mdFilePath);
      });
      filelistData.items = _.sortBy(filelistData.items, item => item.srcDir);


      const html = filelistTmpl(filelistData);
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(html, 'utf8')
      next();
      return;
    }

    const toRoot = path.relative(myPath.reqPath.dir, uispec.serveDir);
    const html = renderHtml(myPath.targetMdPathAbsolute, myPath.reqPath.dir, (toRoot) ? toRoot + '/' : '');

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(html, 'utf8')
  };
};

function getFilelistData (mdFilePath) {
  const srcPath = mdFilePath;
  const servePath = mdFilePath.replace(uispec.srcDir, uispec.serveDir + '/').replace(/\.md$/, '.html');
  const serveRelativePath = path.relative(uispec.serveDir, servePath);
  const mdFileFullPath = path.join(process.cwd(), mdFilePath);
  // TODO generate時におかしくなるかも
  const mdData = readMdData(mdFileFullPath);
  const depth = servePath.split('/').length - uispec.serveDir.split('/').length - 1;
  // TODO path.sep()

  return _.assign({
    srcPath,
    srcDir: path.dirname(srcPath),
    servePath,
    serveRelativePath,
    depth
  }, mdData);
}

class MyPath {
  constructor (req) {
    const dirRegex = uispec.dirRegex;
    const srcDir = uispec.srcDir;
    const themeDir = uispec.themeDir;
    const _url = parseUrl(req);

    this.reqOriginalPath = _url.pathname;
    this.reqPath = path.parse(_url.pathname);
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

    // テーマのcssやjs等のリソースのパス
    this.themePath = (themeDir) ?
      path.join(process.cwd(), themeDir, this.reqPath.base) :
      path.resolve(__dirname + '/../theme/default/' + this.reqPath.base);
      // TODO ↑デフォルトのパスをなんとかしたい
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

  isFileList () {
    return /^_filelist\.html$/.test(this.reqPath.base);
  }
}

function getAllSrcFilePaths ({ onlyMd }) {
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
        if (onlyMd) {
          if (!/\.md$/.test(item)) {
            return;
          }
        }
        results.push(fullPath);
      }
    });
  }
}


function createUispec (options) {
  uispec.init(options);
  return uispec;
}
