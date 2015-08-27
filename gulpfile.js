var gulp = require('gulp');
var less = require('gulp-less');
var path = require('path');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var autoprefixer = require('gulp-autoprefixer');

var PUB_DIR = './public';
var CSS_DIR = path.join(PUB_DIR, 'css');
var JS_DIR = path.join(PUB_DIR, 'js');
//var IMG_DIR = path.join(PUB_DIR, 'img');

gulp.task('less', function() {
  return gulp
    .src(['./static/less/global/global.less', './static/less/page/*.less'])
    .pipe(less())
    .pipe(minifyCSS())
    .pipe(autoprefixer({
      browsers: ['> 1%', 'last 2 versions', 'ie 9', 'iOS 4', 'Android 4'],
      cascade: false
    }))
    .pipe(gulp.dest(CSS_DIR));
});

gulp.task('js', function() {
  return gulp
    .src(['./static/js/**/*.js'])
    .pipe(uglify())
    .pipe(gulp.dest(JS_DIR));
});

gulp.task('watch', ['default'], function() {
  gulp.watch(['./static/**/*'], ['default']);
});

gulp.task('default', ['less', 'js']);
