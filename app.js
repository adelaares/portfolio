const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const heroScene=document.querySelector('.hero-art');
if(heroScene&&!reduced.matches){let sceneFrame=0;const advanceScene=()=>{sceneFrame=0;const progress=Math.min(1,Math.max(0,scrollY/innerHeight));heroScene.style.transform=`translateY(${progress*140}px) rotate(${-12+progress*45}deg) scale(${1+progress*.22})`;heroScene.style.opacity=String(.9-progress*.55)};addEventListener('scroll',()=>{if(!sceneFrame)sceneFrame=requestAnimationFrame(advanceScene)},{passive:true});advanceScene()}
const projects = window.demoProjects || [];
const projectContent=document.querySelector('#project-content');
const requestedId=new URLSearchParams(location.search).get('id');
if(projectContent&&requestedId==='ballet-triadico'){
 location.replace('index.html#proyectos');
}else if(projectContent){
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const id=requestedId==='portadillas'?'ocho-miradas':requestedId;
 const project=projects.find(p=>p.id===id)||projects[0],index=projects.indexOf(project);
 const next=projects[(index+1)%projects.length],previous=projects[(index-1+projects.length)%projects.length];
 document.title=`${project.name} — Adela Ares`;
 const imageMarkup=f=>`<figure class="ed-figure ${f.height>f.width?'ed-portrait':'ed-landscape'}"><button type="button" class="ed-thumbnail" aria-label="Ampliar: ${esc(f.caption)}" aria-expanded="false"><img src="assets/${esc(f.src)}" width="${f.width}" height="${f.height}" alt="${esc(f.caption)}" loading="lazy" decoding="async"></button><figcaption>${esc(f.caption)}<button type="button" class="ed-enlarge" aria-label="Ampliar: ${esc(f.caption)}" aria-expanded="false">Ampliar</button></figcaption></figure>`;
 projectContent.classList.add('editorial-project');
 projectContent.dataset.project=project.id;
 const heading=(number,label)=>`<h2 class="ed-numbered"><span>${number}</span>${label}</h2>`;
 const all=project.editorial.flatMap(section=>section.figures.map(figure=>({...figure,group:section.title,kind:section.kind})));
 const isMagazine=project.id==='ocho-miradas';
 projectContent.classList.toggle('ed-magazine',isMagazine);
 const illustrations=isMagazine?all.filter(f=>f.src.startsWith('portadillas-')):[];
 const leadIndex=isMagazine?all.indexOf(illustrations[0]):project.id==='carl-el-mazmorrero'?Math.max(0,all.findIndex(f=>f.src.endsWith('screen-09.webp'))):0;
 const lead=all[leadIndex],rest=all.filter((_,i)=>i!==leadIndex);
 const cut1=Math.ceil(rest.length/3),cut2=Math.max(cut1,Math.floor(rest.length*2/3));
 const gallery=items=>{
  if(!items.length)return '';
  const groups=[];for(const f of items){let group=groups[groups.length-1];if(!group||group.title!==f.group){group={title:f.group,kind:f.kind,figures:[]};groups.push(group)}group.figures.push(f)}
  return groups.map(g=>`<div class="ed-image-group"><p class="ed-group-caption">${esc(g.title)}</p><div class="ed-grid ed-${esc(g.kind)} ${g.figures.length===1?'ed-single':''} ${g.figures.every(f=>f.height>f.width)?'ed-portrait-set':''}">${g.figures.map(imageMarkup).join('')}</div></div>`).join('');
 };
 const isCarl=project.id==='carl-el-mazmorrero';
 const carlGroup=(id,label,description,items)=>{
  const figures=items.map(figure=>{
   if(id==='screens-finales'&&['carl/screen-12.webp','carl/screen-01.webp'].includes(figure.src)){
    return {...figure,group:'Habilidades y perfil',kind:'stack'};
   }
   const kind=id==='foundations'||id==='patterns'?'tall':id==='componentes'&&figure.kind==='small'?'small':'standard';
   return {...figure,group:'',kind};
  });
  return `<section class="ed-carl-category" id="${id}" aria-labelledby="label-${id}"><div class="ed-category-copy"><h3 id="label-${id}">${label}</h3><p class="ed-category-description">${description}</p></div>${gallery(figures)}</section>`;
 };
 const moveActionOne=project.id==='san-isidro-campana';
 const actionOne=all.find(f=>f.src==='campana-san-isidro/pagina-07.webp');
 const isCoco=project.id==='coco';
 const isPoems=project.id==='poemas-visuales';
 const cocoPages=(...pages)=>gallery(rest.filter(f=>pages.some(page=>f.src===`coco/pagina-${page}.webp`)));
 const conceptsGallery=isCoco?cocoPages('02','03','04','09'):isPoems||isMagazine?'':isCarl?carlGroup('foundations','Foundations','La base del sistema: color, tipografía, espaciado, marcos e iconografía.',rest.filter(f=>f.src.includes('foundations-'))):gallery(rest.slice(0,cut1));
 const processGallery=isCoco?cocoPages('05','08'):isPoems?gallery(all.filter(f=>f.src.includes('boceto-')).map(f=>({...f,kind:'stack'}))):isMagazine?gallery(illustrations.map(f=>({...f,group:'Ilustraciones · Serie completa de seis piezas'}))):isCarl?carlGroup('componentes','Componentes','Las piezas individuales de la interfaz: botones y controles, con sus variantes de navegación.',rest.filter(f=>f.src.includes('componentes-')||f.kind==='small'))+carlGroup('patterns','Patterns','Combinaciones de componentes que organizan el inventario, las categorías de botín, los perfiles y el reloj.',rest.filter(f=>f.src.includes('patterns-'))):gallery(rest.slice(cut1,cut2).filter(f=>!moveActionOne||f!==actionOne));
 const resultsGallery=isCoco?cocoPages('06','07','10'):isPoems?gallery(all.filter(f=>!f.src.includes('boceto-'))):moveActionOne?gallery([actionOne,...rest.slice(cut2)]):['ai-weiwei','danza','sabadell','leiva','cartel-tipografico'].includes(project.id)?gallery(all):isMagazine?gallery(all.filter(f=>!f.src.startsWith('portadillas-')).map(f=>({...f,group:'Revista completa · 32 páginas'}))):isCarl?carlGroup('screens-finales','Screens finales','El sistema aplicado a las pantallas de menú, inventario, estadísticas, habilidades, mapa y perfil. La pantalla de combate se muestra en la apertura del proyecto.',rest.filter(f=>f.src.includes('screen-')&&f.kind!=='small')):gallery(rest.slice(cut2));
 const textOnlyOpening=['ai-weiwei','danza','sabadell','leiva','cartel-tipografico','poemas-visuales','ocho-miradas'].includes(project.id);
 const projectNav=`<nav class="project-navigation" aria-label="Navegación entre proyectos"><a href="proyecto.html?id=${esc(previous.id)}" aria-label="Proyecto anterior: ${esc(previous.name)}"><span aria-hidden="true">←</span> ${esc(previous.name)}</a><a href="proyecto.html?id=${esc(next.id)}" aria-label="Proyecto siguiente: ${esc(next.name)}">${esc(next.name)} <span aria-hidden="true">→</span></a></nav>`;
 const copy=(number,label,paragraphs,extra='')=>`<section class="ed-chapter ed-chapter-${number}">${heading(number,label)}<div class="ed-chapter-copy">${paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</div>${extra}</section>`;
 projectContent.innerHTML=`<section class="ed-intro"><p class="ed-genre">${esc(project.genre)}</p><h1>${esc(project.name)}</h1><p class="ed-lead">${esc(project.description)}</p></section><div class="ed-body"><section class="ed-opening ${project.id==='jeora'?'ed-opening-stacked':''} ${textOnlyOpening?'ed-opening-text-only':''}"><div>${heading('01','Descripción y objetivo')}<p>${esc(project.brief.objective)}</p></div>${textOnlyOpening?'':`<div class="ed-opening-image">${isCarl?'<p class="ed-opening-tag">Screen final · Combate</p>':''}${imageMarkup(lead)}</div>`}</section>${copy('02','Mi papel en el proyecto',[project.brief.role],'')}${copy('03','Concepto y decisiones creativas',project.brief.conceptDetails||[project.editorial[0].text],conceptsGallery)}${copy('04','Proceso creativo',[project.brief.process],processGallery)}${copy('05','Resultado final',[project.brief.result],resultsGallery)}${copy('06','Herramientas y técnicas utilizadas',[project.brief.tools],'')}</div>${projectNav}`;
 let opened=null;
 function closeImage(focus=true){
  if(!opened)return;
  const {figure,button,detail}=opened,top=figure.getBoundingClientRect().top;
  figure.classList.remove('ed-open');detail.remove();setImageExpanded(figure,false);opened=null;
  if(focus){window.scrollBy({top:figure.getBoundingClientRect().top-top,behavior:'instant'});button.focus({preventScroll:true})}
 }
 function setImageExpanded(figure,expanded){
  figure.querySelectorAll('.ed-thumbnail, .ed-enlarge').forEach(control=>control.setAttribute('aria-expanded',String(expanded)));
 }
 projectContent.querySelectorAll('.ed-thumbnail, .ed-enlarge').forEach(button=>button.addEventListener('click',()=>{
  closeImage(false);
  const figure=button.closest('figure'),source=figure.querySelector('.ed-thumbnail img'),top=figure.getBoundingClientRect().top;
  const detail=document.createElement('div');detail.className='ed-detail';
  const heading=document.createElement('div');heading.className='ed-detail-heading';
  const caption=document.createElement('p');caption.textContent=source.alt;
  const close=document.createElement('button');close.type='button';close.className='ed-close';close.textContent='Cerrar detalle';
  heading.append(caption,close);
  const image=source.cloneNode();image.removeAttribute('loading');image.className='ed-expanded';
  const full=document.createElement('a');full.href=source.src;full.target='_blank';full.rel='noopener';full.textContent='Abrir imagen a tamaño completo';full.className='ed-original';
  detail.append(heading,image,full);figure.append(detail);figure.classList.add('ed-open');setImageExpanded(figure,true);opened={figure,button,detail};
  window.scrollBy({top:figure.getBoundingClientRect().top-top,behavior:'instant'});close.focus({preventScroll:true});
  close.addEventListener('click',()=>closeImage());detail.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeImage()}});
 }));
}
document.querySelector('#year')?.append(String(new Date().getFullYear()));

const revealTargets=document.querySelectorAll('.section-heading,.about-copy,.process-row,.chapter');
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.1});revealTargets.forEach(el=>{el.classList.add('reveal');observer.observe(el)})}
const word=document.querySelector('#contact-word');
if(word&&!reduced.matches){const goodbye=!!document.querySelector('.contact-layout');const words=goodbye?['NOS VEMOS!','SEE YOU!','またね!','또 만나요!','À BIENTÔT!']:['HABLEMOS','LET’S TALK','話しましょう','이야기해요','PARLONS'];let index=0;let timer;let wordVisible=true;const observer=new IntersectionObserver(entries=>{wordVisible=entries[0].isIntersecting});observer.observe(word);timer=setInterval(()=>{if(document.hidden||!wordVisible)return;word.classList.add('word-out');setTimeout(()=>{index=(index+1)%words.length;word.textContent=words[index];word.lang=['es','en','ja','ko','fr'][index];word.classList.remove('word-out')},350)},2700);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true})}
const contactForm=document.querySelector('#contact-form');
if(contactForm){
 const status=document.querySelector('#form-status'),button=contactForm.querySelector('[type="submit"]');
 let sending=false;
 contactForm.addEventListener('submit',async event=>{
  event.preventDefault();if(sending)return;
  if(!contactForm.reportValidity())return;
  const payload=new FormData(contactForm);
  sending=true;button.disabled=true;button.textContent='ENVIANDO…';contactForm.setAttribute('aria-busy','true');
  status.dataset.state='sending';status.textContent='Enviando tu mensaje…';
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
  try{
   const response=await fetch(contactForm.action,{method:'POST',body:payload,headers:{Accept:'application/json'},signal:controller.signal});
   if(response.ok){
    contactForm.reset();status.dataset.state='success';status.textContent='Gracias. Tu mensaje se ha enviado correctamente.';
   }else{
    status.dataset.state='error';
    status.textContent=response.status===429?'Hay demasiados intentos de envío. Espera unos minutos y vuelve a intentarlo.':response.status===422?'Revisa los campos del formulario y vuelve a intentarlo. Tus datos siguen aquí.':'No se ha podido completar el envío. Tus datos siguen aquí para volver a intentarlo.';
   }
  }catch(error){
   status.dataset.state='error';status.textContent='No hemos podido confirmar el envío. Comprueba tu conexión antes de volver a intentarlo. Tus datos siguen aquí.';
  }finally{
   clearTimeout(timeout);sending=false;button.disabled=false;button.textContent='ENVIAR MENSAJE';contactForm.removeAttribute('aria-busy');
  }
 });
}

// Compact mobile navigation with keyboard dismissal and state announcements.
const menuToggle=document.querySelector('.menu-toggle');
const mainNav=document.querySelector('#main-nav');
if(menuToggle&&mainNav){
 const setMenu=open=>{menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');mainNav.classList.toggle('is-open',open)};
 menuToggle.addEventListener('click',()=>setMenu(menuToggle.getAttribute('aria-expanded')!=='true'));
 mainNav.addEventListener('click',e=>{if(e.target.closest('a'))setMenu(false)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuToggle.getAttribute('aria-expanded')==='true'){setMenu(false);menuToggle.focus()}});
 document.addEventListener('click',e=>{if(!e.target.closest('.header'))setMenu(false)});
 matchMedia('(max-width:600px)').addEventListener('change',()=>setMenu(false));
}


// Match the menu text to the section behind the centre of the glass bar.
const floatingHeader=document.querySelector('.floating-header');
if(floatingHeader){
 const wideMenu=matchMedia('(min-width:601px)');
 const darkSections=[...document.querySelectorAll('.bridge, .project-scene')];
 let contrastFrame=0;
 function updateHeaderContrast(){
  contrastFrame=0;
  const bounds=floatingHeader.getBoundingClientRect();
  const centre=bounds.top+bounds.height/2;
  const overDark=wideMenu.matches&&darkSections.some(section=>{
   const rect=section.getBoundingClientRect();
   return rect.top<=centre&&centre<rect.bottom;
  });
  floatingHeader.classList.toggle('is-over-dark',overDark);
 }
 function queueHeaderContrast(){
  if(!contrastFrame)contrastFrame=requestAnimationFrame(updateHeaderContrast);
 }
 window.addEventListener('scroll',()=>{if(wideMenu.matches)queueHeaderContrast();},{passive:true});
 window.addEventListener('resize',queueHeaderContrast);
 window.addEventListener('pageshow',queueHeaderContrast);
 wideMenu.addEventListener('change',queueHeaderContrast);
 updateHeaderContrast();
}

// Reveal each editorial block once, without intercepting native scroll.
const desktopScroll=matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
if(desktopScroll.matches && 'IntersectionObserver' in window){
 const blocks=document.querySelectorAll('.bridge > p, .disciplines, .about-copy, .portrait, .software-skills > h2, .software-list, .process-row, .contact > p, .contact-bottom');
 const revealBlocks=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){
   entry.target.classList.add('editorial-arrive');
   revealBlocks.unobserve(entry.target);
  }
 },{threshold:.12});
 blocks.forEach(block=>revealBlocks.observe(block));
}
