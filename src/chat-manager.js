import OpenAI from 'openai';
import _ from 'lodash';

import * as Helpers from './helpers.js';

// General URL regex.
const urlRegex = /(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*/gi;
// Image url regex that also accounts for arbitrary URL parameters at the end.
const imageUrlRegex = /\bhttps?:\/\/\S+\.(jpg|jpeg|png|gif|svg)(\?\S*)?\b/gi;

export class ChatManager {
  constructor (state) {
    this.state = state;
    
    this.state.openAIApiKeyChanged = false;
    this.state.openai = null;
    this.state.messages = [];
    
    this.systemContextInput = document.querySelector('textarea#system-context');
    
    this.modelPicker = document.querySelector('select#model-picker');
    this.modelPicker.value = "gpt-4-turbo";
    this.modelPicker.addEventListener('change', this.onModelSelect.bind(this));
    
    this.visionDetailPicker = document.querySelector('select#vision-detail');
    this.visionDetailPicker.value = "low";
  }
  
  get currentModel () {
    return this.modelPicker.value;
  }
  
  get visionDetail () {
    return this.visionDetailPicker.value;
  }
  
  get isVisionModel () {
    const modelsWithVision = ['gpt-4-turbo', 'gpt-4-turbo-2024-04-09'];
    return modelsWithVision.includes(this.currentModel);
  }
  
  onModelSelect (event) {
    if (this.isVisionModel) {
      this.visionDetailPicker.removeAttribute('disabled');
    } else {
      this.visionDetailPicker.setAttribute('disabled', true);
    }
  }
  
  initializeOpenAI () {
    this.state.openai = new OpenAI({
      apiKey: this.state.apiKey,
      dangerouslyAllowBrowser: true
    });
    this.state.openAIApiKeyChanged = false;
  }
  
  detectImageUrls (str) {
    return str.match(urlRegex);
  }
  
  removeImageUrls (str) {
    return _.trim(str.replace(urlRegex, ""));
  }
  
  // Returns the proper "content" field for a user's message.
  // This takes into account image URls
  getUserMessageContent (prompt) {
    const imageUrls = this.detectImageUrls(prompt);
    const hasImageUrls = !_.isEmpty(imageUrls);
    
    if (hasImageUrls && this.isVisionModel) {
      console.log('Detected urls:', imageUrls);
      
      // Create the return value.
      const content = [
        { type: "text", text: prompt }
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
      return prompt;
    }
  }
  
  addSystemContext () {
    console.log("System context: ", this.systemContextInput.value);
    
    this.state.messages.push({
      role: 'system',
      content: this.systemContextInput.value
    });
    
    this.systemContextInput.setAttribute('disabled', true);
  }
  
  async submitPrompt (userPrompt) {
    const message = {
      role: 'user',
      content: this.getUserMessageContent(userPrompt),
    };
    
    await this.submitMessage(message);
  }
  
  async submitMessage (userMessage) {
    if (!this.state.openai || this.state.openAIApiKeyChanged) {
      this.initializeOpenAI();
    }
    
    if (_.isEmpty(this.state.messages)) {
      this.addSystemContext();
    }
    
    if (userMessage) {
      this.state.messages.push(userMessage);
      this.state.lastUserMessageElement = this.state.messagesManager.addMessageToList(userMessage);
      this.state.messagesManager.tagAsUserMessage(this.state.lastUserMessageElement);
    }
    
    console.log("Model:", this.currentModel);
    if (this.isVisionModel) {
      console.log("Vision detail:", this.visionDetail);
    }
    
    const tools = _.map(this.state.tools, 'schema');
    let content = '';
    let tool_calls = [];
    let id = null;
    let firstLoop = true;
    
    let completion
    try {
      const params = {
        model: this.currentModel,
        messages: this.state.messages,
        stream: true,
      };
      if (!_.isEmpty(tools)) {
        params.tools = tools;
      }
      
      completion = await this.state.openai.chat.completions.create(params);
    } catch (err) {
      console.error("There was an error chatting with OpenAI:", err);
      
      const errorMessage = {
        role: 'assistant',
        content: `An error occurred. ${err.name}. ${err.message}`,
      };
      
      this.state.messages.push(errorMessage);
      this.state.messagesManager.addMessageToList(errorMessage);
      return;
    }
    
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
          const messageElt = this.state.messagesManager.updateMessageInList(chunk.id, content);
          
          if (firstLoop) {
            const lastMessage = _.last(this.state.messages);
            if (lastMessage.role === "tool") {
              this.state.messagesManager.addArrowToMessage(messageElt, 'left');
            }
            firstLoop = false;
          }
        }
      }
    }
    
    if (!_.isEmpty(tool_calls)) {
      const toolCallsMessage = {
        'role': 'assistant',
        'content': null,
        tool_calls
      };
      
      this.state.messages.push(toolCallsMessage);
      
      if (this.state.lastUserMessageElement) {
        this.state.messagesManager.addArrowToMessage(this.state.lastUserMessageElement, 'right');
        this.state.lastUserMessageElement = null;
      }
      
      for await (const tool_call of tool_calls) {
        const function_name = tool_call.function.name;
        const function_args = JSON.parse(tool_call.function.arguments);
        
        const pseudoMessage1 = {
          id: tool_call.id,
          content: `**ƒ ${function_name}** → ${tool_call.function.arguments}`
        };
        this.state.messagesManager.addMessageToList(null, pseudoMessage1);
        
        const function_to_call = _.find(this.state.tools, t => t.name === function_name);
        
        const function_result = await function_to_call.call(function_args);
        
        const pseudoMessage2 = {
          id: tool_call.id + "-response",
          content: Helpers.prettyString(function_result)
        };
        this.state.messagesManager.addMessageToList(null, pseudoMessage2, true);
        
        const functionResponseMessage = {
          "tool_call_id": tool_call.id,
          "role": "tool",
          "name": function_name,
          "content": Helpers.stringify(function_result),
        };
        this.state.messages.push(functionResponseMessage);
      }
      
      // Handle this recursively for now.
      // TODO Put this in a loop instead?
      await this.submitMessage();
    } else {
      // No tool calls, so just deal with the current message.
      const message = {
        role: 'assistant',
        content,
      };
      
      this.state.messages.push(message);
    }
  }
}
