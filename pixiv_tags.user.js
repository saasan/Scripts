// ==UserScript==
// @name        pixiv Tags
// @description 設定したタグをpixiv内に常時表示する
// @namespace   http://saasan.github.io/
// @include     http://www.pixiv.net/*
// @require     https://raw.githubusercontent.com/sizzlemctwizzle/GM_config/master/gm_config.js
// @author      saasan, monsier-oui
// @grant       GM_addStyle
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @version     1.05
// ==/UserScript==

(function() {
  'use strict';

  var SCRIPT_NAME = 'pixiv Tags';
  var SCRIPT_ID = SCRIPT_NAME.replace(/ /g, '');
  var CSS  = `
    #${ SCRIPT_ID } {
      background-color : #FFF;
      border: 1px solid #D6DEE5;
      border-radius: 5px;
      padding : 3px;
      line-height : 1.7em;
      overflow : hidden;
      box-sizing: border-box;
    }

    /* マウスオンで表示するタイプ */
    .show-float {
      position : fixed;
      left : 10px;
      top : 10px;
      width : 8em;
      height : 3em;
      opacity : 0.8;
      z-index : 998;
    }

    .show-float:hover {
      min-width : 300px;
      height : auto;
      opacity : 0.9;
    }

    @media screen and (min-width : 1450px) {
      .show-float, .show-float:hover {
        width : 200px;
        height : 100%;
        opacity : 1;
      }

      .show-float li {
        display : inline-block;
      }
    }

    @media screen and (min-width : 1550px) {
      .show-float, .show-float:hover {
        width : 250px;
      }
    }

    @media screen and (min-width : 1650px) {
      .show-float, .show-float:hover {
        width : 300px;
      }
    }

    @media screen and (min-width : 1750px) {
      .show-float, .show-float:hover {
        width : 350px;
      }
    }

    @media screen and (min-width : 1850px) {
      .show-float, .show-float:hover {
        width : 400px;
      }
    }

    @media screen and (min-width : 1920px) {
      .show-float, .show-float:hover {
        width : 435px;
      }
    }

    /* 常に展開して表示するタイプ */
    .show-always {
      position : relative;
      margin-bottom : 5px;
      width : 100%;
      height : auto;
    }

    /* ボタンと親要素の調整 */
    #${ SCRIPT_ID } button {
      float : right;
      margin-top : 0.3em;
    }
    #${ SCRIPT_ID } h1 {
      line-height: 2.7em;
    }
  `;

  /**
   * HTMLで使用できない文字を文字実体参照化する
   * @param s 文字実体参照化したい文字列
   * @returns {string} 文字実体参照化した文字列
   */
  function escapeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /**
   * 設定されたタグリストを最適化
   */
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

  /**
   * タグを表示用に短縮する
   * @param tag タグの文字列
   * @returns {object} forSearch 文字数指定部分を削除した検索用タグ
   *                   short 表示用に短縮したタグ
   */
  function shortenTag(tag) {
    var forSearch, short;
    var pattern = /\s+--(\d+)\s*$/;
    var result = pattern.exec(tag);

    if (result == null) {
      forSearch = short = tag;
    }
    else {
      // 指定された文字数
      var limit = parseInt(result[1], 10);
      // 文字数指定部分を削除
      forSearch = short = tag.replace(pattern, '');

      // 指定文字数を超えていたら短縮
      if (short.length > limit) {
        short = short.substr(0, limit) + '...';
      }
    }

    return { forSearch: forSearch, short: short };
  }

  /**
   * タグリスト部分のHTMLを作成する
   */
  function generateTagListHTML() {
    var html = '', url, tag;

    var tags = GM_config.get('tags');
    tags = tags.split('\n');

    for (var i = 0; i < tags.length; i++) {
      if (tags[i].length === 0) {
        continue;
      }

      // スペースがあれば部分一致検索
      url = '/search.php?s_mode=s_tag' + (tags[i].indexOf(' ') < 0 ? '_full' : '') + '&word=';

      // タグ前後のスペースを削除
      tags[i] = tags[i].replace(/(^ +| +$)/g, '');

      // タグを短縮
      tag = shortenTag(tags[i]);

      // URLに短縮数字除去+エンコードしたタグを追加
      url += encodeURI(tag.forSearch.replace(/ /g, '+'));

      html += `
        <li class="tag">
          <a class="text" href="${ escapeHTML(url) }" title="${ escapeHTML(tag.forSearch) }">
            <span class="portal">c</span>${ escapeHTML(tag.short) }
          </a>
        </li>
      `;
    }

    return html;
  }

  /**
   * アプリで使用する要素を挿入する
   * @param parentNode 挿入する親要素
   */
  function insertAppElement(parentNode) {
    var element = document.createElement('div');
    element.id = SCRIPT_ID;

    element.innerHTML = `
      <h1 class="unit-title">
        ${ SCRIPT_NAME }
        <button id="${ SCRIPT_ID }AddTag" class="_button">検索条件を追加</button>
        <button id="${ SCRIPT_ID }OpenSettings" class="_button">設定</button>
      </h1>
      <ul id="${ SCRIPT_ID }Tags" class="tags">${ generateTagListHTML() }</ul>
    `;

    parentNode.insertBefore(element, parentNode.firstChild);

    // 「検索条件を追加」ボタンが押されたらaddTag()を呼び出すように設定
    var buttonAddTag = document.getElementById(SCRIPT_ID + 'AddTag');
    buttonAddTag.addEventListener('click', function(){ addTag(); }, false);

    // 「設定」ボタンが押されたら設定画面を開くように設定
    var buttonSettings = document.getElementById(SCRIPT_ID + 'OpenSettings');
    buttonSettings.addEventListener('click', function(){ GM_config.open(); }, false);
  }

  function updateHTML() {
    var parentNode = document.getElementById('wrapper');

    // 挿入先が見当たらなければ何もしない
    if (parentNode == null) {
      return;
    }

    // タグリストが生成済みなら中身だけ書き換え、なければ作成
    var taglist = document.getElementById(SCRIPT_ID + 'Tags');
    if (taglist == null) {
      insertAppElement(parentNode);
    }
    else {
      taglist.innerHTML = generateTagListHTML();
    }

    // 表示設定を切り替え
    var taglist_container = document.getElementById(SCRIPT_ID);
    if (GM_config.get('showAlways')) {
      taglist_container.className = 'show-always';
    }
    else {
      taglist_container.className = 'show-float';
    }
  }
  
  /**
   * 検索結果のページか調べる
   * @returns {boolean} 検索結果のページならtrue、そうでなければfalse
   */
  function isSearchResult() {
    return /^https?:\/\/www\.pixiv\.net\/(search|tags)\.php\?/.test(location.href);
  }

  function addTag() {
    var url = location.href;
    if (!isSearchResult()) {
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
  GM_addStyle(CSS);
  updateHTML();
  GM_registerMenuCommand(SCRIPT_NAME + ' - 設定', function(){ GM_config.open(); });
  GM_registerMenuCommand(SCRIPT_NAME + ' - 現在表示中のタグを追加', function(){ addTag(); });

})();
