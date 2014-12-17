var Hipchatter = require('hipchatter'),
    RSVP = require('rsvp');

var git = require('./git'),
    config = require('./config.json'),
    hipchat = new Hipchatter(config.hipchatUserToken),
    gitlab = require('./gitlab');

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
                return git.exec('fetch', ['upstream']).catch(function(error) {
                    var stepError = new Error('GIT - fetch failed');
                    stepError.parent = error;
                    throw stepError;
                });
            })
            // Rebase the working branch
            .then(function(result) {
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
                return git.exec('push', ['origin', data.forkBranch, '-f']).catch(function(error) {
                    var stepError = new Error('GIT - push failed');
                    stepError.parent = error;
                    throw stepError;
                });
            })
            // Get gitlab projectID for the fork
            .then(function() {
                return gitlab.getProjectId(data.forkProject).catch(function(error) {
                    var stepError = new Error('GITLAB - getProjectId(fork) failed');
                    stepError.parent = error;
                    throw stepError;
                });
            })
            // Get gitlab projectID for the upstream
            .then(function(forkId) {
                data.forkProjectId = forkId;
                return gitlab.getProjectId(data.upstreamProject).catch(function(error) {
                    var stepError = new Error('GITLAB - getProjectId(upstream) failed');
                    stepError.parent = error;
                    throw stepError;
                });
            })
            // Store previous promise result (upstream projectID)
            .then(function(upstreamId) {
                data.upstreamProjectId = upstreamId;
            })
            // Create/Update the merge request on GitLab
            .then(function() {
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
                var mergeRequestIid = params.mergeRequest.iid;
                var mergeRequestUrl = config.projectBaseUrl + upstreamProject + '/merge_requests/' + mergeRequestIid + '/diffs';
                var message = '@here ' + ((params.isNew) ? 'New' : 'Updated') + ' merge request on ' + upstreamProject + ': <a href="' + mergeRequestUrl + '">' + args.title + '</a>';

                hipchat.notify(config.hipchatRoomId, {
                    message: message,
                    color: 'green',
                    token: config.hipchatNotifyToken,
                    notify: true
                }, function(err) {
                    if (err === null) {
                        process.stdout.write('Successfully notified the room for merge request #' + mergeRequestIid + '.');
                    } else {
                        var stepError = new Error('HIPCHAT - notification failed');
                        stepError.parent = error;
                        throw stepError;
                    }
                });
            })
            // Catch all errors
            .catch(function(error) {
                process.stdout.write('ERROR ' + error.message + ' ' + (error.parent ? "(" + error.parent.message + ")" : '') + '\n');
                process.exit(1);
            });
    }
};
