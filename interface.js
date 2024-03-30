/**
 * @module Funky.Interface
 * @description Helper functions for interactions with HTML elements.
 * @author William Martin
 * @version 0.1.0
 */
 
export function initializeKeypressed (elementId, handler) {
  const element = document.querySelector(elementId);
  if (element) {
    element.addEventListener('keydown', handler);
  }
}

export function initializeButton (elementId, handler) {
  const element = document.querySelector(elementId);
  if (element) {
    element.addEventListener('click', event => {
      event.stopPropagation();
      handler(event);
    });
  }
}

export function initializeCheckbox (elementId, handler) {
  const element = document.querySelector(elementId);
  if (element) {
    element.addEventListener('click', event => {
      handler(element.checked, event);
    });
  }
}

export function initializeTextInput (elementId, handler, defaultValueGetter) {
  const element = document.querySelector(elementId);
  if (element) {
    element.addEventListener('change', event => {
      handler(element.value, event);
    });
    
    if (defaultValueGetter) {
      const defaultValue = defaultValueGetter();
      element.value = defaultValue;
    }
  }
}

export function drawAxes (p, size=1) {
  p.strokeWeight(1);
  p.stroke(p.color('red'));
  p.line(0, 0, 0, size, 0, 0);
  p.stroke(p.color('green'));
  p.line(0, 0, 0, 0, size, 0);
  p.stroke(p.color('blue'));
  p.line(0, 0, 0, 0, 0, size);
}

export function showElementById (id) {
  const elt = document.getElementById(id);
  if (elt) {
    elt.style.display = '';
  }
}

export function hideElementById (id) {
  const elt = document.getElementById(id);
  if (elt) {
    elt.style.display = 'none';
  }
}
