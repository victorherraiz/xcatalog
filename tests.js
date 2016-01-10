"use strict";

const
    catalog = require("./catalog"),
    chai = require("chai"),
    expect = chai.expect;

describe("xcatalog", function () {

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
        return {a: a, b: b, c: c};
    }

    function d1() {
        return new Promise(function (resolve) {
            setTimeout(function () { resolve("ORANGE"); }, 10);
        });
    }

    before(function () {
        catalog.set("a", "singleton", A)
            .set("b", "singleton", B, ["a"])
            .set("c", "constant", "APPLE")
            .set("d", "factory", factory, ["a", "b", "c"]);
    });

    it("should have size method and it should work accordantly", function () {
        const size = catalog.size();
        catalog.set("a1", "singleton", A);
        expect(catalog.size()).equal(size + 1);
        expect(catalog("a1")).instanceof(A);
        expect(function () { catalog("z"); }).throw(TypeError);
    });

    it("should resolve dependencies", function () {
        let b = catalog("b");
        expect(catalog("b")).instanceof(B);
        expect(catalog("a")).instanceof(A);
        expect(catalog("b").a).instanceof(A);
        //Reuse instance for services
        expect(catalog("b").a).equal(catalog("a"));
        expect(catalog("a")).not.equal(new A());
    });

    it("should have different factories for different life cycles", function () {
        expect(catalog("c")).equal("APPLE");
        expect(catalog("d")).eql({
            a: catalog("a"),
            b: catalog("b"),
            c: catalog("c")
        });

    });

    it("should load a decorated modules", function () {
        class A {
            constructor () {
                this.bar = "BANANA";
            }
        }
        A.$catalog = { id: "a", type: "singleton" };
        class B {
            constructor (a) {
                this.foo = a.bar;
            }
        }
        B.$catalog = { id: "b", type: "singleton", inject: ["a"] };
        catalog.load(A).load(B);
        expect(catalog("b")).property("foo").equals("BANANA");
    });

    it("should deal with promises", function () {
        catalog.set("c1", "constant", d1());
        catalog.set("d1", "factory", factory, ["a", "b", "c1"]);
        expect(function () { catalog("c1"); }).throw(TypeError);
        expect(function () { catalog("d1"); }).throw(TypeError);
        return catalog.ready().then(function () {
            expect(catalog("c1")).equal("ORANGE");
            expect(catalog("d1")).eql({
                a: catalog("a"),
                b: catalog("b"),
                c: catalog("c1")
            });
        });
    });

});




