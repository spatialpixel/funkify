# Funkify

Funkify is a web playground for experimenting with function calling in large language models.

Similar to online playgrounds provided by major LLM hosts, it enables you to define custom 
functions in the browser and trigger them through a chat-like UI, but with Funkify, you
can also write simple function implementations right in the browser with JavaScript and 
Python (powered by the [pyodide](https://pyodide.org) project).

## LLM Providers

Funkify currently supports the following LLM providers:

- [OpenAI](https://platform.openai.com) – Get an API key.
- [Hugging Face](https://huggingface.co) – Also requires an API key.
- Local hosting – Provide a URL to your local LLM server. I use [LM Studio](https://lmstudio.ai).

Each provider comes with a set of hard-coded models, but you can enter your own model identifier
by clicking on "Other…" in the model selector.

## Keys and Security

**Funkify has no backend.** Thus, when you input an API key or access token, it's currently stored
in your browser. While this isn't ideal, it at least means your key stays with you, but a malicious
browser extension still may be able to scrape the key.

To mitigate the risk, I recommend creating a separate browser profile, changing the key often, 
and putting strict spend limits on that particular key.

Remember, Funkify is currently intended as a playground for prototyping, not building entire 
apps, although we may add more features in the future to make this more convenient.

## Sample Functions

Some sample functions are available under Settings → Populate with example functions. There are
functions in both JavaScript and Python.

## Vision

Funkify also supports vision models in a limited way. If you provide a URL that targets a
publicly available image, it will attempt to parse it and send it to the LLM. You'll naturally
need to pick a vision-language model, like GPT-4o or Llama-3.2-11B-Vision-Instruct.

## Exporting

You can export the function definitions with the Export button (f→ in the upper right), which
provides a JSON string compatible with OpenAI's and HuggingFace's SDKs, to populate the "tools"
field.

## Maintenance

The project is currently built and maintained by [me, William Martin](https://awmartin.xyz/),
at [Spatial Pixel](https://spatialpixel.com/)
