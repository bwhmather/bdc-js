// The DOM doesn't provide a way to list all registered event handlers, and
// even if it did, there wouldn't be an easy way to figure out which belonged
// to us.  Instead we maintain our own global map of event handlers to keep
// track of what we've registered.
// `EVENT_HANDLER_MAP`` is a weak mapping from HTML elements to objects mapping
// from event names to the functions BDC should call in response to them.
const EVENT_HANDLER_MAP = new WeakMap();

/**
 * Sets an attribute or event handler on an HTML element to the requested
 * value.
 *
 * The behaviour is quite attribute specific, but is intended to allow node
 * descriptions to more closely resemble HTML-as-text instead of HTML as DOM.
 * Calling `$elem.getAttribute(key)` will often return a deserialized
 * equivalent of value or, as in the case of event handlers, nothing at all.
 *
 * @param $elem
 *   The HTML element to set the attribute on.
 * @param key
 *   The name of the attribute or event handler to set.
 * @param value
 *   A description of the value to set.
 */
function setAttribute($elem, key, value) {
  if (key[0] === "o" && key[1] === "n") {
    // The attribute is an event handler.  Unfortunately the DOM doesn't
    // provide any way to list event handlers, or to remove event handlers by
    // name.  See documentation on `EVENT_HANDLER_MAP`.
    let eventName = key.slice(2);
    if (!EVENT_HANDLER_MAP.has($elem)) {
      EVENT_HANDLER_MAP.set($elem, {});
    }
    let handlers = EVENT_HANDLER_MAP.get($elem);

    // Check for and, if necessary, remove any old event handlers.
    if (handlers.hasOwnProperty(eventName)) {
      $elem.removeEventListener(eventName, handlers[eventName], false);
    }

    // Install and record the new event handler.
    handlers[eventName] = value;
    $elem.addEventListener(eventName, value, false);

  } else if (key === "style") {
    // `$elem.style` is a CSS object, but they aren't terribly easy to build.
    // We instead expect the style to be built as a string and clobber cssText.
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

/**
 * Removes or unsets the requested attribute on an HTML element.
 *
 * Does not guarantee good behaviour if the attribute is not one of those
 * returned by `listAttributes`.
 *
 * @param $elem
 *   The HTML element to remove the attribute from.
 * @param key
 *   The name of the attribute or event handler to remove, as it would appear
 *   in an HTML document.
 */
function removeAttribute($elem, key) {
  if (key[0] === "o" && key[1] === "n") {
    const handlers = EVENT_HANDLER_MAP.get($elem);
    if (typeof handlers !== "undefined") {
      const eventName = key.slice(2);

      $elem.removeEventListener(eventName, handlers[eventName], false);
      delete handlers[eventName];

      if (Object.keys(handlers).length === 0) {
        // BDC no longer has any handlers linked listening for events from this
        // element.  We can clean up the empty entry.
        EVENT_HANDLER_MAP.delete($elem);
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

/**
 * Returns a list of all attributes of an HTML element, including event
 * handlers managed by BDC, but not including event handlers added by other
 * libraries.
 *
 * @param $elem
 *   The HTML element to list the attributes of.
 * @returns
 *   A list of attribute names.
 */
function listAttributes($elem) {
  const attributes = [];
  // tslint:disable-next-line
  for (let i = 0; i < $elem.attributes.length; i++) {
    attributes.push($elem.attributes[i].name);
  }

  Object.keys(EVENT_HANDLER_MAP.get($elem) || {}).forEach((eventName) => {
    attributes.push("on" + eventName);
  });

  return attributes;
}

function updateAttributes($elem, attributes) {
  for (const attr of listAttributes($elem)) {
    if (!attributes.hasOwnProperty(attr)) {
      removeAttribute($elem, attr);
    }
  }

  for (const attr in attributes) {
    if (attributes.hasOwnProperty(attr)) {
      setAttribute($elem, attr, attributes[attr]);
    }
  }
}

function updateChildren($elem, children) {
  for (let i = 0; i < children.length; i++) {
    const $childElem = $elem.childNodes[i];
    const childNode = children[i];

    update(childNode, $elem, $childElem);
  }

  while ($elem.childNodes.length > children.length) {
    $elem.removeChild($elem.lastChild);
  }
}

/**
 * Creates, replaces, or updates an HTML element to match a node description.
 *
 * @param node
 *   A description of the target state of the HTML element.
 * @param $parent
 *   The HTML element that the updated element should be a child of.  This is a
 *   required argument.
 * @param $elem
 *   The element currently sitting at the location that should be updated to
 *   match the node description.  If `null`, it is assumed that the node
 *   describes a new child that should be appended to the current list.  If the
 *   type of the element does not match the node type it will be replaced
 *   rather than updated.
 */
function update(node, $parent, $elem) {
  const $original = $elem;

  if (typeof node === "string") {
    if ($elem == null || $elem.nodeType !== Node.TEXT_NODE) {
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

/**
 * Creates a node object describing a regular HTML element.
 *
 * @param type
 *   The element tag name.
 * @param attributes
 *   A non-optional mapping from attribute names to target state values.
 * @param children
 *   An arbitrary number of node objects or strings describing the children of
 *   this node.
 */
export function h(type, attributes, ...children) {
  return { type, attributes, children };
}

/**
 * Replaces or updates the children of `$root` to match the descriptions passed
 * as positional arguments.
 *
 * @param $root
 *   A reference to an HTML element, the children of which should be updated.
 *
 * @param children
 *   An arbitrary number of node objects or strings describing the desired
 *   state of the children of this element.
 */
export function render($root, ...nodes) {
  updateChildren($root, nodes);
}
