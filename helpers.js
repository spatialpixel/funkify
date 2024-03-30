// https://stackoverflow.com/questions/5767325/how-can-i-remove-a-specific-item-from-an-array-in-javascript
export function removeItemOnce(arr, value) {
  var index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}

export function removeItemAll(arr, value) {
  var i = 0;
  while (i < arr.length) {
    if (arr[i] === value) {
      arr.splice(i, 1);
    } else {
      ++i;
    }
  }
  return arr;
}

// From ChatGPT.
export function quaternionToEuler (quat) {
  let x = quat.x;
  let y = quat.y;
  let z = quat.z;
  let w = quat.w;

  let t0 = 2.0 * (w * x + y * z);
  let t1 = 1.0 - 2.0 * (x * x + y * y);
  let roll = Math.atan2(t0, t1);

  let t2 = 2.0 * (w * y - z * x);
  t2 = t2 > 1.0 ? 1.0 : t2;
  t2 = t2 < -1.0 ? -1.0 : t2;
  let pitch = Math.asin(t2);

  let t3 = 2.0 * (w * z + x * y);
  let t4 = 1.0 - 2.0 * (y * y + z * z);
  let yaw = Math.atan2(t3, t4);

  return { x: roll, y: pitch, z: yaw };
}

export function getCameraPosition (p) {
  // Calculate the inverse of the modelview matrix to get the camera position
  const modelViewMatrix = p._renderer.uMVMatrix.copy();
  const invertedView = new p5.Matrix();
  invertedView.invert(modelViewMatrix);
  const cameraPosition = p.createVector(invertedView.mat4[12], invertedView.mat4[13], invertedView.mat4[14]);
  return cameraPosition;
}

export function screenToWorld (p, x, y) {
  // Get the current 3D model-view and projection matrices.
  const modelViewMatrix = p._renderer.uMVMatrix.copy();
  const projectionMatrix = p._renderer.uPMatrix.copy();

  // Invert the projection matrix
  const invertedProjection = new p5.Matrix();
  invertedProjection.invert(projectionMatrix);
  
  // Invert the model-view matrix.
  const invertedView = new p5.Matrix();
  invertedView.invert(modelViewMatrix);

  // Map the screen coordinates to the world space
  const screenX = x * 2 / p.width - 1;
  const screenY = -y * 2 / p.height + 1;
  const screenZ = 0.00001;
  
  const eyeSpaceCoords = invertedProjection.multiplyVec4(screenX, screenY, screenZ, 1);

  // Apply the inverse model-view matrix to get the world coordinates
  
  const worldCoordinates = invertedView.multiplyVec4(eyeSpaceCoords[0], eyeSpaceCoords[1], eyeSpaceCoords[2], eyeSpaceCoords[3]);
  worldCoordinates[0] /= worldCoordinates[3];
  worldCoordinates[1] /= worldCoordinates[3];
  worldCoordinates[2] /= worldCoordinates[3];

  // Return the 3D coordinates.
  return p.createVector(worldCoordinates[0], worldCoordinates[1], worldCoordinates[2]);
}