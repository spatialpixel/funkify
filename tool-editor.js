import _ from 'lodash';

class ToolEditor extends HTMLElement {
  constructor() {
    super();

    const template = document.getElementById('tool-editor-template');
    const templateContent = template.content;

    // Create shadow DOM and append template
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.appendChild(templateContent.cloneNode(true));
  }
  
  connectedCallback () {
    const closeButton = this.shadowRoot.querySelector('button.tool-editor-closer');
    closeButton.addEventListener('click', this.close.bind(this));
    
    const saveButton = this.shadowRoot.querySelector('button.tool-save');
    saveButton.addEventListener('click', event => {
      const functionNameField = this.shadowRoot.querySelector('.function-name-field');
      this.tool.name = functionNameField.value;
      
      const functionDescriptionField = this.shadowRoot.querySelector('.function-description-field');
      this.tool.description = functionDescriptionField.value;
      
      const functionImplementationField = this.shadowRoot.querySelector('.function-implementation');
      this.tool.f = functionImplementationField.value;
      
      // Loop through all the parameters' properties and gather them up.
      const properties = {};
      const required = [];
      const parameters = this.shadowRoot.querySelectorAll('parameter-item');
      
      for (const parameter of parameters) {
        const parameterNameElt = parameter.shadowRoot.querySelector('.parameter-name');
        const parameterName = parameterNameElt.value;
        
        const parameterDescElt = parameter.shadowRoot.querySelector('.parameter-description');
        const parameterDesc = parameterDescElt.value;
        
        const parameterTypeElt = parameter.shadowRoot.querySelector('.parameter-type');
        const parameterType = parameterTypeElt.value;
        
        properties[parameterName] = {
          description: parameterDesc,
          type: parameterType,
        };
        
        const parameterReqElt = parameter.shadowRoot.querySelector('.parameter-required');
        const parameterReq = parameterReqElt.value;
        if (parameterReq) {
          required.push(parameterName);
        }
      }
      
      this.tool.properties = properties;
      this.tool.required = required;
      
      const toolsList = document.querySelector('tools-list');
      toolsList.refresh();
      
      this.close();
    });
    
    const addParameterButton = this.shadowRoot.querySelector('button.add-parameter');
    addParameterButton.addEventListener('click', event => {
      const value = {
        'type': 'string',
        'description': 'A generic property'
      };
      const name = 'new-parameter';
      const param = this.renderParameterForm(value, name);
      const parametersList = this.shadowRoot.querySelector('.parameters-list');
      parametersList.appendChild(param);
    });
  }
  
  close () {
    const toolEditorElt = document.querySelector('tool-editor');
    toolEditorElt.style.display = 'none';
    
    // Clear the function name field.
    const functionNameField = this.shadowRoot.querySelector('.function-name-field');
    functionNameField.value = '';
    
    // Clear the function description field.
    const functionDescriptionField = this.shadowRoot.querySelector('.function-description-field');
    functionDescriptionField.value = '';
    
    // Remove all the parameters.
    const parametersList = this.shadowRoot.querySelector('.parameters-list');
    parametersList.innerHTML = '';
    
    this.tool = null;
  }

  editTool (tool, state) {
    this.tool = tool;
    
    const toolEditorElt = document.querySelector('tool-editor');
    toolEditorElt.style.display = 'block';
    
    const functionNameField = this.shadowRoot.querySelector('.function-name-field');
    functionNameField.value = tool.name;
    
    const functionDescriptionField = this.shadowRoot.querySelector('.function-description-field');
    functionDescriptionField.value = tool.description;
    
    const parametersList = this.shadowRoot.querySelector('.parameters-list');
    _.forEach(tool.properties, (value, name) => {
      const param = this.renderParameterForm(value, name, tool.required);
      parametersList.appendChild(param);
    });
    
    const functionImplementationField = this.shadowRoot.querySelector('.function-implementation');
    functionImplementationField.value = tool.f;
  }
  
  renderParameterForm (value, name, required) {
    const parameterItem = document.createElement('parameter-item');
    parameterItem.populate(value, name, required);
    return parameterItem;
  }
}

// Define the custom element
customElements.define('tool-editor', ToolEditor);
