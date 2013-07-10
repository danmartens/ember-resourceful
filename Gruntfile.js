module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

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

  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('test', ['shell:mochaPhantom']);
};