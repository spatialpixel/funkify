import OpenAI from 'openai';
import _ from 'lodash';

import * as Helpers from './helpers.js';


export class ChatManager {
  constructor (state) {
    this.state = state;
    
    this.state.openAIApiKeyChanged = false;
    this.state.openai = null;
    this.state.messages = [];
    this.state.followStreaming = false;
    
    this.systemContextInput = document.querySelector('textarea#system-context');
  }
  
  initializeOpenAI () {
    this.state.openai = new OpenAI({
      apiKey: this.state.apiKey,
      dangerouslyAllowBrowser: true
    });
    this.state.openAIApiKeyChanged = false;
  }
  
  async submitMessage (userMessage) {
    if (!this.state.openai || this.state.openAIApiKeyChanged) {
      this.initializeOpenAI();
    }
    
    if (_.isEmpty(this.state.messages)) {
      console.log("System context: ", this.systemContextInput.value);
      
      this.state.messages.push({
        role: 'system',
        content: this.systemContextInput.value
      });
      
      this.systemContextInput.setAttribute('disabled', true);
    }
    
    if (userMessage) {
      this.state.messages.push(userMessage);
      this.state.lastUserMessageElement = this.state.messagesManager.addMessageToList(userMessage);
    }
    
    const modelPicker = document.querySelector('select#model-picker');
    const currentModel = modelPicker.value;
    
    console.log("Model: ", currentModel);
    
    const tools = _.map(this.state.tools, 'schema');
    
    const completion = await this.state.openai.chat.completions.create({
      model: currentModel,
      messages: this.state.messages,
      tools,
      stream: true,
    });
    
    let content = '';
    let tool_calls = [];
    let id = null;
    let firstLoop = true;
    
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
          
          // Populate the target tool_call object.
          if (_.isEmpty(tool_calls[tool_call.index])) {
            tool_calls[tool_call.index] = {
              type: "function",
              function: {
                name: '',
                arguments: '',
              },
              id: null,
              index: tool_call.index
            };
          }
          
          // Populate the tool_call fields based on what we have in this current chunk.
          if (!_.isEmpty(tool_call.id)) {
            tool_calls[tool_call.index].id = tool_call.id;
          }
          if (!_.isEmpty(tool_call.function.name)) {
            tool_calls[tool_call.index].function.name += tool_call.function.name;
          }
          if (!_.isEmpty(tool_call.function.arguments)) {
            tool_calls[tool_call.index].function.arguments += tool_call.function.arguments;
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
