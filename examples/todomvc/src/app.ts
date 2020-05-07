import { clobber, h, Node } from "bdc";

const ENTER_KEY = 13;
const ESC_KEY = 27;

let newTodo = "";

let nextItemId: number = 1;

let showCompleted: boolean = true;
let showActive: boolean = true;

class TodoItem {
  id: number = nextItemId++;
  completed: boolean = false;
  editing: boolean = false;
  title: string = "";
}

const items: TodoItem[] = [];

/* Derived state */
let visibleItems: TodoItem[] = [];
let completed: number;
let remaining: number;
let total: number;

function reindex() {
  completed = 0;
  remaining = 0;
  total = 0;
  visibleItems = [];

  items.forEach((item) => {
    if (showCompleted && item.completed) {
      visibleItems.push(item);
    }

    if (showActive && !item.completed) {
      visibleItems.push(item);
    }

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
  items[item.id] = item;
  reindex();
  return item.id;
}

function setItemTitle(id: number, title: string) {
  items[id].title = title;
  items[id].editing = false;
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

function editItem(id: number) {
  items[id].editing = true;
}

function handleHeaderKeyDown(evt: KeyboardEvent) {
  switch (evt.keyCode) {
  case ENTER_KEY:
    if (!newTodo.trim()) {
      break;
    }
    addItem(newTodo.trim());
    newTodo = "";

    evt.preventDefault();
    redraw();
    break;
  }
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

function handleItemDoubleClick(id: number, evt: MouseEvent) {
  editItem(id);
  redraw();

  evt.preventDefault();
}

function handleItemKeyDown(id: number, evt: KeyboardEvent) {
  if (evt.keyCode === ENTER_KEY) {
    let title = (evt.target! as HTMLInputElement).value.trim();
    if (!title) {
      removeItem(id);
    } else {
      setItemTitle(id, title);
    }
    redraw();

    evt.preventDefault();
    return;
  }

  if (evt.keyCode === ESC_KEY) {
    removeItem(id);
    evt.preventDefault();

    redraw();
    return;
  }
}

function handleItemBlur(id: number, evt: Event) {
  let title = (evt.target! as HTMLInputElement).value.trim();
  if (!title) {
    removeItem(id);
  } else {
    setItemTitle(id, title);
  }
  redraw();

  evt.preventDefault();
  return;
}

function renderItem(item: TodoItem): Node {
  const id = item.id;

  const classes = [];
  if (item.completed) {
    classes.push("completed");
  }
  if (item.editing) {
    classes.push("editing");
  }

  let inner;
  if (!item.editing) {
    inner = h("div", {class: "view"}, [
      h("input", {
        class: "toggle", type: "checkbox",
        checked: item.completed,
      }),
      h("label", {
        ondblclick: (evt: MouseEvent) => handleItemDoubleClick(id, evt)
      }, item.title),
      h("button", {class: "destroy"}),
    ]);
  } else {
    inner = h("input", {
      class: "edit",
      value: item.title,
      onkeydown: (evt: KeyboardEvent) => handleItemKeyDown(id, evt),
      onblur: (evt: Event) => handleItemBlur(id, evt),
      onmount: (evt: Event) => (evt.target! as HTMLInputElement).focus(),
    });
  }
  return h("li", {class: classes.join(" ")}, inner);
}

function renderMain(): Node {
  return h("section", {class: "main"}, [
    h("input", {class: "toggle-all", id: "toggle-all", type: "checkbox"}),
    h("label", {for: "toggle-all"}, "Mark all as complete"),
    h("ul", {class: "todo-list"}, visibleItems.map((item) => {
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

function handleHashChanged() {
  switch (location.hash) {
  default:
    history.replaceState(null, 'All', '#/');
    return;

  case '#/':
    showCompleted = true;
    showActive = true;
    break;

  case '#/active':
    showCompleted = false;
    showActive = true;
    break;

  case '#/completed':
    showCompleted = true;
    showActive = false;
    break;
  }

  reindex();
  redraw();
}

export function install($newRoot: HTMLElement) {
  $root = $newRoot;
  window.addEventListener("hashchange", handleHashChanged, false);

  redraw();
}
