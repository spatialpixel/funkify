/**
 * @module Procession.ChatManagerDelegate
 * @description  This delegate class includes customizable methods for the ChatManager. Extend this, implement the requisite methods, then pass the instance to the ChatManager instance.
 * @author William Martin
 * @version 0.1.0
 */


export class ChatManagerDelegate {
  constructor () {
    // Whatever
  }
  
  get currentModel () {
    return 'gpt-4o';
  }
  
  get visionDetail () {
    return 'low';
  }
  
  get systemContext () {
    return 'You are a helpful assistant'
  }
  
  // Returns the tools schema defined by the OpenAI API.
  get tools () {
    return [];
  }
  
  // Returns an object where keys are function names from 'tools' and the values
  // are objects with at least an async call() method to return the value to the chat.
  get functions () {
    return {};
  }
  
  // Returns the list of currently managed messages.
  // This accessor is expected to manage the role: 'system' message.
  get messages () {
    // Sample implementation with lodash and a this._messages private field.
    // const messagesHaveSystemContext = _.chain(this._messages).map('role').includes('system').value();
    // if (!messagesHaveSystemContext) {
    //   this._messages.unshift(this.systemMessage);
    // }
    // return this._messages;
    throw new Error('required method');
  }
  
  // Adds the message to the managed messages.
  // This might just be an array, but it could be managed by a Project object or similar.
  addMessage (message, elementId=null) {
    // Sample implementation.
    // this._messages.push(message);
    throw new Error('required method');
  }
  
  // Ensures we have a way of cleaning up a user's prompt if need be. This can be for removing
  // special symbols, checking a blacklist of words, etc.
  // Should accept a string and return a string.
  sanitizeUserPrompt (prompt) {
    return prompt;
  }
  
  renderMessage (message, data=null) {
    // Update the UI that shows the list of messages.
    // Should return the HTML element used to display the message.
  }
  
  updateMessageInList (id, content) {
    // Update the UI representing the identified message.
    // Should return the HTML element used to display the message.
  }
  
  get supportsImages () {
    return false;
  }
  
  // Stream messages when submitted?
  get stream () {
    return false;
  }
  
  // Used at the start of every message to initialize the LLM service, like
  // OpenAI, HuggingFace, Azure, etc.
  // Should be idempotent when necessary.
  initializeLLMService () {
    throw new Error('required method');
  }
  
  // Creates a completion object.
  createTextCompletion (params) {
    throw new Error('required method')
  }
  
  preprocessMessage (message) {
    
  }
  
  get includeToolsAfterFunctionCalls () {
    return true;
  }
}
