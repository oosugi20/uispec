#!/usr/bin/env node

const program = require('commander');
const uispec = require('../lib/uispec');
const fs = require('fs');

const options = JSON.parse(fs.readFileSync('.uispecconfig').toString());
const myUispec = uispec(options);


program
  .command('generate')
  .action((cmd, env) => {
    //console.log(cmd, env)
    myUispec.generate();
  });

program
  .command('clean')
  .action((cmd, env) => {
    myUispec.clean();
  });

program.parse(process.argv);
