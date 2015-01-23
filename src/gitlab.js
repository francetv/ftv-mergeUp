var request = require('request'),
    RSVP = require('rsvp'),
    config = require('./config').conf;

var apiPrefix = 'https://gitlab.ftven.net/api/v3/';

module.exports = {
    getMergeRequest: function createMergeRequest(data) {
        return RSVP.Promise.resolve()
            .then(function() {
                var deferred = RSVP.defer();
                var options = {
                    url: apiPrefix + 'projects/' + data.upstreamProjectId + '/merge_requests/',
                    qs: {
                        state: 'opened',
                        private_token: config.gitlabPrivateToken
                    },
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

                        var mergeRequest;
                        body.some(function(MR) {
                            if (MR.iid == data.id) {
                                mergeRequest = MR;
                                return true;
                            }

                            if (MR.source_project_id === data.forkProjectId && MR.target_project_id === data.upstreamProjectId && MR.source_branch === data.forkBranch &&
                                MR.target_branch === data.upstreamBranch) {
                                data.title = data.title || MR.title;
                                mergeRequest = MR;
                                return true;
                            }

                            return false;
                        });

                        if (data.id && !mergeRequest) {
                            return deferred.reject(new Error('id ' + data.id + ' not found'));
                        }

                        return deferred.resolve(mergeRequest);
                    }
                );

                return deferred.promise;
            });
    },
    createMergeRequest: function createMergeRequest(data) {
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
                        title: data.title,
                        private_token: config.gitlabPrivateToken
                    },
                    json: true
                };

                if (!data.title) {
                    deferred.reject(new Error('Title can\'t be empty for a new MR'));
                } else {
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
                }

                return deferred.promise;
            });
    },
    updateMergeRequest: function updateMergeRequest(mergeRequest, data) {
        return RSVP.Promise.resolve().then(function() {
            var deferred = RSVP.defer();
            var options = {
                url: apiPrefix + 'projects/' + data.upstreamProjectId + '/merge_request/' + mergeRequest.id,
                body: {
                    title: data.title,
                    private_token: config.gitlabPrivateToken
                },
                json: true
            };

            request.put(
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
                        isNew: false
                    });
                }
            );

            return deferred.promise;
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
    },
    whoAmI: function whoAmI() {
        var deferred = RSVP.defer();

        var options = {
            url: apiPrefix + 'user?private_token=' + config.gitlabPrivateToken,
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

                deferred.resolve(body);

            });
        return deferred.promise;
    }
};
