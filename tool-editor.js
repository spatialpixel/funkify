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
      const parameters = this.shadowRoot.querySelectorAll('.parameter');
      for (const parameter of parameters) {
        const parameterNameElt = parameter.querySelector('.parameter-name');
        const parameterName = parameterNameElt.value;
        
        const parameterDescElt = parameter.querySelector('.parameter-description');
        const parameterDesc = parameterDescElt.value;
        
        const parameterTypeElt = parameter.querySelector('.parameter-type');
        const parameterType = parameterTypeElt.value;
        
        properties[parameterName] = {
          description: parameterDesc,
          type: parameterType,
        };
        
        const parameterReqElt = parameter.querySelector('.parameter-required');
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
    const parameterItem = document.createElement('div');
    parameterItem.classList.add('parameter');
    
    const parameterHeader = document.createElement('div');
    parameterHeader.classList.add('parameter-header');
    parameterItem.appendChild(parameterHeader);
    
    // HEADER LEFT
    const parameterHeaderLeft = document.createElement('div');
    parameterHeader.appendChild(parameterHeaderLeft);
    
    const parameterNameHeader = document.createElement('h3');
    parameterNameHeader.innerHTML = 'Name';
    parameterHeaderLeft.appendChild(parameterNameHeader);
    
    const parameterNameField = document.createElement('input');
    parameterNameField.classList.add('parameter-name');
    parameterNameField.value = name;
    parameterHeaderLeft.appendChild(parameterNameField);
    
    // HEADER RIGHT
    const parameterHeaderRight = document.createElement('div');
    parameterHeader.appendChild(parameterHeaderRight);
    
    const parameterTypeHeader = document.createElement('h3');
    parameterTypeHeader.innerHTML = 'Type';
    parameterHeaderRight.appendChild(parameterTypeHeader);
    
    const parameterTypeField = document.createElement('select');
    parameterTypeField.classList.add('parameter-type');
    parameterHeaderRight.appendChild(parameterTypeField);
    
    _.forEach(['string', 'number'], typeStr => {
      const parameterOption = document.createElement('option');
      parameterOption.value = typeStr;
      parameterOption.innerHTML = typeStr;
      parameterTypeField.appendChild(parameterOption);
      
      if (value.type === typeStr) {
        parameterOption.setAttribute('selected', true);
      }
    });
    
    // HEADER BUTTONS
    const parameterHeaderButtons = document.createElement('div');
    parameterHeaderButtons.classList.add('parameter-header-buttons');
    
    const removeParameterButton = document.createElement('button');
    removeParameterButton.classList.add('remove-parameter');
    removeParameterButton.innerHTML = '×';
    removeParameterButton.addEventListener('click', event => {
      const parametersList = this.shadowRoot.querySelector('.parameters-list');
      parametersList.removeChild(parameterItem);
    });
    parameterHeaderButtons.appendChild(removeParameterButton);
    
    const requiredLabel = document.createElement('label');
    const requiredCheckbox = document.createElement('input');
    requiredCheckbox.classList.add('parameter-required');
    requiredCheckbox.type = 'checkbox';
    if (_.includes(required, name)) {
      requiredCheckbox.checked = true;
    }
    requiredLabel.appendChild(requiredCheckbox);
    
    const requiredLabelText = document.createTextNode(' Required');
    requiredLabel.appendChild(requiredLabelText);
    parameterHeaderButtons.appendChild(requiredLabel);
    
    parameterHeader.appendChild(parameterHeaderButtons);
    
    // DESCRIPTION
    const parameterDescHeader = document.createElement('h3');
    parameterDescHeader.innerHTML = 'Description';
    parameterItem.appendChild(parameterDescHeader);
    
    const parameterDescriptionField = document.createElement('input');
    parameterDescriptionField.classList.add('parameter-description');
    parameterDescriptionField.value = value.description;
    parameterItem.appendChild(parameterDescriptionField);
    
    return parameterItem;
  }
}

// Define the custom element
customElements.define('tool-editor', ToolEditor);
