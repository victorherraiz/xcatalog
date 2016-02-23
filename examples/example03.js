"use strict";
const xcatalog = require("..");

const promiseValue = new Promise(function (resolve) {
	setTimeout(function () {
		resolve("BANANA");
	}, 100);
});

promiseValue.$xcatalog = { id: "value01", type: "constant" };

class A {
	constructor (value01, value02) {
		this.ok = value01 === "BANANA" && value01 === value02;
	}
}

promiseValue.$xcatalog = { id: "value01", type: "constant" };

xcatalog.load(promiseValue);
//or
xcatalog.set("value02", "constant", promiseValue);

xcatalog.set("a", "singleton", A, ["value01", "value02"]);

xcatalog.ready().then(function () {
	console.log(xcatalog("value01")); // "BANANA"
	console.log(xcatalog("value02")); // "BANANA"
	console.log(xcatalog("a").ok); // true
});

