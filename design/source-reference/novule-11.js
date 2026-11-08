
/* FOLDER FAQ v6.4 by Novule */
(function () {
var SECTION = '#novule-faq, #folder-faq', SPOT = '#novule-hero';
var OPEN_FIRST = true;          /* open the first answer to start */
var ONE_AT_A_TIME = true;       /* opening one answer closes the others */
var FLIGHT = true;              /* false keeps the folder but switches the flight off */
var WORD_FLIP = false;          /* true = the words of each question also flip into place */
var NUMBER_FLIP = true;         /* false = the number tiles stay still */
var MIN_WIDTH = 1024;
var ENGLISH = { 'español': 'Spanish', 'français': 'French', 'francais': 'French', 'italiano': 'Italian', 'português': 'Portuguese', 'portugues': 'Portuguese', 'deutsch': 'German' };

function q(s, r) { return (r || document).querySelector(s); }
function qa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function txt(e) { return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function two(n) { return (n < 10 ? '0' : '') + n; }
function cl(x) { return Math.max(0, Math.min(1, x)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function io(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function src(img) { return img ? (img.currentSrc || img.getAttribute('data-src') || img.src || '') : ''; }
function still() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

/* ---------- what a Spotlight card says ---------- */
function cardData(li) {
  var ps = qa('.list-item-content__description p', li);
  var codes = ps[1] ? qa('strong', ps[1]).map(txt) : [];
  var eyebrow = ps[0] ? txt(ps[0]) : 'Boarding pass';
  var lang = (eyebrow.split('·')[1] || '').trim();
  var key = lang.toLowerCase();
  return {
    eyebrow: eyebrow, lang: lang, a: codes[0] || 'EN', b: codes[1] || '', title: txt(q('.list-item-content__title', li)),
    img: src(q('.list-item-media img', li) || q('img', li)),
    langEn: ENGLISH[key] || lang
  };
}
function passHTML(d) {
  var parts = d.eyebrow.split('·'), left = (parts[0] || '').trim() + (parts.length > 1 ? ' ·' : '');
  return '<div class="ff-pass"><div class="p-e"><span>' + esc(left) + '</span><span>' + esc(d.lang) + '</span></div>' +
    '<div class="p-r"><span>' + esc(d.a) + '</span><i></i><span>' + esc(d.b) + '</span></div><div class="p-t">' + esc(d.title) + '</div></div>';
}
function cardHTML(d) {
  return '<div class="c-im">' + (d.img ? '<img alt="" src="' + esc(d.img) + '">' : '') + '</div>';
}

/* the folder outline: a tab on the top left, rounded body */
function folderPath(w, h) {
  var th = Math.min(40, h / 4), tw = Math.min(150, w * .42), tr = 14, r = Math.min(26, w / 6), j = 10;
  return "path('M0 " + tr + " A" + tr + " " + tr + " 0 0 1 " + tr + " 0 L" + (tw - tr) + " 0 A" + tr + " " + tr + " 0 0 1 " + tw + " " + tr +
    " L" + tw + " " + (th - j) + " A" + j + " " + j + " 0 0 0 " + (tw + j) + " " + th + " L" + (w - r) + " " + th + " A" + r + " " + r + " 0 0 1 " + w + " " + (th + r) +
    " L" + w + " " + (h - r) + " A" + r + " " + r + " 0 0 1 " + (w - r) + " " + h + " L" + r + " " + h + " A" + r + " " + r + " 0 0 1 0 " + (h - r) + " Z')";
}
function cutFolder() {
  if (!built) return;
  var w = built.shape.offsetWidth, h = built.shape.offsetHeight;
  if (w && h) built.sil.style.clipPath = folderPath(w, h);
}

/* the number tiles flip and the words of the question drop into place, one after the other */
function flipWords(row, text, delay) {
  if (still()) return;
  var t = q('.ff-q', row);
  setTimeout(function () {
    if (NUMBER_FLIP) qa('.ff-flap span', row).forEach(function (tile, k) {
      tile.classList.remove('go'); void tile.offsetWidth;
      setTimeout(function () { tile.classList.add('go'); }, k * 90);
    });
    if (!WORD_FLIP) return;
    t.classList.remove('run');
    t.innerHTML = text.split(' ').map(function (w, i, a) {
      return '<span class="ff-w" style="animation-delay:' + (i * 70) + 'ms">' + esc(w) + (i < a.length - 1 ? ' ' : '') + '</span>';
    }).join('');
    void t.offsetWidth;
    t.classList.add('run');
  }, delay || 0);
}

/* ---------- build the folder FAQ ---------- */
var built = null;
function build() {
  var s = q(SECTION);
  if (!s || built) return;
  if (document.body.classList.contains('sqs-edit-mode-active')) return;
  var list = q('.user-items-list', s), lis = qa('li.list-item', s);
  if (!list || !lis.length) return;
  var data = lis.map(function (li) {
    var d = q('.list-item-content__description', li);
    return { q: txt(q('.list-item-content__title', li)), a: d ? d.innerHTML.trim() : '' };
  }).filter(function (d) { return d.q; });
  if (!data.length) return;
  var tt = q('.list-section-title', s), head = '';
  if (tt) { var c = tt.cloneNode(true); qa('strong, b', c).forEach(function (b) { b.remove(); }); head = txt(c) || txt(tt); }

  var uid = 'ff' + Math.random().toString(36).slice(2, 7);
  var wrap = el('div', 'ff');
  var fold = el('div', 'ff-fold',
    '<div class="ff-shape" aria-hidden="true"><div class="ff-sil"><div class="ff-card"></div></div></div>' +
    '<div class="ff-front">' + (head ? '<h2>' + esc(head).replace(/[?？]/g, '<span class="ff-qm">?</span>') + '</h2>' : '') +
      '</div>');
  wrap.appendChild(fold);
  var box = el('div', 'ff-items');
  var rows = data.map(function (d, i) {
    var n = two(i + 1);
    var r = el('div', 'ff-row',
      '<button class="ff-btn" type="button" aria-expanded="false" aria-controls="' + uid + '-' + i + '" aria-label="' + esc(d.q) + '">' +
        '<span class="ff-flap" aria-hidden="true"><span>' + n.charAt(0) + '</span><span>' + n.charAt(1) + '</span></span>' +
        '<span class="ff-q" aria-hidden="true">' + esc(d.q) + '</span><i class="ff-led" aria-hidden="true"></i></button>' +
      '<div class="ff-ex" id="' + uid + '-' + i + '" role="region"><div><div class="ff-a">' + d.a + '</div></div></div>');
    var btn = q('.ff-btn', r);
    btn.addEventListener('click', function () {
      var open = !r.classList.contains('open');
      if (ONE_AT_A_TIME) rows.forEach(function (x) { x.classList.remove('open'); q('.ff-btn', x).setAttribute('aria-expanded', 'false'); });
      r.classList.toggle('open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) flipWords(r, d.q, 0);
    });
    box.appendChild(r); return r;
  });
  wrap.appendChild(box);
  if (OPEN_FIRST && rows[0]) { rows[0].classList.add('open'); q('.ff-btn', rows[0]).setAttribute('aria-expanded', 'true'); }
  /* the board flips in the first time it comes into view */
  if (window.IntersectionObserver && (WORD_FLIP || NUMBER_FLIP) && !still()) {
    var seen = new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (e.isIntersecting) { rows.forEach(function (r, i) { flipWords(r, data[i].q, i * 180); }); seen.disconnect(); }
    }); }, { threshold: .3 });
    seen.observe(box);
  }

  var ul = q('.user-items-list-item-container', s);
  if (ul && ul.parentNode) ul.parentNode.insertBefore(wrap, ul.nextSibling); else list.appendChild(wrap);
  function align() { if (!ul) return; var cs = getComputedStyle(ul); ['paddingLeft', 'paddingRight', 'marginLeft', 'marginRight', 'maxWidth'].forEach(function (p) { wrap.style[p] = cs[p]; }); }
  align(); window.addEventListener('resize', align);
  s.classList.add('ff-ready');
  built = { s: s, wrap: wrap, fold: fold, card: q('.ff-card', fold), shape: q('.ff-shape', fold), sil: q('.ff-sil', fold) };
  cutFolder();
  if (window.ResizeObserver) new ResizeObserver(cutFolder).observe(built.shape); else window.addEventListener('resize', cutFolder);
}
function teardown() { if (!built) return; built.wrap.remove(); built.s.classList.remove('ff-ready'); built = null; }

/* ---------- file a tutor in the pocket ---------- */
var filedKey = null, current = null;
function file(li, show) {
  if (!built) return;
  if (li) {
    var d = cardData(li), key = d.title + d.img;
    if (filedKey !== key) { built.card.innerHTML = cardHTML(d); filedKey = key; current = d; }
  }
  built.card.classList.toggle('on', !!show && !!current);
}

/* ---------- the flight ---------- */
var fly = null, moving = null, done = false, raf = 0;
function off() {
  return !FLIGHT || window.innerWidth < MIN_WIDTH || document.body.classList.contains('sqs-edit-mode-active') || still();
}
function openLi(spot) { var lis = qa('li.list-item', spot); return q('li.list-item:hover', spot) || lis[lis.length - 1] || null; }
function release() {
  if (moving) { var ct = q('.list-item-content', moving); if (ct) ct.classList.remove('ff-moving'); moving = null; }
  if (fly) fly.style.display = 'none';
  if (built) { built.card.style.transform = ''; built.card.classList.remove('pop'); }
}
function frame() {
  raf = requestAnimationFrame(frame);
  if (!built) return;
  var spot = q(SPOT);
  /* no flight: the folder simply shows a tutor already filed */
  if (!spot || off()) { release(); file(spot && openLi(spot), !!spot); built.card.classList.add('up'); return; }
  built.card.classList.remove('up');

  var vh = window.innerHeight, F = built.fold.getBoundingClientRect();
  var p = cl((vh - F.top) / (vh * .6));
  if (done) { if (p <= 0) { done = false; release(); file(null, false); } return; }
  if (p <= 0) { release(); file(null, false); return; }

  if (!moving) { moving = openLi(spot); if (!moving) return; file(moving, false); }
  var ct = q('.list-item-content', moving), d = current;
  if (!fly) {
    fly = el('div', 'ff-fly'); fly.setAttribute('aria-hidden', 'true');
    document.body.appendChild(fly);
  }
  if (fly.dataset.k !== filedKey) { fly.innerHTML = passHTML(d) + '<div class="ff-card">' + cardHTML(d) + '</div>'; fly.dataset.k = filedKey; }

  /* the open pass in the Spotlight */
  var li = ct.getBoundingClientRect(), b = getComputedStyle(ct, '::before');
  var P = { x: li.left + (parseFloat(b.left) || 0), y: li.top + (parseFloat(b.top) || 0), w: parseFloat(b.width) || li.width, h: parseFloat(b.height) || li.height };
  var rest = built.card, S = built.shape.getBoundingClientRect(), W = S.width, H = S.height;
  ct.classList.add('ff-moving');

  var a = io(cl(p / .62)), flip = io(cl((p - .08) / .46)) * 180, fade = cl((p - .57) / .07);
  if (p >= .66) { done = true; fly.style.display = 'none'; q('.ff-card', fly).style.opacity = ''; file(moving, true); return; }
  /* fly over to the folder, flipping from the pass to the tutor and growing into the folder shape */
  var w = lerp(P.w, W, a), h = lerp(P.h, H, a);
  var x = lerp(P.x, S.left, a), y = lerp(P.y, S.top, a) - Math.sin(Math.PI * a) * 80;
  fly.style.display = 'block';
  fly.style.width = w + 'px'; fly.style.height = h + 'px';
  q('.c-im', fly).style.clipPath = folderPath(w, h);
  fly.style.transformOrigin = '50% 50%';
  fly.style.transform = 'translate(' + x + 'px,' + y + 'px) perspective(1400px) rotate(' + (Math.sin(Math.PI * a) * -6) + 'deg) rotateY(' + flip + 'deg)';
  /* as it lands, the photo settles in behind the pocket */
  q('.ff-card', fly).style.opacity = 1 - fade;
  rest.classList.toggle('on', fade > 0);
}

function start() { build(); if (!raf) raf = requestAnimationFrame(frame); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
window.addEventListener('load', build);
new MutationObserver(function () { if (document.body.classList.contains('sqs-edit-mode-active')) { release(); teardown(); } else build(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
window.addEventListener('mercury:load', function () { release(); teardown(); done = false; filedKey = null; current = null; build(); });
})();
