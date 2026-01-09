(()=>{const h=document,R=h.body,M=document.documentElement,b=R.dataset.lang||M.lang||"en",T=M.dataset.page||"";T.startsWith("project:");function B(){return Array.isArray(window.PROJECTS_DATA)?window.PROJECTS_DATA:[]}const s=t=>String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),_=t=>String(t??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");function q(t){return String(t??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}function z(t){const e=String(t||"").match(/\d{4}/g);return!e||!e.length?"n-a":e[e.length-1]}function g(t,e){const r=`${e}_${b}`,a=`${e}_en`;return t[r]??t[a]??""}function k(t){return Array.isArray(t)?t:typeof t=="string"&&t.length?[t]:[]}function w(t){if(!t)return"";const e=t.split("·").map(r=>r.trim());return b==="fr"&&e[1]?e[1]:e[0]||t}function D(t){const e=encodeURIComponent(t);return b==="fr"?`/fr/projets/${e}.html`:`/projects/${e}.html`}function E(t){return t?t.startsWith("/")?t:`/${t}`:""}function F(t){const e=g(t,"title"),r=g(t,"summary"),a=k(g(t,"highlights")),o=g(t,"cover_alt"),c=t.period||"",n=w(t.role),p=D(t.id),l=E(t.cover),d=(t.stack||[]).map(q).filter(Boolean).join(","),i=(t.tags||[]).map(q).filter(Boolean).join(","),u=z(c),f=a.map(v=>`<li>${s(v)}</li>`).join(""),j=(t.stack||[]).map(v=>`<span class="badge">${s(v)}</span>`).join("");return`<article class="project-card tilt-card" data-reveal data-stack="${d}" data-tags="${i}" data-year="${u}">
    <a class="project-card__link" href="${p}">
      <div class="project-card__media">
        <picture>
          <img src="${l}" alt="${_(o)}" width="1600" height="900" loading="lazy" decoding="async">
        </picture>
      </div>
      <div class="project-card__body">
        <div class="project-card__header">
          <h3>${s(e)}</h3>
          <p class="project-card__summary">${s(r)}</p>
        </div>
        <ul class="project-card__highlights">${f}</ul>
        <div class="project-card__meta">
          <span class="project-card__period">${s(c)}</span>
          <span class="project-card__role">${s(n)}</span>
        </div>
        <div class="project-card__tags">${j}</div>
      </div>
    </a>
  </article>`}function I(t,e){const r=t.querySelector("[data-project-count]");if(!r)return;const a=r.dataset.countLabel||r.querySelector("span")?.textContent||"",o=r.querySelector("strong");o&&(o.textContent=String(e));const c=r.querySelector("span");c&&a&&(c.textContent=a),a&&r.setAttribute("aria-label",`${e} ${a}`.trim())}function A(t,e){const a=t.sort((o,c)=>o.label.localeCompare(c.label)).map(o=>`<option value="${o.value}">${s(o.label)}</option>`).join("");return`<option value="all" selected>${s(e)}</option>${a}`}function O(t,e){const r=e.querySelector('select[data-filter="stack"]'),a=e.querySelector('select[data-filter="tag"]'),o=e.querySelector('select[data-filter="year"]');if(r){const c=new Map;t.forEach(l=>{(l.stack||[]).forEach(d=>{const i=q(d);!i||c.has(i)||c.set(i,d)})});const n=r.dataset.defaultLabel||r.querySelector("option")?.textContent||"All",p=Array.from(c.entries()).map(([l,d])=>({value:l,label:d}));r.innerHTML=A(p,n)}if(a){const c=new Map;t.forEach(l=>{(l.tags||[]).forEach(d=>{const i=q(d);!i||c.has(i)||c.set(i,d)})});const n=a.dataset.defaultLabel||a.querySelector("option")?.textContent||"All",p=Array.from(c.entries()).map(([l,d])=>({value:l,label:d}));a.innerHTML=A(p,n)}if(o){const c=new Set;t.forEach(l=>{const i=(l.period||"").match(/\d{4}/g);i&&i.forEach(u=>c.add(u))});const n=o.dataset.defaultLabel||o.querySelector("option")?.textContent||"All",p=Array.from(c).sort((l,d)=>Number(d)-Number(l)).map(l=>({value:l,label:l}));o.innerHTML=A(p,n)}}function N(t){const e=t.querySelector("[data-project-list]");if(!e)return;const r=Array.from(e.querySelectorAll(".project-card")),a=t.querySelector('select[data-filter="stack"]'),o=t.querySelector('select[data-filter="tag"]'),c=t.querySelector('select[data-filter="year"]'),n=t.querySelector("[data-status]");if(!n)return;const p=r.length;function l(u,f){return u?u.replace(/\{count\}/g,String(f)).replace(/\{total\}/g,String(p)):""}function d(u){n&&(u===0?n.textContent=l(n.dataset.statusEmpty,u)||"No projects to display.":u===p?n.textContent=l(n.dataset.statusAll,u):n.textContent=l(n.dataset.statusFiltered,u))}function i(){const u=a?a.value:"all",f=o?o.value:"all",j=c?c.value:"all";let v=0;r.forEach(S=>{const C=(S.dataset.stack||"").split(",").filter(Boolean),m=(S.dataset.tags||"").split(",").filter(Boolean),$=S.dataset.year||"",y=u==="all"||C.includes(u),L=f==="all"||m.includes(f),P=y&&L&&(j==="all"||$===j);S.style.display=P?"":"none",P&&(v+=1)}),d(v)}a&&a.addEventListener("change",i),o&&o.addEventListener("change",i),c&&c.addEventListener("change",i),n.dataset.statusAll&&(n.textContent=l(n.dataset.statusAll,p)),i()}function Y(t){const e=h.querySelector("[data-projects-root]");if(!e)return;const r=e.querySelector("[data-project-list]");if(!r)return;if(!(e.dataset.renderSource==="static")){const c=t.map(n=>F(n)).join("");r.innerHTML=c}const o=r.querySelectorAll(".project-card");I(e,o.length),O(t,e),N(e),h.dispatchEvent(new CustomEvent("projects:hydrated"))}function K(t=[]){return t.map(e=>`<span class="badge">${s(e)}</span>`).join("")}function H(t=[]){return t.map(e=>`<li>${s(e)}</li>`).join("")}function U(t){const e=h.querySelector("[data-project-detail]");if(!e)return;if(e.dataset.renderSource==="static"){h.dispatchEvent(new CustomEvent("projects:hydrated"));return}const r=e.dataset.projectId||T.replace("project:","");if(!r)return;const a=t.find(y=>y.id===r),o=e.querySelector("[data-project-hero]"),c=e.querySelector("[data-project-highlights]"),n=e.querySelector("[data-project-metrics]"),p=e.querySelector("[data-project-gallery]"),l=e.dataset.loadingMessage||"Loading project…";if(!a){o&&(o.innerHTML=`<div class="project-hero__copy"><p>${s(e.dataset.errorMessage||"Project not found.")}</p></div>`);return}const d=g(a,"title"),i=g(a,"summary"),u=k(g(a,"highlights")),f=k(g(a,"metrics")),j=g(a,"cover_alt"),v=E(a.cover),S=a.gallery||[],C=w(a.role),m={overview:e.dataset.labelOverview||"Overview",period:e.dataset.labelPeriod||"Period",role:e.dataset.labelRole||"Role",client:e.dataset.labelClient||"Client",stack:e.dataset.labelStack||"Focus",highlights:e.dataset.labelHighlights||"Highlights",metrics:e.dataset.labelMetrics||"Metrics"},$={contact:e.dataset.ctaContact||"Contact",projects:e.dataset.ctaProjects||"All projects",projectsHref:e.dataset.projectsHref||(b==="fr"?"/fr/projets/index.html":"/projects/index.html"),contactEmail:e.dataset.contactEmail||"contact@mohamedalimabrouki.com"};if(o&&(o.innerHTML=`<div class="project-hero__copy">
        <p class="eyebrow">${s(m.overview)}</p>
        <h1>${s(d)}</h1>
        <p>${s(i)}</p>
        <div class="project-hero__meta">
          <dl>
            <div><dt>${s(m.period)}</dt><dd>${s(a.period||"")}</dd></div>
            <div><dt>${s(m.role)}</dt><dd>${s(C)}</dd></div>
            <div><dt>${s(m.client)}</dt><dd>${s(a.client_or_brand||"")}</dd></div>
            <div><dt>${s(m.stack)}</dt><dd>${K(a.stack||[])}</dd></div>
          </dl>
          <div class="project-hero__actions">
            <a class="btn btn--primary" href="mailto:${_($.contactEmail)}">${s($.contact)}</a>
            <a class="btn btn--ghost" href="${_($.projectsHref)}">${s($.projects)}</a>
          </div>
        </div>
      </div>
      <div class="project-hero__media">
        <picture>
          <img src="${v}" alt="${_(j)}" width="1600" height="900" loading="eager" decoding="async" fetchpriority="high">
        </picture>
      </div>`),c){const y=u.length?`<ul>${H(u)}</ul>`:`<p>${s(l)}</p>`;c.innerHTML=`<h2>${s(m.highlights)}</h2>${y}`}if(n){const y=f.length?`<ul>${H(f)}</ul>`:`<p>${s(l)}</p>`;n.innerHTML=`<h2>${s(m.metrics)}</h2>${y}`}if(p){const y=S.map(L=>`<figure class="gallery__item">
            <picture>
              <img src="${E(L)}" alt="${_(j)}" width="1600" height="900" loading="lazy" decoding="async">
            </picture>
          </figure>`).join("");p.innerHTML=y}h.dispatchEvent(new CustomEvent("projects:hydrated"))}function J(t){const r=h.querySelector("[data-projects-root]")?.querySelector("[data-status]");r&&(r.textContent=r.dataset.statusError||"Unable to load projects.");const a=h.querySelector("[data-project-detail]");if(a){const o=a.dataset.errorMessage||"Unable to load this project.",c=a.querySelector("[data-project-hero]");c&&(c.innerHTML=`<div class="project-hero__copy"><p>${s(o)}</p></div>`)}console.error(t)}function x(){const t=h.querySelector("[data-projects-root]"),e=h.querySelector("[data-project-detail]"),r=!!t,a=e&&e.dataset.renderSource!=="static";if(!r&&!a){e&&e.dataset.renderSource==="static"&&h.dispatchEvent(new CustomEvent("projects:hydrated"));return}try{const o=B();r&&Y(o),a&&U(o)}catch(o){J(o)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",x):x()})();
