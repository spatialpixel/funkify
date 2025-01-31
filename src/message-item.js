/**
 * @module SpatialPixel.Funkify.MessageItem
 * @description Implementation for Funkify's message rendering element.
 * @author William Martin
 * @version 0.1.0
 */

import { v4 as uuidv4 } from 'uuid';
import { marked } from 'marked';
import _ from 'lodash';

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
    this.left.innerHTML = md;
  }
  
  setMessage (message, data=null) {
    this.message = message;
    this.messageData = data;
    
    this.id = message?.id || ("message-" + uuidv4());
    this.classList.add(message.role);
    this.main.classList.add(message.role);
    
    if (message.role === 'tool') {
      this.left.innerHTML = '&nbsp;';
      
      const toolDiv = document.createElement('div');
      
      if (!_.isEmpty(data)) {
        const renderedData = JSON.stringify(data);
        toolDiv.innerHTML = `<strong>ƒ ${message.name}</strong>(${renderedData})`;
      } else {
        toolDiv.innerHTML = `<strong>ƒ ${message.name}</strong>()`;
      }
      
      this.right.appendChild(toolDiv);
      
      const formattedContent = this.formatFunctionCallResponse(message.content);
      const collapsible = document.createElement('collapsible-element');
      collapsible.populate('Response', formattedContent);
      
      this.right.appendChild(collapsible);
    } else {
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
        text: message.content,
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
}

customElements.define('message-item', MessageItem);
