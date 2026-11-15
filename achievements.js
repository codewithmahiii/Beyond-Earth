(() => {
    "use strict";

    const definitions = new Map();

    function isRecord(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function register(definition) {
        if (!isRecord(definition)
            || typeof definition.id !== "string"
            || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(definition.id)
            || typeof definition.title !== "string"
            || !definition.title.trim()
            || typeof definition.description !== "string"
            || !definition.description.trim()
            || typeof definition.evaluate !== "function") {
            throw new TypeError("Achievements require a kebab-case ID, title, description, and evaluator.");
        }
        if (definitions.has(definition.id)) {
            throw new Error(`Achievement "${definition.id}" is already registered.`);
        }
        const normalized = {
            id: definition.id,
            title: definition.title.trim(),
            description: definition.description.trim(),
            evaluate: definition.evaluate,
        };
        definitions.set(normalized.id, normalized);
        return { id: normalized.id, title: normalized.title, description: normalized.description };
    }

    function applyMissionCompletion(campaign, mission) {
        if (!isRecord(mission) || mission.status !== "completed" || typeof mission.id !== "string") {
            throw new TypeError("Progression can only record a completed mission.");
        }
        if (!isRecord(campaign) || !isRecord(campaign.progression) || !Array.isArray(campaign.missionHistory)) {
            throw new TypeError("Mission progression requires a campaign draft.");
        }
        if (!campaign.missionHistory.some((item) => item.id === mission.id)) {
            throw new Error(`Completed mission "${mission.id}" is not present in mission history.`);
        }
        if (campaign.progression.recordedMissionIds.includes(mission.id)) return [];

        const state = window.BeyondEarthGameState.getSnapshot();
        state.activeMission = campaign.activeMission;
        state.completedMissions = clone(campaign.missionHistory);
        state.progression = { ...clone(campaign.progression), rank: state.progression.rank };
        const newlyEarned = [];
        definitions.forEach((definition) => {
            if (campaign.progression.achievements.includes(definition.id)) return;
            const eligible = definition.evaluate({
                mission: clone(mission),
                state: clone(state),
            });
            if (typeof eligible !== "boolean") {
                throw new TypeError(`Achievement "${definition.id}" evaluator must return a boolean.`);
            }
            if (eligible) newlyEarned.push(definition.id);
        });

        const award = mission.performance?.experienceAward ?? 0;
        if (!Number.isSafeInteger(award) || award < 0) {
            throw new RangeError("Mission experience awards must be non-negative integers.");
        }
        campaign.progression.recordedMissionIds.push(mission.id);
        campaign.progression.achievements = [
            ...new Set([...campaign.progression.achievements, ...newlyEarned]),
        ];
        if (award > 0) {
            campaign.progression.experiencePoints += award;
            campaign.progression.experienceEvents.push({
                id: `mission-${mission.id}`,
                missionId: mission.id,
                amount: award,
                reason: "Mission performance award",
                timestamp: new Date().toISOString(),
            });
        }
        return newlyEarned;
    }

    function announceMissionCompletion(mission, newlyEarned) {
        newlyEarned.forEach((id) => {
            const achievement = definitions.get(id);
            if (!achievement) throw new Error(`Achievement "${id}" is not registered.`);
            document.dispatchEvent(new CustomEvent("beyond:achievementunlocked", {
                detail: {
                    id,
                    title: achievement.title,
                    description: achievement.description,
                    missionId: mission.id,
                },
            }));
            window.SpaceAudio?.playSFX?.("achievement");
        });
    }

    function recordMissionCompletion(mission) {
        let newlyEarned = [];
        window.BeyondEarthGameState.updatePersistentState((campaign) => {
            newlyEarned = applyMissionCompletion(campaign, mission);
        });
        announceMissionCompletion(mission, newlyEarned);
        return newlyEarned.map((id) => {
            const { title, description } = definitions.get(id);
            return { id, title, description };
        });
    }

    function recordResearchProgress({ topicId, missionId, amount, unit, reason } = {}) {
        if (typeof topicId !== "string"
            || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topicId)
            || typeof missionId !== "string"
            || !Number.isFinite(amount)
            || amount <= 0
            || typeof unit !== "string"
            || !unit.trim()
            || typeof reason !== "string"
            || !reason.trim()) {
            throw new TypeError("Research progress requires a topic, source mission, positive amount, unit, and reason.");
        }
        const campaign = window.BeyondEarthGameState.getPersistentState();
        const missionExists = campaign.activeMission?.id === missionId
            || campaign.missionHistory.some((mission) => mission.id === missionId);
        if (!missionExists) {
            throw new Error("Research progress must be attributed to an active or completed mission.");
        }
        window.BeyondEarthGameState.updatePersistentState((draft) => {
            const current = draft.progression.researchProgress[topicId];
            if (current && current.unit !== unit) {
                throw new Error(`Research topic "${topicId}" already uses unit "${current.unit}".`);
            }
            draft.progression.researchProgress[topicId] = {
                amount: (current?.amount || 0) + amount,
                unit: unit.trim(),
                missionIds: [...new Set([...(current?.missionIds || []), missionId])],
                records: [
                    ...(current?.records || []),
                    { missionId, amount, reason: reason.trim(), timestamp: new Date().toISOString() },
                ],
            };
        });
        return clone(window.BeyondEarthGameState.getPersistentState().progression.researchProgress[topicId]);
    }

    function getProgression() {
        const state = window.BeyondEarthGameState.getSnapshot();
        return {
            ...state.progression,
            achievements: state.progression.achievements.map((id) => ({
                id,
                ...(definitions.has(id)
                    ? {
                        title: definitions.get(id).title,
                        description: definitions.get(id).description,
                    }
                    : {}),
            })),
        };
    }


    window.BeyondEarthAchievements = Object.freeze({
        applyMissionCompletion,
        announceMissionCompletion,
        getProgression,
        recordMissionCompletion,
        recordResearchProgress,
        register,
    });
})();