module.exports = function (grunt) {
  const os = require('os');
  const path = require('path');
  require('time-grunt')(grunt);

  // Pull defaults (including username and password) from .screeps.json
  const config = require('./.screeps.json');

  // Allow grunt options to override default configuration
  const token = grunt.option('token') || config.token;
  const email = grunt.option('email') || config.email;
  const ip = grunt.option('ip') || config.ip;
  const port = grunt.option('port') || config.port;
  const branch = grunt.option('branch') || config.branch;
  const ptr = grunt.option('ptr') ? true : config.ptr

  // Construct the private_directory dynamically
  const username = os.userInfo().username; // Gets the current username
  const private_directory_base = path.join("C:", "Users", username, "AppData", "Local", "Screeps", "scripts");
  const server_ip_formatted = ip.replace(/\./g, '_');
  const private_directory = path.join(private_directory_base, `${server_ip_formatted}___${port}`, branch);

  const currentdate = new Date();
  grunt.log.subhead('Task Start: ' + currentdate.toLocaleString())
  grunt.log.writeln('Branch: ' + branch)

  // Load needed tasks
  grunt.loadNpmTasks('grunt-screeps')
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-file-append')
  grunt.loadNpmTasks("grunt-jsbeautifier")
  grunt.loadNpmTasks("grunt-rsync")

  grunt.initConfig({
    screeps: {
      options: {
        email: email,
        token: token,
        branch: branch,
        //server: 'season'
      },
      dist: {
        src: ['dist/*.js']
      }
    },

    // Copy all source files into the dist folder, flattening the folder
    // structure by converting path delimiters to underscores
    copy: {
      // Pushes the game code to the dist folder so it can be modified before
      // being send to the screeps server.
      screeps: {
        files: [{
          expand: true,
          cwd: 'src/',
          src: '**',
          dest: 'dist/',
          filter: 'isFile',
          rename: function (dest, src) {
            // Change the path name utilize underscores for folders
            return dest + src.replace(/\//g,'.');
          }
        }],
      },
      // New task for copying to private server directory
      private: {
          files: [
              {
                  expand: true,
                  cwd: 'dist/',
                  src: ['**/*'], // Copy all files and subfolders
                  dest: private_directory, // Destination path
                  dot: true // Include dotfiles
              }
          ]
      }

    },


    // Copy files to the folder the client uses to sink to the private server.
    // Use rsync so the client only uploads the changed files.
    rsync: {
        options: {
            args: ["--verbose", "--checksum"],
            exclude: [".git*"],
            recursive: true
        },
        private: {
            options: {
                src: './dist/',
                dest: private_directory
            }
        },
    },


    // Add version variable using current timestamp.
    file_append: {
      versioning: {
        files: [
          {
            append: "\nglobal.SCRIPT_VERSION = "+ currentdate.getTime() + "\n",
            input: 'dist/version.js'
          }
        ]
      }
    },

    // Remove all files from the dist folder.
    clean: {
      'dist': ['dist']
    },

    // Apply code styling
    jsbeautifier: {
      modify: {
        src: ["src/**/*.js"],
        options: {
          config: '.jsbeautifyrc'
        }
      },
      verify: {
        src: ["src/**/*.js"],
        options: {
          mode: 'VERIFY_ONLY',
          config: '.jsbeautifyrc'
        }
      }
    }
  })

  // Combine the above into a default task
  grunt.registerTask('default',  ['clean', 'copy:screeps',  'file_append:versioning', 'screeps']);
  grunt.registerTask('private',  ['clean', 'copy:screeps',  'file_append:versioning', 'copy:private']);
  grunt.registerTask('test',     ['jsbeautifier:verify']);
  grunt.registerTask('pretty',   ['jsbeautifier:modify']);
}
