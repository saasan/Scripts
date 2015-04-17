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
// @version     1.05
// ==/UserScript==

/* jshint multistr: true */

(function() {
'use strict';

var SCRIPT_NAME = 'pixiv Tags';
var TAGLIST_ID = SCRIPT_NAME.replace(/ /g, '');

function setStyle() {
  var style =
    '#'+TAGLIST_ID + '{' +
    '  background-color : #FFF;' +
    '  border: 1px solid #D6DEE5;' +
    '  border-radius: 5px;' +
    '  padding : 3px;' +
    '  line-height : 1.7em;' +
    '  overflow : hidden;' +
    '  box-sizing: border-box;' +
    '}' +
    
    // マウスオンで表示するタイプ
    '.show-float {' +
    '  position : fixed;' +
    '  left : 10px;' +
    '  top : 10px;' +
    '  width : 8em;' +
    '  height : 3em;' +
    '  opacity : 0.8;' +
    '  z-index : 998;' +
    '}' +

    '.show-float:hover {' +
    '  min-width : 300px;' +
    '  height : auto;' +
    '  opacity : 0.9;' +
    '}' +

    '@media screen and (min-width : 1450px) {' +
    '  .show-float, .show-float:hover {' +
    '    width : 200px;' +
    '    height : 100%;' +
    '    opacity : 1;' +
    '  }' +

    '  .show-float li {' +
    '    display : inline-block;' +
    '  }' +
    '}' +

    '@media screen and (min-width : 1550px) {' +
    '  .show-float, .show-float:hover {' +
    '    width : 250px;' +
    '  }' +
    '}' +

    '@media screen and (min-width : 1650px) {' +
    '  .show-float, .show-float:hover {' +
    '    width : 300px;' +
    '  }' +
    '}' +

    '@media screen and (min-width : 1750px) {' +
    '  .show-float, .show-float:hover {' +
    '    width : 350px;' +
    '  }' +
    '}' +

    '@media screen and (min-width : 1850px) {' +
    '  .show-float, .show-float:hover {' +
    '    width : 400px;' +
    '  }' +
    '}' +

    '@media screen and (min-width : 1920px) {' +
    '  .show-float, .show-float:hover {' +
    '    width : 435px;' +
    '  }' +
    '}' +

    // 常に展開して表示するタイプ
    '.show-always {' +
    '  position : relative;' +
    '  margin-bottom : 5px;' +
    '  width : 100%;' +
    '  height : auto;' +
    '}' +
    
    // ボタンと親要素の調整
    '#'+TAGLIST_ID+' button {' +
    '  float : right;' +
    '  margin-top : 0.3em;' +
    '}' + 
    '#'+TAGLIST_ID+' h1 {' +
    '  line-height: 2.7em;' +
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
  var html = '';

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
    
    // 短縮表示
    var pattern = /(-{2,})+(\d{1,})$/;
    var name = tags[i];
    if(name.match(pattern)){
      name = RegExp.$2 < (name.length - RegExp.lastMatch.length + 1) ? name.slice(0,   RegExp.$2) + '...' : name.slice(0, - RegExp.lastMatch.length - 1);
    }

    // URLに短縮数字除去+エンコードしたタグを追加
    url += encodeURI(tags[i].replace(/ /g, '+').replace(pattern, '').replace(/[+-]$/, ''));

    html += '<li class="tag"><a class="text" href="' + url + '" title="' + tags[i] + '"><span class="portal">c</span>' + name + '</a></li>\n';
  }

  return html;
}

function updateHTML() {
  var parentNode = document.getElementById('wrapper');
  
  // 挿入先が見当たらなければ何もしない
  if(parentNode == null){
    return;
  }
  
  // タグリストが生成済みなら中身だけ書き換え、なければ作成
  var taglist = document.getElementById('tags');
  if(taglist != null){
    taglist.innerHTML = generateHTML();
  }else{
    var parent = document.createElement('div');
    parent.id = TAGLIST_ID;
    parent.innerHTML = '<h1 class="unit-title">' + SCRIPT_NAME + '</h1>';
    var btn1 = document.createElement('button');
    btn1.id = 'button-settings';
    btn1.className = '_button';
    btn1.textContent = '設定';
    btn1.addEventListener('click', function(){GM_config.open();}, false);
    parent.firstChild.appendChild(btn1);
    var btn2 = document.createElement('button');
    btn2.id = 'button-addtag';
    btn2.className = '_button';
    btn2.textContent = '検索条件を追加';
    btn2.addEventListener('click', function(){addTag();}, false);
    parent.firstChild.appendChild(btn2);
    var ul = document.createElement('ul');
    ul.id = 'tags';
    ul.className = 'tags';
    ul.innerHTML = generateHTML();
    parent.appendChild(ul);
    parentNode.insertBefore(parent, parentNode.firstChild);
  }
  
  // 表示設定を切り替え
  var taglist_container = document.getElementById(TAGLIST_ID);
  if(GM_config.get('showAlways')){
    taglist_container.className = 'show-always';
  }else{
    taglist_container.className = 'show-float';
  }
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
    },showAlways :
    {
      label : 'タグリストを常に展開して表示する',
      type : 'checkbox',
      default : false
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
GM_registerMenuCommand(SCRIPT_NAME + ' - 現在表示中のタグを追加', function(){ addTag(); });

})();
