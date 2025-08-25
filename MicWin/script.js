// Import models
import { aiModel } from './micwin-1.0.js';
import { micwin15 } from './micwin-1.5.js';

// DOM references
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const regenBtn = document.getElementById('regen-btn');
const fileUpload = document.getElementById('file-upload');

const darkModeToggle = document.getElementById('dark-mode-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');
const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.getElementById('settings-menu');
const clearHistoryBtn = document.getElementById('clear-history-btn');

const historyContainer = document.getElementById('history-container');
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');

const welcomeScreen = document.getElementById('welcome-screen');
const suggestions1 = document.getElementById('suggestions-micwin1');
const suggestions15 = document.getElementById('suggestions-micwin15');
const selectedModelName = document.getElementById('selected-model-name');
const headerTitle = document.getElementById('header-title');
const welcomeTitle = document.getElementById('welcome-title');
const welcomeSubtitle = document.getElementById('welcome-subtitle');

// State
let currentModel = aiModel;
let lastUserPrompt = null;
let lastAiWrapper = null;
let lastAiBubble = null;
let lastAiThinkingPanel = null;
let conversationHistory = []; // { role: "user" | "ai", content: string }

// ---- Robust invocation helpers ----
const MICWIN_DEBUG = true;

function safeInvoke(fn, ctx, ...args) {
  if (typeof fn !== 'function') {
    MICWIN_DEBUG && console.warn('[MicWin] safeInvoke: expected function');
    return { professionalResponse: "The model isn't ready for that action yet." };
  }
  try {
    return fn.call(ctx, ...args);
  } catch (err) {
    MICWIN_DEBUG && console.error('[MicWin] Invocation error:', err);
    return { professionalResponse: "I ran into an internal error while thinking through that." };
  }
}

function selfTestModel(model) {
  try {
    if (!model || !model.skills) throw new Error('Model or skills missing');
    if (typeof model.skills.think !== 'function') throw new Error('think() not found');
    const probe = safeInvoke(model.skills.think, model, 'ping', model.knowledge, { context: '' });
    MICWIN_DEBUG && console.info('[MicWin] self-test ok:', probe?.professionalResponse ?? probe);
  } catch (e) {
    console.error('[MicWin] self-test failed:', e);
  }
}

// --- Event Listeners ---
if (sendBtn) sendBtn.addEventListener('click', sendMessage);
if (userInput) {
  userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); sendMessage(); }
  });
  // Gradient -> white while typing (for 1.5 theme)
  userInput.addEventListener('focus', handleTypingOn);
  userInput.addEventListener('input', handleTypingOn);
  userInput.addEventListener('blur', handleTypingOffIfEmpty);
}
if (regenBtn) regenBtn.addEventListener('click', handleRegenerate);
if (fileUpload) fileUpload.addEventListener('change', handleFileUpload);

if (darkModeToggle) darkModeToggle.addEventListener('click', toggleDarkMode);
if (settingsBtn) settingsBtn.addEventListener('click', toggleSettingsMenu);
if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', handleClearHistory);

// Mobile sidebar open/close
if (menuBtn) menuBtn.addEventListener('click', openSidebar);
if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSidebar(); });

// Model switcher
document.querySelectorAll('[data-model]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    const chosen = el.dataset.model;

    if (chosen === "MicWin 1.5") {
      currentModel = micwin15;
      document.body.classList.add("micwin15-bg");
      if (suggestions1) suggestions1.classList.add("hidden");
      if (suggestions15) suggestions15.classList.remove("hidden");
      if (headerTitle) headerTitle.textContent = "MicWin 1.5";
      if (welcomeTitle) welcomeTitle.textContent = "Welcome to MicWin 1.5";
      if (welcomeSubtitle) welcomeSubtitle.textContent = "I learn from you, reason deeper, and can even code.";
    } else {
      currentModel = aiModel;
      document.body.classList.remove("micwin15-bg");
      document.body.classList.remove("typing-bg");
      if (suggestions1) suggestions1.classList.remove("hidden");
      if (suggestions15) suggestions15.classList.add("hidden");
      if (headerTitle) headerTitle.textContent = "MicWin 1";
      if (welcomeTitle) welcomeTitle.textContent = "How can I help you today?";
      if (welcomeSubtitle) welcomeSubtitle.textContent = "Ask me anything, or try a quick suggestion.";
    }

    if (selectedModelName) selectedModelName.textContent = chosen;
    if (chatContainer) chatContainer.innerHTML = '';
    conversationHistory = [];
    initializeChat();
    selfTestModel(currentModel);
    closeSidebar();
  });
});

// Quick replies
document.querySelectorAll('.quick-reply-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const title = btn.querySelector('h3')?.textContent || btn.textContent;
    if (userInput) { userInput.value = title.trim(); sendMessage(); }
  });
});

// --- Sidebar Drawer (mobile) ---
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

// --- Typing gradient toggle (MicWin 1.5 only) ---
function handleTypingOn() {
  if (document.body.classList.contains('micwin15-bg')) {
    document.body.classList.add('typing-bg');
  }
}
function handleTypingOffIfEmpty() {
  if (!userInput) return;
  const val = (userInput.value || '').trim();
  if (val.length === 0) {
    document.body.classList.remove('typing-bg');
  }
}

// --- UI Helpers ---
function hideWelcome() { if (welcomeScreen) welcomeScreen.style.display = 'none'; }
function toggleSettingsMenu() { if (settingsMenu) settingsMenu.classList.toggle('hidden'); }

// Clear chat history
let clearConfirmationTimeout;
function handleClearHistory() {
  if (!clearHistoryBtn) return;
  if (!clearHistoryBtn.dataset.confirming) {
    clearHistoryBtn.textContent = 'Are you sure?';
    clearHistoryBtn.classList.add('bg-red-500', 'text-white', 'dark:bg-red-600');
    clearHistoryBtn.dataset.confirming = 'true';
    clearConfirmationTimeout = setTimeout(() => resetClearButton(), 3000);
  } else {
    if (chatContainer) chatContainer.innerHTML = '';
    if (historyContainer) historyContainer.innerHTML = '<div class="p-3 text-sm text-gray-400 dark:text-gray-500 text-center">No history yet.</div>';
    lastAiWrapper = lastAiBubble = lastAiThinkingPanel = null;
    conversationHistory = [];
    displayMessage({ professionalResponse: "Chat history has been cleared." }, 'ai', { markAsLastAi: false });
    resetClearButton();
  }
}
function resetClearButton() {
  if (!clearHistoryBtn) return;
  clearTimeout(clearConfirmationTimeout);
  clearHistoryBtn.textContent = 'Clear History';
  clearHistoryBtn.classList.remove('bg-red-500', 'text-white', 'dark:bg-red-600');
  delete clearHistoryBtn.dataset.confirming;
}

// Dark mode
function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcons(isDark);
}
function updateThemeIcons(isDark) {
  if (sunIcon) sunIcon.classList.toggle('hidden', isDark);
  if (moonIcon) moonIcon.classList.toggle('hidden', !isDark);
}

// --- Core ---
function initializeChat() {
  const starter = currentModel.starters[Math.floor(Math.random() * currentModel.starters.length)];
  displayMessage({ professionalResponse: starter }, 'ai', { markAsLastAi: false });
  conversationHistory.push({ role: "ai", content: starter });
}

function sendMessage() {
  const messageText = (userInput?.value || '').trim();
  if (!messageText || messageText.endsWith(': ...')) return;

  hideWelcome();
  lastUserPrompt = messageText;

  displayMessage({ professionalResponse: messageText }, 'user');
  conversationHistory.push({ role: "user", content: messageText });
  if (userInput) userInput.value = '';

  handleTypingOffIfEmpty();

  const aiResponse = getAIResponse(messageText);
  setTimeout(() => {
    displayMessage(aiResponse, 'ai', { markAsLastAi: true });
    conversationHistory.push({ role: "ai", content: aiResponse.professionalResponse });
    closeSidebar();
  }, 300);
}

function handleRegenerate() {
  if (!lastUserPrompt) {
    displayMessage({ professionalResponse: "Nothing to regenerate yet — send a message first." }, 'ai', { markAsLastAi: false });
    return;
  }
  const aiResponse = getAIResponse(lastUserPrompt);

  if (lastAiBubble && lastAiWrapper) {
    lastAiBubble.textContent = '';
    if (lastAiThinkingPanel) { lastAiThinkingPanel.remove(); lastAiThinkingPanel = null; }
    upsertRegeneratedChip(lastAiWrapper);
    renderAiTextOrCode(lastAiBubble, aiResponse.professionalResponse);

    if (aiResponse.thinkingProcess) {
      const { thinkButton, thinkingPanel } = buildThinkingBlock(aiResponse.thinkingProcess);
      lastAiWrapper.appendChild(thinkButton);
      lastAiWrapper.appendChild(thinkingPanel);
      lastAiThinkingPanel = thinkingPanel;
    }
    conversationHistory.push({ role: "ai", content: aiResponse.professionalResponse });
  } else {
    displayMessage(aiResponse, 'ai', { markAsLastAi: true, regenerated: true });
    conversationHistory.push({ role: "ai", content: aiResponse.professionalResponse });
  }
}

// --- Rendering ---
function streamResponse(messageBubble, text) {
  const words = String(text || '').split(' ');
  let i = 0;
  messageBubble.textContent = '';
  function showNextWord() {
    if (i < words.length) {
      const wordSpan = document.createElement('span');
      wordSpan.textContent = words[i];
      // inline fade-in for words
      wordSpan.style.opacity = '0';
      wordSpan.style.transition = 'opacity 220ms ease';
      messageBubble.appendChild(wordSpan);
      requestAnimationFrame(() => { wordSpan.style.opacity = '1'; });
      if (i < words.length - 1) messageBubble.appendChild(document.createTextNode(' '));
      if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
      i++;
      setTimeout(showNextWord, 35);
    }
  }
  showNextWord();
}

function buildThinkingBlock(thinkingText) {
  const thinkButton = document.createElement('button');
  thinkButton.innerHTML = `<span class="material-symbols-outlined text-xs mr-1">psychology</span><span data-think-label>Show Thinking</span>`;
  thinkButton.className = 'text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center hover:text-gray-600 dark:hover:text-gray-400';

  const thinkingPanel = document.createElement('pre');
  thinkingPanel.textContent = thinkingText;
  thinkingPanel.className = 'thinking-panel text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-md mt-2 w-full font-mono whitespace-pre-wrap hidden';

  thinkButton.onclick = () => {
    const label = thinkButton.querySelector('[data-think-label]');
    const isHidden = thinkingPanel.classList.toggle('hidden');
    label.textContent = isHidden ? 'Show Thinking' : 'Hide Thinking';
  };
  return { thinkButton, thinkingPanel };
}

function upsertRegeneratedChip(wrapper) {
  let chip = wrapper.querySelector('[data-regenerated-chip]');
  if (!chip) {
    chip = document.createElement('span');
    chip.dataset.regeneratedChip = 'true';
    chip.className = 'mt-1 self-start text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
    chip.textContent = 'Regenerated';
    wrapper.appendChild(chip);
  }
}

// Professional header for MicWin 1.5 responses
function addProfessionalHeader(container) {
  // container is the AI message bubble
  const bar = document.createElement('div');
  bar.className = 'flex items-center justify-between mb-2';
  const left = document.createElement('div');
  left.className = 'flex items-center gap-2';
  const badge = document.createElement('span');
  badge.className = 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold';
  badge.textContent = '15';
  const title = document.createElement('span');
  title.className = 'text-sm font-semibold text-slate-700 dark:text-slate-200';
  title.textContent = 'MicWin 1.5 • Professional';
  left.appendChild(badge);
  left.appendChild(title);

  const right = document.createElement('span');
  right.className = 'text-[11px] text-slate-500 dark:text-slate-400';
  const ts = new Date();
  right.textContent = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const hr = document.createElement('div');
  hr.className = 'h-px bg-slate-200 dark:bg-slate-700/70 my-2';

  container.appendChild(bar);
  container.appendChild(hr);

  // slight fade-in for header bar
  [bar, hr].forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(4px)';
    el.style.transition = 'opacity 220ms ease, transform 220ms ease';
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 40 + i * 40);
  });

  // Right side after fade-in (timestamp)
  setTimeout(() => {
    bar.appendChild(right);
  }, 120);
}

function displayMessage(response, sender, opts = {}) {
  const { markAsLastAi = sender === 'ai', regenerated = false } = opts;

  const messageWrapper = document.createElement('div');
  messageWrapper.className = `flex flex-col mb-4 ${sender === 'user' ? 'items-end' : 'items-start'}`;

  const messageBubble = document.createElement('div');
  messageBubble.className = `rounded-xl px-4 py-3 max-w-full sm:max-w-2xl break-words ${
    sender === 'user'
      ? 'bg-blue-600 text-white shadow'
      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow'
  }`;
  messageWrapper.appendChild(messageBubble);

  if (sender === 'ai') {
    // Add professional header only for MicWin 1.5
    if (currentModel === micwin15) {
      addProfessionalHeader(messageBubble);
    }

    renderAiTextOrCode(messageBubble, response.professionalResponse);

    if (response.thinkingProcess) {
      const { thinkButton, thinkingPanel } = buildThinkingBlock(response.thinkingProcess);
      messageWrapper.appendChild(thinkButton);
      messageWrapper.appendChild(thinkingPanel);
      if (markAsLastAi) lastAiThinkingPanel = thinkingPanel;
    }
    if (regenerated) upsertRegeneratedChip(messageWrapper);
  } else {
    messageBubble.textContent = response.professionalResponse;
  }

  if (chatContainer) {
    chatContainer.appendChild(messageWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  if (sender === 'ai' && markAsLastAi) {
    lastAiWrapper = messageWrapper;
    lastAiBubble = messageBubble;
  }
}

// ====== TEXT vs CODE RENDERING WITH COLUMNS + FADE-IN ======
// JS-driven fade-in so it works even without Tailwind transition classes.
function renderAiTextOrCode(bubble, text) {
  const blocks = splitTextAndCodeBlocks(String(text || ''));
  const hasCode = blocks.some(b => b.type === 'code');
  if (!hasCode) { streamResponse(bubble, text); return; }

  // If there was a MicWin 1.5 header, keep content under it
  const contentHost = document.createElement('div');
  bubble.appendChild(contentHost);

  const textParts = blocks.filter(b => b.type === 'text' && b.text.trim());
  textParts.forEach((b, i) => {
    const p = document.createElement('p');
    p.className = 'mb-2';
    p.textContent = b.text.trim();

    // inline fade-in
    p.style.opacity = '0';
    p.style.transform = 'translateY(4px)';
    p.style.transition = 'opacity 260ms ease, transform 260ms ease';
    contentHost.appendChild(p);
    fadeInStagger(p, i, 80);
  });

  const codeBlocks = blocks.filter(b => b.type === 'code');
  if (codeBlocks.length) {
    const grid = document.createElement('div');
    grid.className = 'grid gap-3 mt-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    contentHost.appendChild(grid);

    codeBlocks.forEach((b, i) => {
      const codePanel = buildCodeBlock(b.lang, b.code);
      // JS-driven fade-in (reliable in all setups)
      codePanel.style.opacity = '0';
      codePanel.style.transform = 'translateY(6px)';
      codePanel.style.transition = 'opacity 300ms ease, transform 300ms ease';
      grid.appendChild(codePanel);
      fadeInStagger(codePanel, i, 110);
    });
  }
}

function fadeInStagger(el, index = 0, baseDelay = 90) {
  const delay = baseDelay * index + 20;
  setTimeout(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  }, delay);
}

// Parse text into blocks
function splitTextAndCodeBlocks(text) {
  const re = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks = [];
  let lastIndex = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) blocks.push({ type: 'text', text: text.slice(lastIndex, m.index) });
    const lang = (m[1] || 'plaintext').toLowerCase();
    const code = m[2].replace(/\n+$/, '');
    blocks.push({ type: 'code', lang, code });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) blocks.push({ type: 'text', text: text.slice(lastIndex) });
  return blocks;
}

function buildCodeBlock(lang, code) {
  const wrapper = document.createElement('div');
  wrapper.className = 'rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-0';

  const header = document.createElement('div');
  header.className = 'flex items-center justify-between px-3 py-2 text-xs bg-slate-200/70 dark:bg-slate-700/70';
  const left = document.createElement('div');
  left.className = 'font-mono opacity-80';
  left.textContent = (lang || 'PLAINTEXT').toUpperCase();
  const btns = document.createElement('div');
  btns.className = 'flex items-center gap-2';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'px-2 py-1 rounded bg-slate-900 text-white dark:bg-slate-900 hover:opacity-90';
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(code); copyBtn.textContent = 'Copied!'; setTimeout(() => (copyBtn.textContent = 'Copy'), 1200); }
    catch { copyBtn.textContent = 'Failed'; setTimeout(() => (copyBtn.textContent = 'Copy'), 1200); }
  });

  const pasteBtn = document.createElement('button');
  pasteBtn.className = 'px-2 py-1 rounded bg-slate-900 text-white dark:bg-slate-900 hover:opacity-90';
  pasteBtn.textContent = 'Paste';
  pasteBtn.addEventListener('click', () => {
    if (!userInput) return;
    userInput.value = code;
    userInput.focus();
    userInput.selectionStart = userInput.selectionEnd = userInput.value.length;
  });

  btns.appendChild(copyBtn);
  btns.appendChild(pasteBtn);
  header.appendChild(left);
  header.appendChild(btns);

  const pre = document.createElement('pre');
  pre.className = 'overflow-x-auto m-0 p-3';
  const codeEl = document.createElement('code');
  codeEl.className = `language-${mapLangToHljs(lang)}`;
  codeEl.textContent = code;

  pre.appendChild(codeEl);
  wrapper.appendChild(header);
  wrapper.appendChild(pre);

  if (window.hljs && typeof hljs.highlightElement === 'function') { try { hljs.highlightElement(codeEl); } catch {} }

  return wrapper;
}

function mapLangToHljs(lang) {
  const l = (lang || '').toLowerCase();
  if (l === 'js' || l === 'javascript') return 'javascript';
  if (l === 'html' || l === 'xml') return 'xml';
  if (l === 'css') return 'css';
  if (l === 'json') return 'json';
  if (l === 'ts' || l === 'typescript') return 'typescript';
  if (l === 'node' || l === 'node.js' || l === 'nodejs') return 'javascript';
  if (l === 'bash' || l === 'sh') return 'bash';
  return 'plaintext';
}

// --- AI Response Logic (safeInvoke) ---
function getAIResponse(input) {
  const lowerInput = String(input || '').toLowerCase();

  if (lowerInput.startsWith('summarize:')) {
    const content = input.substring(10).trim();
    if (currentModel?.skills?.summarize) {
      const res = safeInvoke(currentModel.skills.summarize, currentModel, content);
      return typeof res === 'string' ? { professionalResponse: res } : res;
    }
    return { professionalResponse: "There's not enough text to summarize clearly." };
  }

  if (lowerInput.startsWith('code:')) {
    const [, lang, ...descParts] = input.split(':');
    const desc = descParts.join(':').trim();
    if (currentModel?.skills?.code) {
      const res = safeInvoke(currentModel.skills.code, currentModel, (lang || '').trim(), desc);
      return typeof res === 'string' ? { professionalResponse: res } : res;
    }
    return { professionalResponse: "This model does not support coding." };
  }

  const context = conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join("\n");

  if (currentModel?.skills?.think) {
    const res = safeInvoke(currentModel.skills.think, currentModel, input, currentModel.knowledge, { context });
    if (res) return typeof res === 'string' ? { professionalResponse: res } : res;
  } else {
    MICWIN_DEBUG && console.warn('[MicWin] think() missing on model');
  }

  return { professionalResponse: "I can help with topics I know, or you can teach me with: teach: topic: notes" };
}

// File Upload
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.type !== 'application/json') {
    displayMessage({ professionalResponse: "Error: Please upload a valid JSON file." }, 'ai');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      if (importedData.knowledge) Object.assign(currentModel.knowledge, importedData.knowledge);
      if (importedData.skills) Object.assign(currentModel.skills, importedData.skills);
      if (Array.isArray(importedData.starters)) currentModel.starters.push(...importedData.starters);
      displayMessage({ professionalResponse: `Successfully imported new knowledge into ${currentModel.name}!` }, 'ai');
    } catch (error) {
      displayMessage({ professionalResponse: "Error: The uploaded file is not valid JSON." }, 'ai');
    }
  };
  reader.readAsText(file);
}

// Init
updateThemeIcons(document.documentElement.classList.contains('dark'));
initializeChat();
selfTestModel(currentModel);
