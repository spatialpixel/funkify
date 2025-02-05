export class State {
  constructor () {
    this._state = {};
    
    this.handler = {
      get: (target, key) => {
        //console.debug(`Getting property '${key}'`);
        return target[key];
      },
      
      set: (target, key, value) => {
        //console.debug(`Setting property '${key}' to '${value}'`);
        
        // TODO: To be used later.
        // Send a change event.
        const customEvent = new CustomEvent('StateUpdate', {
          detail: {
            key,
            value,
            oldValue: target[key]
          }
        });
        
        // Dispatching the custom event on a target element or document
        document.dispatchEvent(customEvent);
        
        target[key] = value;
        return true; // Indicate success
      }
    };
    
    return new Proxy(this._state, this.handler);
  }
}
