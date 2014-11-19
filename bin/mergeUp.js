#!/usr/bin/env node

var program = require('commander');
var automateMerge = require('../index.js');

var pkg = require('../package.json');

program
    .version(pkg.version);


var args = program.parse(process.argv).args;
console.log('args: ', args);
if (args.length !== 5) {
    console.log('Usage : mergeup forkProject upstreamProject forkBranch upstreamBranch Title');
    return;
}
automateMerge.apply(this, args);
//'nnavarro/test-project-dummy', 'team-player/test-project-dummy', 'branch3', 'master', 'test1'