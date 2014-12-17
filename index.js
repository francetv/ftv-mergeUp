var Hipchatter = require('hipchatter'),
    RSVP = require('rsvp'),
    ProgressBar = require('progress');

var git = require('./git'),
    config = require('./config.json'),
    hipchat = new Hipchatter(config.hipchatUserToken),
    gitlab = require('./gitlab'),
    bar = new ProgressBar(':bar', {
        total: 80
    });

module.exports = {
    automateMergeRequest: function automateMergeRequest(data) {
        RSVP.Promise.resolve()
            // Collect git config
            .then(function() {
                return git.loadConfig(data).catch(function(error) {
                    var stepError = new Error('GIT - collecting git config');
                    stepError.parent = error;
                    throw stepError;
                });
            })
            // Fetch upstream
            .then(function() {
                bar.tick(10);
                return git.exec('fetch', ['upstream']).catch(function(error) {
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
                return git.exec('push', ['origin', data.forkBranch, '-f']).catch(function(error) {
                    var stepError = new Error('GIT - push failed');
                    stepError.parent = error;
                    throw stepError;
                });
            })
            // Get gitlab projectID for the fork
            .then(function() {
                bar.tick(10);
                return gitlab.getProjectId(data.forkProject).catch(function(error) {
                    var stepError = new Error('GITLAB - getProjectId(fork) failed');
                    stepError.parent = error;
                    throw stepError;
                });
            })
            // Get gitlab projectID for the upstream
            .then(function(forkId) {
                bar.tick(10);
                data.forkProjectId = forkId;
                return gitlab.getProjectId(data.upstreamProject).catch(function(error) {
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
                return gitlab.getMergeRequest(data, data.title)
                    .then(function(mergeRequest) {
                        return gitlab.updateMergeRequest(mergeRequest).catch(function(error) {
                            var stepError = new Error('GITLAB - update merge request failed');
                            stepError.parent = error;
                            throw stepError;
                        });
                    })
                    .catch(function(error) {
                        return gitlab.createMergeRequest(data, data.title).catch(function(error) {
                            var stepError = new Error('GITLAB - create merge request failed');
                            stepError.parent = error;
                            throw stepError;
                        });
                    });
            })
            // Send hipchat notification
            .then(function(params) {
                bar.tick(10);
                var mergeRequestIid = params.mergeRequest.iid;
                var mergeRequestUrl = config.projectBaseUrl + data.upstreamProject + '/merge_requests/' + mergeRequestIid + '/diffs';
                var message = ((params.isNew) ? 'New' : 'Updated') + ' merge request on ' + data.upstreamProject + ': <a href="' + mergeRequestUrl + '">' + data.title + '</a>';

                hipchat.notify(config.hipchatRoomId, {
                    message: message,
                    color: 'green',
                    token: config.hipchatNotifyToken,
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
            // Catch all errors
            .catch(function(error) {
                process.stdout.write('\n\nERROR ' + error.message + ' ' + (error.parent ? "(" + error.parent.message + ")" : '') + '\n');
                process.exit(1);
            });
    }
};
