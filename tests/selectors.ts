export class ValueSelector {
  constructor(selectFn) {
    this.selectFn = selectFn;
  }

  async select(page) {
    return await this.selectFn(page);
  }
}

function apply(selector, method) {
  return new ValueSelector(async (page) => {
    return await page[method](selector.query);
  });
}

export class ElementSelector {
  constructor(query) {
    this.query = query;
  }

  async select(page) {
    return await page.$(this.query);
  }

  async click(page) {
    return await page.click(this.query);
  }

  get tagName() {
    return new ValueSelector(async (page) => {
      return await page.$eval(this.query, (element) => {
        return element.localName;
      });
    });
  }

  get attributes() {
    return new ValueSelector(async (page) => {
      return await page.$eval(this.query, (element) => {
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
        this.query,
        (element, name) => {
          return element[name];
        },
        name
      );
    });
  }

  get children() {
    return new ValueSelector(async (page) => {
      return await page.$$(`${this.query} > *`);
    });
  }

  child(n, cls) {
    if (typeof cls === "undefined") {
      cls = "*";
    }
    return new ElementSelector(`${this.query} > ${cls}:nth-child(${n + 1})`);
  }

  get childElementCount() {
    return new ValueSelector(async (page) => {
      const children = await select(page, this.children);
      return children.length;
    });
  }

  get childNodeCount() {
    return new ValueSelector(async (page) => {
      return await page.$eval(this.query, (element) => {
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

  get textContent() {
    return apply(this, "textContent");
  }

  get innerText() {
    return apply(this, "innerText");
  }
  get innerHTML() {
    return apply(this, "innerText");
  }

  get focused() {
    return new ValueSelector(async (page) => {
      return await page.$eval(this.query, (element) => {
        return element === document.activeElement;
      });
    });
  }
}

export async function select(page, selector) {
  return await selector.select(page);
}

export async function click(page, selector) {
  return await selector.click(page);
}
