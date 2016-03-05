"use strict";

const
    assert = require("assert"),
    xcatalog = require(".."),
    path = require("path");

xcatalog.loaddir(path.join(__dirname, "foo"));

assert.strictEqual(xcatalog("foo"), 14);