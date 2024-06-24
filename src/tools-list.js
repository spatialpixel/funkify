import _ from 'lodash';
import FunctionTool from './function.js';
import examples from './example-functions.js';

class ToolsList extends HTMLElement {
  constructor() {
    super();

    const template = document.getElementById('tools-list-template');
    const templateContent = template.content;

    // Create shadow DOM and append template
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.appendChild(templateContent.cloneNode(true));
  }
  
  connectedCallback () {
    this.toolsListElement = this.shadowRoot.querySelector('.tools-list-main');
    this.toolsExporter = this.shadowRoot.querySelector('#exporter');
  }
  
  get tools () {
    return this.state?.tools;
  }

  populate (state) {
    this.state = state;
    
    this.loadToolsFromLocalStorage();
    
    const populateExampleFunctions = document.querySelector("#populate-example-functions");
    populateExampleFunctions.addEventListener('click', this.populateExampleFunctions.bind(this));
    
    const createFunctionButton = this.shadowRoot.querySelector('button.new-function');
    createFunctionButton.addEventListener('click', this.createFunction.bind(this));
    
    this.tools.map(this.addToolItem.bind(this));
  }
  
  loadToolsFromLocalStorage () {
    this.state.tools = FunctionTool.loadAllFromLocalStorage();
    this.populateExportWindow();
    
    if (_.isEmpty(this.state.tools)) {
      this.showExamplesNotice();
    }
  }
  
  showExamplesNotice () {
    this.examplesNotice = document.createElement('p');
    this.examplesNotice.classList.add('notice');
    this.examplesNotice.innerHTML = `No functions yet.
      You can add some examples under Settings → Populate with example functions.
      Create a new function by clicking ƒ above.`;
    this.toolsListElement.appendChild(this.examplesNotice);
  }
  
  save () {
    for (const tool of this.state.tools) {
      tool.save();
    }
    this.populateExportWindow();
  }
  
  populateExportWindow () {
    const schema = _.map(this.tools, 'schema');
    const schemaJson = JSON.stringify(schema, null, 2);
    this.toolsExporter.value = schemaJson;
  }
  
  clearNotice () {
    if (this.examplesNotice) {
      this.examplesNotice.remove();
      this.examplesNotice = null;
    }
  }
  
  populateExampleFunctions (event) {
    this.clearNotice();
    
    const newExamples = examples();
    for (const example of newExamples) {
      this.state.tools = _.concat(this.state.tools, newExamples);
    }
    
    this.refresh();
    this.save();
  }
  
  createFunction (event) {
    const newFunction = FunctionTool.factory();
    this.state.tools.push(newFunction);
    
    this.addToolItem(newFunction);
    newFunction.save();
    
    this.clearNotice();
    
    this.state.toolEditor.editTool(newFunction, true);
  }
  
  addToolItem (tool) {
    const toolItem = document.createElement('tool-item');
    this.toolsListElement.appendChild(toolItem);
    toolItem.initialize(tool, this);
    return toolItem;
  }
  
  // Refresh to sync up state.tools with the list of tool-items.
  // TODO Remove any tool-items not found in state.tools.
  refresh () {
    for (const tool of this.tools) {
      let toolItem = this.shadowRoot.querySelector(`#${tool.id}`);
      
      if (!toolItem) {
        // No item found with that ID, so create a new one.
        toolItem = this.addToolItem(tool);
      }
      
      toolItem.refresh();
    }
  }
}

// Define the custom element
customElements.define('tools-list', ToolsList);