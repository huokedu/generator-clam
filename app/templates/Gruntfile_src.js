/**
 * 本文件是 Gruntfile.js 默认模板，请根据需要和注释提示自行修改
 * 从这里获得最新版
 * https://github.com/jayli/generator-clam/blob/master/app/templates/Gruntfile_src.js
 */
var path = require('path'),
	fs = require('fs-extra'),
	exec = require('child_process').exec;

module.exports = function (grunt) {

	var file = grunt.file;
	var task = grunt.task;
	var pathname = path.basename(__dirname);
	var all_files = ['**/*.eot','**/*.otf','**/*.svg','**/*.ttf',
					'**/*.woff','**/*.html','**/*.htm','**/*.js',
					'**/*.less','**/*.css','**/*.png','**/*.gif',
					'**/*.jpg','!node_modules','!**/*/Gruntfile.js','**/*.sass'];

	// -------------------------------------------------------------
	// 任务配置
	// -------------------------------------------------------------
	
	// 如果 Gruntfile.js 编码为 gbk，打开此注释
	// grunt.file.defaultEncoding = 'gbk';
    grunt.initConfig({

		// 从 abc.json 中读取配置项
        pkg: grunt.file.readJSON('abc.json'),

		// 配置默认分支
		currentBranch: 'master',

        // 对build目录进行清理
        clean: {
            build: {
                src: 'build/*'
			}
        },

        /**
         * 将src目录中的KISSY文件做编译打包，仅解析合并，源文件不需要指定名称
		 * 		KISSY.add(<名称留空>,function(S){});
		 *
         * 		@link https://github.com/daxingplay/grunt-kmc
		 *
		 * 如果需要只生成依赖关系表，不做合并，样例代码:
         *   options: {
         *       packages: [
         *           {
         *               name: '<%= pkg.name %>',
         *               path: './src/',
		 *				charset:'utf-8',
		 *				ignorePackageNameInUri:true
         *           }
         *       ],
		 *		depFilePath: 'build/map.js',// 生成的模块依赖表
		 *		comboOnly: true,
		 *		fixModuleName:true,
		 *		comboMap: true,
         *   },
         *   main: {
         *       files: [
         *           {
		 *				// 这里指定项目根目录下所有文件为入口文件，自定义入口请自行添加
         *               src: [ 'src/** /*.js', '!src/** /* /Gruntfile.js'],
         *               dest: 'build/'
         *           }
         *       ]
         *   }
         */
        kmc: {
            options: {
                packages: [
                    {
                        name: '<%= pkg.name %>',
                        path: '../',
						charset:'utf-8'
                    }
                ],
				map: [['<%= pkg.name %>/src/', '<%= pkg.name %>/']]
            },
            main: {
                files: [
                    {
                        expand: true,
						cwd: 'src/',
                        src: [ '**/*.js', '!Gruntfile.js','!**/*/Gruntfile.js'],
                        dest: 'build/'
                    }
                ]
            }
			// 若有新任务，请自行添加
			/*
            "simple-example": {
                files: [
                    {
                        src: "a.js",
                        dest: "build/index.js"
                    }
                ]
            }
			*/
        },
		
		// 将css文件中引用的本地图片上传CDN并替换url，默认不开启
		mytps: {
			options: {
				argv: "--inplace"
			},
			all: [ 'src/**/*.css']
		},

		// CSS-Combo: 合并项目中所有css，通过@import "other.css" 来处理CSS的依赖关系
        css_combo: {
            options: {
                paths: './'
            },
            main: {
                files: [
                    {
                        expand: true,
						cwd:'build',
                        src: ['**/*.css'], 
                        dest: 'build/',
                        ext: '.css'
                    }
                ]
            }
        },
		// 静态合并HTML和抽取JS/CSS，解析juicer语法到vm/php/tms
		// https://npmjs.org/package/grunt-combohtml
		combohtml:{
			options:{
				encoding:'utf8',
				replacement:{
					from:/src\//,
					to:'build/'
				},
				// 本地文件引用替换为线上地址
				relative:'http://g.tbcdn.cn/<%= pkg.group %>/<%= pkg.name %>/<%= pkg.version %>/',
				comboJS:false, // 是否静态合并当前页面引用的本地js
				comboCSS:false, // 是否静态合并当前页面引用的css
				convert2vm:false,// 是否将juicer语法块转换为vm格式
				convert2php:false,// 是否将juicer语法块转换为php格式
				convert2tms:false// 是否将juicer语法块转换为tms格式
			},
			main:{
                files: [
                    {
                        expand: true,
						cwd:'build',
						// 对'*.htm'文件进行HTML合并解析
                        src: ['**/*.html'],
                        dest: 'build/',
                        ext: '.html'
                    }
                ]
			}
		},

		// FlexCombo服务配置
		// https://npmjs.org/package/grunt-flexcombo
		//
		// 注意：urls 字段末尾不能有'/'
		flexcombo:{
			// 源码调试服务
			server:{
				options:{
					proxyport:'<%= pkg.proxyPort %>',
					target:'src/',
					urls:'/<%= pkg.group %>/<%= pkg.name %>',
					port:'<%= pkg.port %>',
					proxyHosts:['demo'],
					servlet:'?',
					separator:',',
					charset:'utf8'
				}
			},
			// 目标代码调试服务
			debug:{
				options:{
					// 无线H5项目调试，可打开host配置，用法参照
					// https://speakerdeck.com/lijing00333/grunt-flexcombo
					target:'build/',
					proxyport:'<%= pkg.proxyPort %>', // 反向代理绑定当前主机的 proxyport 端口
					urls:'/<%= pkg.group %>/<%= pkg.name %>/<%= pkg.version %>',
					port:'<%= pkg.port %>',
					proxyHosts:['demo'],// 反向代理时本地虚机域名
					servlet:'?',
					separator:',',
					charset:'utf8',
					hosts:{
						"a.tbcdn.cn":"122.225.67.241", 
						"g.tbcdn.cn":"115.238.23.250",
						"g.assets.daily.taobao.net":"10.235.136.37"
					},
					filter:{
						'-min\\.js':'.js'
					}
				}
			}
		},
		
        // 编译LESS为CSS 
		// https://github.com/gruntjs/grunt-contrib-less
        less: {
            options: {
                paths: './'
            },
            main: {
                files: [
                    {
                        expand: true,
						cwd:'build/',
                        src: ['**/*.less'],
                        dest: 'build/',
                        ext: '.css'
                    }
                ]
            }
        },

        // 压缩JS https://github.com/gruntjs/grunt-contrib-uglify
        uglify: {
            options: {
				banner: '/*! Generated by Clam: <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd hh:MM:ss") %> */\n',
                beautify: {
                    ascii_only: true
                }
            },
            main: {
                files: [
                    {
                        expand: true,
                        cwd: 'build/',
                        src: ['**/*.js', '!**/*-min.js'],
                        dest: 'build/',
                        ext: '-min.js'
                    }
                ]
            }
        },

        // 压缩CSS https://github.com/gruntjs/grunt-contrib-cssmin
        cssmin: {
            main: {
                files: [
                    {
                        expand: true,
                        cwd: 'build/',
                        src: ['**/*.css', '!**/*-min.css'],
                        dest: 'build/',
                        ext: '-min.css'
                    }
                ]
            }
        },

		// 监听JS、CSS、LESS文件的修改
        watch: {
            'all': {
                files: ['src/**/*.js','src/**/*.css','src/**/*.less'],
                tasks: [ 'build' ]
            }
		},

		// 发布命令
		exec: {
			tag: {
				command: 'git tag publish/<%= currentBranch %>'
			},
			publish: {
				command: 'git push origin publish/<%= currentBranch %>:publish/<%= currentBranch %>'
			},
			commit:{
			   command: 'git commit -m "Clam Build: <%= currentBranch %> - <%= grunt.template.today("yyyy-mm-dd hh:MM:ss") %>"'
			},
			add: {
				command: 'git add .'	
			},
			prepub: {
				command: 'git push origin daily/<%= currentBranch %>:daily/<%= currentBranch %>'
			},
			grunt_publish: {
				command: 'grunt default:publish'
			},
			grunt_prepub:{
				command: 'grunt default:prepub'
			},
			new_branch: {
				command: 'git checkout -b daily/<%= currentBranch %>'
			}
		},

		// 拷贝文件
		copy : {
			main: {
				files:[
					{
						expand:true,
						src: all_files, 
						dest: 'build/', 
						cwd:'src/',
						filter: 'isFile'
					}
				]
			}
		},
		// 替换config中的版本号@@version
		replace: {
			dist: {
				options: {
					variables: {
						'version': '<%= pkg.version %>'
					},
					prefix:'@@'
				},
				files: [
					{
						expand: true, 
                        cwd: 'build/',
                        dest: 'build/',
						src: ['**/*']
					}
				]
			}
		}

		// 下面这两个任务，根据需要自行开启

		// 合并文件
		/*
		concat: {
			dist: {
				src: ['from.css'],
				dest: 'build/to.css'
		
			}
		},
		*/

		// YUIDoc: 对build目录中的js文件生成文档，放入doc/中
		/*
		yuidoc: {
			compile: {
				name: 'generator-clam',
				description: 'A Clam generator for Yeoman',
				options: {
					paths: 'build/',
					outdir: 'doc/'
				}
			}
		}
		*/

    });

	// -------------------------------------------------------------
	// 载入模块
	// -------------------------------------------------------------
	
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-css-combo');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-kmc');
	grunt.loadNpmTasks('grunt-exec');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-mytps');
	grunt.loadNpmTasks('grunt-flexcombo');
	grunt.loadNpmTasks('grunt-replace');
	grunt.loadNpmTasks('grunt-combohtml');

	// 根据需要打开这些配置
    //grunt.loadNpmTasks('grunt-kissy-template');
    //grunt.loadNpmTasks('grunt-contrib-connect');
	//grunt.loadNpmTasks('grunt-contrib-concat');
	//grunt.loadNpmTasks('grunt-contrib-yuidoc');

	// -------------------------------------------------------------
	// 注册Grunt子命令
	// -------------------------------------------------------------
	
	/**
	 * 正式发布
	 */
	grunt.registerTask('publish', 'clam 正式发布', function() {
		task.run('exec:grunt_publish');
	});
	grunt.registerTask('pub', 'clam 正式发布', function() {
		task.run('exec:grunt_publish');
	});

	/**
	 * 预发布
	 */
	grunt.registerTask('prepub', 'clam 预发', function() {
		task.run('exec:grunt_prepub');
	});

	/**
	 * 启动Demo调试时的本地服务
	 */
	grunt.registerTask('server', '开启Demo调试模式', function() {
		task.run(['flexcombo:server','watch:all']);
	});

	/**
	 * 启动Demo调试时的本地服务
	 */
	grunt.registerTask('demo', '开启Demo调试模式', function() {
		task.run(['flexcombo:server','watch:all']);
	});

	/**
	 * 启动Debug调试时的本地服务
	 */
	grunt.registerTask('debug', '开启debug模式', function() {
		task.run(['flexcombo:debug','watch:all']);
	});

	// 默认构建任务
	grunt.registerTask('build', '默认构建任务', function() {
		task.run(['clean:build', 'copy','less', /*'mytps',*/'css_combo', 'kmc', 'combohtml', 'replace', 'uglify','cssmin'/*'concat','yuidoc'*/]);
	});

	/*
	 * 获取当前库的信息
	 **/
	grunt.registerTask('info', '获取库的路径', function() {
		var abcJSON = {};
		try {
			abcJSON = require(path.resolve(process.cwd(), 'abc.json'));
			console.log('\n'+abcJSON.repository.url);
		} catch (e){
			console.log('未找到abc.json');
		}
	});

	/*
	 * 获取当前最大版本号，并创建新分支
	 **/
	grunt.registerTask('newbranch', '创建新的分支', function(type) {
		var done = this.async();
		exec('git branch -a & git tag', function(err, stdout, stderr, cb) {
			var r = getBiggestVersion(stdout.match(/\d+\.\d+\.\d+/ig));
			if(!r){
				r = '0.1.0';
			} else {
				r[2]++;
				r = r.join('.');
			}
			grunt.log.write(('新分支：daily/' + r).green);
			grunt.config.set('currentBranch', r);
			task.run(['exec:new_branch']);		
			// 回写入 abc.json 的 version
			try {
				abcJSON = require(path.resolve(process.cwd(), 'abc.json'));
				abcJSON.version = r;
				fs.writeJSONFile("abc.json", abcJSON, function(err){
					if (err) {
						console.log(err);
					} else {
						console.log("update abc.json.");
					}
				});
			} catch (e){
				console.log('未找到abc.json');
			}
			done();
		});
	});

	// -------------------------------------------------------------
	// 注册Grunt主流程
	// -------------------------------------------------------------
	
	return grunt.registerTask('default', 'Clam 默认流程', function(type) {

		var done = this.async();

		// 获取当前分支
		exec('git branch', function(err, stdout, stderr, cb) {

			var reg = /\*\s+daily\/(\S+)/,
				match = stdout.match(reg);

			if (!match) {
				grunt.log.error('当前分支为 master 或者名字不合法(daily/x.y.z)，请切换到daily分支'.red);
				grunt.log.error('创建新daily分支：grunt newbranch'.yellow);
				grunt.log.error('只执行构建：grunt build'.yellow);
				return;
			}
			grunt.log.write(('当前分支：' + match[1]).green);
			grunt.config.set('currentBranch', match[1]);
			done();
		});

		// 构建和发布任务
		if (!type) {
			task.run(['build']);
		} else if ('publish' === type || 'pub' === type) {
			task.run(['exec:tag', 'exec:publish']);
		} else if ('prepub' === type) {
			task.run(['exec:add','exec:commit']);
			task.run(['exec:prepub']);
		}

	});

	// -------------------------------------------------------------
	// 辅助函数
	// -------------------------------------------------------------

	// 得到最大的版本号
	function getBiggestVersion(A){
		var a = [];
		var b = [];
		var t = [];
		var r = [];
		if(!A){
			return [0,0,0];
		}
		for(var i= 0;i< A.length;i++){
			if(A[i].match(/^\d+\.\d+\.\d+$/)){
				var sp = A[i].split('.');
				a.push([
					Number(sp[0]),Number(sp[1]),Number(sp[2])
				]);
			}
		}
		
		var r = findMax(findMax(findMax(a,0),1),2);
		return r[0];
	}

	// a：二维数组，index，比较第几个
	// return：返回保留比较后的结果组成的二维数组
	function findMax(a,index){
		var t = [];
		var b = [];
		var r = [];
		for(var i = 0;i<a.length;i++){
			t.push(Number(a[i][index]));
		}
		var max = Math.max.apply(this,t);
		for(var i = 0;i<a.length;i++){
			if(a[i][index] === max){
				b.push(i);
			}
		}
		for(var i = 0;i<b.length;i++){
			r.push(a[b[i]]);
		}
		return r;
	}
};
