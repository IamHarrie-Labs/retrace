
/* CUBE ROLL v2.0 by Novule */
(function () {
var CUBE = '#novule-cube', SPOT = '#novule-hero';
var MIN_WIDTH = 1024;   /* below this width the roll is switched off */

function q(s, r) { return (r || document).querySelector(s); }
function qa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function cl(x) { return Math.max(0, Math.min(1, x)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function io(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function out(t) { return 1 - Math.pow(1 - t, 3); }
function outExpo(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -9 * t); }
function outBack(t) { var c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
function src(img) { return img ? (img.currentSrc || img.getAttribute('data-src') || img.src || '') : ''; }
function base(u) { return String(u).split('?')[0]; }
function txt(e) { return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
function off() {
  return window.innerWidth < MIN_WIDTH || document.body.classList.contains('sqs-edit-mode-active') ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

var cubeSec, spot, actor, cube, flaps = {}, built = false, raf = 0;
var pass = null, dirty = true;   /* the copy of your open boarding pass */

/* copy the open pass, with every style it has, so the lid looks exactly like it */
var n = 0, rules = '';
function copyStyle(cs) {
  var o = '', inf = /infinite/.test(cs.getPropertyValue('animation-iteration-count'));
  for (var i = 0; i < cs.length; i++) {
    var k = cs[i];
    if (k.charAt(0) === '-' && k.charAt(1) === '-') continue;
    if (/^transition/.test(k) || (!inf && /^animation/.test(k))) continue;
    o += k + ':' + cs.getPropertyValue(k) + ';';
  }
  return o + 'transition:none;' + (inf ? '' : 'animation:none;');
}
function copyNode(el) {
  var c = el.cloneNode(false), id = 'crm-' + (n++);
  c.removeAttribute('id'); c.setAttribute('class', id);
  var cs0 = getComputedStyle(el);
  c.setAttribute('style', copyStyle(cs0));
  /* Squarespace fades things in as you scroll: the copy is always fully shown */
  if (cs0.display !== 'none') { c.style.opacity = '1'; c.style.visibility = 'visible'; }
  if (/\bpre(Fade|Slide|Scale|Clip|Flex)/.test(el.className || '')) { c.style.transform = 'none'; c.style.clipPath = 'none'; }
  ['::before', '::after'].forEach(function (ps) {
    var d = getComputedStyle(el, ps);
    if (d.getPropertyValue('content') !== 'none') rules += '.cr-actor .' + id + ps + '{' + copyStyle(d) + '}';
  });
  Array.prototype.forEach.call(el.childNodes, function (ch) {
    if (ch.nodeType === 1) c.appendChild(copyNode(ch));
    else if (ch.nodeType === 3) c.appendChild(document.createTextNode(ch.textContent));
  });
  return c;
}
function snap() {
  var open = qa('li.list-item', spot)[2], ct = open && q('.list-item-content', open);
  if (!ct) return false;
  /* let any fade-in on the real pass finish first, so the copy is fully solid */
  if (ct.getAnimations) ct.getAnimations({ subtree: true }).forEach(function (a) {
    try { if (a.effect && a.effect.getTiming().iterations !== Infinity) a.finish(); } catch (e) {}
  });
  var cb = ct.getBoundingClientRect(), b = getComputedStyle(ct, '::before');
  var P = { l: parseFloat(b.left) || 0, t: parseFloat(b.top) || 0, w: parseFloat(b.width) || 0, h: parseFloat(b.height) || 0 };
  if (b.getPropertyValue('content') === 'none' || P.w < 50) {
    /* no pass shape found: fall back to the text area */
    var tw = q('.list-item-content__text-wrapper', open).getBoundingClientRect();
    P = { l: tw.left - cb.left, t: tw.top - cb.top, w: tw.width, h: open.getBoundingClientRect().bottom - tw.top };
  }
  n = 0; rules = '';
  var root = copyNode(ct);
  root.classList.add('cr-root');
  root.style.position = 'absolute'; root.style.left = -P.l + 'px'; root.style.top = -P.t + 'px';
  root.style.margin = '0'; root.style.transform = 'none'; root.style.opacity = '1'; root.style.zIndex = 'auto'; root.style.isolation = 'isolate';
  /* the pass shape stretches with the lid; its corners follow the cube */
  var rid = root.classList[0];
  rules += '.cr-actor .' + rid + '::before,.cr-actor .' + rid + '::after{height:auto!important;bottom:0!important;border-radius:var(--crr,56px)!important}';
  rules += '.cr-actor .' + rid + '::before{opacity:1!important;scale:none!important;filter:none!important}';
  rules += '.cr-actor .' + rid + '::after{opacity:var(--crs,1)!important;scale:none!important;filter:none!important}';
  /* the features fade in as it lands; the photo badge stays with the photo */
  var ps = qa('.list-item-content__description p', ct), cps = qa('p', root);
  cps.forEach(function (c, i) {
    if (i === ps.length - 1 && getComputedStyle(ps[i]).position === 'absolute') c.style.display = 'none';
    else if (i >= 2) c.classList.add('cr-det');
  });
  var css = q('style.cr-css', actor); css.textContent = rules;
  var top = q('.cr-top', actor), lid = q('.cr-front', flaps.lid);
  top.innerHTML = ''; lid.innerHTML = '';
  [top, lid].forEach(function (host) {
    var w = document.createElement('div'); w.className = 'cr-tkw';
    w.appendChild(host === top ? root.cloneNode(true) : root); host.appendChild(w);
  });
  top.classList.add('cr-has');
  pass = P; pass.ct = ct;
  return true;
}
/* size the pass copy inside a face: k is its scale, h the height of the face */
function fit(host, w, h, r, d, sh) {
  var wr = host.firstChild; if (!wr || !pass) return;
  var k = w / pass.w;
  wr.style.transform = 'scale(' + k + ')';
  wr.firstChild.style.height = (pass.t + h / k) + 'px';
  wr.style.setProperty('--crr', (r / k) + 'px');
  wr.style.setProperty('--crd', d);
  wr.style.setProperty('--crs', sh);
}

function build() {
  if (built) return true;
  cubeSec = q(CUBE); spot = q(SPOT);
  if (!cubeSec || !spot || !q('.fb-cube', cubeSec)) return false;
  var lis = qa('li.list-item', spot).slice(0, 3);
  if (lis.length < 3) return false;

  /* the three Spotlight tutors, and the cube tutor who is not in the Spotlight */
  var sp = lis.map(function (li) {
    var em = q('.list-item-content__description p:nth-child(1) em', li);
    return { img: src(q('img', li)), name: txt(em) || txt(q('.list-item-content__title', li)) };
  });
  var used = sp.map(function (s) { return base(s.img); });
  var extra = null;
  qa('li.list-item', cubeSec).forEach(function (li) {
    var u = src(q('img', li)); if (!u || extra) return;
    if (used.indexOf(base(u)) === -1) extra = { img: u, name: txt(q('.list-item-content__description p', li)) };
  });
  if (!extra) { var f = q('li.list-item img', cubeSec); extra = { img: src(f), name: '' }; }

  /* faces of the travelling cube: front = the extra tutor, right = open card, back = first card, left = second card */
  var F = [extra, sp[2], sp[0], sp[1]];
  var FB = 'inset:auto;left:0;top:0;width:var(--s);height:var(--s);';
  var SD = 'inset:auto;top:0;height:var(--s);width:var(--d);left:calc((var(--s) - var(--d)) / 2);';
  var turns = [FB + 'transform:rotateY(0deg) translateZ(calc(var(--d) / 2))', SD + 'transform:rotateY(90deg) translateZ(calc(var(--s) / 2))',
    FB + 'transform:rotateY(180deg) translateZ(calc(var(--d) / 2))', SD + 'transform:rotateY(-90deg) translateZ(calc(var(--s) / 2))'];
  var TB = 'inset:auto;left:0;width:var(--s);height:var(--d);top:calc((var(--s) - var(--d)) / 2);';
  actor = document.createElement('div'); actor.className = 'cr-actor'; actor.setAttribute('aria-hidden', 'true');
  var html = '<div class="cr-cube"><div class="cr-in">';
  F.forEach(function (f, i) {
    html += '<div class="cr-f" style="' + turns[i] + '"><div class="cr-pic"><img alt="" src="' + f.img + '"></div><span class="cr-nm">' + (f.name || '') + '</span></div>';
  });
  html += '<div class="cr-f cr-top" style="' + TB + 'transform:rotateX(90deg) translateZ(calc(var(--s) / 2))"></div><div class="cr-f cr-bot" style="' + TB + 'transform:rotateX(-90deg) translateZ(calc(var(--s) / 2))"></div></div></div>';
  /* the pieces it opens into */
  html += '<div class="cr-flap cr-lid" data-k="lid"><div class="cr-side cr-front"></div></div><style class="cr-css"></style>';
  html += '<div class="cr-flap" data-k="L"><div class="cr-side cr-front"><div class="cr-pic"><img alt="" src="' + sp[1].img + '"><span class="cr-tint"></span></div></div></div>';
  html += '<div class="cr-flap" data-k="T"><div class="cr-side cr-front"><div class="cr-pic"><img alt="" src="' + sp[0].img + '"><span class="cr-tint"></span></div></div></div>';
  html += '<div class="cr-flap" data-k="R"><div class="cr-side cr-front"><div class="cr-pic"><img alt="" src="' + sp[2].img + '"></div></div></div>';
  var yt = q('.list-section-title strong', spot);
  html += '<div class="cr-flap" data-k="B"><div class="cr-side cr-front"><div class="cr-pic"><img alt="" src="' + extra.img + '"></div></div><div class="cr-side cr-back">' + (yt ? yt.innerHTML : '') + '</div></div>';
  actor.innerHTML = html;
  document.body.appendChild(actor);
  cube = q('.cr-cube', actor);
  qa('.cr-flap', actor).forEach(function (f) { flaps[f.getAttribute('data-k')] = f; });
  built = true;
  return true;
}

/* where each piece lands, read live from your Spotlight */
function targets() {
  var lis = qa('li.list-item', spot), open = lis[2];
  var r = function (el) { var b = el.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
  var tw = q('.list-item-content__text-wrapper', open).getBoundingClientRect(), lb = open.getBoundingClientRect();
  var yt = q('.list-section-title strong', spot);
  var lid = { x: lb.left, y: tw.top, w: tw.width, h: lb.bottom - tw.top };
  if (pass) { var cb = pass.ct.getBoundingClientRect(); lid = { x: cb.left + pass.l, y: cb.top + pass.t, w: pass.w, h: pass.h }; }
  return {
    lid: lid,
    L: r(q('.list-item-media', lis[1])),
    T: r(q('.list-item-media', lis[0])),
    R: r(q('.list-item-media', open)),
    B: yt ? r(yt) : { x: 0, y: 0, w: 1, h: 1 }
  };
}

var done = false;   /* true once it has landed: the Spotlight then stays still */
function rest() { actor.style.display = 'none'; cubeSec.classList.remove('cr-rolling'); spot.classList.remove('cr-landing'); }
function frame() {
  raf = requestAnimationFrame(frame);
  if (off()) { rest(); return; }
  var sy = window.scrollY || window.pageYOffset, vh = window.innerHeight;
  var c0 = cubeSec.getBoundingClientRect().top + sy, s1 = spot.getBoundingClientRect().top + sy;
  /* it finishes landing while the Spotlight is still coming up the screen */
  var endOff = Math.min(vh * .3, 260);
  var p = cl((sy - c0) / Math.max(1, (s1 - c0) - endOff));
  if (done) { if (p < .02) done = false; rest(); return; }
  if (p >= .985) { done = true; rest(); return; }
  cubeSec.classList.toggle('cr-rolling', p > .015);
  spot.classList.add('cr-landing');
  if (p <= .015) { actor.style.display = 'none'; return; }
  actor.style.display = 'block';
  if (dirty) { if (!snap()) pass = null; dirty = false; }

  var fc = q('.fb-cube', cubeSec), fr = fc.getBoundingClientRect();
  var S0 = Math.min(fc.offsetWidth, fc.offsetHeight) * .86;
  var A = { x: fr.left + fr.width / 2, y: fr.top + fr.height / 2 };
  var T = targets(), S1 = Math.min(Math.max(T.lid.w * .9, 260), 360);
  /* the cube heads for the pass, but never leaves the screen: it waits in view for the Spotlight to arrive */
  var ratio = pass ? Math.max(1, Math.min(1.5, pass.h / pass.w)) : 1.16, D1 = S1 * ratio;
  var B = { x: T.lid.x + T.lid.w / 2, y: Math.max(D1 * .6 + 20, Math.min(T.lid.y + T.lid.h / 2, vh - D1 * .62)) };
  var lift = cl(p / .1), roll = cl((p - .04) / .56), unf = cl((p - .62) / .36);
  actor.style.opacity = cl(p / .04);

  if (unf <= 0) {
    /* ----- the cube: lift, tip the pass towards you, and carry it down steadily ----- */
    cube.style.display = 'block'; Object.keys(flaps).forEach(function (k) { flaps[k].style.display = 'none'; });
    var e = io(roll), s = lerp(S0, S1, e);
    var tip = io(cl((p - .02) / .24)), settle = io(cl((p - .5) / .12));
    var d = s * lerp(1, ratio, tip);
    var x = lerp(A.x, B.x, e);
    var y = lerp(A.y, B.y, e) - lift * 30 * (1 - e) - Math.sin(Math.PI * roll) * 14 * (1 - settle);
    /* it stays in the middle of the screen while the page scrolls past, then meets the pass */
    var hb = q('header'), top0 = hb ? Math.max(0, hb.getBoundingClientRect().bottom) : 0;
    y = Math.min(Math.max(y, Math.max(top0 + d * .62 + 20, vh * .46)), vh - d * .62);
    /* the lid stays angled a touch so it still reads as a box, then sits flat to open */
    var t0 = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cube-tilt')) || 0;
    var rx = lerp(lerp(-11 + t0, -74, tip), -90, settle);
    var ry = lerp(-9 * tip, 0, settle);
    cube.style.setProperty('--s', s + 'px'); cube.style.setProperty('--d', d + 'px');
    fit(q('.cr-top', cube), s, d, 10, 1, 0);
    cube.style.transform = 'translate3d(' + (x - s / 2) + 'px,' + (y - s / 2) + 'px,0)';
    q('.cr-in', cube).style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
    /* the camera always looks straight at the cube, so its shape never warps */
    actor.style.perspectiveOrigin = x + 'px ' + y + 'px';
  } else {
    /* ----- the box opens flat and each face flies to its card ----- */
    cube.style.display = 'none';
    var s2 = S1, d2 = D1;
    actor.style.perspectiveOrigin = B.x + 'px ' + B.y + 'px';
    var start = {
      lid: { x: B.x, y: B.y, z: s2 / 2, ax: 0, ay: 0, w: s2, h: d2 },
      L: { x: B.x - s2 / 2, y: B.y, z: 0, ax: 0, ay: -90, w: s2, h: d2 },
      R: { x: B.x + s2 / 2, y: B.y, z: 0, ax: 0, ay: 90, w: s2, h: d2 },
      T: { x: B.x, y: B.y - d2 / 2, z: 0, ax: 90, ay: 0, w: s2, h: s2 },
      B: { x: B.x, y: B.y + d2 / 2, z: 0, ax: -90, ay: 0, w: s2, h: s2 }
    };
    var endAx = { B: -180 }, delay = { lid: .18, L: 0, R: .04, T: .1, B: .16 };
    Object.keys(flaps).forEach(function (k) {
      var el = flaps[k], a = start[k], b = T[k];
      if (k === 'B') { el.style.display = 'none'; return; }   /* "yours." stays out of the animation */
      el.style.display = 'block';
      var t = cl((unf - delay[k]) / .7), te = k === 'lid' ? io(t) : out(t);
      var w = lerp(a.w, b.w, te), h = lerp(a.h, b.h, te);
      var arc = Math.sin(Math.PI * t);
      var x = lerp(a.x, b.x + b.w / 2, te), y = lerp(a.y, b.y + b.h / 2, te) - (k === 'B' ? arc * 140 : arc * 40);
      var z = lerp(a.z, 0, te) + (k !== 'lid' ? arc * 120 : 0);
      var ax = lerp(a.ax, endAx[k] || 0, te), ay = lerp(a.ay, 0, te);
      el.style.width = w + 'px'; el.style.height = h + 'px';
      el.style.transform = 'translate3d(' + (x - w / 2) + 'px,' + (y - h / 2) + 'px,' + z + 'px) rotateX(' + ax + 'deg) rotateY(' + ay + 'deg)';
      var front = q('.cr-front', el);
      if (k === 'lid') {
        var R = pass ? parseFloat(getComputedStyle(spot).getPropertyValue('--tp-r')) || 56 : 56;
        fit(front, w, h, lerp(10, R, te), 1, cl((te - .6) / .3));
      } else {
        var pic = q('.cr-pic', el), ins = lerp(.075, 0, te);
        pic.style.left = pic.style.right = (ins * w) + 'px'; pic.style.top = (ins * h) + 'px'; pic.style.bottom = (lerp(.18, 0, te) * h) + 'px';
        pic.style.borderRadius = lerp(6, 0, te) + 'px';
        front.style.boxShadow = 'inset 0 0 0 ' + lerp(3, 0, te) + 'px hsl(var(--darkAccent-hsl))';
        front.style.borderRadius = lerp(10, 0, te) + 'px';
        if (k === 'L' || k === 'T') { q('img', pic).style.filter = 'grayscale(' + te + ') contrast(1.05)'; q('.cr-tint', pic).style.opacity = te * .35; }
        if (k === 'B') {
          var yt = q('.list-section-title strong', spot), back = q('.cr-back', el);
          if (yt) { var cs = getComputedStyle(yt); back.style.fontFamily = cs.fontFamily; back.style.fontSize = cs.fontSize; back.style.fontWeight = cs.fontWeight; back.style.letterSpacing = cs.letterSpacing; back.style.borderRadius = '.2em'; }
        }
      }
    });
  }
}

/* a real mouse move over the cards while it lands: settle at once so hovering just works */
var mx = -1, my = -1;
function settleOnMove(e) {
  var moved = Math.abs(e.clientX - mx) + Math.abs(e.clientY - my) > 3; mx = e.clientX; my = e.clientY;
  if (moved && built && actor.style.display === 'block' && spot && spot.contains(e.target)) { done = true; rest(); }
}
function start() {
  if (!build()) return;
  if (!start.hooked) { document.addEventListener('pointermove', settleOnMove, { passive: true }); start.hooked = true; }
  if (!raf) raf = requestAnimationFrame(frame);
}
/* the cube is built by its own script, so wait for it */
var tries = 0;
(function wait() { if (build()) start(); else if (tries++ < 80) setTimeout(wait, 150); })();
window.addEventListener('resize', function () { dirty = true; });
window.addEventListener('mercury:load', function () { built = false; dirty = true; pass = null; if (actor) actor.remove(); flaps = {}; tries = 0; setTimeout(function () { if (build()) start(); }, 300); });
})();
