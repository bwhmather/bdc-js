Ben's DOM Clobberer
===================

[![Build Status](https://travis-ci.org/bwhmather/bdc-js.svg?branch=develop)](https://travis-ci.org/bwhmather/bdc-js)

Yet another javascript library for updating the html DOM to match a javascript
description.

Unlike libraries such as react, BDC tries to diff directly against the DOM.
This results in a smaller, simpler, and probably much slower library.

BDC is currently under active development but is starting to see use.  The API
is unlikely to change significantly before 1.0, but there may still be bugs
that need to be ironed out.


## Installation

Releases of BDC are published to npm.  They can be installed by running:

    npm install bdc


## Usage

BDC exposes two functions, `h` and `clobber`.
`h` can be used to build up a javascript representation of the target state of
a subtree of the DOM.
`clobber` will take a DOM element and a node or list of nodes describing the
target state of the children of element, and apply any DOM manipulations
necessary to make the element match.

`h` takes a tag name, an object containing attributes to set on the html
element, and any number of child nodes as variadic arguments


## Contributing

BDC development is hosted on github at https://github.com/bwhmather/bdc-js.
Bug reports and pull requests welcomed enthusiastically.


## License

BDC is made available under the terms of the MIT license.  See `LICENSE` for
details.

