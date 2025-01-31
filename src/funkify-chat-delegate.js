import OpenAI from 'openai';
import { ChatManagerDelegate } from './chat-manager-delegate.js';
import _ from 'lodash';

export default class FunkifyChatDelegate extends ChatManagerDelegate {
  constructor (state) {
    super();
    this.state = state;
    
    this.state.openai = null;
    this.state.messages = [];
    
    this.systemContextInput = document.querySelector('textarea#system-context');
    
    this.modelPicker = document.querySelector('select#model-picker');
    this.modelPicker.value = "gpt-4o";
    this.modelPicker.addEventListener('change', this.onModelSelect.bind(this));
    
    this.visionDetailPicker = document.querySelector('select#vision-detail');
    this.visionDetailPicker.value = "low";
  }
  
  onModelSelect (event) {
    if (this.isVisionModel) {
      this.visionDetailPicker.removeAttribute('disabled');
    } else {
      this.visionDetailPicker.setAttribute('disabled', true);
    }
  }
  
  get currentModel () {
    return this.modelPicker.value;
  }
  
  get visionDetail () {
    return this.visionDetailPicker.value;
  }
  
  get systemContext () {
    return this.systemContextInput.value;
  }
  
  get isVisionModel () {
    const modelsWithVision = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4']; // gpt-3.5-turbo??
    return modelsWithVision.includes(this.currentModel);
  }
  
  get tools () {
    return _.map(this.state.tools, 'schema');
  }
  
  get functions () {
    return this.state.tools;
  }
  
  get systemMessage () {
    return {
      role: 'system',
      content: this.systemContext
    }
  }
  
  get messages () {
    const messagesHaveSystemContext = _.chain(this.state.messages).map('role').includes('system').value();
    if (!messagesHaveSystemContext) {
      this.state.messages.unshift(this.systemMessage);
    }
    
    return this.state.messages;
  }
  
  addMessage (message, elementId=null) {
    this.state.messages.push(message);
  }
  
  addMessageToList (message, data=null) {
    return this.state.messagesManager.addMessageToList(message, data);
  }
  
  updateMessageInList (id, content) {
    this.state.messagesManager.updateMessageInList(id, content);
  }
  
  get supportsImages () {
    return true;
  }
  
  get stream () {
    return true;
  }
  
  initializeLLMService () {
    if (!this.state.openai || this.state.apiKeyChanged) {
      this.state.openai = new OpenAI({
        apiKey: this.state.apiKey,
        dangerouslyAllowBrowser: true
      });
      
      this.state.apiKeyChanged = false;
    }
  }
  
  async createCompletion (...args) {
    const params = args[0];
    return await this.state.openai.chat.completions.create(params);
  }
}
