
/* Tutor Cube Hero v28 by Novule. Everything is edited in the List section:
   Section title    "Hey = Ehi, Hi = Hola, Hello = Bonjour"  -> word pairs: English on the left, the translation on the right
                    "Say, Sí!, Oui, Sì!"  -> "Say" stays on the left, the other words take turns on the right
                    (commas, ? or | all work as separators)
   One List item per tutor, in the same order as the words:
     Item title       -> tutor's name (e.g. Connor)
     Item description -> line 1 their language (e.g. Italian)
                         line 2 the word on the folder (e.g. Ehi)
                         line 3 a small line (e.g. means hello)
                         line 4 optional: how to say it, between slashes (e.g. /eh-ee/)
                         (or all on one line with dots: Italian · Ehi · means hello)
     Item image       -> their photo, on a face of the cube
     Item button      -> optional: where their folder links to
   One List item WITHOUT an image -> the headline: its title is the big line bottom left,
                         its description (optional) is a small line under it
   Section button (turn it on in the List section) -> the button bottom left
   Section background image (Squarespace section settings) -> treated with BG_MODE
   Smart touches: the cube opens on the tutor who speaks the visitor's browser language,
   and tapping the folder says the greeting out loud. Add ?hello=fr (or es, it...) to the page address to demo a language. */
(function () {
var SECTION = '#novule-cube'; /* the section's Anchor Link (section settings) must be novule-cube */
var WORD_SECONDS = 3;        /* how long each tutor and word stays */
var TILT = true;             /* cube and words lean towards the mouse */
var CUBE_STYLE = 'folderword'; /* cube design: 'folderword', 'folder', 'photo', 'framed', 'polaroid', 'word', 'arch', 'block', 'sliced', 'glass' */
var GAP = 0; 
var TOP_SPACE = 24;          /* space above the cube when this section is NOT the first on the page, in px */
                /* space between the header and the top of the cube, in px */
var LAYOUT = 'corners';      /* 'corners' = headline + button bottom left, tutor details top right. 'centre' = name under the cube */
var HEADLINE = 'Learn it from a person, not an app.'; /* used only if there is no List item without an image */
var META_LABEL = 'Your first word'; /* small title above the tutor details, top right ('' to hide) */
var FOLDER_DEPTH = 22;       /* how thick the folders are, in px (0 = flat) */
var SHAPE = 'cube';          /* 'cube' = a closed cube, 'ring' = four folders turning in a ring */
var SHRINK = .45;            /* how much the cube and words shrink as you scroll away (0 = no shrink) */
var TAB_OPEN = 0;            /* how far the name tab tips forward, like it is about to open (0 = flat) */
var WORD_STYLE = 'straight'; /* 3D words: 'straight' (face forward, depth follows the mouse) or 'tilted' */
var REST_ANGLE = 22;         /* how much the cube shows its side at rest (0 = flat on) */
var EXTRUDE = true;          /* chunky 3D side words */
var DEPTH = 26;              /* how deep the 3D words are */
var FIT_HEIGHT = true;       /* hero is only as tall as it needs to be, so there is no empty gap before the next section */
var BOTTOM_SPACE = 8;        /* extra space under the hint before the next section, in px */
var BG_MODE = 'knockout';    /* section background image: 'knockout' (only inside the words), 'frosted', 'duotone', 'photo' */
var WORD_FACE = 'blush';     /* front of the 3D words: 'ink', 'blush', 'wine', 'cream', 'tutor' (photo of the tutor on show) or 'bg' (section background photo) */
var LINE = 'Your {lang} tutor'; /* the line under the name, {lang} is the item description */
var GREET_VISITOR = true;    /* open on the tutor who speaks the visitor's language */
var SPEAK = true;            /* tap the folder to hear the greeting */
var SAY_IT = true;           /* the little 'Say it' bubble on the corner of the cube (tap it to hear the word) */
var SAY_LABEL = 'Say it';    /* small label in the bubble */
var HINT = 'Tap the folder to hear it'; /* small hint under the name ('' to hide) */
var LANGS = { english: 'en', spanish: 'es', french: 'fr', italian: 'it', portuguese: 'pt', german: 'de', dutch: 'nl', swedish: 'sv', norwegian: 'no', danish: 'da', finnish: 'fi', polish: 'pl', turkish: 'tr', greek: 'el', romanian: 'ro', russian: 'ru', ukrainian: 'uk', arabic: 'ar', hebrew: 'he', hindi: 'hi', japanese: 'ja', korean: 'ko', chinese: 'zh', mandarin: 'zh', cantonese: 'zh-HK', thai: 'th', vietnamese: 'vi', indonesian: 'id', swahili: 'sw', yoruba: 'yo', czech: 'cs', hungarian: 'hu' };
var state = null;
function cfg(k, v) { return (window.FB_CFG && window.FB_CFG[k] != null) ? window.FB_CFG[k] : v; }
function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
function imgSrc(img) { if (!img) return ''; var u = img.getAttribute('data-src') || img.currentSrc || img.src || ''; if (u.indexOf('data:') === 0) return ''; return u.split('?')[0] + (u.indexOf('squarespace-cdn') > -1 ? '?format=1000w' : ''); }
function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function mod(a, n) { return ((a % n) + n) % n; }
function x3(word, face, flat) {
var n = cfg('DEPTH', DEPTH), h = '<span class="x3w"><span class="x3 ' + face + '">';
for (var k = n; k >= 1; k--) h += '<span class="ly" style="transform:' + (flat ? 'translate(calc(var(--ex) * ' + k + '), calc(var(--ey) * ' + k + '))' : 'translateZ(' + (-k * 2.6).toFixed(1) + 'px)') + ';color:color-mix(in srgb, var(--fb-side-depth), #000 ' + Math.round(22 + k / n * 50) + '%)">' + esc(word) + '</span>';
return h + '<span class="ly ln">' + esc(word) + '</span><span class="ly lf">' + esc(word) + '</span><span class="sz">' + esc(word) + '</span></span></span>';
}
function build() {
var s = document.querySelector(SECTION);
if (!s || state) return;
if (document.body.classList.contains('sqs-edit-mode-active')) return;
var items = Array.prototype.slice.call(s.querySelectorAll('li.list-item'));
if (!items.length) return;
var EX = cfg('EXTRUDE', EXTRUDE), MODE = cfg('BG_MODE', BG_MODE), FACE = cfg('WORD_FACE', WORD_FACE), WS = cfg('WORD_STYLE', WORD_STYLE);
var btn = s.querySelector('.list-section-button-container a');
var data = items.map(function (li) {
var b = li.querySelector('.list-item-content__button-container a, a.list-item-content__button');
var dEl = li.querySelector('.list-item-content__description'), ps = [];
if (dEl) { var tmp = document.createElement('div'); tmp.innerHTML = dEl.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d)>/gi, '\n'); ps = (tmp.textContent || '').split('\n').map(function (x) { return x.replace(/\s+/g, ' ').trim(); }).filter(function (x) { return x; }); }
if (ps.length === 1 && /[\u00B7\u2022|]/.test(ps[0])) ps = ps[0].split(/[\u00B7\u2022|]/).map(function (x) { return x.trim(); }).filter(function (x) { return x; });
var title = txt(li.querySelector('.list-item-content__title')), raw = ps.join(' ');
ps = ps.filter(function (x) { return !/^\[.*\]$/.test(x); });
ps = ps.reduce(function (a, x) { var m = x.match(/^([A-Za-z]+)([A-Z\u00C0-\u00DE\u00A1\u00BF].*)$/); if (m && LANGS[m[1].toLowerCase()]) { a.push(m[1], m[2].trim()); } else a.push(x); return a; }, []);
var pr = ''; ps = ps.filter(function (x) { if (!pr && /^\/.+\/$/.test(x)) { pr = x; return false; } return true; });
var li2 = -1, lg = '';
ps.forEach(function (x, i) { var w = x.replace(/^learning\s+/i, '').toLowerCase().split(/[\s(]/)[0]; if (li2 < 0 && LANGS[w]) { li2 = i; lg = x.replace(/^learning\s+/i, ''); } });
if (li2 < 0 && ps.length) { li2 = 0; lg = ps[0].replace(/^learning\s+/i, ''); }
var rest = ps.filter(function (x, i) { return i !== li2; });
var nm = title, gr = rest[0] || '', sy = rest[1] || '';
if (/[!\u00A1\u00BF?]/.test(title) || /\[[^\]]*\]/.test(raw)) { gr = title; nm = ''; sy = rest[0] && !/[!\u00A1\u00BF?]/.test(rest[0]) && rest[0].split(' ').length > 1 ? rest[0] : ''; if (rest[0] && rest[0].split(' ').length === 1 && !/[!\u00A1\u00BF?]/.test(rest[0])) nm = rest[0]; }
return { img: imgSrc(li.querySelector('.list-item-media img')), name: nm, lang: lg, code: LANGS[lg.toLowerCase().split(/[\s(]/)[0]] || '', greet: gr, say: sy, pron: pr, sub: raw,
href: (b && b.getAttribute('href')) || (btn && btn.getAttribute('href')) || '' };
});
var headItem = null;
data = data.filter(function (d) { if (!d.img && !headItem) { headItem = d; return false; } return true; });
if (!data.length) return;
var picked = null, startStep = 0;
if (cfg('GREET_VISITOR', GREET_VISITOR)) {
var force = (location.search.match(/[?&]hello=([a-z-]+)/i) || [])[1] || cfg('FORCE_LANG', '');
var prefs = force ? [force] : (navigator.languages || [navigator.language || '']);
for (var pi2 = 0; pi2 < prefs.length && !picked; pi2++) {
var base = String(prefs[pi2]).toLowerCase(), b2 = base.split('-')[0];
for (var di = 0; di < data.length; di++) { var c = (data[di].code || '').toLowerCase(); if (c && (c === base || c.split('-')[0] === b2)) { picked = data[di]; startStep = di; break; } }
if (b2 === 'en' && !force) break;
}
}
var words = txt(s.querySelector('.list-section-title')).split(/[?,|]/).map(function (w) { return w.trim(); }).filter(function (w) { return w; });
var pairs = words.some(function (w) { return w.indexOf('=') > 0; });
var leftWords, rightWords;
if (pairs) {
leftWords = []; rightWords = [];
words.forEach(function (w) { var p = w.split('='); leftWords.push((p[0] || '').trim()); rightWords.push((p[1] || p[0] || '').trim()); });
} else {
if (words.length === 1 && words[0].indexOf(' ') > 0) { var sp = words[0].indexOf(' '); words = [words[0].slice(0, sp), words[0].slice(sp + 1)]; }
if (!words.length) words = ['Say', 'hello.'];
leftWords = [words[0]]; rightWords = words.slice(1);
if (!rightWords.length) rightWords = [''];
}
if (pairs) {
var clean = function (x) { return String(x || '').toLowerCase().replace(/[!\u00A1\u00BF?.]/g, '').trim(); };
var L2 = [], R2 = [];
data.forEach(function (d, i) {
var g = clean(d.greet), k = -1;
rightWords.forEach(function (r, j) { if (k < 0 && g && clean(r) === g) k = j; });
var mean = ((d.say || '').match(/^means\s+(.+)$/i) || [])[1];
R2.push(d.greet || rightWords[i % rightWords.length] || '');
L2.push(k >= 0 ? leftWords[k] : (mean ? mean.charAt(0).toUpperCase() + mean.slice(1) : (leftWords[i % leftWords.length] || '')));
});
leftWords = L2; rightWords = R2;
}
var leftWord = leftWords[0];
var bgEl = s.querySelector('.section-background img'), bg = bgEl ? (bgEl.getAttribute('data-src') || bgEl.currentSrc || bgEl.src || '').split('?')[0] : '';
if (bg.indexOf('data:') === 0) bg = '';
var fp = ((bgEl && bgEl.getAttribute('data-image-focal-point')) || '0.5,0.5').split(',').map(parseFloat);
if (bg && bg.indexOf('squarespace-cdn') > -1) bg += '?format=2500w';
if (FACE === 'auto') FACE = !bg ? 'wine' : (MODE === 'knockout' || MODE === 'frosted') ? 'bg' : MODE === 'duotone' ? 'cream' : 'wine';
var faceCls = FACE === 'bg' ? (bg ? 'bgfill' : 'wine') : FACE === 'tutor' ? 'tutorfill' : FACE;
var flat = WS === 'straight';

var stage = el('div', 'fb-stage');
if (bg) { stage.appendChild(el('div', 'fb-wash', MODE === 'knockout' ? '' : '<img src="' + esc(bg) + '" alt="" style="object-position:' + (fp[0] * 100) + '% ' + (fp[1] * 100) + '%">')); s.classList.add('fb-bg-' + MODE); }
var mid = el('div', 'fb-mid');
mid.appendChild(el('div', 'fb-floor'));
var CS = cfg('CUBE_STYLE', CUBE_STYLE), RING = cfg('SHAPE', SHAPE) === 'ring' && CS !== 'sliced';
if (RING) mid.classList.add('fb-ring');
mid.classList.add('cs-' + CS);
var cube = el('div', 'fb-cube');
var slices = [], faces;
function depthHTML() {
return cfg('FOLDER_DEPTH', FOLDER_DEPTH) ? '<i class="w wt"></i><i class="w wb"></i><i class="w wl"></i><i class="w wr"></i>' : '';
}
function tabHTML() {
return '<span class="tabw" style="transform:rotateX(' + (-cfg('TAB_OPEN', TAB_OPEN)) + 'deg)">' + (cfg('FOLDER_DEPTH', FOLDER_DEPTH) ? '<i class="w tt"></i><i class="w tlw"></i><i class="w trw"></i>' : '') + '<span class="tab"><em></em></span></span>';
}
function faceHTML() {
if (CS === 'framed') return '<span class="pf"><img alt="" draggable="false"></span><em></em><span class="fb-shade"></span>';
if (CS === 'folderword') return depthHTML() + tabHTML() + '<span class="body"><span class="ph"><img alt="" draggable="false"><span class="hear" aria-hidden="true"><i></i><i></i><i></i><i></i></span></span></span><span class="fb-shade"></span>';
if (CS === 'folder') return '<span class="tab"><em></em></span><span class="body"><img alt="" draggable="false"></span><span class="fb-shade"></span>';
if (CS === 'polaroid') return '<span class="pf"><img alt="" draggable="false"></span><em></em><span class="fb-shade"></span>';
if (CS === 'word') return '<span class="pf"><img alt="" draggable="false"></span><strong></strong><em></em><span class="fb-shade"></span>';
if (CS === 'arch') return '<span class="pf"><img alt="" draggable="false"></span><em></em><span class="fb-shade"></span>';
if (CS === 'glass') return '<span class="pf"><img alt="" draggable="false"></span><em></em><span class="gl"></span>';
return '<img alt="" draggable="false"><em></em><span class="fb-shade"></span>';
}
if (CS === 'sliced') {
for (var si = 0; si < 3; si++) { var sl = el('div', 'fb-slice'); sl.style.top = (si * 100 / 3) + '%'; slices.push({ el: sl, a: 0, f: [0, 1, 2, 3].map(function () { var f = el('div', 'fb-fc', '<span class="fb-shade"></span>'); sl.appendChild(f); return f; }) }); cube.appendChild(sl); }
faces = slices[0].f;
} else {
faces = [0, 1, 2, 3].map(function () { var f = el('div', 'fb-fc', faceHTML()); f.style.setProperty('--fd', cfg('FOLDER_DEPTH', FOLDER_DEPTH) + 'px'); cube.appendChild(f); return f; });
}
if (CS === 'block') { cube.appendChild(el('div', 'fb-capt')); cube.appendChild(el('div', 'fb-capb')); }
mid.appendChild(cube);
if (CS === 'glass') mid.appendChild(el('div', 'fb-glow'));
stage.appendChild(mid);
var leftEl = el('p', 'fb-side fb-left', EX ? x3(leftWord, faceCls, flat) : esc(leftWord));
var rightEl = el('p', 'fb-side fb-right', EX ? x3(rightWords[0], faceCls, flat) : esc(rightWords[0]));
stage.appendChild(leftEl); stage.appendChild(rightEl);
if (flat) stage.classList.add('fb-flat');
var cap = el('a', 'fb-cap');
stage.appendChild(cap);
var canSpeak = cfg('SPEAK', SPEAK) && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
if (canSpeak) { mid.classList.add('can-speak'); try { speechSynthesis.getVoices(); } catch (err) {} }
var hint = null, corners = cfg('LAYOUT', LAYOUT) === 'corners', intro = null, meta = null, dots = null;
if (corners) {
stage.classList.add('fb-corners');
var hl = headItem ? (headItem.name || headItem.greet) : cfg('HEADLINE', HEADLINE), hs = headItem ? headItem.sub : '';
intro = el('div', 'fb-intro', (hl ? '<h2 class="fb-head">' + esc(hl) + '</h2>' : '') + (hs ? '<p class="fb-sub">' + esc(hs) + '</p>' : '') + (canSpeak && cfg('HINT', HINT) ? '<span class="fb-tip">' + esc(cfg('HINT', HINT)) + '</span>' : '') + (btn ? '<div class="fb-row"><a class="fb-btn" href="' + esc(btn.getAttribute('href') || '#') + '">' + esc(txt(btn)) + '</a></div>' : ''));
stage.appendChild(intro);
meta = el('div', 'fb-meta', (cfg('META_LABEL', META_LABEL) ? '<b class="fb-ml">' + esc(cfg('META_LABEL', META_LABEL)) + '</b>' : '') + '<span class="fb-m1"></span><span class="fb-m2"></span>');
stage.appendChild(meta);
if (data.length > 1) { dots = el('div', 'fb-dots', data.map(function (d, i) { return '<button type="button" data-i="' + i + '" aria-label="' + esc(d.lang || d.name) + '">' + esc((d.code || d.lang.replace(/[^A-Za-z\u00C0-\u00FF]/g, '') || d.name || '?').slice(0, 2).toUpperCase()) + '</button>'; }).join('')); stage.appendChild(dots); }
} else if (canSpeak && cfg('HINT', HINT)) { hint = el('span', 'fb-hint', esc(cfg('HINT', HINT))); stage.appendChild(hint); }
var say = null;
if (canSpeak && cfg('SAY_IT', SAY_IT)) {
say = el('button', 'fb-say', '<span class="fb-pl"></span><span class="fb-st">' + (cfg('SAY_LABEL', SAY_LABEL) ? '<small>' + esc(cfg('SAY_LABEL', SAY_LABEL)) + '</small>' : '') + '<b></b></span><span class="fb-wv"><i></i><i></i><i></i><i></i><i></i><i></i></span>');
say.type = 'button';
mid.appendChild(say); mid.classList.add('has-say');
say.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
say.addEventListener('click', function (e) { e.stopPropagation(); speak(); });
}
mid.setAttribute('tabindex', '0'); mid.setAttribute('role', 'button');
s.appendChild(stage);
s.classList.add('fb-ready');
if (!window.__fbHdr) { window.__fbHdr = function () { var hs = document.querySelector(SECTION + '.fb-ready'), hd = document.querySelector('#header, header.header'), hb = hd ? hd.getBoundingClientRect().bottom : 0; document.documentElement.classList.toggle('fb-top', !!hs && hs.getBoundingClientRect().bottom > hb + 2); }; window.addEventListener('scroll', window.__fbHdr, { passive: true }); window.addEventListener('resize', window.__fbHdr); }
window.__fbHdr();

var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var mobile = window.matchMedia('(max-width: 767px)');
var lw = EX ? leftEl.querySelector('.x3w') : null, rw = EX ? rightEl.querySelector('.x3w') : null;
state = { s: s, stage: stage, A: 0, T: 0, v: 0, step: null, drag: false, mx: 0, my: 0, tx: 0, ty: 0, raf: 0, last: 0, t0: performance.now(), visible: true, timer: 0 };

function setFace(k, step) {
var d = data[mod(step, data.length)];
if (CS === 'sliced') { slices.forEach(function (sl) { sl.f[mod(k, 4)].style.backgroundImage = d.img ? 'url(' + d.img + ')' : ''; }); return; }
var f = faces[mod(k, 4)], im = f.querySelector('img');
if (d.img && im.getAttribute('src') !== d.img) im.src = d.img;
var em = f.querySelector('em'); if (em) em.textContent = (CS === 'polaroid' || CS === 'folderword') && d.name ? d.name + (d.lang ? ' \u00B7 ' + d.lang : '') : d.lang;
var st = f.querySelector('strong'); if (st) { st.textContent = d.greet || rightWords[mod(step, rightWords.length)] || ''; st.style.setProperty('--wf', Math.min(1, 6 / Math.max(1, st.textContent.length)).toFixed(3)); }
var sm = f.querySelector('.wd small'); if (sm) sm.textContent = d.say || (d.lang ? 'means hello in ' + d.lang : '');
}
function speak() {
if (!canSpeak || !state) return;
var d = data[mod(state.step, data.length)], word = (d.greet || rightWords[mod(state.step, rightWords.length)] || '').replace(/[\u00A1!\u00BF?.]/g, '').trim();
if (!word) return;
try {
speechSynthesis.cancel();
var u = new SpeechSynthesisUtterance(word), code = d.code || 'en';
u.lang = code; u.rate = .9;
var vs = speechSynthesis.getVoices().filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf(code.toLowerCase().split('-')[0]) === 0; });
if (vs.length) u.voice = vs[0];
mid.classList.add('speaking');
u.onend = u.onerror = function () { mid.classList.remove('speaking'); };
speechSynthesis.speak(u);
setTimeout(function () { mid.classList.remove('speaking'); }, 2500);
} catch (err) {}
if (hint) hint.classList.add('gone');
var tp = stage.querySelector('.fb-tip'); if (tp) tp.classList.add('gone');
}
function tutorFill(d) { if (faceCls === 'tutorfill' && d.img) stage.style.setProperty('--x3-img', 'url(' + d.img + ')'); }
function capHTML(d) { return '<b>' + esc(d.name) + '</b><i>' + esc(cfg('LINE', LINE).replace('{lang}', d.lang)) + (d === picked && !state.moved ? ' \u00B7 picked for you' : '') + '</i><span class="ar">&#8594;</span>'; }
function setSay(d, step) {
if (!say) return;
var w = d.greet || rightWords[mod(step, rightWords.length)] || '';
say.querySelector('b').innerHTML = esc(w) + (d.pron ? ' <em>' + esc(d.pron) + '</em>' : '');
say.setAttribute('aria-label', 'Hear ' + w);
}
function setMeta(d, step) {
setSay(d, step);
if (!meta) return;
var w = d.greet || rightWords[mod(step, rightWords.length)] || '';
meta.querySelector('.fb-m1').textContent = w + (d.say ? ' \u00B7 ' + d.say : (w ? ' \u00B7 means hello' : ''));
meta.querySelector('.fb-m2').textContent = (d.lang || '') + (d.name ? (d.lang ? ', with ' : 'With ') + d.name : '');
if (dots) Array.prototype.forEach.call(dots.querySelectorAll('button'), function (b, i) { b.classList.toggle('on', i === mod(step, data.length)); });
}
function setWord(step, first) {
var d = data[mod(step, data.length)], w = rightWords[mod(step, rightWords.length)];
for (var k = -1; k <= 2; k++) setFace(step + k, step + k);
mid.setAttribute('aria-label', (canSpeak ? 'Hear ' : '') + (d.greet || w) + ', ' + d.name + ', ' + d.lang + ' tutor');
if (first) { cap.innerHTML = capHTML(d); cap.href = d.href || '#'; tutorFill(d); setMeta(d, step);
if (pairs) { var lw0 = leftWords[mod(step, leftWords.length)]; Array.prototype.forEach.call(leftEl.querySelectorAll('.ly,.sz'), function (n) { n.textContent = lw0; }); Array.prototype.forEach.call(rightEl.querySelectorAll('.ly,.sz'), function (n) { n.textContent = w; }); fit(); }
return; }
var lwNew = leftWords[mod(step, leftWords.length)];
var swapLeft = pairs && leftWords.length > 1;
rightEl.classList.add('out'); cap.classList.add('sw'); if (meta) meta.classList.add('sw'); if (say) say.classList.add('sw'); if (swapLeft) leftEl.classList.add('out');
setTimeout(function () {
if (!state) return;
if (EX) Array.prototype.forEach.call(rightEl.querySelectorAll('.ly,.sz'), function (n) { n.textContent = w; }); else rightEl.textContent = w;
if (swapLeft) { if (EX) Array.prototype.forEach.call(leftEl.querySelectorAll('.ly,.sz'), function (n) { n.textContent = lwNew; }); else leftEl.textContent = lwNew; }
cap.innerHTML = capHTML(d); cap.href = d.href || '#'; setMeta(d, step); if (meta) meta.classList.remove('sw'); if (say) say.classList.remove('sw');
tutorFill(d);
fit(); alignBg();
rightEl.classList.remove('out'); cap.classList.remove('sw'); leftEl.classList.remove('out');
}, 240);
}
function layout() {
var W = mid.clientWidth, H = mid.clientHeight;
var all = CS === 'sliced' ? slices.reduce(function (a, s2) { return a.concat(s2.f); }, []) : faces;
if (!RING) all.forEach(function (f, i) { f.style.transform = 'rotateY(' + ((i % 4) * 90) + 'deg) translateZ(' + (W / 2) + 'px)'; });
slices.forEach(function (sl, si) { sl.f.forEach(function (f) { f.style.backgroundSize = W + 'px ' + H + 'px'; f.style.backgroundPosition = '50% ' + (-si * H / 3) + 'px'; }); });
var ct = cube.querySelector('.fb-capt'), cb = cube.querySelector('.fb-capb');
if (ct) { ct.style.cssText = 'width:' + W + 'px;height:' + W + 'px;top:' + ((H - W) / 2) + 'px;transform:rotateX(90deg) translateZ(' + (H / 2) + 'px)'; cb.style.cssText = 'width:' + W + 'px;height:' + W + 'px;top:' + ((H - W) / 2) + 'px;transform:rotateX(-90deg) translateZ(' + (H / 2) + 'px)'; }
}
function place() {
if (mobile.matches) { stage.style.removeProperty('--fb-cy'); stage.style.removeProperty('--fb-ch'); stage.style.height = ''; mid.style.width = ''; mid.style.height = ''; return; }
var hd = document.querySelector('#header, header.header, header');
stage.style.height = '';
var R = stage.getBoundingClientRect(), hb = hd ? hd.getBoundingClientRect().bottom - R.top + window.scrollY * 0 : 110;
if (hb < 0 || hb > R.height * .4) hb = (R.top + (window.scrollY || 0) > 200) ? cfg('TOP_SPACE', TOP_SPACE) : 110;
mid.style.width = ''; mid.style.height = '';
var W = mid.clientWidth, H = mid.clientHeight, gap = cfg('GAP', GAP);
var maxH = R.height - hb - gap - (corners ? 96 : 120);
if (H > maxH && maxH > 160) { W = maxH / 1.15; H = maxH; mid.style.width = W + 'px'; mid.style.height = H + 'px'; }
stage.style.setProperty('--fb-cy', (hb + gap + H / 2) + 'px');
stage.style.setProperty('--fb-ch', H + 'px');
stage.style.setProperty('--fb-hb', hb + 'px');
stage.style.setProperty('--fb-gap', gap + 'px');
stage.style.removeProperty('--fb-mt'); stage.style.removeProperty('--fb-bb');
if (corners) { clearTimeout(state.al); state.al = setTimeout(alignCorners, 1300); }
if (cfg('FIT_HEIGHT', FIT_HEIGHT)) stage.style.height = Math.round(hb + gap + H + (corners ? 110 : 50 + 26 + (hint ? 44 : 6)) + cfg('BOTTOM_SPACE', BOTTOM_SPACE)) + 'px';
}
function fit() {
var ws = [leftEl, rightEl];
ws.forEach(function (w) { w.style.fontSize = ''; w.style.left = ''; w.style.right = ''; });
if (mobile.matches) return;
var SW = stage.clientWidth, half = mid.clientWidth * (RING ? .8 : flat ? .66 : .72), gap = Math.max(14, SW * .012);
var M = corners ? Math.max(24, SW * .04) : SW * .025;
var room = SW / 2 - half - gap - M;
half = mid.clientWidth * (RING ? .8 : flat ? .62 : .72);
room = SW / 2 - half - gap - M;
var max = parseFloat(getComputedStyle(leftEl).fontSize), size = max;
var extra = (cfg('DEPTH', DEPTH) * .0055 * 1.3 + .08) * max;
leftWords.concat(rightWords).forEach(function (wd) {
var probe = el('span', '', esc(wd));
probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:inherit';
leftEl.appendChild(probe); var wid = probe.offsetWidth + extra; leftEl.removeChild(probe);
if (wid > room) size = Math.min(size, max * room / wid);
});
size = Math.max(40, size);
if (size < max) ws.forEach(function (w) { w.style.fontSize = size + 'px'; });
if (corners) { leftEl.style.right = 'auto'; leftEl.style.left = M + 'px'; rightEl.style.left = 'auto'; rightEl.style.right = M + 'px'; }
else { leftEl.style.left = 'auto'; leftEl.style.right = (SW / 2 + half + gap) + 'px'; rightEl.style.right = 'auto'; rightEl.style.left = (SW / 2 + half + gap) + 'px'; }
}
function alignCorners() {
if (!state || !corners || mobile.matches) return;
if (Math.abs(state.T - state.A) > 1 || state.drag || progress() > 0) { clearTimeout(state.al); state.al = setTimeout(alignCorners, 500); return; }
var sr = stage.getBoundingClientRect(), top = Infinity, bot = -Infinity, bob = parseFloat(cube.parentNode.style.getPropertyValue('--bob')) || 0;
var fr = null, lo = 9;
faces.forEach(function (f) { var sh = f.querySelector('.fb-shade'), o = sh ? parseFloat(sh.style.opacity || 0) : 0; if (o < lo) { lo = o; fr = f; } });
if (fr) { var rt = (fr.querySelector('.tab') || fr).getBoundingClientRect(), rb = (fr.querySelector('.body') || fr).getBoundingClientRect(); top = rt.top; bot = rb.bottom; }
if (!isFinite(top)) return;
stage.style.setProperty('--fb-mt', Math.round(top - bob - sr.top) + 'px');
stage.style.setProperty('--fb-bb', Math.max(16, Math.round(sr.bottom - (bot - bob))) + 'px');
}
var bgSize = null;
function alignBg() {
if (faceCls !== 'bgfill' || !bgSize) return;
var R = stage.getBoundingClientRect();
var sc = Math.max(R.width / bgSize[0], R.height / bgSize[1]), w = bgSize[0] * sc, h = bgSize[1] * sc;
var ox = (R.width - w) * fp[0], oy = (R.height - h) * fp[1];
Array.prototype.forEach.call(stage.querySelectorAll('.x3 .lf'), function (n) {
var r = n.getBoundingClientRect();
n.style.backgroundSize = '100% 100%, ' + w.toFixed(0) + 'px ' + h.toFixed(0) + 'px';
n.style.backgroundPosition = '0 0, ' + (ox - (r.left - R.left)).toFixed(1) + 'px ' + (oy - (r.top - R.top)).toFixed(1) + 'px';
});
}
if (faceCls === 'bgfill') { stage.style.setProperty('--x3-bg', 'url(' + bg + ')'); var pi = new Image(); pi.onload = function () { bgSize = [pi.naturalWidth, pi.naturalHeight]; alignBg(); }; pi.src = bg; }
function progress() { var r = stage.getBoundingClientRect(); return clamp(-r.top / (r.height * .85), 0, 1); }
function render(now) {
var tt = (now - state.t0) / 1000, p = progress();
var W = mid.clientWidth, rest = cfg('REST_ANGLE', REST_ANGLE);
var ang = state.A + rest + state.tx * 18 + p * 50;
var rx = (CS === 'block' ? -20 : CS === 'folderword' ? -11 : -6) - state.ty * 10;
if (CS === 'sliced') {
cube.style.transform = 'translateZ(' + (-W / 2) + 'px) rotateX(' + rx.toFixed(2) + 'deg)';
slices.forEach(function (sl, si) { sl.a += (ang - sl.a) * (si === 0 ? .2 : si === 1 ? .11 : .065); if (state.fr === undefined) sl.a = ang; sl.el.style.transform = 'rotateY(' + sl.a.toFixed(2) + 'deg)';
sl.f.forEach(function (f, k) { var c = Math.cos((sl.a + k * 90) * Math.PI / 180); f.querySelector('.fb-shade').style.opacity = clamp((1 - c) * .32, 0, .55).toFixed(3); }); });
} else if (RING) {
var H2 = mid.clientHeight, RX = W * .45, RZ = W * .42, RY = H2 * .08;
cube.style.transform = 'translateY(var(--bob, 0px)) rotateX(' + (-7 - state.ty * 6).toFixed(2) + 'deg) rotateY(' + (state.tx * 6).toFixed(2) + 'deg)';
faces.forEach(function (f, k) {
var t = (ang + k * 90) * Math.PI / 180, sn = Math.sin(t), c = Math.cos(t), sh = f.querySelector('.fb-shade');
f.style.transform = 'translate3d(' + (sn * RX).toFixed(1) + 'px,' + (c * RY).toFixed(1) + 'px,' + (c * RZ).toFixed(1) + 'px) rotateY(' + (sn * 26).toFixed(2) + 'deg)';
if (sh) sh.style.opacity = ((1 - c) * .22).toFixed(3);
});
} else {
cube.style.transform = 'translateY(var(--bob, 0px)) translateZ(' + (-W / 2) + 'px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ang.toFixed(2) + 'deg)';
faces.forEach(function (f, k) {
var a = (ang + k * 90) * Math.PI / 180, c = Math.cos(a), sh = f.querySelector('.fb-shade');
if (sh) sh.style.opacity = clamp((1 - c) * .32, 0, .55).toFixed(3);
f.classList.toggle('away', c < .05);
f.classList.toggle('side', c < .8); f.style.setProperty('--wv', clamp(c / .12, 0, 1).toFixed(3)); f.style.setProperty('--tv', clamp((c - .45) / .35, 0, 1).toFixed(3));
if (CS === 'glass') f.style.opacity = (c > 0 ? 1 : .35).toString();
});
}
var SK = cfg('SHRINK', SHRINK), sc = 1 - p * SK * .8, op = clamp(1.25 - p * 1.6, 0, 1), y = mobile.matches ? '' : 'translateY(-50%) ';
leftEl.style.transform = y + 'scale(' + sc.toFixed(3) + ')'; leftEl.style.opacity = clamp(1.3 - p * 1.3, 0, 1).toFixed(3);
rightEl.style.transform = y + 'scale(' + sc.toFixed(3) + ')'; rightEl.style.opacity = clamp(1.3 - p * 1.3, 0, 1).toFixed(3);
mid.style.transform = 'translate(-50%,-50%) translateY(' + (p * 60).toFixed(1) + 'px) scale(' + (1 - p * SK).toFixed(3) + ')';
mid.style.opacity = clamp(1.4 - p * 1.2, 0, 1).toFixed(3);
cap.style.opacity = op.toFixed(3);
if (intro) intro.style.opacity = op.toFixed(3);
if (meta) meta.style.opacity = op.toFixed(3);
if (dots) dots.style.opacity = op.toFixed(3);
if (hint && !hint.classList.contains('gone')) hint.style.opacity = (op * .55).toFixed(3);
if (lw && flat) {
var sw2 = reduced ? 0 : Math.sin(tt * .7) * .25;
var ex = ((1.1 - state.tx * .9 + sw2) * .005).toFixed(4) + 'em', ey = ((1.1 - state.ty * .7) * .005).toFixed(4) + 'em';
[lw, rw].forEach(function (w) { var x = w.firstChild; x.style.setProperty('--ex', ex); x.style.setProperty('--ey', ey); });
} else if (lw) {
var sw = reduced ? 0 : Math.sin(tt * .7);
lw.style.transform = 'rotateY(' + (24 + state.tx * 16 + sw * 8).toFixed(2) + 'deg) rotateX(' + (8 - state.ty * 12).toFixed(2) + 'deg)';
rw.style.transform = 'rotateY(' + (-24 + state.tx * 16 - sw * 8).toFixed(2) + 'deg) rotateX(' + (8 - state.ty * 12).toFixed(2) + 'deg)';
}
if (!reduced) cube.parentNode.style.setProperty('--bob', (Math.sin(tt * 1.3) * 6).toFixed(2) + 'px');
}
function tick(now) {
state.raf = 0;
if (!state.visible || document.hidden) { state.last = 0; return; }
var dt = state.last ? Math.min(.1, (now - state.last) / 1000) : 0;
state.last = now;
if (!state.drag) { state.v += ((state.T - state.A) * 60 - state.v * 11) * dt; state.A += state.v * dt; }
var k = Math.min(1, dt * 5);
state.tx += (state.mx - state.tx) * k; state.ty += (state.my - state.ty) * k;
var step = Math.round(-state.A / 90);
if (step !== state.step) { var first = state.step === null; state.step = step; setWord(step, first); }
render(now);
state.fr = (state.fr || 0) + 1; if (faceCls === 'bgfill' && state.fr % 3 === 0) alignBg();
state.raf = requestAnimationFrame(tick);
}
function start() { if (!state.raf) state.raf = requestAnimationFrame(tick); }
function auto() { clearInterval(state.timer); if (reduced) return; state.timer = setInterval(function () { if (state && !state.drag && state.visible && !document.hidden) { state.T -= 90; state.moved = true; } }, cfg('WORD_SECONDS', WORD_SECONDS) * 1000); }
stage.addEventListener('pointermove', function (e) {
if (TILT && e.pointerType === 'mouse') { var r = stage.getBoundingClientRect(); state.mx = ((e.clientX - r.left) / r.width - .5) * 2; state.my = ((e.clientY - r.top) / r.height - .5) * 2; }
if (!state.drag) return;
var now = performance.now(), dx = e.clientX - state.lastX, dA = dx * 180 / Math.max(300, mid.clientWidth * 2.2);
state.A += dA; var dt = Math.max(.008, (now - state.lastT) / 1000); state.v = state.v * .5 + (dA / dt) * .5;
state.lastX = e.clientX; state.lastT = now;
});
stage.addEventListener('pointerleave', function () { state.mx = 0; state.my = 0; });
if (dots) dots.addEventListener('click', function (e) {
var b = e.target.closest('button[data-i]'); if (!b) return;
var i = +b.getAttribute('data-i'), cur = state.step || 0, d = mod(i - cur, data.length);
if (d > data.length / 2) d -= data.length;
state.T = -90 * (cur + d); state.moved = true; auto(); start();
});
[meta, intro, dots].forEach(function (n) { if (n) n.addEventListener('pointerdown', function (e) { e.stopPropagation(); }); });
mid.addEventListener('keydown', function (e) {
if (e.key === 'ArrowRight') { state.T -= 90; state.moved = true; auto(); start(); e.preventDefault(); }
else if (e.key === 'ArrowLeft') { state.T += 90; state.moved = true; auto(); start(); e.preventDefault(); }
else if (e.key === 'Enter' || e.key === ' ') { speak(); e.preventDefault(); }
});
mid.addEventListener('pointerdown', function (e) {
if (e.button !== 0) return;
state.drag = true; state.lastX = e.clientX; state.lastT = performance.now(); state.v = 0; state.downX = e.clientX; state.downY = e.clientY; state.downT = performance.now(); mid.classList.add('is-drag');
try { stage.setPointerCapture(e.pointerId); } catch (err) {}
});
function end(e) {
if (!state.drag) return;
state.drag = false; mid.classList.remove('is-drag');
var tap = e && e.type === 'pointerup' && Math.abs(e.clientX - state.downX) < 6 && Math.abs(e.clientY - state.downY) < 6 && performance.now() - state.downT < 400;
if (tap) { state.v = 0; state.T = Math.round(state.A / 90) * 90; speak(); start(); return; }
state.moved = true;
state.T = Math.round((state.A + clamp(state.v, -900, 900) * .18) / 90) * 90;
state.v = 0; state.last = 0; start(); auto();
}
stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end); stage.addEventListener('lostpointercapture', end);
state.onScroll = function () { if (state) start(); };
state.onResize = function () { if (state) { place(); layout(); fit(); alignBg(); } };
window.addEventListener('scroll', state.onScroll, { passive: true });
window.addEventListener('resize', state.onResize);
if ('IntersectionObserver' in window) { state.io = new IntersectionObserver(function (en) { state.visible = en[0].isIntersecting; if (state.visible) { state.last = 0; start(); } }); state.io.observe(stage); }
document.addEventListener('visibilitychange', function () { if (state && !document.hidden) { state.last = 0; start(); } });
place(); layout(); fit();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (state) { fit(); alignBg(); } });
state.A = -90 * startStep + (reduced ? 0 : 90); state.T = -90 * startStep;
start(); auto();
}
function teardown() {
if (!state) return;
if (state.raf) cancelAnimationFrame(state.raf);
if (state.io) state.io.disconnect();
clearInterval(state.timer);
try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (err) {}
window.removeEventListener('scroll', state.onScroll);
window.removeEventListener('resize', state.onResize);
state.stage.remove();
document.documentElement.classList.remove('fb-top');
state.s.classList.remove('fb-ready', 'fb-bg-knockout', 'fb-bg-frosted', 'fb-bg-duotone', 'fb-bg-photo');
state = null;
}
window.TutorCube = { build: build, teardown: teardown };
new MutationObserver(function () { if (document.body.classList.contains('sqs-edit-mode-active')) teardown(); else build(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
window.addEventListener('load', build);
window.addEventListener('mercury:load', function () { teardown(); build(); });
})();

