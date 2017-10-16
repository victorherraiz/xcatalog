"use strict";

const
    assert = require("assert"),
    xcatalog = require("..");

class A {
    foo () {
        return "BANANA";
    }
}

class B {
    constructor (a) {
        this.a = a;
    }
    bar () {
        return this.a.foo();
    }
}

function factory(a, b, c) {
    return { a: a, b: b, c: c };
}

//TEST: basic fuctionality and DI

assert.strictEqual(xcatalog.size(), 0, "Initial size should be 0");

xcatalog
    .set("a", "singleton", A)
    .set("a2", "singleton", A)
    .set("b", "singleton", B, ["a"])
    .set("c", "constant", "APPLE")
    .set("d", "factory", factory, ["a", "b", "c"]);

assert.strictEqual(xcatalog.size(), 5, "Initial size should be 5");

assert(xcatalog("a") instanceof A, "a must be and instance of A");
assert(xcatalog("b") instanceof B, "a must be and instance of B");
assert(xcatalog("b").a instanceof A, "b.a must be and instance of A");

assert.strictEqual(xcatalog("b").a,  xcatalog("a"), "b.a must be same as  a");
assert.notStrictEqual(xcatalog("a"), new A(), "a must not be same as  new A()");
assert.notStrictEqual(xcatalog("a2"), xcatalog("a"), "a must not be same as a1");

assert.throws(function () { xcatalog("z"); } , TypeError);

assert.strictEqual(xcatalog("c"), "APPLE");
assert.strictEqual(xcatalog("d").a, xcatalog("a"));
assert.strictEqual(xcatalog("d").b, xcatalog("b"));
assert.strictEqual(xcatalog("d").c, xcatalog("c"));


// sustitution

xcatalog.set("sustitution", "constant", "ORANGE");
xcatalog.set("sustitution", "constant", "PINK");
assert.strictEqual(xcatalog("sustitution"), "PINK");
assert.throws(() =>
    { xcatalog.set("sustitution", "constant", "RED"); },
    TypeError);
assert.strictEqual(xcatalog("sustitution"), "PINK");

// anotations

class AD {
    constructor () {
        this.bar = "BANANA";
    }
}

AD.$xcatalog = { id: "ad", type: "singleton" };

class BD {
    constructor (a) {
        this.foo = a.bar;
    }
}

BD.$xcatalog = { id: "bd", type: "singleton", inject: ["ad"] };

xcatalog.load(AD).load(BD);

assert.throws(function () { xcatalog.load(A); }, TypeError);
assert.strictEqual(xcatalog("bd").foo, "BANANA");

//TEST Promises

xcatalog.set("P", "constant", Promise.resolve("BANANA"));
xcatalog.set("PF", "factory", (value) => value, ["P"]);

//No definition for P yet, it is a promise
assert.throws(function () { xcatalog("P"); }, TypeError);
assert.throws(function () { xcatalog("PF"); }, TypeError);

const promise01 = xcatalog.ready().then(function () {
    assert.strictEqual(xcatalog("PF"), "BANANA");
});

const promise02 = xcatalog.ready(["P", "PF"], (arg1, arg2) => {
    assert.strictEqual(arg1, "BANANA");
    assert.strictEqual(arg2, "BANANA");
});

//TEST End
Promise.all([promise01, promise02]).then(function () {
    console.log("OK!");
    process.exit(0);
}, function (reason) {
    console.error(reason);
    process.exit(1);
});
