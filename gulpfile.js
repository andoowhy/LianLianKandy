"use strict";

var gulp = require('gulp');
var runSequence = require('run-sequence');
var del = require('del');
var browserSync = require('browser-sync').create();

// ------------
// Helper Tasks
// ------------

gulp.task('copy:phaser', function(){
    return gulp.src(
        [ './node_modules/phaser/build/phaser.min.js',
          './node_modules/phaser/build/phaser.js',
          './node_modules/build/dist/phaser.map' ] )
        .pipe( gulp.dest( './js' ) );
});

// ----------
// Main Tasks
// ----------

gulp.task( 'serve', function(){
    browserSync.init({
        server: {
            baseDir: './'
        }
    });

    return gulp.watch( ['./**/*'], function(){
        browserSync.reload();
    });
});