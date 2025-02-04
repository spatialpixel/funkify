import * as Interface from './interface.js';

class KeyManager extends HTMLElement {
  constructor() {
    super();
    
    const template = document.querySelector('#key-manager-template');
    const templateContent = template.content;
  
    // Create shadow DOM and append template
    this.attachShadow({ mode: 'open' });
  
    this.shadowRoot.appendChild(templateContent.cloneNode(true));
  }
  
  connectedCallback () {
    this.key = this.getAttribute('key');
    
    this.label = this.shadowRoot.querySelector('.form label');
    this.label.textContent = this.textContent;
    
    this.apiKeyInput = this.shadowRoot.querySelector('.form input');
    
    this.toggleButton = this.shadowRoot.querySelector('.form button');
    this.toggleButton.addEventListener('click', this.togglePasswordVisibility.bind(this));
  }
  
  initialize (getter, setter) {
    this.getter = getter;
    this.setter = setter;
    
    this.apiKeyInput.addEventListener('change', event => {
      this.setter(this.apiKeyInput.value);
    });
    
    this.apiKeyInput.value = this.getter();
  }
  
  togglePasswordVisibility () {
    if (this.apiKeyInput.type === 'text') {
      this.apiKeyInput.type = 'password';
    } else {
      this.apiKeyInput.type = 'text';
    }
  }
}

customElements.define('key-manager', KeyManager);

