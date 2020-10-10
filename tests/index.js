"use strict";

const http = require("http");
const fs = require("fs");
const url = require("url");

const { test, skip } = require("zora");
const playwright = require("playwright");

const browserName = process.env.BROWSER || "firefox";

function sendFile(filepath, contentType, res) {
  console.log(filepath);
  fs.readFile(filepath, function (err, data) {
    if (err) {
      res.statusCode = 500;
      res.end("Error getting file");
      return;
    }

    res.setHeader("Content-Type", contentType);
    res.end(data);
  });
}

function serveFixtures(req, res) {
  const filepath = url.parse(req.url).pathname;

  switch (filepath) {
    case "/":
      return sendFile("tests/fixture.html", "text/html", res);

    case "/bdc.js":
      return sendFile("dist/bdc.js", "text/javascript", res);

    default:
      res.statusCode = 404;
      res.end("Not Found");
      return;
  }
}

class ValueSelector {
  #selectFn;

  constructor(selectFn) {
    this.#selectFn = selectFn;
  }

  async select(page) {
    return await this.#selectFn(page);
  }
}

class ElementSelector {
  #query;

  constructor(query) {
    this.#query = query;
  }

  async select(page) {
    return await page.$(this.#query);
  }

  async click(page) {
    return await page.click(this.#query);
  }

  get tagName() {
    return new ValueSelector(async (page) => {
      return await page.$eval(this.#query, (element) => {
        return element.localName;
      });
    });
  }

  get attributes() {
    return new ValueSelector(async (page) => {
      return await page.$eval(this.#query, (element) => {
        const input = element.attributes;
        const output = {};
        for (let i = 0; i < input.length; i++) {
          output[input[i].name] = input[i].value;
        }
        return output;
      });
    });
  }

  attribute(name) {
    return new ValueSelector(async (page) => {
      return await this.page.getAttribute(query, name);
    });
  }

  property(name) {
    return new ValueSelector(async (page) => {
      return await page.$eval(
        this.#query,
        (element, name) => {
          return element[name];
        },
        name
      );
    });
  }

  get children() {
    return new ValueSelector(async (page) => {
      return await page.$$(`${this.#query} > *`);
    });
  }

  child(n, cls) {
    if (typeof cls === "undefined") {
      cls = "*";
    }
    return new ElementSelector(`${this.#query} > ${cls}:nth-child(${n + 1})`);
  }

  get childElementCount() {
    return new ValueSelector(async (page) => {
      const children = await select(page, this.children);
      return children.length;
    });
  }

  get childNodeCount() {
    return new ValueSelector(async (page) => {
      return await page.$eval(this.#query, (element) => {
        let child = element.firstChild;
        let count = 0;
        while (child) {
          count++;
          child = child.nextSibling;
        }
        return count;
      });
    });
  }

  #apply(method) {
    return new ValueSelector(async (page) => {
      return await page[method](this.#query);
    });
  }

  get textContent() {
    return this.#apply("textContent");
  }

  get innerText() {
    return this.#apply("innerText");
  }
  get innerHTML() {
    return this.#apply("innerText");
  }

  get focused() {
    return new ValueSelector(async (page) => {
      return await page.$eval(this.#query, (element) => {
        return element === document.activeElement;
      });
    });
  }
}

async function select(page, selector) {
  return await selector.select(page);
}

async function click(page, selector) {
  return await selector.click(page);
}

// TODO need to guarantee that this only selects one element.
const $root = new ElementSelector("#root");

test("Browser", async (t) => {
  const server = http.createServer(serveFixtures);
  await server.listen(0, "127.0.0.1");

  const serverAddress = server.address();
  const serverUrl = `http://${serverAddress.address}:${serverAddress.port}`;

  const browser = await playwright[browserName].launch();

  async function withPage(callback) {
    const page = await browser.newPage();

    try {
      await page.goto(serverUrl);
      await callback(page);
    } finally {
      await page.close();
    }
  }

  await t.test("Hello world", async (t) => {
    await withPage(async (page) => {
      await page.evaluate(() => {
        bdc.clobber($root, "Hello, World!");
      });

      t.eq(await select(page, $root.childNodeCount), 1);
      t.eq(await select(page, $root.textContent), "Hello, World!");
    });
  });

  await t.test("Empty div", async (t) => {
    await withPage(async (page) => {
      await page.evaluate(() => {
        bdc.clobber(document.getElementById("root"), bdc.h("div"));
      });

      t.eq(await select(page, $root.childNodeCount), 1);
      t.eq(await select(page, $root.child(0).tagName), "div");
      t.eq(await select(page, $root.child(0).attributes), {});
      t.eq(await select(page, $root.child(0).childNodeCount), 0);
    });
  });

  await t.test("No attribute div with text child", async (t) => {
    await withPage(async (page) => {
      await page.evaluate(() => {
        bdc.clobber(document.getElementById("root"), bdc.h("div", "contents"));
      });

      t.eq(await select(page, $root.childNodeCount), 1);
      t.eq(await select(page, $root.child(0).tagName), "div");
      t.eq(await select(page, $root.child(0).attributes), {});
      t.eq(await select(page, $root.child(0).childNodeCount), 1);
      t.eq(await select(page, $root.child(0).childElementCount), 0);
      t.eq(await select(page, $root.child(0).textContent), "contents");
    });
  });

  await t.test("No attribute div with span child", async (t) => {
    await withPage(async (page) => {
      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("div", bdc.h("span"))
        );
      });

      t.eq(await select(page, $root.childNodeCount), 1);
      t.eq(await select(page, $root.child(0).tagName), "div");
      t.eq(await select(page, $root.child(0).attributes), {});
      t.eq(await select(page, $root.child(0).childNodeCount), 1);
      t.eq(await select(page, $root.child(0).child(0).tagName), "span");
      t.eq(await select(page, $root.child(0).child(0).attributes), {});
      t.eq(await select(page, $root.child(0).child(0).childNodeCount), 0);
    });
  });

  await t.test("No attribute div with list of children", async (t) => {
    await withPage(async (page) => {
      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("div", [bdc.h("span")])
        );
      });

      t.eq(await select(page, $root.childNodeCount), 1);
      t.eq(await select(page, $root.child(0).tagName), "div");
      t.eq(await select(page, $root.child(0).attributes), {});
      t.eq(await select(page, $root.child(0).childNodeCount), 1);
      t.eq(await select(page, $root.child(0).child(0).tagName), "span");
      t.eq(await select(page, $root.child(0).child(0).attributes), {});
      t.eq(await select(page, $root.child(0).child(0).childNodeCount), 0);
    });
  });

  await t.test("Clobber Variadic List", async (t) => {
    await withPage(async (page) => {
      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("div", {}, "item 1"),
          bdc.h("div", {}, "item 2"),
          bdc.h("div", {}, "item 3")
        );
      });

      t.eq(await select(page, $root.childElementCount), 3);
      t.eq(await select(page, $root.child(0).textContent), "item 1");
      t.eq(await select(page, $root.child(1).textContent), "item 2");
      t.eq(await select(page, $root.child(2).textContent), "item 3");
    });
  });

  await t.test("Clobber Array List", async (t) => {
    await withPage(async (page) => {
      await page.evaluate(() => {
        bdc.clobber(document.getElementById("root"), [
          bdc.h("li", {}, "item 1"),
          bdc.h("li", {}, "item 2"),
          bdc.h("li", {}, "item 3"),
        ]);
      });

      t.eq(await select(page, $root.childElementCount), 3);
      t.eq(await select(page, $root.child(0).textContent), "item 1");
      t.eq(await select(page, $root.child(1).textContent), "item 2");
      t.eq(await select(page, $root.child(2).textContent), "item 3");
    });
  });

  await t.test("Clobber Keyed List", async (t) => {
    await withPage(async (page) => {
      await page.evaluate(() => {
        bdc.clobber(document.getElementById("root"), [
          bdc.h("div", { "x-bdc-key": "a" }, bdc.h("input", {})),
          bdc.h("div", { "x-bdc-key": "b" }, bdc.h("input", {})),
          bdc.h("div", { "x-bdc-key": "c" }, bdc.h("input", {})),
          bdc.h("div", { "x-bdc-key": "d" }, bdc.h("input", {})),
          bdc.h("div", { "x-bdc-key": "e" }, bdc.h("input", {})),
        ]);
      });

      await click(page, $root.child(2).child(0, "input"));

      await page.evaluate(() => {
        bdc.clobber(document.getElementById("root"), [
          bdc.h("div", { "x-bdc-key": "d" }, bdc.h("input", {})),
          bdc.h("div", { "x-bdc-key": "c" }, bdc.h("input", {})),
          bdc.h("div", { "x-bdc-key": "b" }, bdc.h("input", {})),
          bdc.h("div", { "x-bdc-key": "a" }, bdc.h("input", {})),
        ]);
      });

      t.eq(await select(page, $root.child(1).child(0, "input").focused), true);
    });
  });

  await t.test("Variadic List", async (t) => {
    await withPage(async (page) => {
      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h(
            "ul",
            {},
            bdc.h("li", {}, "item 1"),
            bdc.h("li", {}, "item 2"),
            bdc.h("li", {}, "item 3")
          )
        );
      });

      t.eq(await select(page, $root.childElementCount), 1);
      t.eq(await select(page, $root.child(0).tagName), "ul");
      t.eq(await select(page, $root.child(0).childElementCount), 3);
      t.eq(await select(page, $root.child(0).child(0).textContent), "item 1");
      t.eq(await select(page, $root.child(0).child(1).textContent), "item 2");
      t.eq(await select(page, $root.child(0).child(2).textContent), "item 3");
    });
  });

  await t.test("Array List", async (t) => {
    await withPage(async (page) => {
      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("ul", {}, [
            bdc.h("li", {}, "item 1"),
            bdc.h("li", {}, "item 2"),
            bdc.h("li", {}, "item 3"),
          ])
        );
      });

      t.eq(await select(page, $root.childElementCount), 1);
      t.eq(await select(page, $root.child(0).tagName), "ul");
      t.eq(await select(page, $root.child(0).childElementCount), 3);
      t.eq(await select(page, $root.child(0).child(0).textContent), "item 1");
      t.eq(await select(page, $root.child(0).child(1).textContent), "item 2");
      t.eq(await select(page, $root.child(0).child(2).textContent), "item 3");
    });
  });

  await t.test("Keyed List", async (t) => {
    await withPage(async (page) => {
      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("ul", {}, [
            bdc.h("li", { "x-bdc-key": "a" }, bdc.h("input", {})),
            bdc.h("li", { "x-bdc-key": "b" }, bdc.h("input", {})),
            bdc.h("li", { "x-bdc-key": "c" }, bdc.h("input", {})),
            bdc.h("li", { "x-bdc-key": "d" }, bdc.h("input", {})),
            bdc.h("li", { "x-bdc-key": "e" }, bdc.h("input", {})),
          ])
        );
      });

      await click(page, $root.child(0, "ul").child(2).child(0, "input"));

      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("ul", {}, [
            bdc.h("li", { "x-bdc-key": "d" }, bdc.h("input", {})),
            bdc.h("li", { "x-bdc-key": "c" }, bdc.h("input", {})),
            bdc.h("li", { "x-bdc-key": "b" }, bdc.h("input", {})),
            bdc.h("li", { "x-bdc-key": "a" }, bdc.h("input", {})),
          ])
        );
      });

      t.eq(
        await select(
          page,
          $root.child(0, "ul").child(1).child(0, "input").focused
        ),
        true
      );
    });
  });

  await t.test("Link", async (t) => {
    await withPage(async (page) => {
      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("a", { href: "#success" }, "Add Fragment")
        );
      });

      await click(page, $root.child(0, "a"));

      t.ok(/#success$/.test(await page.url()));
    });
  });

  await t.test("Booleans", async (t) => {
    await withPage(async (page) => {
      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("div", { "x-a": false, "x-b": true })
        );
      });

      t.eq(await select(page, $root.child(0).attributes), { "x-b": "" });
    });
  });

  await t.test("Swapping", async (t) => {
    await withPage(async (page) => {
      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("b", {}, "Bold"),
          bdc.h("i", {}, "Italic")
        );
      });

      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("i", {}, "Italic"),
          bdc.h("b", {}, "Bold")
        );
      });

      t.eq(await select(page, $root.childElementCount), 2);
      t.eq(await select(page, $root.child(0).tagName), "i");
      t.eq(await select(page, $root.child(0).textContent), "Italic");
      t.eq(await select(page, $root.child(1).tagName), "b");
      t.eq(await select(page, $root.child(1).textContent), "Bold");
    });
  });

  await t.test("Removing attributes", async (t) => {
    await withPage(async (page) => {
      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("div", { "x-a": "original" })
        );
      });

      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("div", { "x-b": "new" })
        );
      });

      t.eq(await select(page, $root.child(0).attributes), { "x-b": "new" });
    });
  });

  await t.test("Event handlers", async (t) => {
    await withPage(async (page) => {
      // Set an event handler.
      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("button", {
            onclick: (evt) => {
              evt.target.setAttribute("x-clicked", "");
            },
          })
        );
      });

      // Click the button.
      await click(page, $root.child(0, "button"));

      // Check the value.
      t.eq(await select(page, $root.child(0).attributes), { "x-clicked": "" });
    });
  });

  await t.test("Removing event handlers", async (t) => {
    await withPage(async (page) => {
      // Set an event handler.
      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("button", {
            onclick: (evt) => {
              evt.target.setAttribute("x-clicked", "");
            },
          })
        );
      });

      // Remove the event handler.
      await page.evaluate(() => {
        bdc.clobber(document.getElementById("root"), bdc.h("button", {}));
      });

      // Click the button.
      await click(page, $root.child(0, "button"));

      // Check that the handler wasn't fired.
      t.eq(await select(page, $root.child(0).attributes), {});
    });
  });

  await t.test("Replacing event handlers", async (t) => {
    await withPage(async (page) => {
      // Set an event handler.
      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("button", {
            onclick: (evt) => {
              evt.target.setAttribute("x-old-clicked", "");
            },
          })
        );
      });

      // Remove the event handler.
      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("button", {
            onclick: (evt) => {
              evt.target.setAttribute("x-new-clicked", "");
            },
          })
        );
      });

      // Click the button.
      await click(page, $root.child(0, "button"));

      // Check that the handler wasn't fired.
      t.eq(await select(page, $root.child(0).attributes), {
        "x-new-clicked": "",
      });
    });
  });

  await t.test("Restoring event handlers", async (t) => {
    await withPage(async (page) => {
      // Set an event handler.
      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("button", {
            onclick: (evt) => {
              evt.target.setAttribute("x-clicked", "");
            },
          })
        );
      });

      // Remove the event handler.
      await page.evaluate(() => {
        bdc.clobber(document.getElementById("root"), bdc.h("button", {}));
      });

      // Reset the event handler.
      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("button", {
            onclick: (evt) => {
              evt.target.setAttribute("x-clicked", "");
            },
          })
        );
      });

      // Click the button.
      await click(page, $root.child(0, "button"));

      // Check that the handler wasn't fired.
      t.eq(await select(page, $root.child(0).attributes), { "x-clicked": "" });
    });
  });

  await t.test("Re-apply input value preserves cursor", async (t) => {
    await withPage(async (page) => {
      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("input", { value: "" })
        );
      });

      await click(page, $root.child(0));
      await page.keyboard.press("a");
      await page.keyboard.press("ArrowLeft");

      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("input", { value: "a" })
        );
      });

      await page.keyboard.press("b");

      t.eq(await select(page, $root.child(0).property("value")), "ba");
    });
  });

  await t.test("No injection on create text node", async (t) => {
    await withPage(async (page) => {
      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("p", {}, "<script>window.alert('w00t')</script>")
        );
      });

      t.eq(await select(page, $root.childElementCount), 1);
      t.eq(
        await select(page, $root.child(0).textContent),
        "<script>window.alert('w00t')</script>"
      );
    });
  });

  await t.test("No injection on update text node", async (t) => {
    await withPage(async (page) => {
      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("p", {}, "harmless")
        );
      });

      await page.evaluate(() => {
        bdc.clobber(
          document.getElementById("root"),
          bdc.h("p", {}, "<script>window.alert('w00t')</script>")
        );
      });

      t.eq(await select(page, $root.childElementCount), 1);
      t.eq(
        await select(page, $root.child(0).textContent),
        "<script>window.alert('w00t')</script>"
      );
    });
  });

  await browser.close();
  await server.close();
});
