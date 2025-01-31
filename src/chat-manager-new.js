import _ from 'lodash';

import * as Interface from './interface.js';
import * as Helpers from './helpers.js';

// General URL regex.
const urlRegex = /(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*/gi;
// Image url regex that also accounts for arbitrary URL parameters at the end.
const imageUrlRegex = /\bhttps?:\/\/\S+\.(jpg|jpeg|png|gif|svg)(\?\S*)?\b/gi;


export class ChatManager {
  constructor (state, delegate) {
    this.state = state;
    this.delegate = delegate;
    
    this.state.shouldLimitHistory = false;
    this.experimentalLimitedHistory = document.querySelector('#experiment-limited-history');
    Interface.initializeCheckbox('#experiment-limited-history', (checked, event) => {
      console.debug(`Experimental feature: limit chat history? ${checked}`);
      this.state.shouldLimitHistory = checked;
    });
  }
  
  get currentModel () {
    return this.delegate.currentModel;
  }
  
  get visionDetail () {
    return this.delegate.visionDetail;
  }
  
  get systemContext () {
    return this.delegate.systemContext;
  }
  
  get messages () {
    return this.delegate.messages;
  }
  
  get tools () {
    return this.delegate.tools;
  }
  
  get stream () {
    return this.delegate.stream;
  }
  
  addMessage (message, id) {
    this.delegate.addMessage(message, id);
  }
  
  addMessageToList (message, data=null) {
    return this.delegate.addMessageToList(message, data);
  }
  
  get isVisionModel () {
    const modelsWithVision = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'];
    return modelsWithVision.includes(this.currentModel);
  }
  
  initializeLLMService () {
    this.delegate.initializeLLMService();
  }
  
  get supportsImages () {
    return this.delegate.supportsImages;
  }
  
  detectImageUrls (str) {
    return str.match(urlRegex);
  }
  
  removeImageUrls (str) {
    return _.trim(str.replace(urlRegex, ""));
  }
  
  // Returns the proper "content" field for a user's message.
  // This sanitizes the input (according to the delegate implementation) and takes 
  // into account image URLs.
  getUserMessageContent (prompt) {
    const sanitizedPrompt = this.delegate.sanitizeUserPrompt(prompt);
    
    if (!this.supportsImages) { return sanitizedPrompt; }
    
    const imageUrls = this.detectImageUrls(sanitizedPrompt);
    const hasImageUrls = !_.isEmpty(imageUrls);
    
    if (hasImageUrls && this.isVisionModel) {
      console.debug('Detected urls:', imageUrls);
      
      // Create the return value.
      const content = [
        { type: "text", text: sanitizedPrompt }
      ];
      
      // For each image URL, add a part to the content.
      // https://platform.openai.com/docs/guides/vision
      imageUrls.forEach(url => {
        const part = {
          type: "image_url",
          image_url: {
            url: url,
            detail: this.visionDetail,
          }
        };
        
        content.push(part);
      });
      
      return content;
    } else {
      return sanitizedPrompt;
    }
  }
  
  // Submit a prompt as a string to the chat manager.
  // This is preferred as it performs some preprocessing to look for things like image URLs.
  async submitPrompt (userPrompt) {
    const message = {
      role: 'user',
      content: this.getUserMessageContent(userPrompt),
    };
    
    return await this.submitMessage(message);
  }
  
  // Submit a fully qualified message object to the chat manager.
  // For OpenAI, these are typically in the form of: { role: 'user', content: '' }
  async submitMessage (userMessage) {
    this.initializeLLMService();
    
    if (userMessage) {
      const messageElt = this.addMessageToList(userMessage);
      this.addMessage(userMessage, messageElt?.id);
    }
    
    let completion
    try {
      // Construct the parameters for the coming call to the LLM service.
      const params = {
        model: this.currentModel,
        messages: this.messages,
        stream: this.stream,
      };
      
      // Gather up all the available tools, if any.
      // This is typically an array of tool schemas, e.g. { type: 'function', ... }
      if (!_.isEmpty(this.tools)) {
        params.tools = this.tools;
      }
      
      // Submit the completion request to the LLM service.
      completion = await this.delegate.createCompletion(params);
    } catch (err) {
      // TODO Is this really the right behavior during the instantiation of the completion object?
      const errorMessage = {
        role: 'assistant',
        content: `An error occurred. ${err.name}. ${err.message}`,
      };
      
      const errorElt = this.addMessageToList(errorMessage);
      this.addMessage(errorMessage, errorElt.id);
      return errorMessage;
    }
    
    // Process the streaming, if streaming was indicated.
    let id = null;
    let content = '';
    let tool_calls = [];
    
    if (!this.stream) {
      id = completion.id;
      const message = completion.choices[0].message;
      content = message.content;
      tool_calls = message.tool_calls;
      
      if (_.isEmpty(tool_calls)) {
        this.delegate.updateMessageInList(id, content);
      }
    } else {
      for await (const chunk of completion) {
        if (!id) { id = chunk.id; }
        
        const choice = chunk.choices[0];
        if (choice.finish_reason === "tool_calls") { break; }
        
        // When streaming, there is a "delta" object instead of a "message" object.
        const delta = choice.delta;
        
        // We can cue tool_calls from the 'delta' field.
        if (!delta.content && _.isArray(delta.tool_calls)) {
          
          // delta.tool_calls will be an array that has also chunks we need to combine.
          for (const tool_call of delta.tool_calls) {
            const index = tool_call.index;
            
            // Populate the target tool_call object.
            if (_.isEmpty(tool_calls[index])) {
              tool_calls[index] = {
                type: "function",
                function: {
                  name: '',
                  arguments: '',
                },
                id: null,
              };
            }
            
            // Populate the tool_call fields based on what we have in this current chunk.
            if (!_.isEmpty(tool_call.id)) {
              tool_calls[index].id = tool_call.id;
            }
            if (!_.isEmpty(tool_call.function.name)) {
              tool_calls[index].function.name += tool_call.function.name;
            }
            if (!_.isEmpty(tool_call.function.arguments)) {
              tool_calls[index].function.arguments += tool_call.function.arguments;
            }
          }
        } else {
          if (delta.content) {
            content += delta.content;
            this.delegate.updateMessageInList(chunk.id, content);
          }
        }
      } // end chunk completion loop
    }
    
    if (!_.isEmpty(tool_calls)) {
      const toolCallsMessage = {
        'role': 'assistant',
        'content': null,
        tool_calls
      };
      
      this.addMessage(toolCallsMessage);
      
      for await (const tool_call of tool_calls) {
        const function_name = tool_call.function.name;
        const function_args = JSON.parse(tool_call.function.arguments);
        const function_to_call = _.find(this.delegate.functions, t => t.name === function_name);
        
        let function_result
        if (!function_to_call) {
          console.error(`Function call ${function_name} not found. Returning null.`)
          function_result = null;
        } else {
          console.debug(`Calling function ${function_name} with arguments:`, function_args);
          // Perform the function call.
          function_result = await function_to_call.call(function_args, this.state);
        }
        
        // Package the result of the function call as a message object.
        const functionResponseMessage = {
          "tool_call_id": tool_call.id,
          "role": "tool",
          "name": function_name,
          "content": Helpers.stringify(function_result),
        };
        
        const toolElt = this.addMessageToList(functionResponseMessage, function_args);
        this.addMessage(functionResponseMessage, toolElt.id);
      }
      
      // Handle this recursively for now.
      // TODO Put this in a loop instead?
      return await this.submitMessage(null);
    } else {
      // No tool calls, so just deal with the current message.
      const message = {
        role: 'assistant',
        content,
      };
      
      this.addMessage(message, id);
      return message;
    } // end tool_calls check
  } // end submitMessage
}
