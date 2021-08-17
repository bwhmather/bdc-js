import { once } from "events";
import http from "http";
import fs from "fs";
import url from "url";

import playwright from "playwright";
import { test as base, expect } from "@playwright/test";

import { click, select, ElementSelector, ValueSelector } from "./selectors.ts";

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

const test = base.extend({
  server: [
    async ({}, use) => {
      const server = http.createServer(serveFixtures);
      await server.listen(0, "127.0.0.1");
      await once(server, "listening");

      const serverAddress = server.address();
      const serverUrl = `http://${serverAddress.address}:${serverAddress.port}`;

      await use(serverUrl);

      await server.close();
    },
    { scope: "worker" },
  ],

  $root: async ({ page, server }, use) => {
    await page.goto(server);
    const $root = await page.$("#root");
    await use($root);
  },
});

test.beforeEach(async ({ page, server }) => await page.goto(server));

const $root = new ElementSelector("#root");

test("Hello world", async ({ page, server }) => {
  await page.evaluate(() => {
    bdc.clobber($root, "Hello, World!");
  });

  expect(await select(page, $root.childNodeCount)).toStrictEqual(1);
  expect(await select(page, $root.textContent)).toStrictEqual("Hello, World!");
});

test("Empty div", async ({ page }) => {
  await page.evaluate(() => {
    bdc.clobber(document.getElementById("root"), bdc.h("div"));
  });

  expect(await select(page, $root.childNodeCount)).toStrictEqual(1);
  expect(await select(page, $root.child(0).tagName)).toStrictEqual("div");
  expect(await select(page, $root.child(0).attributes)).toStrictEqual({});
  expect(await select(page, $root.child(0).childNodeCount)).toStrictEqual(0);
});

test("No attribute div with text child", async ({ page }) => {
  await page.evaluate(() => {
    bdc.clobber(document.getElementById("root"), bdc.h("div", "contents"));
  });

  expect(await select(page, $root.childNodeCount)).toStrictEqual(1);
  expect(await select(page, $root.child(0).tagName)).toStrictEqual("div");
  expect(await select(page, $root.child(0).attributes)).toStrictEqual({});
  expect(await select(page, $root.child(0).childNodeCount)).toStrictEqual(1);
  expect(await select(page, $root.child(0).childElementCount)).toStrictEqual(0);
  expect(await select(page, $root.child(0).textContent)).toStrictEqual(
    "contents"
  );
});

test("No attribute div with span child", async ({ page }) => {
  await page.evaluate(() => {
    bdc.clobber(document.getElementById("root"), bdc.h("div", bdc.h("span")));
  });

  expect(await select(page, $root.childNodeCount)).toStrictEqual(1);
  expect(await select(page, $root.child(0).tagName)).toStrictEqual("div");
  expect(await select(page, $root.child(0).attributes)).toStrictEqual({});
  expect(await select(page, $root.child(0).childNodeCount)).toStrictEqual(1);
  expect(await select(page, $root.child(0).child(0).tagName)).toStrictEqual(
    "span"
  );
  expect(await select(page, $root.child(0).child(0).attributes)).toStrictEqual(
    {}
  );
  expect(
    await select(page, $root.child(0).child(0).childNodeCount)
  ).toStrictEqual(0);
});

test("No attribute div with list of children", async ({ page }) => {
  await page.evaluate(() => {
    bdc.clobber(document.getElementById("root"), bdc.h("div", [bdc.h("span")]));
  });

  expect(await select(page, $root.childNodeCount)).toStrictEqual(1);
  expect(await select(page, $root.child(0).tagName)).toStrictEqual("div");
  expect(await select(page, $root.child(0).attributes)).toStrictEqual({});
  expect(await select(page, $root.child(0).childNodeCount)).toStrictEqual(1);
  expect(await select(page, $root.child(0).child(0).tagName)).toStrictEqual(
    "span"
  );
  expect(await select(page, $root.child(0).child(0).attributes)).toStrictEqual(
    {}
  );
  expect(
    await select(page, $root.child(0).child(0).childNodeCount)
  ).toStrictEqual(0);
});

test("Clobber Variadic List", async ({ page }) => {
  await page.evaluate(() => {
    bdc.clobber(
      document.getElementById("root"),
      bdc.h("div", {}, "item 1"),
      bdc.h("div", {}, "item 2"),
      bdc.h("div", {}, "item 3")
    );
  });

  expect(await select(page, $root.childElementCount)).toStrictEqual(3);
  expect(await select(page, $root.child(0).textContent)).toStrictEqual(
    "item 1"
  );
  expect(await select(page, $root.child(1).textContent)).toStrictEqual(
    "item 2"
  );
  expect(await select(page, $root.child(2).textContent)).toStrictEqual(
    "item 3"
  );
});

test("Clobber Array List", async ({ page }) => {
  await page.evaluate(() => {
    bdc.clobber(document.getElementById("root"), [
      bdc.h("li", {}, "item 1"),
      bdc.h("li", {}, "item 2"),
      bdc.h("li", {}, "item 3"),
    ]);
  });

  expect(await select(page, $root.childElementCount)).toStrictEqual(3);
  expect(await select(page, $root.child(0).textContent)).toStrictEqual(
    "item 1"
  );
  expect(await select(page, $root.child(1).textContent)).toStrictEqual(
    "item 2"
  );
  expect(await select(page, $root.child(2).textContent)).toStrictEqual(
    "item 3"
  );
});

test("Clobber Keyed List", async ({ page }) => {
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

  expect(
    await select(page, $root.child(1).child(0, "input").focused)
  ).toStrictEqual(true);
});

test("Variadic List", async ({ page }) => {
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

  expect(await select(page, $root.childElementCount)).toStrictEqual(1);
  expect(await select(page, $root.child(0).tagName)).toStrictEqual("ul");
  expect(await select(page, $root.child(0).childElementCount)).toStrictEqual(3);
  expect(await select(page, $root.child(0).child(0).textContent)).toStrictEqual(
    "item 1"
  );
  expect(await select(page, $root.child(0).child(1).textContent)).toStrictEqual(
    "item 2"
  );
  expect(await select(page, $root.child(0).child(2).textContent)).toStrictEqual(
    "item 3"
  );
});

test("Array List", async ({ page }) => {
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

  expect(await select(page, $root.childElementCount)).toStrictEqual(1);
  expect(await select(page, $root.child(0).tagName)).toStrictEqual("ul");
  expect(await select(page, $root.child(0).childElementCount)).toStrictEqual(3);
  expect(await select(page, $root.child(0).child(0).textContent)).toStrictEqual(
    "item 1"
  );
  expect(await select(page, $root.child(0).child(1).textContent)).toStrictEqual(
    "item 2"
  );
  expect(await select(page, $root.child(0).child(2).textContent)).toStrictEqual(
    "item 3"
  );
});

test("Keyed List", async ({ page }) => {
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

  expect(
    await select(page, $root.child(0, "ul").child(1).child(0, "input").focused)
  ).toStrictEqual(true);
});

test("Link", async ({ page }) => {
  await page.evaluate(() => {
    bdc.clobber(
      document.getElementById("root"),
      bdc.h("a", { href: "#success" }, "Add Fragment")
    );
  });

  await click(page, $root.child(0, "a"));

  expect(/#success$/.test(await page.url())).toBeTruthy();
});

test("Booleans", async ({ page }) => {
  await page.evaluate(() => {
    bdc.clobber(
      document.getElementById("root"),
      bdc.h("div", { "x-a": false, "x-b": true })
    );
  });

  expect(await select(page, $root.child(0).attributes)).toStrictEqual({
    "x-b": "",
  });
});

test("Swapping", async ({ page }) => {
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

  expect(await select(page, $root.childElementCount)).toStrictEqual(2);
  expect(await select(page, $root.child(0).tagName)).toStrictEqual("i");
  expect(await select(page, $root.child(0).textContent)).toStrictEqual(
    "Italic"
  );
  expect(await select(page, $root.child(1).tagName)).toStrictEqual("b");
  expect(await select(page, $root.child(1).textContent)).toStrictEqual("Bold");
});

test("Removing attributes", async ({ page }) => {
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

  expect(await select(page, $root.child(0).attributes)).toStrictEqual({
    "x-b": "new",
  });
});

test("Event handlers", async ({ page }) => {
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
  expect(await select(page, $root.child(0).attributes)).toStrictEqual({
    "x-clicked": "",
  });
});

test("Removing event handlers", async ({ page }) => {
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
  expect(await select(page, $root.child(0).attributes)).toStrictEqual({});
});

test("Replacing event handlers", async ({ page }) => {
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
  expect(await select(page, $root.child(0).attributes)).toStrictEqual({
    "x-new-clicked": "",
  });
});

test("Restoring event handlers", async ({ page }) => {
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
  expect(await select(page, $root.child(0).attributes)).toStrictEqual({
    "x-clicked": "",
  });
});

test("Re-apply input value preserves cursor", async ({ page }) => {
  await page.evaluate(() => {
    bdc.clobber(document.getElementById("root"), bdc.h("input", { value: "" }));
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

  expect(await select(page, $root.child(0).property("value"))).toStrictEqual(
    "ba"
  );
});

test("No injection on create text node", async ({ page }) => {
  await page.evaluate(() => {
    bdc.clobber(
      document.getElementById("root"),
      bdc.h("p", {}, "<script>window.alert('w00t')</script>")
    );
  });

  expect(await select(page, $root.childElementCount)).toStrictEqual(1);
  expect(await select(page, $root.child(0).textContent)).toStrictEqual(
    "<script>window.alert('w00t')</script>"
  );
});

test("No injection on update text node", async ({ page }) => {
  await page.evaluate(() => {
    bdc.clobber(document.getElementById("root"), bdc.h("p", {}, "harmless"));
  });

  await page.evaluate(() => {
    bdc.clobber(
      document.getElementById("root"),
      bdc.h("p", {}, "<script>window.alert('w00t')</script>")
    );
  });

  expect(await select(page, $root.childElementCount)).toStrictEqual(1);
  expect(await select(page, $root.child(0).textContent)).toStrictEqual(
    "<script>window.alert('w00t')</script>"
  );
});
