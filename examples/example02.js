"use strict";

//A.js
class A {
	constructor () {
		this.foo = "BANANA";
	}
}

A.$xcatalog = { id: "a", type: "singleton" };

//B.js
class B {
	constructor (a) {
		this.bar = a.foo;
	}
}

B.$xcatalog = { id: "b", type: "singleton", inject: ["a"] };

//config.js
const xcatalog = require("..");
//xcatalog.load(require("./A")).load(require("./B"));
xcatalog.load(A).load(B);

console.log(xcatalog("b").bar); // "BANANA"