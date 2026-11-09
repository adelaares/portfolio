(() => {
 const scene=document.querySelector('.project-scene');
 const projects=window.demoProjects;
 if(!scene||!projects?.length)return;
 const row=scene.querySelector('.scene-row'),viewport=scene.querySelector('.scene-viewport');
 const header=document.querySelector('.header');
 const referenceWidth=306, coverWidth=44.6, firstAxis=151;
 const spacingRatio=1.42;
 let cardScale,spacing,pitch;
 const replay=scene.querySelector('.scene-replay');
 // Posiciones de los rótulos en la grabación más reciente, cada 250 ms.
 const outbound=[
  0,0,7.2,25.8,51.4,83.8,119.9,151.9,183.8,203.9,217,220.4,
  220.4,220.4,220.4,223.9,237.4,256,288.9,323.3,361.5,392.4,420.3,
  435.3,443.3,444.1,444.1,444.1,444.1
 ];
 const clip=outbound.concat(outbound.slice(0,-1).reverse());
 const clipStep=250, clipMiddle=220.4, clipEnd=444.1;
 const clipDuration=(clip.length-1)*clipStep;
 // Hay un proyecto más que en el vídeo. El segundo tramo conserva el mismo
 // ritmo relativo y recorre una posición adicional para dejar el mismo hueco final.
 const extra=Math.max(0,projects.length-11)*coverWidth;
 viewport.style.setProperty('--scene-origin',(firstAxis/referenceWidth*100)+'%');
 const flashcardCovers={
  'carl-el-mazmorrero':'flashcards/carl-el-mazmorrero.webp',
  'san-isidro-campana':'flashcards/sabadell-san-isidro.webp',
  leiva:'flashcards/leiva.webp'
 };
 const coverPositions={'ai-weiwei':'100% center','sabadell':'left center','coco':'100% center'};
 const colors=['#e7e9ed','#a49f96','#325ba9','#a23a4c','#d5c7b3','#344d72','#e7a750','#e6e1d4','#58ad70','#ac686d','#a45837'];
 const axes=projects.map((project,i)=>{
  const a=document.createElement('a');a.className='scene-axis';a.href='proyecto.html?id='+encodeURIComponent(project.id);
  a.style.setProperty('--edge',colors[i%colors.length]);
  const label=document.createElement('span');label.className='scene-label';label.textContent=project.name;
  const panel=document.createElement('span');panel.className='scene-panel';panel.setAttribute('aria-hidden','true');
  if(project.id==='jeora'){
   panel.classList.add('scene-logo');
   const logo=document.createElement('span');logo.className='jeora-main-logo';panel.append(logo);
  }else{
   const img=new Image();
   img.alt='';
   img.decoding='async';
   img.src='assets/'+(flashcardCovers[project.id]??project.cover);
   if(coverPositions[project.id])img.style.objectPosition=coverPositions[project.id];
   panel.append(img);
  }
  a.append(label,panel);row.append(a);
  return {a,panel};
 });
 const at=new URLSearchParams(location.search).get('proyectos-t');
 const maxScroll=()=>Math.max(0,viewport.scrollWidth-viewport.clientWidth);
 const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let animation=0, replayTime=null, renderFrame=0, manualFrame=0, manualTarget=null;
 let railWidth, renderedLeft;
 function sizeCards(){
  const viewportWidth=viewport.clientWidth;
  const cardWidth=axes[0].panel.offsetHeight*2/3;
  if(!viewportWidth||!cardWidth)return;
  const previousWidth=viewport.style.getPropertyValue('--scene-cover-width');
  const progress=previousWidth?viewport.scrollLeft/maxScroll():0;
  railWidth=viewportWidth;
  cardScale=cardWidth/viewportWidth*referenceWidth/coverWidth;
  spacing=coverWidth*spacingRatio*cardScale;
  pitch=spacing/referenceWidth;
  const travel=(clipEnd+extra)*spacingRatio*cardScale/referenceWidth;
  viewport.style.setProperty('--scene-travel',travel);
  viewport.style.setProperty('--scene-cover-width',(coverWidth*cardScale/referenceWidth*100)+'%');
  axes.forEach(({a},i)=>a.style.setProperty('--axis',(i*pitch*100)+'%'));
  if(progress)viewport.scrollLeft=progress*maxScroll();
  renderedLeft=undefined;
  render();
 }
 sizeCards();
 function setPosition(x){
  viewport.scrollLeft=x;
  render();
 }
 function queueRender(){
  if(renderFrame)return;
  renderFrame=requestAnimationFrame(()=>{
   renderFrame=0;
   render();
  });
 }
 function render(){
  const scrollLeft=viewport.scrollLeft;
  if(!railWidth||scrollLeft===renderedLeft)return;
  renderedLeft=scrollLeft;
  const travelled=scrollLeft/railWidth*referenceWidth;
  axes.forEach(({a,panel},i)=>{
   const x=firstAxis+i*spacing-travelled;
   const tabIndex=x>=0&&x<=referenceWidth?0:-1;
   if(a.tabIndex!==tabIndex)a.tabIndex=tabIndex;
   const reach=coverWidth*cardScale;
   if(x < -reach || x > referenceWidth+reach)return;
   const offset=(x-firstAxis)/cardScale;
   const radius=Math.hypot(offset,5);
   const distance=radius-5;
   // Los paneles se comprimen sólo en el centro. El borde que queda
   // junto al rótulo cambia de lado al atravesar ese punto.
   const rawWidth=1+distance*.343;
   const knee=clamp((rawWidth-coverWidth+3)/6,0,1);
   const width=Math.min(rawWidth,coverWidth+3)-3*knee*knee;
   const outer=Math.min(3.5,.75+distance*.026);
   const left=-width/2-(width/2-outer)*offset/radius;
   const transform=`translateX(${(left/coverWidth*100).toFixed(3)}%) scaleX(${(width/coverWidth).toFixed(4)})`;
   if(panel.style.transform!==transform)panel.style.transform=transform;
  });
 }
 // Match speeds across measured samples and keep the pauses in the recording.
 const clipSlope=clip.map((point,i)=>{
  const before=point-(clip[i-1]??point);
  const after=(clip[i+1]??point)-point;
  return before*after>0?2*before*after/(before+after):0;
 });
 function clipPosition(ms){
  const frame=clamp(ms/clipStep,0,clip.length-1);
  const i=Math.floor(frame);
  const t=frame-i, blend=t*t*(3-2*t);
  const next=clip[i+1]??clip[i];
  const measured=clip[i]+(next-clip[i])*blend
   +t*(1-t)*((1-t)*clipSlope[i]-t*(clipSlope[i+1]??0));
  const progress=clamp((measured-clipMiddle)/(clipEnd-clipMiddle),0,1);
  const additional=extra*progress*progress*(3-2*progress);
  return (measured+additional)*spacingRatio*cardScale/referenceWidth*railWidth;
 }
 function timeAtPosition(){
  const position=viewport.scrollLeft;
  if(position<1)return 0;
  let start=0, end=(outbound.length-1)*clipStep;
  while(end-start>1){
   const mid=(start+end)/2;
   if(clipPosition(mid)<position)start=mid;
   else end=mid;
  }
  return end;
 }
 function stopManual(){
  cancelAnimationFrame(manualFrame);
  manualFrame=0;
  manualTarget=null;
 }
 function moveManually(position){
  manualTarget=clamp(position,0,maxScroll());
  if(reduced.matches){setPosition(manualTarget);stopManual();return;}
  if(manualFrame)return;
  let last=performance.now(), current=viewport.scrollLeft;
  function step(now){
   current+=(manualTarget-current)*(1-Math.exp(-(now-last)/75));
   last=now;
   if(Math.abs(manualTarget-current)<.75){
    setPosition(manualTarget);
    stopManual();
    return;
   }
   setPosition(current);
   manualFrame=requestAnimationFrame(step);
  }
  manualFrame=requestAnimationFrame(step);
 }
 function stopReplay(resume=false){
  if(!resume)replayTime=null;
  if(!animation)return;
  cancelAnimationFrame(animation);
  animation=0;
  replay.setAttribute('aria-label','Reproducir el recorrido');
  replay.classList.remove('is-playing');
 }
 replay.addEventListener('click',()=>{
  if(animation){stopReplay(true);return;}
  stopManual();
  replay.setAttribute('aria-label','Pausar el recorrido');
  replay.classList.add('is-playing');
  const start=performance.now()-(replayTime??timeAtPosition());
  function step(now){
   replayTime=now-start;
   setPosition(clipPosition(replayTime));
   if(replayTime<clipDuration)animation=requestAnimationFrame(step);
   else stopReplay();
  }
  animation=requestAnimationFrame(step);
 });
 function updateMotion(){
  replay.hidden=reduced.matches;
  if(reduced.matches){stopReplay();stopManual();}
 }
 reduced.addEventListener('change',updateMotion);
 updateMotion();
 viewport.addEventListener('scroll',render,{passive:true});
 viewport.addEventListener('wheel',e=>{
  if(e.ctrlKey||e.metaKey||e.defaultPrevented)return;
  // Keep native horizontal gestures, including Shift + wheel.
  if(e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)){
   stopReplay();
   stopManual();
   return;
  }
  if(!e.cancelable||!e.deltaY)return;

  // The cards share their vertical bounds even while moving horizontally.
  const {top,bottom,height}=axes[0].panel.getBoundingClientRect();
  const visibleTop=Math.max(0,header?.getBoundingClientRect().bottom??0);
  if(!height||top<visibleTop||bottom>document.documentElement.clientHeight)return;

  const end=maxScroll();
  const left=viewport.scrollLeft;
  if(e.deltaY>0?left>=end-1:left<=1)return;

  e.preventDefault();
  stopReplay();
  const unit=e.deltaMode===1?16:e.deltaMode===2?viewport.clientWidth:1;
  moveManually((manualTarget??left)+e.deltaY*unit);
 },{passive:false});
 let drag=null,suppressClick=false;
 viewport.addEventListener('dragstart',e=>e.preventDefault());
 viewport.addEventListener('pointerdown',e=>{
  if(!e.isPrimary||e.button!==0)return;
  stopReplay();
  stopManual();
  suppressClick=false;
  // Touch and trackpad keep their native scrolling and momentum.
  if(e.pointerType==='touch')return;
  drag={id:e.pointerId,x:e.clientX,left:viewport.scrollLeft,moved:false};
 });
 window.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const delta=e.clientX-drag.x;
  if(!drag.moved&&Math.abs(delta)<5)return;
  if(!drag.moved){
   drag.moved=true;
   viewport.setPointerCapture(e.pointerId);
   viewport.classList.add('is-dragging');
  }
  e.preventDefault();
  viewport.scrollLeft=drag.left-delta;
  queueRender();
 });
 function endDrag(e){
  if(!drag||drag.id!==e.pointerId)return;
  suppressClick=drag.moved;
  drag=null;
  viewport.classList.remove('is-dragging');
 }
 window.addEventListener('pointerup',endDrag);
 window.addEventListener('pointercancel',endDrag);
 viewport.addEventListener('lostpointercapture',endDrag);
 viewport.addEventListener('click',e=>{
  if(suppressClick&&e.detail>0){e.preventDefault();e.stopPropagation();suppressClick=false;}
 },true);
 viewport.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();
  stopReplay();
  const start=manualTarget??viewport.scrollLeft;
  const x=e.key==='Home'?0:e.key==='End'?maxScroll():start+viewport.clientWidth*pitch*(e.key==='ArrowRight'?1:-1);
  moveManually(x);
 });
 if('ResizeObserver' in window)new ResizeObserver(sizeCards).observe(viewport);
 if(at!==null&&at.trim()!==''&&Number.isFinite(Number(at)))setPosition(clipPosition(Number(at)*1000));
 render();
})();
