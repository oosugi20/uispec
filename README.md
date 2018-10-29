# uispec

https://github.com/pxgrid/ui-spec-md を元に、

- gulp依存を外した
- cli用意した
- serveできるように
- template(theme)を自分でカスタマイズしたものを使えるように
- filelistの自動生成追加

などしたもの。

現状、取り敢えず使える状態にまでなっているが、ほんとにざっくりという感じ。

## Usage

```javascript
const express = require('express');
const uispec = require('uispec');
const app = express();
const port = process.env.PORT || 3000;
const publicDir = 'public/';

const uispecOptions = {
  srcDir: 'src/uispec/',
  serveDir: '/_uispec',
  destDir: 'dest/uispec/',
  themeDir: 'custom-theme/'
};

const myUispec = uispec(uispecOptions);

app.use(express.static(publicDir));
app.use(myUispec.serve());
app.listen(port);
```

## APIs

`serve()`
`generate()`
`clean()`


## Commands

`uispec init`
`uispec serve`
`uispec generate`
`uispec clean`
