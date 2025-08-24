// Import the AI model from the separate file
import { aiModel } from './ai-model.js';

// DOM element references
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const fileUpload = document.getElementById('file-upload');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');
const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.getElementById('settings-menu');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const historyContainer = document.getElementById('history-container');
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.querySelector('aside');
const quickReplyContainer = document.getElementById('quick-reply-container');

// --- Event Listeners ---

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});
fileUpload.addEventListener('change', handleFileUpload);
darkModeToggle.addEventListener('click', toggleDarkMode);
settingsBtn.addEventListener('click', toggleSettingsMenu);
clearHistoryBtn.addEventListener('click', handleClearHistory);
menuBtn.addEventListener('click', toggleSidebar);

// Add event listener for quick reply buttons
quickReplyContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('quick-reply-btn')) {
        const message = event.target.textContent;
        if (message.includes('...')) {
            userInput.value = message.replace('...', ' ');
            userInput.focus();
        } else {
            userInput.value = message;
            sendMessage();
        }
    }
});


// --- UI Functions ---

function toggleSidebar() { sidebar.classList.toggle('hidden'); }
function toggleSettingsMenu() { settingsMenu.classList.toggle('hidden'); }

let clearConfirmationTimeout;
function handleClearHistory() {
    if (!clearHistoryBtn.dataset.confirming) {
        clearHistoryBtn.textContent = 'Are you sure?';
        clearHistoryBtn.classList.add('bg-red-500', 'text-white', 'dark:bg-red-600');
        clearHistoryBtn.dataset.confirming = 'true';
        clearConfirmationTimeout = setTimeout(() => resetClearButton(), 3000);
    } else {
        chatContainer.innerHTML = '';
        historyContainer.innerHTML = '<div class="p-3 text-sm text-gray-400 dark:text-gray-500 text-center">No history yet.</div>';
        displayMessage("Chat history has been cleared.", 'ai');
        resetClearButton();
    }
}

function resetClearButton() {
    clearTimeout(clearConfirmationTimeout);
    clearHistoryBtn.textContent = 'Clear History';
    clearHistoryBtn.classList.remove('bg-red-500', 'text-white', 'dark:bg-red-600');
    delete clearHistoryBtn.dataset.confirming;
}


// --- Dark Mode ---

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcons(isDark);
}

function updateThemeIcons(isDark) {
    sunIcon.classList.toggle('hidden', isDark);
    moonIcon.classList.toggle('hidden', !isDark);
}

// --- Core Functions ---

function initializeChat() {
    const starter = aiModel.starters[Math.floor(Math.random() * aiModel.starters.length)];
    displayMessage({ professionalResponse: starter }, 'ai');
}

function sendMessage() {
    const messageText = userInput.value.trim();
    if (messageText === '' || messageText.endsWith(': ...')) return;

    displayMessage({ professionalResponse: messageText }, 'user');
    userInput.value = '';

    const aiResponse = getAIResponse(messageText);

    setTimeout(() => {
        displayMessage(aiResponse, 'ai');
    }, 600); 
}

function streamResponse(messageBubble, text) {
    const words = text.split(' ');
    let i = 0;
    messageBubble.textContent = ''; 

    function showNextWord() {
        if (i < words.length) {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word-fade-in';
            wordSpan.textContent = words[i];
            messageBubble.appendChild(wordSpan);

            if (i < words.length - 1) {
                messageBubble.appendChild(document.createTextNode(' '));
            }

            chatContainer.scrollTop = chatContainer.scrollHeight;
            i++;
            setTimeout(showNextWord, 50); 
        }
    }
    showNextWord();
}

function displayMessage(response, sender) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex flex-col mb-4 ${sender === 'user' ? 'items-end' : 'items-start'}`;

    const messageBubble = document.createElement('div');
    messageBubble.className = `rounded-lg px-4 py-2 max-w-md ${
        sender === 'user' 
        ? 'bg-blue-600 text-white' 
        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }`;
    
    messageWrapper.appendChild(messageBubble);

    // If it's an AI response, stream it and add the "See Thinking" button
    if (sender === 'ai') {
        streamResponse(messageBubble, response.professionalResponse);
        
        if (response.thinkingProcess) {
            const thinkButton = document.createElement('button');
            thinkButton.innerHTML = `<span class="material-symbols-outlined text-xs mr-1">psychology</span>See Thinking`;
            thinkButton.className = 'text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center hover:text-gray-600 dark:hover:text-gray-400';
            
            const thinkingPanel = document.createElement('pre');
            thinkingPanel.textContent = response.thinkingProcess;
            thinkingPanel.className = 'thinking-panel text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-md mt-2 w-full font-mono whitespace-pre-wrap';
            
            thinkButton.onclick = () => thinkingPanel.classList.toggle('show');
            
            messageWrapper.appendChild(thinkButton);
            messageWrapper.appendChild(thinkingPanel);
        }
    } else {
        messageBubble.textContent = response.professionalResponse;
    }
    
    chatContainer.appendChild(messageWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function getAIResponse(input) {
    const lowerInput = input.toLowerCase();

    if (lowerInput.startsWith('summarize:')) {
        const content = input.substring(10).trim();
        return { professionalResponse: aiModel.skills.summarize(content) };
    }
    
    for (const topic in aiModel.knowledge) {
        for (const subTopic in aiModel.knowledge[topic]) {
            if (lowerInput.includes(topic.toLowerCase().replace('cancer', '')) && lowerInput.includes(subTopic)) {
                 return { professionalResponse: aiModel.knowledge[topic][subTopic] };
            }
        }
    }

    const thought = aiModel.skills.think(input, aiModel.knowledge);
    if (thought) {
        return thought;
    }

    return { professionalResponse: "I can only answer questions about topics I know about. Please try asking about HPV, Covid, the Flu, Lung Cancer, or the PS6." };
}

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
            Object.assign(aiModel.knowledge, importedData.knowledge);
            Object.assign(aiModel.skills, importedData.skills);
            aiModel.starters.push(...(importedData.starters || []));
            displayMessage({ professionalResponse: "Successfully imported new knowledge!" }, 'ai');
        } catch (error) {
            console.error("Failed to parse JSON:", error);
            displayMessage({ professionalResponse: "Error: The uploaded file is not valid JSON." }, 'ai');
        }
    };
    reader.readAsText(file);
}

// --- Initializations ---
updateThemeIcons(document.documentElement.classList.contains('dark'));
initializeChat();
