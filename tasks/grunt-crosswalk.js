module.exports = function (grunt) {
  var spawnSync = require('child_process').spawnSync;

  var Path = require('path');

  var cat = require("crosswalk-app-tools");

  /**
  * Output class (implements OutputIface) that
  * silently swallows all the messages.
  */
  function SilentOutput() {
    cat.OutputIface.apply(this, arguments);
  }

  SilentOutput.prototype = Object.create(cat.OutputIface.prototype);
  SilentOutput.prototype.constructor = SilentOutput;

  SilentOutput.prototype.error =
  function(message) {};

  SilentOutput.prototype.warning =
  function(message) {};

  SilentOutput.prototype.info =
  function(message) {};

  SilentOutput.prototype.highlight =
  function(message) {};

  SilentOutput.prototype.write =
  function(message) {};

  var generate_apk = function(target,done) {
    var data = target.data;
    var options = target.options();

    var projectRoot = process.cwd();

    function build() {
      var promise = new Promise(function (resolve, reject) {
        if (options.verbose) {
          console.log('building and packaging ' + options.pkg);
        }

        var dir = Path.join(projectRoot, options.pkg);
        
        cat.Application.call(cat.main, dir, null);

        if (!options.verbose) {
          cat.main.output = new SilentOutput();
        }

        cat.main.build(null, null, function (errno) {
          if (errno != 0) {
            console.log("Create failed with error " + errno);
            reject();
          } else {
            resolve();
          }
        });
      });

      return promise;
    }

    function create() {
      var promise = new Promise(function (resolve, reject) {
        if (options.verbose) {
          console.log('creating template crosswalk app');
        }

        cat.Application.call(cat.main, projectRoot, options.pkg);

        if (!options.verbose) {
          cat.main.output = new SilentOutput();
        }

        var args = {
          platforms: "android"
        };
        cat.main.create(options.pkg, args, function (errno) {
          if (errno != 0) {
            console.log("Create failed with error " + errno);
          } else {
            resolve();
          }
        });
      });

      return promise;
    }

    var cprmArgs = (options.debug?'-rv':'-r');

    create()
    .then(function () {
      if (options.verbose) {
        console.log('removing ' + options.pkg + '/app');
      }

      spawnSync('rm', [cprmArgs, 'app'], {cwd: options.pkg, stdio: 'inherit'});

      if (options.verbose) {
        console.log('copying from ' + options.appRoot + ' to ' + options.pkg + '/app');
      }

      spawnSync('cp', [cprmArgs, '../' + options.appRoot, 'app'], {cwd: options.pkg, stdio: 'inherit'});
    })
    .then(build)
    .then(function () {
      if (options.verbose) {
        console.log('removing ' + options.pkg + '/');
      }

      spawnSync('rm', [cprmArgs, options.pkg], {cwd: projectRoot, stdio: 'inherit'});
    });
  };

  /**
  * Build an apk
  */
  grunt.registerMultiTask('crosswalk', 'Tasks for generating apk packages for crosswalk on Android', function (identifier) {
    var done = this.async();

    generate_apk(this, done);
  });

};

