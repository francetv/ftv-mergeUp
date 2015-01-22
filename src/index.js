var Hipchatter = require('hipchatter'),
    RSVP = require('rsvp'),
    ProgressBar = require('progress'),
    inquirer = require("inquirer"),
    exec = require('child_process').exec;

var git = require('./git'),
    config = require('./config'),
    gitlab = require('./gitlab'),
    bar = new ProgressBar(':bar', {
        total: 130
    });

module.exports = {
    automateMergeRequest: function automateMergeRequest(data) {
        RSVP.Promise.resolve()
            // Check for unstaged or changed files
            .then(function() {
                bar.tick(10);

                return git.exec('diff', ['--exit-code'])
                    .then(function() {
                        return git.exec('diff', ['--cached', '--exit-code']);
                    })
                    .catch(function(error) {
                        var stepError = new Error('GIT - Please, commit your changes or stash them first');
                        throw stepError;
                    });
            })
            // Collect process config
            .then(function() {
                bar.tick(10);
                return config.init()
                    .catch(function(error) {
                        var stepError = new Error('CONFIG - collecting process config');
                        stepError.parent = error;
                        throw stepError;
                    });
            })
            // Collect git config
            .then(function() {
                bar.tick(10);
                return git.loadConfig(data)
                    .catch(function(error) {
                        var stepError = new Error('GIT - collecting git config');
                        stepError.parent = error;
                        throw stepError;
                    });
            })
            // Launch test
            .then(function() {
                bar.tick(10);
                var deferred = RSVP.defer();

                exec('npm test', function(error, stdout, stderr) {
                    if (error !== null) {
                        deferred.reject(new Error('NPM - error occured during tests launch (failed test, no tests etc.)'));
                    }

                    deferred.resolve();
                });

                return deferred.promise;
            })
            // Check for branch equality
            .then(function() {
                bar.tick(10);
                if (data.forkBranch === data.upstreamBranch) {
                    return RSVP.Promise.resolve()
                        .then(function() {
                            var deferred = RSVP.defer();

                            inquirer.prompt([{
                                type: 'confirm',
                                name: 'sameBranchConfirm',
                                message: '\nWARNING - merge request on the same origin/upstream branch name?',
                                default: false
                            }], function(answers) {
                                if (!answers.sameBranchConfirm) {
                                    return deferred.reject(new Error('no merge on the same origin/upstream branch name'));
                                }

                                deferred.resolve();
                            });

                            return deferred.promise;
                        })
                        .catch(function(error) {
                            var stepError = new Error('PROCESS');
                            stepError.parent = error;
                            throw stepError;
                        });
                }
            })
            // Fetch upstream
            .then(function() {
                bar.tick(10);
                return git.exec('fetch', ['upstream'])
                    .catch(function(error) {
                        var stepError = new Error('GIT - fetch failed');
                        stepError.parent = error;
                        throw stepError;
                    });
            })
            // Rebase the working branch
            .then(function(result) {
                bar.tick(10);
                return git.exec('rebase', ['upstream/' + data.upstreamBranch])
                    .catch(function(error) {
                        return git.exec('rebase', ['--abort']).finally(function() {
                            var stepError = new Error('GIT - rebase failed');
                            stepError.parent = error;
                            throw stepError;
                        });
                    });
            })
            // Push the working branch to the origin remote
            .then(function(result) {
                bar.tick(10);
                return git.exec('push', ['origin', data.forkBranch, '-f'])
                    .catch(function(error) {
                        var stepError = new Error('GIT - push failed');
                        stepError.parent = error;
                        throw stepError;
                    });
            })
            // Get gitlab projectID for the fork
            .then(function() {
                bar.tick(10);
                return gitlab.getProjectId(data.forkProject)
                    .catch(function(error) {
                        var stepError = new Error('GITLAB - getProjectId(fork) failed');
                        stepError.parent = error;
                        throw stepError;
                    });
            })
            // Get gitlab projectID for the upstream
            .then(function(forkId) {
                bar.tick(10);
                data.forkProjectId = forkId;
                return gitlab.getProjectId(data.upstreamProject)
                    .catch(function(error) {
                        var stepError = new Error('GITLAB - getProjectId(upstream) failed');
                        stepError.parent = error;
                        throw stepError;
                    });
            })
            // Store previous promise result (upstream projectID)
            .then(function(upstreamId) {
                bar.tick(10);
                data.upstreamProjectId = upstreamId;
            })
            // Create/Update the merge request on GitLab
            .then(function() {
                bar.tick(10);
                return gitlab.getMergeRequest(data)
                    .then(function(mergeRequest) {
                        if (!mergeRequest) {
                            return gitlab.createMergeRequest(data)
                                .catch(function(error) {
                                    var stepError = new Error('GITLAB - create merge request failed');
                                    stepError.parent = error;
                                    throw stepError;
                                });
                        }

                        return gitlab.updateMergeRequest(mergeRequest, data)
                            .catch(function(error) {
                                var stepError = new Error('GITLAB - update merge request failed');
                                stepError.parent = error;
                                throw stepError;
                            });
                    });
            })
            // Send hipchat notification
            .then(function(params) {
                bar.tick(10);

                if (data.silentMode) {
                    return;
                }

                gitlab.whoAmI()
                    .then(function(me) {
                        var hipchat = new Hipchatter(config.conf.hipchatUserToken);
                        var mergeRequestIid = params.mergeRequest.iid;
                        var mergeRequestUrl = config.conf.projectBaseUrl + data.upstreamProject + '/merge_requests/' + mergeRequestIid + '/diffs';
                        var message = ((params.isNew) ? 'New' : 'Updated') + ' merge request by <i>' + me.name + '</i> on <b>' + data.upstreamProject + '</b> : <a href="' +
                            mergeRequestUrl + '">' + data.title + '</a>';

                        hipchat.notify(config.conf.hipchatRoomId, {
                            message: message,
                            color: 'green',
                            token: config.conf.hipchatUserToken,
                            notify: true
                        }, function(err) {
                            if (err === null) {
                                process.stdout.write('\n\nSuccessfully notified the room for merge request #' + mergeRequestIid + '\n');
                            } else {
                                var stepError = new Error('HIPCHAT - notification failed');
                                stepError.parent = error;
                                throw stepError;
                            }
                        });
                    })
                    .catch(function() {
                        var stepError = new Error('GITLAB - can\'retrieve your user informations');
                        stepError.parent = error;
                        throw stepError;
                    });
            })
            // Catch all errors
            .catch(function(error) {
                process.stdout.write('\n\nERROR ' + error.message + ' ' + (error.parent ? "(" + error.parent.message + ")" : '') + '\n');
                process.exit(1);
            });
    }
};
