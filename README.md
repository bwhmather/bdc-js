Ben's DOM Clobberer
===================

[![Build Status](https://travis-ci.org/bwhmather/bdc-js.svg?branch=develop)](https://travis-ci.org/bwhmather/bdc-js)

Yet another javascript library for updating the html DOM to match a javascript
description.

Unlike libraries such as react, BDC tries to diff directly against the DOM.
This results in a smaller, simpler, and probably much slower library.

You should use BDC if:
  - You really care about footprint.  BDC is less than 1KB when gzipped.
  - You would like an API that is useable without a build step.

You should not use BDC if:
  - You care about performance on large DOMs.
  - You need to be able to embed components managed by other libraries.
  - You would like to render SVG.

BDC is currently under active development.  The API is unlikely to change
significantly before 1.0, but there may still be bugs that need to be ironed
out.


## Installation

Releases of BDC are published to npm.  They can be installed by running:

    npm install bdc

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
clobber($root, h("marquee", {}, "Hello"), ", ", h("blink", {}, "world"), "!");
```

When run, this example will update the `$root` to contain the following HTML:

```html
<marquee>Hello</marquee>, <blink>world</blink>
```

Both `h` and `clobber` can accept child nodes either as variadic arguments or 
as a list.  The following two calls are equivalent:

```javascript
h("ul", {}, [h("li", {}, "milk"), h("li", {}, "eggs"), h("li", {}, "binliners")])
h("ul", {}, h("li", {}, "milk"), h("li", {}, "eggs"), h("li", {}, "binliners"))
```

Both will return a static tree that maps to the following html:

```html
<ul><li>milk</li><li>eggs</li><li>binliners</li></ul>
```


### Event Handlers

Attributes prefixed with `on` are treated as event handlers.

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
This should mean that changes to nodes with the same key will affect the same
element, even if the nodes are shuffled.

This is essential for preserving input focus, and can potentially make updates faster, by minimizing changes if nodes are inserted.
Please remember that while the algorithm that BDC uses to resolve the elements
for keyed nodes is O(n) if the nodes and elements are in the same order, it
is O(n^2) for arbitrary input.



## Contributing

BDC development is hosted on github at https://github.com/bwhmather/bdc-js.
Bug reports and pull requests welcomed enthusiastically.


## License

BDC is made available under the terms of the MIT license.  See `LICENSE` for
details.

