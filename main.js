import './style.css';

import './dropdown-menu.js';
import './tools-list.js';
import './tool-editor.js';
import './parameter-item.js';
import './collapsible-element.js';

import { State } from './state.js';
import { ChatManager } from './chat-manager.js';
import { KeyManager } from './key-manager.js';
import { PromptManager } from './prompt-manager.js';
import examples from './example-functions.js';

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
  
  state.tools = examples;
  const toolsList = document.querySelector('tools-list');
  toolsList.populate(state);
  
  const modelPicker = document.querySelector('select#model-picker');
  modelPicker.value = "gpt-4-turbo-preview";
  
  state.promptManager.focusPrompt();
}
