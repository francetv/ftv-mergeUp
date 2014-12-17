#!/usr/bin/env node

var program = require('commander');
var automateMerge = require('../index.js'),
    pkg = require('../package.json');

program
    .version(pkg.version)
    .usage('[options]')
    .description('Automatic merging tool')
    .option('-t, --title <>', 'Merge request title (ex: \'Bug fixes\')')
    .option('-F, --forkProject <>', 'Fork project name (ex: \'username/project\')')
    .option('-U, --upstreamProject <>', 'Upstream project name (ex: \'team/project\')')
    .option('-f, --forkBranch <>', 'Fork branch name (ex: \'bugfix\')')
    .option('-u, --upstreamBranch <>', 'Upstream branch name (ex: \'dev\')')
    .parse(process.argv);



// Useful until config isn't fetch from local config
var missingParams = false;
var stderr = '';

if (!program.title) {
    missingParams = true;
    stderr += '-t --title option is required\n';
}
if (!program.forkProject) {
    missingParams = true;
    stderr += '-F --forkProject option is required\n';
}
if (!program.upstreamProject) {
    missingParams = true;
    stderr += '-U --upstreamProject option is required\n';
}
if (!program.forkBranch) {
    missingParams = true;
    stderr += '-f --forkBranch option is required\n';
}
if (!program.upstreamBranch) {
    missingParams = true;
    stderr += '-u --upstreamBranch option is required\n';
}

if (missingParams) {
    process.stderr.write('Error, some mandatories params are missing\n\n' + stderr);
    program.help();
}

automateMerge.apply(this, args);
// //./node_modules/.bin/mergeUp 'nnavarro/test-project-dummy' 'team-player/test-project-dummy' 'branch3' 'master' 'test1'
