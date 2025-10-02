// ========================= Girare AI – script.js =========================
// Full integration of all model features with proper message display

// -----------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------
import { aiModel }     from './girare-1.js';
import { girare15 }    from './girare-1.5.js';
import { girare2lite } from './girare-2-lite.js';
import { girare2 }     from './Girare-2.js';

// -----------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------
const CONFIG = {
  STORAGE_KEY: 'girare_sessions_v1',
  DEBUG: true,
  CLEAR_CONFIRM_TIMEOUT: 3000,
  MAX_HISTORY_CONTEXT: 8
};

// -----------------------------------------------------------------------
// Model Registry
// -----------------------------------------------------------------------
const MODELS = {
  "Girare AI 1": aiModel,
  "Girare AI 1.5": girare15,
  "Girare AI 2 Lite": girare2lite,
  "Girare AI 2": girare2
};

const MODEL_ALIASES = {
  "girare ai 1": "Girare AI 1", "girare ai 1.0": "Girare AI 1",
  "girare ai 15": "Girare AI 1.5", "girare ai 1.5": "Girare AI 1.5",
  "girare ai 2 lite": "Girare AI 2 Lite", "girare ai 2-lite": "Girare AI 2 Lite",
  "girare ai 2": "Girare AI 2", "girare ai 2.5+": "Girare AI 2"
};

// -----------------------------------------------------------------------
// State
// -----------------------------------------------------------------------
let currentModelName    = "Girare AI 2";
let currentModel        = MODELS[currentModelName];
let lastUserPrompt      = null;
let lastAiWrapper       = null;
let lastAiBubble        = null;
let conversationHistory = [];
let regenCounter        = 0;
let sessions            = [];
let currentSessionId    = null;
let isThinking          = false;

// -----------------------------------------------------------------------
// DOM References
// -----------------------------------------------------------------------
const chatContainer     = document.getElementById('chat-container');
const userInput         = document.getElementById('user-input');
const sendBtn           = document.getElementById('send-btn');
const regenBtn          = document.getElementById('regen-btn');
const historyContainer  = document.getElementById('history-container');
const sidebar           = document.getElementById('sidebar');
const sidebarBackdrop   = document.getElementById('sidebar-backdrop');
const welcomeScreen     = document.getElementById('welcome-screen');
const selectedModelName = document.getElementById('selected-model-name');
const clearHistoryBtn   = document.getElementById('clear-history-btn');
const newChatBtn        = document.getElementById('new-chat-btn');
const menuBtn           = document.getElementById('menu-btn');
const modelTrigger      = document.getElementById('model-trigger');
const modelMenu         = document.getElementById('model-menu');
const darkModeToggle    = document.getElementById('dark-mode-toggle-btn');
const settingsBtn       = document.getElementById('settings-btn');
const settingsDropdown  = document.getElementById('settings-dropdown');
const settingsChevron   = document.getElementById('settings-chevron');

// -----------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------
function uid() { return 's_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
function nowISO() { return new Date().toISOString(); }
function clamp(s, n) { return !s ? '' : (s.length > n ? s.slice(0, n - 1) + '…' : s); }
function normalizeKey(s) { return String(s || "").toLowerCase().replace(/[—-]/g, "-").replace(/\s+/g, " ").trim(); }
function resolveModelName(raw) {
  const k = normalizeKey(raw);
  if (MODEL_ALIASES[k]) return MODEL_ALIASES[k];
  return Object.keys(MODELS).find(m => normalizeKey(m) === k) || null;
}
function safeInvoke(fn, ctx, ...args){
  if (typeof fn !== 'function'){
    CONFIG.DEBUG && console.warn('[Girare AI] safeInvoke: expected function');
    return { professionalResponse: "The model isn't ready for that action yet." };
  }
  try { 
    return fn.call(ctx, ...args); 
  } catch(err) {
    CONFIG.DEBUG && console.error('[Girare AI] Invocation error:', err);
    return { professionalResponse: "I ran into an internal error while thinking through that." };
  }
}
// -----------------------------------------------------------------------
// Storage & Session Management
// -----------------------------------------------------------------------
function saveSessions() { try { localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(sessions)); } catch (e) { console.error('[Storage] Save failed:', e); } }
function loadSessions() { try { sessions = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]'); } catch { sessions = []; } }
function getSessionById(id) { return sessions.find(s => s.id === id); }

function newSession(opts = {}) {
  const id = uid();
  const s = { id, title: opts.title || 'New Chat', model: opts.model || currentModelName, createdISO: nowISO(), updatedISO: nowISO(), messages: [] };
  sessions.unshift(s);
  currentSessionId = id;
  conversationHistory = [];
  if (chatContainer) chatContainer.innerHTML = '';
  if (welcomeScreen) welcomeScreen.style.display = 'block';
  saveSessions();
  renderSidebarSessions();
}

function deleteSession(id) {
  const i = sessions.findIndex(s => s.id === id);
  if (i < 0) return;
  sessions.splice(i, 1);
  if (currentSessionId === id) {
    currentSessionId = sessions[0]?.id || null;
    if (currentSessionId) {
      openSession(currentSessionId);
    } else {
      newSession({ model: currentModelName });
      initializeChat();
    }
  }
  saveSessions();
  renderSidebarSessions();
}

function openSession(id) {
  const s = getSessionById(id);
  if (!s) return;
  currentSessionId = id;
  currentModelName = s.model;
  currentModel = MODELS[s.model];
  if (selectedModelName) selectedModelName.textContent = currentModelName;
  conversationHistory = [...s.messages];
  if (chatContainer) {
    chatContainer.innerHTML = '';
    if (welcomeScreen && s.messages.length > 0) hideWelcome();
  }
  s.messages.forEach(m => {
    let professionalResponse = m.content;
    // The enrichResponse is now part of the model's think process, 
    // but we need to re-apply it when loading from history.
    if (s.model === "Girare AI 2" && m.role === 'ai') {
      professionalResponse = girare2.skills.enrichResponse(m.content);
    }
    displayMessage({ professionalResponse: professionalResponse, rawResponse: m.content }, m.role, { markAsLastAi: false });
  });
  if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  renderSidebarSessions();
}

function appendToCurrentSession(role, content) {
    const s = getSessionById(currentSessionId);
    if (!s) return;
    // Store the raw, un-enriched content
    const cleanContent = content.replace(/\[([^|]+)\|([^|]+)\|([^\]]+)\]/g, '$1');
    s.messages.push({ role, content: cleanContent, ts: nowISO() });
    s.updatedISO = nowISO();
    if (s.title === 'New Chat' && role === 'user' && s.messages.length === 1) {
        s.title = clamp(content, 40);
        renderSidebarSessions();
    }
    saveSessions();
}

function renderSidebarSessions() {
  if (!historyContainer) return;
  if (!sessions.length) {
    historyContainer.innerHTML = '<div class="p-3 text-sm text-text-secondary text-center">No history yet.</div>';
    return;
  }
  const frag = document.createDocumentFragment();
  sessions.forEach(s => {
    const card = document.createElement('div');
    card.className = `group rounded-lg p-3 mb-1 cursor-pointer flex justify-between items-center transition-colors ${s.id === currentSessionId ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'}`;
    const title = document.createElement('div');
    title.className = 'text-sm font-medium truncate pr-2';
    title.textContent = s.title || 'Untitled';
    const actions = document.createElement('div');
    actions.className = 'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity';
    const btnDelete = document.createElement('button');
    btnDelete.className = 'w-6 h-6 grid place-items-center rounded hover:bg-red-500/10 text-red-500';
    btnDelete.innerHTML = '<span class="material-symbols-outlined text-sm">delete</span>';
    btnDelete.onclick = (e) => { e.stopPropagation(); deleteSession(s.id); };
    actions.appendChild(btnDelete);
    card.append(title, actions);
    card.onclick = () => { if (currentSessionId !== s.id) openSession(s.id); closeSidebar(); };
    frag.appendChild(card);
  });
  historyContainer.innerHTML = '';
  historyContainer.appendChild(frag);
}
// -----------------------------------------------------------------------
// Sidebar & UI
// -----------------------------------------------------------------------
function openSidebar() { if (sidebar) sidebar.classList.remove('-translate-x-full'); if (sidebarBackdrop) sidebarBackdrop.classList.remove('pointer-events-none', 'opacity-0'); }
function closeSidebar() { if (sidebar) sidebar.classList.add('-translate-x-full'); if (sidebarBackdrop) sidebarBackdrop.classList.add('pointer-events-none', 'opacity-0'); }
function hideWelcome() { if (welcomeScreen) welcomeScreen.style.display = 'none'; }

// -----------------------------------------------------------------------
// Message Rendering
// -----------------------------------------------------------------------
function createDefinitionTooltip(word, definition, pronunciation) {
    const wrapper = document.createElement('span');
    wrapper.className = 'definition-tooltip-wrapper';
    wrapper.textContent = word;

    const tooltip = document.createElement('div');
    tooltip.className = 'definition-tooltip';
    tooltip.innerHTML = `
      <div class="font-bold text-base mb-1 capitalize">${word}</div>
      <div class="italic text-text-secondary mb-2">/${pronunciation}/</div>
      <div class="font-light">${definition}</div>
    `;
    
    wrapper.appendChild(tooltip);
    return wrapper;
}
function splitTextAndCodeBlocks(text){
  const re = /```(\w+)?\n([\s\S]*?)```/g; 
  const blocks=[]; 
  let last=0; 
  let m;
  
  while((m=re.exec(text))!==null){ 
    if(m.index>last) blocks.push({type:'text', text:text.slice(last, m.index)}); 
    blocks.push({type:'code', lang:(m[1]||'plaintext').toLowerCase(), code:m[2].replace(/\n+$/, '')}); 
    last = re.lastIndex; 
  }
  if(last<text.length) blocks.push({type:'text', text:text.slice(last)});
  return blocks;
}

function renderAiTextOrCode(bubble, text){
  const blocks = splitTextAndCodeBlocks(String(text||''));
  bubble.innerHTML = '';

  blocks.forEach((block)=>{
    if(block.type === 'text' && block.text.trim()){
      const p = document.createElement('p'); 
      p.className = 'mb-2 whitespace-pre-wrap';
      
      const content = block.text;
      const regex = /\[([^|]+)\|([^|]+)\|([^\]]+)\]/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          p.appendChild(document.createTextNode(content.substring(lastIndex, match.index)));
        }
        const [_, word, definition, pronunciation] = match;
        p.appendChild(createDefinitionTooltip(word, definition, pronunciation));
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < content.length) {
        p.appendChild(document.createTextNode(content.substring(lastIndex)));
      }
      
      if (p.hasChildNodes()) {
          bubble.appendChild(p);
      }

    } else if(block.type === 'code'){
      const panel=document.createElement('div'); 
      panel.className='rounded-md overflow-hidden bg-bg-tertiary border border-border-color mb-2';
      const header=document.createElement('div'); 
      header.className='flex items-center justify-between px-3 py-2 text-xs bg-bg-tertiary/50';
      const left=document.createElement('div'); 
      left.className='font-mono opacity-80'; 
      left.textContent=(block.lang||'PLAINTEXT').toUpperCase();
      const copyBtn=document.createElement('button'); 
      copyBtn.className='px-2 py-1 rounded bg-accent-primary text-accent-text hover:opacity-90 text-xs'; 
      copyBtn.textContent='Copy';
      copyBtn.onclick = async () => { 
          await navigator.clipboard.writeText(block.code); 
          copyBtn.textContent='Copied!'; 
          setTimeout(()=>copyBtn.textContent='Copy',1200);
      };
      header.append(left, copyBtn);
      const pre=document.createElement('pre'); 
      pre.className='overflow-x-auto m-0 p-3 text-sm';
      const codeEl=document.createElement('code'); 
      codeEl.className=`language-${block.lang}`; 
      codeEl.textContent=block.code; 
      pre.appendChild(codeEl);
      panel.append(header, pre); 
      bubble.appendChild(panel);
      if(typeof hljs !== 'undefined') hljs.highlightElement(codeEl);
    }
  });
}

function displayMessage(response, sender, options = {}) {
    const { markAsLastAi = (sender === 'ai') } = options;
    const wrap = document.createElement('div');
    wrap.className = `message-bubble flex flex-col mb-6 ${sender === 'user' ? 'items-end' : 'items-start'}`;
    const bubble = document.createElement('div');
    bubble.className = `rounded-xl px-4 py-3 max-w-full sm:max-w-2xl break-words shadow-sm ${sender === 'user' ? 'bg-accent-primary text-accent-text' : 'bg-bg-secondary text-text-primary'}`;
    wrap.appendChild(bubble);

    if (sender === 'ai') {
        renderAiTextOrCode(bubble, response.professionalResponse || response);
        if (response.thinkingProcess) {
            const btn = document.createElement('button');
            btn.innerHTML = '<span class="material-symbols-outlined text-xs mr-1">psychology</span><span>Show Thinking</span>';
            btn.className = 'text-xs text-text-secondary mt-2 flex items-center hover:text-text-primary';
            const pre = document.createElement('pre');
            pre.textContent = response.thinkingProcess;
            pre.className = 'thinking-panel text-xs bg-bg-tertiary p-3 rounded-md mt-2 w-full max-w-full overflow-x-auto font-mono whitespace-pre-wrap hidden';
            btn.onclick = () => { pre.classList.toggle('hidden'); };
            wrap.append(btn, pre);
        }
    } else {
        bubble.textContent = response.professionalResponse || response;
    }

    chatContainer.appendChild(wrap);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    if (sender === 'ai' && markAsLastAi) {
        lastAiWrapper = wrap;
        lastAiBubble = bubble;
    }
}

function showThinkingBar() { /* Placeholder - can be re-implemented if needed */ }
function completeThinkingBar(success = true) { /* Placeholder - can be re-implemented if needed */ }

// -----------------------------------------------------------------------
// AI Response & Message Sending
// -----------------------------------------------------------------------
function toggleThinkingState(isProcessing) { isThinking = isProcessing; sendBtn.disabled = isProcessing; regenBtn.disabled = isProcessing; }

async function getAIResponse(input, historyContext) {
    const context = historyContext.slice(-CONFIG.MAX_HISTORY_CONTEXT).map(m => `${m.role}: ${m.content}`).join('\n');
    if (currentModel?.skills?.think) {
        try {
            const result = await currentModel.skills.think(input, currentModel.knowledge, { context, history: historyContext });
            // The model is now responsible for its own response format (e.g., enriching).
            return typeof result === 'string' ? { professionalResponse: result, rawResponse: result } : result;
        } catch (err) {
            console.error('[Girare AI] think() error:', err);
            return { professionalResponse: 'Sorry, I encountered an error.', rawResponse: 'Sorry, I encountered an error.', error: true };
        }
    }
    return { professionalResponse: 'This model is not configured to respond.', rawResponse: 'This model is not configured to respond.' };
}

async function sendMessage() {
  const messageText = (userInput?.value || '').trim();
  if (!messageText || isThinking) return;
  toggleThinkingState(true);
  hideWelcome();
  lastUserPrompt = messageText;
  displayMessage({ professionalResponse: messageText }, 'user');
  const currentHistory = [...conversationHistory, { role: 'user', content: messageText }];
  userInput.value = '';
  userInput.style.height = 'auto';

  const aiResponse = await getAIResponse(messageText, currentHistory);
  
  conversationHistory.push({ role: 'user', content: messageText });
  appendToCurrentSession('user', messageText);
  displayMessage(aiResponse, 'ai', { markAsLastAi: true });
  conversationHistory.push({ role: 'ai', content: aiResponse.rawResponse });
  appendToCurrentSession('ai', aiResponse.rawResponse);
  
  toggleThinkingState(false);
  userInput.focus();
}

async function handleRegenerate() {
  if (!lastUserPrompt || isThinking) return;
  toggleThinkingState(true);
  regenCounter++;
  const saltedPrompt = lastUserPrompt + ' ::regen' + regenCounter;
  const historyForRegen = conversationHistory.slice(0, -1);
  const aiResponse = await getAIResponse(saltedPrompt, historyForRegen);
  if (lastAiBubble && lastAiWrapper) {
    lastAiBubble.innerHTML = '';
    renderAiTextOrCode(lastAiBubble, aiResponse.professionalResponse);
    const rawAiContent = aiResponse.rawResponse || aiResponse.professionalResponse;
    conversationHistory[conversationHistory.length - 1].content = rawAiContent;
    const session = getSessionById(currentSessionId);
    if (session && session.messages.length > 0) {
      session.messages[session.messages.length - 1].content = rawAiContent;
      session.updatedISO = nowISO();
      saveSessions();
    }
  }
  toggleThinkingState(false);
}

// -----------------------------------------------------------------------
// Initialization & Event Listeners
// -----------------------------------------------------------------------
function initializeChat() {
  if (!currentSessionId) newSession({ model: currentModelName });
  if (conversationHistory.length === 0) {
    if (welcomeScreen) welcomeScreen.style.display = 'block';
    const starter = (currentModel?.starters || ['Hello! How can I help?'])[0];
    displayMessage({ professionalResponse: starter, rawResponse: starter }, 'ai', { markAsLastAi: false });
    conversationHistory.push({ role: 'ai', content: starter });
    appendToCurrentSession('ai', starter);
  }
  if (selectedModelName) selectedModelName.textContent = currentModelName;
}

function switchModel(chosen) {
  if (!MODELS[chosen] || isThinking) return;
  currentModel = MODELS[chosen];
  currentModelName = chosen;
  if (selectedModelName) selectedModelName.textContent = chosen;
  newSession({ model: chosen });
  initializeChat();
}

function setupEventListeners() {
    sendBtn?.addEventListener('click', sendMessage);
    userInput?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
    regenBtn?.addEventListener('click', handleRegenerate);
    newChatBtn?.addEventListener('click', () => { newSession({ model: currentModelName }); initializeChat(); closeSidebar(); });
    document.querySelectorAll('[data-model]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const chosen = resolveModelName(el.dataset.model || el.textContent) || el.dataset.model;
            if (MODELS[chosen]) { switchModel(chosen); modelMenu?.classList.add('hidden'); }
        });
    });
    menuBtn?.addEventListener('click', openSidebar);
    sidebarBackdrop?.addEventListener('click', closeSidebar);
    modelTrigger?.addEventListener('click', () => modelMenu?.classList.toggle('hidden'));
    document.addEventListener('click', (e) => { if (modelMenu && !modelMenu.contains(e.target) && !modelTrigger.contains(e.target)) modelMenu.classList.add('hidden'); });
    
    let clearConfirmTO;
    clearHistoryBtn?.addEventListener('click', () => {
        if (!clearHistoryBtn.dataset.confirming) {
            clearHistoryBtn.innerHTML = '<span>Are you sure? Click again.</span>';
            clearHistoryBtn.classList.add('text-red-500');
            clearHistoryBtn.dataset.confirming = 'true';
            clearConfirmTO = setTimeout(() => {
                clearHistoryBtn.innerHTML = '<span class="material-symbols-outlined text-base">delete</span> Clear All History';
                clearHistoryBtn.classList.remove('text-red-500');
                delete clearHistoryBtn.dataset.confirming;
            }, CONFIG.CLEAR_CONFIRM_TIMEOUT);
        } else {
            clearTimeout(clearConfirmTO);
            sessions = [];
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            renderSidebarSessions();
            newSession({ model: currentModelName });
            initializeChat();
            clearHistoryBtn.innerHTML = '<span class="material-symbols-outlined text-base">delete</span> Clear All History';
            clearHistoryBtn.classList.remove('text-red-500');
            delete clearHistoryBtn.dataset.confirming;
        }
    });

    darkModeToggle?.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    settingsBtn?.addEventListener('click', () => {
        const isHidden = settingsDropdown.classList.toggle('hidden');
        if (settingsChevron) settingsChevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
    });
    
    userInput?.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = `${Math.min(userInput.scrollHeight, 200)}px`;
    });

    window.addEventListener('girare2lite:toggle-thinking', () => document.querySelectorAll('.thinking-panel').forEach(p => p.classList.toggle('hidden')));
    window.addEventListener('girare2lite:abort', () => completeThinkingBar(false));
}

async function init() {
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  loadSessions();
  renderSidebarSessions();
  setupEventListeners();
  for (const model of Object.values(MODELS)) {
    if (model.init) await model.init();
  }
  if (!sessions.length) {
    newSession({ model: currentModelName });
    initializeChat();
  } else {
    const lastSession = getSessionById(sessions[0].id);
    if (lastSession) {
      currentModelName = lastSession.model || "Girare AI 2";
      currentModel = MODELS[currentModelName];
      if (selectedModelName) selectedModelName.textContent = currentModelName;
    }
    openSession(sessions[0].id);
  }
}

init();

