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

    #${ SCRIPT_ID }Tags {
      margin: 2px;
      padding: 5px;
    }

    /* ページ左側に固定表示するタイプ */
    .positionFixed, .positionFixedExpand {
      position : fixed;
      left : 10px;
      top : 10px;
      z-index : 998;
    }

    .positionFixed {
      height : 3em;
      opacity : 0.8;
    }

    .positionFixed:hover {
      min-width : 300px;
      height : auto;
      opacity : 1;
    }

    /* ページ上部に表示するタイプ */
    .positionStatic {
      position : static;
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
    var pattern = /\s+--((\d+)(,\d+)?)\s*$/;
    var result = pattern.exec(tag);

    if (result == null) {
      forSearch = short = tag;
    }
    else {
      // 文字数指定部分を取り出す
      var limitString = result[1];
      // カンマで分割
      var limit = limitString.split(',');
      
      // 数値化
      limit.forEach(function(element, index, array){
        array[i] = parseInt(array[i], 10);
      });
      
      // 文字数指定部分を削除
      forSearch = short = tag.replace(pattern, '');

      if (limit.length === 1) {
        // 指定が1つの場合は先頭からの文字数

        // 指定文字数を超えていたら短縮
        if (short.length > limit[0]) {
          short = short.substr(0, limit[0]) + '...';
        }
      }
      else {
        // 指定が2つ以上の場合は[0]の位置から[1]の文字数
        
        // 文字列の長さをチェック
        if (limit[0] > 0 && limit[1] > 0 && (limit[0] + limit[1] - 1) <= short.length) {
          short = short.substr(limit[0] - 1, limit[1]) + '...';
        }
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
        <button id="${ SCRIPT_ID }OpenSettings" class="_button">設定</button>
        <button id="${ SCRIPT_ID }AddTag" class="_button">検索条件を追加</button>
      </h1>
      <ul id="${ SCRIPT_ID }Tags" class="tags">${ generateTagListHTML() }</ul>
    `;

    parentNode.insertBefore(element, parentNode.firstChild);

    // 「検索条件を追加」ボタンが押されたらaddTag()を呼び出すように設定
    var addTagElement = document.getElementById(SCRIPT_ID + 'AddTag');
    addTagElement.addEventListener('click', function(){ addTag(); }, false);

    // 「設定」ボタンが押されたら設定画面を開くように設定
    var settingsElement = document.getElementById(SCRIPT_ID + 'OpenSettings');
    settingsElement.addEventListener('click', function(){ GM_config.open(); }, false);
  }

  /**
   * HTMLを更新する
   */
  function updateHTML() {
    var parentNode = document.getElementById('wrapper');

    // 挿入先が見当たらなければ何もしない
    if (parentNode == null) {
      return;
    }

    // タグリストが生成済みなら中身だけ書き換え、なければ作成
    var tagsElement = document.getElementById(SCRIPT_ID + 'Tags');
    if (tagsElement == null) {
      insertAppElement(parentNode);
    }
    else {
      tagsElement.innerHTML = generateTagListHTML();
    }

    // 要素の幅を設定
    setWidth();

    // 「検索条件を追加」ボタンの有効/無効を切り替え
    var addTagElement = document.getElementById(SCRIPT_ID + 'AddTag');
    addTagElement.disabled = !isSearchResult();
  }

  /**
   * 検索結果のページか調べる
   * @returns {boolean} 検索結果のページならtrue、そうでなければfalse
   */
  function isSearchResult() {
    return /^https?:\/\/www\.pixiv\.net\/(search|tags)\.php\?/.test(location.href);
  }

  /**
   * 表示中の検索結果をタグとして追加する
   */
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

  /**
   * アプリで使用する要素の幅を設定する
   */
  function setWidth() {
    var appElement = document.getElementById(SCRIPT_ID);
    if (GM_config.get('positionFixed')) {
      if (document.body.clientWidth >= 1450) {
        // 新しい幅(clientWidthからpixivの幅970px + margin:10px * 4を引いて2で割る)
        var newWidth = Math.round((document.body.clientWidth - 970 - (10 * 4)) / 2);

        appElement.style.width = newWidth + 'px';
        appElement.className = 'positionFixedExpand';
      }
      else {
        appElement.style.width = '8em';
        appElement.className = 'positionFixed';
      }
    }
    else {
      appElement.style.width = 'auto';
      appElement.className = 'positionStatic';
    }
  }

  GM_config.init({
    id: SCRIPT_ID,
    title: SCRIPT_NAME + 'の設定',
    fields: {
      tags: {
        section: ['タグ(各タグは改行で分ける)'],
        type: 'textarea',
        cols: 60,
        rows: 20,
        default: 'Greasemonkeyの「ユーザスクリプトコマンド」でタグを設定できます。\nタグは1行に1つ書いて下さい。\n部分一致で検索したい場合は、タグの後ろにスペースを入れて下さい。\nAND/OR検索もできます。\n\n↓例↓\nオリジナル\nなにこれかわいい\n俺の 黒猫\nパチュリー OR パチェ'
      },
      positionFixed: {
        label: 'ページの左側に固定表示する',
        type: 'checkbox',
        default: true
      }
    },
    css: '#GM_config_field_tags{ width : 100%; }',
    onSave: function() {
      GM_config.close();
      optimizeTags();
      updateHTML();
    }
  });
  GM_addStyle(CSS);
  updateHTML();
  GM_registerMenuCommand(SCRIPT_NAME + ' - 設定', function(){ GM_config.open(); });
  GM_registerMenuCommand(SCRIPT_NAME + ' - 現在表示中のタグを追加', function(){ addTag(); });

  // リサイズ時の処理
  (function(){
    var queue = null;

    window.addEventListener('resize', function() {
      // 連続して発生するリサイズイベントをキャンセル
      if (queue != null) {
        clearTimeout(queue);
      }

      // 100ミリ秒待ってから要素のサイズを設定
      queue = setTimeout(function() {
        setWidth();
      }, 100);
    }, false);
  })();

})();
