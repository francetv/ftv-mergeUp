#!/usr/bin/env node

var program = require('commander');

var mergeUp = require('../src/index.js'),
    init = require('../src/init.js').init,
    pkg = require('../package.json');

program
    .version(pkg.version)
    .usage('[options]')
    .option('-t, --title <title>', 'merge request title (ex: \'Bug fixes\')')
    .option('-p, --forkProject <projectName>', 'fork project name (ex: username/project)')
    .option('-P, --upstreamProject <projectName>', 'upstream project name (ex: team/project)')
    .option('-b, --forkBranch <branch>', 'fork branch name (ex: bugfix)')
    .option('-B, --upstreamBranch <branch>', 'upstream branch name (ex: dev)')
    .option('-s, --silent', 'desactivate hipChat notification');

program
    .command('')
    .description('Automatic merging tool');

program
    .command('init')
    .description('initialize mergeUpConf.json file')
    .action(function() {
        init();
    });

program.parse(process.argv);

if (program.args.length === 0) {
    mergeUp.automateMergeRequest({
        forkProject: program.forkProject,
        upstreamProject: program.upstreamProject,
        forkBranch: program.forkBranch,
        upstreamBranch: program.upstreamBranch,
        title: program.title,
        silentMode: program.silent
    });
}
