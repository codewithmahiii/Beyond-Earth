(() => {
    "use strict";

    const entries = new Map();

    function isRecord(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function normalizeEntry(value) {
        if (!isRecord(value)
            || typeof value.id !== "string"
            || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.id)
            || typeof value.title !== "string"
            || !value.title.trim()
            || typeof value.category !== "string"
            || !value.category.trim()
            || typeof value.summary !== "string"
            || !value.summary.trim()
            || typeof value.content !== "string"
            || !value.content.trim()
            || !Array.isArray(value.sources)
            || !value.sources.length) {
            throw new TypeError("Knowledge entries require an ID, title, category, summary, content, and sources.");
        }
        const sources = value.sources.map((source) => {
            if (!isRecord(source)
                || typeof source.title !== "string"
                || !source.title.trim()
                || typeof source.url !== "string") {
                throw new TypeError("Knowledge sources require a title and an HTTP(S) URL.");
            }
            const url = new URL(source.url);
            if (!["http:", "https:"].includes(url.protocol)) {
                throw new TypeError("Knowledge source URLs must use HTTP or HTTPS.");
            }
            return { title: source.title.trim(), url: url.href };
        });
        return {
            id: value.id,
            title: value.title.trim(),
            category: value.category.trim(),
            summary: value.summary.trim(),
            content: value.content.trim(),
            sources,
            tags: Array.isArray(value.tags) ? [...new Set(value.tags.filter((tag) => typeof tag === "string"))] : [],
        };
    }

    function register(value) {
        const entry = normalizeEntry(value);
        if (entries.has(entry.id)) {
            throw new Error(`Knowledge entry "${entry.id}" is already registered.`);
        }
        entries.set(entry.id, entry);
        document.dispatchEvent(new CustomEvent("beyond:knowledgecatalogchange", {
            detail: { id: entry.id },
        }));
        return clone(entry);
    }

    function hasEntry(id) {
        return entries.has(id);
    }

    function getEntry(id) {
        const entry = entries.get(id);
        return entry ? clone(entry) : null;
    }

    function validateUnlocks(ids) {
        if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string" || !entries.has(id))) {
            throw new Error("Knowledge unlocks must reference registered archive entries.");
        }
        return [...new Set(ids)];
    }

    function unlockMany(ids) {
        const validated = validateUnlocks(ids);
        if (!validated.length) return [];
        const existing = new Set(window.BeyondEarthGameState.getPersistentState().knowledge.unlockedEntryIds);
        if (validated.every((id) => existing.has(id))) return [];
        let unlocked = [];
        window.BeyondEarthGameState.updatePersistentState((campaign) => {
            const existing = new Set(campaign.knowledge.unlockedEntryIds);
            unlocked = validated.filter((id) => !existing.has(id));
            campaign.knowledge.unlockedEntryIds = [...existing, ...unlocked];
        });
        unlocked.forEach((id) => {
            document.dispatchEvent(new CustomEvent("beyond:knowledgeunlocked", {
                detail: { entry: clone(entries.get(id)) },
            }));
        });
        return unlocked.map((id) => clone(entries.get(id)));
    }

    function list(options = {}) {
        if (!isRecord(options)) throw new TypeError("Knowledge archive filters must be an object.");
        const unlockedIds = new Set(window.BeyondEarthGameState.getPersistentState().knowledge.unlockedEntryIds);
        const category = options.category ?? null;
        const includeLocked = options.includeLocked === true;
        return Array.from(entries.values())
            .filter((entry) => (includeLocked || unlockedIds.has(entry.id))
                && (!category || entry.category === category))
            .sort((left, right) => left.title.localeCompare(right.title))
            .map(clone);
    }

    function search(query, options = {}) {
        if (typeof query !== "string") throw new TypeError("Knowledge searches require a string query.");
        const normalizedQuery = query.trim().toLocaleLowerCase();
        return list(options).filter((entry) => !normalizedQuery
            || [entry.title, entry.category, entry.summary, entry.content, ...entry.tags]
                .some((value) => value.toLocaleLowerCase().includes(normalizedQuery)));
    }

    window.BeyondEarthKnowledge = Object.freeze({
        getEntry,
        hasEntry,
        list,
        register,
        search,
        unlock: (id) => unlockMany([id])[0],
        unlockMany,
        validateUnlocks,
    });
})();