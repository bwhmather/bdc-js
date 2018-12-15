Ben's DOM Clobberer
===================

Yet another javascript library for updating the html DOM to match a javascript
description.

Unlike libraries such as react, BDC tries to diff directly against the DOM.
This results in a smaller, simpler, and probably much slower library.


## Installation

Releases of BDC are published to npm.  They can be installed by running:

    npm install bdc


## Usage

BDC exposes two functions, `h` and `render`.
`h` can be used to build up a javascript representation of the target state of
a subtree of the DOM.
`render` will take that target state, and apply any transformations necessary
to make the DOM match.

`h` takes a tag name, an object containing attributes to set on the html
element, and any number of child nodes as variadic arguments


## License

BDC is made available under the terms of the MIT license.  See `LICENSE` for
details.

