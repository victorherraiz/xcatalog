"use strict";

//A.js
class A {
	constructor (str) {
		this.bar = str;
	}
}

//config.js
const xcatalog = require("..");
xcatalog
	.set("MY_TEXT", "constant", "BANANA")
	.set("a", "singleton", A, ["MY_TEXT"]);

console.log(xcatalog("a").bar); // "BANANA"