// dropdown-menu.js
class CollapsibleElement extends HTMLElement {
  constructor() {
    super();

    const template = document.getElementById('collapsible-element-template');
    const templateContent = template.content;

    // Create shadow DOM and append template
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.appendChild(templateContent.cloneNode(true));
  }
  
  connectedCallback () {
    const toggleButton = this.shadowRoot.querySelector('button.collapsible-toggle');
    toggleButton.addEventListener('click', event => {
      const contentElement = this.shadowRoot.querySelector('.collapsible-content');
      if (contentElement.style.display === 'none') {
        contentElement.style.display = 'block';
        // toggleButton.style.transform = "rotate(90deg)";
        toggleButton.innerHTML = '↓';
      } else {
        contentElement.style.display = 'none';
        toggleButton.innerHTML = '→';
        // toggleButton.style.transform = "";
      }
    });
  }
  
  populate (title, content) {
    const titleElement = this.shadowRoot.querySelector('.collapsible-title');
    titleElement.innerHTML = title;
    
    const contentElement = this.shadowRoot.querySelector('.collapsible-content');
    contentElement.innerHTML = content;
    
  }
}

customElements.define('collapsible-element', CollapsibleElement);
