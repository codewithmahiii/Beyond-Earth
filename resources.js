(() => {
    "use strict";

    const RESOURCE_RULES = Object.freeze({
        budgetCredits: { minimum: 0 },
        massKg: { minimum: 0 },
        powerWh: { minimum: 0 },
        fuelKg: { minimum: 0 },
        dataStorageMb: { minimum: 0 },
        communicationsMarginDb: {},
        equipmentCondition: { minimum: 0, maximum: 1 },
    });

    function isRecord(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function validateChanges(changes) {
        if (!Array.isArray(changes)) {
            throw new TypeError("Resource changes must be an array.");
        }
        return changes.map((change) => {
            if (!isRecord(change)
                || !Object.prototype.hasOwnProperty.call(RESOURCE_RULES, change.resource)
                || !Number.isFinite(change.delta)
                || typeof change.reason !== "string"
                || !change.reason.trim()) {
                throw new TypeError("Each resource change needs a supported resource, finite delta, and reason.");
            }
            return {
                resource: change.resource,
                delta: change.delta,
                reason: change.reason.trim(),
            };
        });
    }

    function applyToMission(mission, changes, metadata = {}) {
        if (!isRecord(mission) || !isRecord(mission.resources) || !isRecord(mission.performance)) {
            throw new TypeError("Resource changes require a mission with resources and performance data.");
        }
        if (!isRecord(metadata)) {
            throw new TypeError("Resource change metadata must be an object.");
        }
        const normalized = validateChanges(changes);
        const resources = { ...mission.resources };
        const resourceChanges = [];
        const consumed = [];

        normalized.forEach((change) => {
            const current = resources[change.resource];
            if (!Number.isFinite(current)) {
                throw new TypeError(`Mission resource "${change.resource}" is not initialized.`);
            }
            const next = current + change.delta;
            const rule = RESOURCE_RULES[change.resource];
            if (Number.isFinite(rule.minimum) && next < rule.minimum) {
                throw new RangeError(`Resource "${change.resource}" cannot fall below ${rule.minimum}.`);
            }
            if (Number.isFinite(rule.maximum) && next > rule.maximum) {
                throw new RangeError(`Resource "${change.resource}" cannot exceed ${rule.maximum}.`);
            }

            resources[change.resource] = next;
            const entry = {
                resource: change.resource,
                delta: change.delta,
                before: current,
                after: next,
                reason: change.reason,
                source: typeof metadata.source === "string" ? metadata.source : "mission",
                sourceId: typeof metadata.sourceId === "string" ? metadata.sourceId : null,
                timestamp: new Date().toISOString(),
            };
            resourceChanges.push(entry);
            if (change.delta < 0) {
                consumed.push({
                    resource: change.resource,
                    amount: -change.delta,
                    reason: change.reason,
                    source: entry.source,
                    sourceId: entry.sourceId,
                    timestamp: entry.timestamp,
                });
            }
        });

        mission.resources = resources;
        mission.performance.resourceChanges = [
            ...(Array.isArray(mission.performance.resourceChanges)
                ? mission.performance.resourceChanges
                : []),
            ...resourceChanges,
        ];
        mission.performance.resourcesConsumed = [
            ...(Array.isArray(mission.performance.resourcesConsumed)
                ? mission.performance.resourcesConsumed
                : []),
            ...consumed,
        ];
        return resourceChanges;
    }

    function applyChanges(changes, metadata = {}) {
        return window.BeyondEarthMissionManager.updateActiveMission((mission) => {
            applyToMission(mission, changes, metadata);
            return mission;
        });
    }

    function getBalances() {
        const mission = window.BeyondEarthMissionManager.getActiveMission();
        return mission ? { ...mission.resources } : null;
    }

    window.BeyondEarthResources = Object.freeze({
        applyChanges,
        applyToMission,
        getBalances,
        resourceNames: Object.keys(RESOURCE_RULES),
    });
})();