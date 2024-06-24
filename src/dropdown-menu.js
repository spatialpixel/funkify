/**
 * @module SpatialPixel.DropdownMenu
 * @description Implementation for custom dropdown menu component.
 * @author William Martin
 * @version 0.1.0
 */

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
    const dropdowns = Array.from(document.getElementsByTagName('dropdown-menu'));
    
    const elementsWithDropdowns = window.document.querySelectorAll('.has-dropdowns');
    for (const elt of elementsWithDropdowns) {
      const containedDropdowns = elt.shadowRoot.querySelectorAll('dropdown-menu');
      for (const dropdown of containedDropdowns) {
        dropdowns.push(dropdown);
      }
    }
    
    for (const dropdown of dropdowns) {
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
  
  const dropdowns = Array.from(window.document.querySelectorAll('dropdown-menu'));
  
  // WebComponents use a shadow DOM that isn't traversable by default.
  // So let's have a special tag that enables any component to notify
  // this event routine that it has dropdowns that need to be closed.
  const elementsWithDropdowns = window.document.querySelectorAll('.has-dropdowns');
  for (const elt of elementsWithDropdowns) {
    const containedDropdowns = elt.shadowRoot.querySelectorAll('dropdown-menu');
    for (const dropdown of containedDropdowns) {
      dropdowns.push(dropdown);
    }
  }
  
  for (const dropdown of dropdowns) {
    dropdown.dispatchEvent(closeEvent);
  }
});

// Define the custom element
customElements.define('dropdown-menu', DropdownMenu);
