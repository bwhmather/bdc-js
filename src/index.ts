let EVENT_HANDLER_MAP = new WeakMap();

function handleEvent(evt) {
  let handler = EVENT_HANDLER_MAP.get(evt.target)[evt.type];
  if (typeof handler === "function") {
    return handler.call(evt.target, evt);
  }
  if (typeof handler.handleEvent === "function") {
    return handler.handleEvent(evt);
  }
}

function setAttribute($elem, key, value) {
  if (key[0] === "o" && key[1] === "n") {
    let handlers = EVENT_HANDLER_MAP.get($elem);
    if (typeof handlers === "undefined") {
      $elem.addEventListener(key.slice(2), handleEvent, false);
      handlers = {};
      EVENT_HANDLER_MAP.set($elem, handlers);
    }
    handlers[key.slice(2)] = value;
  } else if (key === "style") {
    $elem.style.cssText = value;
  } else if (key in $elem) {
    // Element exposes attribute as a property.  We should be able to set it
    // using an assignment expression.
    if (
      ($elem.localName === "input" || $elem.localName === "textarea") &&
      key === "value" && $elem.value === "" + value &&
      $elem === document.activeElement
    ) {
      // Chrome will jump the cursor to an end of `input` box or `textarea` if
      // value is re-applied.
    } else if (
      ($elem.localName === "select" || $elem.localName === "option") &&
      key === "value" && $elem.value === "" + value
    ) {
      // `select` or `option` inputs will glitch in chrome if assigned the
      // same value.
    } else if ($elem.localName === "input" && key === "type") {
      // Using an assignment expression to set input type in IE11 causes a big
      // error.
      $elem.setAttribute(key, value);
    } else {
      $elem[key] = value;
    }
  } else if (typeof value === "boolean") {
    if (value) {
      $elem.setAttribute(key, "");
    } else {
      $elem.removeAttribute(key);
    }
  } else {
    $elem.setAttribute(key, value);
  }
}

function removeAttribute($elem, key) {
  if (key[0] === "o" && key[1] === "n") {
    let handlers = EVENT_HANDLER_MAP.get($elem);
    if (typeof handlers !== "undefined") {
      if (handlers.hasOwnProperty[key.slice(2)]) {
        $elem.removeEventListener(key.slice(2), handlers[key.slice(2)], false);
        delete handlers[key.slice(2)];
      }

      if (Object.keys(handlers).length === 0) {
        EVENT_HANDLER_MAP.delete(key.slice(2));
      }
    }
  } else if (key === "style") {
    $elem.style.cssText = "";
  } else if (
    key in $elem &&
	  !($elem.localName === "option" && key === "value") &&
		!($elem.localName === "input" && key === "type")
  ) {
    $elem[key] = null;
  } else {
    $elem.removeAttribute(key);
  }
}

function listAttributes($elem) {
  let attributes = [];
  for (let i = 0; i < $elem.attributes.length; i++) {
    attributes.push($elem.attributes[i]);
  }

  Object.keys(EVENT_HANDLER_MAP.get($elem) || {}).forEach((eventName) => {
    attributes.push("on" + eventName);
  })

  return attributes;
}

function updateAttributes($elem, attributes) {
  for (let attr of listAttributes($elem)) {
    if (!attributes.hasOwnProperty(attr)) {
      removeAttribute($elem, attr);
    }
  }

  for (let attr in attributes) {
    if (attributes.hasOwnProperty(attr)) {
      setAttribute($elem, attr, attributes[attr]);
    }
  }
}

function updateChildren($elem, children) {
  for (let i = 0; i < children.length; i++) {
    let $childElem = $elem.childNodes[i];
    let childNode = children[i];

    update(childNode, $elem, $childElem);
  }

  while ($elem.childNodes.length > children.length) {
    $elem.removeChild($elem.lastChild);
  }
}

// Renders a node to an element and returns it.
function update(node, $parent, $elem) {
  let $original = $elem;

  if (typeof node == 'string') {
    if ($elem == null || $elem.nodeType != Node.TEXT_NODE) {
      $elem = document.createTextNode(node);
    } else {
      $elem.nodeValue = node;
    }
  } else {
    if ($elem == null || $elem.localName !== node.type) {
      $elem = document.createElement(node.type);
    }

    updateAttributes($elem, node.attributes);
    updateChildren($elem, node.children);
  }

  if ($original == null) {
    $parent.appendChild($elem);
  } else if ($elem !== $original) {
    $parent.replaceChild($elem, $original);
  }
}

export function h(type, attributes, ...children) {
  return { type, attributes, children };
}

export function render($root, ...nodes) {
  updateChildren($root, nodes);
}
