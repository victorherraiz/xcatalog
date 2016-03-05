"use strict";
function foo (bar) {
    return bar.value + 2;
}
foo.$xcatalog = { id: "foo", type: "factory", inject: ["bar"] };
module.exports = foo;