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

  var Main = function() {
    var self = this;
    this.SCRIPT_NAME = 'pixiv Tags';
    this.SCRIPT_ID = this.SCRIPT_NAME.replace(/ /g, '');
    this.CSS  = `
      #${ this.SCRIPT_ID } {
        background-color : #FFF;
        border: 1px solid #D6DEE5;
        border-radius: 5px;
        padding : 3px;
        line-height : 1.7em;
        overflow : hidden;
        box-sizing: border-box;
      }

      #${ this.SCRIPT_ID }Tags {
        margin: 10px;
      }

      /* ページ左側に固定表示するタイプ */
      #${ this.SCRIPT_ID }.positionFixed, #${ this.SCRIPT_ID }.positionFixedExpand {
        position : fixed;
        left : 10px;
        top : 10px;
        z-index : 998;
      }

      #${ this.SCRIPT_ID }.positionFixed {
        height : 3.7em;
        opacity : 0.8;
      }

      #${ this.SCRIPT_ID }.positionFixed:hover {
        min-width : 300px;
        height : auto;
        opacity : 1;
      }

      /* 折りたたまれている時は中身を表示しない */
      #${ this.SCRIPT_ID }.positionFixed:not(:hover) #${ this.SCRIPT_ID }AddTag,
      #${ this.SCRIPT_ID }.positionFixed:not(:hover) #${ this.SCRIPT_ID }OpenSettings,
      #${ this.SCRIPT_ID }.positionFixed:not(:hover) #${ this.SCRIPT_ID }Tags {
        display: none;
      }

      /* ページ上部に表示するタイプ */
      #${ this.SCRIPT_ID }.positionStatic {
        position : static;
        margin-bottom : 5px;
        width : 100%;
        height : auto;
      }

      /* ボタンと親要素の調整 */
      #${ this.SCRIPT_ID } button {
        float : right;
        margin-top : 0.3em;
      }
      #${ this.SCRIPT_ID } h1 {
        line-height: 2.7em;
      }
    `;

    GM_config.init({
      id: this.SCRIPT_ID + 'Config',
      title: this.SCRIPT_NAME + 'の設定',
      fields: {
        tags: {
          section: ['タグ'],
          label:
`・タグは1行に1つ書いて下さい。<br>
・部分一致で検索したい場合は、タグの後ろにスペースを入れて下さい。<br>
・AND/OR検索もできます。<br>
・タグの後ろに「 --文字数」(スペース、ハイフン2つ、数字)を付けることで、先頭から指定文字数分だけ表示されます。<br>
・タグの後ろに「 --開始位置,文字数」(スペース、ハイフン2つ、数字、カンマ、数字)を付けることで、開始位置から指定文字数分だけ表示されます。例えば「あいうえお --3,2」で「うえ」が表示されます。`,
          type: 'textarea',
          cols: 60,
          rows: 20,
          default:
`「設定」ボタンかGreasemonkeyの「ユーザスクリプトコマンド」でタグを設定できます。
タグは1行に1つ書いて下さい。
部分一致で検索したい場合は、タグの後ろにスペースを入れて下さい。
AND/OR検索もできます。

↓例↓
オリジナル
なにこれかわいい
俺の 黒猫
パチュリー OR パチェ`
        },
        positionFixed: {
          section: ['オプション'],
          label: 'ページの左側に固定表示する',
          type: 'checkbox',
          default: true
        }
      },
      css: `
        #${ this.SCRIPT_ID }Config_field_tags {
          width : 100%;
        }
        #${ this.SCRIPT_ID }Config .field_label {
          font-size : inherit;
          font-weight : inherit;
        }`,
      events: {
        save: function() {
          GM_config.close();
          self.optimizeTags();
          self.updateHTML();
        }
      }
    });
    GM_addStyle(this.CSS);
    this.updateHTML();
    
    GM_registerMenuCommand(this.SCRIPT_NAME + ' - 設定', function(){ GM_config.open(); });
    GM_registerMenuCommand(this.SCRIPT_NAME + ' - 現在表示中のタグを追加', function(){ self.addTag(); });

    // リサイズ時の処理
    (function() {
      var queue = null;

      window.addEventListener('resize', function() {
        // 連続して発生するリサイズイベントをキャンセル
        if (queue != null) {
          clearTimeout(queue);
        }

        // 100ミリ秒待ってから要素のサイズを設定
        queue = setTimeout(function() {
          self.setWidth();
        }, 100);
      }, false);
    })();
  };

  Main.prototype = {
    /**
     * HTMLで使用できない文字を文字実体参照化する
     * @param s 文字実体参照化したい文字列
     * @returns {string} 文字実体参照化した文字列
     */
    escapeHTML: function(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    /**
     * 設定されたタグリストを最適化
     */
    optimizeTags: function() {
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
    },

    /**
     * タグを表示用に短縮する
     * @param tag タグの文字列
     * @returns {object} forSearch 文字数指定部分を削除した検索用タグ
     *                   short 表示用に短縮したタグ
     */
    shortenTag: function(tag) {
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
        limit.forEach(function(element, index, array) {
          array[index] = parseInt(array[index], 10);
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
    },

    /**
     * タグリスト部分のHTMLを作成する
     */
    generateTagListHTML: function() {
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
        tag = this.shortenTag(tags[i]);

        // URLに短縮数字除去+エンコードしたタグを追加
        url += encodeURI(tag.forSearch.replace(/ /g, '+'));

        html += `
          <li class="tag">
            <a class="text" href="${ this.escapeHTML(url) }" title="${ this.escapeHTML(tag.forSearch) }">
              <span class="portal">c</span>${ this.escapeHTML(tag.short) }
            </a>
          </li>
        `;
      }

      return html;
    },

    /**
     * アプリで使用する要素を挿入する
     * @param parentNode 挿入する親要素
     */
    insertAppElement: function(parentNode) {
      var element = document.createElement('div');
      element.id = this.SCRIPT_ID;

      element.innerHTML = `
        <h1 class="unit-title">
          ${ this.SCRIPT_NAME }
          <button id="${ this.SCRIPT_ID }OpenSettings" class="_button">設定</button>
          <button id="${ this.SCRIPT_ID }AddTag" class="_button">検索条件を追加</button>
        </h1>
        <ul id="${ this.SCRIPT_ID }Tags" class="tags">${ this.generateTagListHTML() }</ul>
      `;

      parentNode.insertBefore(element, parentNode.firstChild);

      // 「検索条件を追加」ボタンが押されたらaddTag()を呼び出すように設定
      var self = this;
      var addTagElement = document.getElementById(this.SCRIPT_ID + 'AddTag');
      addTagElement.addEventListener('click', function(){ self.addTag(); }, false);

      // 「設定」ボタンが押されたら設定画面を開くように設定
      var settingsElement = document.getElementById(this.SCRIPT_ID + 'OpenSettings');
      settingsElement.addEventListener('click', function(){ GM_config.open(); }, false);
    },

    /**
     * HTMLを更新する
     */
    updateHTML: function() {
      var parentNode = document.getElementById('wrapper');

      // 挿入先が見当たらなければ何もしない
      if (parentNode == null) {
        return;
      }

      // タグリストが生成済みなら中身だけ書き換え、なければ作成
      var tagsElement = document.getElementById(this.SCRIPT_ID + 'Tags');
      if (tagsElement == null) {
        this.insertAppElement(parentNode);
      }
      else {
        tagsElement.innerHTML = this.generateTagListHTML();
      }

      // 要素の幅を設定
      this.setWidth();

      // 「検索条件を追加」ボタンの有効/無効を切り替え
      var addTagElement = document.getElementById(this.SCRIPT_ID + 'AddTag');
      addTagElement.disabled = !this.isSearchResult();
      
      // 検索結果のページの場合は「検索条件を追加」ボタンの表示を変更
      var tag = this.getTagFromUrl();
      if (tag != null) {
        addTagElement.textContent = '「' + tag + '」を追加する';
      }
    },

    /**
     * 検索結果のページか調べる
     * @returns {boolean} 検索結果のページならtrue、そうでなければfalse
     */
    isSearchResult: function() {
      return /^https?:\/\/www\.pixiv\.net\/(search|tags)\.php\?/.test(location.href);
    },

    /**
     * URLエンコードされたタグをデコードする
     * @param tag {string} デコードしたいタグ
     * @return {string} デコードしたタグ
     */
    decodeTag: function(tag) {
      return decodeURIComponent(tag.replace(/\+/g, ' '));
    },
    
    /**
     * URLからタグを取り出す
     * @return {string} デコードしたタグ。
     *                  検索結果のページでなければnullを返す。
     */
    getTagFromUrl: function() {
      if (!this.isSearchResult()) {
        return null;
      }
      
      var word = location.href.replace(/^.*[\?&](word|tag)=([^&=\?]+).*$/, '$2');
      return this.decodeTag(word);
    },

    /**
     * 表示中の検索結果をタグとして追加する
     */
    addTag: function() {
      var word = this.getTagFromUrl();
      
      if (word == null) {
        window.alert('検索結果を表示した状態で実行して下さい。');
        return;
      }

      var tags = GM_config.get('tags');
      tags += '\n' + word;
      GM_config.set('tags', tags);
      GM_config.write();
      this.updateHTML();

      window.alert('「' + word + '」を追加しました。');
    },

    /**
     * アプリで使用する要素の幅を設定する
     */
    setWidth: function() {
      var appElement = document.getElementById(this.SCRIPT_ID);
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
  };
  
  new Main();
})();
