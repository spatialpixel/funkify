import { ChatManagerDelegate } from './chat-manager.js';

export default class FunkifyChatDelegate extends ChatManagerDelegate {
  constructor () {
    super();
    this.systemContextInput = document.querySelector('textarea#system-context');
    
    this.modelPicker = document.querySelector('select#model-picker');
    this.modelPicker.value = "gpt-4o";
    this.modelPicker.addEventListener('change', this.onModelSelect.bind(this));
    
    this.visionDetailPicker = document.querySelector('select#vision-detail');
    this.visionDetailPicker.value = "low";
  }
  
  onModelSelect (event) {
    if (this.isVisionModel) {
      this.visionDetailPicker.removeAttribute('disabled');
    } else {
      this.visionDetailPicker.setAttribute('disabled', true);
    }
  }
  
  get currentModel () {
    return this.modelPicker.value;
  }
  
  get visionDetail () {
    return this.visionDetailPicker.value;
  }
  
  get systemContext () {
    return this.systemContextInput.value;
  }
  
  get isVisionModel () {
    const modelsWithVision = ['gpt-4o', 'gpt-4-turbo', 'gpt-4-turbo-2024-04-09'];
    return modelsWithVision.includes(this.currentModel);
  }
}
