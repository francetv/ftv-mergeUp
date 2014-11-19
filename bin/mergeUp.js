#!/usr/bin/env node

var program = require('commander');
var automateMerge = require('../index.js');

var pkg = require('../package.json');

program
    .version(pkg.version);


args = program.parse(process.argv);

automateMerge('nnavarro/test-project-dummy', 'team-player/test-project-dummy', 'branch3', 'master', 'test1');