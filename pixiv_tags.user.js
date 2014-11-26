// ==UserScript==
// @name        pixiv Tags
// @description 設定したタグをpixiv内に常時表示する
// @namespace   http://saasan.github.io/
// @include     http://www.pixiv.net/*
// @require     https://raw.githubusercontent.com/sizzlemctwizzle/GM_config/master/gm_config.js
// @author      s2works
// @grant       GM_addStyle
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @version     1.04
// ==/UserScript==

/* jshint multistr: true */

(function() {
'use strict';

var SCRIPT_NAME = 'pixiv Tags';

function setStyle() {
  var style =
    '#pixivTags' +
    '{' +
    '  position : fixed;' +
    '  left : 10px;' +
    '  top : 10px;' +
    '  width : 8em;' +
    '  height : 2em;' +
    '  background-color : #FFF;' +
    '  border: 1px solid #D6DEE5;' +
    '  border-radius: 5px 5px 5px 5px;' +
    '  padding : 5px;' +
    '  line-height : 1.7em;' +
    '  z-index : 998;' +
    '  overflow : hidden;' +
    '  opacity : 0.8;' +
    '}' +

    '#pixivTags li' +
    '{' +
    '  display : none;' +
    '}' +

    '#pixivTags:hover' +
    '{' +
    '  width : 300px;' +
    '  height : 100%;' +
    '  opacity : 1;' +
    '}' +

    '#pixivTags:hover li' +
    '{' +
    '  display : inline-block;' +
    '}' +

    '@media screen and (min-width : 1450px) {' +
    '  #pixivTags, #pixivTags:hover' +
    '  {' +
    '    width : 200px;' +
    '    height : 100%;' +
    '    opacity : 1;' +
    '  }' +

    '  #pixivTags li' +
    '  {' +
    '    display : inline-block;' +
    '  }' +
    '}' +

    '@media screen and (min-width : 1550px) {' +
    '  #pixivTags, #pixivTags:hover' +
    '  {' +
    '    width : 250px;' +
    '  }' +
    '}' +

    '@media screen and (min-width : 1650px) {' +
    '  #pixivTags, #pixivTags:hover' +
    '  {' +
    '    width : 300px;' +
    '  }' +
    '}' +

    '@media screen and (min-width : 1750px) {' +
    '  #pixivTags, #pixivTags:hover' +
    '  {' +
    '    width : 350px;' +
    '  }' +
    '}' +

    '@media screen and (min-width : 1850px) {' +
    '  #pixivTags, #pixivTags:hover' +
    '  {' +
    '    width : 400px;' +
    '  }' +
    '}' +

    '@media screen and (min-width : 1920px) {' +
    '  #pixivTags, #pixivTags:hover' +
    '  {' +
    '    width : 435px;' +
    '  }' +
    '}';

  GM_addStyle(style);
}

function optimizeTags() {
  var tags = GM_config.get('tags');

  // 全角スペース、タブを半角スペースにする
  tags = tags.replace(/[　\t]+/g, ' ');
  // 改行コードを統一
  tags = tags.replace(/\r\n/g, '\n');
  tags = tags.replace(/\r/g, '\n');
  // 連続する改行をまとめる
  tags = tags.replace(/\n+/g, '\n');
  // 改行のみの行を削除
  tags = tags.replace(/^\n|\n$/g, '');

  GM_config.set('tags', tags);
  GM_config.write();
}

function generateHTML() {
  var html = '<h1 class="unit-title">' + SCRIPT_NAME + '</h1><ul class="tags">';

  var tags = GM_config.get('tags');
  tags = tags.split('\n');

  for (var i = 0; i < tags.length; i++) {
    if (!tags[i].length) {
      continue;
    }

    // スペースがあれば部分一致検索
    var url = '/search.php?s_mode=s_tag' + (tags[i].indexOf(' ') < 0 ? '_full' : '') + '&word=';

    // タグ前後のスペースを削除
    tags[i] = tags[i].replace(/(^ +| +$)/g, '');

    // URLににエンコードしたタグを追加
    url += encodeURI(tags[i].replace(/ /g, '+'));

    html += '<li class="tag"><a class="portal" href="' + url + '">c</a><a class="text" href="' + url + '">' + tags[i] + '</a></li>\n';
  }

  html += '</ul>';

  return html;
}

function updateHTML() {
  var html = generateHTML();
  var id = SCRIPT_NAME.replace(/ /g, '');

  var parentNode = document.getElementById('wrapper');
  if (parentNode == null) {
    return;
  }

  var div = document.getElementById(id);
  if (div == null) { // null or undefined
    div = document.createElement('div');
    div.id = id;
    parentNode.appendChild(div);
  }

  div.innerHTML = html;
}

function addTag() {
  var url = location.href;
  if (!/^http:\/\/www\.pixiv\.net\/(search|tags)\.php\?/.test(url)) {
    window.alert('検索結果を表示した状態で実行して下さい。');
    return;
  }

  var word = url.replace(/^.*[\?&](word|tag)=([^&=\?]+).*$/, '$2');
  word = decodeURIComponent(word.replace(/\+/g, ' '));
  var tags = GM_config.get('tags');
  tags += '\n' + word;
  GM_config.set('tags', tags);
  GM_config.write();
  updateHTML();

  window.alert('「' + word + '」を追加しました。');
}

GM_config.init(
  SCRIPT_NAME,
  {
    tags :
    {
      section : ['タグ(各タグは改行で分ける)'],
      type : 'textarea',
      cols : 60,
      rows : 20,
      default : 'Greasemonkeyの「ユーザスクリプトコマンド」でタグを設定できます。\nタグは1行に1つ書いて下さい。\n部分一致で検索したい場合は、タグの後ろにスペースを入れて下さい。\nAND/OR検索もできます。\n\n↓例↓\nオリジナル\nなにこれかわいい\n俺の 黒猫\nパチュリー OR パチェ'
    }
  },
  '#GM_config_field_tags{ width : 100%; }',
  {
    save : function() {
      GM_config.close();
      optimizeTags();
      updateHTML();
    }
  }
);

setStyle();
updateHTML();
GM_registerMenuCommand(SCRIPT_NAME + ' - 設定', function(){ GM_config.open(); });
GM_registerMenuCommand(SCRIPT_NAME + ' - 現在表示中のタグを追加', function(){  addTag(); });

})();
