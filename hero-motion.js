/* Full native renderer: reference poses, timing, individual jumps and walking return. */
(() => {
  const hero=document.querySelector('.personal-hero'),still=hero?.querySelector('.personal-hero-characters');
  if(!still)return;
  const canvas=document.createElement('canvas');canvas.className='personal-hero-film';canvas.hidden=true;
  canvas.setAttribute('aria-hidden','true');hero.append(canvas);
  const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const assetVersion=new URL(document.currentScript.src).searchParams.get('v')||'startup-fix-16';
  const assetURL=file=>`animations/native/${file}?v=${encodeURIComponent(assetVersion)}`;
  const load=file=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error(`No se pudo cargar ${file}`));im.src=assetURL(file);});
  const cooldown=5000;
  let assets,inView=false,running=false,frame=0,timer=0,cooldownUntil=0;
  let started=0,scale=1,worldWidth=860,returnStart=8,lastFrame=-1;
  hero.dataset.motionState='ready';
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  const S=.676,baseY=347.24,origins=[52,154,260].map(x=>14.44+x*S),centers=[94.884,166.540,239.548];
  const distance=330,speed=108,braking=.32,returnDuration=distance/speed+braking/2;
  function measure(){
    const h=hero.getBoundingClientRect(),p=still.getBoundingClientRect();if(!p.width)return;
    scale=p.width/220;
    const left=p.left-h.left-59*scale;
    const rightEdge=(h.width-left)/scale;
    // Cover the whole section: the original 860-unit canvas clipped the exit
    // before the screen edge on wide layouts. Preserve poses, speed and jumps.
    worldWidth=Math.max(860,Math.ceil(rightEdge+160));
    const lastJumpEnd=.70+(500-centers[0])/108+1.65;
    returnStart=Math.max(8,lastJumpEnd+Math.max(0,rightEdge+100-840)/108+.15);
    Object.assign(canvas.style,{width:`${worldWidth*scale}px`,height:`${558*scale}px`,left:`${p.left-h.left-59*scale}px`,top:`${p.top-h.top-355*scale}px`});
    const ratio=Math.min(3,devicePixelRatio||1);
    canvas.width=Math.ceil(worldWidth*scale*ratio);canvas.height=Math.ceil(558*scale*ratio);
    ctx.setTransform(canvas.width/worldWidth,0,0,canvas.height/558,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  }
  function draw(t){
    ctx.clearRect(0,0,worldWidth,558);
    const returning=t>=returnStart,rt=Math.max(0,t-returnStart);
    const settleStart=returnDuration-.38,settle=smooth((rt-settleStart)/.38);
    let offset=0,returnIndex=0;
    if(returning){
      const b=Math.max(0,rt-(returnDuration-braking));
      const travelled=rt<returnDuration-braking?speed*rt:speed*(returnDuration-braking)+speed*(b-b*b/(2*braking));
      offset=Math.min(0,travelled-distance);
      const phase0=settleStart/.86*12,phase1=Math.ceil(phase0/12)*12;
      const phase=rt<settleStart?rt/.86*12:phase0+(phase1-phase0)*settle;
      returnIndex=rt>=returnDuration?0:Math.floor(phase)%12;
    }
    const states=[];
    let frontPalmPosition;
    for(let c=0;c<3;c++){
      const e=Math.max(0,t-.70),jumpStart=.70+(500-centers[c])/108;
      let index=t<.70?0:Math.floor(e/.86*12)%12,x=centers[c]+108*e,lift=0;
      let feetBlend=smooth(e/.18),shadowWidth=1,shadowAlpha=1;
      if(returning){index=returnIndex;x=centers[c]+offset;feetBlend=1-settle;}
      else if(t>=jumpStart){
        const u=Math.min(1,(t-jumpStart)/1.65);
        x=500+340*u;
        if(u<1){lift=4*174*u*(1-u);index=Math.round(2+3*Math.sin(Math.PI*u));shadowWidth=1-.4*Math.sin(Math.PI*u);shadowAlpha=1-.6*Math.sin(Math.PI*u);}
        else x=840+108*(t-jumpStart-1.65);
      }
      const pose=assets.poses[c][index],dx=x-centers[c];
      const staticFeet=baseY+assets.poses[c][0].feet*S;
      const feet=staticFeet+(476-staticFeet)*feetBlend;
      const shadow=assets.shadows[c],sx=shadow.x,sw=shadow.width;
      ctx.save();ctx.globalAlpha=shadowAlpha;
      ctx.drawImage(shadow.image,sx+dx+sw*(1-shadowWidth)/2,shadow.y,sw*shadowWidth,shadow.height);ctx.restore();
      ctx.drawImage(pose.image,origins[c]+dx,feet-pose.feet*S-lift,pose.width*S,pose.height*S);
      if(c===1)frontPalmPosition={x:origins[c]+dx,y:feet-pose.feet*S-lift};
      states.push({pose:index+1,x,lift});
    }
    // The central palm sits in front of the neighbouring round hand, as in the drawing.
    if(frontPalmPosition&&assets.frontPalm){
      const p=assets.frontPalm;
      ctx.drawImage(p.image,frontPalmPosition.x+p.x*S,frontPalmPosition.y+p.y*S,p.width*S,p.height*S);
    }
    hero.dataset.motionCharacters=JSON.stringify(states);
    hero.dataset.returnPose=returning?String(returnIndex+1):'';
  }
  function stop(){
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    running=false;
    timer=0;
    hero.dataset.motionState='ready';
    hero.dataset.returnPose='';
    canvas.hidden=true;
    still.style.visibility='';
  }
  function sync(){
    if(!inView||hero.hidden||document.hidden||reduced.matches){
      stop();
      return;
    }
    if(!assets||running||timer)return;
    const delay=cooldownUntil-performance.now();
    if(delay>0){
      measure();
      draw(0);
      canvas.hidden=false;
      still.style.visibility='hidden';
      hero.dataset.motionState='resting';
      timer=setTimeout(()=>{timer=0;sync();},delay);
      return;
    }
    running=true;
    measure();
    canvas.hidden=false;
    still.style.visibility='hidden';
    started=performance.now();
    lastFrame=-1;
    tick(started);
  }
  function tick(now){
    if(!running)return;
    const t=Math.max(0,(now-started)/1000);
    if(t>=returnStart+returnDuration){
      cooldownUntil=now+cooldown;
      stop();
      sync();
      return;
    }
    // The source specifies 25 fps. Travel and jumps retain its exact timing.
    const f=Math.floor(t*25);
    if(f!==lastFrame){lastFrame=f;draw(f/25);hero.dataset.motionState=t>=returnStart?'returning':'exiting';}
    frame=requestAnimationFrame(tick);
  }
  function resize(){
    if(running){
      measure();
      lastFrame=-1;
    }else if(!canvas.hidden&&assets){
      measure();
      draw(0);
    }
    sync();
  }
  fetch(assetURL('manifest.json'),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Animation resources unavailable');return r.json();}).then(async manifest=>{
    assets={poses:await Promise.all(manifest.poses.map(row=>Promise.all(row.map(async p=>({...p,image:await load(p.file)}))))),shadows:await Promise.all(manifest.shadows.map(async shadow=>({...shadow,image:await load(shadow.file)}))),frontPalm:manifest.frontPalm?{...manifest.frontPalm,image:await load(manifest.frontPalm.file)}:null};
    sync();
  }).catch(error=>{canvas.hidden=true;still.style.visibility='';hero.dataset.motionState='error';hero.dataset.motionError=error.message;console.warn('Hero animation:',error.message);});
  new IntersectionObserver(([entry])=>{
    inView=entry.isIntersecting&&entry.intersectionRatio>=.15;
    sync();
  },{threshold:[0,.15]}).observe(still);
  new MutationObserver(sync).observe(hero,{attributes:true,attributeFilter:['hidden']});
  window.addEventListener('resize',resize,{passive:true});
  reduced.addEventListener('change',sync);
  document.addEventListener('visibilitychange',sync);
  // Deterministic captures for visual comparison, using the same production renderer.
  window.personalHeroMotion={
    get ready(){return !!assets;},
    capture(t){
      if(!assets)return;
      stop();
      measure();
      draw(t);
      canvas.hidden=false;
      still.style.visibility='hidden';
    },
    restart:resize
  };
})();
