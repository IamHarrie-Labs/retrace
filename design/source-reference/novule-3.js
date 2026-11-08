
/* PRINT layer: the cube gives a soft squash as it lands on each tutor, and the tickets pop in */
(function(){
  function hook(){
    var s=document.querySelector('#novule-cube .fb-stage');
    if(!s){setTimeout(hook,300);return}
    var r=s.querySelector('.fb-right'),l=s.querySelector('.fb-left'),m=s.querySelector('.fb-mid'),was=false;
    if(!r||!l||!m)return;
    function kick(el,c){el.classList.remove(c);void el.offsetWidth;el.classList.add(c)}
    new MutationObserver(function(){
      var out=r.classList.contains('out');
      if(was&&!out){kick(m,'st-land');kick(l,'st-pop');kick(r,'st-pop')}
      was=out;
    }).observe(r,{attributes:true,attributeFilter:['class']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();
  window.addEventListener('mercury:load',function(){setTimeout(hook,600)});
})();
