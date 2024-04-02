import './style.css';

import './src/dropdown-menu.js';
import './src/tools-list.js';
import './src/tool-editor.js';
import './src/parameter-item.js';
import './src/collapsible-element.js';

import { State } from './src/state.js';
import { ChatManager } from './src/chat-manager.js';
import { KeyManager } from './src/key-manager.js';
import { PromptManager } from './src/prompt-manager.js';
import MessagesManager from './src/messages-manager.js';
import examples from './src/example-functions.js';

if (document.readyState === 'complete') {
  onReady();
} else {
  document.addEventListener("DOMContentLoaded", onReady);
}

function onReady () {
  const state = new State();
  
  state.chatManager = new ChatManager(state);
  state.keyManager = new KeyManager(state);
  state.promptManager = new PromptManager(state);
  state.messagesManager = new MessagesManager(state);
  
  state.tools = examples;
  const toolsList = document.querySelector('tools-list');
  toolsList.populate(state);
  
  const modelPicker = document.querySelector('select#model-picker');
  modelPicker.value = "gpt-4-turbo-preview";
  
  state.promptManager.focusPrompt();
}
