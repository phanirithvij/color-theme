const gulp = require('gulp');
const { series, parallel } = gulp;
const sass = require('gulp-sass');
const uglify = require('gulp-uglify');
const typescript = require('gulp-typescript');
const concat = require('gulp-concat');
const del = require('del');
const vpaths = require('vinyl-paths');

var sassDev = ()=>{
    return gulp.src('src/client/scss/*scss')
        .pipe(sass())
        .pipe(gulp.dest('src/server/public/css/'));
};

var sassProd = ()=>{
    return gulp.src('src/client/scss/*scss')
        .pipe(sass({outputStyle:'compressed'}))
        .pipe(gulp.dest('src/server/public/css/'));
};

var copyHtml = ()=>{
    return gulp.src('src/client/html/*.html')
        .pipe(gulp.dest('src/server/templates/'));
};

var copyJs = ()=>{
    return gulp.src('src/client/js/*.js')
        .pipe(gulp.dest('src/server/public/js/'));
};

var tsloadDev = ()=>{
    return gulp.src('src/client/**/*.ts')
        .pipe(typescript())
        .pipe(concat('prod.js'))
        .pipe(uglify())
        .pipe(gulp.dest('src/server/public/js/'));
};

var minifyJs = ()=>{
	return gulp.src(['src/server/public/js/*.js', "!src/server/public/js/prod.all.js"])
		.pipe(concat('prod.all.js'))
		// .pipe(vpaths(del))
		.pipe(gulp.dest('src/server/public/js/'));
};

var dev = ()=>{
    gulp.watch(['src/client/scss/*.scss'], sassDev);
    gulp.watch(['src/client/ts/*.ts', 'src/*.ts'], tsloadDev);
    gulp.watch(['src/client/ts/*.ts', 'src/*.ts'], minifyJs);
    gulp.watch(['src/client/js/*.js'], copyJs);
    gulp.watch(['src/client/js/*.js'], minifyJs);
    gulp.watch(['src/client/html/*.html'], copyHtml);
};

exports.dev = series(
    parallel(
        sassDev,
        series(tsloadDev, copyJs, minifyJs),
        copyHtml
    ),
    dev
);
exports.prod = parallel(
    sassProd,
    series(tsloadDev, copyJs, minifyJs),
    copyHtml
);
