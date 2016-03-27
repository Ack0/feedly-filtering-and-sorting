module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        deploy: grunt.file.isFile('deploy.json') ? grunt.file.readJSON('deploy.json') : { path: "" },
        ts: {
            default: {
                tsconfig: true,
                options: {
                    removeComments: false,
                    sourceMap: false
                }
            }
        },
        'string-replace': {
            'ts': {
                files: [{
                    expand: true,
                    cwd: 'target/',
                    src: ['**'],
                    dest: 'target/'
                }],
                options: {
                    replacements: [
                        {
                            pattern: /\/\/\/[^\r\n]*[\r\n]+/ig,
                            replacement: ''
                        }, {
                            pattern: /[^\r\n]*=\srequire\([^\r\n]*\s*/ig,
                            replacement: ''
                        }
                    ]
                }
            }
        },
        concat: {
            script: {
                src: ['Header.js', 'target/*.js'],
                dest: 'script/<%= pkg.name %>.js'
            }
        },
        copy: {
            deploy: {
                src: 'script/<%= pkg.name %>.js',
                dest: '<%= deploy.path %>',
                filter: function(filepath) {
                    var dest = grunt.config('copy.deploy.dest');
                    return dest !== "";
                }
            }
        },
        watch: {
            files: grunt.file.readJSON('tsconfig.json').files,
            tasks: ['default'],
            options: {
                interrupt: true
            }
        }
    });

    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['ts', 'string-replace:ts', 'concat:script', 'copy:deploy']);
};
