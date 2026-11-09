(() => {
 const size=112;
 const textureScale=2;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const sprite=new Image(),figma=new Image();
 sprite.src='assets/software-skills.png';
 figma.src='assets/figma-skill.png';

 function makeTexture(index){
  const texture=document.createElement('canvas');
  texture.width=texture.height=size*textureScale;
  const ctx=texture.getContext('2d',{willReadFrequently:true});
  ctx.scale(textureScale,textureScale);
  ctx.imageSmoothingQuality='high';
  if(index===4){
   ctx.drawImage(sprite,280,169,103,104,8,8,96,96);
   const image=ctx.getImageData(0,0,texture.width,texture.height);
   for(let i=0;i<image.data.length;i+=4){
    image.data[i+3]=image.data[i];
    image.data[i]=image.data[i+1]=image.data[i+2]=18;
   }
   ctx.putImageData(image,0,0);
  }else if(index===5){
   ctx.drawImage(figma,312,340,400,600,25,9,62,94);
  }else{
   const gradient=ctx.createLinearGradient(15,12,94,100);
   gradient.addColorStop(0,'#343434');
   gradient.addColorStop(.45,'#151515');
   gradient.addColorStop(1,'#090909');
   ctx.beginPath();
   ctx.roundRect(9,9,94,94,18);
   ctx.fillStyle=gradient;
   ctx.fill();
   ctx.strokeStyle='#fff3';
   ctx.lineWidth=.75;
   ctx.stroke();
   ctx.fillStyle='#fff';
   ctx.font=index===6?'700 24px system-ui':'700 49px system-ui';
   ctx.textAlign='center';
   ctx.textBaseline='middle';
   ctx.fillText(['Ai','Id','Ps','Pr','','','Canva'][index],56,56);
  }
  return texture;
 }

 // Find the contour at half opacity and interpolate its position between
 // pixels. Diagonal segments avoid the staircase of a pixel-by-pixel mesh.
 const contours=[[],[[3,0]],[[0,1]],[[3,1]],[[1,2]],[[3,0],[1,2]],[[0,2]],[[3,2]],
  [[2,3]],[[0,2]],[[0,1],[2,3]],[[1,2]],[[1,3]],[[0,1]],[[3,0]],[]];
 function makeWalls(texture){
  const mask=document.createElement('canvas');
  mask.width=mask.height=size;
  const ctx=mask.getContext('2d');
  ctx.drawImage(texture,0,0,size,size);
  const {data}=ctx.getImageData(0,0,size,size);
  const walls=[];
  for(let y=0;y<size-1;y++)for(let x=0;x<size-1;x++){
   const k=(y*size+x)*4;
   const corners=[k,k+4,k+(size+1)*4,k+size*4];
   const alpha=corners.map(i=>data[i+3]);
   const code=alpha.reduce((sum,a,i)=>sum+(a>=128?1<<i:0),0);
   if(code===0||code===15)continue;
   const points=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]];
   const cross=edge=>{
    const next=(edge+1)%4;
    const t=(128-alpha[edge])/(alpha[next]-alpha[edge]);
    return points[edge].map((p,i)=>p+(points[next][i]-p)*t);
   };
   const colorIndex=corners[alpha.indexOf(Math.max(...alpha))];
   const rgb=[data[colorIndex],data[colorIndex+1],data[colorIndex+2]];
   for(const [first,last] of contours[code]){
    const a=cross(first),b=cross(last);
    const dx=b[1]-a[1],dy=a[0]-b[0];
    const normalLength=Math.hypot(dx,dy)||1;
    const centerX=(a[0]+b[0])/2,centerY=(a[1]+b[1])/2;
    const inside=points[alpha.indexOf(Math.max(...alpha))];
    const direction=(inside[0]-centerX)*dx+(inside[1]-centerY)*dy>0?-1:1;
    walls.push({a,b,x:centerX,y:centerY,nx:dx*direction/normalLength,ny:dy*direction/normalLength,rgb});
   }
  }
  return walls;
 }

 function mount(original,index){
  const texture=makeTexture(index);
  const walls=makeWalls(texture);
  if(!walls.length)return;
  const button=document.createElement('button');
  button.type='button';
  button.className='skill-model';
  button.setAttribute('aria-label','Girar el modelo 3D de '+original.nextElementSibling.textContent);
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=224;
  canvas.setAttribute('aria-hidden','true');
  button.append(canvas);
  original.replaceWith(button);

  const ctx=canvas.getContext('2d');
  const isChat=index===4;
  const halfDepth=isChat?2.5:8;
  let angle=-.40,frame=0;
  function draw(){
   const ratio=canvas.width/224;
   ctx.setTransform(ratio,0,0,ratio,0,0);
   ctx.clearRect(0,0,224,224);
   ctx.imageSmoothingQuality='high';
   const shadow=ctx.createRadialGradient(0,0,0,0,0,1);
   shadow.addColorStop(0,'#0003');
   shadow.addColorStop(1,'#0000');
   ctx.save();
   ctx.translate(112,201);
   ctx.scale(49,9);
   ctx.fillStyle=shadow;
   ctx.fillRect(-1,-1,2,2);
   ctx.restore();

   const c=Math.cos(angle),s=Math.sin(angle),p=Math.cos(.22),q=Math.sin(.22);
   const project=(x,y,z)=>[112+(c*(x-56)+s*z)*1.72,107+(p*(y-56)-q*(-s*(x-56)+c*z))*1.72];
   const depth=w=>-s*p*w.x+q*w.y;
   const visible=walls.filter(w=>-s*p*w.nx+q*w.ny>0).sort((a,b)=>depth(a)-depth(b));
   for(const w of visible){
    const light=.64+.18*(-w.ny)+.10*w.nx*c;
    const color=w.rgb.map(v=>Math.round(Math.min(255,v*light+24)));
    ctx.fillStyle=ctx.strokeStyle='rgb('+color.join(',')+')';
    ctx.lineWidth=.6;
    ctx.beginPath();
    ctx.moveTo(...project(...w.a,halfDepth));
    ctx.lineTo(...project(...w.b,halfDepth));
    ctx.lineTo(...project(...w.b,-halfDepth));
    ctx.lineTo(...project(...w.a,-halfDepth));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
   }
   // The openwork ChatGPT emblem shares one silhouette with its sidewalls.
   const front=c>=0,z=front?halfDepth:-halfDepth;
   const left=front||isChat?0:size;
   const a=project(left,0,z),b=project(size-left,0,z),d=project(left,size,z);
   ctx.save();
   ctx.transform((b[0]-a[0])/size,(b[1]-a[1])/size,(d[0]-a[0])/size,(d[1]-a[1])/size,...a);
   ctx.drawImage(texture,0,0,size,size);
   ctx.restore();
  }
  function resize(){
   const resolution=Math.ceil(Math.max(224,button.clientWidth*Math.min(3,devicePixelRatio||1)));
   if(canvas.width!==resolution)canvas.width=canvas.height=resolution;
   draw();
  }
  function spin(){
   if(frame)return;
   if(motion.matches){angle+=Math.PI/2;draw();return;}
   const start=performance.now(),initial=angle;
   function tick(now){
    const t=Math.min(1,(now-start)/1150);
    angle=initial+Math.PI*2*t*t*(3-2*t);
    draw();
    frame=t<1?requestAnimationFrame(tick):0;
   }
   frame=requestAnimationFrame(tick);
  }
  button.addEventListener('pointerenter',event=>{
   if(event.pointerType==='mouse'&&!motion.matches)spin();
  });
  button.addEventListener('click',spin);
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(button);
  resize();
 }

 Promise.all([sprite.decode(),figma.decode()]).then(()=>{
  document.querySelectorAll('.skill-object').forEach(mount);
 }).catch(error=>console.warn('Modelos de Skills:',error.message));
})();
