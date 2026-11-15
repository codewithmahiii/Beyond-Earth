"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const readScript = (name) => fs.readFileSync(path.join(__dirname, "..", "js", name), "utf8");

function createLocalStorage(entries = []) {
    const values = new Map(entries);
    return {
        get length() {
            return values.size;
        },
        key(index) {
            return [...values.keys()][index] ?? null;
        },
        getItem(key) {
            return values.get(key) ?? null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        },
        removeItem(key) {
            values.delete(key);
        },
        values,
    };
}

test("game data clearing preserves unrelated localStorage entries", () => {
    const localStorage = createLocalStorage([
        ["beyond-earth-data:game-state-v1", "{}"],
        ["beyond-earth-data:astronaut-personnel-file-v1", "{}"],
        ["beyond-earth-data:future-game-record", "{}"],
        ["beyond-earth-audio-v1", "{}"],
        ["unrelated-site-preference", "keep"],
    ]);
    const sandbox = { window: { localStorage }, console };
    vm.runInNewContext(readScript("storage.js"), sandbox);

    const removed = sandbox.window.BeyondEarthStorage.clearGameData();

    assert.deepEqual([...removed].sort(), [
        "beyond-earth-audio-v1",
        "beyond-earth-data:astronaut-personnel-file-v1",
        "beyond-earth-data:future-game-record",
        "beyond-earth-data:game-state-v1",
    ]);
    assert.deepEqual([...localStorage.values], [["unrelated-site-preference", "keep"]]);
});

test("cleared campaign data initializes a brand-new campaign", () => {
    const localStorage = createLocalStorage([
        ["beyond-earth-data:game-state-v1", JSON.stringify({
            activeMission: { id: "old-mission" },
            missionHistory: [{ id: "completed-mission" }],
            progression: { experiencePoints: 800, achievements: ["old-achievement"] },
            knowledge: { unlockedEntryIds: ["old-entry"] },
        })],
    ]);
    const document = {
        querySelector: () => null,
        addEventListener() {},
        dispatchEvent() {},
    };
    const sandbox = {
        CustomEvent: class {},
        document,
        console,
        matchMedia: () => ({ matches: false }),
        window: null,
        BeyondEarthPlayer: { getPersonnelFile: () => ({ rank: "RECRUIT" }) },
        BeyondEarthTheme: { getColorFamily: () => "black-grey" },
        BeyondEarthScenes: { getCurrentScene: () => null },
    };
    sandbox.window = sandbox;
    sandbox.localStorage = localStorage;
    vm.runInNewContext(readScript("storage.js"), sandbox);
    sandbox.window.BeyondEarthStorage.clearGameData();
    vm.runInNewContext(readScript("game-state.js"), sandbox);

    const campaign = sandbox.window.BeyondEarthGameState.getPersistentState();
    assert.equal(campaign.activeMission, null);
    assert.equal(campaign.missionHistory.length, 0);
    assert.equal(campaign.progression.experiencePoints, 0);
    assert.equal(campaign.progression.achievements.length, 0);
    assert.equal(campaign.knowledge.unlockedEntryIds.length, 0);
    assert.equal(campaign.companion.nickname, "");
});

test("factory reset requires exact confirmation and clears game state before reload", async () => {
    class Element {
        constructor() {
            this.listeners = new Map();
            this.hidden = false;
            this.disabled = false;
            this.value = "";
            this.textContent = "";
            this.open = false;
        }

        addEventListener(type, callback) {
            this.listeners.set(type, callback);
        }

        click() {
            this.listeners.get("click")?.();
        }

        dispatch(type) {
            this.listeners.get(type)?.();
        }

        showModal() {
            this.open = true;
        }

        close() {
            this.open = false;
            this.listeners.get("close")?.();
        }

        focus() {}
    }

    const ids = [
        "factory-reset-dialog",
        "factory-reset-open",
        "factory-reset-first-step",
        "factory-reset-second-step",
        "factory-reset-continue",
        "factory-reset-confirmation",
        "factory-reset-confirm",
        "factory-reset-feedback",
    ];
    const elements = new Map(ids.map((id) => [id, new Element()]));
    const cancelButtons = [new Element(), new Element()];
    const calls = [];
    const document = {
        getElementById: (id) => elements.get(id) || null,
        querySelectorAll: () => cancelButtons,
    };
    const sandbox = {
        document,
        console,
        window: {
            BeyondEarthMinigames: { dispose: async () => calls.push("dispose") },
            SpaceAudio: { resetPreferences: () => calls.push("audio") },
            BeyondEarthStorage: { clearGameData: () => calls.push("clear") },
            location: { reload: () => calls.push("reload") },
        },
    };
    sandbox.window.window = sandbox.window;
    vm.runInNewContext(readScript("factory-reset.js"), sandbox);

    const dialog = elements.get("factory-reset-dialog");
    const openButton = elements.get("factory-reset-open");
    const continueButton = elements.get("factory-reset-continue");
    const input = elements.get("factory-reset-confirmation");
    const confirmButton = elements.get("factory-reset-confirm");

    openButton.click();
    assert.equal(dialog.open, true);
    assert.equal(elements.get("factory-reset-first-step").hidden, false);
    continueButton.click();
    assert.equal(elements.get("factory-reset-second-step").hidden, false);
    assert.equal(confirmButton.disabled, true);

    input.value = "reset";
    input.dispatch("input");
    assert.equal(confirmButton.disabled, true);
    input.value = "RESET";
    input.dispatch("input");
    assert.equal(confirmButton.disabled, false);
    confirmButton.click();
    await new Promise((resolve) => setImmediate(resolve));

    assert.deepEqual(calls, ["dispose", "audio", "clear", "reload"]);
});
