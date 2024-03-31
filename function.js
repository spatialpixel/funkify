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
    const callable = new Function('args', body);
    return await callable(args)();
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
