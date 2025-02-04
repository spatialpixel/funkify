export default class LLMService {
  constructor (state, serviceKey) {
    this.state = state;
    this.serviceKey = serviceKey;
    
    this.apiKey = null;
    this.apiKeyChanged = false;
    this.instance = null;
    
    this.apiKey = this.state.storage.getItem(`funkify-${this.serviceKey}-api-key`);
  }
  
  // Called at the start of every completion. Should ensure there is an instance
  // of the current service instantiated, typically with an API key.
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
    this.state.storage.setItem(`funkify-${this.serviceKey}-api-key`, this.apiKey);
  }
  
  get stream () {
    return true;
  }
  
  preprocessMessage (message) {
    
  }
  
  get includeToolsAfterFunctionCalls () {
    return true;
  }
}
