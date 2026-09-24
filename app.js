(() => {
  'use strict';
  const projects = window.PORTFOLIO_PROJECTS || [];
  const grid = document.querySelector('#projects');
  const dialog = document.querySelector('#project-dialog');
  const contact = document.querySelector('#contact-dialog');
  const labels = {ip:'IP / 毛绒', product:'周边产品', illustration:'插画 / 3D', visual:'平面 / 书籍'};
  let filter = 'all', returnFocus = null, routeOpenedHere = false;
  const node = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  };
  const visibleProjects = () => projects.filter(p => filter === 'all' || p.categories.includes(filter));
  const lockPage = () => document.body.classList.toggle('modal-open', Boolean(document.querySelector('dialog[open]')));
  function makeImage(media, eager = false) {
    const img = new Image();
    img.src = media.src; img.alt = media.alt || '';
    img.loading = eager ? 'eager' : 'lazy'; img.decoding = 'async';
    if (media.width) img.width = media.width;
    if (media.height) img.height = media.height;
    img.addEventListener('error', () => img.replaceWith(node('span','image-error','图片暂时无法显示')), {once:true});
    return img;
  }
  function renderGrid() {
    grid.replaceChildren();
    const selected = visibleProjects();
    selected.forEach((p,i) => {
      const article = node('article','project-card');
      const button = node('button','project-link'); button.type = 'button';
      button.dataset.project = p.id; button.setAttribute('aria-label','查看'+p.title);
      const cover = node('div','project-cover '+(p.coverFit || 'contain')+(p.coverPadding ? ' padded' : ''));
      if(p.coverColor) cover.style.backgroundColor=p.coverColor;
      cover.append(makeImage({src:p.cover,alt:p.coverAlt || p.title},i<2));
      const arrow = node('span','open-indicator','↗'); arrow.setAttribute('aria-hidden','true'); cover.append(arrow);
      const caption = node('div','project-caption');
      caption.append(node('h2','',p.title),node('span','',p.caption || labels[p.categories[0]]));
      button.append(cover,caption);
      button.addEventListener('click',() => {returnFocus=button; routeOpenedHere=true; location.hash='project='+encodeURIComponent(p.id);});
      article.append(button); grid.append(article);
    });
    document.querySelector('#result-status').textContent = `${selected.length} 组作品`;
    document.querySelectorAll('[data-filter]').forEach(button=>{
      const active=button.dataset.filter===filter;
      button.classList.toggle('active',active); button.setAttribute('aria-pressed',String(active));
      const count=button.dataset.filter==='all' ? projects.length : projects.filter(p=>p.categories.includes(button.dataset.filter)).length;
      button.querySelector('.count').textContent=String(count).padStart(2,'0');
    });
  }
  function openLightbox(media){
    const lightbox=node('dialog','lightbox'); lightbox.setAttribute('aria-label',media.alt || '作品大图');
    const close=node('button','lightbox-close','关闭 ×'); close.type='button'; close.onclick=()=>lightbox.close();
    lightbox.append(close,makeImage(media,true));
    if(media.alt) lightbox.append(node('p','lightbox-caption',media.alt));
    lightbox.addEventListener('close',()=>{lightbox.remove();lockPage();});
    lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close();});
    document.body.append(lightbox); lightbox.showModal(); lockPage();
  }
  function renderProject(p){
    document.querySelector('#project-title').textContent=p.title; document.title=p.title+' · Mia盒';
    const content=document.querySelector('#project-content'); content.replaceChildren();
    const details=node('details','project-info'); const summary=node('summary');
    summary.append(node('span','','项目信息'),node('span','','+'));
    const info=node('div','project-info-body'), narrative=node('div');
    narrative.append(node('p','',p.summary));
    if(p.note) narrative.append(node('p','',p.note));
    if(p.link){const a=node('a','',p.link.label); a.href=p.link.url;a.target='_blank';a.rel='noopener noreferrer';narrative.append(a);}
    const role=node('p','role'); role.append(node('b','','我的职责'),document.createTextNode(p.role));
    info.append(narrative,role);details.append(summary,info);content.append(details);
    p.sections.forEach((section,si)=>{
      const block=node('section','project-section'), meta=node('div','section-meta');
      meta.append(node('h3','',section.label));
      if(section.text)meta.append(node('p','',section.text));
      const mediaGrid=node('div','image-grid'+(section.images.length===1?' single':section.columns===3?' three':''));
      section.images.forEach((media,i)=>{
        const figure=node('figure','work-image'), button=node('button','image-button');
        button.type='button';button.setAttribute('aria-label','放大：'+media.alt);
        const img=makeImage(media,si===0 && i<2);
        // Small source details stay at their native resolution.
        if(media.width && media.width<700) img.style.maxWidth=media.width+'px';
        button.append(img);button.onclick=()=>openLightbox(media);figure.append(button);
        if(media.alt)figure.append(node('figcaption','',media.alt));
        mediaGrid.append(figure);
      });
      block.append(meta,mediaGrid);content.append(block);
    });
    let collection=visibleProjects(); if(!collection.includes(p))collection=projects;
    const index=collection.indexOf(p);
    document.querySelector('#project-position').textContent=String(index+1).padStart(2,'0')+' / '+String(collection.length).padStart(2,'0');
    const prev=document.querySelector('#previous-project'),next=document.querySelector('#next-project');
    prev.disabled=index===0;next.disabled=index===collection.length-1;
    prev.onclick=()=>changeProject(collection[index-1]);next.onclick=()=>changeProject(collection[index+1]);
    if(!dialog.open)dialog.showModal(); dialog.scrollTop=0;
    document.querySelector('#close-project').focus({preventScroll:true});lockPage();
  }
  function changeProject(p){if(!p)return;history.replaceState(null,'','#project='+encodeURIComponent(p.id));renderProject(p);}
  function closeProject(){
    if(routeOpenedHere && location.hash.startsWith('#project='))history.back();
    else {history.replaceState(null,'',location.pathname+location.search);syncRoute();}
  }
  function syncRoute(){
    document.querySelectorAll('dialog.lightbox').forEach(box=>box.close());
    let id='';try{if(location.hash.startsWith('#project='))id=decodeURIComponent(location.hash.slice(9));}catch{}
    const p=projects.find(p=>p.id===id);
    if(p)renderProject(p);
    else {if(dialog.open)dialog.close();document.title='Mia盒 · 设计作品集';routeOpenedHere=false;}
  }
  document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.filter;renderGrid();});
  document.querySelector('#close-project').onclick=closeProject;
  dialog.addEventListener('cancel',e=>{e.preventDefault();closeProject();});
  dialog.addEventListener('close',()=>{lockPage();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
  document.querySelectorAll('[data-contact]').forEach(button=>button.onclick=()=>{document.querySelector('#copy-status').textContent='';contact.showModal();lockPage();});
  contact.querySelector('.close-contact').onclick=()=>contact.close();contact.addEventListener('close',lockPage);
  contact.addEventListener('click',e=>{if(e.target!==contact)return;const r=contact.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)contact.close();});
  document.querySelector('#copy-wechat').onclick=async()=>{
    try{await navigator.clipboard.writeText('HSJ_05');document.querySelector('#copy-status').textContent='微信号已复制';}
    catch{document.querySelector('#copy-status').textContent='微信号：HSJ_05，可长按或选中复制';}
  };
  window.addEventListener('hashchange',syncRoute);renderGrid();syncRoute();
})();
