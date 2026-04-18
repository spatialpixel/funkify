import _ from 'lodash';

export function stringify (function_result) {
  let stringified_result
  if (_.isObject(function_result)) {
    stringified_result = JSON.stringify(function_result);
  } else if (_.isString(function_result)) {
    stringified_result = function_result;
  } else {
    stringified_result = _.toString(function_result);
  }
  return stringified_result;
}

export function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  // Process in chunks to avoid call‑stack overflow on huge files
  const chunkSize = 0x8000; // 32 KB
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
