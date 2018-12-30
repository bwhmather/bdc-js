Ben's DOM Clobberer
===================

[![Build Status](https://travis-ci.org/bwhmather/bdc-js.svg?branch=develop)](https://travis-ci.org/bwhmather/bdc-js)

Yet another javascript library for updating the html DOM to match a javascript
description.

Unlike libraries such as react, BDC tries to diff directly against the DOM.
This results in a smaller, simpler, and probably much slower library.

BDC is currently under heavy development, and the API is likely to change
significantly before 1.0.  You should currently expect to encounter frequent
bugs and breaking changes.


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


## Contributing

BDC development is hosted on github at https://github.com/bwhmather/bdc-js.
Bug reports and pull requests welcomed enthusiastically.


## License

BDC is made available under the terms of the MIT license.  See `LICENSE` for
details.

