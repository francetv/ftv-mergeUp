var Git = require('git-wrapper');
var git = new Git({});
var config = require('./config.json');
var Hipchatter = require('hipchatter');
var hipchat = new Hipchatter(config.hipchatUserToken);
var gitlab = require('./gitlab');
var RSVP = require('rsvp');

/*
things to define globally :
    - gitlab user id
    - target project id
    - hipchat user token
*/

function gitExec() {
    var deferred = RSVP.defer();

    var args = [].slice.call(arguments);

    args.push(function(error, result) {
        if (error) {
            return deferred.reject(error);
        }
        deferred.resolve(result);
    });

    git.exec.apply(git, args);

    return deferred.promise;
}

function automateMergeRequest(forkProject, upstreamProject, forkBranch, upstreamBranch, title) {
    var data = {};

    RSVP.Promise.resolve()

    // LOCAL COLLECT DATA:
    .then(function() {
        data.forkBranch = forkBranch;
        data.upstreamBranch = upstreamBranch;
    })

    // LOCAL GIT:

    // fetch
    // .then(function() {
    //     return gitExec('fetch', ['upstream']);
    // })
    // // rebase my branch
    // .then(function(result) {
    //     return gitExec('rebase', ['upstream/' + config.upstreamBranch])
    //         .catch(function(error) {
    //             gitExec('rebase', ['--abort']).then(function() {
    //                 var rebaseError = new Error('Rebase failed');
    //                 rebaseError.parent = error;
    //                 throw rebaseError;
    //             });
    //         });
    // })
    // // push
    // .then(function(result) {
    //     return gitExec('push', ['origin']);
    // })

    // GITLAB :
    // Get gitlab data
    .then(function() {
        data.forkProjectId = gitlab.getProjectId(forkProject);
        data.upstreamProjectId = gitlab.getProjectId(upstreamProject);
    })
    // send merge request gitlab
    .then(function() {
        var mergeRequestId;
        return gitlab.createMergeRequest(
            data.forkProjectId, // jrt's fork of jqp source project id
            data.upstreamProjectId, // jqp target project id
            data.forkBranch, // source branch
            data.upstreamBranch, // target branch
            title
        );        
    })
    // send hipchat message
    .then(function(mergeRequestId) {
        var mergeRequestUrl =  'https://gitlab.ftven.net/player/js_jquery_player/merge_requests/' + mergeRequestId + '/diffs';

        hipchat.notify(config.hipchatRoomId, {
            message: '@here new merge request: <a href="' + mergeRequestUrl + '">test' + title + '</a>',
            color: 'green',
            token: 'YZ95s6ZhzpxaIgAd26nsAKkUJZrNsvKbPx6rM2GJ'
        }, function(err) {
            if (err == null) {
                console.log('Successfully notified the room.');
            } else {
                console.log('Error : ', err);
            }
        });
    })
    .catch(function(error) {
        console.error(error);
        process.exit(1);
    });
}

module.exports = automateMergeRequest;
