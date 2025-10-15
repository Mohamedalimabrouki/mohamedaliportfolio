
const state = {
  projects: [],
  activeTag: 'all',
  lang: localStorage.getItem('lang') || 'en',
  i18n: { ui: {} }
};
const translationsCache = {};
let revealObserver;

// --- Enhancement: <picture> with WebP + JPG/PNG fallbacks
function imgBlock(path, alt, focus){
  const webp = path.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  const style = focus ? ` style="--focus:${focus}"` : "";
  const fallbackType = path.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  return `<picture class="focus-img"${style}>
    <source srcset="${webp}" type="image/webp">
    <source srcset="${path}" type="${fallbackType}">
    <img src="${path}" alt="${alt}" loading="lazy" decoding="async" sizes="(min-width: 900px) 33vw, 100vw">
  </picture>`;
}

async function loadJSON(url){
  try{
    const r = await fetch(url, {cache:'no-store'});
    if(!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  }catch(err){
    console.warn('Could not load', url, err);
    return null;
  }
}

function cardHTML(p){
  const bullets = (p.bullets||[]).map(b=>`<li>${b}</li>`).join('');
  const tags = (p.tags||[]).map(t=>`<span class="pill pill--small">${t}</span>`).join('');
  const tagRow = tags ? `<div class="pill-row">${tags}</div>` : '';
  const credits = p.credit ? `<small class="muted">${p.credit}</small>` : '';
  return `<a class="card reveal" href="project.html?p=${encodeURIComponent(p.slug)}" data-tags="${(p.tags||[]).join(',')}">
    ${imgBlock(p.image, p.title, (p.details&&p.details.focus)||p.focus||"50% 50%")}
    <h4>${p.title}</h4>
    <p class="muted">${p.summary}</p>
    <ul>${bullets}</ul>
    ${tagRow}
    ${credits}
  </a>`;
}

function initRevealObserver(){
  if(revealObserver) return;
  revealObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },{threshold:0.18});
}

function observeReveals(context=document){
  initRevealObserver();
  context.querySelectorAll('.reveal').forEach(el=>{
    if(el.dataset.revealBound) return;
    revealObserver.observe(el);
    el.dataset.revealBound = '1';
  });
}

function tagLabel(tag){
  if(tag === 'all'){
    return state.i18n.ui?.filter_all || 'All';
  }
  const chip = document.querySelector(`.filters .chip[data-tag="${CSS.escape(tag)}"]`);
  return chip ? chip.textContent.trim() : tag;
}

function getVisibleCount(){
  return Array.from(document.querySelectorAll('#project-grid .card'))
    .filter(el => el.style.display !== 'none').length;
}

function updateFilterStatus(tag, visible){
  const status = document.getElementById('filterStatus');
  if(!status) return;
  const total = state.projects.length;
  const ui = state.i18n.ui || {};
  if(total === 0){
    status.textContent = ui.filter_status_empty || 'Case studies will appear soon.';
    return;
  }
  if(visible === 0){
    const tplNone = ui.filter_status_none || 'No case studies for {tag} yet.';
    status.textContent = tplNone.replace('{tag}', tagLabel(tag));
    return;
  }
  if(tag === 'all'){
    const tplAll = ui.filter_status_all || 'Showing {count} of {total} case studies.';
    status.textContent = tplAll.replace('{count}', visible).replace('{total}', total);
    return;
  }
  const tplTag = ui.filter_status_tag || 'Showing {count} of {total} case studies — {tag}.';
  status.textContent = tplTag
    .replace('{count}', visible)
    .replace('{total}', total)
    .replace('{tag}', tagLabel(tag));
}

function applyFilters(tag){
  state.activeTag = tag || 'all';
  const chips = document.querySelectorAll('.filters .chip');
  chips.forEach(chip=>{
    const isActive = chip.dataset.tag === state.activeTag;
    chip.classList.toggle('active', isActive);
    chip.setAttribute('aria-selected', String(isActive));
  });
  let visible = 0;
  document.querySelectorAll('#project-grid .card').forEach(card=>{
    const tags = (card.getAttribute('data-tags')||'').split(',');
    const match = state.activeTag === 'all' || tags.includes(state.activeTag);
    card.style.display = match ? '' : 'none';
    if(match) visible += 1;
  });
  updateFilterStatus(state.activeTag, visible);
}

function setupFilters(){
  const chips = document.querySelectorAll('.filters .chip');
  chips.forEach(ch=>{
    ch.addEventListener('click', ()=>{
      const tag = ch.dataset.tag || 'all';
      applyFilters(tag);
    });
    ch.addEventListener('keydown', (evt)=>{
      if(evt.key === 'Enter' || evt.key === ' '){
        evt.preventDefault();
        applyFilters(ch.dataset.tag || 'all');
      }
    });
  });
}

function setupTheme(){
  const btn = document.getElementById('themeToggle');
  if(!btn) return;
  const root = document.documentElement;
  if(!root.dataset.theme){
    root.dataset.theme = localStorage.getItem('theme') || 'dark';
  }
  const sync = ()=> btn.setAttribute('aria-pressed', root.dataset.theme === 'light');
  sync();
  btn.addEventListener('click', ()=>{
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    localStorage.setItem('theme', next);
    sync();
  });
}

function setupMenu(){
  const btn = document.getElementById('menuToggle');
  const nav = document.getElementById('primaryNav');
  if(!btn || !nav) return;
  btn.addEventListener('click', ()=>{
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('open', !expanded);
  });
  nav.querySelectorAll('a').forEach(link=>{
    link.addEventListener('click', ()=>{
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('keydown', (evt)=>{
    if(evt.key === 'Escape'){
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

function setTranslations(data, lang){
  state.i18n = data;
  state.lang = lang;
  document.documentElement.lang = lang;
  const dict = data.ui || {};
  document.querySelectorAll('[data-i18n-key]').forEach(el=>{
    const key = el.dataset.i18nKey;
    if(!key) return;
    const value = dict[key];
    if(typeof value === 'string'){
      el.textContent = value;
    }
  });
  const langBtn = document.getElementById('langToggle');
  if(langBtn){
    const next = lang === 'en' ? 'FR' : 'EN';
    langBtn.textContent = next;
    langBtn.setAttribute('aria-label', lang === 'en' ? 'Passer en français' : 'Switch to English');
    langBtn.setAttribute('aria-pressed', String(lang === 'fr'));
  }
  updateFilterStatus(state.activeTag, getVisibleCount());
}

async function applyI18n(lang){
  if(translationsCache[lang]){
    setTranslations(translationsCache[lang], lang);
    return;
  }
  const data = await loadJSON(`content/i18n_${lang}.json`);
  if(data){
    translationsCache[lang] = data;
    setTranslations(data, lang);
  }
}

function setupLang(){
  const btn = document.getElementById('langToggle');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    const next = state.lang === 'en' ? 'fr' : 'en';
    localStorage.setItem('lang', next);
    applyI18n(next);
  });
  applyI18n(state.lang);
}

async function loadProjects(){
  const grid = document.getElementById('project-grid');
  if(!grid) return;
  const projects = await loadJSON('content/projects.json');
  if(projects && Array.isArray(projects)){
    state.projects = projects;
    grid.innerHTML = projects.map(cardHTML).join('');
    observeReveals(grid);
    applyFilters(state.activeTag);
  }else{
    grid.innerHTML = '<div class="card muted">Case studies will appear once content is published.</div>';
    observeReveals(grid);
  }
}

function bootstrap(){
  observeReveals(document);
  setupTheme();
  setupMenu();
  setupFilters();
  setupLang();
  loadProjects();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootstrap);
}else{
  bootstrap();
}
