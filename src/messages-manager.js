/**
 * @module SpatialPixel.Funkify.MessageList
 * @description Implementation for Funkify's rendering of chat messages.
 * @author William Martin
 * @version 0.1.0
 */


export default class MessagesManager {
  constructor (state) {
    this.state = state;
    
    this.state.followStreaming = true;
    
    this.messagesList = document.querySelector("#messages-list");
    this.scrollable = document.querySelector('.scrollable');
  }
  
  renderMessage (message, data=null) {
    const messageItem = document.createElement('message-item');
    this.messagesList.appendChild(messageItem);
    
    messageItem.setMessage(message, data);
    
    this.follow();
    
    return messageItem;
  }
  
  tagAsUserMessage (messageDiv) {
    messageDiv.classList.add('user');
  }
  
  updateMessageInList (id, content) {
    let messageItem = document.querySelector(`#${id}`);
    if (!messageItem) {
      const pseudoMessage = { content, role: 'assistant' };
      messageItem = this.renderMessage(pseudoMessage);
    }
    
    messageItem.updateContent(content);
    
    this.follow();
    
    return messageItem;
  }
  
  follow () {
    if (this.state.followStreaming) {
      this.scrollable.scrollTop = this.scrollable.scrollHeight;
    }
  }
}
