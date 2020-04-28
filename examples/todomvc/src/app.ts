import { clobber, h, Node } from "bdc";

const ENTER_KEY = 13;
const ESC_KEY = 27;

let newTodo = "";

let nextItemId: number = 1;

class TodoItem {
  id: number = nextItemId++;
  completed: boolean = false;
  editing: boolean = false;
  title: string = "";
}

const items: TodoItem[] = [];
let completed: number;
let remaining: number;
let total: number;

function reindex() {
  completed = 0;
  remaining = 0;
  total = 0;
  items.forEach((item) => {
    if (item.completed) {
      completed += 1;
    } else {
      remaining += 1;
    }
    total += 1;
  });
}

function addItem(title: string) {
  const item = new TodoItem();
  item.title = title;
  items.push(item);
  reindex();
  return item.id;
}

function setItemTitle(id: number, title: string) {
  items[id].title = title;
}

function completeItem(id: number) {
  items[id].completed = true;
  reindex();
}

function reactivateItem(id: number) {
  items[id].completed = false;
  reindex();
}

function removeItem(id: number) {
  delete items[id];
  reindex();
}

function handleHeaderKeyDown(evt: KeyboardEvent) {
  if (evt.keyCode !== ENTER_KEY) {
    return;
  }

  addItem(newTodo.trim());
  newTodo = "";

  evt.preventDefault();
  redraw();
}

function handleHeaderInput(evt: any) {
  newTodo = evt.target.value;

  redraw();
}

function renderHeader() {
  return h("header", {class: "header"}, [
    h("h1", "todos"),
    h("input", {
      class: "new-todo",
      placeholder: "What needs to be done?",
      value: newTodo,
      onkeydown: handleHeaderKeyDown,
      oninput: handleHeaderInput,
      autofocus: true,
    }),
  ]);
}

function renderItem(item: TodoItem): Node {
  const classes = [];
  if (item.completed) {
    classes.push("completed");
  }
  if (item.editing) {
    classes.push("editing");
  }

  return h("li", {class: classes.join(" ")}, [
    h("div", {class: "view"}, [
      h("input", {
        class: "toggle", type: "checkbox",
        checked: item.completed,
      }),
      h("label", item.title),
      h("button", {class: "destroy"}),
    ]),
    h("input", {class: "edit", value: item.title}),
  ]);
}

function renderMain(): Node {
  return h("section", {class: "main"}, [
    h("input", {class: "toggle-all", id: "toggle-all", type: "checkbox"}),
    h("label", {for: "toggle-all"}, "Mark all as complete"),
    h("ul", {class: "todo-list"}, items.map((item) => {
      return renderItem(item);
    }))
  ]);
}

function renderFooter(): Node {
  if (!total) {
    return "";
  }
  const contents = [];

  contents.push(h("span", {class: "todo-count"}, [
    h("strong", "" + remaining),
    remaining === 1 ? " item left" : " items left",
  ]));

  contents.push(h("ul", {class: "filters"}, [
    h("li", h("a", {class: "selected", href: "#/"}, "All")),
    h("li", h("a", {href: "#/active"}, "Active")),
    h("li", h("a", {href: "#/completed"}, "Completed")),
  ]));

  if (completed) {
    contents.push(h("button", {class: "clear-completed"}, "Clear completed"));
  }

  return h("footer", {class: "footer"}, contents);
}

function render(): Node[] {
  return [
    renderHeader(),
    renderMain(),
    renderFooter(),
  ];
}

let $root: HTMLElement;
let redrawQueued = false;

function redraw() {
  if (!redrawQueued) {
    redrawQueued = true;
    window.requestAnimationFrame(() => {
      redrawQueued = false;
      clobber($root, render());
    });
  }
}

export function install($newRoot: HTMLElement) {
  $root = $newRoot;
  redraw();
}
