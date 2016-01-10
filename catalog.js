/*jslint node:true*/
"use strict";

const
    definitions = new Map(),
    factories = new Map(),
    promises = [];

function getFactory(def) {
    const factory = factories.get(def.type);
    if (!factory) {
        throw new TypeError("No factory for: " + def.id + ", type: " + def.type);
    }
    return factory(def.ref, def.dep);
}

function catalog(id) {
    const definition = definitions.get(id);
    if (!definition) {
        throw new TypeError("No definition for: " + id);
    }
    if (definition.fac) {
        return definition.fac();
    }
    definition.fac = getFactory(definition);
    return definition.fac();
}

catalog.set = function (id, type, ref, dep) {
    if (ref && typeof ref.then === "function") {
        promises.push(ref);
        ref.then(function (value) {
            catalog.set(id, type, value, dep);
        });
    } else {
        definitions.set(id, { id: id, type: type, ref: ref, dep: dep || [], fac: null });
    }
    return catalog;
};

catalog.load = function (ref) {
    const conf = ref && ref.$catalog;
    if (!conf || !conf.id || !conf.type) {
        throw new TypeError("Missing $catalog annotation");
    }
    return catalog.set(conf.id, conf.type, ref, conf.inject);
};

catalog.ready = function () {
    return Promise.all(promises).then(function () {
        return catalog;
    });
};

catalog.size = function () {
    return definitions.size;
};

factories.set("singleton", function (ref, dep) {
    const INSTANCE = new (ref.bind.apply(ref, [null].concat(dep.map(catalog))))();
    return () => INSTANCE;
});

factories.set("constant", function (ref) {
    return () => ref;
});

factories.set("factory", function (ref, dep) {
    const INSTANCE = ref.apply(null, dep.map(catalog));
    return () => INSTANCE;
});

module.exports = catalog;
