import { marked } from 'marked';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

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
  }
  
  parseMessageContent (message) {
    if (_.isArray(message.content)) {
      const textPart = _.find(message.content, part => part.type === "text");
      const urlParts = _.chain(message.content).filter(part => part.type === "image_url").map('image_url.url').value();
      return {
        text: textPart.text || "",
        imageUrls: urlParts
      };
    } else {
      return {
        text: message.content,
        imageUrls: []
      };
    }
  }
  
  addMessageToList (message, rightMessage, collapsible=false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.id = message?.id || rightMessage?.id || ("message-" + uuidv4());
    
    const leftDiv = document.createElement('div');
    leftDiv.classList.add('left');
    messageDiv.appendChild(leftDiv);
    
    const rightDiv = document.createElement('div');
    rightDiv.classList.add('right');
    messageDiv.appendChild(rightDiv);
    
    if (message) {
      const messageContent = this.parseMessageContent(message);
      const hasImages = !_.isEmpty(messageContent.imageUrls);
      
      const textPart = marked.parse(messageContent.text);
      if (hasImages) {
        let html = `<div>`;
        
        messageContent.imageUrls.forEach(imageUrl => {
          const imageHtml = `<a href="${imageUrl}" target="_blank"><img src="${imageUrl}" class="message-image" /></a> `;
          html += imageHtml;
        });
        
        html += '</div>';
        
        leftDiv.innerHTML = `<div>${textPart}</div>${html}`;
      } else {
        leftDiv.innerHTML = textPart;
      }
    } else {
      leftDiv.innerHTML = '&nbsp;';
    }
    
    if (rightMessage) {
      const renderedContent = marked.parse(rightMessage.content);
      
      if (collapsible) {
        const collapsible = document.createElement('collapsible-element');
        collapsible.populate('Response', renderedContent);
        rightDiv.appendChild(collapsible);
      } else {
        rightDiv.innerHTML = renderedContent;
      }
    }
    
    this.messagesList.appendChild(messageDiv);
    
    this.follow();
    
    return messageDiv;
  }
  
  tagAsUserMessage (messageDiv) {
    messageDiv.classList.add('user');
  }
  
  updateMessageInList (id, content) {
    let messageDiv = document.querySelector(`#${id}`);
    if (!messageDiv) {
      messageDiv = this.addMessageToList({ id, content });
    }
    
    const leftDiv = messageDiv.querySelector(`.left`);
    leftDiv.innerHTML = marked.parse(content);
    
    this.follow();
    
    return messageDiv;
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
      this.messagesList.scrollTop = this.messagesList.scrollHeight;
    }
  }
}
