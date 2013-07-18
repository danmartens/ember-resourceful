module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    
    concat: {
      options: {
        banner: '(function() {\n\n',
        footer: '\n}).call(this);'
      },
      dist: {
        src: [
          'src/resourceful.js',
          'src/resourceful.resource.js',
          'src/resourceful.resource_collection.js',
          'src/resourceful.resource_adapter.js'
        ],
        dest: 'dist/ember-resourceful.js'
      }
    },
    
    shell: {
      mochaPhantom: {
        command: 'clear && mocha-phantomjs -R dot test/runner.html',
        options: {
          stdout: true
        }
      }
    },

    watch: {
      scripts: {
        files: ['src/*.js', 'test/*.js'],
        tasks: ['test']
      }
    }
  });
  
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-watch');
  
  grunt.registerTask('default', ['concat']);
  grunt.registerTask('test', ['shell:mochaPhantom']);
};