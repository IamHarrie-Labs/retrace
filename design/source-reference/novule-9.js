
(function () {
  function split() {
    if (document.body.classList.contains('sqs-edit-mode-active')) return;
    var t = document.querySelector('#novule-hero .list-section-title');
    if (!t || t.querySelector('.nv-split-a')) return;
    var blocks = t.querySelectorAll('p, h1, h2, h3');
    if (blocks.length !== 1) return;            /* already on two lines: nothing to do */
    var p = blocks[0], h = p.innerHTML, i = h.indexOf('. ');
    if (i < 0) return;
    p.innerHTML = '<span class="nv-split-a">' + h.slice(0, i + 1) + '</span><span class="nv-split-b">' + h.slice(i + 2) + '</span>';
  }
  /* phones: open on the middle pass */
  function centre() {
    if (window.innerWidth > 767 || document.body.classList.contains('sqs-edit-mode-active')) return;
    var ul = document.querySelector('#novule-hero ul.user-items-list-item-container');
    if (!ul || ul.children.length < 2 || ul.getAttribute('data-nv-centred')) return;
    var li = ul.children[Math.floor((ul.children.length - 1) / 2)];
    var a = li.getBoundingClientRect(), b = ul.getBoundingClientRect();
    if (!a.width) return;
    ul.style.scrollSnapType = 'none';
    ul.scrollLeft += (a.left + a.width / 2) - (b.left + b.width / 2);
    requestAnimationFrame(function () { ul.style.scrollSnapType = ''; });
    ul.setAttribute('data-nv-centred', '1');
  }
  function run() { split(); centre(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  window.addEventListener('load', run);
  window.addEventListener('mercury:load', run);
})();
