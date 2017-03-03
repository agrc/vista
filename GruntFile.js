module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    var deployFiles = [
        '**',
        '!**/*.uncompressed.js',
        '!**/*consoleStripped.js',
        '!**/bootstrap/less/**',
        '!**/bootstrap/test-infra/**',
        '!**/tests/**',
        '!build-report.txt',
        '!components-jasmine/**',
        '!favico.js/**',
        '!jasmine-favicon-reporter/**',
        '!jasmine-jsreporter/**',
        '!stubmodule/**',
        '!util/**'
    ];
    var bumpFiles = [
        'package.json',
        'bower.json',
        'lib/app/package.json',
        'lib/app/config.js'
    ];
    var deployDir = 'wwwroot/vista';
    var jsAppFiles = 'lib/app/**/*.js';
    var gruntFile = 'GruntFile.js';
    var jsFiles = [
        jsAppFiles,
        gruntFile,
        'profiles/**/*.js'
    ];
    var otherFiles = [
        'lib/app/**/*.html',
        'lib/app/**/*.css',
        'lib/index.html',
        'lib/ChangeLog.html'
    ];
    var secrets;
    try {
        secrets = grunt.file.readJSON('secrets.json');
    } catch (e) {
        // swallow for build server

        // still print a message so you can catch bad syntax in the secrets file.
        grunt.log.write(e);

        secrets = {
            stage: {
                host: '',
                username: '',
                password: ''
            },
            prod: {
                host: '',
                username: '',
                password: ''
            }
        };
    }

    grunt.initConfig({
        babel: {
            options: {
                sourceMap: true,
                presets: ['latest']
            },
            src: {
                files: [{
                    expand: true,
                    cwd: 'lib/app/',
                    src: ['**/*.js'],
                    dest: 'src/app/'
                }]
            }
        },
        bump: {
            options: {
                files: bumpFiles,
                commitFiles: bumpFiles.concat('lib/ChangeLog.html'),
                push: false
            }
        },
        clean: {
            build: ['dist'],
            deploy: ['deploy'],
            src: ['src/app']
        },
        compress: {
            main: {
                options: {
                    archive: 'deploy/deploy.zip'
                },
                files: [{
                    src: deployFiles,
                    dest: './',
                    cwd: 'dist/',
                    expand: true
                }]
            }
        },
        connect: {
            uses_defaults: { // eslint-disable-line camelcase
            }
        },
        copy: {
            dist: {
                src: 'src/ChangeLog.html',
                dest: 'dist/ChangeLog.html'
            },
            src: {
                expand: true,
                cwd: 'lib',
                src: ['**/*.html', '**/*.css', 'secrets.json', 'app/package.json'],
                dest: 'src'
            }
        },
        dojo: {
            prod: {
                options: {
                    profiles: ['profiles/prod.build.profile.js', 'profiles/build.profile.js']
                }
            },
            stage: {
                options: {
                    profiles: ['profiles/stage.build.profile.js', 'profiles/build.profile.js']
                }
            },
            options: {
                dojo: 'src/dojo/dojo.js',
                load: 'build',
                releaseDir: '../dist',
                requires: ['src/app/run.js', 'src/app/packages.js'],
                basePath: './src'
            }
        },
        eslint: {
            options: {
                configFile: '.eslintrc'
            },
            main: {
                src: jsFiles
            }
        },
        jasmine: {
            main: {
                options: {
                    specs: ['src/app/**/Spec*.js'],
                    vendor: [
                        'src/jasmine-favicon-reporter/vendor/favico.js',
                        'src/jasmine-favicon-reporter/jasmine-favicon-reporter.js',
                        'src/jasmine-jsreporter/jasmine-jsreporter.js',
                        'src/app/tests/jasmineTestBootstrap.js',
                        'src/dojo/dojo.js',
                        'src/app/packages.js',
                        'src/app/tests/jasmineAMDErrorChecking.js'
                    ],
                    host: 'http://localhost:8000'
                }
            }
        },
        processhtml: {
            options: {},
            main: {
                files: {
                    'dist/index.html': ['src/index.html']
                }
            }
        },
        secrets: secrets,
        sftp: {
            stage: {
                files: {
                    './': 'deploy/deploy.zip'
                },
                options: {
                    host: '<%= secrets.stageHost %>'
                }
            },
            prod: {
                files: {
                    './': 'deploy/deploy.zip'
                },
                options: {
                    host: '<%= secrets.prodHost %>'
                }
            },
            options: {
                path: './' + deployDir + '/',
                srcBasePath: 'deploy/',
                username: '<%= secrets.username %>',
                password: '<%= secrets.password %>',
                showProgress: true
            }
        },
        sshexec: {
            options: {
                username: '<%= secrets.username %>',
                password: '<%= secrets.password %>'
            },
            stage: {
                command: ['cd ' + deployDir, 'unzip -o deploy.zip', 'rm deploy.zip'].join(';'),
                options: {
                    host: '<%= secrets.stageHost %>'
                }
            },
            prod: {
                command: ['cd ' + deployDir, 'unzip -o deploy.zip', 'rm deploy.zip'].join(';'),
                options: {
                    host: '<%= secrets.prodHost %>'
                }
            }
        },
        watch: {
            src: {
                files: jsFiles.concat(otherFiles),
                options: { livereload: true },
                tasks: ['eslint', 'jasmine:main:build', 'newer:babel', 'newer:copy:src']
            }
        }
    });

    grunt.registerTask('default', [
        'eslint',
        'clean:src',
        'babel',
        'copy:src',
        'connect',
        'jasmine:main:build',
        'watch'
    ]);
    grunt.registerTask('build-prod', [
        'clean:src',
        'babel',
        'copy:src',
        'clean:build',
        'dojo:prod',
        'copy:dist',
        'processhtml'
    ]);
    grunt.registerTask('deploy-prod', [
        'clean:deploy',
        'compress:main',
        'sftp:prod',
        'sshexec:prod'
    ]);
    grunt.registerTask('build-stage', [
        'clean:src',
        'babel',
        'copy:src',
        'clean:build',
        'dojo:stage',
        'copy:dist',
        'processhtml'
    ]);
    grunt.registerTask('deploy-stage', [
        'clean:deploy',
        'compress:main',
        'sftp:stage',
        'sshexec:stage'
    ]);
};
