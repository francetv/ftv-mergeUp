var RSVP = require('rsvp'),
    inquirer = require("inquirer"),
    fs = require('fs'),
    extend = require('util')._extend;

var baseDir = process.cwd();
var configPath = baseDir + '/mergeUpConf.json';

var mandatoryAttributes = [
    'gitDefaultUpstreamBranch',
    'gitlabPrivateToken'
];
var missingAttributes = [];

var init = {
    init: function() {
        var conf = {};
        RSVP.Promise.resolve()
            .then(function() {
                var deferred = RSVP.defer();

                fs.exists(configPath, function(exists) {
                    if (exists) {
                        try {
                            conf = require(configPath);
                            deferred.resolve();
                        } catch (e) {
                            inquirer.prompt([{
                                type: 'confirm',
                                name: 'unreadableConfig',
                                message: 'ERROR - The config file isn\'t readable, would you want to overwrite it?',
                                default: true
                            }], function(answers) {
                                if (!answers.unreadableConfig) {
                                    return deferred.reject(new Error('The config file isn\'t readable'));
                                }

                                deferred.resolve();
                            });
                        }
                    }

                    deferred.resolve();
                });

                return deferred.promise;
            })
            .then(function() {
                mandatoryAttributes.forEach(function(attribute) {
                    if (!conf[attribute]) {
                        missingAttributes.push(attribute);
                    }
                });
            })
            .then(function() {
                return init.ask();
            })
            .then(function(data) {
                var deferred = RSVP.defer();

                data = extend(conf, data);

                fs.writeFile(configPath, JSON.stringify(data), function(error) {
                    if (error) {
                        return deferred.reject(error);
                    }

                    return deferred.resolve();
                });
            })
            .then(function() {
                process.stdout.write('\nYour conf is correct, now just run mergeUp\n');
            })
            // Catch all errors
            .catch(function(error) {
                process.stdout.write('\n\nERROR ' + error.message + '\n');
                process.exit(1);
            });
    },
    ask: function(callback) {
        var deferred = RSVP.defer();
        var questions = [];
        var emptiedAnswer = false;

        missingAttributes.forEach(function(attribute) {
            questions.push({
                type: 'input',
                name: attribute,
                message: 'Value for \'' + attribute + '\' :'
            });
        });

        if (!questions.length || !missingAttributes.length) {
            return deferred.reject(new Error('An error occured during questions preparation (missingAttributes seems to be empty)'));
        }

        inquirer.prompt(questions, function(answers) {
            missingAttributes.forEach(function(attribute) {
                if (!answers[attribute]) {
                    emptiedAnswer = true;
                }
            });

            if (emptiedAnswer) {
                return deferred.reject(new Error('Answers can\'t be empty'));
            }

            deferred.resolve(answers);
        });

        return deferred.promise;
    }
};

module.exports = init;
