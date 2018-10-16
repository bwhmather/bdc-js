import { Selector } from 'testcafe';

fixture("Boilerplate").page("./fixture.html")

test("Hello world", async t => {
  await t.eval(() => {
    bdc.render(
      document.getElementById('root'),
      "Hello, World!",
    );
  });

  const $root = Selector('#root');

  await t.expect($root.textContent).eql("Hello, World!");
  await t.expect($root.hasChildElements).eql(false);
  await t.expect($root.childNodeCount).eql(1);
});
