import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';

/**
 * Indent every line of a given text by `n` spaces.
 *
 * @param {string} src          The original source code (may contain \n line‑breaks).
 * @param {number} [indent=4]   How many spaces to prepend to each line.
 * @returns {string}            The indented source, ready for template‑literal interpolation.
 */
function indentLines (src, indent = 4) {
    // Build the indentation string once – e.g. "    "
    const pad = ' '.repeat(indent);

    // Split on \n (preserves empty lines), prepend padding to each line,
    // then join back together with \n.
    return src
        .split('\n')
        .map(line => pad + line)   // even an empty string becomes "    "
        .join('\n');
}

async function runWithExtras(pythonSnippet, extras, pyodide) {
    // 1️⃣ Save any keys that might clash so we can restore them later
    const saved = {};
    for (const name of Object.keys(extras)) {
        if (pyodide.globals.has(name)) {
            saved[name] = pyodide.globals.get(name);
        }
        // 2️⃣ Insert the extra value
        pyodide.globals.set(name, extras[name]);
    }

    try {
        // 3️⃣ Execute the user snippet – it can call fetch_joke() freely
        const resultPromise = pyodide.runPython(pythonSnippet); // returns a Promise if the code yields a Future
        return await resultPromise;
    } finally {
        // 4️⃣ Restore original globals (or delete if they didn’t exist before)
        for (const name of Object.keys(extras)) {
            if (saved.hasOwnProperty(name)) {
                pyodide.globals.set(name, saved[name]);
            } else {
                pyodide.globals.delete(name);
            }
        }
    }
}

export default class FunctionTool {
  constructor (id, name, description, properties, required, f, language) {
    this.id = id;
    this.name = name;
    this.description = description;

    this.properties = properties;
    this.required = required;

    this.f = f;

    this.language = language || 'js';
  }

  applyDefaults (args) {
    // Default all values to null or None so we don't run into undefined errors.
    const defaults = _.mapValues(this.properties, () => null);
    return _.defaults(args, defaults);
  }

  async call (args, state) {
    const argsWithDefaults = this.applyDefaults(args);

    if (this.language === 'js') {
      return await this.callJavaScript(argsWithDefaults, state);
    } else if (this.language === 'py') {
      return await this.callPython(argsWithDefaults, state);
    }
  }

  async callJavaScript (args, state) {
    const body = `return async () => {
${ this.f }
}`;

    let result
    try {
      const globals = {
        openai: state.openai
      };

      // TODO: "args" is deprecated, but included here until the tutorials are updated.
      const argKeys = ['args', 'globals'];
      const argValues = [args, globals];

      _.forEach(args, (argValue, argKey) => {
        argKeys.push(argKey);
        argValues.push(argValue);
      });

      const callable = new Function(...argKeys, body);
      result = await callable(...argValues)();
    } catch (err) {
      console.error('Error in Function call:', err);
      result = err;
    }

    return result;
  }

  async callPython (args, state) {
    // https://pyodide.org/en/stable/usage/faq.html#how-can-i-execute-code-in-a-custom-namespace
    // const namespace = state.pyodide.toPy(args);
    const pyCode = this.prepPythonCode(this.f);
    // await state.pyodide.runPythonAsync(pyCode, { globals: namespace });
    await state.pyodide.runPythonAsync(pyCode);

    // const resultPromise = state.pyodide.runPython("result_getter()");
    // const result = await resultPromise;
    // console.log('callPython namespace=', namespace);
    const proxy = await runWithExtras("result_getter()", args, state.pyodide);
    const result = proxy.toJs();

    console.debug("callPython result=", result);

    return result;
  }

  prepPythonCode (f) {
    const indented = indentLines(f);
    return `import asyncio
from pyodide.http import pyfetch
async def my_function():
${indented}

def result_getter():
  loop = asyncio.get_event_loop()
  return asyncio.ensure_future(my_function())
`;
  }

  get schema () {
    return {
      'type': 'function',
      'function': {
        'name': this.name,
        'description': this.description,
        'parameters': {
          'type': 'object',
          'properties': this.properties,
          'required': this.required,
        }
      }
    }
  }

  get json () {
    return {
      implementation: this.f,
      schema: this.schema,
      language: this.language,
    }
  }

  save () {
    const value = JSON.stringify(this.json);
    localStorage.setItem(this.id, value);
  }
}

FunctionTool.factory = () => {
  const name = 'new_function';
  const description = "A stub function that returns dummy data."
  const id = 'funkify-tool-' + uuidv4();
  const parameters = {};
  const required = [];

  const f = `// Just the function body here. "await" is supported.

return "Success";`;
  const language = 'js';

  const tr = new FunctionTool(id, name, description, parameters, required, f, language);
  return tr;
}

FunctionTool.importAll = importedDataStr => {
  try {
    const importedData = JSON.parse(importedDataStr);

    const tr = [];
    _.forEach(importedData, (schema, index) => {
      const tool = FunctionTool.import({ schema, implementation: 'return true;', language: "js" });
      if (!_.isNil(tool)) {
        tr.push(tool);
      }
    });
    return tr;
  } catch (err) {
    console.error(`Error while parsing function schemas:`, err);
    return [];
  }

}

FunctionTool.import = data => {
  try {
    const id = 'funkify-tool-' + uuidv4();
    return FunctionTool.parse(data, id);
  } catch (err) {
    console.error(`Error while parsing function:`, err);
    return null;
  }
}

FunctionTool.parse = (data, key) => {
  try {
    const id = key;
    const name = data.schema.function.name;
    const description = data.schema.function.description;
    const properties = data.schema.function.parameters.properties;
    const required = data.schema.function.parameters.required;
    const f = data.implementation;
    const language = data.language;

    return new FunctionTool(id, name, description, properties, required, f, language);
  } catch (err) {
    console.error(`Error while parsing function:`, err);
    return null;
  }
}

FunctionTool.loadAllFromLocalStorage = () => {
  const tr = [];

  for (let i = 0; i < localStorage.length; i++) {
    try {
      const key = localStorage.key(i);
      const isFunkifyTool = _.startsWith(key, 'funkify-tool-');

      if (isFunkifyTool) {
        const toolJson = localStorage.getItem(key);
        const toolData = JSON.parse(toolJson);
        const tool = FunctionTool.parse(toolData, key);
        tr.push(tool);
      }
    } catch (err) {
      console.error(`Error while parsing a tool from localStorage:`, err);
    }
  }

  return tr;
}

FunctionTool.removeFromLocalStorage = tool => {
  localStorage.removeItem(tool.id);
}
