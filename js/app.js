// KitchenCoach — SPA router + events (hash-based, plain JS)
import { Store, escapeHtml, toast } from './state.js';
import { RECIPES, STORES } from './data.js';
import {
  viewWelcome, viewQuiz, viewPermissions, viewHome, viewMyRecipes, viewOrders,
  viewAccount, viewRecipe, viewOrderIngredients, viewPlaceOrder, viewTracking,
  viewCook, viewSuccess, renderTopbar, closeAllDropdowns, portionFactor, sortRecipes, preferenceSummary,
} from './views.js';

const root = document.getElementById('app');
Store.init();

/* ---------- routing ---------- */
const matchRoute = () => {
  const hash = location.hash.replace(/^#/, '') || '/';
  const parts = hash.split('/').filter(Boolean);
  const p = parts[0] || '';
  if (hash === '/' || p === '') return { name: 'root' };
  if (p === 'welcome') return { name: 'welcome' };
  if (p === 'quiz') return { name: 'quiz', step: Number(parts[1] || 1) };
  if (p === 'permissions') return { name: 'permissions' };
  if (p === 'home') return { name: 'home' };
  if (p === 'recipes') return { name: 'recipes', tab: parts[1] || 'saved' };
  if (p === 'orders') return { name: 'orders' };
  if (p === 'account') return { name: 'account' };
  if (p === 'recipe') return { name: 'recipe', id: parts[1] };
  if (p === 'order-ingredients') return { name: 'order-ingredients', id: parts[1] };
  if (p === 'place-order') return { name: 'place-order', id: parts[1] };
  if (p === 'tracking') return { name: 'tracking' };
  if (p === 'cook') return { name: 'cook', id: parts[1] };
  if (p === 'success') return { name: 'success', id: parts[1] };
  return { name: 'notfound' };
};

const isOnboardingPath = (route) =>
  ['welcome', 'quiz', 'permissions', 'root'].includes(route.name);

const recipeById = (id) => RECIPES.find((r) => r.id === id);

function render() {
  const route = matchRoute();
  const state = Store.get();

  if (!state.onboarded && !isOnboardingPath(route)) {
    location.hash = '#/welcome';
    return;
  }
  if (state.onboarded && route.name === 'root') {
    location.hash = '#/home';
    return;
  }

  closeAllDropdowns();

  let html = '';
  let topbar = { kind: 'app', active: null };
  switch (route.name) {
    case 'root':
      html = viewWelcome();
      topbar = { kind: 'onboarding' };
      break;
    case 'welcome':
      html = viewWelcome();
      topbar = { kind: 'onboarding' };
      break;
    case 'quiz':
      html = viewQuiz(route.step);
      topbar = { kind: 'onboarding' };
      break;
    case 'permissions':
      html = viewPermissions();
      topbar = { kind: 'onboarding' };
      break;
    case 'home':
      html = viewHome();
      topbar = { kind: 'app', active: 'home' };
      break;
    case 'recipes':
      html = viewMyRecipes(route.tab);
      topbar = { kind: 'app', active: 'recipes' };
      break;
    case 'orders':
      html = viewOrders();
      topbar = { kind: 'app', active: 'orders' };
      break;
    case 'account':
      html = viewAccount();
      topbar = { kind: 'app', active: 'account' };
      break;
    case 'recipe':
      html = viewRecipe(route.id);
      topbar = { kind: 'app', active: 'home' };
      break;
    case 'order-ingredients':
      html = viewOrderIngredients(route.id);
      topbar = { kind: 'app', active: 'home' };
      break;
    case 'place-order':
      html = viewPlaceOrder(route.id);
      topbar = { kind: 'app', active: 'home' };
      break;
    case 'tracking':
      html = viewTracking();
      topbar = { kind: 'app', active: 'orders' };
      break;
    case 'cook':
      html = viewCook(route.id);
      topbar = { kind: 'app', active: 'home' };
      break;
    case 'success':
      html = viewSuccess(route.id);
      topbar = { kind: 'app', active: 'home' };
      break;
    default:
      html = `<div class="container"><div class="empty-state"><p>that page doesn’t exist yet.</p><a href="#/home">back to recommended</a></div></div>`;
  }

  renderTopbar(topbar.kind, topbar.active);
  root.innerHTML = html;
  window.scrollTo(0, 0);

  if (route.name === 'cook') setupCookTimerButtonState();
  if (route.name === 'home') setupHomeFocus();
}

window.addEventListener('hashchange', render);

/* ---------- home: live search ---------- */
let searchDebounce = null;
function refilterHome() {
  const state = Store.get();
  const q = (state.filters.search || '').trim().toLowerCase();
  const grid = document.getElementById('home-grid');
  const count = document.getElementById('home-count');
  const list = RECIPES.filter((r) => {
    const f = state.filters;
    if (q) {
      const hay = [r.name, r.tag, r.blurb, r.skill, ...r.cuisines, ...r.diets, ...r.meals].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.cuisine !== 'all' && !r.cuisines.includes(f.cuisine)) return false;
    if (f.diet !== 'all' && !r.diets.includes(f.diet)) return false;
    if (f.meal !== 'all' && !r.meals.includes(f.meal)) return false;
    if (f.skill !== 'all' && r.skill !== f.skill) return false;
    return true;
  });
  const sorted = sortRecipes(list, state);
  if (count) count.textContent = `${preferenceSummary(state)} · ${sorted.length} recipe${sorted.length === 1 ? '' : 's'}`;
  if (grid) {
    grid.innerHTML =
      sorted.map((r) => `
<a class="card" href="#/recipe/${r.id}" style="text-decoration:none;color:inherit">
  <div class="card-image"><img src="${escapeHtml(r.image)}" alt="${escapeHtml(r.name)}" loading="lazy"></div>
  <div class="card-body">
    <div class="card-title">${escapeHtml(r.name)}</div>
    <div class="card-meta"><span>${r.time} mins</span><span>${escapeHtml(r.tag)}</span><span>${escapeHtml(r.skill)}</span></div>
  </div>
</a>`).join('') ||
      '<div class="empty-state">no recipes match that search — clear it or try fewer filters.</div>';
  }
}
function setupHomeFocus() {
  /* keep after render; focus handled by user */
}

/* ---------- cook timer ---------- */
let cookTimer = { id: null, remaining: 0, total: 0, running: false };
function stopCookTimer() {
  if (cookTimer.id) clearInterval(cookTimer.id);
  cookTimer = { id: null, remaining: 0, total: 0, running: false };
}
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [660, 880].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.5);
      o.start(ctx.currentTime + i * 0.18);
      o.stop(ctx.currentTime + i * 0.18 + 0.6);
    });
  } catch (e) { /* audio unavailable */ }
}
const timerEls = () => ({ time: document.getElementById('timer-time'), ring: document.getElementById('timer-ring'), btn: document.getElementById('timer-btn') });
function renderTimer() {
  const { time, ring, btn } = timerEls();
  if (!time) return;
  const mm = Math.floor(cookTimer.remaining / 60);
  const ss = cookTimer.remaining % 60;
  time.textContent = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  if (ring) ring.style.setProperty('--p', `${cookTimer.total ? (100 * (cookTimer.total - cookTimer.remaining)) / cookTimer.total : 0}%`);
  if (btn) btn.textContent = cookTimer.running ? 'pause timer' : cookTimer.remaining > 0 && cookTimer.remaining < cookTimer.total ? 'resume timer' : 'start timer';
}
function setupCookTimerButtonState() { renderTimer(); }

/* ---------- global listeners ---------- */
document.addEventListener('input', (e) => {
  const target = e.target;
  if (target && target.id === 'home-search') {
    const state = Store.get();
    state.filters.search = target.value;
    Store.save();
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(refilterHome, 120);
  }
  if (target && target.classList && target.classList.contains('ing-missing')) {
    const grid = target.closest('.ing-grid');
    const count = document.getElementById('missing-count');
    if (grid && count) count.textContent = String(grid.querySelectorAll('input.ing-missing:checked').length);
  }
});

document.addEventListener('click', (e) => {
  const toggle = e.target.closest('[data-action]');
  const insideDropdown = e.target.closest('.dropdown');

  // close dropdowns when clicking outside
  if (!insideDropdown && !(toggle && toggle.dataset.action === 'filter-toggle')) {
    closeAllDropdowns();
  }
  if (!toggle) return;
  const action = toggle.dataset.action;
  const state = Store.get();

  const go = (hash) => { location.hash = hash; };

  switch (action) {
    /* ----- onboarding ----- */
    case 'quiz-pick': {
      const kind = toggle.dataset.kind;
      const id = toggle.dataset.id;
      Store.update((s) => {
        if (kind === 'skill') s.quiz.skill = s.quiz.skill === id ? null : id;
        else {
          const arr = s.quiz[kind] || [];
          s.quiz[kind] = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
        }
      });
      render();
      break;
    }
    case 'quiz-add-custom': {
      const kind = toggle.dataset.kind;
      const input = document.getElementById(`custom-${kind}`);
      const value = (input?.value || '').trim().toLowerCase();
      if (!value) return;
      Store.update((s) => { s.quiz[kind] = [...new Set([...(s.quiz[kind] || []), value])]; });
      render();
      break;
    }
    case 'quiz-next':
    case 'quiz-skip': {
      const step = Number(toggle.dataset.step || 1);
      Store.update((s) => {
        s.prefs = { ...(s.prefs || {}), restrictions: s.prefs?.restrictions || [], diets: s.prefs?.diets || [], cuisines: s.prefs?.cuisines || [] };
        if (step === 1 && s.quiz.skill) s.prefs.skill = s.quiz.skill;
        if (step === 2 && s.quiz.restrictions?.length) s.prefs.restrictions = [...s.quiz.restrictions];
        if (step === 3 && s.quiz.diets?.length) s.prefs.diets = [...s.quiz.diets];
        if (step === 4 && s.quiz.cuisines?.length) s.prefs.cuisines = [...s.quiz.cuisines];
      });
      go(step < 4 ? `#/quiz/${step + 1}` : '#/permissions');
      break;
    }
    case 'guest-start': {
      Store.update((s) => { s.onboarded = true; });
      go('#/home');
      break;
    }
    case 'perm-allow': {
      toggle.textContent = 'allowed ✓';
      toggle.classList.remove('btn-outline');
      toggle.classList.add('btn-primary');
      toggle.disabled = true;
      toast(`${toggle.dataset.perm === 'location' ? 'location' : 'notifications'} allowed — you can change this in my account`);
      break;
    }
    case 'perm-done': {
      Store.update((s) => { s.onboarded = true; });
      toast('you’re in — welcome to KitchenCoach');
      go('#/home');
      break;
    }

    /* ----- filters ----- */
    case 'filter-toggle': {
      const group = toggle.dataset.group;
      const wrap = toggle.closest('.dropdown-wrap');
      const existing = wrap.querySelector('.dropdown');
      if (existing) {
        existing.remove();
        toggle.setAttribute('aria-expanded', 'false');
        return;
      }
      const options = {
        cuisine: [['all', 'all cuisines'], ['italian', 'italian'], ['mexican', 'mexican'], ['asian', 'asian'], ['indian', 'indian'], ['american', 'american'], ['mediterranean', 'mediterranean']],
        diet: [['all', 'all diets'], ['vegetarian', 'vegetarian'], ['vegan', 'vegan'], ['keto', 'keto'], ['halal', 'halal'], ['kosher', 'kosher'], ['pescatarian', 'pescatarian']],
        meal: [['all', 'all meals'], ['dinner', 'dinner'], ['lunch', 'lunch'], ['snack', 'snack'], ['breakfast', 'breakfast']],
        skill: [['all', 'any level'], ['beginner', 'beginner'], ['intermediate', 'intermediate'], ['advanced', 'advanced']],
      }[group];
      const current = state.filters[group];
      const list = document.createElement('div');
      list.className = 'dropdown';
      list.setAttribute('role', 'listbox');
      list.innerHTML = options.map(([val, label]) => `<button class="dd-item${current === val ? ' selected' : ''}" data-action="filter-select" data-group="${group}" data-value="${val}" role="option" aria-selected="${current === val}"><span>${label}</span><span class="pick">✓</span></button>`).join('');
      wrap.appendChild(list);
      toggle.setAttribute('aria-expanded', 'true');
      break;
    }
    case 'filter-select': {
      const group = toggle.dataset.group;
      const value = toggle.dataset.value;
      Store.update((s) => { s.filters[group] = value; });
      closeAllDropdowns();
      render();
      break;
    }

    /* ----- save / like / dislike / share ----- */
    case 'toggle-save': {
      const id = toggle.dataset.id;
      Store.update((s) => {
        s.saved = s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id];
      });
      toggle.classList.toggle('active', Store.get().saved.includes(id));
      toggle.setAttribute('aria-pressed', String(Store.get().saved.includes(id)));
      toast(Store.get().saved.includes(id) ? 'saved to your recipes' : 'removed from saved');
      break;
    }
    case 'toggle-like': {
      const id = toggle.dataset.id;
      Store.update((s) => {
        s.liked = s.liked.includes(id) ? s.liked.filter((x) => x !== id) : [...s.liked, id];
        if (s.liked.includes(id)) s.disliked = s.disliked.filter((x) => x !== id);
      });
      toggle.classList.toggle('active', Store.get().liked.includes(id));
      toggle.setAttribute('aria-pressed', String(Store.get().liked.includes(id)));
      toast(Store.get().liked.includes(id) ? 'noted — more like this coming up' : 'okay, fewer like this');
      break;
    }
    case 'toggle-dislike': {
      const id = toggle.dataset.id;
      Store.update((s) => {
        s.disliked = s.disliked.includes(id) ? s.disliked.filter((x) => x !== id) : [...s.disliked, id];
        if (s.disliked.includes(id)) {
          s.saved = s.saved.filter((x) => x !== id);
          s.liked = s.liked.filter((x) => x !== id);
        }
      });
      toggle.classList.toggle('active', Store.get().disliked.includes(id));
      toggle.setAttribute('aria-pressed', String(Store.get().disliked.includes(id)));
      toast(Store.get().disliked.includes(id) ? 'hidden from recommendations' : 'brought back to recommendations');
      break;
    }
    case 'share': {
      const id = toggle.dataset.id;
      const url = `${location.origin}${location.pathname}#/recipe/${id}`;
      const done = () => toast('recipe link copied to clipboard');
      if (navigator.share) navigator.share({ title: 'KitchenCoach recipe', text: 'check this recipe', url }).then(done, done);
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, done);
      else done();
      break;
    }

    /* ----- portions ----- */
    case 'portion': {
      const delta = Number(toggle.dataset.delta || 0);
      const id = matchRoute().id;
      Store.update((s) => {
        s.uiPortions = s.uiPortions || {};
        const current = s.uiPortions[id] ?? 4;
        s.uiPortions[id] = Math.min(8, Math.max(2, current + delta));
      });
      render();
      break;
    }
    case 'cart-portion': {
      const delta = Number(toggle.dataset.delta || 0);
      Store.update((s) => {
        if (!s.cart) return;
        s.cart.portion = Math.min(8, Math.max(2, (s.cart.portion || 4) + delta));
      });
      render();
      break;
    }

    /* ----- ordering ----- */
    case 'start-order': {
      const id = toggle.dataset.id;
      const missing = [...document.querySelectorAll('input.ing-missing:checked')].map((el) => el.dataset.id);
      const portion = (state.uiPortions && state.uiPortions[id]) || 4;
      if (!missing.length) {
        toast('nothing selected — tick what you don’t have');
        return;
      }
      Store.update((s) => {
        s.cart = { recipeId: id, portion, missing, storeId: 'greenmart', fulfilment: 'pickup' };
      });
      go(`#/order-ingredients/${id}`);
      break;
    }
    case 'select-store': {
      const storeId = toggle.dataset.store;
      Store.update((s) => {
        if (s.cart) s.cart.storeId = storeId;
      });
      render();
      break;
    }
    case 'continue-to-place': {
      go(`#/place-order/${toggle.dataset.id}`);
      break;
    }
    case 'set-fulfilment': {
      const mode = toggle.dataset.mode;
      Store.update((s) => {
        if (s.cart) s.cart.fulfilment = mode === 'delivery' ? 'delivery' : 'pickup';
      });
      render();
      break;
    }
    case 'place-order': {
      const id = toggle.dataset.id;
      const r = recipeById(id);
      const s = Store.get();
      if (!r || !s.cart || s.cart.recipeId !== id) {
        toast('no order in progress — start from the recipe page');
        go(`#/recipe/${id}`);
        return;
      }
      const factor = portionFactor(s.cart.portion);
      const missingOnly = r.ingredients.filter((ing) => s.cart.missing.includes(ing.id));
      const store = STORES.find((st) => st.id === s.cart.storeId) || STORES[0];
      const subtotal = missingOnly.reduce((sum, ing) => sum + ing.price * factor, 0);
      const fee = s.cart.fulfilment === 'delivery' ? store.deliveryFee || 0 : 1.8;
      const tax = Math.round(subtotal * 0.22 * 100) / 100;
      const total = Math.round((subtotal + fee + tax) * 100) / 100;
      Store.update((st) => {
        st.order = {
          id: `o-${Math.floor(1000 + Math.random() * 9000)}`,
          recipeId: id,
          items: missingOnly.map((ing) => ing.name.toLowerCase()),
          store: store.name,
          storeDistance: store.distance,
          fulfilment: st.cart.fulfilment,
          portion: st.cart.portion,
          total,
          code: String(Math.floor(1000 + Math.random() * 9000)),
          eta: s.cart.fulfilment === 'pickup' ? `today · ready ~${store.pickupEta} min` : `today · arr ${store.pickupEta + 12} min window`,
          placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          currentStep: 1,
        };
        st.cart = null;
      });
      toast('order placed — see you at the counter');
      go('#/tracking');
      break;
    }
    case 'continue-to-cook': {
      const s = Store.get();
      go(`#/cook/${s.order ? s.order.recipeId : 'tuscan-pasta'}`);
      break;
    }
    case 'cancel-order': {
      if (confirm('cancel this order? the store has not packed it yet.')) {
        Store.update((s) => { s.order = null; });
        toast('order cancelled — nothing has been charged');
        go('#/orders');
      }
      break;
    }
    case 'edit-order': {
      toast('we texted the store — they’ll confirm any changes by SMS');
      break;
    }
    case 'copy-code': {
      const pill = document.getElementById('code-pill');
      const code = pill ? pill.textContent.trim() : '4821';
      const done = () => toast(`pickup code ${code} copied`);
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(done, done);
      else done();
      break;
    }
    case 'reorder': {
      Store.update((s) => {
        const r = recipeById('tuscan-pasta');
        s.cart = {
          recipeId: 'tuscan-pasta',
          portion: 4,
          missing: r.ingredients.filter((i) => i.missing).map((i) => i.id),
          storeId: 'greenmart',
          fulfilment: 'pickup',
        };
      });
      toast('order loaded — review and place it');
      go('#/place-order/tuscan-pasta');
      break;
    }

    /* ----- cook mode ----- */
    case 'timer-toggle': {
      const id = toggle.dataset.id;
      const r = recipeById(id);
      if (!r) return;
      const session = state.cookSession && state.cookSession.recipeId === id ? state.cookSession : { recipeId: id, step: 0, done: [] };
      const step = r.steps[session.step];
      if (!cookTimer.id || cookTimer.remaining === 0) {
        cookTimer.total = step.time * 60;
        cookTimer.remaining = step.time * 60;
      }
      if (cookTimer.running) {
        clearInterval(cookTimer.id);
        cookTimer.id = null;
        cookTimer.running = false;
      } else {
        cookTimer.running = true;
        cookTimer.id = setInterval(() => {
          cookTimer.remaining = Math.max(0, cookTimer.remaining - 1);
          if (cookTimer.remaining === 0) {
            clearInterval(cookTimer.id);
            cookTimer.id = null;
            cookTimer.running = false;
            beep();
            Store.update((s) => {
              const sess = s.cookSession && s.cookSession.recipeId === id ? s.cookSession : { recipeId: id, step: session.step, done: [] };
              if (!sess.done.includes(sess.step)) sess.done.push(sess.step);
              s.cookSession = sess;
            });
            toast('timer done — step marked complete');
            render();
            return;
          }
          renderTimer();
        }, 1000);
      }
      renderTimer();
      break;
    }
    case 'cook-next': {
      const id = toggle.dataset.id;
      const r = recipeById(id);
      if (!r) return;
      stopCookTimer();
      Store.update((s) => {
        const sess = s.cookSession && s.cookSession.recipeId === id ? s.cookSession : { recipeId: id, step: 0, done: [] };
        if (!sess.done.includes(sess.step)) sess.done.push(sess.step);
        if (sess.step < r.steps.length - 1) sess.step += 1;
        s.cookSession = sess;
      });
      render();
      break;
    }
    case 'cook-toggle-step': {
      const id = toggle.dataset.id;
      const step = Number(toggle.dataset.step);
      Store.update((s) => {
        const sess = s.cookSession && s.cookSession.recipeId === id ? s.cookSession : { recipeId: id, step: 0, done: [] };
        sess.done = sess.done.includes(step) ? sess.done.filter((x) => x !== step) : [...sess.done, step];
        s.cookSession = sess;
      });
      render();
      break;
    }
    case 'finish-cook': {
      const id = toggle.dataset.id;
      stopCookTimer();
      Store.update((s) => {
        const portion = (s.uiPortions && s.uiPortions[id]) || (s.order && s.order.recipeId === id ? s.order.portion : 4) || 4;
        const r = recipeById(id);
        if (!s.cookedAgain.includes(id)) s.cookedAgain.push(id);
        if (s.order) {
          s.orders = [
            {
              id: s.order.id,
              items: s.order.items.join(' + '),
              store: s.order.store,
              fulfilment: s.order.fulfilment,
              total: s.order.total,
              date: 'today',
            },
            ...s.orders,
          ];
          s.order = null;
        }
        s.cookSession = { recipeId: id, portion, done: r ? r.steps.map((_, i) => i) : [], step: 0 };
      });
      toast('nice cook — saved to cook again');
      go(`#/success/${id}`);
      break;
    }
    case 'rate': {
      const id = toggle.dataset.id;
      const stars = Number(toggle.dataset.stars);
      Store.update((s) => {
        s.ratings = { ...(s.ratings || {}), [id]: stars };
      });
      toggle.parentElement.querySelectorAll('.star').forEach((el, i) => {
        el.classList.toggle('on', i < stars);
        el.setAttribute('aria-checked', String(i + 1 === stars));
      });
      toast(`rated ${stars} star${stars > 1 ? 's' : ''} — thanks`);
      break;
    }
    case 'reset-demo': {
      if (confirm('reset all demo data back to the original sample?')) {
        stopCookTimer();
        Store.reset();
        location.hash = '#/welcome';
        render();
        toast('demo data reset');
      }
      break;
    }
  }
});

/* ---------- boot ---------- */
render();
