/* eslint-env node, es6 */

/**
 * xcatalog
 * @module xcatalog
 */

"use strict";

const fs = require("fs"),
    path = require("path"),
    definitions = new Map(),
    factories = new Map(),
    promises = [];

function build(def, dep) {
    const factory = factories.get(def.type);
    if (!factory) {
        throw new TypeError("No factory for: " + def.id + ", type: " + def.type);
    }
    return factory(def.ref, dep);
}

/**
 * Retrieves a stored reference
 * @param {string} id - xcatalog id item
 */
function xcatalog(id) {
    const definition = definitions.get(id);
    if (!definition) {
        throw new TypeError("No definition for: " + id);
    }
    if (!definition.fac) {
        definition.fac = build(definition, definition.dep.map(xcatalog));
    }
    return definition.fac();
}



/**
 * Store a reference into the xcatalog
 * @param {string} id - xcatalog id item
 * @param {string} type - "singleton", "factory", "constant"
 * @param {any} ref - reference to store
 * @param {array} dep - id array of dependencies.
 */
xcatalog.set = function (id, type, ref, dep) {
    const old = definitions.get(id);
    if (old && old.fac) {
        throw new TypeError(id + " is already build");
    }

    if (ref && typeof ref.then === "function") {
        promises.push(ref);
        ref.then(function (value) {
            // TODO check if fac is aready set and throw in that case
            definitions.set(id, { type, ref: value, dep: dep || [], fac: null });
        });
    } else {
        definitions.set(id, { type, ref, dep: dep || [], fac: null });
    }

    return xcatalog;
};

/**
 * Store a reference into the xcatalog
 * @param {any} ref - reference to store. It must have a ref.$xcatalog object.
 */
xcatalog.load = function (ref) {
    const conf = ref && ref.$xcatalog;
    if (!conf || !conf.id || !conf.type) {
        throw new TypeError("Missing $xcatalog annotation");
    }
    return xcatalog.set(conf.id, conf.type, ref, conf.inject);
};

xcatalog.loaddir = function loadDirSync(dir) {
    fs.readdirSync(dir).forEach((file) => {
        const apath = path.join(dir, file),
            stat = fs.statSync(apath);
        if (stat.isDirectory()) {
            loadDirSync(apath);
        } else if (apath.endsWith(".js")) {
            const ref = require(apath);
            if (ref.$xcatalog) {
                xcatalog.load(ref);
            }
        }
    });
    return xcatalog;
};

xcatalog.ready = function () {
    return Promise.all(promises).then((values) => xcatalog);
};

xcatalog.size = function () {
    return definitions.size;
};

factories.set("singleton", function (ref, dep) {
    const INSTANCE = new (Function.prototype.bind.apply(ref, [null].concat(dep)));
    return () => INSTANCE;
});

factories.set("constant", function (ref) {
    return () => ref;
});

factories.set("factory", function (ref, dep) {
    const INSTANCE = ref.apply(null, dep);
    return () => INSTANCE;
});

module.exports = xcatalog;
