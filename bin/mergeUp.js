#!/usr/bin/env node

var program = require('commander');

var mergeUp = require('../src/index.js'),
    init = require('../src/init.js').init,
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

program
    .command('verify')
    .usage('<mergeID>')
    .description('prepare an env to verify a merge request')
    .option('--validate', 'accept the merge request')
    .option('--refuse <message>', 'add a refuse comment ont GitLab')
    .option('--clean', 'remove all env created by this command')
    .action(function(cmd, options) {
        if (isNaN(program.args[0])) {
            process.stdout.write('\nThe mergeID is mandatory\n');
            return;
        }

        var args = {
            mergeId: program.args[0],
            action: options.validate ? 'validate' : options.refuse ? 'refuse' : options.clean ? 'clean' : '',
            refuseMessage: options.refuse
        };

        //TODO
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
