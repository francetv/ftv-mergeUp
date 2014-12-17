var GitWrapper = require('git-wrapper'),
    rsvp = require('rsvp');

var gitWrapper = new GitWrapper();

modules.exports = {
    exec: function exec() {
        var deferred = RSVP.defer();
        var args = [].slice.call(arguments);

        args.push(function(error, result) {
            if (error) {
                return deferred.reject(error);
            }
            deferred.resolve(result);
        });

        gitWrapper.exec.apply(gitWrapper, args);

        return deferred.promise;
    }
};
