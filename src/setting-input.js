import * as Interface from './interface.js';

class SettingInput extends HTMLElement {
  constructor() {
    super();
    
    const template = document.querySelector('#setting-input-template');
    const templateContent = template.content;
  
    // Create shadow DOM and append template
    this.attachShadow({ mode: 'open' });
  
    this.shadowRoot.appendChild(templateContent.cloneNode(true));
  }
  
  connectedCallback () {
    this.key = this.getAttribute('key');
    
    this.label = this.shadowRoot.querySelector('.form label');
    this.label.textContent = this.textContent;
    
    this.settingInput = this.shadowRoot.querySelector('.form input');
  }
  
  initialize (getter, setter) {
    this.getter = getter;
    this.setter = setter;
    
    this.settingInput.addEventListener('change', event => {
      this.setter(this.settingInput.value);
    });
    
    this.settingInput.value = this.getter();
  }
}

customElements.define('setting-input', SettingInput);

