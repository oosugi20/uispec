# uispec

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

## API

`serve()`
`generate()`
`clean()`


## Commands

`uispec init`
`uispec serve`
`uispec generate`
`uispec clean`
