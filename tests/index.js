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

test("Empty div", async t => {
  await t.eval(() => {
    bdc.render(
      document.getElementById('root'),
      bdc.h('div', {}),
    );
  });

  const $root = Selector('#root');

  await t.expect($root.childElementCount).eql(1);
  await t.expect($root.child(0).tagName).eql('div');
  await t.expect($root.child(0).hasChildNodes).eql(false);
  await t.expect($root.child(0).attributes).eql({});
});
