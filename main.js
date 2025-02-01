import './style.css';

import './src/dropdown-menu.js';
import './src/tools-list.js';
import './src/tool-editor.js';
import './src/tool-item.js';
import './src/parameter-item.js';
import './src/collapsible-element.js';
import './src/message-item.js';
import './src/key-manager.js'

import { State } from './src/state.js';
import { ChatManager } from './src/chat-manager.js';
import FunkifyChatDelegate from './src/funkify-chat-delegate.js';
import { PromptManager } from './src/prompt-manager.js';
import MessagesManager from './src/messages-manager.js';

import OpenAIService from './src/service-openai.js';

if (document.readyState === 'complete') {
  onReady();
} else {
  document.addEventListener("DOMContentLoaded", onReady);
}

async function onReady () {
  const state = new State();
  
  state.storage = localStorage;
  state.service = new OpenAIService(state);
  
  const chatDelegate = new FunkifyChatDelegate(state);
  state.chatManager = new ChatManager(state, chatDelegate);
  state.promptManager = new PromptManager(state);
  state.messagesManager = new MessagesManager(state);
  
  state.toolEditor = document.querySelector('tool-editor');
  state.toolEditor.initialize(state);
  
  state.toolsList = document.querySelector('tools-list');
  state.toolsList.populate(state);
  
  state.promptManager.focusPrompt();
  
  state.pyodide = await loadPyodide();
  
  // Load micropip
  await state.pyodide.loadPackage("micropip");
  const micropip = state.pyodide.pyimport("micropip");
  
  // Load numpy to see whether the download works.
  await micropip.install("numpy");
}
