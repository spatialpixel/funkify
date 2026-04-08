import OpenAIService from './service-openai.js';
import HuggingFaceService from './service-huggingface.js';
import LocalService from './service-local.js';

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

    this.addEventListener('update-model-list', this.onUpdateModelList.bind(this));
  }

  async initialize (state) {
    this.state = state;

    this.state.services = {
      openai: new OpenAIService(state),
      huggingface: new HuggingFaceService(state),
      local: new LocalService(state),
    };

    const preferred = localStorage.getItem('funkify-preferred-service');
    if (_.isString(preferred)) {
      this.servicePicker.value = preferred;
    }

    await this.onServiceSelect();
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
    // Assume all custom models can support vision for now.
    if (this.manualModelEntry.style.display !== 'none') { return true; }
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

  async onServiceSelect (event) {
    this.state.service = this.state.services[this.serviceKey];
    this.state.storage.setItem('funkify-preferred-service', this.serviceKey);

    await this.service.requestModels();

    this.populateModels();

    const lastServiceModel = this.service.lastModel;
    if (lastServiceModel) {
      if (_.includes(this.service.models, lastServiceModel)) {
        this.hideManualEntry();
        this.modelPicker.value = lastServiceModel;
      } else {
        // Pick other and add it.
        this.showManualModelEntryInput();
        this.manualModelEntryInput.value = lastServiceModel;
      }
    } else {
      this.modelPicker.value = this.service.models[0];
      this.hideManualEntry();
    }

    this.onModelSelect();
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

    if (event && this.currentModel !== 'other') {
      this.service.saveLastModel(this.currentModel);
    }
  }

  hideManualEntry (event) {
    this.manualModelEntryInput.value = '';
    this.manualModelEntry.style.display = 'none';
    this.modelPicker.style.display = 'initial';

    this.modelPicker.value = this.service.models[0];
    if (event) {
      this.service.saveLastModel(this.currentModel);
    }
  }

  showManualModelEntryInput () {
    this.modelPicker.style.display = 'none';

    // Then show the new entry.
    this.manualModelEntry.style.display = 'inline-block';
    this.manualModelEntryInput.focus();
  }

  onManualEntry (event) {
    const model = this.manualModelEntryInput.value
    this.service.saveLastModel(model);
  }

  onUpdateModelList (event) {
    // If the models list of the currently selected service has been updated,
    // then update the shown list of models.
    const serviceKey = event.detail.serviceKey;
    if (this.service.serviceKey === serviceKey) {
      this.populateModels();
    }
  }
}

customElements.define('service-manager', ServiceManager);
