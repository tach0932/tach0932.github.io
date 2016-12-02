'use strict';
 
var gulp = require('gulp');
var sass = require('gulp-sass');
var cssmin = require('gulp-cssmin');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');  
var autoprefixer = require('gulp-autoprefixer')
var watchPath = require('gulp-watch-path')
var htmlmin = require('gulp-htmlmin');
var connect = require('gulp-connect'); //https://www.npmjs.com/package/gulp-connect
var jshint = require('gulp-jshint');
var babel = require('gulp-babel');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var cache = require('gulp-cache');
var md5 = require('gulp-md5-plus'),
    os = require('os'),
    gutil = require('gulp-util'),
    fileinclude = require('gulp-file-include'),
    gulpOpen = require('gulp-open'),
    clean = require('gulp-clean'),
    spriter = require('gulp-css-spriter'),
    base64 = require('gulp-css-base64'),
    options = require('gulp-options'),
    inject = require('gulp-inject');


var host = {  
    name:'localhost',
    path: 'build',
    port: 3000,
    html: 'demo.html'
};
//mac chrome: "Google chrome", 
var browser = os.platform() === 'linux' ? 'Google chrome' : (
  os.platform() === 'darwin' ? 'Google chrome' : (
  os.platform() === 'win32' ? 'chrome' : 'firefox'));

var watchJS = function(file){
    gulp.src(file.srcPath)
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(file.distDir))
        .pipe(connect.reload());
}
var watchCSS = function(file){
    gulp.src(file.srcPath)
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
                browsers: 'last 3 versions'
        }))
        .pipe(gulp.dest(file.distDir))
        .pipe(connect.reload());
}
var watchHTML = function(file){
    gulp.src('./src/*.html')
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(gulp.dest(file.distDir))
        .pipe(connect.reload());
        
}

var jsList=['src/js/*.js','!src/js/*.min.js'];
var buildJsList=['build/js/*.js','!build/js/*.min.js'];

var buildEND = options.has('prd')?'md5:css':'imagemin';
var prdTasks = options.has('prd')&&options.has('open')?['connect','copyto:public','open']:['copyto:public']
var devTasks = options.has('open')?['connect','imagemin','sass:dev','js:dev','html:dev','watch','open']:['connect','imagemin','sass:dev','js:dev','html:dev','watch']

//dev环境下的任务
gulp.task('sass:dev',['copy:css'],function () {
    return gulp.src('build/css/sass/*.scss')
                .pipe(sourcemaps.init())               
                .pipe(sass().on('error', sass.logError))
                .pipe(autoprefixer({
                        browsers: 'last 3 versions'
                 }))
                 .pipe(sourcemaps.write('./'))
                .pipe(gulp.dest('build/css'))
});
gulp.task('js:dev',['copy:js'],function (done) {   
    return gulp.src(buildJsList)
                .pipe(sourcemaps.init())
                .pipe(babel())
                .pipe(sourcemaps.write('./'))
                .pipe(gulp.dest('./build/js'))
});
gulp.task('jshint:dev',function(){
        gulp.src(jsList)
            .pipe(jshint())
            .pipe(jshint.reporter('default'))
})
gulp.task('html:dev',['clean'], function (done) {
    
    return gulp.src(['./src/*.html'])
                .pipe(fileinclude({ //用于在html文件中直接include文件
                      prefix: '@@',
                      basepath: '@file'
                }))
                .pipe(gulp.dest('build'))
});
//公共任务
gulp.task('imagemin',['clean'], function (done) {
   return gulp.src('src/images/**/*.{png,jpg,gif,ico}')
                .pipe(cache(imagemin({  //加入缓存，只压缩有更改的
                    optimizationLevel: 5,
                    progressive:true,
                    use: [pngquant()] //使用pngquant深度压缩png图片的imagemin插件
                })))
                .pipe(gulp.dest('build/images'))
});
gulp.task('clean', function (done) {
   return  gulp.src(['build'])
                .pipe(clean());
});
gulp.task('copy:css',['clean'],function(){
    return gulp.src('src/css/**/*')
                .pipe(gulp.dest('build/css/'));
})
gulp.task('copy:js',['clean'],function(){
    return gulp.src('src/js/*')
                .pipe(gulp.dest('build/js'));
})  
/*
**  生产环境任务
*/
gulp.task('sass',['copy:css'],function () {
    return gulp.src('build/css/sass/*.scss')
                .pipe(sass().on('error', sass.logError))
                .pipe(autoprefixer({
                        browsers: 'last 2 versions'
                 }))
                .pipe(gulp.dest('build/css'))
});
//雪碧图操作，应该先拷贝图片并压缩合并css
gulp.task('sprite', ['imagemin','sass'], function (done) {
    var timestamp = +new Date();
    return  gulp.src(['build/css/**/*.css','!build/css/**/*.min.css'])
                .pipe(spriter({
                    spriteSheet: 'build/images/spritesheet' + timestamp + '.png',
                    pathToSpriteSheetFromCSS: '../images/spritesheet' + timestamp + '.png',
                    spritesmithOptions: {
                        padding: 10
                    }   
                }))
                .pipe(base64())
                .pipe(cssmin())
                .pipe(gulp.dest('build/css'))
});
//将css加上10位md5，并修改html中的引用路径，该动作依赖sprite
gulp.task('md5:css', ['sprite','copy:html'], function (done) {
    gulp.src('build/css/*.css')
        // .pipe(md5(10, 'build/*.html'))
        .pipe(gulp.dest('build/css'))
        .on('end', done);
});

gulp.task('jsmin',['copy:js'],function(){
    return gulp.src(buildJsList)
                .pipe(jshint())
                .pipe(jshint.reporter('default'))
                .pipe(babel())
                .pipe(uglify())
                .pipe(gulp.dest('build/js'))
});
//将js加上10位md5,并修改html中的引用路径，该动作依赖jsmin
gulp.task('md5:js', ['jsmin','copy:html'], function (done) {
    gulp.src('build/js/*.js')
        // .pipe(md5(10, 'build/*.html'))
        .pipe(gulp.dest('build/js'))
        .on('end', done);
});

gulp.task('copy:html',['clean'],function(){
  return gulp.src(['./src/*.html'])
    // .pipe(fileinclude({ //用于在html文件中直接include文件
    //       prefix: '@@',
    //       basepath: '@file'
    // }))
    .pipe(gulp.dest('build'))
})
gulp.task('htmlmin',['md5:css','md5:js'],function(){
    gulp.src('build/*.html')
        // .pipe(htmlmin({collapseWhitespace: true})) //目前暂不压缩html
        .pipe(gulp.dest('build'))
})
//创建服务器并实现自动刷新有很多插件，比如gulp-livereload，browser-sync，gulp-connect
gulp.task('connect',function(){
  connect.server({
    name:'DEMO APP',
    root:host.path,
    port:host.port,
    livereload:true
  })
})

gulp.task('open',[buildEND],function (done) {
    gulp.src('')
        .pipe(gulpOpen({
            app: browser,
            uri: 'http://'+host.name+':'+host.port
        }))
        .on('end', done);
});

gulp.task('watch',function () {
  gulp.watch('./src/css/sass/*.scss',function(event){
        var paths = watchPath(event,'src/css/sass/','build/css/');
        gutil.log('sass '+gutil.colors.green(event.type) + ': ' + paths.srcPath)
        gutil.log('Dest Path : ' + paths.distPath)
        watchCSS(paths);
  });
  gulp.watch('./src/js/**/*.js',function(event){
        var paths = watchPath(event,'src/js/','build/js/');
        gutil.log('js '+gutil.colors.green(event.type) + ': ' + paths.srcPath)
        gutil.log('Dest Path: ' + paths.distPath)
        watchJS(paths);
  });
  gulp.watch('./src/**/*.html',function(event){
        var paths = watchPath(event,'src/','build/');
        gutil.log('html '+gutil.colors.green(event.type) + ': ' + paths.srcPath)
        gutil.log('Dest Path: ' + paths.distPath)
        watchHTML(paths);   
  });
});
//将编译到build的文件以及文件夹copy到public目录待发布
gulp.task('copyto:public',['htmlmin'],function(){
    return gulp.src('build/**/*')
                .pipe(gulp.dest('./../public/'));
})

gulp.task('dev',devTasks);

//gulp --prd  直接编译线上环境
//gulp --prd --open  编译线上环境并打开浏览器预览
gulp.task('default',prdTasks)

/* 使用webpack编译js文件*/
// var myDevConfig = Object.create(webpackConfig);
// var devCompiler = webpack(myDevConfig);
// //引用webpack对js进行操作
// gulp.task("build-js", ['fileinclude'], function(callback) {
//     devCompiler.run(function(err, stats) {
//         if(err) throw new gutil.PluginError("webpack:build-js", err);
//         gutil.log("[webpack:build-js]", stats.toString({
//             colors: true
//         }));
//         callback();
//     });
// });