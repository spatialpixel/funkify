/**
 * @module Funky.ExampleFunctions
 * @description Some examples of FunctionTool instances.
 * @author William Martin
 * @version 0.1.0
 */

import { FunctionTool } from './function.js';

const get_current_weather_code = `const url = \`https://api.open-meteo.com/v1/forecast?latitude=\${args.latitude}&longitude=\${args.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,rain,showers,snowfall\`;

const result = await fetch(url);
const response = await result.json();

return response;`
  
const get_current_weather = new FunctionTool(
  'tool-bf194fe8-66eb-4510-9bcf-b80cb7017618',
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
);

const search_academic_commons_code = `const objectToQueryString = obj => Object.keys(obj).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key])).join('&');

const params = {
  q: args.keyword
};
const urlParams = objectToQueryString(params);
  
const headers = {
  'Content-Type': 'application/json',
};
  
const url = \`https://academiccommons.columbia.edu/api/v1/search?search_type=keyword&page=1&per_page=10&sort=best_match&order=desc&\${urlParams}\`

const response = await fetch(url);
return await response.json();`

const search_academic_commons = new FunctionTool(
  'tool-3c328d85-bb22-45cd-8299-88d394923f8b',
  'search_academic_commons',
  "Searches Columbia University's Academic Commons database for a given topic keyword and returns ten relevant results.",
  {
    'keyword': {
      'type': 'string',
      'description': 'A keyword describing the topic being searched for.'
    }
  },
  ['keyword'],
  search_academic_commons_code
);

export default [
  get_current_weather,
  search_academic_commons
]
