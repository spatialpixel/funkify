import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';

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
  
  renderMessage (message, data=null) {
    return this.delegate.renderMessage(message, data);
  }
  
  get isVisionModel () {
    const modelsWithVision = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'];
    return modelsWithVision.includes(this.currentModel);
  }
  
  initializeLLMService () {
    this.delegate.initializeLLMService();
  }
  
  // Construct the parameters for the coming call to the LLM service.
  get params () {
    const tr = {
      model: this.currentModel,
      messages: this.messages,
      stream: this.stream,
    };
    
    // Gather up all the available tools, if any.
    // This is typically an array of tool schemas, e.g. { type: 'function', ... }
    if (!_.isEmpty(this.tools)) {
      tr.tools = this.tools;
    }
    
    return tr;
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
  
  // Submit a prompt as a string to the chat manager.
  // This is preferred as it performs some preprocessing to look for things like image URLs.
  async submitPrompt (userPrompt) {
    const message = {
      role: 'user',
      content: this.getUserMessageContent(userPrompt),
    };
    
    return await this.submitMessage(message);
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
  
  // Submit a fully qualified message object to the chat manager.
  // For OpenAI, these are typically in the form of: { role: 'user', content: '' }
  async submitMessage (userMessage) {
    this.initializeLLMService();
    
    let messageElementId = this.prepareInitialMessageElement(userMessage);
    
    const completion = await this.prepareCompletionInstance();
    if (!completion) { return; }
    
    let { content, tool_calls } = await this.processCompletion(completion, messageElementId);
    
    if (_.isEmpty(tool_calls)) {
      const message = {
        role: 'assistant',
        content,
      };
      
      this.addMessage(message);
    } else {
      await this.processToolCalls(tool_calls);
      
      // TODO Handle this recursively for now. Put this in a loop instead?
      await this.submitMessage(null);
    }
  } // end submitMessage
  
  prepareInitialMessageElement (userMessage) {
    if (userMessage) {
      this.renderMessage(userMessage);
      this.addMessage(userMessage);
    }
    
    // TODO Add an assistant message-item after every submitted message?
    // This is needed after user → assistant and tool → assistant, but not user → tool.
    const pseudoMessage = {
      role: 'assistant',
      content: null
    };
    
    const assistantElt = this.renderMessage(pseudoMessage);
    return assistantElt.id;
  }
  
  async prepareCompletionInstance () {
    try {
      // Submit the completion request to the LLM service.
      return await this.delegate.createTextCompletion(this.params);
    } catch (err) {
      // TODO Is this really the right behavior during the instantiation of the completion object?
      const errorMessage = {
        role: 'assistant',
        content: `An error occurred. ${err.name}. ${err.message}`,
      };
      
      const errorElt = this.renderMessage(errorMessage);
      
      // As this isn't a real message from the assistant, we should probably ignore it.
      // this.addMessage(errorMessage);
      
      console.error(`An error occurred while creating the completion object:`, err);
      return null;
    }
  }
  
  async processCompletion (completion, targetElementId) {
    if (!this.stream) {
      return this.processNonStreamingCompletion(completion, targetElementId);
    } else {
      return await this.processStreamingCompletion(completion, targetElementId);
    }
  }
  
  processNonStreamingCompletion (completion, messageElementId) {
    const message = completion.choices[0].message;
    
    if (_.isEmpty(tool_calls)) {
      this.delegate.updateMessageInList(messageElementId, message.content);
    }
    
    return {
      content: message.content,
      tool_calls: message.tool_calls
    };
  }
  
  async processStreamingCompletion (completion, messageElementId) {
    let content = '';
    let tool_calls = [];
    
    // Process the streaming, if streaming was indicated.
    for await (const chunk of completion) {
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
      } else if (delta.content) {
        content += delta.content;
        
        const elt = this.delegate.updateMessageInList(messageElementId, content);
        if (elt.id !== messageElementId) {
          // This shouldn't happen, but if it does, let's ensure we have a real element to work with
          // on subsequent calls.
          console.warn(`Attempted to find element id = ${messageElementId} but didn't find it. Creating a new one with ${elt.id}`);
          messageElementId = elt.id;
        }
      } else {
        console.warn(`Got a streaming completion chunk with no content and no tool_calls?`, delta);
      }
    } // end chunk completion loop
    
    return { content, tool_calls };
  }
  
  async processToolCalls (tool_calls) {
    const toolCallsMessage = {
      role: 'assistant',
      content: null,
      tool_calls
    };
    
    this.addMessage(toolCallsMessage);
    
    for await (const tool_call of tool_calls) {
      const functionResponseMessage = await this.processToolCall(tool_call);
      this.addMessage(functionResponseMessage);
    }
  }
  
  async processToolCall (tool_call) {
    const function_name = tool_call.function.name;
    const function_args = JSON.parse(tool_call.function.arguments);
    const function_to_call = _.find(this.delegate.functions, t => t.name === function_name);
    
    // Package the result of the function call as a message object.
    const functionResponseMessage = {
      tool_call_id: tool_call.id,
      role: 'tool',
      name: function_name,
    };
    
    let functionElement = null;
    
    let function_result
    if (!function_to_call) {
      console.error(`Function call ${function_name} not found. Returning null.`)
      function_result = null;
    } else {
      console.debug(`Calling function ${function_name} with arguments:`, function_args);
      
      // Add the message to the list in case we want to indicate the function call.
      // The delegate can ignore these.
      functionElement = this.renderMessage(functionResponseMessage, function_args);
      
      // Perform the function call.
      function_result = await function_to_call.call(function_args, this.state);
    }
    
    functionResponseMessage.content = Helpers.stringify(function_result);
    
    if (functionElement) {
      this.delegate.updateMessageInList(functionElement.id, functionResponseMessage.content);
    }
    
    return functionResponseMessage;
  }
}
