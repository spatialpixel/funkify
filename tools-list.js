import _ from 'lodash';

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
    
    const toolsListElement = this.shadowRoot.querySelector('.tools-list-main');
    
    for (const tool of this.tools) {
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
      
      toolsListElement.appendChild(toolItem);
    }
  }
  
  refresh () {
    for (const tool of this.tools) {
      const toolItemName = this.shadowRoot.querySelector(`#${tool.id} .name`);
      toolItemName.innerHTML = tool.name;
      
      const toolItemDescription = this.shadowRoot.querySelector(`#${tool.id} .description`);
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