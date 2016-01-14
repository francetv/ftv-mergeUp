var GitWrapper = require('git-wrapper'),
    RSVP = require('rsvp'),
    fs = require('fs'),
    ini = require('ini');

var gitWrapper = new GitWrapper(),
    config = require('./config').conf;

module.exports = {
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
    },
    loadConfig: function loadConfig(data) {
        return this.loadProjectConfig(data)
            .then(function() {
                return this.loadBranchConfig(data);
            }.bind(this));
    },
    loadProjectConfig: function loadProjectConfig(data) {
        var deferred = RSVP.defer();

        var baseDir = process.cwd();
        var gitConfigPath = baseDir + '/.git/config';


        fs.exists(gitConfigPath, function(exists) {
            if (!exists) {
                return deferred.reject(new Error('Failed to load project git config file'));
            }

            // If data.upstreamProject are already set, moving on
            if (data.upstreamProject) {
                return deferred.resolve();
            }

            var config = ini.parse(fs.readFileSync(gitConfigPath, 'utf-8'));
            var upstream = config['remote "upstream"'];

            if (!upstream || !upstream.url) {
                return deferred.reject(new Error('Failed to find upstream remote in project git config'));
            }

            var projectNamePattern = /[\w@.]+:(.+)\.git/i;
            var upstreamMatch = upstream.url.match(projectNamePattern);

            if (!upstreamMatch || !upstreamMatch[1]) {
                return deferred.reject(new Error('Failed to parse and find upstream project name'));
            }

            if (!data.upstreamProject) {
                data.upstreamProject = upstreamMatch[1];
            }

            deferred.resolve();
        });

        return deferred.promise;
    },
    loadBranchConfig: function loadBranchConfig(data) {
        return RSVP.Promise.resolve()
            .then(function() {
                var deferred = RSVP.defer();

                if (data.upstreamBranch) {
                    return deferred.resolve();
                }

                if (!config.gitDefaultUpstreamBranch) {
                    return deferred.reject(new Error('Failed to get the default upstream branch, check your config file'));
                }

                data.upstreamBranch = config.gitDefaultUpstreamBranch;
                deferred.resolve();

                return deferred.promise;
            })
            .then(function() {
                var deferred = RSVP.defer();

                if (data.localBranch) {
                    return deferred.resolve();
                }

                this.exec('rev-parse --abbrev-ref HEAD')
                    .then(function(localBranch) {
                        data.localBranch = localBranch.replace(/(\r\n|\n|\r)/gm, "");
                        deferred.resolve();
                    })
                    .catch(function(error) {
                        deferred.reject(new Error('Failed to get the current branch'));
                    });

                return deferred.promise;
            }.bind(this));
    }
};
