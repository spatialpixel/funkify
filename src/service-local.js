import LLMService from './service-base.js';
import OpenAI from 'openai';
import ShortUniqueId from 'short-unique-id';
import _ from 'lodash';


export default class LocalService extends LLMService {
  constructor (state) {
    super(state, 'local');
    // this.state = the app's state singleton
    // this.serviceKey = a string like 'openai' or 'huggingface'
    
    const defaultURL = 'http://localhost:1234/v1';
    this.baseURL = this.state.storage.getItem(`funkify-${this.serviceKey}-base-url`) || defaultURL;
    this.baseURLChanged = false;
    
    this._models = [];
    this.requestModels();
    
    this.urlInput = document.querySelector(`setting-input#local-url`);
    this.urlInput.initialize(this.getterUrl.bind(this), this.setterUrl.bind(this));
  }
  
  initialize () {
    if (!this.instance || this.apiKeyChanged) {
      this.instance = new OpenAI({
        baseURL: this.baseURL,
        apiKey: '',
        dangerouslyAllowBrowser: true
      });
      
      this.apiKeyChanged = false;
    }
  }
  
  getterUrl () {
    return this.baseURL;
  }
  
  setterUrl (value) {
    this.baseURL = value;
    this.baseURLChanged = true;
    this.state.storage.setItem(`funkify-${this.serviceKey}-base-url`, this.baseURL);
  }
  
  async createTextCompletion (params) {
    console.debug('local params:', params);
    return await this.instance.chat.completions.create(params);
  }
  
  get models () {
    return this._models;
    
    // return [
    //   'Qwen/Qwen2.5-Coder-32B-Instruct-GGUF'
    // ]
  }
  
  async requestModels () {
    const response = await fetch(`${this.baseURL}/models`);
    const data = await response.json();
    this._models = _.map(data.data, 'id');
  }
  
  processAssistantMessage (message) {
    // local models sometimes put a tool call into the content field, because reasons.
    try {
      const data = JSON.parse(message.content);
      
      if (_.has(data, 'name') && _.has(data, 'parameters')) {
        // This is a tool_call message. Reformat it.
        const uid = new ShortUniqueId({ length: 9 });
        
        const tool_call = {
          type: "function",
          id: uid.rnd(),
          function: {
            name: data.name,
            arguments: data.parameters
          }
        };
        
        message.tool_calls = [ tool_call ];
        message.content = "";
        message.role = "assistant";
      }
    } catch (err) {
      // ensure if tool_calls that role: assistant is there
      if (_.isArray(message.tool_calls)) {
        if (!_.has(message, 'role') || message.role !== 'assistant') {
          message.role = 'assistant';
        }
      }
    }
  }
}
