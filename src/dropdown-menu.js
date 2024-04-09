// dropdown-menu.js
class DropdownMenu extends HTMLElement {
  constructor() {
    super();

    const template = document.getElementById('dropdown-menu-template');
    const templateContent = template.content;

    // Create shadow DOM and append template
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.appendChild(templateContent.cloneNode(true));
  }

  connectedCallback () {
    const toggleButton = this.shadowRoot.querySelector('.dropdown-toggle');
    
    toggleButton.addEventListener('click', event => {
      event.stopPropagation();
      
      this.closeAllDropdownsExceptThis();

      const dropdownContent = this.shadowRoot.querySelector('.dropdown-content');
      dropdownContent.classList.toggle('show');
    });
    
    const dropdownContent = this.shadowRoot.querySelector('.dropdown-content');
    dropdownContent.addEventListener('click', event => {
      event.stopPropagation();
    });
    
    this.addEventListener('dropdown-close', this.closeDropdown.bind(this));
  }

  closeAllDropdownsExceptThis () {
    const allDropdowns = document.getElementsByTagName('dropdown-menu');
    for (const dropdown of allDropdowns) {
      if (dropdown !== this) {
        dropdown.closeDropdown();
      }
    }
  }

  closeDropdown () {
    const dropdownContent = this.shadowRoot.querySelector('.dropdown-content');
    dropdownContent.classList.remove('show');

    // Dispatch custom event indicating dropdown has been closed
    this.dispatchEvent(new CustomEvent('dropdownClosed'));
  }
}

window.document.body.addEventListener('click', event => {
  const closeEvent = new CustomEvent('dropdown-close', {
    detail: {
      origin: 'DropdownMenu'
    }
  });
  
  const dropdowns = window.document.querySelectorAll('dropdown-menu');
  for (const dropdown of dropdowns) {
    dropdown.dispatchEvent(closeEvent);
  }
});

// Define the custom element
customElements.define('dropdown-menu', DropdownMenu);
