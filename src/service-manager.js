import OpenAIService from './service-openai.js';
import _ from 'lodash';

class ServiceManager extends HTMLElement {
  constructor() {
    super();
    
    const template = document.querySelector('#service-manager-template');
    const templateContent = template.content;
  
    // Create shadow DOM and append template
    this.attachShadow({ mode: 'open' });
  
    this.shadowRoot.appendChild(templateContent.cloneNode(true));
  }
  
  connectedCallback () {
    this.defaultService = this.getAttribute('default');
    
    this.servicePicker = this.shadowRoot.querySelector('select#service-picker');
    this.servicePicker.addEventListener('change', this.onServiceSelect.bind(this));
    
    this.modelPicker = this.shadowRoot.querySelector('select#model-picker');
    this.modelPicker.addEventListener('change', this.onModelSelect.bind(this));
    
    this.visionDetailPicker = this.shadowRoot.querySelector('select#vision-detail');
    this.visionDetailPicker.value = "low";
  }
  
  get service () {
    return this.state.service;
  }
  
  initialize (state) {
    this.state = state;
    
    if (this.defaultService === 'openai') {
      this.state.service = new OpenAIService(state);
    }
    
    this.populateModels();
    this.modelPicker.value = this.state.service.models[0];
  }
  
  get serviceKey () {
    return this.servicePicker.value;
  }
  
  get currentModel () {
    return this.modelPicker.value;
  }
  
  get visionDetail () {
    return this.visionDetailPicker;
  }
  
  populateModels () {
    _.forEach(this.service.models, model => {
      const modelOption = document.createElement('option');
      modelOption.value = model;
      modelOption.textContent = model;
      this.modelPicker.appendChild(modelOption);
    });
  }
  
  onServiceSelect (event) {
    if (this.serviceKey === 'openai') {
      this.state.service = new OpenAIService(state);
    }
  }
  
  onModelSelect (event) {
    if (this.service.modelSupportsVision(this.currentModel)) {
      this.visionDetailPicker.removeAttribute('disabled');
    } else {
      this.visionDetailPicker.setAttribute('disabled', true);
    }
  }
}

customElements.define('service-manager', ServiceManager);