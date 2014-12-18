var request = require('request'),
    RSVP = require('rsvp'),
    config = require('./config').conf;

var apiPrefix = 'https://gitlab.ftven.net/api/v3/';

module.exports = {
    getMergeRequest: function createMergeRequest(data, title) {
        return RSVP.Promise.resolve()
            .then(function() {
                var options = {
                    url: apiPrefix + 'projects/' + data.upstreamProjectId + '/merge_requests/',
                    qs: {
                        state: 'opened',
                        private_token: config.gitlabPrivateToken
                    },
                    json: true
                };
                var deferred = RSVP.defer();
                request.get(
                    options,
                    function(error, response, body) {
                        if (error) {
                            return deferred.reject(error);
                        }
                        if (body.message) {
                            return deferred.reject(body.message);
                        }
                        if (!Object.keys(body).length) {
                            return deferred.reject(new Error('Empty answer'));
                        }

                        var mergeRequest;
                        body.some(function(MR) {
                            if (MR.title === title && MR.source_project_id === data.forkProjectId && MR.target_project_id === data.upstreamProjectId && MR.source_branch ===
                                data.forkBranch && MR.target_branch === data.upstreamBranch) {
                                mergeRequest = MR;
                                return true;
                            }

                            return false;
                        });

                        if (mergeRequest) {
                            return deferred.resolve(mergeRequest);
                        }

                        deferred.reject('No matching MR found');
                    }
                );

                return deferred.promise;
            });
    },
    createMergeRequest: function createMergeRequest(data, title) {
        return RSVP.Promise.resolve()
            .then(function() {
                var deferred = RSVP.defer();
                var options = {
                    url: apiPrefix + 'projects/' + data.forkProjectId + '/merge_requests/',
                    body: {
                        source_project_id: data.forkProjectId,
                        target_project_id: data.upstreamProjectId,
                        source_branch: data.forkBranch,
                        target_branch: data.upstreamBranch,
                        title: title,
                        private_token: config.gitlabPrivateToken
                    },
                    json: true
                };

                request.post(
                    options,
                    function(error, response, body) {
                        if (error) {
                            return deferred.reject(error);
                        }
                        if (body.message) {
                            return deferred.reject(body.message);
                        }

                        if (!Object.keys(body).length) {
                            return deferred.reject(new Error('Empty answer'));
                        }

                        deferred.resolve({
                            mergeRequest: body,
                            isNew: true
                        });
                    }
                );

                return deferred.promise;
            });
    },
    updateMergeRequest: function updateMergeRequest(mergeRequest, data, title) {
        return RSVP.Promise.resolve({
            mergeRequest: mergeRequest,
            isNew: false
        });
    },
    getProjectId: function getProjectId(projectName) {
        var deferred = RSVP.defer();
        var encodedProjectPath = encodeURIComponent(projectName);

        var options = {
            url: apiPrefix + 'projects/' + encodedProjectPath + '?private_token=' + config.gitlabPrivateToken,
            json: true
        };

        request.get(
            options,
            function(error, response, body) {
                if (error) {
                    return deferred.reject(error);
                }

                if (body.message) {
                    return deferred.reject(body.message);
                }

                if (!Object.keys(body).length) {
                    return deferred.reject(new Error('Empty answer'));
                }

                deferred.resolve(body.id);

            });
        return deferred.promise;
    }
};
