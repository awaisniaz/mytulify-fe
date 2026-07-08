/** Inline theme init + toggle — zero React hydration cost. */
export const themeScript = `(function(){
  try{
    var t=localStorage.getItem('theme');
    var d=t?t==='dark':false;
    document.documentElement.classList.toggle('dark',d);
  }catch(e){}
  function bind(){
    var btn=document.getElementById('theme-toggle');
    if(!btn||btn.dataset.bound)return;
    btn.dataset.bound='1';
    btn.addEventListener('click',function(){
      var next=!document.documentElement.classList.contains('dark');
      document.documentElement.classList.toggle('dark',next);
      try{localStorage.setItem('theme',next?'dark':'light');}catch(e){}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);
  else bind();
})();`;
