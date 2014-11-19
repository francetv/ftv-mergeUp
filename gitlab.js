var request = require('request');
var rsvp = require('rsvp');
var config = require('./config.json');
// /projects/:id/merge_requests
var apiPrefix = 'https://gitlab.ftven.net/api/v3/';

function createMergeRequest(forkProjectId, upstreamProjectId, forkBranch, uptsreamBranch, title) {
    return rsvp.Promise.resolve()
        .then(function() {
            console.log('requesting');
            var options = {
                url: apiPrefix + 'projects/' + forkProjectId + '/merge_requests/',
                body: {
                    source_project_id: forkProjectId,
                    target_project_id: upstreamProjectId,
                    source_branch: forkBranch,
                    target_branch: uptsreamBranch,
                    title: title,
                    private_token: config.gitlabPrivateToken
                },
                json: true
            };
            var deferred = rsvp.defer();
            console.log(options);
            request.post(
                options,
                function(error, response, body) {
                    console.log('result: ', body);
                    console.log('result type: ', typeof body);
                    console.log('response: ', response.code);
                    if (error) {
                        return deferred.reject(error);
                    }
                    if (body.message) {
                        return deferred.reject(body.message);
                    }

                    if (!Object.keys(body).length) {
                        return deferred.reject(new Error('Empty answer'));
                    }

                    deferred.resolve(body.iid);
                }
            );

            return deferred.promise;
        });
}

function getProjectId(project) {
    //TODO: get this id with the name
    return project;
}

module.exports = {
    createMergeRequest: createMergeRequest,
    getProjectId: getProjectId
};