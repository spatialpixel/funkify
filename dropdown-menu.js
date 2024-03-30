// dropdown-menu.js
class DropdownMenu extends HTMLElement {
    constructor() {
        super();

        const template = document.getElementById('dropdown-menu-template');
        const templateContent = template.content;
        
        // Create shadow DOM and append template
        this.attachShadow({ mode: 'open' });

        this.shadowRoot.appendChild(templateContent.cloneNode(true));
        
        // Add event listener to toggle dropdown
        const toggleButton = this.shadowRoot.querySelector('.dropdown-toggle');
        toggleButton.addEventListener('click', () => {
            this.closeAllDropdownsExceptThis();
            
            const dropdownContent = this.shadowRoot.querySelector('.dropdown-content');
            dropdownContent.classList.toggle('show');
        });
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

// Define the custom element
customElements.define('dropdown-menu', DropdownMenu);
