/**
 * @module SpatialPixel.Funkify.MessageItem
 * @description Implementation for Funkify's message rendering element.
 * @author William Martin
 * @version 0.1.0
 */

import { v4 as uuidv4 } from 'uuid';
import { marked } from 'marked';
import _ from 'lodash';


const rightArrow = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" width="100" height="50">
  <!-- Arrow body -->
  <line x1="0" y1="25" x2="90" y2="25"></line>
  <line x1="90" y1="25" x2="90" y2="45"></line>
  
  <!-- Arrowhead -->
  <line x1="90" y1="45" x2="100" y2="35"></line>
  <line x1="90" y1="45" x2="80" y2="35"></line>
</svg>`

const leftArrow = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" width="100" height="50">
  <!-- Arrow body -->
  <line x1="0" y1="25" x2="90" y2="25"></line>
  <line x1="90" y1="5" x2="90" y2="25"></line>
  
  <!-- Arrowhead -->
  <line x1="0" y1="25" x2="10" y2="15"></line>
  <line x1="0" y1="25" x2="10" y2="35"></line>
</svg>`

class MessageItem extends HTMLElement {
  constructor() {
    super();

    const template = document.getElementById('message-item-template');
    const templateContent = template.content;

    // Create shadow DOM and append template
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.appendChild(templateContent.cloneNode(true));
  }

  connectedCallback () {
    this.main = this.shadowRoot.querySelector('.message');
    this.left = this.shadowRoot.querySelector('.left');
    this.right = this.shadowRoot.querySelector('.right');
    this.message = null;
  }
  
  updateContent (content) {
    const md = marked.parse(content);
    
    if (this.role === "tool") {
      const formattedContent = this.formatFunctionCallResponse(content);
      const collapsible = document.createElement('collapsible-element');
      collapsible.populate('Response', formattedContent);
      
      this.right.appendChild(collapsible);
    } else {
      this.left.innerHTML = md;
    }
  }
  
  get role () {
    return this.message?.role;
  }
  
  setMessage (message, data=null) {
    this.message = message;
    this.messageData = data;
    
    // Every rendered message should have a unique id.
    this.id = "message-" + uuidv4();
    
    // Reflect the "role" of the message. (system, user, assistant, tool)
    this.classList.add(message.role);
    this.main.classList.add(message.role);
    
    if (message.role === 'tool') {
      this.left.innerHTML = '&nbsp;';
      
      const toolDiv = document.createElement('div');
      
      if (!_.isEmpty(data)) {
        const renderedData = JSON.stringify(data, null, 2);
        toolDiv.innerHTML = `<strong>ƒ ${message.name}</strong>(${renderedData})`;
      } else {
        toolDiv.innerHTML = `<strong>ƒ ${message.name}</strong>()`;
      }
      
      this.right.appendChild(toolDiv);
      
      if (message.content) {
        const formattedContent = this.formatFunctionCallResponse(message.content);
        const collapsible = document.createElement('collapsible-element');
        collapsible.populate('Response', formattedContent);
        
        this.right.appendChild(collapsible);
      }
      
      // Get the previous message-item element and if it's a user message, add an arrow.
      let previous = this.previousSibling
      while (previous && previous.role !== 'user') {
        previous = previous.previousSibling;
      }
      if (previous && previous.role === 'user') {
        previous.addFunctionArrow();
      }
    } else {
      const messageContent = this.parseMessageContent(message);
      
      // Check to see if the previous sibling is a tool call and this is an assistant.
      // If so, add an arrow.
      if (this.previousSibling && this.previousSibling.role === 'tool' && this.role === 'assistant') {
        this.addReturnArrow();
      }
      
      const textPart = marked.parse(messageContent.text);
      const hasImages = !_.isEmpty(messageContent.imageUrls);
      
      if (hasImages) {
        let html = `<div>`;
        
        messageContent.imageUrls.forEach(imageUrl => {
          const imageHtml = `<a href="${imageUrl}" target="_blank"><img src="${imageUrl}" class="message-image" /></a> `;
          html += imageHtml;
        });
        
        html += '</div>';
        
        this.left.innerHTML = `<div>${textPart}</div>${html}`;
      } else {
        this.left.innerHTML = textPart;
      }
    }
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
        text: message.content || "",
        imageUrls: []
      };
    }
  }
  
  formatFunctionCallResponse (content) {
    if (_.isObject(content)) {
      
      const str = JSON.stringify(obj, null, 2);
      return `<pre>${str}</pre>`;
      
    } else if (_.isString(content)) {
      
      // Attempt to parse as JSON
      try {
        const obj = JSON.parse(content);
        if (obj) {
          const str = JSON.stringify(obj, null, 2);
          return `<pre>${str}</pre>`;
        } else {
          return `<pre>${content}</pre>`;
        }
      } catch (err) {
        // Format with markdown.
        const md = marked.parse(content);
        return md;
      }
    } else {
      
      const str = _.toString(content);
      const md = marked.parse(str);
      return `<pre>${md}</pre>`;
    }
  }
  
  addFunctionArrow () {
    this.right.innerHTML = rightArrow;
  }
  
  addReturnArrow () {
    this.right.innerHTML = leftArrow;
  }
}

customElements.define('message-item', MessageItem);
