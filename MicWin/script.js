// ========================= Girare AI — script.js =========================
// Imports
import { aiModel }     from './girare-1.js';
import { girare15 }    from './girare-1.5.js';
import { girare2lite } from './girare-2-lite.js';

/* -----------------------------------------------------------------------
   Central model registry (switch by name only)
------------------------------------------------------------------------ */
const MODELS = {
  "Girare AI 1": aiModel,
  "Girare AI 1.5": girare15,
  "Girare AI 2 Lite": girare2lite,
};

// Robust aliases so HTML labels can vary slightly
const MODEL_ALIASES = {
  "girare ai 1":        "Girare AI 1",
  "girare ai 1.0":      "Girare AI 1",
  "girare ai 15":       "Girare AI 1.5",
  "girare ai 1.5":      "Girare AI 1.5",
  "girare ai 2":        "Girare AI 2 Lite",
  "girare ai 2 lite":   "Girare AI 2 Lite",
  "girare ai 2-lite":   "Girare AI 2 Lite",
  "girare ai 2–lite":   "Girare AI 2 Lite",
};
const normalizeKey = s => String(s||"").toLowerCase().replace(/[–-]/g,"-").replace(/\s+/g," ").trim();
function resolveModelName(raw) {
  const k = normalizeKey(raw);
  if (MODEL_ALIASES[k]) return MODEL_ALIASES[k];
  const direct = Object.keys(MODELS).find(m => normalizeKey(m) === k);
  return direct || null;
}

/* -----------------------------------------------------------------------
   DOM references
------------------------------------------------------------------------ */
const chatContainer     = document.getElementById('chat-container');
const userInput         = document.getElementById('user-input');
const sendBtn           = document.getElementById('send-btn');
const regenBtn          = document.getElementById('regen-btn');
const fileUpload        = document.getElementById('file-upload');

const darkModeToggle    = document.getElementById('dark-mode-toggle');
const sunIcon           = document.getElementById('sun-icon');
const moonIcon          = document.getElementById('moon-icon');
const settingsBtn       = document.getElementById('settings-btn');
const settingsMenu      = document.getElementById('settings-menu');
const clearHistoryBtn   = document.getElementById('clear-history-btn');

const historyContainer  = document.getElementById('history-container');
const sidebar           = document.getElementById('sidebar');
const sidebarBackdrop   = document.getElementById('sidebar-backdrop');

const welcomeScreen     = document.getElementById('welcome-screen');
const suggestions1      = document.getElementById('suggestions-girare1')  || document.getElementById('suggestions-micwin1');
const suggestions15     = document.getElementById('suggestions-girare15') || document.getElementById('suggestions-micwin15');
const selectedModelName = document.getElementById('selected-model-name');
const headerTitle       = document.getElementById('header-title');
const welcomeTitle      = document.getElementById('welcome-title');
const welcomeSubtitle   = document.getElementById('welcome-subtitle');

/* -----------------------------------------------------------------------
   State
------------------------------------------------------------------------ */
let currentModelName = "Girare AI 2 Lite";
let currentModel     = MODELS[currentModelName];
let lastUserPrompt   = null;
let lastAiWrapper    = null;
let lastAiBubble     = null;
let lastAiThinkingPanel = null;
let conversationHistory = []; // {role:"user"|"ai", content:string}
let regenCounter = 0;

// Sessions persisted in localStorage
let sessions = [];           // [{id,title,model,createdISO,updatedISO,messages:[{role,content,ts}]}]
let currentSessionId = null;

/* -----------------------------------------------------------------------
   Config / Debug
------------------------------------------------------------------------ */
const GIRARE_DEBUG = true;
const STORAGE_KEY  = 'girare_sessions_v1';

/* -----------------------------------------------------------------------
   Utilities
------------------------------------------------------------------------ */
const uid     = () => 's_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const nowISO  = () => new Date().toISOString();
const clamp   = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + '…' : (s || ''));

function saveSessions(){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); } catch {} }
function loadSessions(){ try { sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { sessions = []; } }
function getSessionById(id){ return sessions.find(s => s.id === id); }

/* -----------------------------------------------------------------------
   Safe invocation helpers
------------------------------------------------------------------------ */
function safeInvoke(fn, ctx, ...args) {
  if (typeof fn !== 'function') {
    GIRARE_DEBUG && console.warn('[Girare AI] safeInvoke: expected function');
    return { professionalResponse: "The model isn't ready for that action yet." };
  }
  try { return fn.call(ctx, ...args); }
  catch (err) {
    GIRARE_DEBUG && console.error('[Girare AI] Invocation error:', err);
    return { professionalResponse: "I ran into an internal error while thinking through that." };
  }
}
function selfTestModel(model) {
  try {
    if (!model || !model.skills) throw new Error('Model or skills missing');
    if (typeof model.skills.think !== 'function') throw new Error('think() not found');
    const probe = safeInvoke(model.skills.think, model, 'ping', model.knowledge, { context: '' });
    GIRARE_DEBUG && console.info('[Girare AI] self-test ok:', probe?.professionalResponse ?? probe);
  } catch (e) { console.error('[Girare AI] self-test failed:', e); }
}

/* -----------------------------------------------------------------------
   Sidebar drawer (mobile) + hamburger
------------------------------------------------------------------------ */
function ensureMenuButton() {
  if (!document.getElementById('menu-btn')) {
    const header = document.querySelector('header .max-w-6xl .flex.items-center.justify-between');
    if (header) {
      const left = header.firstElementChild;
      const btn = document.createElement('button');
      btn.id = 'menu-btn';
      btn.className = 'md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800';
      btn.title = 'Open sidebar';
      btn.innerHTML = '<span class="material-symbols-outlined">menu</span>';
      left?.insertBefore(btn, left.firstChild);
    }
  }
}
function bindMenuButtons() {
  document.querySelectorAll('#menu-btn,[data-menu-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const open = !sidebar?.classList.contains('translate-x-[-100%]');
      open ? closeSidebar() : openSidebar();
    });
  });
}
function openSidebar() {
  if (!sidebar || !sidebarBackdrop) return;
  sidebar.classList.remove('translate-x-[-100%]');
  sidebarBackdrop.classList.remove('pointer-events-none');
  sidebarBackdrop.classList.add('opacity-100');
  sidebarBackdrop.style.opacity = '1';
}
function closeSidebar() {
  if (!sidebar || !sidebarBackdrop) return;
  sidebar.classList.add('translate-x-[-100%]');
  sidebarBackdrop.classList.add('pointer-events-none');
  sidebarBackdrop.classList.remove('opacity-100');
  sidebarBackdrop.style.opacity = '0';
}
if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSidebar(); });

/* -----------------------------------------------------------------------
   Event listeners
------------------------------------------------------------------------ */
sendBtn && sendBtn.addEventListener('click', () => sendMessage());
if (userInput) {
  userInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }});
  userInput.addEventListener('focus', handleTypingOn);
  userInput.addEventListener('input', handleTypingOn);
  userInput.addEventListener('blur', handleTypingOffIfEmpty);
}
regenBtn && regenBtn.addEventListener('click', () => handleRegenerate());
fileUpload && fileUpload.addEventListener('change', handleFileUpload);
darkModeToggle && darkModeToggle.addEventListener('click', toggleDarkMode);
settingsBtn && settingsBtn.addEventListener('click', () => settingsMenu?.classList.toggle('hidden'));
clearHistoryBtn && clearHistoryBtn.addEventListener('click', handleClearHistory);

// Model switcher (robust to label variations)
document.querySelectorAll('[data-model]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const raw = el.dataset.model || el.textContent || "";
    const chosen = resolveModelName(raw);
    if (!chosen) {
      console.warn("[Girare AI] Unknown model label:", raw, "— valid:", Object.keys(MODELS));
      return;
    }
    switchModel(chosen);
    closeSidebar();
  });
});

/* -----------------------------------------------------------------------
   Model switching via registry
------------------------------------------------------------------------ */
function switchModel(chosen) {
  if (!MODELS[chosen]) { console.warn('[Girare AI] Unknown model:', chosen); return; }

  currentModel = MODELS[chosen];
  currentModelName = chosen;

  // Reset gradient classes
  document.body.classList.remove('girare15-bg', 'girare2lite-bg', 'typing-bg');

  if (chosen === "Girare AI 2 Lite") {
    document.body.classList.add('girare2lite-bg');
    suggestions1?.classList.add('hidden'); suggestions15?.classList.add('hidden');
    headerTitle && (headerTitle.textContent = "Girare AI 2-Lite");
    welcomeTitle && (welcomeTitle.textContent = "Welcome to Girare AI 2-Lite");
    welcomeSubtitle && (welcomeSubtitle.textContent = "Expanded knowledge, deeper thinking, and advanced coding.");
  } else if (chosen === "Girare AI 1.5") {
    document.body.classList.add('girare15-bg');
    suggestions1?.classList.add('hidden'); suggestions15?.classList.remove('hidden');
    headerTitle && (headerTitle.textContent = "Girare AI 1.5");
    welcomeTitle && (welcomeTitle.textContent = "Welcome to Girare AI 1.5");
    welcomeSubtitle && (welcomeSubtitle.textContent = "Learns from you, reasons deeper, and codes.");
  } else { // 1.0
    suggestions1?.classList.remove('hidden'); suggestions15?.classList.add('hidden');
    headerTitle && (headerTitle.textContent = "Girare AI 1");
    welcomeTitle && (welcomeTitle.textContent = "How can I help you today?");
    welcomeSubtitle && (welcomeSubtitle.textContent = "Ask me anything, or try a quick suggestion.");
  }

  selectedModelName && (selectedModelName.textContent = chosen);

  // New session on model switch
  newSession({ model: chosen });
  initializeChat();
  selfTestModel(currentModel);
}

/* -----------------------------------------------------------------------
   Typing gradient toggle (only for gradient themes)
------------------------------------------------------------------------ */
function hasGradientTheme() {
  return document.body.classList.contains('girare15-bg') || document.body.classList.contains('girare2lite-bg');
}
function handleTypingOn()  { if (hasGradientTheme()) document.body.classList.add('typing-bg'); }
function handleTypingOffIfEmpty() {
  if (!userInput) return;
  if ((userInput.value || '').trim().length === 0) document.body.classList.remove('typing-bg');
}

/* -----------------------------------------------------------------------
   Chat sessions (real logs in sidebar)
------------------------------------------------------------------------ */
function newSession(opts = {}) {
  const id = uid();
  const s = {
    id,
    title: opts.title || "New chat",
    model: opts.model || currentModelName,
    createdISO: nowISO(),
    updatedISO: nowISO(),
    messages: []
  };
  sessions.unshift(s);
  currentSessionId = id;
  conversationHistory = [];
  chatContainer && (chatContainer.innerHTML = '');
  saveSessions();
  renderSidebarSessions();
}
function deleteSession(id) {
  const i = sessions.findIndex(s => s.id === id);
  if (i >= 0) sessions.splice(i, 1);
  if (currentSessionId === id) currentSessionId = sessions[0]?.id || null;
  saveSessions(); renderSidebarSessions();
  if (currentSessionId) openSession(currentSessionId); else { newSession(); initializeChat(); }
}
function renameSession(id, title) {
  const s = getSessionById(id); if (!s) return;
  s.title = clamp(title, 80) || s.title; s.updatedISO = nowISO();
  saveSessions(); renderSidebarSessions();
}
function openSession(id) {
  const s = getSessionById(id); if (!s) return;
  currentSessionId = id;
  conversationHistory = [...s.messages];
  chatContainer && (chatContainer.innerHTML = '');
  for (const m of conversationHistory) {
    displayMessage({ professionalResponse: m.content }, m.role, { markAsLastAi: false });
  }
  chatContainer && (chatContainer.scrollTop = chatContainer.scrollHeight);
}
function appendToCurrentSession(role, content) {
  const s = getSessionById(currentSessionId); if (!s) return;
  s.messages.push({ role, content, ts: nowISO() });
  s.updatedISO = nowISO();
  saveSessions();
  if (s.title === 'New chat') {
    const seed = role === 'user' ? content : s.messages.find(m => m.role === 'user')?.content;
    if (seed) { s.title = clamp(seed.replace(/\s+/g, ' ').trim(), 60); saveSessions(); renderSidebarSessions(); }
  }
}
function renderSidebarSessions() {
  if (!historyContainer) return;
  if (!sessions.length) {
    historyContainer.innerHTML = '<div class="p-3 text-sm text-gray-400 dark:text-gray-500 text-center">No history yet.</div>';
    return;
  }
  const frag = document.createDocumentFragment();

  // New chat button
  const newBtn = document.createElement('button');
  newBtn.className = 'w-full mb-2 px-3 py-2 rounded-lg bg-slate-900 text-white dark:bg-slate-700 hover:opacity-90 text-sm';
  newBtn.textContent = 'New Chat';
  newBtn.addEventListener('click', () => { newSession({ model: currentModelName }); initializeChat(); closeSidebar(); });
  frag.appendChild(newBtn);

  sessions.forEach(s => {
    const card = document.createElement('div');
    card.className = `group rounded-lg p-2 mb-2 cursor-pointer border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 ${s.id===currentSessionId?'bg-slate-100 dark:bg-slate-800/60':'bg-white dark:bg-slate-900'}`;
    const row  = document.createElement('div');
    row.className = 'flex items-center justify-between gap-2';
    const title = document.createElement('div');
    title.className = 'text-sm font-medium';
    title.textContent = s.title || 'Untitled';

    const actions = document.createElement('div');
    actions.className = 'flex items-center gap-1 opacity-60 group-hover:opacity-100';
    const btnRename = document.createElement('button');
    btnRename.className = 'text-xs px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700';
    btnRename.textContent = 'Rename';
    btnRename.addEventListener('click', (e) => { e.stopPropagation(); const t = prompt('Rename chat', s.title||''); if (t!==null) renameSession(s.id, t); });
    const btnDelete = document.createElement('button');
    btnDelete.className = 'text-xs px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400';
    btnDelete.textContent = 'Delete';
    btnDelete.addEventListener('click', (e) => { e.stopPropagation(); if (confirm('Delete this chat?')) deleteSession(s.id); });

    actions.appendChild(btnRename); actions.appendChild(btnDelete);
    const meta = document.createElement('div');
    meta.className = 'text-[11px] text-slate-500 dark:text-slate-400 mt-1';
    meta.textContent = `${s.model} • ${new Date(s.updatedISO||s.createdISO).toLocaleString()}`;

    row.appendChild(title); row.appendChild(actions);
    card.appendChild(row); card.appendChild(meta);
    card.addEventListener('click', () => { openSession(s.id); closeSidebar(); });
    frag.appendChild(card);
  });

  historyContainer.innerHTML = ''; historyContainer.appendChild(frag);
}

/* -----------------------------------------------------------------------
   UI helpers
------------------------------------------------------------------------ */
function hideWelcome(){ welcomeScreen && (welcomeScreen.style.display='none'); }

// Clear chat within current session
let clearConfirmTO;
function handleClearHistory() {
  if (!clearHistoryBtn) return;
  if (!clearHistoryBtn.dataset.confirming) {
    clearHistoryBtn.textContent = 'Are you sure?';
    clearHistoryBtn.classList.add('bg-red-500','text-white','dark:bg-red-600');
    clearHistoryBtn.dataset.confirming = 'true';
    clearConfirmTO = setTimeout(resetClearButton, 3000);
  } else {
    chatContainer && (chatContainer.innerHTML = '');
    lastAiWrapper = lastAiBubble = lastAiThinkingPanel = null;
    conversationHistory = [];
    const s = getSessionById(currentSessionId);
    if (s) { s.messages = []; s.updatedISO = nowISO(); saveSessions(); renderSidebarSessions(); }
    displayMessage({ professionalResponse: "Chat history has been cleared." }, 'ai', { markAsLastAi: false });
    resetClearButton();
  }
}
function resetClearButton(){
  if (!clearHistoryBtn) return;
  clearTimeout(clearConfirmTO);
  clearHistoryBtn.textContent = 'Clear History';
  clearHistoryBtn.classList.remove('bg-red-500','text-white','dark:bg-red-600');
  delete clearHistoryBtn.dataset.confirming;
}

/* -----------------------------------------------------------------------
   Dark mode
------------------------------------------------------------------------ */
function toggleDarkMode(){
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcons(isDark);
}
function updateThemeIcons(isDark){
  sunIcon && sunIcon.classList.toggle('hidden', isDark);
  moonIcon && moonIcon.classList.toggle('hidden', !isDark);
}

/* -----------------------------------------------------------------------
   2-Lite Thinking Bar (shows before responding)
------------------------------------------------------------------------ */
let currentThinkingBar = null;
function isTwoLite() {
  return (currentModelName || '').toLowerCase() === 'girare ai 2 lite';
}
function makeThinkingBar() {
  const wrap = document.createElement('div');
  wrap.className = 'w-full max-w-full sm:max-w-2xl bg-slate-100 dark:bg-slate-800 rounded-xl p-3 flex items-center gap-3 shadow';

  const dot = document.createElement('div');
  dot.className = 'w-3 h-3 rounded-full bg-blue-500 animate-pulse';
  dot.setAttribute('aria-hidden', 'true');

  const rail = document.createElement('div');
  rail.className = 'flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden';
  const fill = document.createElement('div');
  fill.className = 'h-full w-0 bg-blue-500 transition-all duration-200';
  rail.appendChild(fill);

  const label = document.createElement('div');
  label.className = 'text-xs text-slate-500 dark:text-slate-400 select-none';
  label.textContent = 'Thinking…';

  wrap.appendChild(dot);
  wrap.appendChild(rail);
  wrap.appendChild(label);

  return { wrap, dot, fill, label };
}
function showThinkingBar() {
  if (!chatContainer) return null;
  const { wrap, dot, fill, label } = makeThinkingBar();
  const shell = document.createElement('div');
  shell.className = 'flex flex-col mb-4 items-start';
  shell.appendChild(wrap);
  chatContainer.appendChild(shell);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  currentThinkingBar = { shell, wrap, dot, fill, label, timer: null };

  let p = 0;
  currentThinkingBar.timer = setInterval(() => {
    // ease toward ~85% max while waiting
    p = Math.min(85, p + Math.max(1, 4 - Math.floor(p / 25)));
    currentThinkingBar.fill.style.width = p + '%';
  }, 180);

  return currentThinkingBar;
}
function completeThinkingBar(success = true) {
  if (!currentThinkingBar) return;
  const { shell, fill, label, timer } = currentThinkingBar;
  clearInterval(timer);
  if (success) {
    fill.style.width = '100%';
  } else {
    fill.style.width = '100%';
    fill.classList.remove('bg-blue-500');
    fill.classList.add('bg-red-500');
    label.textContent = 'Thinking failed';
  }
  setTimeout(() => {
    shell.remove();
    currentThinkingBar = null;
  }, 350);
}
async function respondWithThinkingBar(promptText) {
  const useBar = isTwoLite();
  if (useBar) showThinkingBar();

  const realisticDelayMs = (() => {
    const len = (promptText || '').length;
    // 0.9s to 2.8s window proportional to prompt length
    return Math.min(2800, Math.max(900, 12 * len));
  })();

  let res;
  try {
    const started = performance.now();
    res = getAIResponse(promptText); // model call (sync in this project)
    const elapsed = performance.now() - started;
    const remaining = Math.max(0, realisticDelayMs - elapsed);
    if (remaining > 0) await new Promise(r => setTimeout(r, remaining));
    completeThinkingBar(true);
  } catch (e) {
    console.error('[Girare AI] respondWithThinkingBar error:', e);
    completeThinkingBar(false);
    res = { professionalResponse: "I ran into an internal error while thinking through that." };
  }
  return res;
}

/* -----------------------------------------------------------------------
   Core chat
------------------------------------------------------------------------ */
function initializeChat() {
  if (!currentSessionId) newSession({ model: currentModelName });
  const starter = currentModel.starters[Math.floor(Math.random() * currentModel.starters.length)];
  displayMessage({ professionalResponse: starter }, 'ai', { markAsLastAi: false });
  conversationHistory.push({ role: "ai", content: starter });
  appendToCurrentSession('ai', starter);
  // reflect model in header chip on boot
  selectedModelName && (selectedModelName.textContent = currentModelName);
}
const saltedPrompt = base => { regenCounter += 1; return `${base} ::regen${regenCounter}`; };

async function sendMessage(){
  const messageText = (userInput?.value || '').trim();
  if (!messageText) return;

  hideWelcome();
  lastUserPrompt = messageText;

  displayMessage({ professionalResponse: messageText }, 'user');
  conversationHistory.push({ role:"user", content:messageText });
  appendToCurrentSession('user', messageText);
  userInput && (userInput.value = '');
  handleTypingOffIfEmpty();

  // Use thinking bar for 2-Lite
  const aiResponse = await respondWithThinkingBar(messageText);

  displayMessage(aiResponse, 'ai', { markAsLastAi: true });
  conversationHistory.push({ role:"ai", content: aiResponse.professionalResponse });
  appendToCurrentSession('ai', aiResponse.professionalResponse);
}

// Regenerate replaces last AI only (no extra bubble)
function replaceLastAiInHistory(newText){
  for (let i=conversationHistory.length-1; i>=0; i--) {
    if (conversationHistory[i].role === 'ai') { conversationHistory[i].content = newText; return true; }
  }
  return false;
}
function replaceLastAiInSession(newText){
  const s = getSessionById(currentSessionId); if (!s) return false;
  for (let i=s.messages.length-1; i>=0; i--) {
    if (s.messages[i].role === 'ai') { s.messages[i].content = newText; s.updatedISO = nowISO(); saveSessions(); renderSidebarSessions(); return true; }
  }
  return false;
}
async function handleRegenerate(){
  if (!lastUserPrompt) {
    displayMessage({ professionalResponse: "Nothing to regenerate yet — send a message first." }, 'ai', { markAsLastAi: false });
    return;
  }
  const rethoughtPrompt = saltedPrompt(lastUserPrompt);

  // Use thinking bar for 2-Lite
  const aiResponse = await respondWithThinkingBar(rethoughtPrompt);

  if (lastAiBubble && lastAiWrapper) {
    lastAiBubble.textContent = '';
    lastAiThinkingPanel && lastAiThinkingPanel.remove();
    upsertRegeneratedChip(lastAiWrapper);
    renderAiTextOrCode(lastAiBubble, aiResponse.professionalResponse);
    if (aiResponse.thinkingProcess) {
      const { thinkButton, thinkingPanel } = buildThinkingBlock(aiResponse.thinkingProcess);
      lastAiWrapper.appendChild(thinkButton); lastAiWrapper.appendChild(thinkingPanel);
      lastAiThinkingPanel = thinkingPanel;
    }
    if (!replaceLastAiInHistory(aiResponse.professionalResponse)) conversationHistory.push({ role:"ai", content: aiResponse.professionalResponse });
    if (!replaceLastAiInSession(aiResponse.professionalResponse)) appendToCurrentSession('ai', aiResponse.professionalResponse);
    chatContainer && (chatContainer.scrollTop = chatContainer.scrollHeight);
  } else {
    displayMessage(aiResponse, 'ai', { markAsLastAi: true, regenerated: true });
    conversationHistory.push({ role:"ai", content: aiResponse.professionalResponse });
    appendToCurrentSession('ai', aiResponse.professionalResponse);
  }
}

/* -----------------------------------------------------------------------
   Rendering
------------------------------------------------------------------------ */
function streamResponse(bubble, text){
  const words = String(text||'').split(' ');
  bubble.textContent = '';
  let i=0; (function tick(){
    if (i<words.length){
      const w = document.createElement('span');
      w.className = 'word-fade-in'; w.textContent = words[i];
      bubble.appendChild(w);
      if (i<words.length-1) bubble.appendChild(document.createTextNode(' '));
      chatContainer && (chatContainer.scrollTop = chatContainer.scrollHeight);
      i++; setTimeout(tick, 35);
    }
  })();
}
function buildThinkingBlock(thinkingText){
  const btn = document.createElement('button');
  btn.innerHTML = `<span class="material-symbols-outlined text-xs mr-1">psychology</span><span data-think-label>Show Thinking</span>`;
  btn.className = 'text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center hover:text-gray-600 dark:hover:text-gray-400';

  const pre = document.createElement('pre');
  pre.textContent = thinkingText;
  pre.className = 'thinking-panel text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-md mt-2 w-full font-mono whitespace-pre-wrap hidden';

  btn.onclick = () => {
    const label = btn.querySelector('[data-think-label]');
    const hidden = pre.classList.toggle('hidden');
    label.textContent = hidden ? 'Show Thinking' : 'Hide Thinking';
  };
  return { thinkButton: btn, thinkingPanel: pre };
}
function upsertRegeneratedChip(wrapper){
  let chip = wrapper.querySelector('[data-regenerated-chip]');
  if (!chip){
    chip = document.createElement('span');
    chip.dataset.regeneratedChip = 'true';
    chip.className = 'mt-1 self-start text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
    chip.textContent = 'Regenerated';
    wrapper.appendChild(chip);
  }
}
function displayMessage(response, sender, { markAsLastAi = sender==='ai', regenerated = false } = {}){
  const wrap = document.createElement('div');
  wrap.className = `flex flex-col mb-4 ${sender==='user'?'items-end':'items-start'}`;

  const bubble = document.createElement('div');
  bubble.className = `rounded-xl px-4 py-2 max-w-full sm:max-w-2xl break-words ${
    sender==='user' ? 'bg-blue-600 text-white shadow'
                     : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow'
  }`;
  wrap.appendChild(bubble);

  if (sender==='ai'){
    renderAiTextOrCode(bubble, response.professionalResponse);
    if (response.thinkingProcess){
      const { thinkButton, thinkingPanel } = buildThinkingBlock(response.thinkingProcess);
      wrap.appendChild(thinkButton); wrap.appendChild(thinkingPanel);
      if (markAsLastAi) lastAiThinkingPanel = thinkingPanel;
    }
    if (regenerated) upsertRegeneratedChip(wrap);
  } else bubble.textContent = response.professionalResponse;

  chatContainer && chatContainer.appendChild(wrap);
  chatContainer && (chatContainer.scrollTop = chatContainer.scrollHeight);

  if (sender==='ai' && markAsLastAi){ lastAiWrapper = wrap; lastAiBubble = bubble; }
}

/* -----------------------------------------------------------------------
   Text vs Code rendering (columns + fade-in)
------------------------------------------------------------------------ */
function splitTextAndCodeBlocks(text){
  const re = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks = []; let last = 0, m;
  while ((m = re.exec(text)) !== null){
    if (m.index > last) blocks.push({ type:'text', text:text.slice(last, m.index) });
    blocks.push({ type:'code', lang:(m[1]||'plaintext').toLowerCase(), code:m[2].replace(/\n+$/, '') });
    last = re.lastIndex;
  }
  if (last < text.length) blocks.push({ type:'text', text:text.slice(last) });
  return blocks;
}
function fadeInStagger(el, i=0, d=60){ setTimeout(()=>{ el.classList.remove('opacity-0','translate-y-1'); }, d*i); }
function mapLangToHljs(lang){
  const l = (lang||'').toLowerCase();
  if (['js','javascript','node','node.js','nodejs'].includes(l)) return 'javascript';
  if (l==='html' || l==='xml') return 'xml';
  if (l==='css') return 'css';
  if (l==='json') return 'json';
  if (l==='ts' || l==='typescript') return 'typescript';
  if (l==='bash' || l==='sh') return 'bash';
  if (l==='jsx' || l==='react') return 'jsx';
  if (l==='python') return 'python';
  if (l==='java') return 'java';
  if (l==='rust') return 'rust';
  return 'plaintext';
}
function buildCodeBlock(lang, code){
  const box = document.createElement('div');
  box.className = 'rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-0';

  const header = document.createElement('div');
  header.className = 'flex items-center justify-between px-3 py-2 text-xs bg-slate-200/70 dark:bg-slate-700/70';
  const left = document.createElement('div');
  left.className = 'font-mono opacity-80'; left.textContent = (lang||'PLAINTEXT').toUpperCase();
  const btns = document.createElement('div'); btns.className = 'flex items-center gap-2';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'px-2 py-1 rounded bg-slate-900 text-white dark:bg-slate-900 hover:opacity-90';
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(code); copyBtn.textContent = 'Copied!'; setTimeout(()=>copyBtn.textContent='Copy',1200); }
    catch { copyBtn.textContent = 'Failed';  setTimeout(()=>copyBtn.textContent='Copy',1200); }
  });

  const pasteBtn = document.createElement('button');
  pasteBtn.className = 'px-2 py-1 rounded bg-slate-900 text-white dark:bg-slate-900 hover:opacity-90';
  pasteBtn.textContent = 'Paste';
  pasteBtn.addEventListener('click', () => {
    if (!userInput) return;
    userInput.value = code; userInput.focus();
    userInput.selectionStart = userInput.selectionEnd = userInput.value.length;
  });

  btns.appendChild(copyBtn); btns.appendChild(pasteBtn);
  header.appendChild(left); header.appendChild(btns);

  const pre = document.createElement('pre'); pre.className = 'overflow-x-auto m-0 p-3';
  const codeEl = document.createElement('code'); codeEl.className = `language-${mapLangToHljs(lang)}`; codeEl.textContent = code;
  pre.appendChild(codeEl);

  box.appendChild(header); box.appendChild(pre);
  if (window.hljs && typeof hljs.highlightElement === 'function'){ try{ hljs.highlightElement(codeEl); }catch{} }
  return box;
}
function renderAiTextOrCode(bubble, text){
  const blocks = splitTextAndCodeBlocks(String(text||''));
  const hasCode = blocks.some(b => b.type==='code');
  if (!hasCode){ streamResponse(bubble, text); return; }

  bubble.textContent = '';
  blocks.filter(b => b.type==='text' && b.text.trim()).forEach((b,i) => {
    const p = document.createElement('p');
    p.className = 'mb-2 opacity-0 translate-y-1 transition-all duration-300';
    p.textContent = b.text.trim(); bubble.appendChild(p); fadeInStagger(p,i);
  });

  const codes = blocks.filter(b => b.type==='code');
  if (codes.length){
    const grid = document.createElement('div');
    grid.className = 'grid gap-3 mt-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    bubble.appendChild(grid);
    codes.forEach((b,i) => {
      const panel = buildCodeBlock(b.lang, b.code);
      panel.classList.add('opacity-0','translate-y-1','transition-all','duration-300');
      grid.appendChild(panel); fadeInStagger(panel, i);
    });
  }
}

/* -----------------------------------------------------------------------
   AI Response Logic
------------------------------------------------------------------------ */
function getAIResponse(input){
  const lower = String(input||'').toLowerCase();

  if (lower.startsWith('summarize:')){
    const content = input.substring(10).trim();
    if (currentModel?.skills?.summarize){
      const r = safeInvoke(currentModel.skills.summarize, currentModel, content);
      return typeof r === 'string' ? { professionalResponse:r } : r;
    }
    return { professionalResponse: "There's not enough text to summarize clearly." };
  }

  if (lower.startsWith('code:')){
    const [, lang, ...descParts] = input.split(':');
    const desc = descParts.join(':').trim();
    if (currentModel?.skills?.code){
      const r = safeInvoke(currentModel.skills.code, currentModel, (lang||'').trim(), desc);
      return typeof r === 'string' ? { professionalResponse:r } : r;
    }
    return { professionalResponse: "This model does not support coding." };
  }

  const context = conversationHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n');
  if (currentModel?.skills?.think){
    const r = safeInvoke(currentModel.skills.think, currentModel, input, currentModel.knowledge, { context });
    return typeof r === 'string' ? { professionalResponse:r } : r;
  }
  return { professionalResponse: "I can help with topics I know, or you can teach me with: learn: topic: notes" };
}

/* -----------------------------------------------------------------------
   File upload (merge knowledge/skills)
------------------------------------------------------------------------ */
function handleFileUpload(e){
  const file = e.target.files[0]; if (!file) return;
  if (file.type!=='application/json'){ displayMessage({professionalResponse:"Error: Please upload a valid JSON file."},'ai'); return; }
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.knowledge) Object.assign(currentModel.knowledge, data.knowledge);
      if (data.skills)    Object.assign(currentModel.skills, data.skills);
      if (Array.isArray(data.starters)) currentModel.starters.push(...data.starters);
      displayMessage({ professionalResponse:`Successfully imported new knowledge into ${currentModel.name}!` }, 'ai');
    } catch { displayMessage({ professionalResponse:"Error: Invalid JSON file." }, 'ai'); }
  };
  reader.readAsText(file);
}

/* -----------------------------------------------------------------------
   Boot
------------------------------------------------------------------------ */
function init(){
  updateThemeIcons(document.documentElement.classList.contains('dark'));
  ensureMenuButton(); bindMenuButtons();
  loadSessions(); renderSidebarSessions();
  if (!sessions.length) newSession({ model: currentModelName });
  initializeChat();
  selfTestModel(currentModel);
  // Sanitize any legacy "MicWin" text nodes to "Girare AI"
  sanitizeLegacyNames();
}
init();

/* -----------------------------------------------------------------------
   Safety: rename any legacy "MicWin" to "Girare AI"
------------------------------------------------------------------------ */
function sanitizeLegacyNames(){
  document.querySelectorAll('*').forEach(node=>{
    node.childNodes && node.childNodes.forEach(n=>{
      if (n.nodeType===Node.TEXT_NODE && /MicWin/gi.test(n.nodeValue)){
        n.nodeValue = n.nodeValue.replace(/MicWin/gi, 'Girare AI');
      }
    });
  });
}
