'use strict';

const _      = require( 'lodash' );
const fs     = require( 'fs' );
const path   = require( 'path' );
const sizeOf = require( 'image-size' );

/**
 * 本体。
 * ./template/build/_template.htmlに引数のデータを埋め込んだHTML文字列を返す。
 *
 * @param {object} contents ./splitInput.jsの返り値 + α（ ../index.jsで付与 ）
 * @param {Html string} contents.body markedでmdから変換されたhtml文字列
 *
 * @return {string} HTML文字列
 *
 * @see ./splitInput.js
 * @see ./template/build/_template.html
 *
 * @requires makeSvgCanvasSrc ローカル関数
 */
const makePageHtml = function ( contents ) {

  const templatePath = path.resolve( __dirname, '../theme/default/_template.html' );
	let templateSrc = fs.readFileSync( templatePath, { encoding: 'utf-8' } );
	let template = _.template( templateSrc );

	return template( _.assign(contents, {
    svgCanvas: makeSvgCanvasSrc(contents.screen, contents.screenFullPath),
  }) );

}

/**
 * 引数に与えられたデータをsvgで埋め込んだスクリーンとハイライトのHTML文字列を返す。
 *
 * @param {} src
 * @param {} w
 * @param {} h
 * @param {} coords
 *
 * @return {HTML string}
 *
 * @see makeSvgCanvasSrc ローカル関数。この関数の返り値がsvgCanvasTemplateの返り値となる。
 */
const svgCanvasTemplate = function ( src, w, h, coords ) {
	return `
		<div class="UISP-Screen UISP-Screen--fit UISP-Screen--highlight">
			<svg width="${ w }" height="${ h }" viewBox="0 0 ${ w } ${ h }" class="UISP-Screen__svgRoot">
				<image xlink:href="${ src }" width="${ w }" height="${ h }" class="UISP-Screen__image" />
				${ ( function () {

					let result = [];

					coords.forEach( function ( coord, i ) {

						let x = coord[ 0 ];
						let y = coord[ 1 ];
						let w = coord[ 2 ];
						let h = coord[ 3 ];

						result.push( `<g class="UISP-Highlight">
							<rect x="${ x     }" y="${ y     }" width="${ w     }" height="${ h     }" class="UISP-Highlight__fill"/>
							<rect x="${ x - 2 }" y="${ y - 2 }" width="${ w + 4 }" height="${ h + 4 }" class="UISP-Highlight__outline"/>
							<text x="${ x + 2 }" y="${ y - 2 }" dy="${ h - 2 }" class="UISP-Highlight__label">${ ( i + 1 ) }</text>
						</g>` );

					} );

					return result.join( '' );

				} )() }
			</svg>
		</div>
	`;
};


/**
 * スクリーン部分のHTML文字列を描画して返す。
 *
 * @return {HTML string} svgCanvasTemplateの返り値。もしくは空文字（`''`）
 *
 * @requires svgCanvasTemplate ローカル関数
 */
const makeSvgCanvasSrc = function ( screenUrl, screenFullPath ) {

	if ( !screenUrl ) { return ''; }

	//let reg    = /highlight=\[(\[[0-9]+,[0-9]+,[0-9]+,[0-9]+\],?)+\]/;
	//let match  = reg.exec( screenUrl );
	//let coords = match ? JSON.parse( match[ 0 ].replace( /highlight=/, '' ) ) : [];
  const coords = [];

	//let fullImagePath = path.resolve( pageDir, screenUrl ).replace( /\?.*$/, '' );

	try {

		// TODO
		// ローカルにない、httpの画像も処理したい
		let dimensions = sizeOf( screenFullPath );
		return svgCanvasTemplate( screenUrl, dimensions.width, dimensions.height, coords );

	} catch ( e ) {

		return '';

	}

}

module.exports = makePageHtml;
