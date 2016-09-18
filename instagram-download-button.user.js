// ==UserScript==
// @name        Instagram Download Button
// @namespace   http://saasan.github.io/
// @include     https://www.instagram.com/*
// @version     1.0
// @grant       none
// ==/UserScript==

(function(id){
  // pushstate対策のための以前のURL
  var prevUrl = '';
  // HTML要素
  var section, button;

  // XMLHttpRequestでファイルの取得が完了した時の処理
  function onComplete(filename, file) {
    // ダウンロードボタンを作る
    button = document.createElement('a');
    button.className = '_aj7mu _2hpcs _kenyh _o0442';
    button.innerHTML = 'ダウンロード';

    // HTML5ではa要素にdownload属性を付けると強制的にダウンロードさせることができるが…
    button.download = filename;

    // Firefoxではdownload属性を付けてもmp4がブラウザ内で表示されるのでBlobにしてダウンロードさせる
    var blob = new Blob([ file ], { 'type' : 'application/force-download' });
    button.href = window.URL.createObjectURL(blob);

    // 親のsectionを作る
    section = document.createElement('section');
    section.id = id;
    section.className = '_tfkbw _d39wz';
    section.style.borderBottom = '1px solid #efefef';
    section.appendChild(button);

    // 追加
    var next = document.getElementsByClassName('_tfkbw _d39wz')[0];
    next.parentNode.insertBefore(section, next);
  }

  // DOMが変更されたときの処理
  function onDOMChange() {
    // URLが変わった時だけ処理
    if (location.href === prevUrl) return;

    // pushstate対策のためURLを保存
    prevUrl = location.href;

    // 以前のダウンロードボタンが残っていたら削除
    var oldElement = document.getElementById(id);
    if (oldElement) {
      oldElement.parentNode.removeChild(oldElement);
    }

    // パスが/p/の時だけ処理
    if (!location.pathname.match(/^\/p\//)) return;

    // メディアのURLとファイル名を取得
    var url = document.querySelector('._e0mru [src^="https://scontent.cdninstagram.com/"]').src;
    var filename = url.split('/').pop();
    filename = filename.split('?').shift();

    // Firefoxではdownload属性を付けてもmp4がブラウザ内で表示されるのでBlobにしてダウンロードさせる
    var r = new XMLHttpRequest();
    r.open('GET', url, true);
    r.responseType = 'blob';
    r.addEventListener('load', function(){
      onComplete(filename, r.response);
    });
    r.send();
  }

  // onpopstateではpushstateされた時に対応できないので、DOMの変更を監視
  var mo = new MutationObserver(onDOMChange);
  var options = { childList: true, subtree: true };
  mo.observe(document.body, options);
})('InstagramDownloadButton');
