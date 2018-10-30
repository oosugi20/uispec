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
const jsdom = require('jsdom');
const {JSDOM} = jsdom;

const Viz = require( 'viz.js' );
const { Module, render } = require( 'viz.js/full.render.js' );
const viz = new Viz({ Module, render });

module.exports = createUispec;

const EDITOR_DIR = path.resolve(__dirname + '/editor/build/');
const DEFAULT_THEME_DIR = path.resolve(__dirname + '/theme/default/build/');
const THEME_TMPL_FILE_NAME = '_template.tmpl';
const FILELIST_TMPL_FILE_NAME = path.resolve(__dirname + '/filelist/_filelist.tmpl');

const filelistTmplFile = fs.readFileSync(FILELIST_TMPL_FILE_NAME);
const filelistTmpl = _.template(filelistTmplFile.toString());


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

function isExistFile(file) {
  try {
    fs.statSync(file);
    return true
  } catch(err) {
    if(err.code === 'ENOENT') return false
  }
}

uispec.init = function (options) {

  const config = (isExistFile('.uispecconfig')) ?
    JSON.parse(fs.readFileSync('.uispecconfig').toString()) : {};
  const o = _.assign({
    srcDir: 'src/uispec/',
    serveDir: '/_uispec',
    destDir: 'dest/uispec/',
    themeDir: null
  }, config, options);

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
    let data;
    const isMd = /\.md/.test(filePath);
    const destPath = (isMd) ? path.join(
        process.cwd(),
        filePath.replace(this.srcDir, this.destDir).replace(/\.md$/, '.html')
      ) : path.join(
        process.cwd(),
        filePath.replace(this.srcDir, this.destDir)
      );

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

    if (isMd) {
      const fileDir = path.dirname(filePath);
      const toRoot = path.relative(fileDir, uispec.srcDir);
      renderHtml(filePath, fileDir, (toRoot) ? toRoot + '/' : '').then((data) => {
        fs.writeFileSync(destPath, data);
      });
    } else {
      const data = fs.readFileSync(filePath);
      fs.writeFileSync(destPath, data);
    }

  });

  copyThemeResources();
  copyEditor();
  generateFilelist();
};

function generateFilelist () {
  const html = renderFilelist();
  const htmlDestPath = path.join(uispec.destDir, '_filelist.html');
  fs.writeFileSync(htmlDestPath, html);
}

function renderFilelist () {
  const allMdFilePaths = getAllSrcFilePaths({ onlyMd: true });
  const filelistData = {};
  filelistData.items = _.map(allMdFilePaths, (mdFilePath) => {
    return getFilelistData(mdFilePath);
  });

  filelistData.items.sort((a, b) => {
    const regIndex = /index\.md/;

    if (a.srcDir < b.srcDir) {
      return -1;
    } else if (a.srcDir > b.srcDir) {
      return 1;
    }

    // 同じディレクトリ
    //
    // indexを先に
    if (regIndex.test(a.srcFilename)) {
      return -1;
    } else if (regIndex.test(b.srcFilename)) {
      return 1;
    }

    // index以外
    if (a.srcFilename < b.srcFilename) {
      return -1;
    } else if (a.srcFilename > b.srcFilename) {
      return 1;
    }

    return 0;
  });

  return filelistTmpl(filelistData);
}

function copyEditor () {
  const destDir = path.resolve(uispec.destDir);
  const filePaths = fs.readdirSync(EDITOR_DIR);
  _.forEach(filePaths, (filePath) => {
    const file = fs.readFileSync(path.join(EDITOR_DIR, filePath));
    const destPath = path.join(destDir, filePath);
    fs.writeFileSync(destPath, file);
  });
};

function copyThemeResources () {
  const destDir = path.resolve(uispec.destDir);
  const themeDir = uispec.themeDir || DEFAULT_THEME_DIR;
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

async function renderHtml (mdFullPath, screenReqDir, toRoot) {
  const mdData = readMdData(mdFullPath);

  const screenPath = path.resolve(screenReqDir, mdData.screen);
  const screenPathName = url.parse(screenPath).pathname;
  const screenSrcPath = path.resolve(
    process.cwd(),
    screenPathName.replace(uispec.serveDir, uispec.srcDir)
  );
  const screenRoot = path.resolve(screenReqDir, toRoot);
  const screenPathFromScreenRoot = screenPath.replace(screenRoot, '.');

  const body = marked(mdData.body);
	const dom = new JSDOM(body);
	const domDoc = dom.window.document;
  const dotEls = domDoc.querySelectorAll('.UISP-Dot');

  const pAll = _.map(dotEls, (el) => {
    const code = decodeURIComponent(el.innerHTML)
    return viz.renderString(code);
  });

  const codes = await Promise.all(pAll);

  const vizScraps = /^<\?xml version="1.0" encoding="UTF-8" standalone="no"\?>\n<!DOCTYPE svg PUBLIC "-\/\/W3C\/\/DTD SVG 1.1\/\/EN"\n "http:\/\/www.w3.org\/Graphics\/SVG\/1.1\/DTD\/svg11.dtd">/;
  _.forEach(dotEls, (el, i) => {
    el.innerHTML = codes[i].replace(vizScraps, '');
  });


  const contents = _.assign({}, mdData, {
    toRoot   : toRoot,
    editorUrl: toRoot + `_editor.html?src=${screenPathFromScreenRoot.replace(/\?/, '&')}`,
    dir      : '/sampleDir', // TODO 現状使ってない、、、？
    screenFullPath: screenSrcPath,
    body     : domDoc.documentElement.outerHTML,
  });

  // TODO テンプレートファイル名固定をなんとかする？
  const templatePath = (uispec.themeDir) ?
    path.join(uispec.themeDir, THEME_TMPL_FILE_NAME) :
    path.join(DEFAULT_THEME_DIR, THEME_TMPL_FILE_NAME);
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

  return function (req, res, next) {
    const myPath = new MyPath(parseUrl(req).pathname);

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
      const sendPath = path.join(
        process.cwd(),
        uispec.srcDir,
        myPath.reqOriginalPath.replace(uispec.serveDir, '')
      );
      send(req, sendPath).pipe(res);
      return;
    }

    if (myPath.isEditor()) {
      send(req, path.join(EDITOR_DIR, myPath.reqPath.base)).pipe(res);
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

      const html = renderFilelist();
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(html, 'utf8')
      next();
      return;
    }

    // htmlであり、かつfilelistじゃなく、ファイルが存在しない
    if (!myPath.isExistFile()) {
      next();
      return;
    }

    const toRoot = path.relative(myPath.reqPath.dir, uispec.serveDir);

    renderHtml(myPath.targetMdPathAbsolute, myPath.reqPath.dir, (toRoot) ? toRoot + '/' : '').then((html) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(html, 'utf8')
    });
  };
};

function getFilelistData (mdFilePath) {
  const srcPath = mdFilePath;
  const srcFilename = path.basename(srcPath);
  const isIndex = /index\.md$/.test(srcPath);
  const servePath = mdFilePath.replace(uispec.srcDir, uispec.serveDir + '/').replace(/\.md$/, '.html');
  const serveRelativePath = path.relative(uispec.serveDir, servePath);
  const serveRelativeDir = path.dirname(serveRelativePath);
  const mdFileFullPath = path.join(process.cwd(), mdFilePath);
  // TODO generate時におかしくなるかも
  const mdData = readMdData(mdFileFullPath);
  let depth = servePath.split('/').length - uispec.serveDir.split('/').length - 1;
  // TODO path.sep()
  if (!isIndex) {
    depth++;
  }
  if (_.has(mdData, 'updateHtml')) {
    const updateHtml = mdData.updateHtml;
    const reg = /<a href="(.*?)">(.*?)<\/a>/;
    if (reg.test(updateHtml)) {
      const href = updateHtml.replace(reg, '$1');
      const resolvedHref = path.join(serveRelativeDir, href);
      mdData.updateHtml = updateHtml.replace(reg, '<a href="' + resolvedHref + '">$2</a>');
    }
  }

  return _.assign({
    srcPath,
    srcDir: path.dirname(srcPath),
    srcFilename,
    servePath,
    serveRelativePath,
    serveRelativeDir,
    depth,
    isIndex
  }, mdData);
}

class MyPath {
  constructor (pathname) {
    const dirRegex = uispec.dirRegex;
    const srcDir = uispec.srcDir;
    const themeDir = uispec.themeDir;

    this.reqPath = path.parse(pathname);
    if (!this.reqPath.ext) {
      if (/\/$/.test(pathname)) {
        this.reqPath = path.parse(path.join(pathname, 'index.html'));
      } else {
        this.reqPath = path.parse(pathname + '.html');
      }
    }
    this.reqOriginalPath = pathname;
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
      path.join(DEFAULT_THEME_DIR, this.reqPath.base);
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

  isExistFile() {
    return isExistFile(this.targetMdPathAbsolute);
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
