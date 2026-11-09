/* Local elastic material. The accessible solid title remains underneath. */
(() => {
 const cover=document.querySelector('.particle-cover'),canvas=document.querySelector('#title-particles');
 if(!cover||!canvas)return;
 const title=cover.querySelector('h1'),link=title.querySelector('a'),ctx=canvas.getContext('2d');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 const enabled=()=>!reduced.matches&&fine.matches;
 let points=[],bonds=[],w=0,h=0,step=5,frame=0,last=0,inside=false,visible=true;
 let pointer={x:-10000,y:-10000},previous=null,paths=[],flow={x:0,y:0},inputTime=0;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function reset(){
  cancelAnimationFrame(frame);frame=0;last=0;inside=false;previous=null;paths=[];flow={x:0,y:0};
  for(const p of points){p.x=p.ox;p.y=p.oy;p.z=p.oz;p.vx=p.vy=p.vz=p.energy=0}
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  ctx.clearRect(0,0,w,h);
 }
 function build(){
  reset();const box=cover.getBoundingClientRect();w=box.width;h=box.height;
  const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  points=[];bonds=[];if(!enabled())return;
  const r=title.getBoundingClientRect(),style=getComputedStyle(title),mask=document.createElement('canvas');
  mask.width=Math.ceil(w);mask.height=Math.ceil(h);const m=mask.getContext('2d',{willReadFrequently:true});
  m.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  m.fontKerning='none';m.fillStyle='#111';
  const text=link.textContent.toUpperCase(),tracking=parseFloat(style.letterSpacing)||0,metrics=m.measureText(text);
  const baseline=r.top-box.top+r.height/2+((metrics.fontBoundingBoxAscent??metrics.actualBoundingBoxAscent)-(metrics.fontBoundingBoxDescent??metrics.actualBoundingBoxDescent))/2;
  let x=r.left-box.left;
  for(const glyph of text){m.fillText(glyph,x,baseline);x+=m.measureText(glyph).width+tracking}
  const data=m.getImageData(0,0,mask.width,mask.height).data;
  step=clamp(w/205,5.2,7.6);
  const grid=new Map(),top=Math.max(0,r.top-box.top);
  for(let row=0,y=top;y<Math.min(h,r.bottom-box.top);row++,y+=step){
   for(let col=0,x=0;x<w;col++,x+=step){
    // Keep boundary cells too: sampling only their centre left a solid outline.
    // Include antialiased pixels anywhere in each source cell.
    const half=step/2;
    let covered=false;
    for(let sy=Math.max(0,Math.floor(y-half));sy<Math.min(mask.height,Math.ceil(y+half))&&!covered;sy++){
     for(let sx=Math.max(0,Math.floor(x-half));sx<Math.min(mask.width,Math.ceil(x+half));sx++){
      if(data[(sy*mask.width+sx)*4+3]>0){covered=true;break}
     }
    }
    if(!covered)continue;
    const seed=Math.random()*Math.PI*2,depth=(Math.random()-.5)*step*2;
    const p={ox:x,oy:y,oz:depth,x,y,z:depth,vx:0,vy:0,vz:0,energy:0,seed,mass:.85+Math.random()*.35,r:step*(.52+Math.random()*.16)};
    const index=points.push(p)-1;grid.set(`${row},${col}`,index);
    for(const [dr,dc] of [[0,-1],[-1,0],[-1,-1],[-1,1]]){
     const neighbor=grid.get(`${row+dr},${col+dc}`);
     if(neighbor!==undefined)bonds.push([index,neighbor]);
    }
   }
  }
 }
 function wake(){if(!frame&&enabled()&&visible){last=0;frame=requestAnimationFrame(draw)}}
 function segmentDistance(x,y,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
  const t=length?clamp(((x-a.x)*dx+(y-a.y)*dy)/length,0,1):0;
  return Math.hypot(x-a.x-t*dx,y-a.y-t*dy);
 }
 function draw(time){
  frame=0;if(!enabled()||document.hidden||!visible){reset();return}
  const dt=clamp((time-(last||time))/16.667,.2,2);last=time;
  const radius=clamp(w*.043,30,72),recent=paths.splice(0);
  // Neighbour springs share deformation rather than scattering independent dots.
  const count=Math.ceil(dt*3),tick=dt/count;
  let maxMotion=0;
  for(let sub=0;sub<count;sub++){
   for(const p of points){
    let distance=inside?Math.hypot(p.ox-pointer.x,p.oy-pointer.y):Infinity;
    for(const segment of recent)distance=Math.min(distance,segmentDistance(p.ox,p.oy,segment.a,segment.b));
    const local=distance<radius*1.6?Math.exp(-distance*distance/(radius*radius*.5)):0;
    // A shared travelling bend gives the local patch a coherent, rounded volume.
    const wave=Math.sin((p.ox-pointer.x)/radius*1.8+time*.0022);
    const influence=local*(inside?1:recent.length?1:0);
    const targetX=influence*(flow.x*1.8+wave*5);
    const targetY=influence*(flow.y*1.8+Math.cos(time*.0018)*5);
    const targetZ=influence*(18+Math.sin(time*.002+p.seed*.12)*7);
    const mass=p.mass;
    p.vx+=((p.ox-p.x)*.020+(targetX-(p.x-p.ox))*.047*influence)*tick/mass;
    p.vy+=((p.oy-p.y)*.020+(targetY-(p.y-p.oy))*.047*influence)*tick/mass;
    p.vz+=((p.oz-p.z)*.025+(targetZ-(p.z-p.oz))*.055*influence)*tick/mass;
    // Unequal masses and a small local flutter leave a few grains trailing the body.
    p.vx+=Math.cos(p.seed+time*.003)*influence*.10*tick;
    p.vy+=Math.sin(p.seed+time*.003)*influence*.10*tick;
   }
   for(const [a,b] of bonds){
    const p=points[a],q=points[b];
    const dx=((q.x-q.ox)-(p.x-p.ox))*.014*tick;
    const dy=((q.y-q.oy)-(p.y-p.oy))*.014*tick;
    const dz=((q.z-q.oz)-(p.z-p.oz))*.012*tick;
    p.vx+=dx;p.vy+=dy;p.vz+=dz;q.vx-=dx;q.vy-=dy;q.vz-=dz;
   }
   const damping=Math.pow(.87,tick);
   for(const p of points){
    p.vx*=damping;p.vy*=damping;p.vz*=damping;
    p.x+=p.vx*tick;p.y+=p.vy*tick;p.z+=p.vz*tick;
   }
  }
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  ctx.clearRect(0,0,w,h);
  const moving=[];
  for(const p of points){
   const displacement=Math.hypot(p.x-p.ox,p.y-p.oy,(p.z-p.oz)*.55);
   maxMotion=Math.max(maxMotion,displacement,Math.abs(p.vx)+Math.abs(p.vy)+Math.abs(p.vz));
   if(displacement<.09)continue;
   // Source material opens only as its own grain actually leaves the surface.
   const amount=clamp(displacement/(step*.48),0,1);
   moving.push({p,amount});
   ctx.globalAlpha=amount;ctx.fillStyle='#fff';
   // Pad the source cell to cover antialiasing right up to the letter edge.
   const half=step/2+1;
   ctx.fillRect(p.ox-half,p.oy-half,half*2,half*2);
  }
  ctx.globalCompositeOperation='source-over';
  moving.sort((a,b)=>a.p.z-b.p.z);
  for(const {p,amount} of moving){
   // Oblique projection reveals depth without pulling every grain away radially.
   const lift=p.z-p.oz,x=p.x+lift*.20,y=p.y-lift*.28;
   const size=p.r*clamp(1+lift*.008,.8,1.4);
   ctx.globalAlpha=amount;
   const gradient=ctx.createRadialGradient(x-size*.33,y-size*.38,size*.08,x,y,size);
   gradient.addColorStop(0,'#565656');gradient.addColorStop(.45,'#222');gradient.addColorStop(1,'#080808');
   ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  const decay=Math.pow(.91,dt);flow.x*=decay;flow.y*=decay;
  if(!inside&&maxMotion<.10){reset();return}
  frame=requestAnimationFrame(draw);
 }
 function move(e){
  if(!enabled()||e.pointerType==='touch')return;
  const box=cover.getBoundingClientRect(),now=performance.now(),next={x:e.clientX-box.left,y:e.clientY-box.top};
  if(previous){
   const elapsed=Math.max(8,now-inputTime),dx=next.x-previous.x,dy=next.y-previous.y;
   if(Math.hypot(dx,dy)<w*.5){
    paths.push({a:previous,b:next});if(paths.length>18)paths.shift();
    flow.x=flow.x*.55+clamp(dx*16.667/elapsed,-28,28)*.45;
    flow.y=flow.y*.55+clamp(dy*16.667/elapsed,-28,28)*.45;
   }
  }
  previous=next;pointer=next;inputTime=now;wake();
 }
 link.addEventListener('pointerenter',e=>{if(!enabled()||e.pointerType==='touch')return;inside=true;previous=null;move(e)});
 link.addEventListener('pointermove',move,{passive:true});
 link.addEventListener('pointerleave',()=>{inside=false;previous=null});
 cover.addEventListener('pointerleave',()=>{inside=false;previous=null});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset()});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)reset()}).observe(cover);
 new ResizeObserver(build).observe(cover);reduced.addEventListener('change',build);fine.addEventListener('change',build);
 document.fonts.ready.then(build);
})();
