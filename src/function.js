export class FunctionTool {
  constructor (id, name, description, properties, required, f) {
    this.id = id;
    this.name = name;
    this.description = description;
    
    this.properties = properties;
    this.required = required;
    
    this.f = f;
  }
  
  async call (args) {
    const body = `return async () => { ${this.f} }`
    
    let result
    try {
      const callable = new Function('args', body);
      result = await callable(args)();
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
}
