/*!
 * markedのカスタムレンダラー。
 *  - hn要素で日本語文字列等を可に
 *  - codeブロックを拡張し、langが `uiflows` か `dot` なら専用のレンダリングを行うようにする。
 * TODO viz.jsをv2.0.0にするとエラー
 */
'use strict';

const path = require('path');
const marked        = require( 'marked' );

const Viz           = require( 'viz.js' );
const { Module, render } = require( 'viz.js/full.render.js' );
const viz = new Viz({ Module, render });

const uiflowsParser = require( 'uiflows-parser' );

const UiflowsMDRenderer = function ( options ) {

	marked.Renderer.call( this );
	this.options = options || {};

}

UiflowsMDRenderer.prototype = Object.create( marked.Renderer.prototype );
UiflowsMDRenderer.prototype.constructor = UiflowsMDRenderer;


/**
 * hn要素のレンダリング
 *
 * @param {string} text
 * @param {number} level
 * @return {string} HTML string
 */
UiflowsMDRenderer.prototype.heading = function (text, level) {

	let tagName = 'h' + level;

	// デフォルトのルールだと、`text.toLowerCase().replace(/[^\w]+/g, '-')` で、
	// 日本語が使えない。
	// id属性値の仕様よりも、使いやすさを優先し、`/[\s"]/` 以外は置換しない。
	let id = text.replace(/[\s"]/g, '-');

	return '<' + tagName + ' id="' + id + '">' + text + '</' + tagName + '>';

};



/**
 * code要素のレンダリング
 *
 * @param {string} code
 * @param {string} lang
 * @param {}       escaped
 *   https://github.com/chjj/marked#block-level-renderer-methods を見ると、
 *   codeは第2引数までしか取らないので謎。
 */
UiflowsMDRenderer.prototype.code = async function ( code, lang, escaped ) {

	const vizScraps = /^<\?xml version="1.0" encoding="UTF-8" standalone="no"\?>\n<!DOCTYPE svg PUBLIC "-\/\/W3C\/\/DTD SVG 1.1\/\/EN"\n "http:\/\/www.w3.org\/Graphics\/SVG\/1.1\/DTD\/svg11.dtd">/;

	if ( lang === 'uiflows' ) {

		const dotCode = uiflowsParser( code ).replace(/\t/g, '');
		const svg = await viz.renderString( dotCode );

		return `<div class="UISP-Dot">${ svg.replace( vizScraps, '' ) }</div>`;

	}

	if ( lang === 'dot' ) {

		const svg = await viz.renderString( code );
		return `<div class="UISP-Dot">${ svg.replace( vizScraps, '' ) }</div>`;


	} else {

		let result = marked.Renderer.prototype.code.call( this, code, lang, escaped );
		return result.replace( /(class=")(lang-)/, '$1line-numbers $2' );

	}

}

module.exports = UiflowsMDRenderer;
