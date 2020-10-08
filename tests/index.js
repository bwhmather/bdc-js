import { Selector } from "testcafe";

fixture("Rendering").page("./fixture.html");

const $root = Selector("#root");

test("Hello world", async (t) => {
  await t.eval(() => {
    bdc.clobber(document.getElementById("root"), "Hello, World!");
  });

  await t.expect($root.textContent).eql("Hello, World!");
  await t.expect($root.hasChildElements).eql(false);
  await t.expect($root.childNodeCount).eql(1);
});

test("Empty div", async (t) => {
  await t.eval(() => {
    bdc.clobber(document.getElementById("root"), bdc.h("div"));
  });

  await t.expect($root.childElementCount).eql(1);
  await t.expect($root.child(0).tagName).eql("div");
  await t.expect($root.child(0).hasChildNodes).eql(false);
  await t.expect($root.child(0).attributes).eql({});
});

test("Empty div with empty attributes", async (t) => {
  await t.eval(() => {
    bdc.clobber(document.getElementById("root"), bdc.h("div"));
  });

  await t.expect($root.childElementCount).eql(1);
  await t.expect($root.child(0).tagName).eql("div");
  await t.expect($root.child(0).hasChildNodes).eql(false);
  await t.expect($root.child(0).attributes).eql({});
});

test("No attribute div with text child", async (t) => {
  await t.eval(() => {
    bdc.clobber(document.getElementById("root"), bdc.h("div", "contents"));
  });

  await t.expect($root.childElementCount).eql(1);
  await t.expect($root.child(0).tagName).eql("div");
  await t.expect($root.child(0).textContent).eql("contents");
  await t.expect($root.child(0).attributes).eql({});
});

test("No attribute div with span child", async (t) => {
  await t.eval(() => {
    bdc.clobber(document.getElementById("root"), bdc.h("div", bdc.h("span")));
  });

  await t.expect($root.childElementCount).eql(1);
  await t.expect($root.child(0).tagName).eql("div");
  await t.expect($root.child(0).child(0).tagName).eql("span");
  await t.expect($root.child(0).attributes).eql({});
});

test("No attribute div with list of children", async (t) => {
  await t.eval(() => {
    bdc.clobber(document.getElementById("root"), bdc.h("div", [bdc.h("span")]));
  });

  await t.expect($root.childElementCount).eql(1);
  await t.expect($root.child(0).tagName).eql("div");
  await t.expect($root.child(0).child(0).tagName).eql("span");
  await t.expect($root.child(0).attributes).eql({});
});

test("Clobber Variadic List", async (t) => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById("root"),
      bdc.h("div", {}, "item 1"),
      bdc.h("div", {}, "item 2"),
      bdc.h("div", {}, "item 3")
    );
  });

  await t.expect($root.childElementCount).eql(3);
  await t.expect($root.child(0).textContent).eql("item 1");
  await t.expect($root.child(1).textContent).eql("item 2");
  await t.expect($root.child(2).textContent).eql("item 3");
});

test("Clobber Array List", async (t) => {
  await t.eval(() => {
    bdc.clobber(document.getElementById("root"), [
      bdc.h("li", {}, "item 1"),
      bdc.h("li", {}, "item 2"),
      bdc.h("li", {}, "item 3"),
    ]);
  });

  await t.expect($root.childElementCount).eql(3);
  await t.expect($root.child(0).textContent).eql("item 1");
  await t.expect($root.child(1).textContent).eql("item 2");
  await t.expect($root.child(2).textContent).eql("item 3");
});

test("Clobber Keyed List", async (t) => {
  await t.eval(() => {
    bdc.clobber(document.getElementById("root"), [
      bdc.h("div", { "x-bdc-key": "a" }, bdc.h("input", {})),
      bdc.h("div", { "x-bdc-key": "b" }, bdc.h("input", {})),
      bdc.h("div", { "x-bdc-key": "c" }, bdc.h("input", {})),
      bdc.h("div", { "x-bdc-key": "d" }, bdc.h("input", {})),
      bdc.h("div", { "x-bdc-key": "e" }, bdc.h("input", {})),
    ]);
  });

  await t.click($root.child(2).child("input"));

  await t.eval(() => {
    bdc.clobber(document.getElementById("root"), [
      bdc.h("div", { "x-bdc-key": "d" }, bdc.h("input", {})),
      bdc.h("div", { "x-bdc-key": "c" }, bdc.h("input", {})),
      bdc.h("div", { "x-bdc-key": "b" }, bdc.h("input", {})),
      bdc.h("div", { "x-bdc-key": "a" }, bdc.h("input", {})),
    ]);
  });

  await t.expect($root.child(1).child("input").focused).eql(true);
});

test("Variadic List", async (t) => {
  await t.eval(() => {
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

  await t.expect($root.childElementCount).eql(1);
  await t.expect($root.child(0).tagName).eql("ul");
  await t.expect($root.child(0).childElementCount).eql(3);
  await t.expect($root.child(0).child(0).textContent).eql("item 1");
  await t.expect($root.child(0).child(1).textContent).eql("item 2");
  await t.expect($root.child(0).child(2).textContent).eql("item 3");
});

test("Array List", async (t) => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById("root"),
      bdc.h("ul", {}, [
        bdc.h("li", {}, "item 1"),
        bdc.h("li", {}, "item 2"),
        bdc.h("li", {}, "item 3"),
      ])
    );
  });

  await t.expect($root.childElementCount).eql(1);
  await t.expect($root.child(0).tagName).eql("ul");
  await t.expect($root.child(0).childElementCount).eql(3);
  await t.expect($root.child(0).child(0).textContent).eql("item 1");
  await t.expect($root.child(0).child(1).textContent).eql("item 2");
  await t.expect($root.child(0).child(2).textContent).eql("item 3");
});

test("Keyed List", async (t) => {
  await t.eval(() => {
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

  await t.click($root.child("ul").child(2).child("input"));

  await t.eval(() => {
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

  await t.expect($root.child("ul").child(1).child("input").focused).eql(true);
});

test("Link", async (t) => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById("root"),
      bdc.h("a", { href: "#success" }, "Add Fragment")
    );
  });

  await t.click($root.child("a"));

  const uri = await t.eval(() => document.documentURI);
  await t.expect(uri).match(/#success$/);
});

test("Booleans", async (t) => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById("root"),
      bdc.h("div", { "x-a": false, "x-b": true })
    );
  });

  await t.expect($root.child(0).attributes).eql({ "x-b": "" });
});

test("Swapping", async (t) => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById("root"),
      bdc.h("b", {}, "Bold"),
      bdc.h("i", {}, "Italic")
    );
  });

  await t.eval(() => {
    bdc.clobber(
      document.getElementById("root"),
      bdc.h("i", {}, "Italic"),
      bdc.h("b", {}, "Bold")
    );
  });

  await t.expect($root.childElementCount).eql(2);
  await t.expect($root.child(0).tagName).eql("i");
  await t.expect($root.child(0).textContent).eql("Italic");
  await t.expect($root.child(1).tagName).eql("b");
  await t.expect($root.child(1).textContent).eql("Bold");
});

test("Removing attributes", async (t) => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById("root"),
      bdc.h("div", { "x-a": "original" })
    );
  });

  await t.eval(() => {
    bdc.clobber(
      document.getElementById("root"),
      bdc.h("div", { "x-b": "new" })
    );
  });

  await t.expect($root.child(0).attributes).eql({ "x-b": "new" });
});

test("Event handlers", async (t) => {
  // Set an event handler.
  await t.eval(() => {
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
  await t.click($root.child("button"));

  // Check the value.
  await t.expect($root.child(0).attributes).eql({ "x-clicked": "" });
});

test("Removing event handlers", async (t) => {
  // Set an event handler.
  await t.eval(() => {
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
  await t.eval(() => {
    bdc.clobber(document.getElementById("root"), bdc.h("button", {}));
  });

  // Click the button.
  await t.click($root.child("button"));

  // Check that the handler wasn't fired.
  await t.expect($root.child(0).attributes).eql({});
});

test("Replacing event handlers", async (t) => {
  // Set an event handler.
  await t.eval(() => {
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
  await t.eval(() => {
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
  await t.click($root.child("button"));

  // Check that the handler wasn't fired.
  await t.expect($root.child(0).attributes).eql({ "x-new-clicked": "" });
});

test("Restoring event handlers", async (t) => {
  // Set an event handler.
  await t.eval(() => {
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
  await t.eval(() => {
    bdc.clobber(document.getElementById("root"), bdc.h("button", {}));
  });

  // Reset the event handler.
  await t.eval(() => {
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
  await t.click($root.child("button"));

  // Check that the handler wasn't fired.
  await t.expect($root.child(0).attributes).eql({ "x-clicked": "" });
});

test("Re-apply input value preserves cursor", async (t) => {
  await t.eval(() => {
    bdc.clobber(document.getElementById("root"), bdc.h("input", { value: "" }));
  });

  await t.click($root.child(0));
  await t.pressKey("a");
  await t.pressKey("left");

  await t.eval(() => {
    bdc.clobber(
      document.getElementById("root"),
      bdc.h("input", { value: "a" })
    );
  });

  await t.pressKey("b");

  await t.expect($root.child(0).value).eql("ba");
});

test("No injection on create text node", async (t) => {
  await t.eval(() => {
    bdc.clobber(
      document.getElementById("root"),
      bdc.h("p", {}, "<script>window.alert('w00t')</script>")
    );
  });

  await t.expect($root.childElementCount).eql(1);
  await t
    .expect($root.child(0).textContent)
    .eql("<script>window.alert('w00t')</script>");
});

test("No injection on update text node", async (t) => {
  await t.eval(() => {
    bdc.clobber(document.getElementById("root"), bdc.h("p", {}, "harmless"));
  });

  await t.eval(() => {
    bdc.clobber(
      document.getElementById("root"),
      bdc.h("p", {}, "<script>window.alert('w00t')</script>")
    );
  });

  await t.expect($root.childElementCount).eql(1);
  await t
    .expect($root.child(0).textContent)
    .eql("<script>window.alert('w00t')</script>");
});
