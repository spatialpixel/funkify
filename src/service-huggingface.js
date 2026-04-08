import LLMService from './service-base.js';
import { InferenceClient } from "https://esm.sh/@huggingface/inference";
import ShortUniqueId from 'short-unique-id';
import _ from 'lodash';


export default class HuggingFaceService extends LLMService {
  constructor (state) {
    super(state, 'huggingface');
    // this.state = the app's state singleton
    // this.serviceKey = a string like 'openai' or 'huggingface'

    this.keyManager = document.querySelector(`key-manager#${this.serviceKey}-api-key`);
    this.keyManager.initialize(this.getter.bind(this), this.setter.bind(this));
  }

  initialize () {
    if (!this.instance || this.apiKeyChanged) {
      this.instance = new InferenceClient(this.apiKey);

      this.apiKeyChanged = false;
    }
  }

  async createTextCompletion (params) {
    console.debug(`huggingface completion params:`, params);

    // return await this.instance.chatCompletionStream(params);
    return await this.instance.chatCompletion(params);
  }

  get models () {
    return [
      'openai/gpt-oss-120b',
      'Qwen/Qwen3.5-35B-A3B',                     // vision
      'Qwen/Qwen3-Coder-480B-A35B-Instruct',
      'Qwen/Qwen3-Coder-30B-A3B-Instruct',
      'Qwen/Qwen2.5-72B-Instruct',
      'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8', // vision
      'meta-llama/Llama-3.3-70B-Instruct',
      'meta-llama/Llama-3.2-11B-Vision-Instruct', // vision
      'meta-llama/Meta-Llama-3-8B-Instruct',
      'zai-org/GLM-5.1',
      'zai-org/GLM-4.6V-FP8',                     // vision
    ];
  }

  modelSupportsVision (model) {
    const modelsWithVision = [
      'Qwen/Qwen3.5-35B-A3B',
      'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
      'meta-llama/Llama-3.2-11B-Vision-Instruct',
      'zai-org/GLM-4.6V-FP8',
    ];
    return modelsWithVision.includes(model);
  }

  get stream () {
    return false;
  }

  processToolCallsMessage (message) {
    if (!_.isObject(message)) { return }

    if (_.isArray(message.tool_calls)) {
      console.log(`Got a message with tool_calls attached:`, message.tool_calls);

      // The tool_calls message needs a "content": "" field, which HF requires but omits.
      message.content = "";

      _.forEach(message.tool_calls, tool_call => {
        // tool_call messages from Hugging Face don't have robust IDs, but some models like
        // those from Mistral, still require them. They don't work, but it's still worth putting
        // the logic here. Iterate over all the tool calls and ensure they have unique IDs.
        if (_.isEmpty(tool_call.id) || _.size(tool_call.id) !== 9) {
          const uid = new ShortUniqueId({ length: 9 });
          tool_call.id = uid.rnd();
        }
      });

      // TODO: track tool IDs and ensure all tool calls have been satisfied.
    }
  }
}
