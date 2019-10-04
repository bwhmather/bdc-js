/***
 * Ben's DOM Clobberer
 * ===================
 *
 * Copyright (c) 2018 Ben Mather <bwhmather@bwhmather.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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
    // name.  See documentation on `EVENT_HANDLER_MAP` for details on how we
    // work around this.
    const eventName = key.slice(2);
    if (!EVENT_HANDLER_MAP.has($elem)) {
      EVENT_HANDLER_MAP.set($elem, {});
    }

    const handlers = EVENT_HANDLER_MAP.get($elem);

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

/**
 * Replaces the attributes of an HTML element with the values described by an
 * object representing a set of key value pairs.
 *
 * @param $elem
 *   The HTML element to update the attributes of.
 * @param attributes
 *   A plain JS object with keys corresponding to attributes in the target
 *   state of the element.
 */
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

/**
 * Updates the children of `$elem` to match a list of node descriptions.
 *
 * @param $elem
 *   The HTML element who's children should be updated.
 * @param children
 *   An array of node descriptions.
 */
function updateChildren($elem, children) {
  let $cursor = $elem.firstChild;
  for (const childNode of children) {
    $cursor = update(childNode, $elem, $cursor);
  }

  // Remove any trailing elements.
  while ($cursor) {
    const $target = $cursor;
    $cursor = $cursor.nextSibling;
    $elem.removeChild($target);
  }
}

/**
 * Creates, replaces, or updates an HTML element to match a node description.
 *
 * Basic operation:
 *   - Search from `$cursor` for elements matching key..
 *   - If type does not match then remove the element and create a new one.
 *   - Update the element to match node description.
 *   - Reinsert the element in the right place.
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
 *
 * @returns
 *   An updated cursor.
 */
function update(node, $parent, $cursor) {
  let $elem = $cursor;

  if (typeof node === "string") {
    if ($elem == null || $elem.nodeType !== Node.TEXT_NODE) {
      $elem = document.createTextNode(node);
    } else {
      $elem.nodeValue = node;
    }

  } else {
    // Find matching element.
    const nodeKey = node.attributes["x-bdc-key"] || null;

    while ($elem) {
      if ($elem.nodeType !== Node.TEXT_NODE) {
        if ($elem.localName === node.type) {
          let elemKey = null;
          // In slightly older browsers, `getAttribute` will return an empty
          // string if an attribute is missing.
          if ($elem.hasAttribute("x-bdc-key")) {
            elemKey = $elem.getAttribute("x-bdc-key");
          }

          if (elemKey === nodeKey) {
            break;
          }
        }
      }

      $elem = $elem.nextSibling;
    }

    if ($elem == null) {
      // Can't find an existing element of the right type to update.  Create a
      // new one.
      $elem = document.createElement(node.type);
    }

    updateAttributes($elem, node.attributes);
    updateChildren($elem, node.children);
  }

  if ($elem !== $cursor) {
    $parent.insertBefore($elem, $cursor);
  }

  return $elem.nextSibling;
}

export type Node = {
  type: string,
  attributes: object,
  children: Node[],
} | string;

/**
 * Creates a node object describing a regular HTML element.
 *
 * @param type
 *   The element tag name.
 * @param attributes
 *   A non-optional mapping from attribute names to target state values.
 * @param children
 *   An arbitrary number of node objects or strings describing the children of
 *   this node.  Can be provided either as variadic arguments, or as a single
 *   array.
 */
export function h(type: string, attributes: object, children: Node[]): Node;
export function h(type: string, attributes: object, ...children: Node[]): Node;
export function h(type, attributes, ...children) {
  if (children.length === 1 && Array.isArray(children[0])) {
    children = children[0];
  }
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
export function clobber($root: HTMLElement, children: Node[]): void;
export function clobber($root: HTMLElement, ...children: Node[]): void;
export function clobber($root: HTMLElement, ...children) {
  const activeElement = document.activeElement as HTMLElement;

  if (children.length === 1 && Array.isArray(children[0])) {
    children = children[0];
  }
  updateChildren($root, children);

  if (
    activeElement != null &&
    document.activeElement !== activeElement &&
    typeof activeElement.focus === "function"
  ) {
    activeElement.focus({preventScroll: true});
  }
}
