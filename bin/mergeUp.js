#!/usr/bin/env node

var program = require('commander');

var mergeUp = require('../src/index.js'),
    pkg = require('../package.json');

program
    .version(pkg.version)
    .usage('[options]')
    .description('Automatic merging tool')
    .option('-t, --title <title>', 'merge request title (ex: \'Bug fixes\')')
    .option('-p, --forkProject <projectName>', 'fork project name (ex: username/project)')
    .option('-P, --upstreamProject <projectName>', 'upstream project name (ex: team/project)')
    .option('-b, --forkBranch <branch>', 'fork branch name (ex: bugfix)')
    .option('-B, --upstreamBranch <branch>', 'upstream branch name (ex: dev)')
    .option('-s, --silent', 'desactivate hipChat notification')
    .parse(process.argv);

if (!program.title) {
    process.stderr.write('Error, some mandatories params are missing\n\n-t --title option is required\n');
    program.help();
}

mergeUp.automateMergeRequest({
    forkProject: program.forkProject,
    upstreamProject: program.upstreamProject,
    forkBranch: program.forkBranch,
    upstreamBranch: program.upstreamBranch,
    title: program.title,
    silentMode: program.silent
});
