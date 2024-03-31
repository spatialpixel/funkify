import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { FunctionTool } from './function.js';

class ToolsList extends HTMLElement {
  constructor() {
    super();

    const template = document.getElementById('tools-list-template');
    const templateContent = template.content;

    // Create shadow DOM and append template
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.appendChild(templateContent.cloneNode(true));
  }
  
  get tools () {
    return this.state?.tools;
  }

  populate (state) {
    this.state = state;
    
    const newFunctionButton = this.shadowRoot.querySelector('button.new-function');
    newFunctionButton.addEventListener('click', event => {
      const name = 'new_function';
      const description = "A stub function that returns dummy data."
      const id = uuidv4();
      const parameters = {};
      const required = [];
      const f = `return "Success";`;
      
      const newFunction = new FunctionTool(id, name, description, parameters, required, f);
      state.tools.push(newFunction);
      
      const toolsList = document.querySelector('tools-list');
      toolsList.refresh();
      
      this.editTool(newFunction);
    });
    
    const toolsListElement = this.shadowRoot.querySelector('.tools-list-main');
    
    for (const tool of this.tools) {
      const toolItem = this.addToolItem(tool);
      toolsListElement.appendChild(toolItem);
    }
  }
  
  addToolItem (tool) {
    const toolItem = document.createElement('div');
    
    toolItem.classList.add('tool-item');
    
    toolItem.setAttribute('id', tool.id);
    
    const toolItemName = document.createElement('div');
    toolItemName.classList.add('name');
    toolItemName.innerHTML = tool.name;
    toolItem.appendChild(toolItemName);
    
    const toolItemDescription = document.createElement('div');
    toolItemDescription.classList.add('description');
    toolItemDescription.innerHTML = tool.description;
    toolItem.appendChild(toolItemDescription);
    
    toolItem.addEventListener('click', event => {
      this.editTool(tool, this.state);
    })
    
    return toolItem;
  }
  
  refresh () {
    for (const tool of this.tools) {
      const toolElt = this.shadowRoot.querySelector(`#${tool.id}`);
      if (!toolElt) {
        const toolsListElement = this.shadowRoot.querySelector('.tools-list-main');
        const toolItem = this.addToolItem(tool);
        toolsListElement.appendChild(toolItem);
      }
      
      const toolItemName = toolElt.querySelector(`.name`);
      toolItemName.innerHTML = tool.name;
      
      const toolItemDescription = toolElt.querySelector(`.description`);
      toolItemDescription.innerHTML = tool.description;
    }
  }
  
  editTool (tool) {
    const toolEditorElt = document.querySelector('tool-editor');
    toolEditorElt.editTool(tool);
  }
}

// Define the custom element
customElements.define('tools-list', ToolsList);