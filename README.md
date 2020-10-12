Ben's DOM Clobberer
===================

[![Build Status](https://travis-ci.org/bwhmather/bdc-js.svg?branch=master)](https://travis-ci.org/bwhmather/bdc-js)

Ben's DOM Clobberer (BDC) is a tiny javascript library for updating the html DOM
to match a javascript description.

It weighs less that 1KiB when gzipped, and presents a simple API that makes it
easy to describe HTML without needing to resort to JSX.

Unlike libraries such as react, BDC does not have a component system.
Instead it follows the Elm model and requires a complete description of the
target state to be provided as a static data structure.
BDC can be used with WebComponents if stateful sub-trees are required.

BDC does not construct a virtual DOM, preferring to diff directly against
the real thing.
This results in a smaller, simpler, and probably much slower library.

BDC is a good choice for small projects that are too dynamic to complete easily
using vanilla javascript, but where a complex build setup and tens of megabytes
of compiled code would be overkill.
It is a bad choice for pages that must repeatedly re-render a large amount of
dynamic data, and for more complicated applications where you may benefit from
the larger ecosystem around other libraries.

BDC is now largely finished.  The API is frozen and all bugs that I am aware of
have been fixed.  It has seen enough real world use that I am now confident to
recommend it in the niche it aims to fill.  Expect a steady trickle of
documentation improvements and occasional bug fixes but no breaking changes.


## Installation

Releases of BDC are published to npm.  They can be installed by running:

    npm install bdc

The npm package contains Common-JS, ES6 and IIFE bundles of the library, as
well as a type script definition file.

Alternatively, prebuilt source files are pushed to github releases and can be
saved and included directly in your project.


## Usage

BDC exposes two functions, `h` and `clobber`.
`h` is used to build up a javascript representation of the target state of a
subtree of the DOM.  It returns a new tree node with the given type, attributes
and children.
Children can be other nodes constructed using `h`, or strings.

`clobber` takes a DOM element and a node or list of nodes describing the target
state of the children of element, and will apply any DOM manipulations that are
needed to make the two match.

Using it inline is simple:

```javascript
clobber(
  document.body,
  h("marquee", [
    h("span", {"style": "font-weight: bold"}, "Hello"), ", ",
    h("blink", "world"), "!",
  ]),
);
```

When run, this example will update the DOM of the current document to be match
what would result from the following HTML:

```html
<marquee>
  <span style="font-weight: bold">Hello</span>, <blink>World</blink>!
</marquee>
```

Both `h` and `clobber` can accept child nodes either as variadic arguments or 
as a list.  The following two calls are equivalent:

```javascript
h("ul", [h("li", ["milk"]), h("li", ["eggs"]), h("li", ["binliners"])]);
h("ul", h("li", "milk"), h("li", "eggs"), h("li", "binliners"));
```

Both will return a static tree that maps to the following html:

```html
<ul><li>milk</li><li>eggs</li><li>binliners</li></ul>
```

Attributes can be set by passing an object as the second argument to `h`.
There is no way to set attributes on the root element passed to clobber.

This example will map to a `div` with `width` set to `"200px"`:

``` javascript
h("div", {height: "2000px"}, "TALL")
```


### Preserving input state

Values set by BDC will take priority over previous changes by the user.

Internally, BDC uses DOM property assignment wherever possible, only falling
back to `setAttribute` if the element doesn't export the property of interest.
This [article](https://javascript.info/dom-attributes-and-properties) is a good
resource if you would like to learn more about the difference.

Applications built with BDC are required to listen for changes to input state
and update the node DOM to match.  Failing to do so will result in the element
DOM state being replaced the next time that `clobber` is called.

It is very often acceptable to be lazy about this.  If you can be certain that
no other events will trigger a clobber, listening for the `onchange` event
instead of `oninput` can be a reasonable optimisation.


### Event Handlers

Attributes prefixed with `on` are bound as event handlers.

BDC expects event handlers to be function objects, not strings.  Event handlers
are called in exactly the same way as if they had been bound using the
`addEventListener` method.

```javascript
let red = false;

function onclick(evt) {
    red = !red;
    redraw();
    evt.preventDefault();
}

function redraw() {
    let style = red ? 'color: red;' : '';
    clobber(document.body, h("button", {onclick: onclick, style: style}, 'Click!'));
}
redraw();
```

Event handlers are a special case because the DOM API provides no way to
enumerate event handlers bound to an element.
BDC keeps a record of what event handlers it has bound to any elements, and
will safely add, remove and deduplicate them, but will not touch existing event
handlers.
This may be a problem if BDC inherits a server rendered DOM with event
handlers already in place as BDC will not know to avoid binding them again.

This is one place where BDC does sort-of resemble a vdom library.


### Keyed updates

Nodes can be assigned a key by setting the `x-bdc-key` special attribute.
When updating an element, for every child node BDC will search through each
unmatched child element to find the first with the same type and key.
It will then move it to the next place in the list.
If no match can be found, BDC will create a new element.

This means that changes to nodes with the same key will affect the same
element, even if the nodes are shuffled.

This is essential for preserving input focus, and can potentially make updates
faster by minimizing changes if nodes are inserted.

In the following example, the order of two inputs is switched while preserving
input state and focus.

```javascript
clobber($root, h("ul", {}, [
    h("li", {x-bdc-key: "a"}, h("input", {})),
    h("li", {x-bdc-key: "b"}, h("input", {})),
]));

clobber($root, h("ul", {}, [
    h("li", {x-bdc-key: "b"}, h("input", {})),
    h("li", {x-bdc-key: "a"}, h("input", {})),
]));
```
The BDC algorithm to figure out the mapping from key nodes to DOM elements is,
worst case, O(n^2) in the number of nodes.
If the elements are in approximately the right order, real performance will be
closer to O(n).


### Autofocus

BDC will automatically focus the last new element created with `autofocus` set
to true.  If `autofocus` is set on an already existing element, it will have no
effect.  If no new elements are created with `autofocus` set to true, BDC will
preserve the current focus.

```javascript
clobber(document.getElementById("form"), [
    h("label" {for: "input"}, "Text field"),
    h("input", {id: "input", autofocus: true}),
]);
```

### CSS

The `style` attribute is a string, as most users would expect, but is
implemented as a special case and therefore deserves mention.

While most attributes have fairly straightforward DOM property counterparts,
`style` us parsed and exposed as a [CSSStyleDeclarationProperty](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration).
Rather than expect users to construct on of these for each render, BDC will set
the existing objects `cssText` property to match what the user passes.


### Web Components

BDC does make some guarantees that the identity of the nodes that it manages
will remain stable (see [Keyed Updates](#keyed-updates)).

It will, however, automatically remove modifications made by other code to the
nodes that it is responsible for.

Fortunately BDC integrates well with webcomponents.


## Contributing

BDC development is hosted on github at https://github.com/bwhmather/bdc-js.
Bug reports and pull requests welcomed enthusiastically.


## License

BDC is made available under the terms of the MIT license.  See `LICENSE` for
details.

