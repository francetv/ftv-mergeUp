var RSVP = require('rsvp'),
    fs = require('fs'),
    extend = require('util')._extend;

var baseConfig = require('../config.json');

var baseDir = process.cwd();
var customConfigPath = baseDir + '/mergeUpConf.json';

module.exports = {
    conf: {},
    init: function init() {
        var deferred = RSVP.defer();

        this.conf = extend(this.conf, baseConfig);

        fs.exists(customConfigPath, function(exists) {
            if (!exists) {
                return deferred.reject(new Error('Can\'t find the mergeUpConf.json file'));
            }

            this.conf = extend(this.conf, require(customConfigPath));

            if (!this.conf.gitDefaultUpstreamBranch) {
                return deferred.reject(new Error('Missing mandatory option \'gitDefaultUpstreamBranch\' on your mergeUpConf file'));
            }

            if (!this.conf.gitlabPrivateToken) {
                return deferred.reject(new Error('Missing mandatory option \'gitlabPrivateToken\' on your mergeUpConf file'));
            }

            deferred.resolve();
        }.bind(this));

        return deferred.promise;
    }
};
