"use strict"

perfMonitor.startFPSMonitor()
perfMonitor.startMemMonitor()
perfMonitor.initProfiler("render")

var h = bdc.h;


function render(data) {
	return h("div", h(
	    "table", {class: "table table-striped latest-data"},
		h("tbody", data.map(function(db) {
			return h("tr", {"x-bdc-key": db.dbname}, [
				h("td", {class: "dbname"}, db.dbname),
				h(
				    "td", {class: "query-count"},
					h("span", {
					    class: db.lastSample.countClassName
					}, "" + db.lastSample.nbQueries)
				),
				...db.lastSample.topFiveQueries.map(function(query, i) {
					return h(
					    "td", {key: i, class: query.elapsedClassName},
						query.formatElapsed,
						h(
						    "div", {class: "popover left"},
							h("div", {class: "popover-content"}, query.query),
							h("div", {class: "arrow"})
						)
					)
				})
			]);
		}))
	))
;}


var $root = document.getElementById("app");
function update() {
	requestAnimationFrame(update);
	
	var data = ENV.generateData().toArray();

	perfMonitor.startProfile("render");
	bdc.clobber($root, render(data));
	perfMonitor.endProfile("render");
}

update()
