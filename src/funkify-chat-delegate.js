import { ChatManagerDelegate } from './chat-manager-delegate.js';
import _ from 'lodash';

const funkifyContext = `You are a web application with a chat interface with
several available functions. When these functions return empty values, do
not generate new values, simply continue with no information. It is okay
to say you do not have enough information or the function returned no value.
Ensure when calling functions that you call multiple functions when necessary.
Here is additional context:`;

export default class FunkifyChatDelegate extends ChatManagerDelegate {
  constructor (state) {
    super();
    this.state = state;

    this.state.messages = [];

    this.systemContextInput = document.querySelector('textarea#system-context');

    const storedContext = localStorage.getItem('funkify-system-context');
    if (storedContext) {
      this.systemContextInput.value = storedContext;
    }

    this.systemContextInput.addEventListener('change', event => {
      localStorage.setItem('funkify-system-context', this.systemContextInput.value);
    });
  }

  get currentModel () {
    return this.state.serviceManager.currentModel;
  }

  get visionDetail () {
    return this.state.serviceManager.visionDetail;
  }

  get systemContext () {
    return `${funkifyContext}\n\n${this.systemContextInput.value}`;
  }

  get isVisionModel () {
    return this.service.modelSupportVision(this.currentModel);
  }

  get tools () {
    return _.map(this.state.tools, 'schema');
  }

  get useStructuredOutputs () {
    // return document.querySelector('#use-structured-outputs').checked;
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

  renderMessage (message, data=null) {
    return this.state.messagesManager.renderMessage(message, data);
  }

  updateMessageInList (id, content) {
    return this.state.messagesManager.updateMessageInList(id, content);
  }

  get supportsImages () {
    return true;
  }

  get stream () {
    return this.state.service.stream;
  }

  initializeLLMService () {
    this.state.service.initialize();
  }

  async createTextCompletion (params) {
    return this.state.service.createTextCompletion(params);
  }

  processAssistantMessage (message) {
    this.state.service.processAssistantMessage(message);
  }

  processToolCallsMessage (message) {
    this.state.service.processToolCallsMessage(message);
  }
}
