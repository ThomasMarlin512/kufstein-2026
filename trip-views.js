(() => {
 const panels=[...document.querySelectorAll('[data-trip-view]')];
 function apply(){
  const hash=location.hash.slice(1),target=document.getElementById(hash);
  const targetView=target?.closest('[data-trip-view]')?.dataset.tripView;
  const view=targetView||(new URLSearchParams(location.search).get('view')==='programm'?'programm':'uebersicht');
  panels.forEach(p=>{p.hidden=p.dataset.tripView!==view;});
  document.querySelectorAll('[data-trip-tab]').forEach(a=>{if(a.dataset.tripTab===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(targetView){const url=new URL(location.href);url.searchParams.set('view',view);history.replaceState(null,'',url);requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));}
 }
 apply();addEventListener('hashchange',apply);
})();
