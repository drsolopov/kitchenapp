// KitchenCoach — views. Rendered to #app by the router.
import { RECIPES, STORES, RESTRICTIONS, DIETS, CUISINES, SKILL_LEVELS, SEED } from './data.js';
import { Store, escapeHtml, formatPrice, toast } from './state.js';

const recipeById = (id) => RECIPES.find((r) => r.id === id);
const icon = (name) => ({ save: '🔖', like: '♥', dislike: '👎', share: '↗', back: '←', cart: '🛒', check: '✓', close: '✕', flame: '🔥', leaf: '🥦', star: '★' }[name] || name);

const fmtMin = (m) => `${m} min`;
export const portionFactor = (portion) => portion / 4;

const headerFor = (active) => `
<a class="brand" href="#/home">KitchenCoach</a>
<nav class="nav">
  <a href="#/home" class="${active === 'home' ? 'active' : ''}">Recommended</a>
  <a href="#/orders" class="${active === 'orders' ? 'active' : ''}">My Orders</a>
  <a href="#/recipes/saved" class="${active === 'recipes' ? 'active' : ''}">My Recipes</a>
  <a href="#/account" class="${active === 'account' ? 'active' : ''}">My Account</a>
</nav>`;

const onboardingHeader = () => `<a class="brand" href="#/welcome">KitchenCoach</a>`;

export const renderTopbar = (kind, active) => {
  const el = document.querySelector('[data-role="topbar"]');
  el.innerHTML = kind === 'onboarding' ? onboardingHeader() : headerFor(active);
};

export const closeAllDropdowns = () => document.querySelectorAll('.dropdown').forEach((d) => d.remove());

const screenHead = (crumbs, title) => `
<div class="crumbs">${crumbs}</div>
<h1 class="page-title">${title}</h1>`;

/* ============ WELCOME ============ */
export function viewWelcome() {
  return `
<div class="hero container">
  <h1>welcome to kitchencoach</h1>
  <p>your next meal awaits. no experience needed for a delicious dinner.</p>
  <div class="feature-row">
    <div class="feature"><h3>decide what to cook</h3><p>recipes matched to your skill level, diet and the time you have</p></div>
    <div class="feature"><h3>get every ingredient</h3><p>pick the missing items and order them from a store near you</p></div>
    <div class="feature"><h3>cook it step by step</h3><p>a cook mode that keeps your hands free and your step in view</p></div>
  </div>
  <div class="cta-row">
    <a class="btn btn-primary" href="#/quiz/1">get started</a>
    <button type="button" class="btn btn-outline" data-action="guest-start">explore as guest</button>
  </div>
</div>`;
}

/* ============ QUIZ ============ */
const quizStepMeta = {
  1: { title: 'what’s your cooking experience?', copy: 'help us meet you where you are.', kind: 'skill' },
  2: { title: 'anything we should keep out?', copy: 'share anything we should watch for. double-check recipe notes and package labels before cooking.', kind: 'restrictions', multi: true, note: 'allergen notes appear on recipe pages; package labels may include additional information.' },
  3: { title: 'how do you eat?', copy: 'pick every diet that applies. we will rank those recipes first.', kind: 'diets', multi: true, note: 'your diet filters and your recommended list stay in sync.' },
  4: { title: 'which cuisines do you love?', copy: 'we will lead with these and keep learning from what you cook.', kind: 'cuisines', multi: true, note: 'you can pick more than one. change them later in my account.' },
};

const cardListFor = (kind) =>
  ({
    skill: SKILL_LEVELS.map((s) => ({ id: s, label: s, hint: { beginner: 'new to cooking. recipes with simple steps and no surprises.', intermediate: 'comfortable with a knife and a pan. ready for a few techniques.', advanced: 'confident in the kitchen. show me the interesting stuff.' }[s] })),
    restrictions: RESTRICTIONS,
    diets: DIETS,
    cuisines: CUISINES,
  }[kind]);

export function viewQuiz(step) {
  const meta = quizStepMeta[step];
  if (!meta) return viewWelcome();
  const state = Store.get();
  const selected = meta.kind === 'skill' ? state.quiz.skill : state.quiz[meta.kind];
  const opts = cardListFor(meta.kind);
  const isSel = (id) => (Array.isArray(selected) ? selected.includes(id) : selected === id);
  const inputHtml = meta.multi
    ? `<div class="field-row" style="margin-top:26px;max-width:560px"><input class="field" id="custom-${meta.kind}" placeholder="type your ${meta.kind === 'restrictions' ? 'restriction' : meta.kind === 'diets' ? 'diet' : 'cuisine'}..."><button class="btn btn-ghost btn-sm" data-action="quiz-add-custom" data-kind="${meta.kind}">other</button></div>`
    : '';
  return `
<div class="quiz-wrap">
  <a class="quit-link" href="#/welcome">${icon('back')}</a>
  <div class="quiz-step">step ${step} of 4</div>
  <h1 class="quiz-title">${meta.title}</h1>
  <p class="quiz-copy">${meta.copy}</p>
  <div class="quiz-grid" id="quiz-options">
    ${opts
      .map(
        (o) => `<button type="button" class="quiz-card${isSel(o.id) ? ' selected' : ''}" data-action="quiz-pick" data-kind="${meta.kind}" data-id="${escapeHtml(o.id)}"><h4>${escapeHtml(o.label)}</h4><p>${escapeHtml(o.hint)}</p></button>`
      )
      .join('')}
  </div>
  ${inputHtml}
  ${meta.note ? `<p class="note" style="margin-top:18px">${meta.note}</p>` : ''}
  <div class="skip-row">
    <button class="btn btn-ghost" data-action="quiz-skip" data-step="${step}">skip for now</button>
    <div class="ok-row">
      <a class="btn btn-outline" href="#/${step > 1 ? 'quiz/' + (step - 1) : 'welcome'}">back</a>
      <button class="btn btn-primary" data-action="quiz-next" data-step="${step}">next</button>
    </div>
  </div>
</div>`;
}

/* ============ PERMISSIONS ============ */
export function viewPermissions() {
  return `
<div class="quiz-wrap" style="text-align:center">
  <div class="quiz-step">almost there</div>
  <h1 class="quiz-title">two quick things</h1>
  <p class="quiz-copy" style="margin:0 auto">we only ask for what makes cooking easier for you.</p>
  <div class="permission-card">
    <div class="perm-icon">📍</div>
    <div><h3 style="margin:0 0 8px">your location</h3><p class="note">so we can find the closest store that actually has your missing ingredients.</p></div>
    <button class="btn btn-outline" data-action="perm-allow" data-perm="location">allow</button>
  </div>
  <div class="permission-card">
    <div class="perm-icon">🔔</div>
    <div><h3 style="margin:0 0 8px">notifications</h3><p class="note">so we can tell you the moment your order is packed, ready and waiting.</p></div>
    <button class="btn btn-outline" data-action="perm-allow" data-perm="notifications">allow</button>
  </div>
  <p class="note" style="margin-top:22px">you can change both of these later in my account.</p>
  <button class="btn btn-primary" style="margin-top:26px" data-action="perm-done">start cooking</button>
</div>`;
}

/* ============ HOME / RECOMMENDED ============ */
const matchesFilters = (r, f) => {
  const q = (f.search || '').trim().toLowerCase();
  if (q) {
    const hay = [r.name, r.tag, r.blurb, r.skill, ...r.cuisines, ...r.diets, ...r.meals, `${r.protein}g`].join(' ').toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.cuisine !== 'all' && !r.cuisines.includes(f.cuisine)) return false;
  if (f.diet !== 'all' && !r.diets.includes(f.diet)) return false;
  if (f.meal !== 'all' && !r.meals.includes(f.meal)) return false;
  if (f.skill !== 'all' && r.skill !== f.skill) return false;
  return true;
};

export const sortRecipes = (list, state = Store.get()) => {
  const prefs = state.prefs || {};
  const cuisines = (prefs.cuisines || []).map((x) => x.toLowerCase());
  const diets = (prefs.diets || []).map((x) => x.toLowerCase());
  const skill = (prefs.skill || '').toLowerCase();
  const score = (recipe) =>
    (cuisines.some((x) => recipe.cuisines.includes(x)) ? 3 : 0) +
    (diets.some((x) => recipe.diets.includes(x)) ? 2 : 0) +
    (skill && recipe.skill === skill ? 1 : 0) +
    ((state.liked || []).includes(recipe.id) ? 1 : 0);
  return [...list].sort((a, b) => score(b) - score(a) || a.time - b.time);
};

export const preferenceSummary = (state = Store.get()) => {
  const prefs = state.prefs || {};
  const labels = [prefs.skill, ...(prefs.diets || []), ...(prefs.cuisines || [])].filter(Boolean);
  return labels.length ? `matched to ${labels.join(' · ')} · best fit first` : 'quick, beginner-friendly ideas · best fit first';
};

const homeFilters = [
  ['cuisine', 'cuisines', CUISINES, 'all cuisines'],
  ['diet', 'diet', DIETS, 'all diets'],
  ['meal', 'meal', [
    { id: 'dinner', label: 'dinner' }, { id: 'lunch', label: 'lunch' }, { id: 'snack', label: 'snack' }, { id: 'breakfast', label: 'breakfast' },
  ], 'all meals'],
  ['skill', 'skill level', SKILL_LEVELS.map((s) => ({ id: s, label: s })), 'any level'],
];

const recipeCard = (r) => `
<a class="card card-link-wrap" href="#/recipe/${r.id}" style="text-decoration:none;color:inherit" aria-label="${escapeHtml(r.name)}">
  <div class="card-image"><img src="${escapeHtml(r.image)}" alt="${escapeHtml(r.name)}" loading="lazy"></div>
  <div class="card-body">
    <div class="card-title">${escapeHtml(r.name)}</div>
    <div class="card-meta">
      <span>${r.time} mins</span>
      <span>${escapeHtml(r.tag)}</span>
      <span>${escapeHtml(r.skill)}</span>
    </div>
  </div>
</a>`;

export function viewHome() {
  const state = Store.get();
  const f = state.filters;
  const list = sortRecipes(RECIPES.filter((r) => matchesFilters(r, f, state)), state);
  const chip = (group, label, active) =>
    `<div class="dropdown-wrap"><button class="chip-btn${active ? ' active' : ''}" data-action="filter-toggle" data-group="${group}" aria-expanded="false">${escapeHtml(label)}</button></div>`;
  const chipLabel = (group, allLabel) => {
    if (group === 'cuisine') return f.cuisine === 'all' ? allLabel : f.cuisine;
    if (group === 'diet') return f.diet === 'all' ? allLabel : f.diet;
    if (group === 'meal') return f.meal === 'all' ? allLabel : f.meal;
    return f.skill === 'all' ? allLabel : f.skill;
  };
  return `
<div class="container">
  <div class="search-row" style="margin-top:6px">
    <label class="searchbar" for="home-search">
      <span aria-hidden="true">🔍</span>
      <input id="home-search" type="search" placeholder="search by ingredient or dish..." value="${escapeHtml(f.search || '')}" aria-label="Search recipes">
    </label>
  </div>
  <div class="filters-bar">
    ${homeFilters.map(([g, label, opts, all]) => chip(g, chipLabel(g, all), f[g === 'skill' ? 'skill' : g] !== 'all')).join('\n    ')}
  </div>
  <h1 class="section-title" style="margin-top:26px">recommended for you</h1>
  <p class="note" id="home-count" style="margin:0 0 18px">${escapeHtml(preferenceSummary(state))} · ${list.length} recipe${list.length === 1 ? '' : 's'}</p>
  <div class="grid" id="home-grid">
    ${list.map(recipeCard).join('') || `<div class="empty-state">no recipes match that search — clear it or try fewer filters.</div>`}
  </div>
</div>`;
}

/* ============ MY RECIPES ============ */
const tabIds = ['saved', 'liked', 'cook-again', 'disliked', 'all'];

export function viewMyRecipes(tab) {
  const state = Store.get();
  const activeTab = tabIds.includes(tab) ? tab : 'saved';
  const buckets = {
    saved: state.saved,
    liked: state.liked,
    'cook-again': state.cookedAgain,
    disliked: state.disliked,
  };
  let ids = buckets[activeTab];
  if (activeTab === 'all') ids = [...new Set([...state.saved, ...state.liked, ...state.cookedAgain, ...state.disliked])];
  const list = (ids || []).map(recipeById).filter(Boolean);
  const title = { saved: 'saved recipes', liked: 'liked recipes', 'cook-again': 'cook again', disliked: 'disliked recipes', all: 'my recipes' }[activeTab];
  const sub = {
    saved: 'my recipes / saved',
    liked: 'the ones you rated highly — we will show more like these',
    'cook-again': 'the recipes you already mastered — your fastest weeks of the year',
    disliked: 'hidden from your recommendations - you can bring any of them back',
    all: 'saved, cooked again and disliked - your personal stash',
  }[activeTab];
  const count = (t) => (buckets[t] ? buckets[t].length : 0);
  return `
<div class="container">
  ${screenHead('my recipes / ' + activeTab.replace('-', ' '), title)}
  <p class="note" style="margin-top:-6px">${sub}</p>
  <div class="tabs" role="tablist">
    <a class="tab ${activeTab === 'saved' ? 'active' : ''}" href="#/recipes/saved" role="tab">saved (${count('saved')})</a>
    <a class="tab ${activeTab === 'liked' ? 'active' : ''}" href="#/recipes/liked" role="tab">liked (${count('liked')})</a>
    <a class="tab ${activeTab === 'cook-again' ? 'active' : ''}" href="#/recipes/cook-again" role="tab">cook again (${count('cook-again')})</a>
    <a class="tab ${activeTab === 'disliked' ? 'active' : ''}" href="#/recipes/disliked" role="tab">disliked (${count('disliked')})</a>
    <a class="tab ${activeTab === 'all' ? 'active' : ''}" href="#/recipes/all" role="tab">all saved</a>
  </div>
  ${list.length ? `<div class="grid">${list.map(recipeCard).join('')}</div>` : `<div class="empty-state">nothing here yet — start exploring and save what looks good.</div>`}
</div>`;
}

/* ============ ORDERS ============ */
export function viewOrders() {
  const state = Store.get();
  const current = state.order;
  const past = state.orders;
  return `
<div class="container">
  ${screenHead('orders / current', 'my orders')}
  <p class="note" style="margin-top:-6px">track pickup and delivery, reorder in one tap</p>

  ${current ? `
  <div class="order-card" style="margin-bottom:26px">
    <div class="order-row">
      <div>
        <span class="badge">current order · ${escapeHtml(current.fulfilment)}</span>
        <h2 class="section-title" style="margin:12px 0 6px">${escapeHtml(current.store)} — ${escapeHtml(current.storeDistance)}</h2>
        <p class="note">order #${escapeHtml(current.id.replace('o-', ''))} · ${escapeHtml(current.items.join(' + '))} · ready in ~25 min</p>
        <div class="timeline" style="max-width:560px">
          ${['confirmed', 'packed', 'ready'].map((s, i) => `<div class="tstep ${i < current.currentStep ? 'done' : i === current.currentStep ? 'current' : ''}">${s}</div>`).join('')}
        </div>
      </div>
      <div style="text-align:right">
        <div class="section-title" style="font-size:22px">${formatPrice(current.total)}</div>
        <p class="note">portion ${current.portion}</p>
        <a class="btn btn-primary" href="#/tracking" style="margin-top:8px">track order</a>
      </div>
    </div>
  </div>` : ''}

  <h2 class="section-title">past</h2>
  <div class="grid" style="margin-top:16px;grid-template-columns:repeat(auto-fill,minmax(330px,1fr))">
    ${past.map((o) => `
    <div class="order-card">
      <p class="note" style="margin:0 0 4px">${escapeHtml(o.date)} · ${escapeHtml(o.store)} · ${escapeHtml(o.fulfilment)}</p>
      <p style="font-size:20px;font-weight:600;margin:4px 0 2px;color:var(--teal)">${escapeHtml(o.items)}</p>
      <p class="note">total ${formatPrice(o.total)}</p>
      <button class="btn btn-outline btn-sm" style="margin-top:10px" data-action="reorder" data-order="${escapeHtml(o.id)}">reorder</button>
    </div>`).join('')}
  </div>
</div>`;
}

/* ============ ACCOUNT ============ */
export function viewAccount() {
  const s = Store.get();
  const p = SEED.profile;
  return `
<div class="container">
  ${screenHead('account', 'my account')}
  <div class="split">
    <div class="panel-plain">
      <div class="profile-badge">
        <div class="avatar">${escapeHtml(p.name[0])}</div>
        <div>
          <h2 style="margin:0 0 6px;font-size:26px;color:var(--teal)">${escapeHtml(p.name)}</h2>
          <p class="note" style="margin:0">${escapeHtml(p.weekly)}</p>
        </div>
      </div>
      <hr class="hr">
      <div class="kv"><span>skill</span><b>${escapeHtml(s.quiz.skill || p.skill)}</b></div>
      <div class="kv"><span>diet</span><b>${escapeHtml((s.quiz.diets.length ? s.quiz.diets.join(' + ') : p.diet))}</b></div>
      <div class="kv"><span>restrictions</span><b>${escapeHtml((s.quiz.restrictions.length ? s.quiz.restrictions.join(', ') : p.restrictions))}</b></div>
      <div class="kv"><span>goal</span><b>${escapeHtml(p.goal)}</b></div>
      <div class="kv"><span>cuisine loves</span><b>${escapeHtml((s.quiz.cuisines.length ? s.quiz.cuisines.join(', ') : p.cuisines))}</b></div>
      <div class="kv"><span>portion default</span><b>2 — serves Marissa + Eathan flows</b></div>
      <a class="btn btn-outline" style="margin-top:18px" href="#/quiz/1">update defaults</a>
    </div>
    <div>
      <div class="panel-plain" style="margin-bottom:22px">
        <h2 class="section-title" style="margin-top:0">stores + payment</h2>
        <div class="kv"><span>home store</span><b>${escapeHtml(p.homeStore)}</b></div>
        <div class="kv"><span>fulfilment</span><b>${escapeHtml(p.fulfilment)}</b></div>
        <div class="kv"><span>payment</span><b>card: ${escapeHtml(p.card)} — one-tap reorder on</b></div>
      </div>
      <div class="panel-plain">
        <h2 class="section-title" style="margin-top:0">recent wins</h2>
        <p class="note">3 cooked this week — 2 saved — 0 wasted leftovers.</p>
        <hr class="hr">
        <p class="note" style="margin-bottom:0">disliked: mushrooms — hides from recommendations<br>recipes in cook again: ${s.cookedAgain.length}<br>receipts + live status live in my orders</p>
      </div>
    </div>
  </div>
</div>`;
}

/* ============ RECIPE DETAIL ============ */
export function viewRecipe(id) {
  const r = recipeById(id);
  if (!r) return `<div class="container"><p class="empty-state">recipe not found. <a href="#/home">back to recommended</a></p></div>`;
  const s = Store.get();
  const saved = s.saved.includes(r.id);
  const liked = s.liked.includes(r.id);
  const disliked = s.disliked.includes(r.id);
  const portion = (s.uiPortions && s.uiPortions[r.id]) || 4;
  const factor = portionFactor(portion);
  const fmtQty = (q) => {
    const m = q.match(/^([\d.]+)\s*(.*)$/);
    if (!m) return q;
    const n = Number(m[1]) * factor;
    const rounded = Math.round(n * 10) / 10;
    return `${rounded}${m[2] ? ' ' + m[2] : ''}`;
  };
  const ingList = r.ingredients.map((ing) => {
    const checked = ing.missing;
    return `<div class="ing-item"><label><input type="checkbox" class="ing-missing" data-id="${ing.id}" ${checked ? 'checked' : ''} style="accent-color:var(--teal);width:20px;height:20px"><span>${escapeHtml(fmtQty(ing.qty))} ${escapeHtml(ing.name)}</span></label></div>`;
  }).join('');
  const steps = r.steps.map((st, i) => `<li data-step="${i}">${escapeHtml(st.text)}</li>`).join('');
  return `
<div class="container">
  <p class="crumbs"><a href="#/home">recommended</a> / pastas / ${escapeHtml(r.name)}</p>
  <div class="recipe-hero">
    <div class="hero-photo"><img src="${escapeHtml(r.image)}" alt="${escapeHtml(r.name)}"></div>
    <div class="recipe-body">
      <h1 class="page-title" style="margin:0;font-size:40px">${escapeHtml(r.name)}</h1>
      <p class="note" style="font-size:16px">${escapeHtml(r.blurb)}</p>
      <div class="stat-row"><span>⏱ ${fmtMin(r.time)}</span><span>· ${escapeHtml(r.tag)}</span><span>· ${r.protein}g protein</span><span>· ${escapeHtml(r.skill)}</span></div>
      <span class="allergen">allergen note: ${escapeHtml(r.allergens)}</span>
      <div style="display:flex;gap:10px;margin:6px 0">
        <button class="icon-btn${saved ? ' active' : ''}" data-action="toggle-save" data-id="${r.id}" title="save" aria-pressed="${saved}">${icon('save')}</button>
        <button class="icon-btn${liked ? ' active' : ''}" data-action="toggle-like" data-id="${r.id}" title="like" aria-pressed="${liked}">${icon('like')}</button>
        <button class="icon-btn${disliked ? ' active' : ''}" data-action="toggle-dislike" data-id="${r.id}" title="dislike" aria-pressed="${disliked}">${icon('dislike')}</button>
        <button class="icon-btn" data-action="share" data-id="${r.id}" title="share">${icon('share')}</button>
      </div>
      <div class="kv" style="border:0;padding:6px 0"><span>portion</span>
        <div class="portion-stepper" aria-label="portion stepper">
          <button data-action="portion" data-delta="-2" aria-label="decrease portion">−</button>
          <span class="val" id="portion-val">${portion}</span>
          <button data-action="portion" data-delta="2" aria-label="increase portion">+</button>
        </div>
      </div>
      <p class="note" style="font-size:16px"><b style="color:var(--teal)">${r.kcal} kcal — ${r.protein}g protein / serving</b> · ${fmtMin(r.time)} · ${escapeHtml(r.skill)}</p>
      <div style="margin-top:auto;display:flex;gap:12px;flex-wrap:wrap">
        <a class="btn btn-primary" href="#/cook/${r.id}">continue to cook mode</a>
      </div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1.15fr 1fr;gap:26px;margin-top:28px" class="recipe-lower">
    <div class="panel-plain">
      <h2 class="section-title" style="margin-top:0">ingredients — select what you don’t have</h2>
      <div class="ing-grid">${ingList}</div>
      <hr class="hr">
      <p class="note">substitute ingredients: any missing item swaps automatically if it is in your diet filters.</p>
      <button class="btn btn-primary" style="margin-top:8px" id="start-order" data-action="start-order" data-id="${r.id}">${icon('cart')} order missing ingredients (<span id="missing-count">${r.ingredients.filter(i => i.missing).length}</span>)</button>
    </div>
    <div class="panel-plain">
      <h2 class="section-title" style="margin-top:0">steps preview</h2>
      <ol class="step-list">${steps}</ol>
      <hr class="hr">
      <p class="note">full steps open in cook mode once your order is picked up. <b>allergen note:</b> ${escapeHtml(r.allergens)}.</p>
    </div>
  </div>
</div>`;
}

/* ============ ORDER INGREDIENTS ============ */
export function viewOrderIngredients(id) {
  const r = recipeById(id);
  const s = Store.get();
  if (!r || !s.cart || s.cart.recipeId !== id) {
    return `<div class="container"><p class="empty-state">no order in progress. <a href="#/recipe/${id || ''}">pick ingredients on the recipe page</a> first.</p></div>`;
  }
  const factor = portionFactor(s.cart.portion);
  const fmtQty = (q) => {
    const m = q.match(/^([\d.]+)\s*(.*)$/);
    if (!m) return q;
    return `${Math.round(Number(m[1]) * factor * 10) / 10}${m[2] ? ' ' + m[2] : ''}`;
  };
  const missingOnly = r.ingredients.filter((ing) => s.cart.missing.includes(ing.id));
  const stores = STORES.map((st, i) => {
    const sel = s.cart.storeId === st.id;
    const low = String(st.stock[r.id] || st.stock.default).includes('low');
    return `
<label class="store-card${sel ? ' selected' : ''}" data-action="select-store" data-store="${st.id}">
  <input type="radio" name="store" ${sel ? 'checked' : ''} aria-label="select ${escapeHtml(st.name)}">
  <span><strong>${escapeHtml(st.name)} ${escapeHtml(st.distance)}</strong><br><span class="store-note${low ? ' stock-low' : ''}">${low ? 'low stock' : 'in stock'} — ${escapeHtml(st.note)}</span></span>
</label>`;
  }).join('');
  const total = missingOnly.reduce((sum, i) => sum + i.price * factor, 0);
  return `
<div class="container">
  ${screenHead('order / ingredients', 'order ingredients')}
  <p class="note" style="margin-top:-6px">step 3 — pick a store near you · ${missingOnly.length} missing selected · portion ${s.cart.portion}</p>
  <div class="split" style="grid-template-columns:1.2fr 1fr">
    <div class="panel-plain">
      <h2 class="section-title" style="margin-top:0">stores near you — all show stock for your ${missingOnly.length} missing</h2>
      <div style="display:flex;flex-direction:column;gap:14px;margin-top:8px">${stores}</div>
      <p class="note" style="margin-top:16px">GreenMart wins on distance; QuickShop is cheapest if you can wait.</p>
    </div>
    <div class="panel-plain">
      <h2 class="section-title" style="margin-top:0">your list — ${missingOnly.length} missing</h2>
      ${missingOnly.map((ing) => `
      <div class="kv"><span>${escapeHtml(fmtQty(ing.qty))} ${escapeHtml(ing.name)}</span><b>${formatPrice(ing.price * factor)}</b></div>`).join('')}
      <hr class="hr">
      <div class="kv" style="font-size:20px"><span>subtotal</span><b>${formatPrice(total)}</b></div>
      <p class="note">taxes and store fee calculated at checkout.</p>
      <button class="btn btn-primary" style="width:100%;margin-top:10px" data-action="continue-to-place" data-id="${r.id}">continue — ${missingOnly.length} missing selected</button>
    </div>
  </div>
</div>`;
}

/* ============ PLACE ORDER ============ */
export function viewPlaceOrder(id) {
  const r = recipeById(id);
  const s = Store.get();
  if (!r || !s.cart || s.cart.recipeId !== id) {
    return `<div class="container"><p class="empty-state">no order in progress. <a href="#/home">start from a recipe</a>.</p></div>`;
  }
  const factor = portionFactor(s.cart.portion);
  const missingOnly = r.ingredients.filter((ing) => s.cart.missing.includes(ing.id));
  const store = STORES.find((st) => st.id === s.cart.storeId) || STORES[0];
  const subtotal = missingOnly.reduce((sum, i) => sum + i.price * factor, 0);
  const fulfilment = s.cart.fulfilment || 'pickup';
  const fee = fulfilment === 'delivery' ? (store.deliveryFee || 0) : 1.8;
  const tax = Math.round(subtotal * 0.22 * 100) / 100;
  const total = subtotal + fee + tax;
  return `
<div class="container">
  ${screenHead('order / checkout', 'place order')}
  <p class="note" style="margin-top:-6px">step 4 — ${fulfilment}, portion ${s.cart.portion}, price up front. no surprises.</p>
  <div class="split" style="grid-template-columns:1fr 1.1fr">
    <div class="panel-plain">
      <h2 class="section-title" style="margin-top:0">fulfilment</h2>
      <div class="fulfil-toggle" role="radiogroup" aria-label="fulfilment">
        <button class="fulfil-opt${fulfilment === 'pickup' ? ' selected' : ''}" data-action="set-fulfilment" data-mode="pickup" role="radio" aria-checked="${fulfilment === 'pickup'}">pickup</button>
        <button class="fulfil-opt${fulfilment === 'delivery' ? ' selected' : ''}" data-action="set-fulfilment" data-mode="delivery" role="radio" aria-checked="${fulfilment === 'delivery'}">delivery</button>
      </div>
      <p class="note" style="margin-top:12px">${fulfilment === 'pickup' ? `today — ready ~${store.pickupEta} min — show code at counter` : `dorm room 214 — arrives in ${store.pickupEta + 10} min window · delivery ${formatPrice(store.deliveryFee)}`}</p>
      <hr class="hr">
      <h2 class="section-title">portion</h2>
      <div class="portion-stepper" aria-label="portion stepper">
        <button data-action="cart-portion" data-delta="-2" aria-label="decrease portion">−</button>
        <span class="val" id="cart-portion-val">${s.cart.portion}</span>
        <button data-action="cart-portion" data-delta="2" aria-label="increase portion">+</button>
      </div>
      <hr class="hr">
      <h2 class="section-title">payment</h2>
      <p class="note" style="font-size:17px">visa ..42 — ${escapeHtml(store.name)} ${fulfilment}</p>
      <p class="note">free cancellation before packed</p>
    </div>
    <div class="panel-plain">
      <h2 class="section-title" style="margin-top:0">your order</h2>
      ${missingOnly.map((ing) => {
        const qty = (() => {
          const m = ing.qty.match(/^([\d.]+)\s*(.*)$/);
          if (!m) return ing.qty;
          return `${Math.round(Number(m[1]) * factor * 10) / 10}${m[2] ? ' ' + m[2] : ''}`;
        })();
        return `<div class="kv"><span>${escapeHtml(qty)} ${escapeHtml(ing.name)}</span><b>${formatPrice(ing.price * factor)}</b></div>`;
      }).join('')}
      <div class="kv"><span>${fulfilment === 'delivery' ? 'delivery' : 'store fee'}</span><b>${formatPrice(fee)}</b></div>
      <div class="kv"><span>tax</span><b>${formatPrice(tax)}</b></div>
      <div class="kv" style="font-size:21px;color:var(--teal)"><span><b>total $${total.toFixed(2)} — ${escapeHtml(store.name)} ${fulfilment}</b></span><b>${formatPrice(total)}</b></div>
      <button class="btn btn-primary" style="width:100%;margin-top:14px;font-size:22px" data-action="place-order" data-id="${r.id}">place ${fulfilment} order — ${formatPrice(total)}</button>
    </div>
  </div>
</div>`;
}

/* ============ TRACKING ============ */
export function viewTracking() {
  const s = Store.get();
  const o = s.order;
  if (!o) return `<div class="container"><p class="empty-state">no active order. <a href="#/orders">see my orders</a></p></div>`;
  return `
<div class="container">
  ${screenHead('orders / tracking', 'tracking')}
  <p class="note" style="margin-top:-6px">step 5 — your ${o.fulfilment === 'pickup' ? 'pickup time. head to ' + escapeHtml(o.store) + ' when it says ready' : 'delivery window. meet the rider at the door'}</p>
  <div class="split" style="grid-template-columns:1.2fr 1fr">
    <div class="panel-plain">
      <span class="badge">${escapeHtml(o.items.join(' + '))}</span>
      <h2 class="section-title" style="margin:14px 0 6px">order #${escapeHtml(o.id.replace('o-', ''))} — ${escapeHtml(o.store)} ${escapeHtml(o.fulfilment)}</h2>
      <p class="note">${escapeHtml(o.eta)} · ${escapeHtml(o.placedAt ? 'placed ' + o.placedAt : '')}</p>
      <div class="timeline" style="max-width:560px;margin-top:20px">
        ${['confirmed', 'packed', 'ready for pickup'].map((t, i) => `<div class="tstep ${i < o.currentStep ? 'done' : i === o.currentStep ? 'current' : ''}">${t}</div>`).join('')}
      </div>
      <p class="note" style="font-size:17px;margin-top:18px"><b>${o.currentStep >= 2 ? 'ready — show the code at the counter' : 'almost ready — you can head over now'}</b><br>you’ll receive a text with your pickup code when your order is ready.</p>
      <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap">
        <button class="btn btn-outline" data-action="edit-order">edit order</button>
        <button class="btn btn-danger" data-action="cancel-order">cancel order</button>
      </div>
    </div>
    <div class="panel-plain" style="text-align:center">
      <p class="note" style="margin-top:0">${o.fulfilment === 'pickup' ? 'show this at the counter' : 'show this to the rider'}</p>
      <div class="code-pill" id="code-pill">${escapeHtml(o.code)}</div>
      <div style="margin-top:22px"><button class="icon-btn" data-action="copy-code" title="copy code" style="width:52px;height:52px;font-size:22px">⧉</button></div>
      <hr class="hr">
      <button class="btn btn-primary" style="width:100%" data-action="continue-to-cook">continue to cook mode</button>
      <p class="note" style="margin-top:12px">next: grab ingredients, then cook in cook mode — steps wait for you</p>
    </div>
  </div>
</div>`;
}

/* ============ COOK MODE ============ */
let timer = { interval: null, remaining: 0, running: false, recipeId: null };

export function viewCook(id) {
  const r = recipeById(id);
  if (!r) return `<div class="container"><p class="empty-state">recipe not found.</p></div>`;
  const s = Store.get();
  const session = s.cookSession && s.cookSession.recipeId === id ? s.cookSession : { recipeId: id, step: 0, done: [] };
  return `
<div class="container">
  ${screenHead('cook / step-by-step', 'cook mode')}
  <p class="note" style="margin-top:-6px">step 6 — ingredients home. follow along, tick as you go · hands messy? text stays on while you cook</p>
  <div class="cook-wrap">
    <div class="cook-dark">
      <h3>step ${session.step + 1} · ${fmtMin(r.time)} total</h3>
      <div class="timer-ring" id="timer-ring" style="--p:0"><div class="time" id="timer-time">${String(r.steps[session.step].time).padStart(2, '0')}:00</div></div>
      <p class="note" style="color:#8fd3e3;margin:16px 0 6px">timer · currently: ${escapeHtml(r.steps[session.step].text)}</p>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn btn-light" id="timer-btn" data-action="timer-toggle" data-id="${r.id}">start timer</button>
        <button class="btn btn-light" data-action="cook-next" data-id="${r.id}">next step</button>
      </div>
      <div class="cook-tip" style="margin-top:18px">💡 tip: ${escapeHtml(r.tip)}</div>
      <figure class="ref-photo" style="margin:18px 0 0"><img src="${escapeHtml(r.image)}" alt="reference — ${escapeHtml(r.name)}" loading="lazy"><figcaption>reference photo — your result should look like this</figcaption></figure>
    </div>
    <div class="panel-plain">
      <h2 class="section-title" style="margin-top:0">portion ${(s.uiPortions && s.uiPortions[r.id]) || 4} — all ingredients in</h2>
      <div class="step-checklist" id="cook-steps">
        ${r.steps.map((st, i) => `
        <button class="step-item${session.done.includes(i) ? ' done' : ''}${i === session.step ? ' current' : ''}" data-action="cook-toggle-step" data-id="${r.id}" data-step="${i}">
          <span class="snum">${session.done.includes(i) ? '✓' : i + 1}</span>
          <span><strong style="display:block;color:#d8fbff">${i === r.steps.length - 1 ? 'Final step' : 'Step ' + (i + 1)}</strong>${escapeHtml(st.text)}</span>
        </button>`).join('')}
      </div>
      <button class="btn btn-primary" style="width:100%;margin-top:20px" data-action="finish-cook" data-id="${r.id}">mark as cooked — saves to cook again</button>
    </div>
  </div>
</div>`;
}

/* ============ SUCCESS ============ */
export function viewSuccess(id) {
  const r = recipeById(id);
  const s = Store.get();
  if (!r) return `<div class="container"><p class="empty-state">recipe not found.</p></div>`;
  const portion = (s.cookSession && s.cookSession.portion) || (s.uiPortions && s.uiPortions[r.id]) || 4;
  const rating = s.ratings[r.id] || 0;
  return `
<div class="container" style="text-align:center;padding-top:60px">
  <div style="font-size:84px;line-height:1">👨‍🍳</div>
  <h1 class="page-title" style="font-size:46px;margin:18px 0 6px">you did it!</h1>
  <p class="note" style="font-size:19px">You cooked the ${escapeHtml(r.name)} — ${portion} portions</p>
  <hr class="hr" style="max-width:520px;margin:24px auto">
  <h2 class="section-title">rate this recipe</h2>
  <div class="stars" role="radiogroup" aria-label="rating" style="justify-content:center">
    ${[1, 2, 3, 4, 5].map((n) => `<button class="star${n <= rating ? ' on' : ''}" data-action="rate" data-id="${r.id}" data-stars="${n}" role="radio" aria-checked="${n === rating}" aria-label="${n} star${n > 1 ? 's' : ''}">★</button>`).join('')}
  </div>
  <div class="cta-row" style="justify-content:center;margin-top:30px">
    <a class="btn btn-primary" href="#/home">back to recommended</a>
    <a class="btn btn-outline" href="#/recipes/cook-again">view recipe in cook again</a>
  </div>
  <div class="panel-plain" style="max-width:560px;margin:30px auto 0;text-align:left">
    <h3 class="section-title" style="margin-top:0;font-size:20px">what got saved</h3>
    <p class="note">recipe in cook again under my recipes<br>receipt moved to my orders<br>${portion} portions logged — ${r.protein * portion}g protein total</p>
  </div>
</div>`;
}
