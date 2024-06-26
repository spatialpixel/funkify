import './style.css';

import './src/dropdown-menu.js';
import './src/tools-list.js';
import './src/tool-editor.js';
import './src/tool-item.js';
import './src/parameter-item.js';
import './src/collapsible-element.js';

import { State } from './src/state.js';
import { ChatManager } from './src/chat-manager.js';
import FunkifyChatDelegate from './src/chat-delegate.js';
import { KeyManager } from './src/key-manager.js';
import { PromptManager } from './src/prompt-manager.js';
import MessagesManager from './src/messages-manager.js';

if (document.readyState === 'complete') {
  onReady();
} else {
  document.addEventListener("DOMContentLoaded", onReady);
}

function onReady () {
  const state = new State();
  
  state.chatManager = new ChatManager(state, new FunkifyChatDelegate());
  state.keyManager = new KeyManager(state);
  state.promptManager = new PromptManager(state);
  state.messagesManager = new MessagesManager(state);
  
  state.toolEditor = document.querySelector('tool-editor');
  state.toolEditor.initialize(state);
  
  state.toolsList = document.querySelector('tools-list');
  state.toolsList.populate(state);
  
  state.promptManager.focusPrompt();
}
