(() => {
    "use strict";

    function isRecord(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function addIssue(issues, severity, code, message, details = {}) {
        issues.push({ severity, code, message, ...details });
    }

    function checkCommunications(objective, communications, issues) {
        const requirements = objective.communicationRequirements;
        if (!isRecord(requirements)) return;
        if (!communications) {
            addIssue(issues, "hard", "communications-missing",
                `Objective "${objective.name}" requires communications equipment.`);
            return;
        }
        if (Array.isArray(requirements.requiredBands)) {
            const supported = Array.isArray(communications.supportedBands)
                ? communications.supportedBands
                : [];
            requirements.requiredBands.forEach((band) => {
                if (!supported.includes(band)) {
                    addIssue(issues, "hard", "communications-band-unsupported",
                        `The communications system does not support required band "${band}".`);
                }
            });
        }
        if (Number.isFinite(requirements.minDataRateMbps)) {
            if (!Number.isFinite(communications.dataRateMbps)) {
                addIssue(issues, "warning", "communications-data-rate-unknown",
                    "Communications data rate is not specified.");
            } else if (communications.dataRateMbps < requirements.minDataRateMbps) {
                addIssue(issues, "hard", "communications-data-rate-insufficient",
                    "Communications data rate is below the objective requirement.");
            }
        }
        if (requirements.relayRequired === true && communications.relayCapable !== true) {
            addIssue(issues, "hard", "relay-capability-missing",
                "The objective requires a relay-capable communications system.");
        }
    }

    function evaluateDesign(configuration = {}) {
        if (!isRecord(configuration)) {
            throw new TypeError("Design compatibility checks require a configuration object.");
        }
        const issues = [];
        const destinationId = configuration.destinationId ?? null;
        const objectiveIds = configuration.objectiveIds ?? [];
        if (destinationId !== null && typeof destinationId !== "string") {
            throw new TypeError("Destination IDs must be strings or null.");
        }
        if (!Array.isArray(objectiveIds) || objectiveIds.some((id) => typeof id !== "string")) {
            throw new TypeError("Objective IDs must be an array of strings.");
        }

        const destination = destinationId
            ? window.BeyondEarthCatalogs.get("destinations", destinationId)
            : null;
        if (!destinationId) {
            addIssue(issues, "warning", "destination-unselected", "No destination has been selected.");
        } else if (!destination) {
            addIssue(issues, "hard", "destination-unknown", `Destination "${destinationId}" is not in the catalogue.`);
        }

        if (!objectiveIds.length) {
            addIssue(issues, "warning", "objectives-unselected", "No scientific objectives have been selected.");
        }
        const objectives = objectiveIds.map((id) => window.BeyondEarthCatalogs.get("objectives", id));
        objectives.forEach((objective, index) => {
            if (!objective) {
                addIssue(issues, "hard", "objective-unknown",
                    `Objective "${objectiveIds[index]}" is not in the catalogue.`);
            }
        });

        const design = window.BeyondEarthSpacecraft.getDesignFacts(configuration.spacecraft || {});
        if (!design.loadout.architectureId) {
            addIssue(issues, "warning", "architecture-unselected", "No spacecraft architecture has been selected.");
        } else if (!design.architecture) {
            addIssue(issues, "hard", "architecture-unknown",
                `Architecture "${design.loadout.architectureId}" is not in the catalogue.`);
        }
        design.missing.forEach(({ category, id }) => {
            addIssue(issues, "hard", "component-unknown", `Component "${id}" is not in "${category}".`, { id, category });
        });

        const architecture = design.architecture;
        design.components.forEach((component) => {
            if (Array.isArray(component.compatibleArchitectureIds)
                && component.compatibleArchitectureIds.length
                && architecture
                && !component.compatibleArchitectureIds.includes(architecture.id)) {
                addIssue(issues, "hard", "architecture-incompatible",
                    `"${component.name}" is not compatible with "${architecture.name}".`,
                    { componentId: component.id, architectureId: architecture.id });
            }
            (component.incompatibleWith || []).forEach((otherId) => {
                if (design.components.some((other) => other.id === otherId)) {
                    addIssue(issues, "hard", "component-conflict",
                        `"${component.name}" conflicts with component "${otherId}".`,
                        { componentId: component.id, conflictingComponentId: otherId });
                }
            });
        });

        if (architecture && isRecord(architecture.componentSlots)) {
            const slotCounts = new Map();
            design.components.forEach((component) => {
                if (typeof component.slot === "string") {
                    slotCounts.set(component.slot, (slotCounts.get(component.slot) || 0) + 1);
                }
            });
            slotCounts.forEach((count, slot) => {
                const limit = architecture.componentSlots[slot];
                if (Number.isInteger(limit) && count > limit) {
                    addIssue(issues, "hard", "component-slot-limit",
                        `The architecture supports ${limit} component(s) in the "${slot}" slot, but ${count} are selected.`,
                        { slot, limit, count });
                }
            });
        }

        if (architecture && Number.isFinite(architecture.maxPayloadMassKg)) {
            if (design.payloadMassKg === null) {
                addIssue(issues, "warning", "payload-mass-unknown",
                    "Payload mass cannot be checked because one or more component masses are unspecified.");
            } else if (design.payloadMassKg > architecture.maxPayloadMassKg) {
                addIssue(issues, "hard", "payload-limit-exceeded",
                    `Payload mass (${design.payloadMassKg} kg) exceeds the architecture limit (${architecture.maxPayloadMassKg} kg).`,
                    { payloadMassKg: design.payloadMassKg, limitKg: architecture.maxPayloadMassKg });
            }
        } else if (architecture) {
            addIssue(issues, "warning", "payload-limit-unknown",
                "The architecture does not specify a payload mass limit.");
        }

        const hasPowerSystem = Boolean(design.loadout.powerSystemId);
        if (!hasPowerSystem) {
            addIssue(issues, "warning", "power-system-unselected", "No power system has been selected.");
        } else if (design.powerOutputW === null) {
            addIssue(issues, "warning", "power-output-unknown", "Power system output is not specified.");
        }
        if (design.powerDrawW === null) {
            addIssue(issues, "warning", "power-demand-unknown",
                "Power demand cannot be checked because one or more component loads are unspecified.");
        } else if (design.powerOutputW !== null && design.powerDrawW > design.powerOutputW) {
            addIssue(issues, "hard", "power-limit-exceeded",
                `Spacecraft power demand (${design.powerDrawW} W) exceeds system output (${design.powerOutputW} W).`,
                { powerDrawW: design.powerDrawW, powerOutputW: design.powerOutputW });
        }

        const selectedInstrumentIds = new Set(design.loadout.scientificInstrumentIds);
        objectives.filter(Boolean).forEach((objective) => {
            (objective.requiredInstrumentIds || []).forEach((instrumentId) => {
                if (!selectedInstrumentIds.has(instrumentId)) {
                    addIssue(issues, "hard", "required-instrument-missing",
                        `Objective "${objective.name}" requires instrument "${instrumentId}".`,
                        { objectiveId: objective.id, instrumentId });
                }
            });
            const communications = design.components.find(
                (component) => component.category === "communicationsSystems"
            );
            checkCommunications(objective, communications, issues);
        });

        if (destination && isRecord(destination.environmentalConditions)) {
            design.components.forEach((component) => {
                if (!isRecord(component.operatingLimits)) return;
                Object.entries(component.operatingLimits).forEach(([condition, limits]) => {
                    if (!isRecord(limits) || !Number.isFinite(destination.environmentalConditions[condition])) {
                        addIssue(issues, "warning", "environmental-data-missing",
                            `Environmental data for "${condition}" is unavailable, so "${component.name}" cannot be fully checked.`,
                            { destinationId: destination.id, componentId: component.id, condition });
                        return;
                    }
                    const value = destination.environmentalConditions[condition];
                    if ((Number.isFinite(limits.min) && value < limits.min)
                        || (Number.isFinite(limits.max) && value > limits.max)) {
                        addIssue(issues, "hard", "environmental-limit-exceeded",
                            `"${component.name}" operating limits do not include the destination's ${condition} value.`,
                            { destinationId: destination.id, componentId: component.id, condition, value, limits });
                    }
                });
            });
        }

        const hardIssues = issues.filter((issue) => issue.severity === "hard");
        const warnings = issues.filter((issue) => issue.severity === "warning");
        return {
            status: hardIssues.length ? "incompatible" : warnings.length ? "conditional" : "suitable",
            issues,
            metrics: {
                payloadMassKg: design.payloadMassKg,
                payloadLimitKg: Number.isFinite(architecture?.maxPayloadMassKg)
                    ? architecture.maxPayloadMassKg
                    : null,
                powerDrawW: design.powerDrawW,
                powerOutputW: design.powerOutputW,
            },
        };
    }

    window.BeyondEarthCompatibility = Object.freeze({ evaluateDesign });
})();