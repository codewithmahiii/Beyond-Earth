(() => {
    "use strict";

    const KEY_PREFIX = "beyond-earth-data:";
    const ADDITIONAL_GAME_STORAGE_KEYS = Object.freeze(["beyond-earth-audio-v1"]);

    function storageKey(key) {
        if (typeof key !== "string" || !/^[a-z0-9-]+$/i.test(key)) {
            throw new TypeError("Game storage keys must use letters, numbers, and hyphens.");
        }
        return `${KEY_PREFIX}${key}`;
    }

    function read(key) {
        let serialized;
        try {
            serialized = window.localStorage.getItem(storageKey(key));
            return serialized === null ? null : JSON.parse(serialized);
        } catch (error) {
            console.error(`Could not read Beyond Earth data "${key}".`, error);
            throw error;
        }
    }

    function write(key, value) {
        try {
            window.localStorage.setItem(storageKey(key), JSON.stringify(value));
        } catch (error) {
            console.error(`Could not save Beyond Earth data "${key}".`, error);
            throw error;
        }
    }

    function clearGameData() {
        const ownedKeys = new Set(ADDITIONAL_GAME_STORAGE_KEYS);
        for (let index = 0; index < window.localStorage.length; index += 1) {
            const key = window.localStorage.key(index);
            if (key && key.startsWith(KEY_PREFIX)) {
                ownedKeys.add(key);
            }
        }
        ownedKeys.forEach((key) => window.localStorage.removeItem(key));
        return [...ownedKeys];
    }

    window.BeyondEarthStorage = Object.freeze({ clearGameData, read, write });
})();