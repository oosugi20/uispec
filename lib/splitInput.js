'use strict';

const _ = require('lodash');
var path = require( 'path' );
var yaml = require( 'js-yaml' );


/**
 * マークダウンファイルからヘッダーとコンテンツに分割して返す。
 *
 * @returns {object}
 */
function splitInput ( sourceMdString ) {

  //var fileContents = new String( file.contents );
  //var dir = path.dirname( file.path );
  //var result = {
  //  title     : '',
  //  screen    : '',
  //  //mdSource  : '',
  //  //filename  : path.basename( file.path.replace( /\.md$/, '.html' ) ),
  //  //dir       : dir.replace( /([^(.|/)]$)/, '$1/' ),
  //  //fromRoot  : path.relative( rootDir, dir ).replace( /([^(.|/)]$)/, '$1/' ),
  //  //toRoot    : path.relative( dir, rootDir ).replace( /([^/]$)/, '$1/' )
  //}

  //var metaYaml;
  const metaPattern    = /^\s*---\s*\n(.|\n)+?\s*---\s*\n/;
  const metaPatternRes = metaPattern.exec( sourceMdString );
  const metaYaml = (metaPatternRes) ? yaml.safeLoad(metaPatternRes[0].replace(/---/g, '')) : {};

  return _.assign({
    title: '',
    screen: '',
    url: '',
    summary: ''
  }, metaYaml, {
    body: sourceMdString.replace(metaPattern, '')
  });

  //if( metaPatternRes ) {

  //  try {

  //    metaYaml = yaml.safeLoad( metaPatternRes[ 0 ].replace( /---/g, '' ) );

  //  } catch ( e ) {

  //    console.log( 'YAML section is invalid: ' + file.path );
  //    metaYaml = {};

  //  }

  //  result.title    = metaYaml.title  || '';
  //  result.screen   = metaYaml.screen || '';
  //  //result.mdSource = fileContents.slice( metaPatternRes[ 0 ].length );

  //  //} else {

  //  //	result.mdSource = fileContents;

  //  //}

  //  return result;

};

module.exports = splitInput;
