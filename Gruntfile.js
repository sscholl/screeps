var fs   = require("fs");
var path = require("path");

module.exports = function(grunt) {
    function getPrivateSettings(grunt) {
        var location = "./screeps.js";
        if (!grunt.file.exists(location)) {
            console.log("Can't find ./screeps.js, setting up...");

            grunt.file.write(location, fs.readFileSync(location+'.dist'));

            return false;
        } else {
            return require(location);
        }
    }

    require('load-grunt-tasks')(grunt);
    grunt.loadNpmTasks('grunt-screeps');

    grunt.initConfig({
        screeps: {
            options: {},
            dist: {
                src: ['dist/*.js']
            }
        }
    });

    var settings = getPrivateSettings(grunt);
    if (settings === false) {
        console.log("screeps setting file created. Please edit ./screeps.js with your settings, and re-run grunt");

        return;
    }

    grunt.config.merge(settings);

    grunt.registerTask('default', ['screeps']);
};
