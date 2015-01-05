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

            // If data.forkProject && data.upstreamProject are already set, moving on
            if (data.forkProject && data.upstreamProject) {
                return deferred.resolve();
            }

            var config = ini.parse(fs.readFileSync(gitConfigPath, 'utf-8'));
            var origin = config['remote "origin"'];
            var upstream = config['remote "upstream"'];

            if (!origin || !origin.url || !upstream || !upstream.url) {
                return deferred.reject(new Error('Failed to find origin or upstream remote in project git config'));
            }

            var projectNamePattern = /[\w@.]+:(.+)\.git/i;
            var originMatch = origin.url.match(projectNamePattern);
            var upstreamMatch = upstream.url.match(projectNamePattern);

            if (!originMatch || !originMatch[1] || !upstreamMatch || !upstreamMatch[1]) {
                return deferred.reject(new Error('Failed to parse and find origin or upstream project name'));
            }

            if (!data.forkProject) {
                data.forkProject = originMatch[1];
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

                if (data.forkBranch) {
                    return deferred.resolve();
                }

                this.exec('rev-parse --abbrev-ref HEAD')
                    .then(function(forkBranch) {
                        data.forkBranch = forkBranch.replace(/(\r\n|\n|\r)/gm, "");
                        deferred.resolve();
                    })
                    .catch(function(error) {
                        deferred.reject(new Error('Failed to get the current branch'));
                    });

                return deferred.promise;
            }.bind(this));
    }
};
