import _ from 'lodash';

class ParameterItem extends HTMLElement {
  constructor() {
    super();

    const template = document.getElementById('parameter-item-template');
    const templateContent = template.content;

    // Create shadow DOM and append template
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.appendChild(templateContent.cloneNode(true));
  }
  
  connectedCallback () {
    const removeButton = this.shadowRoot.querySelector('button.remove-parameter');
    removeButton.addEventListener('click', event => {
      this.shadowRoot.host.remove();
    });
  }
  
  populate (value, name, required) {
    this.parameterNameField = this.shadowRoot.querySelector('.parameter-name');
    this.parameterNameField.value = name;
    
    this.parameterDescField = this.shadowRoot.querySelector('.parameter-description');
    this.parameterDescField.value = value.description;
    
    this.parameterReqField = this.shadowRoot.querySelector('.parameter-required');
    this.parameterReqField.checked = _.includes(required, name);
    
    this.parameterTypeField = this.shadowRoot.querySelector('.parameter-type');
    if (value.type === "array" && value.items.type === "number") {
      this.parameterTypeField.value = "array-number";
    } else if (value.type === "array" && value.items.type === "string") {
      this.parameterTypeField.value = "array-string";
    } else {
      this.parameterTypeField.value = value.type;
    }
  }
}

customElements.define('parameter-item', ParameterItem);
