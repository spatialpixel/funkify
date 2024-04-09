import _ from 'lodash';

export class PromptManager {
  constructor (state) {
    this.state = state;
    
    this.promptArea = document.querySelector("textarea#prompt");
    this.promptArea.addEventListener('keydown', this.keydownHandler.bind(this));
    this.promptArea.addEventListener('input', this.expandOnInput.bind(this));
    
    this.submitButton = document.querySelector("button#submit");
    this.submitButton.addEventListener('click', this.submit.bind(this));
    
    this.followStreamingButton = document.querySelector("#follow-streaming")
    this.followStreamingButton.addEventListener('click', this.toggleFollowing.bind(this));
  }
  
  expandOnInput (event) {
    // Ensure the prompt gets bigger with multiline text, up to a point.
    this.promptArea.style.height = "auto";
    // Set height to content height but no taller than 250px.
    this.promptArea.style.height = Math.min(this.promptArea.scrollHeight, 250) + "px";
  }
  
  async keydownHandler (event) {
    if (event.key === "Enter") {
      const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
      
      if (!modified) {
        event.preventDefault();
        this.submit();
      }
    }
  }
  
  async submit (event) {
    const content = this.promptArea.value;
    if (_.isEmpty(content)) { return; }
    
    console.log("User prompt to submit: ", content);
    
    this.disablePrompt();
    await this.state.chatManager.submitPrompt(content);
    this.enablePrompt();
    this.clearPrompt();
    this.focusPrompt();
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
  
  toggleFollowing (event) {
    this.state.followStreaming = !this.state.followStreaming;
    
    if (this.state.followStreaming) {
      this.followStreamingButton.classList.add('toggled');
    } else {
      this.followStreamingButton.classList.remove('toggled');
    }
  }
}
