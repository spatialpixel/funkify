export default class LLMService {
  constructor (state, serviceKey) {
    this.state = state;
    this.serviceKey = serviceKey;
    
    // Creates a namespace for all services.
    if (!('services' in this.state)) {
      this.state.services = {};
    }
    
    this.state.services[this.serviceKey] = {
      apiKey: null,
      apiKeyChanged: false,
      instance: null
    };
    
    this.apiKey = this.state.storage.getItem(`funkify-${this.serviceKey}-api-key`);
  }
  
  // Called at the start of every completion.
  initialize () {
    
  }
  
  async createTextCompletion (params) {
    throw new Error('required method');
  }
  
  get models () {
    return [];
  }
  
  modelSupportsVision (model) {
    return false;
  }
  
  
  getter () {
    return this.apiKey;
  }
  
  setter (value) {
    this.apiKey = value;
    this.apiKeyChanged = true;
    this.state.storage.setItem('funkify-openai-api-key', this.apiKey);
  }
  
  get instance () {
    return this.state.services[this.serviceKey].instance;
  }
  
  set instance (value) {
    this.state.services[this.serviceKey].instance = value;
  }
  
  get apiKey () {
    return this.state.services[this.serviceKey].apiKey;
  }
  
  set apiKey (value) {
    this.state.services[this.serviceKey].apiKey = value;
  }
  
  get apiKeyChanged () {
    return this.state.services[this.serviceKey].apiKeyChanged;
  }
  
  set apiKeyChanged (value) {
    return this.state.services[this.serviceKey].apiKeyChanged = value;
  }
}
