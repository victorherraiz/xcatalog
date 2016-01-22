/* eslint-env node, es6 */
"use strict";

const
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
    if (definition.fac) {
        return definition.fac();
    }
    definition.fac = build(definition, definition.dep.map(xcatalog));
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
    if (ref && typeof ref.then === "function") {
        promises.push(ref);
        ref.then(function (value) {
            xcatalog.set(id, type, value, dep);
        });
    } else {
        definitions.set(id, { id: id, type: type, ref: ref, dep: dep || [], fac: null });
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

xcatalog.ready = function () {
    return Promise.all(promises).then(function () {
        return xcatalog;
    });
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
