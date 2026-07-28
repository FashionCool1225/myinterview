/* 面试学习沉淀站 · 交互逻辑（纯前端，无构建） */
const state = {
  questions: [], categories: [], categoryDesc: {},
  activeCat: "全部", activeId: null, keyword: "",
  viewList: [], ctxList: [], prevId: null, nextId: null
};

const $ = (s, r = document) => r.querySelector(s);
const caretSvg = '<svg class="caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"></polyline></svg>';

async function loadIndex(){
  const res = await fetch("data/index.json");
  if(!res.ok) throw new Error("index.json 读取失败 (" + res.status + ")");
  return res.json();
}

function matches(q, kw){
  if(!kw) return true;
  kw = kw.toLowerCase();
  return (q.title + " " + (q.tags || []).join(" ")).toLowerCase().includes(kw);
}
function byCategory(cat){
  return state.questions.filter(q => q.category === cat);
}
function totalCount(){ return state.questions.length; }

/* ---------- Sidebar (目录) ---------- */
function buildSidebar(){
  const groups = $("#navGroups");
  groups.innerHTML = "";
  state.categories.forEach(cat => {
    const list = byCategory(cat);
    const group = document.createElement("div");
    group.className = "nav-group";
    group.dataset.cat = cat;
    group.innerHTML =
      `<button class="nav-cat" data-cat="${cat}">${caretSvg}<span class="nav-cat-name">${cat}</span><span class="count">${list.length}</span></button>` +
      `<div class="nav-items">` +
        list.map(q => `<button class="nav-item" data-id="${q.id}">${q.title}</button>`).join("") +
      `</div>`;
    groups.appendChild(group);

    group.querySelector(".nav-cat").addEventListener("click", e => {
      if(e.target.closest(".caret")){ group.classList.toggle("collapsed"); return; }
      gotoCategory(cat);
    });
    group.querySelectorAll(".nav-item").forEach(btn => {
      btn.addEventListener("click", () => { state.viewList = byCategory(cat); gotoQuestion(btn.dataset.id); });
    });
  });
  updateSidebarActive();
}

function updateSidebarActive(){
  $("#navAll").classList.toggle("active", state.activeCat === "全部" && !state.activeId && !state.keyword);
  document.querySelectorAll(".nav-cat").forEach(b => {
    b.classList.toggle("active", b.dataset.cat === state.activeCat && !state.activeId && !state.keyword);
  });
  document.querySelectorAll(".nav-item").forEach(b => {
    b.classList.toggle("active", b.dataset.id === state.activeId);
  });
}

function filterSidebar(){
  const kw = state.keyword.trim().toLowerCase();
  document.querySelectorAll(".nav-group").forEach(g => {
    let visible = 0;
    g.querySelectorAll(".nav-item").forEach(it => {
      const q = state.questions.find(x => x.id === it.dataset.id);
      const ok = matches(q, kw);
      it.style.display = ok ? "" : "none";
      if(ok) visible++;
    });
    g.style.display = (kw && visible === 0) ? "none" : "";
  });
}

/* ---------- Navigation ---------- */
function gotoAll(){
  state.activeCat = "全部"; state.activeId = null; state.keyword = "";
  $("#search").value = ""; closeDrawer(); render();
}
function gotoCategory(cat){
  state.activeCat = cat; state.activeId = null; state.keyword = "";
  $("#search").value = ""; closeDrawer(); render();
}
function gotoQuestion(id){
  if(state.viewList.length) state.ctxList = state.viewList.slice();
  state.activeId = id; state.keyword = ""; $("#search").value = "";
  closeDrawer(); render(); window.scrollTo(0,0);
}
function searchMode(kw){
  state.keyword = kw; state.activeId = null; render();
}

/* ---------- Main render ---------- */
function render(){
  const main = $("#main");
  updateSidebarActive();
  filterSidebar();
  if(state.keyword.trim()){ renderSearch(main); return; }
  if(state.activeId){ renderQuestion(main, state.activeId); return; }
  if(state.activeCat === "全部"){ renderOverview(main); }
  else { renderCategory(main, state.activeCat); }
}

function qlistHtml(list, startIdx=0){
  if(!list.length) return `<div class="empty">该分类暂无题目，去新增一道吧。</div>`;
  return `<div class="qlist">` + list.map((q,i) =>
    `<div class="qcard" style="--i:${startIdx+i}" data-id="${q.id}">
       <span class="diff">${q.difficulty||""}</span>
       <h3>${q.title}</h3>
       <div class="tags">${(q.tags||[]).map(t=>`<span class="tag">#${t}</span>`).join("")}</div>
     </div>`).join("") + `</div>`;
}

function renderOverview(main){
  state.viewList = state.questions;
  main.innerHTML =
    `<div class="hero">
       <h1>Java 后端面试学习沉淀</h1>
       <p>按 12 大核心分类系统整理高频考点，每个问题沉淀一份文档，配图可视化，支持分类浏览与标签搜索。</p>
       <div class="stats">
         <div class="stat"><b>${totalCount()}</b><span>已沉淀题目</span></div>
         <div class="stat"><b>${state.categories.length}</b><span>核心大分类</span></div>
       </div>
     </div>` +
    state.categories.map(cat => {
      const list = byCategory(cat);
      return `<section class="cat-section">
        <div class="cat-head"><h2>${cat}</h2><span class="c-count">${list.length} 题</span></div>
        <p class="cat-desc">${state.categoryDesc[cat]||""}</p>
        ${qlistHtml(list)}
      </section>`;
    }).join("");
  bindCards(main);
}

function renderCategory(main, cat){
  const list = byCategory(cat);
  state.viewList = list;
  main.innerHTML =
    `<div class="breadcrumb"><a href="#" id="bcAll">全部</a><span class="sep">/</span><span class="cur">${cat}</span></div>` +
    (state.categoryDesc[cat] ? `<div class="banner"><b>${cat}</b> · ${state.categoryDesc[cat]}</div>` : "") +
    qlistHtml(list);
  $("#bcAll").addEventListener("click", e => { e.preventDefault(); gotoAll(); });
  bindCards(main);
}

function renderSearch(main){
  const kw = state.keyword.trim();
  const list = state.questions.filter(q => matches(q, kw));
  state.viewList = list;
  main.innerHTML =
    `<div class="breadcrumb"><a href="#" id="bcAll">全部</a><span class="sep">/</span><span class="cur">搜索 “${kw}”</span></div>` +
    `<p class="cat-desc">匹配到 ${list.length} 道题（标题 + 标签）</p>` +
    qlistHtml(list);
  $("#bcAll").addEventListener("click", e => { e.preventDefault(); gotoAll(); });
  bindCards(main);
}

function renderQuestion(main, id){
  const q = state.questions.find(x => x.id === id);
  if(!q){ main.innerHTML = `<div class="error">未找到该题目。</div>`; return; }
  const seq = (state.ctxList && state.ctxList.length) ? state.ctxList : state.questions;
  const idx = seq.findIndex(x => x.id === id);
  const prev = idx > 0 ? seq[idx-1] : null;
  const next = (idx >= 0 && idx < seq.length-1) ? seq[idx+1] : null;
  state.prevId = prev ? prev.id : null;
  state.nextId = next ? next.id : null;
  const pagerBtn = (dir, item, isNext) => {
    if(item){
      return `<button class="p-btn ${isNext?'next':''}" data-go="${item.id}">
        ${isNext?'':`<span class="p-arrow">←</span>`}
        <span class="p-meta ${isNext?'right':''}"><span class="p-dir">${dir}</span><span class="p-title">${item.title}</span></span>
        ${isNext?`<span class="p-arrow">→</span>`:''}
      </button>`;
    }
    return `<button class="p-btn ${isNext?'next':''}" disabled>
      ${isNext?'':`<span class="p-arrow">←</span>`}
      <span class="p-meta ${isNext?'right':''}"><span class="p-dir">${dir}</span><span class="p-title">已是${dir}</span></span>
      ${isNext?`<span class="p-arrow">→</span>`:''}
    </button>`;
  };
  main.innerHTML =
    `<div class="breadcrumb">
       <a href="#" id="bcAll">全部</a><span class="sep">/</span>
       <a href="#" id="bcCat">${q.category}</a><span class="sep">/</span>
       <span class="cur">${q.title}</span>
     </div>
     <div class="doc" id="doc"><div class="skeleton-line" style="width:60%"></div><div class="skeleton-line" style="width:90%"></div><div class="skeleton-line" style="width:80%"></div><div class="skeleton-line" style="width:95%"></div></div>
     <div class="pager-hint">键盘 ← → 可在本题序列内切换上一题 / 下一题</div>
     <nav class="pager">
       ${pagerBtn("上一题", prev, false)}
       ${pagerBtn("下一题", next, true)}
     </nav>`;
  $("#bcAll").addEventListener("click", e => { e.preventDefault(); gotoAll(); });
  $("#bcCat").addEventListener("click", e => { e.preventDefault(); gotoCategory(q.category); });
  main.querySelectorAll(".p-btn[data-go]").forEach(b => b.addEventListener("click", () => gotoQuestion(b.dataset.go)));
  fetch("questions/" + q.file)
    .then(r => { if(!r.ok) throw new Error(r.status); return r.text(); })
    .then(md => { const doc = $("#doc"); if(doc) doc.innerHTML = marked.parse(md); })
    .catch(e => { const d = $("#doc"); if(d) d.outerHTML = `<div class="error">文档读取失败：${e.message}</div>`; });
}

function bindCards(scope){
  scope.querySelectorAll(".qcard").forEach(card => {
    card.addEventListener("click", () => gotoQuestion(card.dataset.id));
  });
}

/* ---------- Drawer (mobile) ---------- */
function closeDrawer(){ $(".layout").classList.remove("open"); }

/* ---------- Init ---------- */
$("#navAll").addEventListener("click", gotoAll);
$("#search").addEventListener("input", e => searchMode(e.target.value));
$(".menu-btn").addEventListener("click", () => $(".layout").classList.toggle("open"));
$(".scrim").addEventListener("click", closeDrawer);

/* ---------- Theme (deep / light) ---------- */
function applyTheme(theme){
  if(theme === "light") document.documentElement.dataset.theme = "light";
  else delete document.documentElement.dataset.theme;
}
(function initTheme(){
  let t = "dark";
  try { t = localStorage.getItem("myinterview-theme") || "dark"; } catch(e){}
  applyTheme(t);
})();
$("#themeToggle").addEventListener("click", () => {
  const isLight = document.documentElement.dataset.theme === "light";
  const next = isLight ? "dark" : "light";
  applyTheme(next);
  try { localStorage.setItem("myinterview-theme", next); } catch(e){}
});

document.addEventListener("keydown", e => {
  if(!state.activeId || state.keyword) return;
  const t = e.target.tagName;
  if(t === "INPUT" || t === "TEXTAREA") return;
  if(e.key === "ArrowLeft" && state.prevId){ e.preventDefault(); gotoQuestion(state.prevId); }
  else if(e.key === "ArrowRight" && state.nextId){ e.preventDefault(); gotoQuestion(state.nextId); }
});

(async function init(){
  try{
    const data = await loadIndex();
    state.questions = data.questions || [];
    state.categories = data.categories || [];
    state.categoryDesc = data.categoryDesc || {};
    $("#allCount").textContent = totalCount();
    buildSidebar();
    render();
  }catch(e){
    $("#main").innerHTML = `<div class="error">初始化失败：${e.message}<br>请通过本地服务器打开本页面（在该目录运行 <code>python -m http.server 8000</code>），不要用 file:// 直接双击。</div>`;
  }
})();
