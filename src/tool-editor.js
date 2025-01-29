import _ from 'lodash';
import { basicSetup, EditorView } from "codemirror";
import { EditorState, Compartment } from "@codemirror/state";
import { language, indentUnit } from "@codemirror/language";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";

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
    this.closeButton = this.shadowRoot.querySelector('button.tool-editor-closer');
    this.closeButton.addEventListener('click', this.close.bind(this));
    
    this.saveButton = this.shadowRoot.querySelector('button.tool-save');
    this.saveButton.addEventListener('click', this.save.bind(this));
    
    this.addParameterButton = this.shadowRoot.querySelector('button.add-parameter');
    this.addParameterButton.addEventListener('click', this.addParameter.bind(this));
    
    this.functionNameField = this.shadowRoot.querySelector('.function-name-field');
    this.functionDescriptionField = this.shadowRoot.querySelector('.function-description-field');
    this.languageSelect = this.shadowRoot.querySelector('select#language-selection');
    this.parametersList = this.shadowRoot.querySelector('.parameters-list');
  }
  
  initialize (state) {
    this.state = state;
  }
  
  save (event) {
    this.tool.name = this.functionNameField.value;
    this.tool.description = this.functionDescriptionField.value;
    this.tool.language = this.languageSelect.value;
    
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
    this.parametersList.appendChild(param);
    
    param.parameterNameField.focus();
  }
  
  close () {
    const toolEditorElt = document.querySelector('tool-editor');
    toolEditorElt.style.display = 'none';
    
    // Clear the function name field.
    this.functionNameField.value = '';
    
    // Clear the function description field.
    this.functionDescriptionField.value = '';
    
    // Remove all the parameters.
    this.parametersList.innerHTML = '';
    
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
    
    this.functionNameField.value = this.tool.name;
    this.functionDescriptionField.value = this.tool.description;
    this.languageSelect.value = this.tool.language;
    
    _.forEach(tool.properties, (value, name) => {
      const param = this.renderParameterForm(value, name, this.tool.required);
      this.parametersList.appendChild(param);
    });
    
    this.populateEditor();
    
    if (isNewFunction) {
      this.functionNameField.focus();
    }
  }
  
  populateEditor () {
    if (!this.tool) { return; }
    
    if (!this.editorView) {
      this.createEditor(this.tool.f, this.tool.language);
    }
    
    this.setEditorContents(this.tool.f, this.tool.language);
  }
  
  createEditor (text="", lang="js") {
    this.editorContainer = this.shadowRoot.querySelector('#function-implementation');
    
    this.editorTheme = EditorView.baseTheme({
      "&": {
        fontSize: "20px",
      },
      "&.cm-focused": {
        outline: "none",
      },
    });
    
    const languagePackage = this.getEditorLanguagePackage(lang);
    
    this.editorView = new EditorView({
      doc: text,
      extensions: [
        basicSetup,
        this.editorTheme,
        languagePackage,
        EditorView.lineWrapping,
      ],
      parent: this.editorContainer
    });
  }
  
  getEditorLanguagePackage (lang="js") {
    if (lang === "js") {
      return languageConf.of(javascript());
    } else if (lang === "py") {
      return languageConf.of(python());
    } else {
      return languageConf.of(javascript());
    }
  }
  
  setEditorContents (text, lang="js") {
    const languagePackage = this.getEditorLanguagePackage(lang);
    
    this.editorView.setState(EditorState.create({
      doc: text,
      extensions: [
        basicSetup,
        languagePackage,
        EditorView.lineWrapping,
        indentUnit.of("    "), // Set indent unit to 4 spaces
        keymap.of([{
          key: "Tab",
          run: (target) => {
            // Insert 4 spaces when nothing is selected
            if (target.state.selection.ranges.every(r => r.empty)) {
              target.dispatch(target.state.replaceSelection("    "));
              return true;
            }
            // Use default indentation for selections
            return indentWithTab(target);
          }
        }])
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
