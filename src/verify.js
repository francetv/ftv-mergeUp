var RSVP = require('rsvp');

var gitlab = require('./gitlab'),
    git = require('./git'),
    config = require('./config');

module.exports = {
    init: function(args) {
        this.mergeId = args.mergeId;
        this.refuseMessage = args.refuseMessage;

        switch (args.action) {
            case 'validate':
                this.validate();
                break;
            case 'refuse':
                this.refuse();
                break;
            case 'clean':
                this.clean();
                break;
            default:
                this.create();
                break;
        }
    },
    create: function() {
        var mergeRequestData = {};
        var data = {
            id: this.mergeId
        };

        RSVP.Promise.resolve()
            // Check for unstaged or changed files
            .then(function() {
                return git.exec('diff', ['--exit-code'])
                    .then(function() {
                        return git.exec('diff', ['--cached', '--exit-code']);
                    })
                    .catch(function(error) {
                        var stepError = new Error('GIT - Please, commit your changes or stash them first');
                        throw stepError;
                    });
            })
            // Check if branch already exist and if so checkout on it
            .then(function() {
                return git.exec('show-branch', ['mergeUp-' + data.id])
                    .then(function() {
                        git.exec('checkout', ['mergeUp-' + data.id]);
                    })
                    .catch(function() {
                        RSVP.Promise.resolve()
                            // Collect process config
                            .then(function() {
                                return config.init()
                                    .catch(function(error) {
                                        var stepError = new Error('CONFIG - collecting process config');
                                        stepError.parent = error;
                                        throw stepError;
                                    });
                            })
                            // Collect git config
                            .then(function() {
                                return git.loadConfig(data)
                                    .catch(function(error) {
                                        var stepError = new Error('GIT - collecting git config');
                                        stepError.parent = error;
                                        throw stepError;
                                    });
                            })
                            // Get gitlab projectID for the upstream
                            .then(function() {
                                return gitlab.getProjectId(data.upstreamProject)
                                    .catch(function(error) {
                                        var stepError = new Error('GITLAB - getProjectId(upstream) failed');
                                        stepError.parent = error;
                                        throw stepError;
                                    });
                            })
                            // Store previous promise result (upstream projectID)
                            .then(function(upstreamId) {
                                data.upstreamProjectId = upstreamId;
                            })
                            // Fetch merge request data
                            .then(function() {
                                return gitlab.getMergeRequest(data)
                                    .catch(function(error) {
                                        var stepError = new Error('GITLAB - merge request not found for this project');
                                        stepError.parent = error;
                                        throw stepError;
                                    });
                            })
                            // Create a temporary repository based on the fork
                            .then(function(MR) {
                                mergeRequestData = MR;
                                return git.exec('remote', ['add', 'mergeUp', 'git@gitlab.ftven.net:' + data.forkProject + '.git']);
                            })
                            // Fetch the mergeUp repository
                            .then(function() {
                                return git.exec('fetch', ['mergeUp']);
                            })
                            // Create the local branch
                            .then(function() {
                                return git.exec('checkout', ['-b', 'mergeUp-' + mergeRequestData.iid, 'mergeUp/' + mergeRequestData.source_branch])
                                    .catch(function(error) {
                                        var stepError = new Error('GIT - local branch creation failed');
                                        stepError.parent = error;
                                        throw stepError;
                                    });
                            })
                            // Catch all errors
                            .catch(function(error) {
                                process.stdout.write('\n\nERROR ' + error.message + ' ' + (error.parent ? "(" + error.parent.message + ")" : '') + '\n');
                            })
                            // Remove the temporary repository
                            .finally(function() {
                                git.exec('remote', ['remove', 'mergeUp']);
                                process.exit(1);
                            });
                    });
            })
            // Catch all errors
            .catch(function(error) {
                process.stdout.write('\n\nERROR ' + error.message + ' ' + (error.parent ? "(" + error.parent.message + ")" : '') + '\n');
            });
    },
    validate: function() {
        console.log('validate');
    },
    refuse: function(args) {
        console.log('refuse');
    },
    clean: function(args) {
        console.log('clean');
    }
};
