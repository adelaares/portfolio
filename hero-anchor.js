/* Layout-only adapter. Re-measures the animation after layout changes. */
(() => {
 const stage=document.querySelector('.about.personal-hero');
 if(!stage)return;
 let width=0,height=0;
 new ResizeObserver(entries=>{
  const box=entries[0].contentRect;
  if(Math.abs(box.width-width)<.5&&Math.abs(box.height-height)<.5)return;
  width=box.width;height=box.height;
  // Lazy portrait loading and font settling can move the floor after first paint.
  // Re-measure only when the containing section changes its actual dimensions.
  window.personalHeroMotion?.restart();
 }).observe(stage);
})();
