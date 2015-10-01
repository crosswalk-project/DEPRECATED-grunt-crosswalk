module.exports = function (grunt) {
  var path = require('path');
  var which = require('which');
  var fs = require('fs');

  var Api = require('crosswalk-apk-generator');

  var generate_apk = function(target,done) {
    var data = target.data;
    var options = target.options();
    var outDir = data.outDir || options.outDir || '.';
    var appConfig = {};
    var envConfig = {};

    var envProperties = Object.keys(Api.Env.CONFIG_DEFAULTS);
    var copyProperties = function(hash) {
      // copy user-supplied properties into envConfig or appConfig
      Object.keys(hash).forEach(function(property){
        if (envProperties.indexOf(property)!=-1) {
          envConfig[property] = hash[property];
        } else {
          appConfig[property] = hash[property];
        }
      });
    };

    // get user-supplied properties
    copyProperties(options); // set crosswalk:options first
    copyProperties(data); // properties in target override options

    // automatically find androidSDKDir from 'android' command in PATH
    if (!envConfig.androidSDKDir) {
      var androidPath = which.sync('android');
      // up two directories
      envConfig.androidSDKDir = path.dirname(path.dirname(androidPath));
    }

    if (!envConfig.xwalkAndroidDir) {
      var fromEnvVar = process.env.XWALK_APP_TEMPLATE;
      if (fromEnvVar) {
        envConfig.xwalkAndroidDir = fromEnvVar;
      } else {
        grunt.log.error('No xwalk app template specified. Use xwalkAndroidDir in Gruntfile.js or XWALK_APP_TEMPLATE.');
        done(false);
      }
    }

    // determine arch from xwalkAndroidDir/native_libs/
    // only if arch specified (ie not shared)
    if (envConfig.arch && envConfig.xwalkAndroidDir) {
      var nativeLibs = path.join(envConfig.xwalkAndroidDir,'native_libs');
      var arches;
      try {
        arches = fs.readdirSync(nativeLibs);
      } catch(err) {
        grunt.log.error('Error looking for $XWALK_APP_TEMPLATE/native_libs.');
        grunt.log.error('Did you set XWALK_APP_TEMPLATE correctly?');
        grunt.log.error(err);
        done(false);
        return;
      }

      var archIsFound = false;
      var archIndex=0;
      while (!archIsFound && archIndex<arches.length) {
        var foundArch = arches[archIndex].slice(0,3);
        var specified = envConfig.arch.slice(0,3);
        archIsFound = (foundArch==specified);
        archIndex++;
      }

      if (!archIsFound) {
        grunt.log.error('\'arch\' property set to ('+specified+') in Gruntfile.js, but no app template for that architecture found.');
        grunt.log.error('architectures found :', arches);
        grunt.log.error('have you set xwalkAndroidDir property or XWALK_APP_TEMPLATE correctly?');
        grunt.log.error('XWALK_APP_TEMPLATE: ', process.env.XWALK_APP_TEMPLATE);
        done(false);
        return;
      }
    }

    var logger = grunt.log;
    logger.log = logger.write; // Api.CommandRunner calls logger.log()

    var commandRunner = Api.CommandRunner(data.verbose, logger);

    // create a promise for a configured Env object
    var envPromise = Api.Env(envConfig, {commandRunner: commandRunner});

    // create a promise for a configured App object
    var appPromise = Api.App(appConfig);

    // use the Q promises library to synchronise the promises, so we
    // can create the objects in "parallel"
    Api.Q.all([envPromise, appPromise])
    .then(
      function (objects) {
        // once the App and Env are constructed, use the Env instance
        // to do a build for the App instance
        var env = objects[0];
        var app = objects[1];

        // create a Locations object for this App instance
        var locations = Api.Locations(app, env, outDir);

        // run the build
        return env.build(app, locations);
      }
    )
    .done(
      // success
      function (finalApk) {
        grunt.log.writeln('\n*** DONE\n    output apk path is ' + finalApk);
        done();
      },

      // error handler
      function (err) {
        grunt.log.error('!!! ERROR');
        grunt.log.error(err.stack);
        done(false);
      }
    );
  };

  /**
  * Build an apk
  *
  * Deps: 
  *
  * Configuration options:
  *
  *   config options are inhereted automatically from
  *   crosswalk-apk-generator, so please see it's README for more info
  *
  *   Note that there is no need to separate them into 'env' or 'app',
  *   but they can be shared between grunt targets by putting them
  *   in the 'crosswalk:options' property.
  *
  */
  grunt.registerMultiTask('crosswalk', 'Tasks for generating apk packages for crosswalk on Android', function (identifier) {
    var done = this.async();

    generate_apk(this, done);
  });

};

