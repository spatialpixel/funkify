import FunctionTool from './function.js';
import _ from 'lodash';

class ToolItem extends HTMLElement {
  constructor() {
    super();
    
    const template = document.querySelector('#tool-item-template');
    const templateContent = template.content;
  
    // Create shadow DOM and append template
    this.attachShadow({ mode: 'open' });
  
    this.shadowRoot.appendChild(templateContent.cloneNode(true));
  }
  
  connectedCallback () {
    this.deleteButton = this.shadowRoot.querySelector("button.delete-tool");
    this.deleteButton.addEventListener('click', this.delete.bind(this));
    
    this.leftArea = this.shadowRoot.querySelector('.tool-left');
    this.leftArea.addEventListener('click', this.editTool.bind(this));
    
    this.nameField = this.shadowRoot.querySelector(".name");
    this.descriptionField = this.shadowRoot.querySelector(".description");
  }
  
  initialize (tool, toolsList) {
    this.tool = tool;
    this.toolsList = toolsList;
    
    this.shadowRoot.host.setAttribute('id', this.tool.id);
    this.nameField.innerHTML = this.tool.name;
    this.descriptionField.innerHTML = this.tool.description;
  }
  
  get state () {
    return this.toolsList.state;
  }
  
  editTool (event) {
    this.state.toolEditor.editTool(this.tool);
  }
  
  delete (event) {
    event.stopPropagation();
    
    FunctionTool.removeFromLocalStorage(this.tool);
    
    // Remove from the state.
    _.remove(this.state.tools, t => t.name === this.tool.name);
    
    this.shadowRoot.host.remove();
  }
  
  refresh () {
    this.nameField.innerHTML = this.tool.name;
    this.descriptionField.innerHTML = this.tool.description;
  }
}

customElements.define('tool-item', ToolItem);
