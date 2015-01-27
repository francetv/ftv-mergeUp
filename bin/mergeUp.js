#!/usr/bin/env node

var program = require('commander');

var mergeUp = require('../src/index.js'),
    init = require('../src/init.js').init,
    verify = require('../src/verify.js'),
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
    .command('fix')
    .description('update the merge request in order to fix it')
    .action(function() {
        mergeUp.automateMergeRequest({
            forkProject: program.forkProject,
            upstreamProject: program.upstreamProject,
            forkBranch: program.forkBranch,
            upstreamBranch: program.upstreamBranch,
            title: program.title,
            silentMode: program.silent,
            fixMode: true
        });
    });

program
    .command('verify')
    .usage('[mergeID]')
    .description('prepare an env to verify a merge request')
    .option('--validate', 'accept the merge request')
    .option('--refuse <message>', 'add a refuse comment ont GitLab')
    .option('--clean', 'remove all env created by this command')
    .action(function(cmd, options) {
        var infos = options || cmd;
        var mergeId = !isNaN(program.args[0]) ? program.args[0] : undefined;

        if (!mergeId && !infos.clean) {
            process.stdout.write('\nThe mergeID is mandatory\n');
            return;
        }

        verify.launch({
            mergeId: mergeId,
            action: infos.validate ? 'validate' : infos.refuse ? 'refuse' : infos.clean ? 'clean' : '',
            refuseMessage: infos.refuse
        });
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
