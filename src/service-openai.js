import LLMService from './service-base.js';
import OpenAI from 'openai';

export default class OpenAIService extends LLMService {
  constructor (state) {
    super(state, 'openai');
    // this.state = the app's state singleton
    // this.serviceKey = a string like 'openai' or 'huggingface'
    
    this.keyManager = document.querySelector(`key-manager#${this.serviceKey}-api-key`);
    this.keyManager.initialize(this.getter.bind(this), this.setter.bind(this));
  }
  
  initialize () {
    if (!this.instance || this.apiKeyChanged) {
      this.instance = new OpenAI({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true
      });
      
      this.apiKeyChanged = false;
    }
  }
  
  async createTextCompletion (params) {
    return await this.instance.chat.completions.create(params);
  }
  
  get models () {
    return [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo'
    ]
  }
  
  modelSupportsVision (model) {
    const modelsWithVision = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4']; // gpt-3.5-turbo??
    return modelsWithVision.includes(model);
  }
}
