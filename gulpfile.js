"use strict"

const del 						=	require('del');
const gulp 						= require('gulp');
const sass 						=	require('gulp-sass')(require('sass'));
const browserSync 		=	require('browser-sync').create();
const avif 						= require('gulp-avif');
const newer 					= require('gulp-newer');
const uglify 					=	require('gulp-uglify');
const rename 					=	require('gulp-rename');
const imagemin 				=	require('gulp-imagemin');
const ttf2woff2 			= require('gulp-ttf2woff2');
const {	src,
				dest, 
				series,
				parallel}			= require('gulp');
const fileinclude 		= require('gulp-file-include');
const autoprefixer		=	require('gulp-autoprefixer');
const webp						= require('gulp-webp');
const rigger 					= require('gulp-rigger')
const fonter 					= require('gulp-fonter');
const notify 					= require('gulp-notify');
const plumber 				=	require('gulp-plumber');
const cssnano 				=	require('gulp-cssnano');
const cssbeautify 		=	require('gulp-cssbeautify');
const removeComments 	=	require('gulp-strip-css-comments');


/* Основные пути */
const srcPath = "src/"
const distPath = "dist/"


/* Дополнительные пути */
const path = {
	build: {
		js: 						`${distPath}assets/js`,
		css: 						`${distPath}assets/css`,
		html: 					`${distPath}`,
		fonts: 					`${distPath}assets/fonts`,
		dirSVG: 				`${distPath}/assets/images/SVG`,
		images: 				`${distPath}assets/images`,
		everySVG: 			`${distPath}/assets/images/**/*.svg`,
	},
	src: {
		js: 						`${srcPath}assets/js/*.js`,
		css: 						`${srcPath}assets/scss/*.scss`,
		html: 					`${srcPath}*.html`,
		fonts: 					`${srcPath}assets/fonts/**/*.{ttf,eot,svg,woff,woff2}`, 																		
		noSVG: 					[`${srcPath}/assets/images/**/*.{jpeg,jpg,png,gif,ico,webp,webmanifest,xml,json}`, `!${srcPath}/assets/images/**/*.svg`], 	
		images: 				`${srcPath}/assets/images/**/*.{jpeg,jpg,png,svg,gif,ico,webp,webmanifest,xml,json}`, 	
		onlyTtf:				`${srcPath}assets/fonts/**/*.ttf`,
		onlyWoffWoff2: 	`${srcPath}assets/fonts/**/*.{woff, woff2}`,
	},
	watch: {
		js: 						`${srcPath}assets/js/**/*.js`,
		css: 						`${srcPath}assets/scss/**/*.scss`,
		html: 					`${srcPath}**/*.html`,
		fonts: 					`${srcPath}assets/fonts/**/*.{ttf,eot,svg,woff,woff2}`,
		images: 				`${srcPath}assets/images/**/*.{jpeg,jpg,png,svg,gif,ico,webp,webmanifest,xml,json}`,
	},
	clean: 						`./${distPath}`		
}


function html() {
	return 	src(path.src.html, {base: srcPath})
						.pipe(plumber({
							errorHandler: function(err) {
								notify.onError({
									title: 		'HTML Error',
									message: 	'Error: <%= error.message %>'
								})(err);
								this.emit('end');
							}
						}))
						.pipe(fileinclude())
						.pipe(dest(path.build.html))
						.pipe(browserSync.reload({stream: true}))
}

function css() {
	return	src(path.src.css, {base: `${srcPath}/assets/scss/`})
						.pipe(plumber({
							errorHandler: function(err) {
								notify.onError({
									title: 		'SCSS Error',
									message: 	'Error: <%= error.message %>'
								})(err);
								this.emit('end');
							}
						}))
						.pipe(sass())
						.pipe(autoprefixer())
						.pipe(cssbeautify())
						.pipe(dest(path.build.css))

						.pipe(cssnano({
							zindex: false,
							discardComments: {
								removeAll: true
							}
						}))
						.pipe(removeComments())
						.pipe(rename({
							suffix: '.min',
							extname: '.css',
						}))
						.pipe(dest(path.build.css))
						.pipe(browserSync.reload({stream: true}))
}

function js() {
	return	src(path.src.js, {base: `${srcPath}/assets/js/`})
						.pipe(plumber({
							errorHandler: function(err) {
								notify.onError({
									title: 		'JS Error',
									message: 	'Error: <%= error.message %>'
								})(err);
								this.emit('end');
							}
						}))
						.pipe(rigger())
						.pipe(dest(path.build.js))

						.pipe(uglify())
						.pipe(rename({
							suffix: '.min',
							extname: '.js',
						}))
						.pipe(dest(path.build.js))
						.pipe(browserSync.reload({stream: true}))
}

function images() {
	return 	src(path.src.noSVG, {base: `${srcPath}/assets/images`})
						.pipe(newer(path.build.images))
						.pipe(avif({
							quality: 50
						}))
						.pipe(dest(path.build.images))

						.pipe(src(path.src.images, {base: `${srcPath}/assets/images`}))
						.pipe(newer(path.build.images))
						.pipe(webp())

						.pipe(src(path.src.images, {base: `${srcPath}/assets/images`}))
						.pipe(newer(path.build.images))
						.pipe(imagemin([
							imagemin.gifsicle({interlaced: true}),
							imagemin.mozjpeg({quality: 80, progressive: true}),
							imagemin.optipng({optimizationLevel: 5}),
							imagemin.svgo({
								plugins: [
									{removeViewBox: true},
									{cleanupIDs: false}
								]
							})
						]))
						.pipe(dest(path.build.images))
						.pipe(browserSync.reload({stream: true}))
}

function fonts() {
	return 	src(path.src.fonts, {base: `${srcPath}/assets/fonts`})
						.pipe(fonter({
							formats: ['woff', 'ttf']
						}))
						
						.pipe(src(path.src.onlyTtf))
						.pipe(ttf2woff2())
						.pipe(dest(path.build.fonts))

						.pipe(browserSync.reload({stream: true}))
}

function clean() {
	return del(path.clean)
}

function watchFiles() {
	browserSync.init({
		server: {
			baseDir: `./${distPath}`
		}
	})
	gulp.watch([path.watch.js], js)
	gulp.watch([path.watch.css], css)
	gulp.watch([path.watch.html], html)
	gulp.watch([path.watch.fonts], fonts)
	gulp.watch([path.watch.images], images)
	gulp.watch(['src/assets/components'], images)
}


const build = series(clean, parallel(html, css, js, images, fonts));
const watch = parallel(watchFiles, build)

exports.js 			= js;
exports.css			= css;
exports.html 		= html;
exports.clean 	= clean;
exports.fonts 	= fonts;
exports.images 	= images;

exports.build 	= build;
exports.watch 	= watch;
exports.default = watch

