/// <vs BeforeBuild='default' />

module.exports = function (grunt) {
    "use strict";

    grunt.initConfig({

        tv4: {
            catalog: {
                options: {
                    root: grunt.file.readJSON("schemas/json/schema-catalog.json")
                },
                src: ["api/json/catalog.json"]
            },

            schemas: {
                options: {
                    fresh: true,
                    root: grunt.file.readJSON("test/hyper-schema.json"),
                },
                src: ["schemas/json/*.json"]
            }
        }
    });

    // Dynamically load schema validation based on the files and folders in /test/
    var fs = require("fs");
    var dir = "test";
    var files = fs.readdirSync(dir);

    files.forEach(function (file) {

        // If it's a file, ignore and continue. We only care about folders.
        if (file.indexOf('.') > -1)
            return;

        var schema = grunt.file.readJSON("schemas/json/" + file + ".json");

        grunt.config.set("tv4." + file, {
            options: {
                root: schema
            },
            src: [ dir + "/" + file + "/*.json"]
        });
    });

    grunt.loadNpmTasks("grunt-tv4");

    grunt.registerTask("default", ["tv4"]);
};