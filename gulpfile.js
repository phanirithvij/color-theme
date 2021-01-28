const gulp = require('gulp');
const {
    series,
    parallel
} = gulp;
const sass = require('gulp-sass');
const uglify = require('gulp-uglify');
const typescript = require('gulp-typescript');
const concat = require('gulp-concat');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const del = require('del');

// TODO add do not edit warnings to files

var sassDev = () => {
    return gulp.src('src/client/scss/*scss')
        .pipe(sass({
            includePaths: ['node_modules/@uppy']
        }))
        .pipe(gulp.dest('src/server/public/css/'));
};

var sassProd = () => {
    return gulp.src('src/client/scss/*scss')
        .pipe(sass({
            includePaths: ['node_modules/@uppy'],
            outputStyle: 'compressed'
        }))
        .pipe(gulp.dest('src/server/public/css/'));
};

var copyHtml = () => {
    return gulp.src('src/client/html/*.html')
        .pipe(gulp.dest('src/server/templates/'));
};

var copyJs = () => {
    return gulp.src('src/client/js/*.js')
        .pipe(gulp.dest('src/server/public/js/'));
};

var uppyJs = () => {
    return browserify('src/server/public/js/ts/upload.js')
        .bundle()
        //Pass desired output filename to vinyl-source-stream
        .pipe(source('upload.b.js'))
        // Start piping stream to tasks!
        .pipe(gulp.dest('src/server/public/js/'));
}

var tsloadDev = () => {
    return gulp.src('src/client/**/*.ts')
        .pipe(typescript({
            "lib": ["es2015", "es2017.object", "dom"]
        }))
        // .pipe(concat('prod.js'))
        .pipe(uglify())
        .pipe(gulp.dest('src/server/public/js/'));
};

var minifyJs = () => {
    return gulp.src(['src/server/public/js/*.js', "!src/server/public/js/prod.all.js"])
        .pipe(concat('prod.all.js'))
        // .pipe(vpaths(del))
        .pipe(gulp.dest('src/server/public/js/'));
};

var cleanup = () => {
    return del(['src/server/public/js/prod.all.js']);
}

var dev = () => {
    gulp.watch(['src/client/scss/*.scss'], sassDev);
    gulp.watch(['src/client/ts/*.ts', 'src/*.ts'], series(cleanup, tsloadDev));
    gulp.watch(['src/client/ts/*.ts', 'src/*.ts'], series(cleanup, uppyJs));
    gulp.watch(['src/client/ts/*.ts', 'src/*.ts'], series(cleanup, minifyJs));
    gulp.watch(['src/client/js/*.js'], copyJs);
    gulp.watch(['src/client/js/*.js'], minifyJs);
    gulp.watch(['src/client/html/*.html'], copyHtml);
};

exports.dev = series(
    cleanup,
    parallel(
        sassDev,
        series(tsloadDev, uppyJs, copyJs, minifyJs),
        copyHtml
    ),
    dev
);
exports.prod = series(
    cleanup,
    parallel(
        sassProd,
        series(tsloadDev, uppyJs, copyJs, minifyJs),
        copyHtml
    )
);