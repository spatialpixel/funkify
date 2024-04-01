export class PromptManager {
  constructor (state) {
    this.state = state;
    
    this.promptArea = document.querySelector("textarea#prompt");
    
    this.promptArea.addEventListener('keydown', this.keydownHandler.bind(this));
    
    this.promptArea.addEventListener('input', event => {
      // Ensure the prompt gets bigger with multiline text, up to a point.
      this.promptArea.style.height = "auto";
      // Set height to content height but no taller than 250px.
      this.promptArea.style.height = Math.min(this.promptArea.scrollHeight, 250) + "px";
    });
  }
  
  async keydownHandler (event) {
    if (event.key === "Enter") {
      const modified = event.metaKey || event.ctrlKey;
      
      if (modified) {
        event.preventDefault();
        const content = this.promptArea.value;
        
        console.log("User prompt to submit: ", content);
        
        const message = {
          role: 'user',
          content,
        };
        
        this.disablePrompt();
        await this.state.chatManager.submitMessage(message);
        this.enablePrompt();
        this.clearPrompt();
        this.focusPrompt();
      }
    }
  }
  
  disablePrompt () {
    this.promptArea.setAttribute('disabled', true);
  }
  
  enablePrompt () {
    this.promptArea.removeAttribute('disabled');
  }
  
  clearPrompt () {
    this.promptArea.value = '';
  }
  
  focusPrompt () {
    this.promptArea.focus();
  }
}
