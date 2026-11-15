(() => {
    "use strict";

    const CATEGORIES = Object.freeze([
        "destinations",
        "objectives",
        "architectures",
        "propulsionSystems",
        "powerSystems",
        "communicationsSystems",
        "instruments",
        "thermalSystems",
        "navigationSystems",
        "components",
    ]);
    const catalogs = new Map(CATEGORIES.map((category) => [category, new Map()]));

    function isRecord(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function validateCategory(category) {
        if (!catalogs.has(category)) {
            throw new RangeError(`Unknown catalogue category: ${category}.`);
        }
    }

    function validateDefinition(category, definition) {
        validateCategory(category);
        if (!isRecord(definition)) {
            throw new TypeError("Catalogue entries must be objects.");
        }
        if (typeof definition.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(definition.id)) {
            throw new TypeError("Catalogue entry IDs must be lowercase kebab-case.");
        }
        if (typeof definition.name !== "string" || !definition.name.trim()) {
            throw new TypeError("Catalogue entries require a non-empty name.");
        }
        return clone({ ...definition, name: definition.name.trim() });
    }

    function register(category, definition) {
        const entry = validateDefinition(category, definition);
        const catalog = catalogs.get(category);
        if (catalog.has(entry.id)) {
            throw new Error(`Catalogue entry "${entry.id}" is already registered in "${category}".`);
        }
        catalog.set(entry.id, entry);
        document.dispatchEvent(new CustomEvent("beyond:catalogchange", {
            detail: { category, id: entry.id },
        }));
        return clone(entry);
    }

    function registerMany(category, definitions) {
        validateCategory(category);
        if (!Array.isArray(definitions)) {
            throw new TypeError("Catalogue batches must be arrays.");
        }
        const entries = definitions.map((definition) => validateDefinition(category, definition));
        const seen = new Set();
        entries.forEach((entry) => {
            if (seen.has(entry.id) || catalogs.get(category).has(entry.id)) {
                throw new Error(`Catalogue entry "${entry.id}" is duplicated in "${category}".`);
            }
            seen.add(entry.id);
        });
        entries.forEach((entry) => catalogs.get(category).set(entry.id, entry));
        if (entries.length) {
            document.dispatchEvent(new CustomEvent("beyond:catalogchange", {
                detail: { category, ids: entries.map((entry) => entry.id) },
            }));
        }
        return entries.map(clone);
    }

    function get(category, id) {
        validateCategory(category);
        const entry = catalogs.get(category).get(id);
        return entry ? clone(entry) : null;
    }

    function list(category) {
        validateCategory(category);
        return Array.from(catalogs.get(category).values(), clone);
    }

    function has(category, id) {
        validateCategory(category);
        return catalogs.get(category).has(id);
    }

    window.BeyondEarthCatalogs = Object.freeze({
        categories: [...CATEGORIES],
        get,
        has,
        list,
        register,
        registerMany,
    });
})();
