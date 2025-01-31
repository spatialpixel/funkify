/**
 * @module SpatialPixel.Funkify.MessageList
 * @description Implementation for Funkify's rendering of chat messages.
 * @author William Martin
 * @version 0.1.0
 */

const rightArrow = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" width="100" height="50">
  <!-- Arrow body -->
  <line x1="0" y1="25" x2="90" y2="25" stroke="black" stroke-width="2"></line>
  <line x1="90" y1="25" x2="90" y2="45" stroke="black" stroke-width="2"></line>
  
  <!-- Arrowhead -->
  <line x1="90" y1="45" x2="100" y2="35" stroke="black" stroke-width="2"></line>
  <line x1="90" y1="45" x2="80" y2="35" stroke="black" stroke-width="2"></line>
</svg>`

const leftArrow = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" width="100" height="50">
  <!-- Arrow body -->
  <line x1="0" y1="25" x2="90" y2="25" stroke="black" stroke-width="2"></line>
  <line x1="90" y1="5" x2="90" y2="25" stroke="black" stroke-width="2"></line>
  
  <!-- Arrowhead -->
  <line x1="0" y1="25" x2="10" y2="15" stroke="black" stroke-width="2"></line>
  <line x1="0" y1="25" x2="10" y2="35" stroke="black" stroke-width="2"></line>
</svg>`


export default class MessagesManager {
  constructor (state) {
    this.state = state;
    
    this.state.followStreaming = true;
    
    this.messagesList = document.querySelector("#messages-list");
    this.scrollable = document.querySelector('.scrollable');
  }
  
  addMessageToList (message, data=null) {
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
      const pseudoMessage = { id, content, role: 'assistant' };
      messageItem = this.addMessageToList(pseudoMessage);
    }
    
    messageItem.updateContent(content);
    
    this.follow();
    
    return messageItem;
  }
  
  addArrowToMessage (messageElement, direction) {
    const right = messageElement.querySelector('.right');
    
    if (direction === "right") {
      right.classList.add('column-reverse');
      right.innerHTML = rightArrow;
    } else if (direction === "left") {
      right.innerHTML = leftArrow;
    }
  }
  
  follow () {
    if (this.state.followStreaming) {
      this.scrollable.scrollTop = this.scrollable.scrollHeight;
    }
  }
}
