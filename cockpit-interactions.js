(() => {
    "use strict";

    const INTERACTION_TYPES = new Set([
        "button",
        "compartment",
        "lever",
        "monitor",
        "rotary",
        "slider",
        "system",
        "toggle",
    ]);
    const interactions = new Map();
    const activeInteractions = new Set();

    function cloneData(value, label) {
        let serialized;
        try {
            serialized = JSON.stringify(value);
        } catch (error) {
            throw new TypeError(`${label} must contain JSON-compatible data.`);
        }
        if (serialized === undefined) {
            throw new TypeError(`${label} must contain JSON-compatible data.`);
        }
        return JSON.parse(serialized);
    }

    function validateId(id) {
        if (typeof id !== "string" || !/^[a-z0-9][a-z0-9-]*$/i.test(id)) {
            throw new TypeError("Cockpit interaction IDs must use letters, numbers, and hyphens.");
        }
    }

    function getRecord(id) {
        validateId(id);
        const record = interactions.get(id);
        if (!record) {
            throw new RangeError(`Cockpit interaction "${id}" is not registered.`);
        }
        return record;
    }

    function describe(record, currentState = record.state, revision = record.revision) {
        const state = cloneData(currentState, `State for "${record.id}"`);
        const available = record.canInteract
            ? record.canInteract({ id: record.id, type: record.type, state: cloneData(state, "Interaction state") }) === true
            : true;
        const visual = record.visualResponse
            ? cloneData(record.visualResponse(cloneData(state, "Interaction state")), "Visual response")
            : null;
        return {
            id: record.id,
            type: record.type,
            state,
            system: record.system,
            available,
            visual,
            revision,
        };
    }

    function register(definition) {
        if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
            throw new TypeError("Cockpit interactions must be registered with a definition object.");
        }
        validateId(definition.id);
        if (interactions.has(definition.id)) {
            throw new RangeError(`Cockpit interaction "${definition.id}" is already registered.`);
        }
        if (!INTERACTION_TYPES.has(definition.type)) {
            throw new RangeError(`Unknown cockpit interaction type: ${definition.type}.`);
        }
        if (!Object.prototype.hasOwnProperty.call(definition, "initialState")
            || typeof definition.onInteract !== "function") {
            throw new TypeError("Cockpit interactions need an initialState and onInteract function.");
        }
        if (definition.system !== undefined
            && definition.system !== null
            && (typeof definition.system !== "string" || !definition.system.trim())) {
            throw new TypeError("Cockpit interaction systems must be non-empty strings or null.");
        }
        for (const field of ["canInteract", "visualResponse", "soundResponse"]) {
            if (definition[field] !== undefined && typeof definition[field] !== "function") {
                throw new TypeError(`Cockpit interaction "${field}" must be a function.`);
            }
        }

        const record = {
            id: definition.id,
            type: definition.type,
            state: cloneData(definition.initialState, `Initial state for "${definition.id}"`),
            system: definition.system ?? null,
            canInteract: definition.canInteract || null,
            visualResponse: definition.visualResponse || null,
            soundResponse: definition.soundResponse || null,
            onInteract: definition.onInteract,
            revision: 0,
        };
        const snapshot = describe(record);
        interactions.set(record.id, record);
        return snapshot;
    }

    function get(id) {
        return describe(getRecord(id));
    }

    function list() {
        return Array.from(interactions.values(), (record) => describe(record));
    }

    function interact(id, input = null, options = {}) {
        const record = getRecord(id);
        if (!options || typeof options !== "object" || Array.isArray(options)) {
            throw new TypeError("Cockpit interaction options must be an object.");
        }
        if (options.expectedRevision !== undefined
            && (!Number.isSafeInteger(options.expectedRevision) || options.expectedRevision < 0)) {
            throw new TypeError("Expected cockpit interaction revisions must be non-negative integers.");
        }
        if (options.expectedRevision !== undefined && options.expectedRevision !== record.revision) {
            throw new Error(`Cockpit interaction "${id}" has changed since it was prepared.`);
        }
        if (activeInteractions.has(id)) {
            throw new Error(`Cockpit interaction "${id}" is already being processed.`);
        }

        const current = describe(record);
        if (!current.available) {
            throw new Error(`Cockpit interaction "${id}" is not currently available.`);
        }

        activeInteractions.add(id);
        try {
            const previousState = cloneData(record.state, `State for "${id}"`);
            const response = record.onInteract({
                id: record.id,
                type: record.type,
                system: record.system,
                state: cloneData(previousState, "Interaction state"),
                input: cloneData(input, "Interaction input"),
            });
            if (response && typeof response.then === "function") {
                throw new TypeError(`Cockpit interaction "${id}" must update state synchronously.`);
            }
            if (!response || typeof response !== "object" || Array.isArray(response)
                || !Object.prototype.hasOwnProperty.call(response, "state")) {
                throw new TypeError(`Cockpit interaction "${id}" must return an object containing state.`);
            }

            const nextState = cloneData(response.state, `Next state for "${id}"`);
            const result = response.result === undefined
                ? null
                : cloneData(response.result, `Result for "${id}"`);
            const sound = record.soundResponse
                ? record.soundResponse({
                    id: record.id,
                    type: record.type,
                    input: cloneData(input, "Interaction input"),
                    previousState: cloneData(previousState, "Previous interaction state"),
                    state: cloneData(nextState, "Next interaction state"),
                    result: cloneData(result, "Interaction result"),
                })
                : null;
            if (sound !== null && sound !== undefined && (typeof sound !== "string" || !sound.trim())) {
                throw new TypeError(`Cockpit interaction "${id}" returned an invalid sound response.`);
            }

            const nextRevision = record.revision + 1;
            const snapshot = describe(record, nextState, nextRevision);
            const detail = {
                ...snapshot,
                previousState,
                result,
                sound: sound || null,
            };
            const responseDetail = cloneData(detail, "Cockpit interaction response");
            record.state = nextState;
            record.revision = nextRevision;
            document.dispatchEvent(new CustomEvent("beyond:cockpitinteraction", { detail }));
            return responseDetail;
        } finally {
            activeInteractions.delete(id);
        }
    }

    window.BeyondEarthCockpitInteractions = Object.freeze({
        get,
        interact,
        list,
        register,
        types: Object.freeze(Array.from(INTERACTION_TYPES)),
    });
})();
