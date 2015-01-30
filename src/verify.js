var RSVP = require('rsvp'),
    Hipchatter = require('hipchatter');

var gitlab = require('./gitlab'),
    git = require('./git'),
    config = require('./config');

module.exports = {
    launch: function(args) {
        this.data = {
            mergeId: args.mergeId,
            refuseMessage: args.refuseMessage
        };

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
        var self = this;

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
                return git.exec('show-branch', ['mergeUp-' + self.data.mergeId])
                    .then(function() {
                        git.exec('checkout', ['mergeUp-' + self.data.mergeId]);
                    })
                    .catch(function() {
                        RSVP.Promise.resolve()
                            // Collect all GitLab data
                            .then(function() {
                                return self.prepareGitLab();
                            })
                            // Create a temporary repository based on the fork
                            .then(function() {
                                return git.exec('remote', ['add', 'mergeUp', 'git@gitlab.ftven.net:' + self.data.mergeRequest.author.username + '.git']);
                            })
                            // Fetch the mergeUp repository
                            .then(function() {
                                return git.exec('fetch', ['mergeUp']);
                            })
                            // Create the local branch
                            .then(function() {
                                return git.exec('checkout', ['-b', 'mergeUp-' + self.data.mergeRequest.iid, 'mergeUp/' + self.data.mergeRequest.source_branch])
                                    .catch(function(error) {
                                        var stepError = new Error('GIT - local branch creation failed');
                                        stepError.parent = error;
                                        throw stepError;
                                    });
                            })
                            // Success
                            .then(function() {
                                process.stdout.write('\n\nVerification env created successfully\n');
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
        var self = this;

        RSVP.Promise.resolve()
            // Check for mergeUp branch
            .then(function() {
                return git.exec('show-branch', ['mergeUp-' + self.data.mergeId])
                    .catch(function(error) {
                        var stepError = new Error('GIT - local branch for this merge request doesn\'t exist, run \'mergeUp verify ' + self.data.mergeId + '\' first ');
                        throw stepError;
                    });
            })
            // Collect all GitLab data
            .then(function() {
                return self.prepareGitLab();
            })
            // Accept the merge request
            .then(function() {
                return gitlab.acceptMergeRequest(self.data.mergeRequest, self.data);
            })
            // Send hipchat notification
            .then(function() {
                return self.notifyHipchat('validate');
            })
            // Catch all errors
            .catch(function(error) {
                process.stdout.write('\n\nERROR ' + error.message + ' ' + (error.parent ? "(" + error.parent.message + ")" : '') + '\n');
            })
            .finally(function() {
                process.exit(1);
            });
    },
    refuse: function() {
        var self = this;

        RSVP.Promise.resolve()
            // Check for mergeUp branch
            .then(function() {
                return git.exec('show-branch', ['mergeUp-' + self.data.mergeId])
                    .catch(function(error) {
                        var stepError = new Error('GIT - local branch for this merge request doesn\'t exist, run \'mergeUp verify ' + self.data.mergeId + '\' first ');
                        throw stepError;
                    });
            })
            // Collect all GitLab data
            .then(function() {
                return self.prepareGitLab();
            })
            // Accept the merge request
            .then(function() {
                return gitlab.refuseMergeRequest(self.data.mergeRequest, self.data);
            })
            // Send hipchat notification
            .then(function() {
                return self.notifyHipchat('refuse');
            })
            // Catch all errors
            .catch(function(error) {
                process.stdout.write('\n\nERROR ' + error.message + ' ' + (error.parent ? "(" + error.parent.message + ")" : '') + '\n');
            })
            .finally(function() {
                process.exit(1);
            });
    },
    clean: function() {
        var self = this;

        RSVP.Promise.resolve()
            .then(function() {
                return git.exec('ls-remote', ['--exit-code', 'mergeUp'])
                    .then(function() {
                        return git.exec('remote', ['remove', 'mergeUp'])
                            .catch(function(error) {
                                var stepError = new Error('GIT - failed to remove mergeUp remote');
                                stepError.parent = error;
                                throw stepError;
                            });
                    })
                    .catch(function() {
                        // return cause not having the mergeUp remote isn't an error
                        return;
                    });
            })
            // Remove branch(es)
            .then(function() {
                if (this.mergeId) {
                    return git.exec('branch', ['-D', 'mergeUp-' + self.mergeId])
                        .catch(function(error) {
                            var stepError = new Error('GIT - failed to delete branch mergeUp-' + self.mergeId);
                            stepError.parent = error;
                            throw stepError;
                        });
                } else {
                    return git.exec('branch | grep \'mergeUp-[0-9]*\' | xargs git branch -D')
                        .catch(function(error) {
                            var stepError = new Error('GIT - failed to delete all mergeUp branches');
                            stepError.parent = error;
                            throw stepError;
                        });
                }
            })
            // Success
            .then(function() {
                process.stdout.write('\n\nClean successful\n');
            })
            // Catch all errors
            .catch(function(error) {
                process.stdout.write('\n\nERROR ' + error.message + ' ' + (error.parent ? "(" + error.parent.message + ")" : '') + '\n');
            })
            .finally(function() {
                process.exit(1);
            });
    },
    prepareGitLab: function() {
        var self = this;

        return RSVP.resolve()
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
                return git.loadConfig(self.data)
                    .catch(function(error) {
                        var stepError = new Error('GIT - collecting git config');
                        stepError.parent = error;
                        throw stepError;
                    });
            })
            // Get gitlab projectID for the upstream
            .then(function() {
                return gitlab.getProjectId(self.data.upstreamProject)
                    .catch(function(error) {
                        var stepError = new Error('GITLAB - getProjectId(upstream) failed');
                        stepError.parent = error;
                        throw stepError;
                    });
            })
            // Store previous promise result (upstream projectID)
            .then(function(upstreamId) {
                self.data.upstreamProjectId = upstreamId;
            })
            // Fetch merge request data
            .then(function() {
                return gitlab.getMergeRequest(self.data)
                    .catch(function(error) {
                        var stepError = new Error('GITLAB - merge request not found for this project');
                        stepError.parent = error;
                        throw stepError;
                    });
            });
    },
    notifyHipchat: function(action) {
        var self = this;

        return gitlab.whoAmI()
            .catch(function(error) {
                var stepError = new Error('GITLAB - can\'t retrieve your user informations');
                stepError.parent = error;
                throw stepError;
            })
            .then(function(me) {
                var deferred = RSVP.defer();
                var message = '';
                var hipchat = new Hipchatter(config.conf.hipchatUserToken);

                var mergeRequestUrl = config.conf.projectBaseUrl + self.data.upstreamProject + '/merge_requests/' + self.data.mergeRequest.iid + '/diffs';

                if (action === 'validate') {
                    message = 'Merge request <a href="' + mergeRequestUrl + '">' + self.data.mergeRequest.title + ' (#' + self.data.mergeRequest.iid + ')</a> on ' +
                        self.data.upstreamProject + ' has been <b>accepted</b> by <i>' + me.name + '</i>';
                } else {
                    message = 'Merge request <a href="' + mergeRequestUrl + '">' + self.data.mergeRequest.title + ' (#' + self.data.mergeRequest.iid + ')</a> on ' +
                        self.data.upstreamProject + ' has been <b>refused</b> by <i>' + me.name + '</i><br />Cause : <i>' + self.data.refuseMessage + '</i>';
                }


                hipchat.notify(config.conf.hipchatRoomId, {
                    message: message,
                    color: (action === 'validate') ? 'green' : 'red',
                    token: config.conf.hipchatUserToken,
                    notify: true
                }, function(err) {
                    if (err === null) {
                        process.stdout.write('\n\nSuccessfully notified the room for merge request #' + self.data.mergeRequest.iid + '\n');
                        deferred.resolve();
                    } else {
                        var stepError = new Error('HIPCHAT - notification failed');
                        stepError.parent = error;
                        deferred.reject(stepError);
                    }
                });

                return deferred.promise;
            });
    }
};
