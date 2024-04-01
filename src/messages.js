import { marked } from 'marked';
import { v4 as uuidv4 } from 'uuid';

export function addMessageToList (message, rightMessage, collapsible=false) {
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
    const renderedContent = marked.parse(rightMessage.content);
    
    if (collapsible) {
      const collapsible = document.createElement('collapsible-element');
      collapsible.populate('Response', renderedContent);
      rightDiv.appendChild(collapsible);
    } else {
      rightDiv.innerHTML = renderedContent;
    }
  }
  
  messagesList.appendChild(messageDiv);
  
  return messageDiv;
}

export function updateMessageInList (id, content) {
  let messageDiv = document.querySelector(`#${id}`);
  if (!messageDiv) {
    messageDiv = addMessageToList({ id, content });
  }
  
  const leftDiv = messageDiv.querySelector(`.left`);
  leftDiv.innerHTML = marked.parse(content);
}
