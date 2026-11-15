(() => {
    "use strict";

    const COMPONENT_CATEGORIES = Object.freeze([
        "propulsionSystems",
        "powerSystems",
        "communicationsSystems",
        "instruments",
        "thermalSystems",
        "navigationSystems",
        "components",
    ]);
    const LOADOUT_FIELDS = Object.freeze({
        propulsionSystemId: "propulsionSystems",
        powerSystemId: "powerSystems",
        communicationsSystemId: "communicationsSystems",
        thermalSystemId: "thermalSystems",
        navigationSystemId: "navigationSystems",
    });

    function registerArchitecture(definition) {
        return window.BeyondEarthCatalogs.register("architectures", definition);
    }

    function registerComponent(category, definition) {
        if (!COMPONENT_CATEGORIES.includes(category)) {
            throw new RangeError(`Unknown spacecraft component category: ${category}.`);
        }
        return window.BeyondEarthCatalogs.register(category, definition);
    }

    function normalizeLoadout(value = {}) {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
            throw new TypeError("Spacecraft loadouts must be objects.");
        }
        const loadout = {
            architectureId: value.architectureId ?? null,
            scientificInstrumentIds: value.scientificInstrumentIds ?? [],
            componentIds: value.componentIds ?? [],
        };
        Object.entries(LOADOUT_FIELDS).forEach(([field]) => {
            loadout[field] = value[field] ?? null;
        });
        if (typeof loadout.architectureId !== "string" && loadout.architectureId !== null) {
            throw new TypeError("Spacecraft architecture IDs must be strings or null.");
        }
        for (const field of ["scientificInstrumentIds", "componentIds"]) {
            if (!Array.isArray(loadout[field]) || loadout[field].some((id) => typeof id !== "string")) {
                throw new TypeError(`Spacecraft "${field}" must be arrays of IDs.`);
            }
        }
        Object.entries(LOADOUT_FIELDS).forEach(([field]) => {
            if (typeof loadout[field] !== "string" && loadout[field] !== null) {
                throw new TypeError(`Spacecraft "${field}" must be a string or null.`);
            }
        });
        return JSON.parse(JSON.stringify(loadout));
    }

    function getDesignFacts(value) {
        const loadout = normalizeLoadout(value);
        const architecture = loadout.architectureId
            ? window.BeyondEarthCatalogs.get("architectures", loadout.architectureId)
            : null;
        const selected = [];
        Object.entries(LOADOUT_FIELDS).forEach(([field, category]) => {
            if (loadout[field]) selected.push({ category, id: loadout[field] });
        });
        loadout.scientificInstrumentIds.forEach((id) => selected.push({ category: "instruments", id }));
        loadout.componentIds.forEach((id) => selected.push({ category: "components", id }));

        const components = selected.map(({ category, id }) => ({
            category,
            id,
            definition: window.BeyondEarthCatalogs.get(category, id),
        }));
        const missing = components.filter((item) => !item.definition);
        const knownComponents = components.filter((item) => item.definition);
        const massKnown = knownComponents.every(({ definition }) => Number.isFinite(definition.massKg));
        const powerConsumers = knownComponents.filter(({ category }) => category !== "powerSystems");
        const powerKnown = powerConsumers.every(({ definition }) => Number.isFinite(definition.powerDrawW));
        const powerSystem = components.find(({ category }) => category === "powerSystems")?.definition || null;

        return {
            loadout,
            architecture,
            components: knownComponents.map(({ category, id, definition }) => ({
                category,
                id,
                ...definition,
            })),
            missing,
            payloadMassKg: massKnown
                ? knownComponents.reduce((sum, item) => sum + item.definition.massKg, 0)
                : null,
            powerDrawW: powerKnown
                ? powerConsumers.reduce((sum, item) => sum + item.definition.powerDrawW, 0)
                : null,
            powerOutputW: Number.isFinite(powerSystem?.powerOutputW)
                ? powerSystem.powerOutputW
                : null,
        };
    }

    window.BeyondEarthSpacecraft = Object.freeze({
        getDesignFacts,
        normalizeLoadout,
        registerArchitecture,
        registerComponent,
    });
})();