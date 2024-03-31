import './style.css';
import './dropdown-menu.js';
import './tools-list.js';
import './tool-editor.js';
import './parameter-item.js';
import * as Interface from './interface.js';
import { FunctionTool } from './function.js';

import OpenAI from 'openai';
import _ from 'lodash';
import { marked } from 'marked';
import { v4 as uuidv4 } from 'uuid';

let state;

if (document.readyState === 'complete') {
  onReady();
} else {
  document.addEventListener("DOMContentLoaded", onReady);
}

function onReady () {
  state = new State();
  state.messages = [
    {
      role: 'system',
      content: 'You are a helpful assistant.'
    }
  ];
  
  const f = `const url = \`https://api.open-meteo.com/v1/forecast?latitude=\${args.latitude}&longitude=\${args.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,rain,showers,snowfall\`;

const result = await fetch(url);
const response = await result.json();

return response;`
  
  state.tools = [
    new FunctionTool(
      'bf194fe8-66eb-4510-9bcf-b80cb7017618',
      'get_current_weather',
      'Tells the current weather given a location',
      {
        'location': {
          'type': 'string',
          'description': 'The location the user is asking about.'
        },
        
        'latitude': {
          'type': 'number',
          'description': 'The latitude of the location the user is asking about.'
        },
        
        'longitude': {
          'type': 'number',
          'description': 'The longitude of the location the user is asking about.'
        }
      },
      ['latitude', 'longitude'],
      f
    )
  ];
  
  state.openAIApiKeyChanged = false;
  state.openai = null;
  
  state.chatHandler = new ChatHandler();
  
  initializePrompt();
  focusPrompt();
  
  Interface.initializeTextInput('#openai-api-key', apiKeyHandler, defaultApiKeyGetter);
  // initializeTextInput does not call the setter by default.
  state.apiKey = defaultApiKeyGetter();
  
  const toolsList = document.querySelector('tools-list');
  toolsList.populate(state);
}

function initializeOpenAI () {
  state.openai = new OpenAI({
    apiKey: state.apiKey,
    dangerouslyAllowBrowser: true
  });
  state.openAIApiKeyChanged = false;
}

function apiKeyHandler (value, event) {
  state.apiKey = value;
  state.openAIApiKeyChanged = true;
  localStorage.setItem('funky-openai-api-key', state.apiKey);
}

function defaultApiKeyGetter () {
  return localStorage.getItem('funky-openai-api-key');
}

function initializePrompt () {
  const promptArea = document.querySelector("textarea#prompt");
  
  promptArea.addEventListener('keydown', async event => {
    if (event.key === "Enter") {
      const modified = event.metaKey || event.ctrlKey;
      
      if (modified) {
        event.preventDefault();
        const content = promptArea.value;
        
        console.log("Submit:", content);
        
        const message = {
          role: 'user',
          content,
        };
        
        disablePrompt();
        await state.chatHandler.submitMessage(message);
        enablePrompt();
        clearPrompt();
        focusPrompt();
      }
    }
  });
  
  promptArea.addEventListener('input', event => {
    promptArea.style.height = "auto"; // Reset height to auto
    promptArea.style.height = Math.min(promptArea.scrollHeight, 250) + "px"; // Set height to content height
  });
}

function disablePrompt () {
  const promptArea = document.querySelector("textarea#prompt");
  promptArea.setAttribute('disabled', true);
}

function enablePrompt () {
  const promptArea = document.querySelector("textarea#prompt");
  promptArea.removeAttribute('disabled');
}

function clearPrompt () {
  const promptArea = document.querySelector("textarea#prompt");
  promptArea.value = '';
}

function focusPrompt () {
  const promptArea = document.querySelector("textarea#prompt");
  promptArea.focus();
}

function addMessageToList (message, rightMessage) {
  const messagesList = document.querySelector('#messages-list');
  
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');
  messageDiv.id = message?.id || rightMessage?.id || uuidv4();
  
  const leftDiv = document.createElement('div');
  leftDiv.classList.add('left');
  messageDiv.appendChild(leftDiv);
  
  const rightDiv = document.createElement('div');
  rightDiv.classList.add('right');
  messageDiv.appendChild(rightDiv);
  
  if (message) {
    leftDiv.innerHTML = marked.parse(message.content);
  } else {
    leftDiv.innerHTML = '&nbsp;';
  }
  if (rightMessage) {
    rightDiv.innerHTML = marked.parse(rightMessage.content);
  }
  
  messagesList.appendChild(messageDiv);
  
  return messageDiv;
}

function updateMessageInList (id, content) {
  let messageDiv = document.querySelector(`#${id}`);
  if (!messageDiv) {
    messageDiv = addMessageToList({ id, content });
  }
  
  const leftDiv = messageDiv.querySelector(`.left`);
  leftDiv.innerHTML = marked.parse(content);
}

class ChatHandler {
  constructor () {
    
  }
  
  async submitMessage (userMessage) {
    if (!state.openai || state.openAIApiKeyChanged) {
      initializeOpenAI();
    }
    
    if (userMessage) {
      state.messages.push(userMessage);
      addMessageToList(userMessage);
    }
    
    const tools = _.map(state.tools, 'schema');
    
    const completion = await state.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: state.messages,
      tools,
      stream: true,
    });
    
    let content = '';
    let tool_calls = [];
    let id = null;
    
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
          updateMessageInList(chunk.id, content);
        }
      }
    }
    
    if (!_.isEmpty(tool_calls)) {
      const toolCallsMessage = {
        'role': 'assistant',
        'content': null,
        tool_calls
      };
      
      state.messages.push(toolCallsMessage);
      
      for await (const tool_call of tool_calls) {
        const function_name = tool_call.function.name;
        const function_args = JSON.parse(tool_call.function.arguments);
        
        const pseudoMessage1 = {
          id: tool_call.id,
          content: `ƒ ${function_name} → ${tool_call.function.arguments}`
        };
        addMessageToList(null, pseudoMessage1);
        
        const function_to_call = _.find(state.tools, t => t.name === function_name);
        
        const function_result = await function_to_call.call(function_args);
        
        const pseudoMessage2 = {
          id: tool_call.id + "-response",
          content: prettyString(function_result)
        };
        addMessageToList(null, pseudoMessage2);
        
        const functionResponseMessage = {
          "tool_call_id": tool_call.id,
          "role": "tool",
          "name": function_name,
          "content": stringify(function_result),
        };
        
        state.messages.push(functionResponseMessage);
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
      
      state.messages.push(message);
    }
  }
}

function prettyString (function_result) {
  let stringified_result
  if (_.isObject(function_result)) {
    stringified_result = JSON.stringify(function_result, null, 2);
  } else if (_.isString(function_result)) {
    stringified_result = function_result;
  } else {
    stringified_result = _.toString(function_result);
  }
  return stringified_result;
}

function stringify (function_result) {
  let stringified_result
  if (_.isObject(function_result)) {
    stringified_result = JSON.stringify(function_result);
  } else if (_.isString(function_result)) {
    stringified_result = function_result;
  } else {
    stringified_result = _.toString(function_result);
  }
  return stringified_result;
}


class State {
  constructor () {
    this._state = {};
    
    this.handler = {
      get: (target, key) => {
        console.log(`Getting property '${key}'`);
        return target[key];
      },
      
      set: (target, key, value) => {
        console.log(`Setting property '${key}' to '${value}'`);
        
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
