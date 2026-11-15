"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto").webcrypto;
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const scripts = [
    "game-state.js",
    "cockpit-interactions.js",
    "catalogs.js",
    "spacecraft.js",
    "compatibility.js",
    "resources.js",
    "knowledge.js",
    "mission-education.js",
    "achievements.js",
    "mission-manager.js",
    "minigames/controls.js",
    "minigames/minigames.js",
];

function jsonClone(value) {
    return JSON.parse(JSON.stringify(value));
}

function createGame(store = new Map(), options = {}) {
    class TestCustomEvent extends Event {
        constructor(type, options = {}) {
            super(type);
            this.detail = options.detail;
        }
    }

    let now = Date.now();
    let nextTimerId = 0;
    let randomSource = Math.random;
    const timers = new Map();
    const elements = new Map();
    const setTimeout = (callback, delay = 0) => {
        const id = ++nextTimerId;
        timers.set(id, { callback, due: now + Math.max(0, Number(delay) || 0) });
        return id;
    };
    const clearTimeout = (id) => timers.delete(id);
    const math = Object.create(Math);
    math.random = () => randomSource();
    class TestDate extends Date {
        static now() {
            return now;
        }
    }

    const document = new EventTarget();
    document.hidden = false;
    document.querySelector = () => null;
    document.querySelectorAll = () => [];
    document.getElementById = (id) => elements.get(id) || null;
    const makeElement = (id, width = 960, height = 720) => ({
        id,
        hidden: false,
        dataset: {},
        style: {},
        textContent: "",
        clientWidth: width,
        clientHeight: height,
        parentElement: null,
        listeners: new Map(),
        addEventListener(type, callback) {
            this.listeners.set(type, callback);
        },
        appendChild(child) {
            child.parentElement = this;
            return child;
        },
        insertBefore(child) {
            child.parentElement = this;
            return child;
        },
        getBoundingClientRect() {
            return { left: 0, top: 0, width, height };
        },
        setAttribute(name, value) {
            this[name] = value;
        },
    });
    if (options.companionUi) {
        document.body = makeElement("body");
        document.body.classList = { toggle() {} };
        [
            ["mission-companion-layer", 960, 720],
            ["mission-astronaut-bubble", 320, 80],
            ["mission-astronaut", 46, 54],
            ["mission-astronaut-character", 46, 52],
            ["mission-companion-settings-open", 31, 31],
            ["mission-astronaut-name-dialog", 400, 300],
            ["mission-astronaut-nickname", 200, 30],
            ["mission-astronaut-name-later", 100, 30],
            ["mission-astronaut-message-wrap", 280, 50],
            ["mission-astronaut-speaker", 280, 16],
            ["mission-astronaut-message", 280, 50],
            ["mission-astronaut-note", 200, 24],
            ["mission-astronaut-dismiss", 24, 24],
            ["mission-notebook-owner", 200, 20],
        ].forEach(([id, width, height]) => elements.set(id, makeElement(id, width, height)));
        elements.get("mission-astronaut-bubble").hidden = true;
        const nameArt = makeElement("mission-astronaut-name-art");
        nameArt.replaceChildren = () => {};
        const astronautSprite = { cloneNode: () => ({}) };
        const nameDialog = elements.get("mission-astronaut-name-dialog");
        nameDialog.open = false;
        nameDialog.showModal = () => { nameDialog.open = true; };
        nameDialog.close = () => { nameDialog.open = false; };
        nameDialog.querySelector = () => nameArt;
        elements.get("mission-astronaut-nickname").focus = () => {};
        elements.get("mission-astronaut-character").querySelector = () => astronautSprite;
    }

    const sandbox = {
        CustomEvent: TestCustomEvent,
        Event,
        EventTarget,
        URL,
        console,
        crypto,
        document,
        Date: TestDate,
        Math: math,
        matchMedia: () => ({ matches: false }),
        performance,
        setTimeout,
        clearTimeout,
        window: null,
        BeyondEarthStorage: {
            read(key) {
                return store.has(key) ? jsonClone(store.get(key)) : null;
            },
            write(key, value) {
                store.set(key, jsonClone(value));
            },
        },
        BeyondEarthPlayer: {
            getPersonnelFile: () => ({ rank: "RECRUIT" }),
        },
        BeyondEarthTheme: {
            getColorFamily: () => "blackGrey",
        },
        BeyondEarthScenes: {
            getCurrentScene: () => "cockpit-scene",
        },
        SpaceAudio: {
            getPreferences: () => ({ muted: false }),
            playSFX: () => {},
        },
    };
    sandbox.window = sandbox;
    const context = vm.createContext(sandbox);
    scripts.forEach((script) => {
        const filename = path.join(__dirname, "..", "js", script);
        vm.runInContext(fs.readFileSync(filename, "utf8"), context, { filename });
    });
    function advance(milliseconds) {
        const end = now + milliseconds;
        let executions = 0;
        while (true) {
            const next = [...timers.entries()]
                .filter(([, timer]) => timer.due <= end)
                .sort((left, right) => left[1].due - right[1].due)[0];
            if (!next) break;
            if (++executions > 1000) throw new Error("Fake timer loop exceeded its safety limit.");
            timers.delete(next[0]);
            now = next[1].due;
            next[1].callback();
        }
        now = end;
        return executions;
    }
    return {
        window: sandbox,
        store,
        advance,
        setRandom: (source) => {
            randomSource = source;
        },
        setRandomSequence: (values, fallback = 0.01) => {
            const sequence = [...values];
            randomSource = () => sequence.length ? sequence.shift() : fallback;
        },
        getPendingTimerCount: () => timers.size,
    };
}

function registerCompatibleCatalogs(game) {
    const catalogs = game.window.BeyondEarthCatalogs;
    catalogs.register("destinations", {
        id: "test-world",
        name: "Test World",
        environmentalConditions: {},
    });
    catalogs.register("objectives", {
        id: "test-objective",
        name: "Test Objective",
        requiredInstrumentIds: [],
    });
    catalogs.register("architectures", {
        id: "test-architecture",
        name: "Test Architecture",
        maxPayloadMassKg: 500,
        componentSlots: {},
    });
    catalogs.register("powerSystems", {
        id: "test-power",
        name: "Test Power System",
        massKg: 20,
        powerDrawW: 5,
        powerOutputW: 100,
    });
}

test("mission performance deterministically selects the perfect, damaged, and lost endings", () => {
    const manager = createGame().window.BeyondEarthMissionManager;
    const run = (percentages) => manager.evaluateMissionPerformance(percentages.map((normalizedPercentage) => ({
        normalizedPercentage,
    })));

    const perfect = run([100, 90, 80]);
    assert.equal(perfect.finalScore, 90);
    assert.equal(perfect.ending, "perfect");
    assert.equal(perfect.outcome, "successful_return");

    const damaged = run([60, 45, 30]);
    assert.equal(damaged.finalScore, 45);
    assert.equal(damaged.ending, "damaged");
    assert.equal(damaged.outcome, "damaged_return");

    const lost = run([44, 40, 45]);
    assert.equal(lost.finalScore, 43);
    assert.equal(lost.ending, "lost");
    assert.equal(lost.outcome, "mission_failure");
    assert.equal(run([44, 40, 45]).ending, lost.ending);

    const repeatedCriticalFailures = run([100, 20, 20]);
    assert.equal(repeatedCriticalFailures.finalScore, 47);
    assert.equal(repeatedCriticalFailures.criticalFailureCount, 2);
    assert.equal(repeatedCriticalFailures.ending, "lost");

    const singleCriticalFailure = run([100, 100, 40]);
    assert.equal(singleCriticalFailure.finalScore, 80);
    assert.equal(singleCriticalFailure.criticalFailureCount, 1);
    assert.equal(singleCriticalFailure.ending, "damaged");

    const failedResult = manager.evaluateMissionPerformance([
        { normalizedPercentage: 100, status: "failure" },
        { normalizedPercentage: 100, status: "success" },
        { normalizedPercentage: 100, status: "success" },
    ]);
    assert.equal(failedResult.finalScore, 100);
    assert.equal(failedResult.criticalFailureCount, 1);
    assert.equal(failedResult.ending, "damaged");
});

test("mission education unlocks contextual notes through campaign knowledge state", () => {
    const game = createGame();
    const { window } = game;
    const catalogs = window.BeyondEarthCatalogs;
    catalogs.register("propulsionSystems", {
        id: "chemical-propulsion",
        name: "Chemical Propulsion",
        massKg: 410,
        powerDrawW: 45,
    });
    catalogs.register("destinations", {
        id: "test-world",
        name: "Test World",
        summary: "A test destination.",
    });
    catalogs.register("navigationSystems", {
        id: "star-tracker",
        name: "Star Tracker",
        compatibleArchitectureIds: ["orbiter"],
    });

    const previous = { spacecraft: { propulsionSystemId: null } };
    const current = { spacecraft: { propulsionSystemId: "chemical-propulsion" } };
    const newlyUnlocked = window.BeyondEarthMissionEducation.handleMissionUpdate(
        "propulsion",
        previous,
        current,
    );

    assert.equal(newlyUnlocked.length, 2);
    assert.equal(newlyUnlocked.some((entry) => entry.id === "rocket-equation"), true);
    assert.equal(newlyUnlocked.some((entry) => entry.id === "mission-engineering"), true);
    assert.equal(
        window.BeyondEarthGameState.getPersistentState().knowledge.unlockedEntryIds.includes("rocket-equation"),
        true,
    );
    assert.equal(window.BeyondEarthKnowledge.list({ category: "Propulsion" }).length, 1);

    const propulsionContext = window.BeyondEarthMissionEducation.getCompanionContext("propulsion", current);
    assert.equal(propulsionContext.expression, "celebrating");
    assert.equal(propulsionContext.selectedName, "Chemical Propulsion");
    assert.match(propulsionContext.message, /New page: Why rocket mass matters/);
    assert.equal(
        window.BeyondEarthMissionEducation.getCompanionContext("power", current).expression,
        "explaining",
    );

    const destinationContext = window.BeyondEarthMissionEducation.getCompanionContext("destination", {
        destination: { id: "test-world" },
    });
    assert.equal(destinationContext.expression, "excited");
    assert.match(destinationContext.message, /Test World/);

    window.BeyondEarthMissionEducation.handleMissionUpdate(
        "navigation",
        { spacecraft: { architectureId: "lander", navigationSystemId: null } },
        { spacecraft: { architectureId: "lander", navigationSystemId: "star-tracker" } },
    );
    const concernContext = window.BeyondEarthMissionEducation.getCompanionContext("navigation", {
        spacecraft: { architectureId: "lander", navigationSystemId: "star-tracker" },
    });
    assert.equal(concernContext.expression, "concerned");
    assert.match(concernContext.message, /may not fit this spacecraft/);
    window.BeyondEarthMissionEducation.handleMissionUpdate(
        "navigation",
        { spacecraft: { architectureId: "lander", navigationSystemId: "star-tracker" } },
        { spacecraft: { architectureId: "lander", navigationSystemId: "star-tracker" } },
    );
    const persistentConcern = window.BeyondEarthMissionEducation.getCompanionContext("navigation", {
        spacecraft: { architectureId: "lander", navigationSystemId: "star-tracker" },
    });
    assert.equal(persistentConcern.priority, "critical");
    assert.equal(persistentConcern.expression, "concerned");

    const reloaded = createGame(game.store);
    assert.equal(
        reloaded.window.BeyondEarthKnowledge.list({ category: "Propulsion" }).length,
        1,
    );
});

test("astronaut prioritizes modeled design issues and celebrates when they are resolved", () => {
    const { window } = createGame();
    window.BeyondEarthMissionBuilder = {
        buildReview(mission) {
            if (mission.spacecraft.architectureId === "payload-warning") {
                return {
                    issues: [{ severity: "warning", code: "payload-limit-exceeded" }],
                    status: "conditional",
                };
            }
            return {
                issues: mission.spacecraft.powerSystemId === "undersized-power"
                    ? [{
                        severity: "hard",
                        code: "power-limit-exceeded",
                    }]
                    : [],
                status: mission.spacecraft.powerSystemId === "undersized-power" ? "incompatible" : "suitable",
            };
        },
    };

    const previous = { spacecraft: { powerSystemId: "adequate-power" } };
    const shortage = { spacecraft: { powerSystemId: "undersized-power" } };
    window.BeyondEarthMissionEducation.handleMissionUpdate("power", previous, shortage);
    const alert = window.BeyondEarthMissionEducation.getCompanionContext("power", shortage);
    assert.equal(alert.priority, "critical");
    assert.equal(alert.expression, "concerned");
    assert.match(alert.message, /Power demand exceeds system output/);
    assert.equal(alert.entryId, "power-budget");

    window.BeyondEarthMissionEducation.handleMissionUpdate("power", shortage, previous);
    const resolved = window.BeyondEarthMissionEducation.getCompanionContext("power", previous);
    assert.equal(resolved.expression, "celebrating");
    assert.match(resolved.message, /modeled design checks are clear/);

    const architectureBefore = { spacecraft: { architectureId: "baseline" } };
    const payloadWarning = { spacecraft: { architectureId: "payload-warning" } };
    window.BeyondEarthMissionEducation.handleMissionUpdate("architecture", architectureBefore, payloadWarning);
    const payloadContext = window.BeyondEarthMissionEducation.getCompanionContext("architecture", payloadWarning);
    assert.equal(payloadContext.priority, "warning");
    assert.match(payloadContext.message, /Payload mass exceeds this spacecraft's limit/);
    assert.equal(payloadContext.entryId, "spacecraft-subsystems");

    window.BeyondEarthMissionGenerator = {
        buildMissionPlan(mission) {
            return {
                warnings: mission.destination?.id === "risky-world"
                    ? ["High-risk destination requires stricter contingency planning."]
                    : [],
            };
        },
    };
    const safeDestination = { destination: { id: "safe-world" }, spacecraft: {} };
    const warnedDestination = { destination: { id: "risky-world" }, spacecraft: {} };
    window.BeyondEarthMissionEducation.handleMissionUpdate("destination", safeDestination, warnedDestination);
    const destinationContext = window.BeyondEarthMissionEducation.getCompanionContext("destination", warnedDestination);
    assert.equal(destinationContext.priority, "warning");
    assert.match(destinationContext.message, /stricter contingency planning/);
    assert.match(destinationContext.message, /Journey planning/);
});

test("astronaut comments on each mission constraint using modeled data and outstanding checks", () => {
    const { window } = createGame();
    window.BeyondEarthMissionBuilder = {
        buildReview(mission) {
            const hasShortage = mission.spacecraft.powerSystemId === "undersized-power";
            return {
                issues: hasShortage
                    ? [{ severity: "hard", code: "power-limit-exceeded" }]
                    : [],
                status: hasShortage ? "incompatible" : "suitable",
            };
        },
    };

    const previous = {
        id: "constraint-guide-test",
        destination: { id: null },
        objectives: { primaryId: null, secondaryIds: [] },
        spacecraft: { architectureId: null, powerSystemId: null, scientificInstrumentIds: [] },
        planning: { durationDays: 100 },
        resources: {
            budgetCredits: 1000,
            powerWh: 1000,
            fuelKg: 500,
            dataStorageMb: 100,
        },
    };
    const changes = [
        ["budgetCredits", 1200, /Budget allocation is now 1200 credits/],
        ["powerWh", 1400, /Power reserve is now 1400 Wh/],
        ["fuelKg", 600, /Propellant reserve is now 600 kg/],
        ["dataStorageMb", 128, /Data archive capacity is now 128 MB/],
        ["durationDays", 200, /Mission duration is now 200 days/],
    ];

    changes.forEach(([field, value, expected]) => {
        const next = {
            ...previous,
            planning: { ...previous.planning },
            resources: { ...previous.resources },
        };
        if (field === "durationDays") next.planning.durationDays = value;
        else next.resources[field] = value;
        window.BeyondEarthMissionEducation.handleMissionUpdate("constraints", previous, next);
        const context = window.BeyondEarthMissionEducation.getCompanionContext("constraints", next);
        assert.match(context.message, expected);
        assert.match(context.message, /All currently modeled design checks pass/);
    });

    window.BeyondEarthMissionEducation.handleMissionUpdate("constraints", previous, previous);
    const unchangedContext = window.BeyondEarthMissionEducation.getCompanionContext("constraints", previous);
    assert.doesNotMatch(unchangedContext.message, /Budget allocation is now/);

    const shortageBefore = {
        ...previous,
        spacecraft: { ...previous.spacecraft, powerSystemId: "undersized-power" },
    };
    const reserveChange = {
        ...shortageBefore,
        resources: { ...shortageBefore.resources, powerWh: 1500 },
    };
    window.BeyondEarthMissionEducation.handleMissionUpdate("constraints", shortageBefore, reserveChange);
    const shortageContext = window.BeyondEarthMissionEducation.getCompanionContext("constraints", reserveChange);
    assert.equal(shortageContext.priority, "critical");
    assert.match(shortageContext.message, /Power reserve is now 1500 Wh/);
    assert.match(shortageContext.message, /Critical design check remains/);
    assert.match(shortageContext.message, /review Power/);
});

test("astronaut uses the planner's specialised-choice assessment", () => {
    const { window } = createGame();
    window.BeyondEarthCatalogs.register("architectures", {
        id: "special-platform",
        name: "Special Platform",
        componentSlots: {},
    });
    window.BeyondEarthMissionsTab = {
        getSpecializedChoiceObservation(stageId, choiceId) {
            return stageId === "architecture" && choiceId === "special-platform"
                ? {
                    kind: "architecture-objective-fit",
                    message: "The catalog doesn't list Special Platform as supporting Test Objective; this is a platform-fit hint, not a hard check.",
                }
                : null;
        },
    };

    const previous = { spacecraft: { architectureId: null } };
    const current = { spacecraft: { architectureId: "special-platform" } };
    window.BeyondEarthMissionEducation.handleMissionUpdate("architecture", previous, current);
    const context = window.BeyondEarthMissionEducation.getCompanionContext("architecture", current);
    assert.equal(context.expression, "thinking");
    assert.match(context.message, /doesn't list Special Platform as supporting Test Objective/);
    assert.match(context.message, /not a hard check/);
    assert.equal(context.entryId, "spacecraft-subsystems");
});

test("astronaut nickname and preferences persist through campaign state", () => {
    const legacyCampaign = {
        schemaVersion: 1,
        activeMission: null,
        missionHistory: [],
        knowledge: { unlockedEntryIds: ["orbital-motion"] },
    };
    const game = createGame(new Map([["game-state-v1", legacyCampaign]]));
    const { window } = game;
    assert.equal(window.BeyondEarthGameState.getPersistentState().companion.nickname, "");
    const defaults = window.BeyondEarthGameState.getPersistentState().companion.preferences;
    assert.equal(defaults.freeRoaming, true);
    assert.equal(defaults.educationalGuidance, true);
    assert.equal(defaults.playfulReactions, true);
    assert.equal(defaults.soundEffects, false);
    assert.equal(defaults.followPlayerInteractions, true);
    assert.throws(() => window.BeyondEarthGameState.setCompanionNickname("   "), /nickname must be between/);

    window.BeyondEarthGameState.setCompanionNickname("  Mochi   Nova  ");
    assert.equal(window.BeyondEarthGameState.getPersistentState().companion.nickname, "Mochi Nova");
    window.BeyondEarthGameState.setCompanionPreferences({
        freeRoaming: false,
        soundEffects: true,
    });
    assert.throws(() => window.BeyondEarthGameState.setCompanionPreferences({ playfulReactions: "yes" }), /must be a boolean/);
    assert.throws(() => window.BeyondEarthGameState.setCompanionPreferences({ unknownSetting: true }), /Unknown companion preference/);

    const restored = createGame(game.store);
    assert.equal(restored.window.BeyondEarthGameState.getPersistentState().companion.nickname, "Mochi Nova");
    const restoredPreferences = restored.window.BeyondEarthGameState.getPersistentState().companion.preferences;
    assert.equal(restoredPreferences.freeRoaming, false);
    assert.equal(restoredPreferences.educationalGuidance, true);
    assert.equal(restoredPreferences.playfulReactions, true);
    assert.equal(restoredPreferences.soundEffects, true);
    assert.equal(restoredPreferences.followPlayerInteractions, true);
});

test("astronaut nickname prompt waits for a touch or an explicit design-tab request", () => {
    const game = createGame(new Map(), { companionUi: true });
    const education = game.window.BeyondEarthMissionEducation;
    const dialog = game.window.document.getElementById("mission-astronaut-name-dialog");

    education.renderCompanion("dashboard", null);
    assert.equal(dialog.open, false);

    game.window.BeyondEarthScenes.getCurrentScene = () => "missions-scene";
    education.renderCompanion("headquarters", null);
    assert.equal(dialog.open, false);

    assert.equal(education.requestNickname(), true);
    assert.equal(dialog.open, true);

    dialog.open = false;
    const character = game.window.document.getElementById("mission-astronaut-character");
    character.listeners.get("click")({ detail: 0 });
    assert.equal(dialog.open, true);
});

test("deferred astronaut nickname prompt stays closed when the design tab requests it", () => {
    const game = createGame(new Map(), { companionUi: true });
    const education = game.window.BeyondEarthMissionEducation;
    const dialog = game.window.document.getElementById("mission-astronaut-name-dialog");
    const later = game.window.document.getElementById("mission-astronaut-name-later");

    education.requestNickname();
    dialog.open = false;
    later.listeners.get("click")();

    assert.equal(education.requestNickname(), false);
    assert.equal(dialog.open, false);
});

test("astronaut makes varied autonomous comments and respects companion preferences", () => {
    const game = createGame(new Map(), { companionUi: true });
    const { window } = game;
    const state = window.BeyondEarthGameState;
    const bubble = window.document.getElementById("mission-astronaut-bubble");
    const message = window.document.getElementById("mission-astronaut-message");
    const companion = window.document.getElementById("mission-astronaut");
    state.setCompanionNickname("Mochi");
    state.setCompanionPreferences({
        freeRoaming: false,
        speechBubbleFrequency: "chatty",
    });
    game.setRandom(() => 0.01);
    window.document.dispatchEvent(new window.CustomEvent("beyond:scenechange", {
        detail: { scene: "cockpit-scene" },
    }));
    assert.equal(window.document.getElementById("mission-companion-layer").hidden, false);
    assert.ok(game.getPendingTimerCount() > 0);
    bubble.hidden = true;
    const preferredPosition = companion.style.left;

    game.setRandomSequence([0.01, 0.2, 0.01, 0.99, 0.01, 0.01]);
    assert.ok(game.advance(12000) > 0);
    assert.match(message.textContent, /icy moons/);
    assert.equal(companion.dataset.expression, "curious");
    assert.equal(companion.style.left, preferredPosition);

    game.setRandomSequence([0.01, 0.2, 0.01, 0.99, 0.01, 0.01]);
    game.advance(11000);
    assert.match(message.textContent, /counted the stars/);
    assert.equal(companion.dataset.expression, "confused");

    state.setCompanionPreferences({ educationalGuidance: false });
    bubble.hidden = true;
    window.BeyondEarthMissionEducation.renderCompanion("dashboard", null);
    game.setRandomSequence([0.01, 0.2, 0.01, 0.99, 0.01, 0.01]);
    game.advance(12000);
    assert.match(message.textContent, /planet/i);
    assert.equal(companion.dataset.expression, "curious");

    state.setCompanionPreferences({
        educationalGuidance: true,
        playfulReactions: false,
    });
    bubble.hidden = true;
    window.BeyondEarthMissionEducation.renderCompanion("dashboard", null);
    game.setRandomSequence([0.01, 0.01, 0.01]);
    game.advance(12000);
    assert.match(message.textContent, /welcome to Mission Control/i);
    assert.equal(companion.dataset.playfulEnabled, "false");
});

test("mission approval, minigame lifecycle, resources, and progression are atomic and resumable", async () => {
    const store = new Map([["unrelated-player-data", { keep: true }]]);
    const game = createGame(store);
    const { window } = game;
    const missions = window.BeyondEarthMissionManager;
    registerCompatibleCatalogs(game);
    let approvedEventMission = null;
    window.document.addEventListener("beyond:missionapproved", (event) => {
        approvedEventMission = event.detail.mission;
    });
    const powerFacts = window.BeyondEarthSpacecraft.getDesignFacts({
        architectureId: "test-architecture",
        powerSystemId: "test-power",
    });
    assert.equal(powerFacts.powerDrawW, 0);
    assert.equal(powerFacts.powerOutputW, 100);

    const mission = missions.createMission({ name: "Infrastructure Test" });
    missions.saveMission(mission);
    assert.throws(() => missions.approveMission(), /destination and at least one scientific objective/);
    assert.equal(missions.getActiveMission().status, "draft");

    missions.updateActiveMission((draft) => {
        draft.destination.id = "test-world";
        draft.objectives.primaryId = "test-objective";
        draft.spacecraft.architectureId = "test-architecture";
        draft.spacecraft.powerSystemId = "test-power";
        draft.resources.budgetCredits = 10;
    });
    const approved = missions.approveMission();
    assert.equal(approved.approval.compatibilityStatus, "suitable");
    assert.equal(approvedEventMission.id, approved.id);
    missions.transitionStatus("active");

    window.BeyondEarthKnowledge.register({
        id: "test-knowledge",
        title: "Test Entry",
        category: "test",
        summary: "A test-only entry.",
        content: "No scientific claim is included.",
        sources: [{ title: "Test source", url: "https://example.test/" }],
    });

    let activeColorFamily = "black-grey";
    const bluePalette = { primary: "#8eacd4", highlight: "#c9def0" };
    window.BeyondEarthPlayer.getPersonnelFile = () => ({ colorFamily: "blue" });
    window.BeyondEarthTheme = {
        getColorFamily: () => activeColorFamily,
        hasColorFamily: (family) => ["black-grey", "blue"].includes(family),
        getPalette: () => bluePalette,
        setColorFamily: (family) => { activeColorFamily = family; },
    };

    let context;
    let disposeCount = 0;
    let inputCount = 0;
    const observations = [];
    window.document.addEventListener("beyond:minigameobservation", (event) => {
        observations.push(event.detail);
    });
    const target = new EventTarget();
    window.BeyondEarthMinigames.register({
        id: "test-game",
        name: "Test Game",
        create(minigameContext) {
            context = minigameContext;
            return {
                mount() {
                    minigameContext.controls.add(target, "pulse", () => {
                        inputCount += 1;
                    });
                },
                pause() {},
                resume() {},
                dispose() {
                    disposeCount += 1;
                },
            };
        },
    });
    await window.BeyondEarthMinigames.start("test-game");
    assert.equal(context.playerColor, bluePalette.primary);
    assert.equal(context.playerHighlight, bluePalette.highlight);
    assert.equal(activeColorFamily, "blue");
    assert.equal(context.companion.observe("progress"), true);
    assert.equal(observations[0].id, "test-game");
    assert.equal(observations[0].missionId, mission.id);
    assert.equal(observations[0].kind, "progress");
    assert.throws(() => context.companion.observe("answer"), /Unknown minigame companion observation/);
    target.dispatchEvent(new Event("pulse"));
    await window.BeyondEarthMinigames.pause();
    await window.BeyondEarthMinigames.resume();
    assert.throws(() => context.reportResult({
        status: "failure",
        resourcesAffected: [{
            resource: "budgetCredits",
            delta: -11,
            reason: "Test underflow",
        }],
    }), /cannot fall below/);
    assert.equal(missions.getActiveMission().resources.budgetCredits, 10);
    assert.equal(missions.getActiveMission().performance.minigameResults.length, 0);

    const result = context.reportResult({
        status: "success",
        score: 42,
        performanceRating: 0.8,
        resourcesAffected: [{
            resource: "budgetCredits",
            delta: -4,
            reason: "Test minigame cost",
        }],
        objectivesCompleted: ["test-objective"],
        knowledgeUnlocks: ["test-knowledge"],
        scientificData: [{ id: "test-sample" }],
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    target.dispatchEvent(new Event("pulse"));
    assert.equal(inputCount, 1);
    assert.equal(disposeCount, 1);
    assert.equal(window.BeyondEarthMinigames.getActive(), null);
    assert.equal(context.companion.observe("progress"), false);
    assert.equal(missions.getActiveMission().resources.budgetCredits, 6);
    assert.equal(missions.getActiveMission().performance.minigameResults.length, 1);
    assert.equal(missions.getActiveMission().performance.minigameResults[0].minigameName, "Test Game");
    assert.equal(
        window.BeyondEarthGameState.getPersistentState().knowledge.unlockedEntryIds.includes("test-knowledge"),
        true,
    );
    assert.throws(() => missions.recordMinigameResult(result), /already been recorded/);
    assert.equal(missions.getActiveMission().resources.budgetCredits, 6);

    let endContext;
    let endDisposeCount = 0;
    window.BeyondEarthMinigames.register({
        id: "test-end-game",
        name: "Test End Game",
        create(minigameContext) {
            endContext = minigameContext;
            return {
                mount() {},
                dispose() {
                    endDisposeCount += 1;
                },
            };
        },
    });
    await window.BeyondEarthMinigames.start("test-end-game");
    assert.equal(endContext.companion.observe("discovery"), true);
    await endContext.end();
    assert.equal(endContext.companion.observe("discovery"), false);
    assert.equal(endDisposeCount, 1);
    assert.equal(window.BeyondEarthMinigames.getActive(), null);

    window.BeyondEarthAchievements.register({
        id: "test-first-mission",
        title: "Test Flight",
        description: "Test-only achievement.",
        evaluate: ({ state }) => state.completedMissions.some((item) => item.id === mission.id),
    });
    const completed = missions.completeMission({ finalScore: 42, experienceAward: 7 });
    assert.equal(completed.status, "completed");
    assert.equal(Array.from(completed.performance.achievementsUnlocked).join(","), "test-first-mission");
    assert.equal(missions.getActiveMission(), null);
    assert.equal(window.BeyondEarthGameState.getPersistentState().progression.experiencePoints, 7);
    assert.equal(
        window.BeyondEarthGameState.getPersistentState().progression.achievements.includes("test-first-mission"),
        true,
    );
    window.BeyondEarthAchievements.recordMissionCompletion(completed);
    assert.equal(window.BeyondEarthGameState.getPersistentState().progression.experiencePoints, 7);

    const restoredGame = createGame(store);
    const restored = restoredGame.window.BeyondEarthGameState.getPersistentState();
    assert.equal(restored.missionHistory[0].id, mission.id);
    assert.equal(restored.progression.experiencePoints, 7);
    assert.equal(restoredGame.store.get("unrelated-player-data").keep, true);
});

test("scoped controls remove listeners and reject duplicate registrations", () => {
    const { window } = createGame();
    const controls = window.BeyondEarthMinigameControls.createScope("test-scope");
    const target = new EventTarget();
    let received = 0;
    const listener = () => {
        received += 1;
    };

    controls.add(target, "pulse", listener);
    controls.add(target, "pulse", listener);
    target.dispatchEvent(new Event("pulse"));
    assert.equal(received, 1);
    assert.equal(controls.size, 1);
    controls.dispose();
    target.dispatchEvent(new Event("pulse"));
    assert.equal(received, 1);
    assert.equal(controls.disposed, true);
    assert.throws(() => controls.add(target, "pulse", listener), /has been disposed/);
});

test("cockpit interactions support distinct controls without changing mission state", () => {
    const { window } = createGame();
    const interactions = window.BeyondEarthCockpitInteractions;
    const changed = [];
    window.document.addEventListener("beyond:cockpitinteraction", (event) => {
        changed.push(event.detail);
    });

    interactions.register({
        id: "test-toggle",
        type: "toggle",
        initialState: { enabled: false },
        onInteract: ({ state }) => ({ state: { enabled: !state.enabled } }),
    });
    interactions.register({
        id: "test-dial",
        type: "rotary",
        initialState: { angle: 0 },
        onInteract: ({ state, input }) => ({ state: { angle: state.angle + input.delta } }),
    });
    interactions.register({
        id: "test-slider",
        type: "slider",
        initialState: { value: 0 },
        onInteract: ({ input }) => ({ state: { value: input.value } }),
    });
    interactions.register({
        id: "test-storage",
        type: "compartment",
        initialState: { open: false },
        onInteract: ({ state }) => ({ state: { open: !state.open } }),
    });
    interactions.register({
        id: "test-monitor",
        type: "monitor",
        initialState: { page: "overview" },
        visualResponse: (state) => ({ display: state.page }),
        onInteract: ({ input }) => ({ state: { page: input.page } }),
    });
    interactions.register({
        id: "test-life-support",
        type: "system",
        system: "life-support",
        initialState: { oxygenPercent: 98 },
        canInteract: ({ state }) => state.oxygenPercent > 0,
        soundResponse: () => "toggle",
        onInteract: ({ state, input }) => ({
            state: { oxygenPercent: state.oxygenPercent + input.adjustment },
            result: { readingChanged: true },
        }),
    });

    assert.equal(interactions.get("test-toggle").state.enabled, false);
    assert.equal(interactions.interact("test-toggle").state.enabled, true);
    assert.equal(interactions.interact("test-dial", { delta: 15 }).state.angle, 15);
    assert.equal(interactions.interact("test-slider", { value: 0.6 }).state.value, 0.6);
    assert.equal(interactions.interact("test-storage").state.open, true);
    assert.equal(interactions.interact("test-monitor", { page: "diagnostics" }).visual.display, "diagnostics");

    const reading = interactions.interact("test-life-support", { adjustment: -1 });
    assert.equal(reading.state.oxygenPercent, 97);
    assert.equal(reading.system, "life-support");
    assert.equal(reading.sound, "toggle");
    assert.equal(changed.length, 6);
    assert.equal(window.BeyondEarthGameState.getPersistentState().activeMission, null);
    const preparedRevision = interactions.get("test-toggle").revision;
    interactions.interact("test-toggle", null, { expectedRevision: preparedRevision });
    assert.throws(
        () => interactions.interact("test-toggle", null, { expectedRevision: preparedRevision }),
        /has changed since it was prepared/,
    );
    assert.throws(() => interactions.register({
        id: "test-toggle",
        type: "toggle",
        initialState: false,
        onInteract: ({ state }) => ({ state: !state }),
    }), /already registered/);
});

test("cockpit interactions reject unavailable actions without changing state", () => {
    const { window } = createGame();
    const interactions = window.BeyondEarthCockpitInteractions;
    interactions.register({
        id: "test-locked-panel",
        type: "compartment",
        initialState: { open: false },
        canInteract: () => false,
        onInteract: ({ state }) => ({ state: { open: !state.open } }),
    });

    assert.equal(interactions.get("test-locked-panel").available, false);
    assert.throws(() => interactions.interact("test-locked-panel"), /not currently available/);
    assert.equal(interactions.get("test-locked-panel").state.open, false);
    assert.equal(interactions.get("test-locked-panel").revision, 0);
});

test("knowledge entries reject empty summaries", () => {
    const { window } = createGame();
    assert.throws(() => window.BeyondEarthKnowledge.register({
        id: "test-empty-summary",
        title: "Empty Summary",
        category: "test",
        summary: "   ",
        content: "The content is present, but the summary is blank.",
        sources: [{ title: "Test source", url: "https://example.test/" }],
    }), /summary/);
});
