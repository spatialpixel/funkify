import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';

export default class FunctionTool {
  constructor (id, name, description, properties, required, f) {
    this.id = id;
    this.name = name;
    this.description = description;
    
    this.properties = properties;
    this.required = required;
    
    this.f = f;
  }
  
  async call (args, openai) {
    const body = `return async () => { ${this.f} }`;
    
    let result
    try {
      const globals = {
        openai
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
  
  const tr = new FunctionTool(id, name, description, parameters, required, f);
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
    
    return new FunctionTool(id, name, description, properties, required, f);
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
