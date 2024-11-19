/**
 * @module Funkify.ExampleFunctions
 * @description Some examples of FunctionTool instances.
 * @author William Martin
 * @version 0.1.0
 */

import FunctionTool from './function.js';
import { v4 as uuidv4 } from 'uuid';

const get_current_weather_code = `// Retrieves data regarding the current weather from Open Meteo

const url = \`https://api.open-meteo.com/v1/forecast?latitude=\${latitude}&longitude=\${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,rain,showers,snowfall\`;

const result = await fetch(url);
const response = await result.json();

return response;`
  
const get_current_weather = () => (new FunctionTool(
  `funkify-tool-${uuidv4()}`,
  'get_current_weather',
  'Tells the current weather given a location',
  {
    'location': {
      'type': 'string',
      'description': 'The location the user is asking about.'
    },
    
    'latitude': {
      'type': 'number',
      'description': 'The latitude of the location the user is asking about.'
    },
    
    'longitude': {
      'type': 'number',
      'description': 'The longitude of the location the user is asking about.'
    }
  },
  ['latitude', 'longitude'],
  get_current_weather_code
));

const search_academic_commons_code = `// Searches Columbia University's "Academic Commons" given a keyword.

const objectToQueryString = obj => Object.keys(obj).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key])).join('&');

const urlParams = objectToQueryString({
  search_type: 'keyword',
  page: 1,
  per_page: 10,
  sort: 'best_match',
  order: 'desc',
  q: keyword
});

const base = \`https://academiccommons.columbia.edu/api/v1/search\`;
const url = \`$\{base\}?$\{urlParams\}\`;

const response = await fetch(url);
return await response.json();`

const search_academic_commons = () => (new FunctionTool(
  `funkify-tool-${uuidv4()}`,
  'search_academic_commons',
  "Searches Columbia University's Academic Commons database for research given a topic keyword and returns ten relevant results.",
  {
    'keyword': {
      'type': 'string',
      'description': 'A keyword describing the topic being searched for.'
    }
  },
  ['keyword'],
  search_academic_commons_code
));

export default () => ([
  get_current_weather(),
  search_academic_commons()
]);
