xcatalog
========

Simple dependency injection container for nodejs4+

Installation
------------

    $ npm install xcatalog --save

Setting up
----------

There are to different ways to load references into the xcatalog:

### Direct configuration

`xcatalog.set(id, type, ref, deps)`

```js
"use strict";

//A.js
class A {
    constructor (str) {
        this.bar = str;
    }
}

function foo (a, b) {
    return a + " " + b;
}

//config.js
const xcatalog = require("xcatalog");
xcatalog
    .set("MY_TEXT", "constant", "BANANA")
    .set("a", "singleton", A, ["MY_TEXT"])
    .set("foo", "factory", foo, ["MY_TEXT", "MY_TEXT"]);;

console.log(xcatalog("a").bar); // "BANANA"
console.log(xcatalog("foo")); // "BANANA BANANA"

```

### Annotations

```js
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
const xcatalog = require("xcatalog");

//xcatalog.load(require("./A")).load(require("./B"));
xcatalog.load(A).load(B);

console.log(xcatalog("b").bar); // "BANANA"

```

Getting instances
-----------------

```js
"use strict";
const xcatalog = require("xcatalog");

//Get service instance already built with dependencies
const myService = xcatalog("myService");

```

Dealing with Promises
---------------------

If any reference returns a promise the `xcatalog` cannot be used until is ready.

`xcatalog.ready()` returns a promise, when that promise is fulfilled the xcatalog is fully available.

```js
"use strict";
const xcatalog = require("xcatalog");
const promise = Promise.resolve("BANANA");

xcatalog.set("VALUE", "constant", promise);

//Get service instance already builded with dependencies
xcatalog.ready().then(function () {
    console.log(xcatalog("VALUE")); // "BANANA"
});

```
