// KitchenCoach — state (localStorage-backed, demo-friendly)
import { SEED } from './data.js';

const KEY = 'kitchencoach-state';

const defaultState = () => ({
  onboarded: false,
  quiz: { skill: null, restrictions: [], diets: [], cuisines: [] },
  filters: { cuisine: 'all', diet: 'all', meal: 'all', skill: 'all', search: '' },
  prefs: { cuisines: [...SEED.profile.cuisines.split(',').map(s => s.trim())], diets: ['vegetarian'] },
  saved: [...SEED.saved],
  liked: [...SEED.liked],
  cookedAgain: [...SEED.cookedAgain],
  disliked: [...SEED.disliked],
  ratings: { 'tuscan-pasta': 5, 'chicken-bowl': 5 },
  cart: null, // { recipeId, portion, missing: string[], storeId, fulfilment }
  order: SEED.currentOrder ? { ...SEED.currentOrder } : null, // active order object (seeded with #1042)
  orders: [...SEED.pastOrders],
  cookSession: null, // { recipeId, step, done: [stepIndex], checked: [ingredientIds] }
});

const state = { data: null };

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const def = defaultState();
      state.data = { ...def, ...parsed, filters: { ...def.filters, ...(parsed.filters || {}) }, quiz: { ...def.quiz, ...(parsed.quiz || {}) } };
      return state.data;
    }
  } catch (e) {
    console.warn('state reset', e);
  }
  state.data = defaultState();
  return state.data;
}

export const Store = {
  init() { if (!state.data) load(); },
  get() { if (!state.data) load(); return state.data; },
  update(fn) { if (!state.data) load(); fn(state.data); this.save(); return state.data; },
  save() { localStorage.setItem(KEY, JSON.stringify(state.data)); },
  reset() { localStorage.removeItem(KEY); state.data = null; return this.init(); },
};

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const formatPrice = (n) => `$${Number(n).toFixed(2)}`;
export const uid = () => `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function toast(msg) {
  let el = $('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2600);
}
