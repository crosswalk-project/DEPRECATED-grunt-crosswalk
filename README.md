# grunt-crosswalk

grunt-crosswalk is a grunt plugin for packaging applications into an apk so they can be installed on an android device. It builds on top of the [crosswalk-app-tools](https://github.com/crosswalk-project/crosswalk-app-tools).

# License

Apache version 2, copyright Intel Corporation Ltd. See <em>LICENSE</em> for more details.

# Contributing

Bug reports and feature requests are encouraged: please
use the [github issue tracker for the project]
(https://github.com/crosswalk-project/grunt-crosswalk/issues)
to file them.

If you are interested in contributing code to the project, please see
the <em>HACKING.md</em> file. Pull requests should be targeted at the
master branch.

# Getting started

To use grunt-crosswalk in your own project, install it with:

    npm install grunt-crosswalk --save-dev

Once the plugin has been installed, enable it with a line of JavaScript in your Gruntfile.js:

    module.exports = function (grunt) {
      grunt.loadNpmTasks('grunt-crosswalk');

      // grunt.initConfig({ ... }) etc.
    };

grunt-crosswalk has been tested on:

*   Ubuntu Linux (64bit)

# Dependencies

grunt-crosswalk depends on the [crosswalk-app-tools]
(https://github.com/crosswalk-project/crosswalk-app-tools) and shares
its dependencies.

# General configuration

The [Android SDK](http://developer.android.com/sdk/index.html) should
be installed and setup up correctly, particularly the 'android' command
should be in the PATH.

# Tasks

You can list options in the *crosswalk* target.

## Example Gruntfile.js

```
  grunt.initConfig({
    ...
    packageInfo: grunt.file.readJSON('package.json'),
    ...
    crosswalk: {
      options: {
        verbose: true, // informative output, otherwise quiet

        debug: false, // includes output of rm and cp commands (-v option)

        version: '<%= packageInfo.version %>',

        // display name for the app on the device;
        // the sanitisedName used to construct the Locations object later
        // is derived from this
        name: '<%= packageInfo.name %>',

        // package for the app's generated Java files; this works best if
        // you have at least one period character between two character
        // strings, and no digits
        pkg: 'org.org01.webapps.<%= packageInfo.name.toLowerCase() %>',

        // the icon used in the android launcher/etc
        icon: 'icon_128.png',

        // path to the directory containing your HTML5 app;
        // note that this must use the correct path separators for your
        // platform: Windows uses '\\' while Linux uses '/'
        appRoot: 'build/xpk'
      },
     }
      ...
    },
    ...
  }
```
