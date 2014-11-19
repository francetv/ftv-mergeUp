#!/usr/bin/env node

var program = require('commander');
var automateMerge = require('../index.js');

var pkg = require('../package.json');

program
    .version(pkg.version);


program.parse(process.argv);

automateMerge(2467, 2445, 'dev', 'master', 'test1');