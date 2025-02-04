import OpenAIService from './service-openai.js';
import HuggingFaceService from './service-huggingface.js';

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
    
    this.manualModelEntry = this.shadowRoot.querySelector('#manual-model-entry');
    this.manualModelEntryInput = this.shadowRoot.querySelector('#manual-model-entry input');
    this.manualModelEntryInput.addEventListener('change', this.onManualEntry.bind(this));
    this.manualEntryCancel = this.shadowRoot.querySelector('#manual-model-entry button');
    this.manualEntryCancel.addEventListener('click', this.hideManualEntry.bind(this));
    
    this.visionDetailPicker = this.shadowRoot.querySelector('select#vision-detail');
    this.visionDetailPicker.value = "low";
  }
  
  initialize (state) {
    this.state = state;
    
    this.state.services = {
      openai: new OpenAIService(state),
      huggingface: new HuggingFaceService(state)
    };
    
    this.onServiceSelect();
    
    this.populateModels();
    this.modelPicker.value = this.state.service.models[0];
  }
  
  get service () {
    return this.state.service;
  }
  
  get serviceKey () {
    return this.servicePicker.value;
  }
  
  get currentModel () {
    if (this.manualModelEntry.style.display !== "none") {
      return this.manualModelEntryInput.value;
    } else {
      return this.modelPicker.value;
    }
  }
  
  get visionDetail () {
    return this.visionDetailPicker.value;
  }
    
  get currentModelSupportsVision () {
    return this.service.modelSupportsVision(this.currentModel);
  }
  
  populateModels () {
    this.modelPicker.innerHTML = '';
    
    _.forEach(this.service.models, model => {
      const modelOption = document.createElement('option');
      modelOption.value = model;
      modelOption.textContent = model;
      this.modelPicker.appendChild(modelOption);
    });
    
    const other = document.createElement('option');
    other.value = 'other';
    other.textContent = "Other…";
    this.modelPicker.appendChild(other);
    
    this.onModelSelect();
  }
  
  onServiceSelect (event) {
    this.state.service = this.state.services[this.serviceKey];
    
    this.populateModels();
    
    // When picking a new service, should probably reset the manual entry field too.
    this.hideManualEntry();
  }
  
  onModelSelect (event) {
    if (this.manualModelEntry.style.display === 'none' && this.currentModel === 'other') {
      this.showManualModelEntryInput();
    }
    
    if (this.currentModelSupportsVision) {
      this.visionDetailPicker.removeAttribute('disabled');
    } else {
      this.visionDetailPicker.setAttribute('disabled', true);
    }
  }
  
  hideManualEntry () {
    this.manualModelEntryInput.value = '';
    this.manualModelEntry.style.display = 'none';
    this.modelPicker.style.display = 'initial';
    
    this.modelPicker.value = this.service.models[0];
  }
  
  showManualModelEntryInput () {
    this.modelPicker.style.display = 'none';
    
    // Then show the new entry.
    this.manualModelEntry.style.display = 'inline-block';
    this.manualModelEntryInput.focus();
  }
  
  onManualEntry (event) {
    
  }
}

customElements.define('service-manager', ServiceManager);