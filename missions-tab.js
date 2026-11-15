(() => {
    "use strict";

    function drawCelestialStar(context, x, y, radius, color) {
        context.fillStyle = color;
        context.beginPath();
        context.moveTo(x, y - radius);
        context.lineTo(x + radius * 0.24, y - radius * 0.24);
        context.lineTo(x + radius, y);
        context.lineTo(x + radius * 0.24, y + radius * 0.24);
        context.lineTo(x, y + radius);
        context.lineTo(x - radius * 0.24, y + radius * 0.24);
        context.lineTo(x - radius, y);
        context.lineTo(x - radius * 0.24, y - radius * 0.24);
        context.closePath();
        context.fill();
    }

    const scene = document.getElementById("missions-scene");
    const builderPanel = document.getElementById("mission-builder-panel");
    const flightPanel = document.getElementById("mission-flight-panel");
    const stageWrap = document.getElementById("mission-stage-wrap");
    const stageContent = document.getElementById("mission-stage-content");
    const formFeedback = document.getElementById("mission-form-feedback");
    const flightFeedback = document.getElementById("mission-flight-feedback");
    const progress = document.getElementById("mission-progress");
    const reviewStatus = document.getElementById("mission-review-status");
    const reviewIssues = document.getElementById("mission-review-issues");
    const blueprint = document.getElementById("mission-blueprint");
    const blueprintCanvas = document.getElementById("mission-blueprint-canvas");
    const blueprintContext = blueprintCanvas.getContext("2d");
    const canvasWidth = blueprintCanvas.width;
    const canvasHeight = blueprintCanvas.height;
    const manager = window.BeyondEarthMissionManager;
    const missionBuilder = window.BeyondEarthMissionBuilder;
    const missionEducation = window.BeyondEarthMissionEducation;
    const catalogs = window.BeyondEarthCatalogs;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stages = [
        { id: "headquarters", title: "Mission Headquarters", description: "A new flight begins with a name and a scientific purpose." },
        { id: "destination", title: "Choose a destination", description: "Explore the catalogue and see what makes each world a worthwhile, challenging target." },
        { id: "objectives", title: "Choose your science", description: "Pick a primary investigation, then add supporting objectives if your spacecraft can carry them." },
        { id: "architecture", title: "Choose a spacecraft", description: "Select a flight architecture that suits your destination and objectives." },
        { id: "propulsion", title: "Propulsion & trajectory", description: "Choose how your spacecraft changes course. Some options are specialised for specific architectures." },
        { id: "power", title: "Power systems", description: "Balance available generation against the power demands of your instruments and communication gear." },
        { id: "instruments", title: "Science instruments", description: "Equip the tools that make your selected investigations possible." },
        { id: "communications", title: "Communications", description: "Choose a link capable of returning the data your science programme expects." },
        { id: "navigation", title: "Navigation & thermal", description: "Select guidance and temperature-control equipment for the spacecraft and destination." },
        { id: "journey", title: "Journey profile", description: "Plan the launch configuration, trajectory, and operating time for this expedition." },
        { id: "constraints", title: "Mission constraints", description: "Set your available resources and compare them with the current spacecraft design." },
        { id: "review", title: "Mission dossier", description: "Review the complete blueprint, engineering checks, and generated mission activities." },
    ];
    const selectionFields = {
        propulsion: { category: "propulsionSystems", field: "propulsionSystemId" },
        power: { category: "powerSystems", field: "powerSystemId" },
        communications: { category: "communicationsSystems", field: "communicationsSystemId" },
        thermal: { category: "thermalSystems", field: "thermalSystemId" },
        navigation: { category: "navigationSystems", field: "navigationSystemId" },
    };
    const stageCategories = {
        propulsion: "propulsionSystems",
        power: "powerSystems",
        communications: "communicationsSystems",
    };
    const surfaceObjectives = [
        "surface-exploration", "geological-investigation", "water-ice-detection",
        "mineral-composition", "seismic-monitoring", "sample-collection",
        "planetary-imaging", "astrobiology-related-environmental-investigation",
    ];
    const deepSpaceObjectives = [
        "orbital-observation", "space-weather-monitoring", "magnetic-field-investigation",
        "radiation-measurement", "planetary-imaging", "atmospheric-analysis",
    ];
    const objectiveRecommendations = {
        terrestrial: surfaceObjectives,
        atmosphere: [
            "atmospheric-analysis", "planetary-imaging", "orbital-observation",
            "space-weather-monitoring", "radiation-measurement",
            "astrobiology-related-environmental-investigation",
        ],
        icy: [
            "water-ice-detection", "geological-investigation",
            "astrobiology-related-environmental-investigation", "radiation-measurement",
            "magnetic-field-investigation", "planetary-imaging", "sample-collection",
        ],
        smallBody: [
            "geological-investigation", "sample-collection", "mineral-composition",
            "planetary-imaging", "radiation-measurement",
        ],
        solar: ["space-weather-monitoring", "radiation-measurement", "magnetic-field-investigation"],
    };
    const journeyOptions = {
        launchConfiguration: [
            { id: "standard-launch", name: "Standard Launch", detail: "A balanced launch plan for compact research spacecraft." },
            { id: "heavy-lift-launch", name: "Heavy-Lift Launch", detail: "More room for mass and equipment, with a larger launch commitment." },
            { id: "rideshare-launch", name: "Rideshare Launch", detail: "A shared launch opportunity with less control over timing." },
        ],
        trajectories: {
            surface: [
                { id: "direct-transfer", name: "Direct Transfer", detail: "A direct cruise to the destination; fewer navigation phases." },
                { id: "orbital-insertion", name: "Orbital Insertion", detail: "Arrive into orbit before beginning surface operations." },
                { id: "surface-deployment", name: "Surface Deployment", detail: "Plan the final approach around a controlled landing or rover deployment." },
                { id: "gravity-assist", name: "Gravity Assist", detail: "Trade a longer, carefully timed route for a gravity-assisted transfer." },
            ],
            orbital: [
                { id: "direct-transfer", name: "Direct Transfer", detail: "A direct cruise to the destination." },
                { id: "orbital-insertion", name: "Orbital Insertion", detail: "Reserve the arrival phase for precise orbital capture." },
                { id: "gravity-assist", name: "Gravity Assist", detail: "Use a close planetary pass to reshape the flight path." },
                { id: "flyby", name: "Flyby", detail: "Observe the target during a planned high-speed pass." },
            ],
            atmospheric: [
                { id: "direct-transfer", name: "Direct Transfer", detail: "A direct cruise to the target environment." },
                { id: "atmospheric-entry", name: "Atmospheric Entry", detail: "Plan an instrumented descent through the atmosphere." },
                { id: "orbital-insertion", name: "Orbital Insertion", detail: "Begin with a remote orbital survey." },
                { id: "gravity-assist", name: "Gravity Assist", detail: "Use a timed flyby to shape a distant transfer." },
            ],
        },
    };

    let activeStage = "headquarters";
    let showAllObjectives = false;
    let skyAnimationFrame = 0;
    let skyTime = 0;
    let lastSkyTime = 0;

    const savedProfile = window.BeyondEarthPlayer?.getPersonnelFile?.();
    if (savedProfile?.colorFamily && window.BeyondEarthTheme.getColorFamily() !== savedProfile.colorFamily) {
        window.BeyondEarthTheme.setColorFamily(savedProfile.colorFamily);
    }

    function node(tag, className = "", text) {
        const item = document.createElement(tag);
        if (className) item.className = className;
        if (text !== undefined) item.textContent = text;
        return item;
    }

    function makeButton(text, className, action, attributes = {}) {
        const button = node("button", className, text);
        button.type = "button";
        Object.entries(attributes).forEach(([key, value]) => button.setAttribute(key, value));
        button.addEventListener("click", action);
        return button;
    }

    function selectedMission() {
        return manager.getActiveMission();
    }

    function selectedObjectives(mission) {
        return [mission?.objectives?.primaryId, ...(mission?.objectives?.secondaryIds || [])].filter(Boolean);
    }

    function currentDestination(mission) {
        return mission?.destination?.id ? catalogs.get("destinations", mission.destination.id) : null;
    }

    function currentArchitecture(mission) {
        return mission?.spacecraft?.architectureId
            ? catalogs.get("architectures", mission.spacecraft.architectureId)
            : null;
    }

    function componentCompatible(part, architectureId) {
        return !Array.isArray(part.compatibleArchitectureIds)
            || !part.compatibleArchitectureIds.length
            || part.compatibleArchitectureIds.includes(architectureId);
    }

    function compatibleParts(category, architectureId) {
        return catalogs.list(category).filter((part) => componentCompatible(part, architectureId));
    }

    function recommendedObjectivesFor(destination) {
        if (!destination) return surfaceObjectives;
        if (destination.id === "sun") return objectiveRecommendations.solar;
        if (["europa", "enceladus", "ganymede"].includes(destination.id)) return objectiveRecommendations.icy;
        if (["venus", "titan", "jupiter", "saturn"].includes(destination.id)) return objectiveRecommendations.atmosphere;
        if (["asteroids", "near-earth-object"].includes(destination.id)) return objectiveRecommendations.smallBody;
        if (["earth-orbit"].includes(destination.id)) return deepSpaceObjectives;
        return objectiveRecommendations.terrestrial;
    }

    function recommendedArchitectureIds(mission) {
        const objectiveIds = selectedObjectives(mission);
        if (!objectiveIds.length) return [];
        return catalogs.list("architectures")
            .filter((architecture) => objectiveIds.every((id) => (
                architecture.compatibleObjectives?.includes(id)
                && catalogs.get("objectives", id)?.preferredArchitectures?.includes(architecture.id)
            )))
            .map((architecture) => architecture.id);
    }

    function communicationRequirements(mission) {
        const objectives = selectedObjectives(mission)
            .map((id) => catalogs.get("objectives", id))
            .filter(Boolean);
        return {
            minDataRateMbps: Math.max(0, ...objectives.map((objective) => (
                objective.communicationRequirements?.minDataRateMbps || 0
            ))),
            relayRequired: objectives.some((objective) => (
                objective.communicationRequirements?.relayRequired === true
            )),
        };
    }

    function getRecommendedPart(category, mission) {
        const architectureId = mission?.spacecraft?.architectureId;
        const destination = currentDestination(mission);
        const requirements = communicationRequirements(mission);
        const parts = compatibleParts(category, architectureId);
        if (!parts.length) return null;

        if (category === "communicationsSystems") {
            const meetsNeed = parts.filter((part) => (
                Number.isFinite(part.dataRateMbps)
                && part.dataRateMbps >= requirements.minDataRateMbps
                && (!requirements.relayRequired || part.relayCapable === true)
            ));
            return (meetsNeed.length ? meetsNeed : parts)
                .sort((a, b) => (a.massKg ?? Infinity) - (b.massKg ?? Infinity))[0];
        }
        if (category === "powerSystems") {
            const preferred = destination && destination.distanceAu > 2
                ? parts.find((part) => part.id === "radioisotope-power")
                : parts.find((part) => part.id === "solar-panels");
            return preferred || [...parts].sort((a, b) => (b.powerOutputW || 0) - (a.powerOutputW || 0))[0];
        }
        if (category === "propulsionSystems") {
            if (destination?.distanceAu > 2) {
                const electric = parts.find((part) => part.id === "electric-propulsion");
                if (electric) return electric;
            }
            return parts.find((part) => part.id === "chemical-propulsion")
                || parts.find((part) => part.id === "gravity-assist-trajectory")
                || [...parts].sort((a, b) => (a.massKg ?? Infinity) - (b.massKg ?? Infinity))[0];
        }
        if (category === "thermalSystems") {
            return parts.find((part) => part.id === "active-thermal-loop")
                || parts.find((part) => part.id === "passive-radiator")
                || parts[0];
        }
        if (category === "navigationSystems") {
            return destination?.distanceAu > 1
                ? parts.find((part) => part.id === "deep-space-navigation") || parts[0]
                : parts.find((part) => part.id === "inertial-navigation") || parts[0];
        }
        return parts[0];
    }

    function componentDescription(part, mission) {
        const details = [];
        if (Number.isFinite(part.massKg)) details.push(`${part.massKg} kg`);
        if (Number.isFinite(part.powerDrawW)) details.push(`${part.powerDrawW} W draw`);
        if (Number.isFinite(part.powerOutputW)) details.push(`${part.powerOutputW} W output`);
        if (Number.isFinite(part.dataRateMbps)) details.push(`${part.dataRateMbps} Mbps`);
        if (part.relayCapable) details.push("relay capable");
        const architectureId = mission?.spacecraft?.architectureId;
        if (!componentCompatible(part, architectureId)) details.push("requires a different architecture");
        return details.join(" · ") || "Mission system component";
    }

    function setFeedback(message, target = formFeedback) {
        target.textContent = message || "";
    }

    function focusStageElement(selector) {
        if (!selector) return;
        stageContent.querySelector(selector)?.focus({ preventScroll: true });
    }

    function updateDraft(mutator, focusSelector = null) {
        const mission = selectedMission();
        if (!mission || mission.status !== "draft") {
            throw new Error("A saved mission draft is required for this planning change.");
        }
        const updated = manager.updateActiveMission((draft) => {
            mutator(draft);
            const facts = window.BeyondEarthSpacecraft.getDesignFacts(draft.spacecraft);
            draft.resources.massKg = facts.payloadMassKg ?? 0;
            return draft;
        });
        missionEducation.handleMissionUpdate(activeStage, mission, updated);
        missionEducation.renderCompanion(activeStage, updated);
        setFeedback("Flight notes saved.");
        renderBlueprint(updated);
        updateReview(updated);
        renderProgress(updated);
        if (focusSelector) focusStageElement(focusSelector);
        window.SpaceAudio?.playSFX?.("select");
        return updated;
    }

    function updateCreatorStage(stageId) {
        activeStage = stageId;
        const mission = selectedMission();
        if (mission?.status === "draft") {
            manager.updateActiveMission((draft) => {
                draft.planning.creatorStage = stageId;
                return draft;
            });
        }
        renderStage();
    }

    function createDraft(name) {
        const mission = missionBuilder.createMissionDraft({
            name: name.trim() || "Untitled Flight",
            missionType: "science",
            resources: {
                budgetCredits: 1000,
                powerWh: 1000,
                fuelKg: 500,
                dataStorageMb: 100,
                equipmentCondition: 1,
            },
            planning: { creatorStage: "destination" },
        });
        manager.saveMission(mission);
        activeStage = "destination";
        setFeedback("Mission file opened. Your decisions save as you plan.");
        render();
    }

    function choiceCard({ title, description, badge, selected, status, action, attributes = {} }) {
        const card = makeButton("", `mission-choice-card${selected ? " is-selected" : ""}${status ? ` mission-choice-card--${status}` : ""}`, action, {
            "aria-pressed": String(Boolean(selected)),
            ...attributes,
        });
        const top = node("span", "mission-choice-card__top");
        top.append(node("strong", "mission-choice-card__title", title));
        if (badge) top.append(node("span", "mission-choice-card__badge", badge));
        card.append(top);
        if (description) card.append(node("span", "mission-choice-card__description", description));
        if (selected) card.append(node("span", "mission-choice-card__check", "✦ SELECTED"));
        return card;
    }

    function makeField(labelText, child) {
        const label = node("label", "mission-field");
        label.append(node("span", "mission-field__label", labelText), child);
        return label;
    }

    function recommendationBadge(part, recommended, compatible, requirementMet) {
        if (part.id === recommended?.id) return { text: "RECOMMENDED", level: "recommended" };
        if (!compatible || !requirementMet) return { text: "SPECIALISED", level: "specialised" };
        return { text: "ALTERNATIVE", level: "alternative" };
    }

    function meetsCommunicationRequirements(part, mission) {
        if (!part || !Number.isFinite(part.dataRateMbps)) return false;
        const required = communicationRequirements(mission);
        return part.dataRateMbps >= required.minDataRateMbps
            && (!required.relayRequired || part.relayCapable === true);
    }

    function getSpecializedChoiceObservation(stageId, choiceId, mission) {
        if (!mission || !choiceId) return null;

        if (stageId === "objectives") {
            const objective = catalogs.get("objectives", choiceId);
            if (!objective || recommendedObjectivesFor(currentDestination(mission)).includes(choiceId)) return null;
            const architecture = currentArchitecture(mission);
            const preferred = objective.preferredArchitectures || [];
            if (!preferred.length || preferred.includes(architecture?.id)) return null;
            const preferredNames = preferred
                .map((id) => catalogs.get("architectures", id)?.name || id)
                .filter(Boolean);
            const destination = currentDestination(mission);
            return {
                kind: "objective-platform",
                message: architecture
                    ? `${objective.name} isn't a suggested goal for ${destination?.name || "this destination"}; it prefers ${preferredNames.join(", ")}, not ${architecture.name}. This is guidance, not a design failure.`
                    : `${objective.name} is SPECIALISED until you choose a spacecraft; select an Architecture to check its preferred fit.`,
            };
        }

        if (stageId === "architecture") {
            const architecture = catalogs.get("architectures", choiceId);
            if (!architecture) return null;
            const objectiveIds = selectedObjectives(mission);
            const coverage = objectiveIds.filter((id) => architecture.compatibleObjectives?.includes(id)).length;
            if (recommendedArchitectureIds(mission).includes(choiceId) || coverage > 0) return null;
            const objectiveNames = objectiveIds
                .map((id) => catalogs.get("objectives", id)?.name || id)
                .filter(Boolean);
            return {
                kind: "architecture-objective-fit",
                message: objectiveNames.length
                    ? `The catalog doesn't list ${architecture.name} as supporting ${objectiveNames.join(" or ")}; this is a platform-fit hint, not a hard check.`
                    : "SPECIALISED: choose a science objective before assessing platform fit.",
            };
        }

        if (stageId === "instruments") {
            const instrument = catalogs.get("instruments", choiceId);
            if (!instrument || componentCompatible(instrument, mission.spacecraft?.architectureId)) return null;
            const architecture = currentArchitecture(mission);
            const supportedArchitectures = (instrument.compatibleArchitectureIds || [])
                .map((id) => catalogs.get("architectures", id)?.name)
                .filter(Boolean);
            return {
                kind: "architecture-component-fit",
                message: architecture
                    ? `${instrument.name} isn't listed for ${architecture.name}; its catalogued platforms are ${supportedArchitectures.join(", ") || "not specified"}. Check Architecture.`
                    : `${instrument.name} is SPECIALISED until you choose a spacecraft; select an Architecture to check fit.`,
            };
        }

        const categoryByStage = {
            propulsion: "propulsionSystems",
            power: "powerSystems",
            communications: "communicationsSystems",
            navigation: ["navigationSystems", "thermalSystems"],
        };
        const categories = categoryByStage[stageId];
        const category = (Array.isArray(categories) ? categories : [categories])
            .find((item) => item && catalogs.get(item, choiceId));
        if (!category) return null;
        const part = catalogs.get(category, choiceId);
        const compatible = componentCompatible(part, mission.spacecraft?.architectureId);
        const requirementMet = category !== "communicationsSystems"
            || meetsCommunicationRequirements(part, mission);
        if (category !== "communicationsSystems" && recommendationBadge(
            part,
            getRecommendedPart(category, mission),
            compatible,
            requirementMet,
        ).level !== "specialised") return null;
        if (category === "communicationsSystems" && compatible && requirementMet) return null;

        if (!mission.spacecraft?.architectureId) {
            return {
                kind: "architecture-component-fit",
                message: `${part.name} is SPECIALISED until you choose a spacecraft; select an Architecture to check fit.`,
            };
        }
        if (!compatible) {
            const supportedArchitectures = (part.compatibleArchitectureIds || [])
                .map((id) => catalogs.get("architectures", id)?.name)
                .filter(Boolean);
            const architecture = currentArchitecture(mission);
            return {
                kind: "architecture-component-fit",
                message: `${part.name} isn't listed for ${architecture?.name || "this spacecraft"}; its catalogued platforms are ${supportedArchitectures.join(", ") || "not specified"}. Check Architecture.`,
            };
        }

        const requirements = communicationRequirements(mission);
        const objectiveNames = selectedObjectives(mission)
            .map((id) => catalogs.get("objectives", id))
            .filter(Boolean);
        const lowRateObjectives = objectiveNames
            .filter((objective) => Number.isFinite(objective.communicationRequirements?.minDataRateMbps)
                && objective.communicationRequirements.minDataRateMbps > (part.dataRateMbps ?? -Infinity));
        const relayObjectives = objectiveNames
            .filter((objective) => objective.communicationRequirements?.relayRequired === true)
            .map((objective) => objective.name);
        const unmetNeeds = [];
        if (!Number.isFinite(part.dataRateMbps)) {
            unmetNeeds.push(`its data rate isn't catalogued for ${objectiveNames.map((objective) => objective.name).join(", ") || "the selected science"}`);
        } else if (part.dataRateMbps < requirements.minDataRateMbps) {
            const rateOwners = lowRateObjectives.map((objective) => (
                `${objective.name} needs ${objective.communicationRequirements.minDataRateMbps} Mbps`
            ));
            unmetNeeds.push(`${rateOwners.join(" and ") || `selected objectives need ${requirements.minDataRateMbps} Mbps`}, but it provides ${part.dataRateMbps} Mbps`);
        }
        if (requirements.relayRequired && part.relayCapable !== true) {
            unmetNeeds.push(`it isn't relay-capable${relayObjectives.length ? ` for ${relayObjectives.join(", ")}` : ""}`);
        }
        const message = `${part.name} is SPECIALISED because ${unmetNeeds.join(" and ") || "its communications fit can't be verified"}. Check Communications.`;
        return {
            kind: "communications-requirements",
            message,
        };
    }

    function renderChoiceStage(stage, mission) {
        const category = stageCategories[stage.id] || (stage.id === "navigation" ? null : null);
        const mapping = stage.id === "navigation"
            ? ["navigationSystems", "thermalSystems"]
            : [category];
        const group = node("div", "mission-choice-groups");
        mapping.filter(Boolean).forEach((partCategory) => {
            const field = Object.values(selectionFields).find((item) => item.category === partCategory);
            if (!field) return;
            const parts = catalogs.list(partCategory);
            const recommended = getRecommendedPart(partCategory, mission);
            const selectedId = mission.spacecraft[field.field];
            const requirements = communicationRequirements(mission);
            const section = node("section", "mission-choice-group");
            const title = node("div", "mission-section-heading");
            title.append(
                node("h4", "", partCategory === "navigationSystems" ? "Navigation" :
                    partCategory === "thermalSystems" ? "Thermal control" :
                        partCategory === "propulsionSystems" ? "Propulsion" :
                            partCategory === "powerSystems" ? "Power source" : "Communications link"),
                node("p", "", partCategory === "communicationsSystems"
                    ? `Science links require ${requirements.minDataRateMbps} Mbps${requirements.relayRequired ? " and relay capability" : ""}.`
                    : "Choose a component to update the live spacecraft blueprint."),
            );
            section.appendChild(title);
            const cards = node("div", "mission-choice-grid");
            const noneField = node("button", `mission-choice-card mission-choice-card--none${selectedId ? "" : " is-selected"}`,
                "NO COMPONENT SELECTED");
            noneField.type = "button";
            noneField.setAttribute("aria-pressed", String(!selectedId));
            noneField.addEventListener("click", () => {
                updateDraft((draft) => { draft.spacecraft[field.field] = null; });
                renderStage();
            });
            cards.appendChild(noneField);
            parts.forEach((part, index) => {
                const compatible = componentCompatible(part, mission.spacecraft.architectureId);
                const meetsRequirement = partCategory !== "communicationsSystems"
                    || meetsCommunicationRequirements(part, mission);
                const badge = recommendationBadge(part, recommended, compatible, meetsRequirement);
                cards.appendChild(choiceCard({
                    title: part.name,
                    description: componentDescription(part, mission),
                    badge: badge.text,
                    status: badge.level,
                    selected: selectedId === part.id,
                    action: () => {
                        updateDraft((draft) => { draft.spacecraft[field.field] = part.id; });
                        renderStage();
                    },
                    attributes: { "data-choice-index": String(index) },
                }));
            });
            section.appendChild(cards);
            const reason = recommended
                ? `${recommended.name} is suggested for this ${currentArchitecture(mission)?.name || "spacecraft"} and destination. Other catalogued options remain selectable.`
                : "Select an architecture to see compatible recommendations.";
            section.appendChild(node("p", "mission-guidance", reason));
            group.appendChild(section);
        });
        stageContent.appendChild(group);
    }

    function renderInstrumentStage(mission) {
        const objectives = selectedObjectives(mission)
            .map((id) => catalogs.get("objectives", id))
            .filter(Boolean);
        const requiredIds = new Set(objectives.flatMap((objective) => objective.requiredInstrumentIds || []));
        const chosenIds = new Set(mission.spacecraft.scientificInstrumentIds);
        const parts = catalogs.list("instruments");
        const container = node("div", "mission-instrument-layout");
        const requiredNames = [...requiredIds].map((id) => catalogs.get("instruments", id)?.name || id);
        const note = requiredNames.length
            ? `Selected objectives call for: ${requiredNames.join(", ")}. Keeping a required instrument off the craft will appear in the engineering review.`
            : "Select instruments to support the science you want to perform.";
        container.appendChild(node("p", "mission-guidance", note));
        const list = node("div", "mission-instrument-list");
        parts.forEach((part) => {
            const compatible = componentCompatible(part, mission.spacecraft.architectureId);
            const required = requiredIds.has(part.id);
            const selected = chosenIds.has(part.id);
            const recommended = required || objectives.some((objective) => objective.requiredInstrumentIds?.includes(part.id));
            const label = node("label", `mission-instrument${selected ? " is-selected" : ""}${!compatible ? " is-specialised" : ""}`);
            const checkbox = node("input");
            checkbox.type = "checkbox";
            checkbox.checked = selected;
            checkbox.value = part.id;
            checkbox.addEventListener("change", () => {
                updateDraft((draft) => {
                    const selectedInstruments = new Set(draft.spacecraft.scientificInstrumentIds);
                    if (checkbox.checked) selectedInstruments.add(part.id);
                    else selectedInstruments.delete(part.id);
                    draft.spacecraft.scientificInstrumentIds = [...selectedInstruments];
                });
                label.classList.toggle("is-selected", checkbox.checked);
            });
            const copy = node("span", "mission-instrument__copy");
            copy.append(
                node("strong", "", part.name),
                node("small", "", componentDescription(part, mission)),
            );
            const mark = node("span", "mission-choice-card__badge", required ? "REQUIRED" : recommended ? "RECOMMENDED" : compatible ? "OPTIONAL" : "SPECIALISED");
            if (required || recommended) mark.classList.add("is-recommended");
            label.append(checkbox, copy, mark);
            list.appendChild(label);
        });
        container.appendChild(list);
        stageContent.appendChild(container);
    }

    function renderDestinationStage(mission) {
        const destinations = missionBuilder.listDestinations();
        const selected = mission.destination.id;
        const map = node("div", "mission-destination-map");
        const orbit = node("div", "mission-map-orbit");
        destinations.forEach((destination, index) => {
            const marker = makeButton(
                `${String(index + 1).padStart(2, "0")} · ${destination.name}`,
                `mission-map-marker${selected === destination.id ? " is-selected" : ""}`,
                () => {
                    updateDraft((draft) => {
                        const info = catalogs.get("destinations", destination.id);
                        draft.destination.id = destination.id;
                        draft.destination.environmentalConditions = { ...info.environmentalConditions };
                        if (!draft.planning.durationManuallySet) {
                            draft.planning.durationDays = info.travelTimeDays;
                        }
                    });
                    renderStage();
                },
                { "aria-pressed": String(selected === destination.id), "data-destination": destination.id },
            );
            marker.style.setProperty("--marker-order", String(index));
            orbit.appendChild(marker);
        });
        map.appendChild(node("p", "mission-map-caption", "SOLAR SYSTEM SURVEY · SELECT A SIGNAL"));
        map.appendChild(orbit);
        stageContent.appendChild(map);

        const info = currentDestination(mission);
        if (!info) {
            stageContent.appendChild(node("p", "mission-guidance", "Choose a world from the survey line to inspect its conditions and science potential."));
            return;
        }
        const detail = node("article", "mission-destination-detail");
        const preview = node("canvas", "mission-destination-canvas");
        preview.width = 160;
        preview.height = 100;
        preview.setAttribute("aria-hidden", "true");
        detail.append(preview);
        const copy = node("div", "mission-destination-copy");
        copy.append(
            node("p", "missions-kicker", info.type.toUpperCase()),
            node("h4", "", info.name),
            node("p", "", info.summary),
            node("p", "mission-destination-description", info.description),
            node("p", "mission-destination-facts", `SCIENTIFIC VALUE ${info.scientificValue}/10 · RISK ${Math.round(info.risk * 100)}% · TRAVEL ${info.travelTimeDays} DAYS`),
        );
        const conditions = node("ul", "mission-condition-strip");
        Object.entries(info.environmentalConditions || {}).forEach(([key, value]) => {
            conditions.appendChild(node("li", "", `${key}: ${value}`));
        });
        copy.appendChild(conditions);
        detail.appendChild(copy);
        stageContent.appendChild(detail);
        drawPlanet(preview, info);
    }

    function renderObjectivesStage(mission) {
        const destination = currentDestination(mission);
        const allObjectives = missionBuilder.listObjectives();
        const recommendedIds = recommendedObjectivesFor(destination);
        const chosenIds = selectedObjectives(mission);
        const sorted = allObjectives.filter((objective) => (
            showAllObjectives || recommendedIds.includes(objective.id) || chosenIds.includes(objective.id)
        ));
        const recommended = node("div", "mission-objective-recommendations");
        const intro = node("div", "mission-section-heading");
        intro.append(
            node("h4", "", `Opportunities at ${destination?.name || "your destination"}`),
            node("p", "", "Choose one primary investigation. Additional objectives can add instruments, power draw, storage use, and mission time."),
        );
        recommended.appendChild(intro);
        const primaryGrid = node("div", "mission-choice-grid mission-objective-grid");
        sorted.forEach((objective) => {
            const preferred = recommendedIds.includes(objective.id);
            const architectureFit = !objective.preferredArchitectures?.length
                || objective.preferredArchitectures.includes(mission.spacecraft.architectureId);
            const badge = preferred
                ? { text: "DESTINATION MATCH", level: "recommended" }
                : { text: architectureFit ? "ALTERNATIVE" : "SPECIALISED", level: architectureFit ? "alternative" : "specialised" };
            primaryGrid.appendChild(choiceCard({
                title: objective.name,
                description: objective.summary,
                badge: badge.text,
                status: badge.level,
                selected: mission.objectives.primaryId === objective.id,
                action: () => {
                    updateDraft((draft) => {
                        if (draft.objectives.primaryId === objective.id) return;
                        draft.objectives.secondaryIds = draft.objectives.secondaryIds.filter((id) => id !== objective.id);
                        draft.objectives.primaryId = objective.id;
                    });
                    renderStage();
                },
                attributes: { "data-objective-primary": objective.id },
            }));
        });
        recommended.appendChild(primaryGrid);
        const showAll = makeButton(
            showAllObjectives ? "SHOW DESTINATION MATCHES" : "EXPLORE ALL OBJECTIVES",
            "mission-text-button",
            () => {
                showAllObjectives = !showAllObjectives;
                renderStage();
            },
            { "aria-expanded": String(showAllObjectives) },
        );
        recommended.appendChild(showAll);
        const optionalHeading = node("div", "mission-section-heading mission-optional-heading");
        optionalHeading.append(
            node("h4", "", "Optional supporting objectives"),
            node("p", "", "Keep your main goal, then add any supporting science you can equip."),
        );
        recommended.appendChild(optionalHeading);
        const optionalGrid = node("div", "mission-secondary-objectives");
        sorted.filter((objective) => objective.id !== mission.objectives.primaryId).forEach((objective) => {
            const label = node("label", `mission-secondary-objective${mission.objectives.secondaryIds.includes(objective.id) ? " is-selected" : ""}`);
            const checkbox = node("input");
            checkbox.type = "checkbox";
            checkbox.checked = mission.objectives.secondaryIds.includes(objective.id);
            checkbox.addEventListener("change", () => {
                updateDraft((draft) => {
                    draft.objectives.secondaryIds = checkbox.checked
                        ? [...new Set([...draft.objectives.secondaryIds, objective.id])]
                        : draft.objectives.secondaryIds.filter((id) => id !== objective.id);
                });
                label.classList.toggle("is-selected", checkbox.checked);
            });
            label.append(checkbox, node("span", "", objective.name));
            optionalGrid.appendChild(label);
        });
        recommended.appendChild(optionalGrid);
        stageContent.appendChild(recommended);
    }

    function renderArchitectureStage(mission) {
        const recommendations = new Set(recommendedArchitectureIds(mission));
        const objectiveNames = selectedObjectives(mission)
            .map((id) => catalogs.get("objectives", id)?.name)
            .filter(Boolean);
        const title = node("div", "mission-section-heading");
        title.append(
            node("h4", "", "Choose the platform"),
            node("p", "", `Compare architectures against ${objectiveNames.join(", ") || "your science objectives"}. Recommendations use the selected objectives and their preferred platforms.`),
        );
        stageContent.appendChild(title);
        const grid = node("div", "mission-choice-grid mission-architecture-grid");
        catalogs.list("architectures").forEach((architecture) => {
            const matches = recommendations.has(architecture.id);
            const objectiveCoverage = selectedObjectives(mission).filter((id) => architecture.compatibleObjectives?.includes(id)).length;
            const status = matches ? "recommended" : objectiveCoverage ? "alternative" : "specialised";
            const reasons = [
                architecture.missionClass.replaceAll("-", " "),
                `${architecture.maxPayloadMassKg} kg payload limit`,
                objectiveCoverage ? `${objectiveCoverage}/${selectedObjectives(mission).length} objectives supported` : "review objective compatibility",
            ].join(" · ");
            grid.appendChild(choiceCard({
                title: architecture.name,
                description: reasons,
                badge: matches ? "RECOMMENDED" : objectiveCoverage ? "ALTERNATIVE" : "SPECIALISED",
                status,
                selected: mission.spacecraft.architectureId === architecture.id,
                action: () => {
                    updateDraft((draft) => { draft.spacecraft.architectureId = architecture.id; });
                    renderStage();
                },
                attributes: { "data-architecture": architecture.id },
            }));
        });
        stageContent.appendChild(grid);
        stageContent.appendChild(node("p", "mission-guidance", "Changing architecture keeps all selected equipment. The design review will identify anything that needs a new compatible component."));
    }

    function renderJourneyStage(mission) {
        const architecture = currentArchitecture(mission);
        const journeyType = architecture?.missionClass === "surface"
            ? "surface"
            : ["atmospheric", "autonomous"].includes(architecture?.missionClass)
                ? "atmospheric"
                : "orbital";
        const journey = node("div", "mission-journey-grid");
        journey.appendChild(renderCardChoices(
            "Launch configuration",
            "A launch plan changes payload capacity and scheduling flexibility.",
            journeyOptions.launchConfiguration,
            mission.planning.launchConfiguration,
            (id) => updateDraft((draft) => { draft.planning.launchConfiguration = id; }),
        ));
        journey.appendChild(renderCardChoices(
            "Trajectory profile",
            "Available routes adapt to the selected spacecraft architecture.",
            journeyOptions.trajectories[journeyType],
            mission.planning.trajectory,
            (id) => updateDraft((draft) => { draft.planning.trajectory = id; }),
        ));
        stageContent.appendChild(journey);
        const destination = currentDestination(mission);
        stageContent.appendChild(node("p", "mission-guidance", `${destination?.name || "Destination"} is approximately ${destination?.distanceAu ?? "—"} AU away; the catalogue travel estimate is ${destination?.travelTimeDays ?? "—"} days. These values populate the mission schedule.`));
    }

    function renderCardChoices(title, guidance, options, selected, onSelect) {
        const section = node("section", "mission-choice-group");
        const heading = node("div", "mission-section-heading");
        heading.append(node("h4", "", title), node("p", "", guidance));
        section.appendChild(heading);
        const grid = node("div", "mission-choice-grid");
        options.forEach((option) => {
            grid.appendChild(choiceCard({
                title: option.name,
                description: option.detail,
                badge: option.id === selected ? "ON BLUEPRINT" : "",
                status: option.id === selected ? "recommended" : "alternative",
                selected: option.id === selected,
                action: () => {
                    onSelect(option.id);
                    renderStage();
                },
            }));
        });
        section.appendChild(grid);
        return section;
    }

    function numberControl(label, value, min, max, step, unit, onChange, controlId) {
        const wrap = node("label", "mission-resource-control");
        const heading = node("span", "mission-resource-control__heading");
        heading.append(node("span", "", label));
        const output = node("output", "", `${value} ${unit}`);
        heading.appendChild(output);
        const input = node("input");
        input.type = "range";
        input.min = String(min);
        input.max = String(max);
        input.step = String(step);
        input.value = String(value);
        input.setAttribute("aria-label", label);
        input.dataset.constraintControl = controlId;
        input.addEventListener("input", () => { output.value = `${input.value} ${unit}`; });
        input.addEventListener("change", () => onChange(Number(input.value)));
        wrap.append(heading, input);
        return wrap;
    }

    function renderConstraintsStage(mission) {
        const form = node("div", "mission-constraints");
        const resources = mission.resources;
        const controls = [
            numberControl("Budget allocation", resources.budgetCredits, 100, 10000, 100, "credits", (value) => {
                updateDraft((draft) => { draft.resources.budgetCredits = value; });
            }, "budgetCredits"),
            numberControl("Power reserve", resources.powerWh, 100, 10000, 100, "Wh", (value) => {
                updateDraft((draft) => { draft.resources.powerWh = value; });
            }, "powerWh"),
            numberControl("Propellant reserve", resources.fuelKg, 0, 1000, 10, "kg", (value) => {
                updateDraft((draft) => { draft.resources.fuelKg = value; });
            }, "fuelKg"),
            numberControl("Data archive capacity", resources.dataStorageMb, 16, 2048, 16, "MB", (value) => {
                updateDraft((draft) => { draft.resources.dataStorageMb = value; });
            }, "dataStorageMb"),
            numberControl("Mission duration", mission.planning.durationDays ?? 0, 0, 3000, 10, "days", (value) => {
                updateDraft((draft) => {
                    draft.planning.durationDays = value;
                    draft.planning.durationManuallySet = true;
                });
            }, "durationDays"),
        ];
        controls.forEach((control) => form.appendChild(control));
        const facts = window.BeyondEarthSpacecraft.getDesignFacts(mission.spacecraft);
        const architecture = currentArchitecture(mission);
        const powerMargin = facts.powerDrawW !== null && facts.powerOutputW !== null
            ? facts.powerOutputW - facts.powerDrawW
            : null;
        const massRatio = architecture?.maxPayloadMassKg && facts.payloadMassKg !== null
            ? Math.min(1, facts.payloadMassKg / architecture.maxPayloadMassKg)
            : 0;
        const gauges = node("div", "mission-constraint-readouts");
        gauges.append(
            renderGauge("PAYLOAD MASS", facts.payloadMassKg ?? 0, architecture?.maxPayloadMassKg ?? 1, "kg"),
            renderGauge("POWER MARGIN", powerMargin ?? 0, facts.powerOutputW ?? 1, "W"),
        );
        form.appendChild(gauges);
        form.appendChild(node("p", "mission-guidance", `Payload is using ${Math.round(massRatio * 100)}% of the ${architecture?.name || "unselected"} payload limit. Power margin reflects the installed components, not an abstract score.`));
        stageContent.appendChild(form);
    }

    function renderGauge(label, amount, capacity, unit) {
        const section = node("div", "mission-gauge");
        const header = node("div", "mission-gauge__header");
        header.append(node("span", "", label), node("strong", "", `${Math.round(amount)} / ${Math.round(capacity)} ${unit}`));
        const meter = node("div", "mission-gauge__track");
        meter.setAttribute("role", "meter");
        meter.setAttribute("aria-label", label);
        meter.setAttribute("aria-valuemin", "0");
        meter.setAttribute("aria-valuemax", String(capacity));
        meter.setAttribute("aria-valuenow", String(amount));
        const fill = node("span", "mission-gauge__fill");
        fill.style.width = `${Math.max(0, Math.min(100, capacity > 0 ? amount / capacity * 100 : 0))}%`;
        meter.appendChild(fill);
        section.append(header, meter);
        return section;
    }

    function renderReviewStage(mission) {
        const review = missionBuilder.buildReview(mission);
        const plan = window.BeyondEarthMissionGenerator.buildMissionPlan(mission);
        const destination = currentDestination(mission);
        const architecture = currentArchitecture(mission);
        const facts = window.BeyondEarthSpacecraft.getDesignFacts(mission.spacecraft);
        const dossier = node("div", "mission-dossier");
        const sections = [
            ["Destination", destination?.name || "Not selected", destination?.summary || "Choose a target world."],
            ["Science", selectedObjectives(mission).map((id) => catalogs.get("objectives", id)?.name || id).join(", ") || "No objectives"],
            ["Spacecraft", architecture?.name || "Not selected", `Payload ${facts.payloadMassKg ?? "unknown"} / ${architecture?.maxPayloadMassKg ?? "unknown"} kg`],
            ["Journey", `${mission.planning.launchConfiguration || "Launch plan not selected"} · ${mission.planning.trajectory || "Trajectory not selected"}`, `${mission.planning.durationDays ?? 0} mission days`],
            ["Resources", `${mission.resources.budgetCredits} credits · ${mission.resources.powerWh} Wh · ${mission.resources.dataStorageMb} MB`, `${mission.resources.fuelKg} kg propellant reserved`],
        ];
        sections.forEach(([heading, primary, detail]) => {
            const row = node("article", "mission-dossier-row");
            row.append(node("span", "missions-kicker", heading.toUpperCase()), node("strong", "", primary));
            if (detail) row.appendChild(node("small", "", detail));
            dossier.appendChild(row);
        });
        const componentNames = [
            mission.spacecraft.propulsionSystemId,
            mission.spacecraft.powerSystemId,
            ...mission.spacecraft.scientificInstrumentIds,
            mission.spacecraft.communicationsSystemId,
            mission.spacecraft.navigationSystemId,
            mission.spacecraft.thermalSystemId,
        ].filter(Boolean).map((id) => (
            catalogs.categories
                .map((category) => catalogs.get(category, id))
                .find(Boolean)?.name || id
        ));
        const equipment = node("section", "mission-dossier-equipment");
        equipment.append(node("h4", "", "Installed equipment"), node("p", "", componentNames.join(" · ") || "No equipment selected."));
        dossier.appendChild(equipment);
        const planPanel = node("section", "mission-dossier-equipment");
        planPanel.append(node("h4", "", "Generated mission activities"));
        const activityList = node("ol", "mission-dossier-activities");
        plan.activities.forEach((activity) => {
            activityList.appendChild(node("li", "", `${activity.name} · ${activity.required ? "required" : "optional"}`));
        });
        if (!plan.activities.length) activityList.appendChild(node("li", "", "No activity templates match these objectives yet."));
        planPanel.appendChild(activityList);
        dossier.appendChild(planPanel);
        stageContent.append(dossier);
        stageContent.appendChild(renderIssueList(review));
        if (plan.warnings.length) {
            const warningBox = node("div", "mission-guidance mission-guidance--warning");
            warningBox.textContent = plan.warnings.join(" ");
            stageContent.appendChild(warningBox);
        }
    }

    function renderIssueList(review) {
        const list = node("ul", "mission-review-issues");
        if (!review.issues.length) {
            list.appendChild(node("li", "mission-issue mission-issue--ok", "No compatibility issues found. Mission is ready for approval."));
        } else {
            review.issues.forEach((issue) => {
                list.appendChild(node("li", `mission-issue mission-issue--${issue.severity}`, issue.message));
            });
        }
        return list;
    }

    function renderHeadquarters(mission) {
        const intro = node("div", "mission-headquarters-card");
        const insignia = node("div", "mission-headquarters-insignia", "BE");
        insignia.setAttribute("aria-hidden", "true");
        const copy = node("div", "mission-headquarters-copy");
        copy.append(
            node("p", "missions-kicker", "BEYOND EARTH · RESEARCH DIVISION"),
            node("h4", "", "A new world is waiting."),
            node("p", "", "Give your expedition a callsign. Then explore the system, choose your science, and assemble a spacecraft one decision at a time."),
        );
        const name = node("input", "mission-name-input");
        name.type = "text";
        name.maxLength = 80;
        name.value = mission?.name || "Lunar Geology Survey";
        name.setAttribute("aria-label", "Mission designation");
        name.addEventListener("change", () => {
            if (mission) {
                try {
                    updateDraft((draft) => { draft.name = name.value.trim() || "Untitled Flight"; });
                } catch (error) {
                    setFeedback(error.message);
                }
            }
        });
        copy.appendChild(makeField("MISSION DESIGNATION", name));
        const begin = makeButton(mission ? "CONTINUE PLANNING  →" : "OPEN FLIGHT FILE  →", "mission-button mission-button--primary", () => {
            try {
                if (mission) updateCreatorStage("destination");
                else createDraft(name.value);
            } catch (error) {
                setFeedback(error.message);
            }
        });
        copy.appendChild(begin);
        intro.append(insignia, copy);
        stageContent.appendChild(intro);
        stageContent.appendChild(node("p", "mission-guidance", "Your saved astronaut colour and emblem travel with you through every planning stage."));
    }

    function renderCurrentStage(mission) {
        stageContent.replaceChildren();
        const stage = stages.find((item) => item.id === activeStage) || stages[0];
        const index = stages.indexOf(stage);
        document.getElementById("mission-stage-number").textContent =
            `${String(index + 1).padStart(2, "0")} / ${String(stages.length).padStart(2, "0")}`;
        document.getElementById("mission-stage-kicker").textContent =
            `PLANNING STAGE ${String(index + 1).padStart(2, "0")} · ${stage.id.replaceAll("-", " ").toUpperCase()}`;
        document.getElementById("mission-stage-title").textContent = stage.title;
        document.getElementById("mission-stage-description").textContent = stage.description;
        if (stage.id === "headquarters") renderHeadquarters(mission);
        else if (!mission) stageContent.appendChild(node("p", "mission-guidance", "Open a flight file before making mission decisions."));
        else if (stage.id === "destination") renderDestinationStage(mission);
        else if (stage.id === "objectives") renderObjectivesStage(mission);
        else if (stage.id === "architecture") renderArchitectureStage(mission);
        else if (stage.id === "instruments") renderInstrumentStage(mission);
        else if (["propulsion", "power", "communications", "navigation"].includes(stage.id)) {
            renderChoiceStage(stage, mission);
        } else if (stage.id === "journey") renderJourneyStage(mission);
        else if (stage.id === "constraints") renderConstraintsStage(mission);
        else if (stage.id === "review") renderReviewStage(mission);

        missionEducation.renderCompanion(stage.id, mission);
        stageWrap.classList.remove("is-entering");
        void stageWrap.offsetWidth;
        stageWrap.classList.add("is-entering");
        renderProgress(mission);
        updateReview(mission);
        renderBlueprint(mission);
        syncNavigation(mission, index);
        const environment = stage.id === "destination"
            ? "destination"
            : ["architecture", "propulsion", "power", "instruments", "communications", "navigation", "constraints"].includes(stage.id)
                ? "engineering"
                : stage.id === "review"
                    ? "file"
                    : "galaxy";
        window.BeyondEarthGalaxyAtmosphere?.setEnvironment?.(environment);
    }

    function renderProgress(mission) {
        progress.replaceChildren();
        stages.forEach((stage, index) => {
            const item = makeButton(
                `${String(index + 1).padStart(2, "0")} ${stage.title}`,
                `mission-progress-step${activeStage === stage.id ? " is-current" : ""}${index < stages.findIndex((entry) => entry.id === activeStage) ? " is-past" : ""}`,
                () => {
                    if (!mission && stage.id !== "headquarters") return;
                    updateCreatorStage(stage.id);
                    window.SpaceAudio?.playSFX?.("tab");
                },
                { "aria-current": activeStage === stage.id ? "step" : "false" },
            );
            item.disabled = !mission && stage.id !== "headquarters";
            progress.appendChild(item);
        });
    }

    function syncNavigation(mission, index) {
        const previous = document.getElementById("mission-previous");
        const next = document.getElementById("mission-next");
        const newHeadquarters = activeStage === "headquarters" && !mission;
        previous.hidden = index === 0;
        next.hidden = newHeadquarters || activeStage === "review";
        next.textContent = index === stages.length - 2 ? "OPEN MISSION DOSSIER →" : "NEXT STAGE →";
        document.getElementById("mission-save").hidden = !mission;
        document.getElementById("mission-draft-cancel").hidden = !mission;
        document.getElementById("mission-approve").hidden = activeStage !== "review"
            || !mission
            || mission.status !== "draft"
            || reviewStatus.dataset.status !== "suitable";
        if (newHeadquarters) {
            next.hidden = true;
            document.getElementById("mission-save").hidden = true;
            document.getElementById("mission-draft-cancel").hidden = true;
        }
    }

    function navigateToNext() {
        const index = stages.findIndex((stage) => stage.id === activeStage);
        if (index >= stages.length - 1) return;
        const mission = selectedMission();
        if (!mission) return;
        if (activeStage === "destination" && !mission.destination.id) {
            setFeedback("Select a destination before moving on.");
            return;
        }
        if (activeStage === "objectives" && !mission.objectives.primaryId) {
            setFeedback("Choose a primary science objective first.");
            return;
        }
        if (activeStage === "architecture" && !mission.spacecraft.architectureId) {
            setFeedback("Choose a spacecraft architecture before selecting equipment.");
            return;
        }
        updateCreatorStage(stages[index + 1].id);
    }

    function navigateToPrevious() {
        const index = stages.findIndex((stage) => stage.id === activeStage);
        if (index > 0) updateCreatorStage(stages[index - 1].id);
    }

    function renderProgressMessage(message) {
        setFeedback(message);
        window.setTimeout(() => {
            if (formFeedback.textContent === message) formFeedback.textContent = "";
        }, 2600);
    }

    function updateReview(mission) {
        if (!mission) {
            reviewStatus.textContent = "NOT REVIEWED";
            reviewStatus.dataset.status = "incomplete";
            reviewIssues.replaceChildren(node("li", "mission-empty", "Start a flight file to run a design review."));
            return;
        }
        const review = missionBuilder.buildReview(mission);
        reviewStatus.textContent = review.status.toUpperCase();
        reviewStatus.dataset.status = review.status;
        reviewIssues.replaceChildren(...renderIssueList(review).children);
    }

    function renderBlueprint(mission) {
        const destination = currentDestination(mission);
        const architecture = currentArchitecture(mission);
        const objectives = selectedObjectives(mission)
            .map((id) => catalogs.get("objectives", id)?.name)
            .filter(Boolean);
        document.getElementById("mission-blueprint-title").textContent =
            mission?.name?.toUpperCase() || "UNFILED EXPEDITION";
        document.getElementById("mission-blueprint-destination").textContent =
            destination ? `${destination.name.toUpperCase()} · RISK ${Math.round(destination.risk * 100)}%` : "Choose a destination to begin.";
        const summary = document.getElementById("mission-blueprint-summary");
        summary.replaceChildren();
        [
            architecture?.name || "Architecture pending",
            objectives.length ? objectives.join(" · ") : "Science objectives pending",
            `${mission?.spacecraft?.scientificInstrumentIds?.length || 0} instrument${mission?.spacecraft?.scientificInstrumentIds?.length === 1 ? "" : "s"} installed`,
        ].forEach((text) => summary.appendChild(node("li", "", text)));
        const profile = window.BeyondEarthPlayer.getPersonnelFile();
        const emblem = window.BeyondEarthPlayer.getEmblems().find((item) => item.id === profile.emblem);
        const emblemHost = document.getElementById("mission-blueprint-emblem");
        emblemHost.replaceChildren(emblem ? createEmblemSvg(emblem) : node("span", "", "✦"));
        drawBlueprint(mission);
        if (destination) {
            const preview = stageContent.querySelector(".mission-destination-canvas");
            if (preview) drawPlanet(preview, destination);
        }
        blueprint.classList.remove("is-updating");
        void blueprint.offsetWidth;
        blueprint.classList.add("is-updating");
    }

    function createEmblemSvg(emblem) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 16 16");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");
        const palette = {
            A: "var(--theme-primary)",
            H: "var(--theme-highlight)",
            D: "var(--theme-dark)",
            S: "var(--theme-secondary)",
            O: "#53616a",
        };
        emblem.pixels.forEach((row, y) => {
            Array.from(row).forEach((pixel, x) => {
                if (pixel === ".") return;
                const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect.setAttribute("x", String(x));
                rect.setAttribute("y", String(y));
                rect.setAttribute("width", "1");
                rect.setAttribute("height", "1");
                rect.setAttribute("fill", palette[pixel]);
                svg.appendChild(rect);
            });
        });
        return svg;
    }

    function drawPlanet(canvas, destination) {
        const context = canvas.getContext("2d");
        if (!context) return;
        const width = canvas.width;
        const height = canvas.height;
        context.imageSmoothingEnabled = false;
        context.fillStyle = "#101827";
        context.fillRect(0, 0, width, height);
        const primary = getThemeColor("--theme-primary", "#bbc1c8");
        const highlight = getThemeColor("--theme-highlight", "#e1e3df");
        const secondary = getThemeColor("--theme-secondary", "#8a969b");
        const dark = getThemeColor("--theme-dark", "#4b5359");
        for (let i = 0; i < 22; i += 1) {
            const x = (i * 41 + 13) % width;
            const y = (i * 23 + 7) % height;
            drawCelestialStar(context, x, y, 1.5, i % 4 === 0 ? highlight : "#a7b3c5");
        }
        const x = Math.floor(width * 0.62);
        const y = Math.floor(height * 0.52);
        const radius = Math.max(18, Math.floor(Math.min(width, height) * 0.28));
        const planetBase = destination.type === "star" ? "#d7a85a"
            : destination.environmentalConditions?.atmosphere?.includes("methane") ? "#8f9b74"
                : destination.environmentalConditions?.atmosphere?.includes("carbon") ? "#bd8768"
                    : destination.type === "small-body" ? "#978a77"
                        : "#738da0";
        for (let row = -radius; row <= radius; row += 4) {
            for (let col = -radius; col <= radius; col += 4) {
                if (col * col + row * row > radius * radius) continue;
                const color = (row + col) % 12 === 0 ? primary
                    : row < -radius / 2 ? highlight
                        : row > radius / 2 ? dark : planetBase;
                context.fillStyle = color;
                context.fillRect(x + col, y + row, 4, 4);
            }
        }
        context.fillStyle = secondary;
        context.fillRect(x - radius - 5, y + 2, 6, 3);
        context.fillRect(x + radius, y - 5, 5, 3);
    }

    function getThemeColor(property, fallback) {
        return getComputedStyle(document.documentElement).getPropertyValue(property).trim() || fallback;
    }

    function drawBlueprint(mission) {
        if (!blueprintContext) return;
        const ctx = blueprintContext;
        const width = canvasWidth;
        const height = canvasHeight;
        const primary = getThemeColor("--theme-primary", "#bbc1c8");
        const highlight = getThemeColor("--theme-highlight", "#e1e3df");
        const secondary = getThemeColor("--theme-secondary", "#8a969b");
        const structural = getThemeColor("--theme-structural-trim", "#c2c8c8");
        const environment = getThemeColor("--theme-environment-primary", "#515b62");
        const destination = currentDestination(mission);
        const architecture = currentArchitecture(mission);
        const loadout = mission?.spacecraft || {};
        const phase = reducedMotion ? 0 : skyTime;
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "#0a1321";
        ctx.fillRect(0, 0, width, height);
        for (let i = 0; i < 36; i += 1) {
            const x = (i * 47 + 11) % width;
            const y = (i * 29 + Math.floor(phase * (i % 3 + 1)) + 5) % height;
            const radius = i % 8 === 0 ? 2 : 1;
            drawCelestialStar(ctx, x, y, radius, i % 8 === 0 ? highlight : "#526279");
        }
        ctx.fillStyle = "#26384d";
        ctx.fillRect(0, height - 19, width, 19);
        if (destination) {
            const x = 151;
            const y = 44;
            const radius = destination.type === "star" ? 22 : 15;
            const palette = destination.type === "star" ? "#dcad61"
                : destination.environmentalConditions?.atmosphere?.includes("methane") ? "#a3a875"
                    : destination.type === "small-body" ? "#b49a7b" : "#6f8da0";
            for (let row = -radius; row <= radius; row += 3) {
                for (let col = -radius; col <= radius; col += 3) {
                    if (col * col + row * row > radius * radius) continue;
                    ctx.fillStyle = row < -radius / 2 ? highlight : row > radius / 2 ? environment : palette;
                    ctx.fillRect(x + col, y + row, 3, 3);
                }
            }
        }
        const shipX = 64;
        const shipY = 59;
        const body = architecture?.id === "rover" ? environment : structural;
        if (architecture?.id === "rover") {
            ctx.fillStyle = body;
            ctx.fillRect(shipX - 18, shipY - 5, 34, 11);
            ctx.fillStyle = primary;
            ctx.fillRect(shipX - 7, shipY - 14, 15, 9);
            ctx.fillStyle = "#202a32";
            ctx.fillRect(shipX - 16, shipY + 6, 8, 7);
            ctx.fillRect(shipX + 4, shipY + 6, 8, 7);
            ctx.fillStyle = highlight;
            ctx.fillRect(shipX - 12, shipY - 2, 4, 3);
            if (loadout.scientificInstrumentIds?.includes("robotic-arm")) {
                ctx.fillStyle = primary;
                ctx.fillRect(shipX + 12, shipY - 12, 4, 12);
                ctx.fillRect(shipX + 12, shipY - 12, 13, 3);
            }
        } else if (architecture?.id === "lander") {
            ctx.fillStyle = body;
            ctx.fillRect(shipX - 12, shipY - 10, 25, 16);
            ctx.fillStyle = primary;
            ctx.fillRect(shipX - 6, shipY - 15, 13, 6);
            ctx.fillStyle = structural;
            ctx.fillRect(shipX - 17, shipY + 5, 4, 12);
            ctx.fillRect(shipX + 13, shipY + 5, 4, 12);
            ctx.fillRect(shipX - 20, shipY + 15, 9, 3);
            ctx.fillRect(shipX + 10, shipY + 15, 9, 3);
        } else {
            ctx.fillStyle = body;
            ctx.fillRect(shipX - 11, shipY - 9, 23, 18);
            ctx.fillStyle = primary;
            ctx.fillRect(shipX - 5, shipY - 14, 12, 6);
            ctx.fillStyle = secondary;
            ctx.fillRect(shipX - 35, shipY - 7, 21, 14);
            ctx.fillRect(shipX + 14, shipY - 7, 21, 14);
            for (let i = 0; i < 5; i += 1) {
                ctx.fillStyle = i % 2 ? structural : highlight;
                ctx.fillRect(shipX - 33 + i * 4, shipY - 5, 2, 10);
                ctx.fillRect(shipX + 16 + i * 4, shipY - 5, 2, 10);
            }
        }
        ctx.fillStyle = primary;
        ctx.fillRect(shipX - 2, shipY - 20, 3, 7);
        ctx.fillStyle = "#f3d37a";
        ctx.fillRect(shipX - 4, shipY + 10, 2, 3);
        ctx.fillRect(shipX + 2, shipY + 10, 2, 3);
        if (destination) {
            ctx.setLineDash([2, 3]);
            ctx.strokeStyle = secondary;
            ctx.beginPath();
            ctx.moveTo(shipX + 24, shipY - 8);
            ctx.quadraticCurveTo(112, 14, 136, 35);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        ctx.fillStyle = primary;
        ctx.font = "7px monospace";
        ctx.fillText(architecture?.name?.toUpperCase() || "SPACECRAFT PENDING", 5, height - 7);
        ctx.fillStyle = structural;
        ctx.fillText(destination?.name?.toUpperCase() || "DESTINATION PENDING", 112, height - 7);
    }

    function drawStagePlanet() {
        const mission = selectedMission();
        const destination = currentDestination(mission);
        const canvas = stageContent.querySelector(".mission-destination-canvas");
        if (canvas && destination) drawPlanet(canvas, destination);
    }

    function animateBlueprint(timestamp) {
        skyAnimationFrame = 0;
        if (!scene.classList.contains("active") || document.hidden || reducedMotion) return;
        if (!lastSkyTime) lastSkyTime = timestamp;
        if (timestamp - lastSkyTime > 140) {
            skyTime += (timestamp - lastSkyTime) / 1000;
            lastSkyTime = timestamp;
            drawBlueprint(selectedMission());
        }
        skyAnimationFrame = window.requestAnimationFrame(animateBlueprint);
    }

    function updateAnimationState() {
        if (reducedMotion || document.hidden || !scene.classList.contains("active")) {
            if (skyAnimationFrame) window.cancelAnimationFrame(skyAnimationFrame);
            skyAnimationFrame = 0;
            lastSkyTime = 0;
            return;
        }
        if (!skyAnimationFrame) {
            lastSkyTime = 0;
            skyAnimationFrame = window.requestAnimationFrame(animateBlueprint);
        }
    }

    function renderHistory() {
        const list = document.getElementById("mission-history-list");
        list.replaceChildren();
        const history = manager.getMissionHistory();
        if (!history.length) {
            list.appendChild(node("li", "mission-empty", "Completed and cancelled flights will be archived here."));
            return;
        }
        history.forEach((mission) => {
            const item = node("li", "mission-history-entry");
            const destination = catalogs.get("destinations", mission.destination.id);
            const time = node("time", "", new Date(mission.updatedAt).toLocaleDateString());
            time.dateTime = mission.updatedAt;
            item.append(
                node("strong", "", mission.name),
                node("span", "", `${destination?.name || "Unknown destination"} · ${mission.status.toUpperCase()}`),
                time,
            );
            const ending = mission.performance?.ending || mission.performance?.evaluation?.ending;
            if (["perfect", "damaged", "lost"].includes(ending)) {
                const review = node("button", "mission-button mission-history-review", "VIEW DEBRIEF");
                review.type = "button";
                review.dataset.missionId = mission.id;
                review.addEventListener("click", () => {
                    window.BeyondEarthMissionExperience.review(mission.id);
                });
                item.appendChild(review);
            }
            list.appendChild(item);
        });
    }

    function renderFlight(mission) {
        const plan = window.BeyondEarthMissionGenerator.buildMissionPlan(mission);
        const destination = currentDestination(mission);
        document.getElementById("mission-flight-title").textContent = mission.name;
        document.getElementById("mission-flight-status").textContent = mission.status.toUpperCase();
        document.getElementById("mission-flight-status").dataset.status = mission.status;
        document.getElementById("mission-flight-summary").textContent =
            `${destination?.name || "Unknown destination"} · ${plan.objectives.map((objective) => objective.name).join(", ") || "No objectives"} · ${plan.summary}`;
        const resources = document.getElementById("mission-resource-readings");
        resources.replaceChildren();
        [
            ["Budget", `${mission.resources.budgetCredits} credits`],
            ["Power", `${mission.resources.powerWh} Wh`],
            ["Data storage", `${mission.resources.dataStorageMb} MB`],
            ["Equipment", `${Math.round(mission.resources.equipmentCondition * 100)}%`],
        ].forEach(([label, value]) => {
            resources.append(node("dt", "", label), node("dd", "", value));
        });
        const phaseList = document.getElementById("mission-phase-list");
        phaseList.replaceChildren();
        if (!plan.activities.length) {
            phaseList.appendChild(node("li", "mission-empty", "No operational phases are defined for these objectives yet."));
        } else {
            plan.activities.forEach((phase) => {
                const item = node("li", "mission-phase");
                if (mission.currentStage === phase.id) item.classList.add("is-current");
                item.append(
                    node("strong", "", phase.name),
                    node("span", "", `${phase.category.toUpperCase()} · ${phase.required ? "REQUIRED" : "OPTIONAL"} · DIFFICULTY ${phase.difficulty}`),
                );
                phaseList.appendChild(item);
            });
        }
        document.getElementById("mission-phase-count").textContent = `${plan.activities.length} PHASE${plan.activities.length === 1 ? "" : "S"}`;
        const activeMinigame = window.BeyondEarthMinigames.getActive();
        const availableGames = mission.status === "active" ? window.BeyondEarthMinigames.getAvailable() : [];
        const sequenceRequired = ["active", "paused"].includes(mission.status);
        const availableGame = availableGames.find((game) => game.id === "payload-tetris")
            || availableGames.find((game) => game.id === "spectrum-detective")
            || null;
        const canPlayScience = Boolean(availableGame);
        const canPlayCosmicClaw = availableGames.some((game) => game.id === "cosmic-claw");
        const canPlayRadarDefence = availableGames.some((game) => game.id === "landing-zone-radar-defence");
        document.getElementById("mission-play-science").hidden = sequenceRequired || !canPlayScience || Boolean(activeMinigame);
        document.getElementById("mission-play-cosmic-claw").hidden = sequenceRequired || !canPlayCosmicClaw || Boolean(activeMinigame);
        document.getElementById("mission-play-radar-defence").hidden = sequenceRequired || !canPlayRadarDefence || Boolean(activeMinigame);
        document.getElementById("mission-end-science").hidden = sequenceRequired || !activeMinigame || activeMinigame.missionId !== mission.id;
        const description = sequenceRequired
            ? "Mission challenges launch automatically after deployment. Complete each activity to return safely."
            : availableGame?.id === "payload-tetris"
            ? "Payload Tetris is available for this mission. Load the cargo bay without exceeding the spacecraft's mass and footprint limits."
            : canPlayScience
                ? "Spectrum Detective is available for this spacecraft. Its results and science data are recorded on this mission."
                : canPlayRadarDefence
                    ? "Landing Zone — Radar Defence is ready. Protect the spacecraft through a 45-second debris descent."
                    : canPlayCosmicClaw
                        ? "Cosmic Claw is ready for a quick arcade break between mission operations."
                        : "Choose a mission-linked activity when the spacecraft and science objectives support one.";
        document.getElementById("mission-play-science").textContent = availableGame?.id === "payload-tetris" ? "PLAY PAYLOAD TETRIS" : "PLAY SCIENCE ACTIVITY";
        document.getElementById("mission-minigame-description").textContent = description;
        document.getElementById("mission-launch").hidden = mission.status !== "approved";
        document.getElementById("mission-pause").hidden = mission.status !== "active";
        document.getElementById("mission-resume").hidden = mission.status !== "paused";
        document.getElementById("mission-complete").hidden = sequenceRequired || !["active", "paused"].includes(mission.status);
        document.getElementById("mission-cancel").hidden = !["approved", "active", "paused"].includes(mission.status);
        const nextPhase = document.getElementById("mission-next-phase");
        nextPhase.hidden = mission.status !== "active" || !plan.activities.length || sequenceRequired;
        nextPhase.disabled = !plan.activities.length;
        nextPhase.textContent = mission.currentStage && plan.orderedActivities.at(-1) === mission.currentStage
            ? "FINISH FLIGHT PLAN"
            : "ADVANCE TO NEXT PHASE";
        reviewStatus.textContent = mission.approval?.compatibilityStatus?.toUpperCase() || "NOT REVIEWED";
        reviewStatus.dataset.status = mission.approval?.compatibilityStatus || "";
        document.getElementById("mission-approve").hidden = true;
    }

    function render() {
        const mission = selectedMission();
        const isPlanning = !mission || mission.status === "draft";
        builderPanel.hidden = !isPlanning;
        flightPanel.hidden = !mission || isPlanning;
        if (isPlanning) {
            activeStage = mission?.planning.creatorStage || (mission ? "destination" : "headquarters");
            renderCurrentStage(mission);
        } else {
            renderFlight(mission);
            renderBlueprint(mission);
            window.BeyondEarthGalaxyAtmosphere?.setEnvironment?.("destination");
        }
        renderHistory();
    }

    function open() {
        const profile = window.BeyondEarthPlayer.getPersonnelFile();
        if (window.BeyondEarthTheme.getColorFamily() !== profile.colorFamily) {
            window.BeyondEarthTheme.setColorFamily(profile.colorFamily);
        }
        const mission = selectedMission();
        activeStage = mission?.planning.creatorStage || (mission ? "destination" : "headquarters");
        formFeedback.textContent = "";
        flightFeedback.textContent = "";
        render();
        window.BeyondEarthScenes.show("missions-scene");
        window.BeyondEarthMissionEducation.requestNickname();
        updateAnimationState();
        window.SpaceAudio?.playSFX?.("panel-open");
    }

    function renderStage() {
        renderCurrentStage(selectedMission());
    }

    document.getElementById("mission-next").addEventListener("click", navigateToNext);
    document.getElementById("mission-previous").addEventListener("click", navigateToPrevious);
    document.getElementById("mission-save").addEventListener("click", () => {
        if (!selectedMission()) return;
        renderProgressMessage("Flight file saved. You can continue planning when you return.");
        window.BeyondEarthScenes.show("cockpit-scene");
    });
    document.getElementById("mission-approve").addEventListener("click", () => {
        try {
            window.BeyondEarthMissionExperience.openDossier(selectedMission());
            window.SpaceAudio?.playSFX?.("panel-open");
        } catch (error) {
            setFeedback(error.message);
        }
    });
    document.getElementById("mission-draft-cancel").addEventListener("click", () => {
        try {
            manager.closeMission("cancelled");
            activeStage = "headquarters";
            setFeedback("Draft cancelled and archived.");
            render();
        } catch (error) {
            setFeedback(error.message);
        }
    });
    document.getElementById("missions-back").addEventListener("click", () => {
        window.BeyondEarthScenes.show("cockpit-scene");
    });
    document.getElementById("mission-launch").addEventListener("click", () => {
        try {
            const mission = manager.getActiveMission();
            if (!mission || mission.status !== "approved") {
                throw new Error("Only an approved flight can enter deployment.");
            }
            window.BeyondEarthMissionExperience.deploy(mission);
        } catch (error) {
            setFeedback(error.message, flightFeedback);
        }
    });
    document.getElementById("mission-pause").addEventListener("click", async () => {
        try {
            const mission = manager.getActiveMission();
            const game = window.BeyondEarthMinigames.getActive();
            if (game?.missionId === mission.id) await window.BeyondEarthMinigames.pause();
            manager.transitionStatus("paused");
            render();
        } catch (error) {
            setFeedback(error.message, flightFeedback);
        }
    });
    document.getElementById("mission-resume").addEventListener("click", async () => {
        try {
            manager.transitionStatus("active");
            const game = window.BeyondEarthMinigames.getActive();
            if (game?.missionId === manager.getActiveMission()?.id) await window.BeyondEarthMinigames.resume();
            render();
        } catch (error) {
            setFeedback(error.message, flightFeedback);
        }
    });
    document.getElementById("mission-next-phase").addEventListener("click", () => {
        try {
            const mission = manager.getActiveMission();
            const plan = window.BeyondEarthMissionGenerator.buildMissionPlan(mission);
            const currentIndex = plan.orderedActivities.indexOf(mission.currentStage);
            const nextStage = currentIndex < 0
                ? plan.orderedActivities[0]
                : plan.orderedActivities[currentIndex + 1] || null;
            manager.setCurrentStage(nextStage);
            render();
        } catch (error) {
            setFeedback(error.message, flightFeedback);
        }
    });
    document.getElementById("mission-play-science").addEventListener("click", async () => {
        try {
            if (manager.getActiveMission()?.performance.minigameSequence?.length) {
                throw new Error("Complete the active mission challenge sequence instead of launching a separate activity.");
            }
            const host = document.getElementById("mission-minigame-host");
            const availableGames = window.BeyondEarthMinigames.getAvailable();
            const gameId = availableGames.find((game) => game.id === "payload-tetris")?.id
                || availableGames.find((game) => game.id === "spectrum-detective")?.id
                || availableGames[0]?.id
                || "spectrum-detective";
            host.replaceChildren();
            host.hidden = false;
            await window.BeyondEarthMinigames.start(gameId, { container: host });
            render();
        } catch (error) {
            setFeedback(error.message, flightFeedback);
        }
    });
    document.getElementById("mission-play-cosmic-claw").addEventListener("click", async () => {
        try {
            if (manager.getActiveMission()?.performance.minigameSequence?.length) {
                throw new Error("Complete the active mission challenge sequence instead of launching a separate activity.");
            }
            const host = document.getElementById("mission-minigame-host");
            host.replaceChildren();
            host.hidden = false;
            await window.BeyondEarthMinigames.start("cosmic-claw", { container: host });
            render();
        } catch (error) {
            setFeedback(error.message, flightFeedback);
        }
    });
    document.getElementById("mission-play-radar-defence").addEventListener("click", async () => {
        try {
            if (manager.getActiveMission()?.performance.minigameSequence?.length) {
                throw new Error("Complete the active mission challenge sequence instead of launching a separate activity.");
            }
            const host = document.getElementById("mission-minigame-host");
            host.replaceChildren();
            host.hidden = false;
            await window.BeyondEarthMinigames.start("landing-zone-radar-defence", { container: host });
            render();
        } catch (error) {
            setFeedback(error.message, flightFeedback);
        }
    });
    document.getElementById("mission-end-science").addEventListener("click", async () => {
        try {
            await window.BeyondEarthMinigames.dispose();
            render();
        } catch (error) {
            setFeedback(error.message, flightFeedback);
        }
    });
    document.getElementById("mission-complete").addEventListener("click", async () => {
        try {
            const mission = manager.getActiveMission();
            const sequence = mission?.performance.minigameSequence || [];
            const results = mission?.performance.minigameResults || [];
            if (sequence.length < 3 || sequence.some((id) => !results.some((result) => result.minigameId === id))) {
                throw new Error("Complete all three mission challenges before ending the flight.");
            }
            const scores = mission.performance.minigameResults
                .map((result) => result.score)
                .filter(Number.isFinite);
            const finalScore = scores.length
                ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
                : 0;
            manager.completeMission({ finalScore, experienceAward: scores.length ? 10 : 0 });
            setFeedback("Mission complete. Flight record archived.", flightFeedback);
            render();
        } catch (error) {
            setFeedback(error.message, flightFeedback);
        }
    });
    document.getElementById("mission-cancel").addEventListener("click", async () => {
        try {
            const mission = manager.getActiveMission();
            if (window.BeyondEarthMinigames.getActive()?.missionId === mission.id) {
                await window.BeyondEarthMinigames.dispose();
            }
            manager.closeMission("cancelled");
            setFeedback("Mission cancelled and archived.", flightFeedback);
            render();
        } catch (error) {
            setFeedback(error.message, flightFeedback);
        }
    });

    document.addEventListener("beyond:themechange", () => {
        drawBlueprint(selectedMission());
        drawStagePlanet();
    });
    document.addEventListener("beyond:personnelupdated", (event) => {
        const family = event.detail?.profile?.colorFamily;
        if (family && window.BeyondEarthTheme.getColorFamily() !== family) {
            window.BeyondEarthTheme.setColorFamily(family);
        }
        renderBlueprint(selectedMission());
    });
    document.addEventListener("beyond:scenechange", updateAnimationState);
    document.addEventListener("visibilitychange", updateAnimationState);
    document.addEventListener("beyond:minigameresult", render);
    document.addEventListener("beyond:minigameend", render);
    document.addEventListener("beyond:missioncompleted", render);
    document.addEventListener("beyond:missionclosed", render);
    document.addEventListener("beyond:catalogchange", () => {
        if (scene.classList.contains("active")) render();
    });

    render();
    window.BeyondEarthMissionsTab = Object.freeze({
        getSpecializedChoiceObservation,
        open,
        render,
        runApprovedMission() {
            const mission = manager.getActiveMission();
            if (!mission) {
                throw new Error("No approved flight is ready. Create and approve a flight from Mission Control first.");
            }
            if (mission.status === "approved") {
                return window.BeyondEarthMissionExperience.deploy(mission);
            }
            if (["active", "paused"].includes(mission.status)) {
                return window.BeyondEarthMissionExperience.activate(mission);
            }
            throw new Error(mission.status === "draft"
                ? "This flight is still a draft. Approve it in Mission Control before launch."
                : "This flight cannot be launched in its current state.");
        },
    });
    window.BeyondEarthMain?.syncMissionStation?.();
})();
