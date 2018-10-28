#!/usr/bin/env node

const program = require('commander');
const prompt = require('prompt');
const express = require('express');
const uispec = require('../lib/uispec');
const fs = require('fs');


program
  .command('init')
  .action((cmd, env) => {
    prompt.start();
    prompt.get([
      'srcDir',
      'serveDir',
      'destDir',
      'themeDir',
    ], (err, result) => {
      const config = {
        srcDir: result.srcDir || 'src/uispec/',
        serveDir: result.serveDir || '/_uispec',
        destDir: result.destDir || 'dest/uispec/',
        themeDir: result.themeDir || ''
      };

      fs.writeFileSync('.uispecconfig', JSON.stringify(config));
      console.log('created .uispecconfig');
    });
  });

program
  .command('generate')
  .action((cmd, env) => {
    //console.log(cmd, env)
    const options = JSON.parse(fs.readFileSync('.uispecconfig').toString());
    const myUispec = uispec(options);
    myUispec.generate();
  });

program
  .command('clean')
  .action((cmd, env) => {
    const options = JSON.parse(fs.readFileSync('.uispecconfig').toString());
    const myUispec = uispec(options);
    myUispec.clean();
  });

program
  .command('serve')
  .action((cmd, env) => {
    const options = JSON.parse(fs.readFileSync('.uispecconfig').toString());
    const myUispec = uispec(options);
    const app = express();
    const port = process.env.PORT || 3000;
    app.use(myUispec.serve());
    app.listen(port);
    console.log("-------------------------");
    console.log("Express server listening on port %d in %s mode", port, app.settings.env);
    console.log("-------------------------");
  });

program.parse(process.argv);
