/* Типографика: короткие предлоги и союзы не остаются в конце строки,
   числа не разрываются («29 900 ₽»), тире не начинает строку.
   Работает после загрузки страницы по всем текстам, включая тексты из админки. */
(function () {
  var NB = '\u00A0';
  var SHORT = /(^|[\s(«"„—–-])([а-яёА-ЯЁ]{1,2}|[A-Za-z]{1,2})\s+(?=\S)/g;
  var NUM = /(\d)\s(?=\d{3}(?!\d))/g;
  var CUR = /(\d)\s(?=(₽|руб|%|мин|дн|км|м²))/g;
  var DASH = /\s([—–])\s/g;
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, CODE: 1, PRE: 1, NOSCRIPT: 1, SVG: 1, OPTION: 1 };
  function fix(t) {
    // дважды — для цепочек вроде «и в Крыму»
    return t.replace(SHORT, '$1$2' + NB).replace(SHORT, '$1$2' + NB).replace(NUM, '$1' + NB).replace(CUR, '$1' + NB).replace(DASH, NB + '$1 ');
  }
  function run(root) {
    if (!root || !document.createTreeWalker) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        while (p && p !== root) {
          if (SKIP[p.nodeName] || (p.isContentEditable)) return NodeFilter.FILTER_REJECT;
          p = p.parentNode;
        }
        return /\s/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });
    var n, list = [];
    while ((n = w.nextNode())) list.push(n);
    for (var i = 0; i < list.length; i++) {
      var v = list[i].nodeValue, f = fix(v);
      if (f !== v) list[i].nodeValue = f;
    }
  }
  window.geobitTypo = run;
  function go() { run(document.body); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
