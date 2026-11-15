(() => {
    "use strict";

    function isRecord(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function toIdList(value) {
        if (!Array.isArray(value)) return [];
        return value.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim());
    }

    function getMissionRecord(mission) {
        if (isRecord(mission)) return clone(mission);
        const missionManager = window.BeyondEarthMissionManager;
        if (missionManager && typeof missionManager.getActiveMission === "function") {
            const active = missionManager.getActiveMission();
            if (active) return clone(active);
        }
        return null;
    }

    function getDestinationInfo(destinationId) {
        if (!destinationId) return null;
        const catalogs = window.BeyondEarthCatalogs;
        if (!catalogs || typeof catalogs.get !== "function") return null;
        return catalogs.get("destinations", destinationId) || null;
    }

    function getObjectiveInfo(objectiveIds) {
        const catalogs = window.BeyondEarthCatalogs;
        if (!catalogs || typeof catalogs.get !== "function") return [];
        return objectiveIds.map((id) => catalogs.get("objectives", id)).filter(Boolean);
    }

    function scoreDifficulty(mission, objectiveList, destination) {
        const base = 1 + objectiveList.length + (destination?.risk || 0) * 2;
        const architecture = mission?.spacecraft?.architectureId
            ? (window.BeyondEarthCatalogs?.get?.("architectures", mission.spacecraft.architectureId) || null)
            : null;
        return Math.min(10, Math.max(1, Math.round(base + (architecture ? 1 : 0))));
    }

    function buildActivityTemplates(objectiveList, architectureId) {
        const templates = {
            "surface-exploration": [
                { id: "terrain-navigation", name: "Terrain Navigation", category: "mobility", required: true, difficulty: 2, conditions: ["vehicle steering", "hazard mapping"] },
                { id: "surface-scan", name: "Surface Survey", category: "science", required: true, difficulty: 3, conditions: ["camera calibration", "terrain annotation"] },
                { id: "waypoint-ops", name: "Waypoint Operations", category: "operations", required: false, difficulty: 2, conditions: ["route refinement", "power management"] },
            ],
            "geological-investigation": [
                { id: "rock-analysis", name: "Rock Analysis", category: "science", required: true, difficulty: 3, conditions: ["sample handling", "spectral scan"] },
                { id: "geology-mapping", name: "Geology Mapping", category: "science", required: true, difficulty: 3, conditions: ["layer identification", "surface marking"] },
                { id: "sample-storage", name: "Sample Storage", category: "operations", required: false, difficulty: 2, conditions: ["seal check", "inventory control"] },
            ],
            "atmospheric-analysis": [
                { id: "atmospheric-sampling", name: "Atmospheric Sampling", category: "science", required: true, difficulty: 4, conditions: ["sensor calibration", "gas detection"] },
                { id: "weather-model", name: "Weather Model Update", category: "analysis", required: true, difficulty: 3, conditions: ["wind profile", "temperature inversion"] },
                { id: "downlink-window", name: "Communications Window", category: "operations", required: false, difficulty: 2, conditions: ["data transfer", "relay handoff"] },
            ],
            "water-ice-detection": [
                { id: "ice-scan", name: "Ice Signature Scan", category: "science", required: true, difficulty: 3, conditions: ["radar readout", "thermal contrast"] },
                { id: "plume-analysis", name: "Plume or Subsurface Analysis", category: "science", required: true, difficulty: 4, conditions: ["volatiles detection", "crust mapping"] },
                { id: "thermal-pass", name: "Thermal Pass", category: "operations", required: false, difficulty: 2, conditions: ["thermal drift correction", "sensor rebalancing"] },
            ],
            "sample-collection": [
                { id: "sample-acquisition", name: "Sample Acquisition", category: "science", required: true, difficulty: 4, conditions: ["contact stability", "collection tool validation"] },
                { id: "sample-archive", name: "Sample Archive", category: "operations", required: true, difficulty: 3, conditions: ["container seal", "sample ID logging"] },
                { id: "return-trajectory", name: "Return Trajectory", category: "navigation", required: architectureId === "sample-return", difficulty: 5, conditions: ["launch window", "re-entry plan"] },
            ],
            "orbital-observation": [
                { id: "orbit-align", name: "Orbit Alignment", category: "navigation", required: true, difficulty: 3, conditions: ["precision vectoring", "pass timing"] },
                { id: "image-planning", name: "Image Planning", category: "science", required: true, difficulty: 3, conditions: ["target framing", "coverage selection"] },
                { id: "data-downlink", name: "Data Downlink", category: "communications", required: false, difficulty: 2, conditions: ["signal lock", "buffering"] },
            ],
            "radiation-measurement": [
                { id: "sensor-calibration", name: "Sensor Calibration", category: "science", required: true, difficulty: 3, conditions: ["radiation baseline", "detector check"] },
                { id: "shielding-check", name: "Shielding Check", category: "operations", required: true, difficulty: 2, conditions: ["dose model", "power balancing"] },
                { id: "forecast-update", name: "Forecast Update", category: "analysis", required: false, difficulty: 2, conditions: ["flux estimate", "event alert"] },
            ],
            "space-weather-monitoring": [
                { id: "solar-watch", name: "Solar Watch", category: "science", required: true, difficulty: 4, conditions: ["solar flare tracking", "magnetometer sweep"] },
                { id: "flux-model", name: "Flux Model Review", category: "analysis", required: true, difficulty: 3, conditions: ["storm index", "system response"] },
                { id: "warning-downtime", name: "Warning Window", category: "communications", required: false, difficulty: 2, conditions: ["telemetry routing", "relay handoff"] },
            ],
            "magnetic-field-investigation": [
                { id: "magnetometer-pass", name: "Magnetometer Sweep", category: "science", required: true, difficulty: 3, conditions: ["field calibration", "vector sampling"] },
                { id: "plasma-trace", name: "Plasma Trace Capture", category: "science", required: true, difficulty: 3, conditions: ["particle count", "magnetic anomaly tracking"] },
                { id: "field-model", name: "Field Model Update", category: "analysis", required: false, difficulty: 2, conditions: ["combined survey review", "local orbital correction"] },
            ],
        };

        const activities = [];
        objectiveList.forEach((objective) => {
            const objectiveId = objective?.id;
            const list = objectiveId && templates[objectiveId] ? templates[objectiveId] : [];
            list.forEach((activity) => activities.push(clone(activity)));
        });
        return activities;
    }

    function buildMissionPlan(mission = null) {
        const source = getMissionRecord(mission);
        if (!source) {
            throw new Error("A mission definition is required to generate a mission plan.");
        }

        const objectiveIds = toIdList([
            source.objectives?.primaryId,
            ...(source.objectives?.secondaryIds || []),
        ]);
        const objectiveList = getObjectiveInfo(objectiveIds);
        const destination = getDestinationInfo(source.destination?.id);
        const difficulty = scoreDifficulty(source, objectiveList, destination);
        const activities = buildActivityTemplates(objectiveList, source.spacecraft?.architectureId || null);

        const required = activities.filter((activity) => activity.required === true);
        const optional = activities.filter((activity) => activity.required !== true);
        const ordered = [];
        const seen = new Set();

        [...required, ...optional].forEach((activity) => {
            if (seen.has(activity.id)) return;
            seen.add(activity.id);
            ordered.push({
                id: activity.id,
                name: activity.name,
                category: activity.category,
                required: Boolean(activity.required),
                difficulty: activity.difficulty,
                conditions: [...(activity.conditions || [])],
            });
        });

        const plan = {
            id: `mission-plan-${source.id}`,
            missionId: source.id,
            name: source.name,
            destinationId: source.destination?.id || null,
            destination: destination ? clone(destination) : null,
            objectiveIds,
            objectives: objectiveList.map((entry) => clone(entry)),
            architectureId: source.spacecraft?.architectureId || null,
            requiredMinigames: required.map((activity) => ({
                id: activity.id,
                name: activity.name,
                category: activity.category,
                difficulty: activity.difficulty,
                required: true,
                conditions: [...(activity.conditions || [])],
            })),
            optionalMinigames: optional.map((activity) => ({
                id: activity.id,
                name: activity.name,
                category: activity.category,
                difficulty: activity.difficulty,
                required: false,
                conditions: [...(activity.conditions || [])],
            })),
            activities: ordered,
            orderedActivities: ordered.map(({ id }) => id),
            sequence: ordered.map(({ id }) => id),
            difficulty,
            riskLevel: destination?.risk >= 0.7 ? "high" : destination?.risk >= 0.4 ? "moderate" : "low",
            resourceConstraints: {
                payloadMassKg: source.resources?.massKg || 0,
                powerWh: source.resources?.powerWh || 0,
                budgetCredits: source.resources?.budgetCredits || 0,
                missionDurationDays: source.planning?.durationDays || null,
            },
            environmentalConditions: clone(destination?.environmentalConditions || {}),
            summary: `${source.name} will combine ${objectiveIds.length} scientific objective(s) with a ${source.spacecraft?.architectureId || "custom"} architecture for ${destination?.name || "an unselected destination"}.`,
            successConditions: [
                "Required mission phases complete",
                "All primary objectives validated",
                "Critical resource thresholds maintained",
            ],
            warnings: destination && destination.risk > 0.6 ? ["High-risk destination requires stricter contingency planning."] : [],
        };

        plan.required = plan.requiredMinigames;
        plan.optional = plan.optionalMinigames;
        plan.steps = ordered;
        plan.activitiesByStage = {
            required: plan.requiredMinigames,
            optional: plan.optionalMinigames,
        };
        return plan;
    }

    function generateMission(mission = null) {
        return buildMissionPlan(mission);
    }

    function generateForMission(mission = null) {
        return buildMissionPlan(mission);
    }

    function generate(mission = null) {
        return buildMissionPlan(mission);
    }

    function getRecommendedMinigames(mission = null) {
        return buildMissionPlan(mission).activities;
    }

    const generator = Object.freeze({
        buildMissionPlan,
        generate,
        generateForMission,
        generateMission,
        getRecommendedMinigames,
    });

    window.BeyondEarthMissionGenerator = generator;
    window.BeyondEarthMissionPlanner = generator;
})();
