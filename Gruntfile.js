module.exports = function(grunt) {
    var files = grunt.file.readJSON('compile.json').files;
    var srcFiles = [], targetFiles = [], srcReplacements = [];
    files.forEach(function(file) {
        srcFiles.push("src/" + file + ".ts");
        targetFiles.push("target/" + file + ".js");
        srcReplacements.push({
            pattern: new RegExp(file + "_[0-9]+\.", "ig"),
            replacement: ''
        });
    });

    var templates = grunt.file.readJSON('templates.json');
    var replacements = [];
    templates.forEach((template) => {
        var templateString = grunt.file.read(template.file).replace(/\s+/g, ' ').replace(/"/g, "'");
        var replacement = {};
        replacement.pattern = new RegExp('("' + template.name + '"\s*:)[^,\r\n]+', 'i');
        replacement.replacement = '$1 "' + templateString + '"';
        replacements.push(replacement);
    });

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
        watch: {
            files: ['resources/Header.js', 'resources/style.css', 'resources/settings.html', 'Gruntfile.js'].concat(srcFiles),
            tasks: ['default'],
            options: {
                interrupt: true
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
                        },
                        {
                            pattern: /\s*exports\.[^=|;]*=[^;{]*;/ig,
                            replacement: ''
                        },
                        {
                            pattern: /= new[^(\.]*\./ig,
                            replacement: '= new '
                        },
                        {
                            pattern: /exports\./g,
                            replacement: 'exported.'
                        }
                    ].concat(srcReplacements)
                }
            },
            'templates': {
                files: [{src: 'target/Templates.js', dest: 'target/Templates.js'}],
                options: {
                    replacements: replacements
                }
            }
        },
        concat: {
            script: {
                src: ['resources/Header.js'].concat(targetFiles),
                dest: 'script/<%= pkg.name %>.user.js'
            }
        },
        copy: {
            deploy: {
                src: 'script/<%= pkg.name %>.user.js',
                dest: '<%= deploy.path %>',
                filter: function(filepath) {
                    var dest = grunt.config('copy.deploy.dest');
                    return dest !== "";
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['ts', 'string-replace:ts', 'string-replace:templates', 'concat:script', 'copy:deploy']);
};
