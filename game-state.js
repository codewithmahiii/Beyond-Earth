(() => {
    "use strict";

    const STORAGE_KEY = "game-state-v1";
    const MAX_COMPANION_NICKNAME_LENGTH = 24;
    const DEFAULT_COMPANION_PREFERENCES = Object.freeze({
        visible: true,
        freeRoaming: true,
        educationalGuidance: true,
        playfulReactions: true,
        soundEffects: false,
        followPlayerInteractions: true,
        speechBubbleFrequency: "balanced",
    });
    const COMPANION_SPEECH_FREQUENCIES = new Set(["quiet", "balanced", "chatty"]);
    const NON_NEGATIVE_INTEGER_FIELDS = [
        "experiencePoints",
    ];
    const ID_ARRAY_FIELDS = [
        "achievements",
        "completedMissionIds",
        "recordedMissionIds",
        "unlockedComponents",
        "unlockedDestinations",
        "unlockedTechnologies",
    ];

    let activeScene = document.querySelector(".scene.active")?.id || null;
    let activeMinigame = null;
    let recoveryError = null;

    function isRecord(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function clone(value) {
        return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
    }

    function uniqueIds(value, field) {
        if (value === undefined) return [];
        if (!Array.isArray(value) || value.some((id) => typeof id !== "string" || !id.trim())) {
            throw new TypeError(`Campaign field "${field}" must be an array of non-empty IDs.`);
        }
        return [...new Set(value)];
    }

    function normalizeProgression(value = {}) {
        if (!isRecord(value)) {
            throw new TypeError("Campaign progression must be an object.");
        }
        const progression = {};
        NON_NEGATIVE_INTEGER_FIELDS.forEach((field) => {
            const amount = value[field] ?? 0;
            if (!Number.isSafeInteger(amount) || amount < 0) {
                throw new TypeError(`Campaign progression "${field}" must be a non-negative integer.`);
            }
            progression[field] = amount;
        });
        ID_ARRAY_FIELDS.forEach((field) => {
            progression[field] = uniqueIds(value[field], field);
        });
        progression.experienceEvents = Array.isArray(value.experienceEvents)
            ? clone(value.experienceEvents)
            : [];
        progression.researchProgress = isRecord(value.researchProgress)
            ? clone(value.researchProgress)
            : {};
        return progression;
    }

    function normalizeCompanion(value = {}) {
        if (!isRecord(value)) {
            throw new TypeError("Campaign companion settings must be an object.");
        }
        const nickname = value.nickname ?? "";
        if (typeof nickname !== "string") {
            throw new TypeError("The companion nickname must be a string.");
        }
        const preferences = value.preferences ?? {};
        if (!isRecord(preferences)) {
            throw new TypeError("Companion preferences must be an object.");
        }
        const normalizedPreferences = {};
        Object.entries(DEFAULT_COMPANION_PREFERENCES).forEach(([key, fallback]) => {
            const enabled = preferences[key] ?? fallback;
            if (key === "speechBubbleFrequency") {
                if (!COMPANION_SPEECH_FREQUENCIES.has(enabled)) {
                    throw new TypeError(`Companion preference "${key}" must be quiet, balanced, or chatty.`);
                }
            } else if (typeof enabled !== "boolean") {
                throw new TypeError(`Companion preference "${key}" must be a boolean.`);
            }
            normalizedPreferences[key] = enabled;
        });
        return {
            nickname: nickname.trim().replace(/\s+/g, " ").slice(0, MAX_COMPANION_NICKNAME_LENGTH),
            preferences: normalizedPreferences,
        };
    }

    function createInitialCampaign() {
        return {
            schemaVersion: 1,
            activeMission: null,
            missionHistory: [],
            progression: normalizeProgression(),
            knowledge: { unlockedEntryIds: [] },
            companion: normalizeCompanion(),
        };
    }

    function normalizeCampaign(value) {
        if (value === null || value === undefined) return createInitialCampaign();
        if (!isRecord(value)) {
            throw new TypeError("Saved campaign state must be an object.");
        }
        if (Number.isInteger(value.schemaVersion) && value.schemaVersion > 1) {
            throw new RangeError(`Unsupported campaign schema version: ${value.schemaVersion}.`);
        }
        const activeMission = value.activeMission ?? null;
        if (activeMission !== null && !isRecord(activeMission)) {
            throw new TypeError("Saved active mission must be an object or null.");
        }
        if (value.missionHistory !== undefined && !Array.isArray(value.missionHistory)) {
            throw new TypeError("Saved mission history must be an array.");
        }
        const knowledge = value.knowledge ?? {};
        if (!isRecord(knowledge)) {
            throw new TypeError("Saved knowledge archive state must be an object.");
        }
        return {
            schemaVersion: 1,
            activeMission: clone(activeMission),
            missionHistory: clone(value.missionHistory || []),
            progression: normalizeProgression(value.progression),
            knowledge: {
                unlockedEntryIds: uniqueIds(knowledge.unlockedEntryIds, "unlockedEntryIds"),
            },
            companion: normalizeCompanion(value.companion),
        };
    }

    function loadCampaign() {
        try {
            return normalizeCampaign(window.BeyondEarthStorage.read(STORAGE_KEY));
        } catch (error) {
            recoveryError = error;
            console.error("Saved campaign data could not be restored. It has not been overwritten.", error);
            return createInitialCampaign();
        }
    }

    let campaign = loadCampaign();

    function notifyChange(domain) {
        document.dispatchEvent(new CustomEvent("beyond:statechange", {
            detail: { domain, state: getSnapshot() },
        }));
    }

    function getPersistentState() {
        return clone(campaign);
    }

    function updatePersistentState(update) {
        if (typeof update !== "function") {
            throw new TypeError("Campaign updates must be provided as a function.");
        }
        if (recoveryError) {
            throw new Error("Campaign changes are disabled because saved campaign data could not be restored.");
        }

        const draft = getPersistentState();
        const updated = update(draft);
        const nextCampaign = normalizeCampaign(updated === undefined ? draft : updated);
        window.BeyondEarthStorage.write(STORAGE_KEY, nextCampaign);
        campaign = nextCampaign;
        notifyChange("campaign");
        return getPersistentState();
    }

    function setCompanionNickname(value) {
        if (typeof value !== "string") {
            throw new TypeError("The companion nickname must be a string.");
        }
        const nickname = value.trim().replace(/\s+/g, " ");
        if (!nickname || nickname.length > MAX_COMPANION_NICKNAME_LENGTH) {
            throw new TypeError(`The companion nickname must be between 1 and ${MAX_COMPANION_NICKNAME_LENGTH} characters.`);
        }
        return updatePersistentState((draft) => {
            draft.companion.nickname = nickname;
        });
    }

    function setCompanionPreferences(value) {
        if (!isRecord(value)) {
            throw new TypeError("Companion preferences must be provided as an object.");
        }
        const preferences = { ...campaign.companion.preferences };
        Object.entries(value).forEach(([key, enabled]) => {
            if (!Object.prototype.hasOwnProperty.call(DEFAULT_COMPANION_PREFERENCES, key)) {
                throw new TypeError(`Unknown companion preference "${key}".`);
            }
            if (key === "speechBubbleFrequency") {
                if (!COMPANION_SPEECH_FREQUENCIES.has(enabled)) {
                    throw new TypeError(`Companion preference "${key}" must be quiet, balanced, or chatty.`);
                }
            } else if (typeof enabled !== "boolean") {
                throw new TypeError(`Companion preference "${key}" must be a boolean.`);
            }
            preferences[key] = enabled;
        });
        return updatePersistentState((draft) => {
            draft.companion.preferences = preferences;
        });
    }

    function setCurrentMinigame(value) {
        if (value !== null && !isRecord(value)) {
            throw new TypeError("The active minigame state must be an object or null.");
        }
        activeMinigame = clone(value);
        notifyChange("runtime");
    }

    function getSnapshot() {
        const player = window.BeyondEarthPlayer.getPersonnelFile();
        const activeMission = clone(campaign.activeMission);
        const audio = window.SpaceAudio?.getPreferences?.() || null;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        return {
            currentScene: activeScene || window.BeyondEarthScenes?.getCurrentScene?.() || null,
            currentPlayerProfile: player,
            selectedTheme: window.BeyondEarthTheme.getColorFamily(),
            activeMission,
            currentMissionStage: activeMission?.currentStage || null,
            missionConfiguration: activeMission
                ? {
                    destination: clone(activeMission.destination),
                    objectives: clone(activeMission.objectives),
                    spacecraft: clone(activeMission.spacecraft),
                    planning: clone(activeMission.planning),
                }
                : null,
            missionResources: activeMission ? clone(activeMission.resources) : null,
            currentMinigame: clone(activeMinigame),
            progression: {
                ...clone(campaign.progression),
                rank: player.rank,
            },
            completedMissions: clone(campaign.missionHistory),
            knowledgeArchive: clone(campaign.knowledge),
            preferences: {
                audio,
                accessibility: { reducedMotion },
            },
            persistence: {
                campaignAvailable: !recoveryError,
                error: recoveryError ? recoveryError.message : null,
            },
        };
    }

    document.addEventListener("beyond:scenechange", (event) => {
        activeScene = event.detail?.scene || null;
        notifyChange("runtime");
    });
    document.addEventListener("beyond:themechange", () => notifyChange("theme"));
    document.addEventListener("beyond:personnelupdated", () => notifyChange("profile"));

    window.BeyondEarthGameState = Object.freeze({
        getPersistentState,
        getSnapshot,
        setCompanionNickname,
        setCompanionPreferences,
        setCurrentMinigame,
        updatePersistentState,
    });
})();
