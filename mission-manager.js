(() => {
    "use strict";

    const SCHEMA_VERSION = 1;
    const STATUSES = Object.freeze(["draft", "approved", "active", "paused", "completed", "failed", "cancelled"]);
    const TRANSITIONS = Object.freeze({
        draft: ["approved", "cancelled"],
        approved: ["active", "cancelled"],
        active: ["paused", "completed", "failed", "cancelled"],
        paused: ["active", "completed", "failed", "cancelled"],
        completed: [],
        failed: [],
        cancelled: [],
    });
    const DEFAULT_RESOURCES = Object.freeze({
        budgetCredits: 0,
        massKg: 0,
        powerWh: 0,
        fuelKg: 0,
        dataStorageMb: 0,
        communicationsMarginDb: 0,
        equipmentCondition: 1,
    });
    const DEFAULT_PERFORMANCE = Object.freeze({
        completedObjectives: [],
        minigameSequence: [],
        minigameResults: [],
        resourcesConsumed: [],
        resourceChanges: [],
        scientificData: [],
        outcome: null,
        finalScore: null,
        ending: null,
        evaluation: null,
        spacecraftConditionPercent: null,
        robotCondition: null,
        objectivesAchieved: [],
        objectivesMissed: [],
        systemsRequiringRepair: [],
        achievementsUnlocked: [],
    });
    const RESULT_STATUSES = new Set(["success", "partial", "failure", "aborted"]);

    function isRecord(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function createId(prefix) {
        if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
        const bytes = new Uint8Array(16);
        window.crypto?.getRandomValues?.(bytes);
        if (!bytes.some(Boolean)) bytes.forEach((_, index) => {
            bytes[index] = Math.floor(Math.random() * 256);
        });
        return `${prefix}-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
    }

    function normalizeMission(value) {
        if (!isRecord(value)) {
            throw new TypeError("Mission records must be objects.");
        }
        const mission = clone(value);
        if (typeof mission.id !== "string" || !mission.id.trim()) {
            throw new TypeError("Mission records require a unique ID.");
        }
        if (typeof mission.name !== "string" || !mission.name.trim()) {
            throw new TypeError("Mission records require a name.");
        }
        if (!STATUSES.includes(mission.status)) {
            throw new RangeError(`Unknown mission status: ${mission.status}.`);
        }
        if (typeof mission.createdAt !== "string" || Number.isNaN(Date.parse(mission.createdAt))) {
            throw new TypeError("Mission records require a valid creation timestamp.");
        }
        if (typeof mission.updatedAt === "string" && Number.isNaN(Date.parse(mission.updatedAt))) {
            throw new TypeError("Mission update timestamps must be valid dates.");
        }
        mission.schemaVersion = SCHEMA_VERSION;
        mission.name = mission.name.trim();
        mission.missionType = typeof mission.missionType === "string" ? mission.missionType : null;
        mission.currentStage = typeof mission.currentStage === "string" ? mission.currentStage : null;
        mission.updatedAt = typeof mission.updatedAt === "string" ? mission.updatedAt : mission.createdAt;
        mission.destination = isRecord(mission.destination) ? mission.destination : { id: null, environmentalConditions: {} };
        mission.objectives = isRecord(mission.objectives)
            ? mission.objectives
            : { primaryId: null, secondaryIds: [], requiredInstrumentIds: [], completionConditions: [] };
        mission.spacecraft = isRecord(mission.spacecraft)
            ? mission.spacecraft
            : {
                architectureId: null,
                propulsionSystemId: null,
                powerSystemId: null,
                communicationsSystemId: null,
                scientificInstrumentIds: [],
                thermalSystemId: null,
                navigationSystemId: null,
                componentIds: [],
            };
        mission.planning = isRecord(mission.planning)
            ? mission.planning
            : { launchConfiguration: null, trajectory: null, durationDays: null, operationalStages: [] };
        mission.destination.id ??= null;
        if (mission.destination.id !== null && typeof mission.destination.id !== "string") {
            throw new TypeError("Mission destination IDs must be strings or null.");
        }
        if (mission.destination.environmentalConditions !== undefined
            && !isRecord(mission.destination.environmentalConditions)) {
            throw new TypeError("Mission destination environmental conditions must be an object.");
        }
        if (mission.destination.environmentalConditions === undefined) {
            mission.destination.environmentalConditions = {};
        }
        mission.objectives.primaryId ??= null;
        if (mission.objectives.primaryId !== null && typeof mission.objectives.primaryId !== "string") {
            throw new TypeError("Mission primary objective IDs must be strings or null.");
        }
        ["secondaryIds", "requiredInstrumentIds", "completionConditions"].forEach((field) => {
            if (mission.objectives[field] === undefined) mission.objectives[field] = [];
            if (!Array.isArray(mission.objectives[field])
                || mission.objectives[field].some((id) => typeof id !== "string" || !id.trim())) {
                throw new TypeError(`Mission objective "${field}" must be an array of non-empty IDs.`);
            }
            mission.objectives[field] = [...new Set(mission.objectives[field])];
        });
        mission.spacecraft = {
            ...mission.spacecraft,
            ...window.BeyondEarthSpacecraft.normalizeLoadout(mission.spacecraft),
        };
        mission.planning.durationDays ??= null;
        if (mission.planning.durationDays !== null
            && (!Number.isFinite(mission.planning.durationDays) || mission.planning.durationDays < 0)) {
            throw new RangeError("Mission duration must be a non-negative number of days or null.");
        }
        if (mission.planning.operationalStages !== undefined
            && !Array.isArray(mission.planning.operationalStages)) {
            throw new TypeError("Mission operational stages must be an array.");
        }
        if (mission.planning.operationalStages === undefined) mission.planning.operationalStages = [];
        mission.resources = { ...DEFAULT_RESOURCES, ...(isRecord(mission.resources) ? mission.resources : {}) };
        Object.keys(DEFAULT_RESOURCES).forEach((resource) => {
            if (!Number.isFinite(mission.resources[resource])) {
                throw new TypeError(`Mission resource "${resource}" must be a finite number.`);
            }
            if (resource !== "communicationsMarginDb" && mission.resources[resource] < 0) {
                throw new RangeError(`Mission resource "${resource}" cannot be negative.`);
            }
            if (resource === "equipmentCondition" && mission.resources[resource] > 1) {
                throw new RangeError(`Mission resource "${resource}" cannot exceed one.`);
            }
        });
        mission.performance = { ...DEFAULT_PERFORMANCE, ...(isRecord(mission.performance) ? mission.performance : {}) };
        [
            "completedObjectives",
            "minigameSequence",
            "minigameResults",
            "resourcesConsumed",
            "resourceChanges",
            "scientificData",
            "objectivesAchieved",
            "objectivesMissed",
            "systemsRequiringRepair",
            "achievementsUnlocked",
        ].forEach((field) => {
            if (!Array.isArray(mission.performance[field])) {
                throw new TypeError(`Mission performance "${field}" must be an array.`);
            }
        });
        if (mission.performance.ending !== null
            && !["perfect", "damaged", "lost"].includes(mission.performance.ending)) {
            throw new RangeError("Mission endings must be perfect, damaged, lost, or null.");
        }
        if (mission.performance.spacecraftConditionPercent !== null
            && (!Number.isFinite(mission.performance.spacecraftConditionPercent)
                || mission.performance.spacecraftConditionPercent < 0
                || mission.performance.spacecraftConditionPercent > 100)) {
            throw new RangeError("Spacecraft condition must be a percentage from zero to one hundred or null.");
        }
        if (mission.performance.robotCondition !== null
            && typeof mission.performance.robotCondition !== "string") {
            throw new TypeError("Robot condition must be a string or null.");
        }
        if (mission.performance.minigameSequence.some((id) => typeof id !== "string" || !id.trim())
            || new Set(mission.performance.minigameSequence).size !== mission.performance.minigameSequence.length) {
            throw new TypeError("Mission minigame sequences must contain unique, non-empty IDs.");
        }
        if (mission.performance.finalScore !== null
            && (!Number.isFinite(mission.performance.finalScore) || mission.performance.finalScore < 0)) {
            throw new RangeError("Mission final scores must be non-negative finite numbers or null.");
        }
        if (mission.performance.experienceAward !== undefined
            && (!Number.isSafeInteger(mission.performance.experienceAward) || mission.performance.experienceAward < 0)) {
            throw new RangeError("Mission experience awards must be non-negative integers.");
        }
        return mission;
    }

    function createMission(options = {}) {
        if (!isRecord(options)) {
            throw new TypeError("Mission creation options must be an object.");
        }
        const now = new Date().toISOString();
        return normalizeMission({
            schemaVersion: SCHEMA_VERSION,
            id: createId("mission"),
            name: typeof options.name === "string" && options.name.trim()
                ? options.name.trim()
                : "Untitled Mission",
            missionType: typeof options.missionType === "string" ? options.missionType : null,
            createdAt: now,
            updatedAt: now,
            status: "draft",
            currentStage: null,
            destination: { id: null, environmentalConditions: {} },
            objectives: {
                primaryId: null,
                secondaryIds: [],
                requiredInstrumentIds: [],
                completionConditions: [],
            },
            spacecraft: {
                architectureId: null,
                propulsionSystemId: null,
                powerSystemId: null,
                communicationsSystemId: null,
                scientificInstrumentIds: [],
                thermalSystemId: null,
                navigationSystemId: null,
                componentIds: [],
            },
            planning: {
                launchConfiguration: null,
                trajectory: null,
                durationDays: null,
                operationalStages: [],
            },
            resources: { ...DEFAULT_RESOURCES },
            performance: { ...DEFAULT_PERFORMANCE },
        });
    }

    function getActiveMission() {
        const mission = window.BeyondEarthGameState.getPersistentState().activeMission;
        return mission ? normalizeMission(mission) : null;
    }

    function getMissionHistory() {
        return window.BeyondEarthGameState.getPersistentState().missionHistory.map(normalizeMission);
    }

    function getMission(id) {
        if (typeof id !== "string" || !id) throw new TypeError("Mission lookup requires an ID.");
        const active = getActiveMission();
        if (active?.id === id) return active;
        return getMissionHistory().find((mission) => mission.id === id) || null;
    }

    function saveMission(value) {
        const mission = normalizeMission(value);
        if (["completed", "failed", "cancelled"].includes(mission.status)) {
            throw new Error("Terminal missions belong in mission history and cannot be saved as active.");
        }
        window.BeyondEarthGameState.updatePersistentState((campaign) => {
            const active = campaign.activeMission
                ? normalizeMission(campaign.activeMission)
                : null;
            if (active && active.id !== mission.id) {
                throw new Error("Finish or cancel the active mission before saving another one.");
            }
            if (!active && mission.status !== "draft") {
                throw new Error("A new mission must be saved as a draft.");
            }
            if (active && active.status !== mission.status) {
                throw new Error("Mission status changes must use the mission transition API.");
            }
            if (campaign.missionHistory.some((record) => record.id === mission.id)) {
                throw new Error(`Mission ID "${mission.id}" already exists in mission history.`);
            }
            campaign.activeMission = mission;
        });
        return clone(mission);
    }

    function updateActiveMissionInternal(update, allowStatusChange = false) {
        if (typeof update !== "function") {
            throw new TypeError("Mission updates must be provided as a function.");
        }
        let updatedMission = null;
        window.BeyondEarthGameState.updatePersistentState((campaign) => {
            if (!campaign.activeMission) throw new Error("There is no active mission to update.");
            const current = normalizeMission(campaign.activeMission);
            const draft = clone(current);
            const result = update(draft);
            updatedMission = normalizeMission(result === undefined ? draft : result);
            if (updatedMission.id !== current.id) {
                throw new Error("An active mission's ID cannot be changed.");
            }
            if (!allowStatusChange && updatedMission.status !== current.status) {
                throw new Error("Mission status changes must use the mission transition API.");
            }
            updatedMission.updatedAt = new Date().toISOString();
            campaign.activeMission = updatedMission;
        });
        return clone(updatedMission);
    }

    function updateActiveMission(update) {
        return updateActiveMissionInternal(update);
    }

    function transitionStatus(nextStatus) {
        return updateActiveMissionInternal((mission) => {
            if (!STATUSES.includes(nextStatus)) {
                throw new RangeError(`Unknown mission status: ${nextStatus}.`);
            }
            if (["approved", "completed", "failed", "cancelled"].includes(nextStatus)) {
                throw new Error(`Use the dedicated mission operation to set "${nextStatus}".`);
            }
            if (!TRANSITIONS[mission.status].includes(nextStatus)) {
                throw new Error(`Mission status cannot transition from "${mission.status}" to "${nextStatus}".`);
            }
            const minigame = window.BeyondEarthMinigames?.getActive?.();
            if (nextStatus === "paused" && minigame?.missionId === mission.id && minigame.status === "running") {
                throw new Error("Pause the active minigame before pausing its mission.");
            }
            mission.status = nextStatus;
        }, true);
    }

    function approveMission() {
        const approvedMission = updateActiveMissionInternal((mission) => {
            if (mission.status !== "draft") {
                throw new Error("Only draft missions can be approved.");
            }
            const destinationId = mission.destination.id;
            const objectiveIds = [
                mission.objectives.primaryId,
                ...mission.objectives.secondaryIds,
            ].filter(Boolean);
            if (typeof destinationId !== "string" || !objectiveIds.length) {
                throw new Error("Mission approval requires a destination and at least one scientific objective.");
            }
            const compatibility = window.BeyondEarthCompatibility.evaluateDesign({
                destinationId,
                objectiveIds,
                spacecraft: mission.spacecraft,
            });
            if (compatibility.status !== "suitable") {
                const issueCodes = compatibility.issues.map((issue) => issue.code).join(", ");
                throw new Error(`Mission design is not ready for approval: ${issueCodes}.`);
            }
            mission.status = "approved";
            mission.approval = {
                approvedAt: new Date().toISOString(),
                compatibilityStatus: compatibility.status,
                metrics: compatibility.metrics,
            };
        }, true);
        document.dispatchEvent(new CustomEvent("beyond:missionapproved", {
            detail: { mission: clone(approvedMission) },
        }));
        return approvedMission;
    }

    function setCurrentStage(stageId) {
        if (stageId !== null && (typeof stageId !== "string" || !stageId.trim())) {
            throw new TypeError("Mission stage IDs must be non-empty strings or null.");
        }
        return updateActiveMission((mission) => {
            mission.currentStage = stageId ? stageId.trim() : null;
        });
    }

    function normalizeResult(result) {
        if (!isRecord(result)
            || typeof result.id !== "string"
            || !result.id.trim()
            || typeof result.minigameId !== "string"
            || !result.minigameId.trim()
            || !RESULT_STATUSES.has(result.status)) {
            throw new TypeError("Minigame results require an ID, minigame ID, and valid completion status.");
        }
        const score = result.score ?? null;
        const rating = result.performanceRating ?? null;
        const timeTakenMs = result.timeTakenMs ?? 0;
        const attempts = result.attempts ?? 1;
        if (score !== null && (!Number.isFinite(score) || score < 0)) {
            throw new RangeError("Minigame scores must be non-negative finite numbers or null.");
        }
        if (rating !== null && (!Number.isFinite(rating) || rating < 0 || rating > 1)) {
            throw new RangeError("Minigame performance ratings must be between zero and one or null.");
        }
        const normalizedPercentage = result.normalizedPercentage === undefined
            ? (rating === null ? null : Math.round(rating * 100))
            : result.normalizedPercentage;
        if (normalizedPercentage !== null
            && (!Number.isFinite(normalizedPercentage) || normalizedPercentage < 0 || normalizedPercentage > 100)) {
            throw new RangeError("Minigame normalized percentages must be between zero and one hundred or null.");
        }
        if (!Number.isFinite(timeTakenMs) || timeTakenMs < 0 || !Number.isSafeInteger(attempts) || attempts < 1) {
            throw new RangeError("Minigame time and attempt counts are invalid.");
        }
        const stringArray = (field) => {
            const items = result[field] ?? [];
            if (!Array.isArray(items) || items.some((item) => typeof item !== "string" || !item.trim())) {
                throw new TypeError(`Minigame result "${field}" must be an array of IDs.`);
            }
            return [...new Set(items)];
        };
        if (!Array.isArray(result.resourcesAffected ?? [])
            || !Array.isArray(result.scientificData ?? [])) {
            throw new TypeError("Minigame resource changes and scientific data must be arrays.");
        }
        if (typeof result.missionId !== "string" || !result.missionId.trim()) {
            throw new TypeError("Minigame results must identify their source mission.");
        }
        const completedAt = typeof result.completedAt === "string" ? result.completedAt : new Date().toISOString();
        if (Number.isNaN(Date.parse(completedAt))) {
            throw new TypeError("Minigame result timestamps must be valid dates.");
        }
        return {
            id: result.id.trim(),
            minigameId: result.minigameId.trim(),
            minigameName: typeof result.minigameName === "string" && result.minigameName.trim()
                ? result.minigameName.trim()
                : result.minigameId.trim(),
            missionId: result.missionId.trim(),
            status: result.status,
            score,
            performanceRating: rating,
            normalizedPercentage,
            timeTakenMs,
            attempts,
            resourcesAffected: clone(result.resourcesAffected ?? []),
            mistakes: Array.isArray(result.mistakes) ? clone(result.mistakes) : [],
            objectivesCompleted: stringArray("objectivesCompleted"),
            knowledgeUnlocks: stringArray("knowledgeUnlocks"),
            scientificData: clone(result.scientificData ?? []),
            explanation: typeof result.explanation === "string" ? result.explanation : "",
            completedAt,
        };
    }

    function recordMinigameResult(value) {
        const result = normalizeResult(value);
        window.BeyondEarthKnowledge.validateUnlocks(result.knowledgeUnlocks);
        let newlyUnlocked = [];
        window.BeyondEarthGameState.updatePersistentState((campaign) => {
            if (!campaign.activeMission || campaign.activeMission.id !== result.missionId) {
                throw new Error("Minigame results must match the current active mission.");
            }
            const mission = normalizeMission(campaign.activeMission);
            if (mission.status !== "active") {
                throw new Error("Minigame results can only be recorded during an active mission.");
            }
            if (mission.performance.minigameResults.some((record) => record.id === result.id)) {
                throw new Error(`Minigame result "${result.id}" has already been recorded.`);
            }
            window.BeyondEarthResources.applyToMission(
                mission,
                result.resourcesAffected,
                { source: "minigame", sourceId: result.minigameId }
            );
            mission.performance.minigameResults.push(result);
            mission.performance.completedObjectives = [
                ...new Set([...mission.performance.completedObjectives, ...result.objectivesCompleted]),
            ];
            mission.performance.scientificData.push(...result.scientificData);
            mission.updatedAt = new Date().toISOString();
            campaign.activeMission = mission;
            const existing = new Set(campaign.knowledge.unlockedEntryIds);
            newlyUnlocked = result.knowledgeUnlocks.filter((id) => !existing.has(id));
            campaign.knowledge.unlockedEntryIds = [
                ...existing,
                ...newlyUnlocked,
            ];
        });
        newlyUnlocked.forEach((id) => {
            document.dispatchEvent(new CustomEvent("beyond:knowledgeunlocked", {
                detail: { entry: window.BeyondEarthKnowledge.getEntry(id) },
            }));
        });
        return clone(result);
    }

    function evaluateMissionPerformance(results) {
        if (!Array.isArray(results) || !results.length) {
            throw new TypeError("Mission performance requires at least one completed minigame result.");
        }
        const challengePercentages = results.map((result) => {
            if (!isRecord(result)) throw new TypeError("Mission performance results must be objects.");
            const percentage = result.normalizedPercentage
                ?? (Number.isFinite(result.performanceRating) ? result.performanceRating * 100 : null);
            if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
                throw new RangeError("Every completed minigame must have a normalized percentage from zero to one hundred.");
            }
            return Math.round(percentage);
        });
        const finalScore = Math.round(challengePercentages.reduce((sum, value) => sum + value, 0) / challengePercentages.length);
        const criticalFailureCount = results.filter((result, index) =>
            challengePercentages[index] < 45 || result.status === "failure"
        ).length;
        const ending = criticalFailureCount >= 2
            ? "lost"
            : finalScore >= 80 && criticalFailureCount === 0
                ? "perfect"
                : finalScore >= 45
                    ? "damaged"
                    : "lost";
        return {
            finalScore,
            ending,
            criticalFailureCount,
            outcome: ending === "perfect" ? "successful_return" : ending === "damaged" ? "damaged_return" : "mission_failure",
            challengePercentages,
        };
    }

    function completeMission(performance = {}) {
        if (!isRecord(performance)) {
            throw new TypeError("Mission performance summaries must be objects.");
        }
        let completed = null;
        let earnedAchievements = [];
        window.BeyondEarthGameState.updatePersistentState((campaign) => {
            if (!campaign.activeMission) throw new Error("There is no active mission to complete.");
            const mission = normalizeMission(campaign.activeMission);
            if (window.BeyondEarthMinigames?.getActive?.()?.missionId === mission.id) {
                throw new Error("Finish or dispose the active minigame before completing its mission.");
            }
            if (!TRANSITIONS[mission.status].includes("completed")) {
                throw new Error(`Mission "${mission.id}" cannot be completed from status "${mission.status}".`);
            }
            mission.status = "completed";
            mission.performance = { ...mission.performance, ...clone(performance) };
            mission.updatedAt = new Date().toISOString();
            completed = normalizeMission(mission);
            campaign.missionHistory = [completed, ...campaign.missionHistory];
            campaign.activeMission = null;
            campaign.progression.completedMissionIds = [
                ...new Set([...campaign.progression.completedMissionIds, completed.id]),
            ];
            earnedAchievements = window.BeyondEarthAchievements.applyMissionCompletion(campaign, completed);
            completed.performance.achievementsUnlocked = earnedAchievements.slice();
            campaign.missionHistory[0] = completed;
        });
        document.dispatchEvent(new CustomEvent("beyond:missioncompleted", {
            detail: { mission: clone(completed) },
        }));
        window.BeyondEarthAchievements.announceMissionCompletion(completed, earnedAchievements);
        return clone(completed);
    }

    function closeMission(status = "cancelled", performance = {}) {
        if (!["failed", "cancelled"].includes(status)) {
            throw new RangeError("Closed missions must be marked failed or cancelled.");
        }
        if (!isRecord(performance)) {
            throw new TypeError("Mission closing summaries must be objects.");
        }
        let closed = null;
        window.BeyondEarthGameState.updatePersistentState((campaign) => {
            if (!campaign.activeMission) throw new Error("There is no active mission to close.");
            const mission = normalizeMission(campaign.activeMission);
            if (window.BeyondEarthMinigames?.getActive?.()?.missionId === mission.id) {
                throw new Error("Finish or dispose the active minigame before closing its mission.");
            }
            if (!TRANSITIONS[mission.status].includes(status)) {
                throw new Error(`Mission "${mission.id}" cannot be closed from status "${mission.status}".`);
            }
            mission.status = status;
            mission.performance = { ...mission.performance, ...clone(performance) };
            mission.updatedAt = new Date().toISOString();
            closed = normalizeMission(mission);
            campaign.missionHistory = [closed, ...campaign.missionHistory];
            campaign.activeMission = null;
        });
        document.dispatchEvent(new CustomEvent("beyond:missionclosed", {
            detail: { mission: clone(closed) },
        }));
        return clone(closed);
    }

    window.BeyondEarthMissionManager = Object.freeze({
        approveMission,
        closeMission,
        completeMission,
        createMission,
        getActiveMission,
        getMission,
        getMissionHistory,
        recordMinigameResult,
        evaluateMissionPerformance,
        saveMission,
        setCurrentStage,
        transitionStatus,
        updateActiveMission,
    });
})();