import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';

export default class FunctionTool {
  constructor (id, name, description, properties, required, f, language) {
    this.id = id;
    this.name = name;
    this.description = description;
    
    this.properties = properties;
    this.required = required;
    
    this.f = f;
    
    this.language = language || 'js';
  }
  
  applyDefaults (args) {
    // Default all values to null or None so we don't run into undefined errors.
    const defaults = _.mapValues(this.properties, () => null);
    return _.defaults(args, defaults);
  }
  
  async call (args, state) {
    const argsWithDefaults = this.applyDefaults(args);
    
    if (this.language === 'js') {
      return await this.callJavaScript(argsWithDefaults, state);
    } else if (this.language === 'py') {
      return await this.callPython(argsWithDefaults, state);
    }
  }
  
  async callJavaScript (args, state) {
    const body = `return async () => {
${ this.f }
}`;
    
    let result
    try {
      const globals = {
        openai: state.openai
      };
      
      // TODO "args" is deprecated, but included here until the tutorials are updated.
      const argKeys = ['args', 'globals'];
      const argValues = [args, globals];
      
      _.forEach(args, (argValue, argKey) => {
        argKeys.push(argKey);
        argValues.push(argValue);
      });
      
      const callable = new Function(...argKeys, body);
      result = await callable(...argValues)();
    } catch (err) {
      console.error('Error in Function call:', err);
      result = err;
    }
    
    return result;
  }
  
  async callPython (args, state) {
    // https://pyodide.org/en/stable/usage/faq.html#how-can-i-execute-code-in-a-custom-namespace
    const namespace = state.pyodide.toPy(args);
    const result = state.pyodide.runPythonAsync(this.f, { globals: namespace });
    return result;
  }
  
  get schema () {
    return {
      'type': 'function',
      'function': {
        'name': this.name,
        'description': this.description,
        'parameters': {
          'type': 'object',
          'properties': this.properties,
          'required': this.required,
        }
      }
    }
  }
  
  get json () {
    return {
      implementation: this.f,
      schema: this.schema,
      language: this.language,
    }
  }
  
  save () {
    const value = JSON.stringify(this.json);
    localStorage.setItem(this.id, value);
  }
}

FunctionTool.factory = () => {
  const name = 'new_function';
  const description = "A stub function that returns dummy data."
  const id = 'funkify-tool-' + uuidv4();
  const parameters = {};
  const required = [];

  const f = `// Just the function body here. "await" is supported.

return "Success";`;
  const language = 'js';
  
  const tr = new FunctionTool(id, name, description, parameters, required, f, language);
  return tr;
}

FunctionTool.parse = (data, key) => {
  try {
    const id = key;
    const name = data.schema.function.name;
    const description = data.schema.function.description;
    const properties = data.schema.function.parameters.properties;
    const required = data.schema.function.parameters.required;
    const f = data.implementation;
    const language = data.language;
    
    return new FunctionTool(id, name, description, properties, required, f, language);
  } catch (err) {
    console.error(`Error while parsing function:`, err)
    return null;
  }
}

FunctionTool.loadAllFromLocalStorage = () => {
  const tr = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    try {
      const key = localStorage.key(i);
      const isFunkifyTool = _.startsWith(key, 'funkify-tool-');
      
      if (isFunkifyTool) {
        const toolJson = localStorage.getItem(key);
        const toolData = JSON.parse(toolJson);
        const tool = FunctionTool.parse(toolData, key);
        tr.push(tool);
      }
    } catch (err) {
      console.error(`Error while parsing a tool from localStorage:`, err);
    }
  }
  
  return tr;
}

FunctionTool.removeFromLocalStorage = tool => {
  localStorage.removeItem(tool.id);
}
