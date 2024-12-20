import _ from 'lodash';
import { basicSetup, EditorView } from "codemirror";
import { EditorState, Compartment } from "@codemirror/state";
import { language } from "@codemirror/language"
import { javascript } from "@codemirror/lang-javascript"

const languageConf = new Compartment // Some codemirror thing.

class ToolEditor extends HTMLElement {
  constructor() {
    super();
    
    const template = document.querySelector('#tool-editor-template');
    const templateContent = template.content;

    // Create shadow DOM and append template
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.appendChild(templateContent.cloneNode(true));
  }
  
  connectedCallback () {
    const closeButton = this.shadowRoot.querySelector('button.tool-editor-closer');
    closeButton.addEventListener('click', this.close.bind(this));
    
    const saveButton = this.shadowRoot.querySelector('button.tool-save');
    saveButton.addEventListener('click', this.save.bind(this));
    
    const addParameterButton = this.shadowRoot.querySelector('button.add-parameter');
    addParameterButton.addEventListener('click', this.addParameter.bind(this));
  }
  
  initialize (state) {
    this.state = state;
  }
  
  save (event) {
    const functionNameField = this.shadowRoot.querySelector('.function-name-field');
    this.tool.name = functionNameField.value;
    
    const functionDescriptionField = this.shadowRoot.querySelector('.function-description-field');
    this.tool.description = functionDescriptionField.value;
    
    this.tool.f = this.getEditorContents();
    
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
      // Parse array types.
      if (parameterType === "array-number") {
        properties[parameterName].type = "array";
        properties[parameterName].items = { type: "number" };
      }
      if (parameterType === "array-string") {
        properties[parameterName].type = "array";
        properties[parameterName].items = { type: "string" };
      }
      
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
    
    this.state.toolsList.save();
    this.close();
  }
  
  addParameter (event) {
    const value = {
      'type': 'string',
      'description': ''
    };
    
    const name = '';
    const param = this.renderParameterForm(value, name);
    const parametersList = this.shadowRoot.querySelector('.parameters-list');
    parametersList.appendChild(param);
    
    param.parameterNameField.focus();
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
    
    // Clear the editor
    this.clearEditor();
    
    // Remove the reference to the last tool.
    this.tool = null;
  }
  
  show () {
    const toolEditorElt = this.shadowRoot.host;
    toolEditorElt.style.display = 'block';
  }

  editTool (tool, isNewFunction = false) {
    this.tool = tool;
    
    this.show();
    
    const functionNameField = this.shadowRoot.querySelector('.function-name-field');
    functionNameField.value = this.tool.name;
    
    const functionDescriptionField = this.shadowRoot.querySelector('.function-description-field');
    functionDescriptionField.value = this.tool.description;
    
    const parametersList = this.shadowRoot.querySelector('.parameters-list');
    _.forEach(tool.properties, (value, name) => {
      const param = this.renderParameterForm(value, name, this.tool.required);
      parametersList.appendChild(param);
    });
    
    this.populateEditor();
    
    if (isNewFunction) {
      this.focusFunctionNameField();
    }
  }
  
  focusFunctionNameField () {
    const functionNameField = this.shadowRoot.querySelector('.function-name-field');
    functionNameField.focus();
  }
  
  populateEditor () {
    if (!this.tool) { return; }
    
    if (!this.editorView) {
      this.createEditor(this.tool.f);
    }
    
    this.setEditorContents(this.tool.f);
  }
  
  createEditor (text = "") {
    this.editorContainer = this.shadowRoot.querySelector('#function-implementation');
    
    this.editorTheme = EditorView.baseTheme({
      "&": {
        fontSize: "20px",
      },
      "&.cm-focused": {
        outline: "none",
      },
    });
    
    this.editorView = new EditorView({
      doc: text,
      extensions: [
        basicSetup,
        this.editorTheme,
        languageConf.of(javascript()),
        EditorView.lineWrapping,
      ],
      parent: this.editorContainer
    });
  }
  
  setEditorContents (text) {
    this.editorView.setState(EditorState.create({
      doc: text,
      extensions: [
        basicSetup,
        languageConf.of(javascript()),
        EditorView.lineWrapping,
      ]
    }));
  }
  
  getEditorContents () {
    return this.editorView.state.doc.toString();
  }
  
  clearEditor () {
    this.setEditorContents("");
  }
  
  renderParameterForm (value, name, required) {
    const parameterItem = document.createElement('parameter-item');
    parameterItem.populate(value, name, required);
    return parameterItem;
  }
}

customElements.define('tool-editor', ToolEditor);
