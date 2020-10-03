const http = require("http");
const fs = require("fs");
const url = require("url");

const { test, skip } = require("zora");
const webdriver = require("selenium-webdriver");

function sendFile(filepath, contentType, res) {
  console.log(filepath)
  fs.readFile(filepath, function(err, data) {
    if (err) {
      res.statusCode = 500;
      res.end('Error getting file');
      return;
    }

    res.setHeader('Content-Type', contentType);
    res.end(data);
  });
}

function serveFixtures(req, res) {
  const filepath = url.parse(req.url).pathname;

  switch (filepath) {
  case '/':
    return sendFile('tests/fixture.html', 'text/html', res);

  case '/bdc.js':
    return sendFile('dist/bdc.js', 'text/javascript', res);

  default:
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }
};

async function withDriver(callback) {
  const server = http.createServer(serveFixtures);
  await server.listen(0, '127.0.0.1');

  const serverAddress = server.address();
  const serverUrl = `http://${serverAddress.address}:${serverAddress.port}`;

  const driver = new webdriver.Builder().forBrowser("firefox").build();

  try {
    await driver.get(serverUrl);
    await callback(driver);
  } finally {
    driver.quit();
    server.close();
  }
}

async function selectRoot(driver) {
  return await driver.findElement(webdriver.By.id('root'));
}

async function selectChildren(element) {
  return await element.findElements(webdriver.By.xpath(".//*"));
}

test("Hello world", async t => {
  await withDriver(async driver => {
    await driver.executeScript(() => {
      bdc.clobber($root, h('h1', 'Hello, World!'));
    });

    const $root = await selectRoot(driver);
    const $children = await selectChildren($root);
    const $h1 = $children[0];

    t.eq($children.length, 1);
    t.eq((await selectChildren($h1)).length, 0);
    t.eq(await $h1.getText(), "Hello, World!")
  })
});

test("Empty div", async t => {
  await withDriver(async driver => {
    await driver.executeScript(() => {
      bdc.clobber(
        document.getElementById('root'),
        bdc.h('div'),
      );
    });

    const $root = await selectRoot(driver);
    const $rootChildren = await selectChildren($root);
    const $div = $rootChildren[0];
    const $divChildren = await selectChildren($div);

    t.eq($rootChildren.length, 1);
    t.eq($divChildren.length, 0);
    t.eq(await $div.getTagName(), "div");
  });
});

// const $root = Selector('#root');

skip("Hello world", async t => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      "Hello, World!",
    );
  });

  await t.expect($root.textContent).eql("Hello, World!");
  await t.expect($root.hasChildElements).eql(false);
  await t.expect($root.childNodeCount).eql(1);
});

skip("Empty div", async t => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('div'),
    );
  });

  await t.expect($root.childElementCount).eql(1);
  await t.expect($root.child(0).tagName).eql('div');
  await t.expect($root.child(0).hasChildNodes).eql(false);
  await t.expect($root.child(0).attributes).eql({});
});

skip("Empty div with empty attributes", async t => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('div'),
    );
  });

  await t.expect($root.childElementCount).eql(1);
  await t.expect($root.child(0).tagName).eql('div');
  await t.expect($root.child(0).hasChildNodes).eql(false);
  await t.expect($root.child(0).attributes).eql({});
});

skip("No attribute div with text child", async t => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('div', "contents"),
    );
  });

  await t.expect($root.childElementCount).eql(1);
  await t.expect($root.child(0).tagName).eql('div');
  await t.expect($root.child(0).textContent).eql('contents');
  await t.expect($root.child(0).attributes).eql({});
});

skip("No attribute div with span child", async t => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('div', bdc.h('span')),
    );
  });

  await t.expect($root.childElementCount).eql(1);
  await t.expect($root.child(0).tagName).eql('div');
  await t.expect($root.child(0).child(0).tagName).eql("span");
  await t.expect($root.child(0).attributes).eql({});
});

skip("No attribute div with list of children", async t => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('div', [bdc.h('span')]),
    );
  });

  await t.expect($root.childElementCount).eql(1);
  await t.expect($root.child(0).tagName).eql('div');
  await t.expect($root.child(0).child(0).tagName).eql("span");
  await t.expect($root.child(0).attributes).eql({});
});

skip("Clobber Variadic List", async t => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('div', {}, "item 1"),
      bdc.h('div', {}, "item 2"),
      bdc.h('div', {}, "item 3"),
    );
  });

  await t.expect($root.childElementCount).eql(3);
  await t.expect($root.child(0).textContent).eql("item 1");
  await t.expect($root.child(1).textContent).eql("item 2");
  await t.expect($root.child(2).textContent).eql("item 3");
});

skip("Clobber Array List", async t => {
  await t.eval(() => {
    bdc.clobber(document.getElementById('root'), [
      bdc.h('li', {}, "item 1"),
      bdc.h('li', {}, "item 2"),
      bdc.h('li', {}, "item 3"),
    ]);
  });

  await t.expect($root.childElementCount).eql(3);
  await t.expect($root.child(0).textContent).eql("item 1");
  await t.expect($root.child(1).textContent).eql("item 2");
  await t.expect($root.child(2).textContent).eql("item 3");
});

skip("Clobber Keyed List", async t => {
  await t.eval(() => {
    bdc.clobber(document.getElementById('root'), [
      bdc.h('div', {'x-bdc-key': 'a'}, bdc.h('input', {})),
      bdc.h('div', {'x-bdc-key': 'b'}, bdc.h('input', {})),
      bdc.h('div', {'x-bdc-key': 'c'}, bdc.h('input', {})),
      bdc.h('div', {'x-bdc-key': 'd'}, bdc.h('input', {})),
      bdc.h('div', {'x-bdc-key': 'e'}, bdc.h('input', {})),
    ]);
  });

  await t.click($root.child(2).child('input'));

  await t.eval(() => {
    bdc.clobber(document.getElementById('root'), [
      bdc.h('div', {'x-bdc-key': 'd'}, bdc.h('input', {})),
      bdc.h('div', {'x-bdc-key': 'c'}, bdc.h('input', {})),
      bdc.h('div', {'x-bdc-key': 'b'}, bdc.h('input', {})),
      bdc.h('div', {'x-bdc-key': 'a'}, bdc.h('input', {})),
    ]);
  });

  await t.expect($root.child(1).child('input').focused).eql(true);
});

skip("Variadic List", async t => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('ul', {},
        bdc.h('li', {}, "item 1"),
        bdc.h('li', {}, "item 2"),
        bdc.h('li', {}, "item 3"),
      ),
    );
  });

  await t.expect($root.childElementCount).eql(1);
  await t.expect($root.child(0).tagName).eql('ul');
  await t.expect($root.child(0).childElementCount).eql(3);
  await t.expect($root.child(0).child(0).textContent).eql("item 1");
  await t.expect($root.child(0).child(1).textContent).eql("item 2");
  await t.expect($root.child(0).child(2).textContent).eql("item 3");
});

skip("Array List", async t => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('ul', {}, [
        bdc.h('li', {}, "item 1"),
        bdc.h('li', {}, "item 2"),
        bdc.h('li', {}, "item 3"),
      ]),
    );
  });

  await t.expect($root.childElementCount).eql(1);
  await t.expect($root.child(0).tagName).eql('ul');
  await t.expect($root.child(0).childElementCount).eql(3);
  await t.expect($root.child(0).child(0).textContent).eql("item 1");
  await t.expect($root.child(0).child(1).textContent).eql("item 2");
  await t.expect($root.child(0).child(2).textContent).eql("item 3");
});

skip("Keyed List", async t => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('ul', {}, [
        bdc.h('li', {'x-bdc-key': 'a'}, bdc.h('input', {})),
        bdc.h('li', {'x-bdc-key': 'b'}, bdc.h('input', {})),
        bdc.h('li', {'x-bdc-key': 'c'}, bdc.h('input', {})),
        bdc.h('li', {'x-bdc-key': 'd'}, bdc.h('input', {})),
        bdc.h('li', {'x-bdc-key': 'e'}, bdc.h('input', {})),
      ]),
    );
  });

  await t.click($root.child('ul').child(2).child('input'));

  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('ul', {}, [
        bdc.h('li', {'x-bdc-key': 'd'}, bdc.h('input', {})),
        bdc.h('li', {'x-bdc-key': 'c'}, bdc.h('input', {})),
        bdc.h('li', {'x-bdc-key': 'b'}, bdc.h('input', {})),
        bdc.h('li', {'x-bdc-key': 'a'}, bdc.h('input', {})),
      ]),
    );
  });

  await t.expect($root.child('ul').child(1).child('input').focused).eql(true);
});

skip("Link", async t => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('a', {href: "#success"}, "Add Fragment"),
    );
  });

  await t.click($root.child('a'));

  const uri = await t.eval(() => document.documentURI);
  await t.expect(uri).match(/#success$/);
});

skip("Booleans", async t => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('div', {'x-a': false, 'x-b': true}),
    );
  });

  await t.expect($root.child(0).attributes).eql({'x-b': ""});
});

skip("Swapping", async t => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('b', {}, 'Bold'),
      bdc.h('i', {}, 'Italic'),
    )
  });

  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('i', {}, "Italic"),
      bdc.h('b', {}, "Bold"),
    )
  });

  await t.expect($root.childElementCount).eql(2);
  await t.expect($root.child(0).tagName).eql('i');
  await t.expect($root.child(0).textContent).eql("Italic");
  await t.expect($root.child(1).tagName).eql('b');
  await t.expect($root.child(1).textContent).eql("Bold");
});

skip("Removing attributes", async t => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('div', {'x-a': "original"}),
    );
  });

  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('div', {'x-b': "new"}),
    );
  });

  await t.expect($root.child(0).attributes).eql({'x-b': "new"});
});

skip("Event handlers", async t => {
  // Set an event handler.
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('button', {'onclick': evt => {
        evt.target.setAttribute('x-clicked', "");
      }}),
    );
  });

  // Click the button.
  await t.click($root.child('button'));

  // Check the value.
  await t.expect($root.child(0).attributes).eql({'x-clicked': ""});
});

skip("Removing event handlers", async t => {
  // Set an event handler.
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('button', {'onclick': evt => {
        evt.target.setAttribute('x-clicked', "");
      }}),
    );
  });

  // Remove the event handler.
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('button', {}),
    );
  });

  // Click the button.
  await t.click($root.child('button'));

  // Check that the handler wasn't fired.
  await t.expect($root.child(0).attributes).eql({});
});

skip("Replacing event handlers", async t => {
  // Set an event handler.
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('button', {'onclick': evt => {
        evt.target.setAttribute('x-old-clicked', "");
      }}),
    );
  });

  // Remove the event handler.
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('button', {'onclick': evt => {
        evt.target.setAttribute('x-new-clicked', "");
      }})
    );
  });

  // Click the button.
  await t.click($root.child('button'));

  // Check that the handler wasn't fired.
  await t.expect($root.child(0).attributes).eql({'x-new-clicked': ""});
});

skip("Restoring event handlers", async t => {
  // Set an event handler.
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('button', {'onclick': evt => {
        evt.target.setAttribute('x-clicked', "");
      }}),
    );
  });

  // Remove the event handler.
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('button', {}),
    );
  });

  // Reset the event handler.
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('button', {'onclick': evt => {
        evt.target.setAttribute('x-clicked', "");
      }}),
    );
  });

  // Click the button.
  await t.click($root.child('button'));

  // Check that the handler wasn't fired.
  await t.expect($root.child(0).attributes).eql({'x-clicked': ""});
});

skip("Re-apply input value preserves cursor", async t => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('input', {'value': ""})
    );
  });

  await t.click($root.child(0));
  await t.pressKey("a");
  await t.pressKey("left");

  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('input', {'value': "a"})
    );
  });

  await t.pressKey("b");

  await t.expect($root.child(0).value).eql("ba");
});

skip("No injection on create text node", async t => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('p', {}, "<script>window.alert('w00t')</script>"),
    );
  });

  await t.expect($root.childElementCount).eql(1);
  await t.expect($root.child(0).textContent).eql(
    "<script>window.alert('w00t')</script>"
  );
});

skip("No injection on update text node", async t => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('p', {}, "harmless"),
    );
  });

  await t.eval(() => {
    bdc.clobber(
      document.getElementById('root'),
      bdc.h('p', {}, "<script>window.alert('w00t')</script>"),
    );
  });

  await t.expect($root.childElementCount).eql(1);
  await t.expect($root.child(0).textContent).eql(
    "<script>window.alert('w00t')</script>"
  );
});
