(() => {
    "use strict";

    const dossierDialog = document.getElementById("mission-dossier-dialog");
    const dossierFolder = document.getElementById("mission-dossier-folder");
    const dossierContent = document.getElementById("mission-dossier-content");
    const dossierTabs = [...document.querySelectorAll("[data-dossier-page]")];
    const dossierFeedback = document.getElementById("mission-dossier-feedback");
    const dossierClose = document.getElementById("mission-dossier-close");
    const dossierEdit = document.getElementById("mission-dossier-edit");
    const dossierPrevious = document.getElementById("mission-dossier-previous");
    const dossierNext = document.getElementById("mission-dossier-next");
    const dossierConfirm = document.getElementById("mission-dossier-confirm");
    const deploymentDialog = document.getElementById("mission-deployment");
    const deploymentScene = deploymentDialog.querySelector(".mission-deployment-scene");
    const deploymentCanvas = document.getElementById("mission-deployment-art");
    const deploymentContext = deploymentCanvas.getContext("2d");
    const deploymentCopy = document.getElementById("mission-deployment-copy");
    const deploymentSkip = document.getElementById("mission-deployment-skip");
    const missionPlayScene = document.getElementById("mission-play-scene");
    const missionPlayCanvas = document.getElementById("mission-play-canvas");
    const missionPlayContext = missionPlayCanvas?.getContext("2d");
    const missionPlayMissionName = document.getElementById("mission-play-mission-name");
    const missionPlayDestination = document.getElementById("mission-play-destination");
    const missionPlayStatus = document.getElementById("mission-play-status");
    const missionPlayAstronaut = document.getElementById("mission-play-astronaut");
    const missionPlayHudName = document.getElementById("mission-play-hud-name");
    const missionPlayHudDestination = document.getElementById("mission-play-hud-destination");
    const missionPlayHudActivity = document.getElementById("mission-play-hud-activity");
    const missionPlayPause = document.getElementById("mission-play-pause");
    const missionPlaySkip = document.getElementById("mission-play-skip");
    const missionPlayHost = document.getElementById("mission-play-host");
    const deploymentTimers = [];
    const PAGE_COUNT = dossierTabs.length;
    const COMPONENT_FIELDS = [
        ["propulsionSystems", "propulsionSystemId"],
        ["powerSystems", "powerSystemId"],
        ["instruments", "scientificInstrumentIds"],
        ["communicationsSystems", "communicationsSystemId"],
        ["navigationSystems", "navigationSystemId"],
        ["thermalSystems", "thermalSystemId"],
        ["components", "componentIds"],
    ];
    const REQUIRED_MINIGAME_COUNT = 3;
    const RADAR_MINIGAME_ID = "landing-zone-radar-defence";
    const MINIGAME_BRIEFINGS = Object.freeze({
        "spectrum-detective": {
            title: "Spectrum Detective",
            briefing: "Compare the unknown sample with the reference library, then submit your identification.",
            robot: "I have the analyser ready. Match the signal carefully, pilot!",
        },
        "payload-tetris": {
            title: "Payload Tetris",
            briefing: "Fit the mission equipment into the cargo bay without exceeding its mass or footprint limits.",
            robot: "Let's secure the science gear before we leave orbit!",
        },
        "landing-zone-radar-defence": {
            title: "Landing Zone — Radar Defence",
            briefing: "Read the approaching threats, change flight lanes, and protect the spacecraft through descent.",
            robot: "Radar is online. Watch the sweep and keep us clear!",
        },
        "cosmic-claw": {
            title: "Cosmic Claw",
            briefing: "Move the claw above a treasure, grab it, and collect as many mission points as you can.",
            robot: "A quick treasure run! Let's bring home something shiny!",
        },
    });
    [
        {
            id: "stellar-return",
            title: "Stellar Return",
            description: "Complete a mission with a perfect return and no critical challenge failures.",
            evaluate: ({ mission }) => mission.performance?.ending === "perfect",
        },
        {
            id: "storm-survivor",
            title: "Through the Storm",
            description: "Complete a mission after a damaged emergency return.",
            evaluate: ({ mission }) => mission.performance?.ending === "damaged",
        },
    ].forEach((achievement) => window.BeyondEarthAchievements.register(achievement));

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

    let activeDossierMissionId = null;
    let dossierReturnFocus = null;
    let dossierPage = 0;
    let dossierTimer = 0;
    let dossierCloseTimer = 0;
    let deployment = null;
    let deploymentAnimationFrame = 0;
    let sequenceBusy = false;
    let activeSequenceMissionId = null;
    let activeSequenceGameId = null;
    const displayedResultIds = new Set();

    function makeElement(tag, className = "", text = "") {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text) element.textContent = text;
        return element;
    }

    function addPageHeading(title, description) {
        const heading = makeElement("h3", "dossier-page-title", title);
        heading.id = "mission-dossier-page-title";
        const intro = makeElement("p", "dossier-page-intro", description);
        dossierContent.replaceChildren(heading, intro);
    }

    function addCard(container, label, value, detail = "", wide = false) {
        const card = makeElement("article", `dossier-data-card${wide ? " dossier-data-card--wide" : ""}`);
        card.append(makeElement("span", "", label), makeElement("strong", "", value || "Not recorded"));
        if (detail) card.appendChild(makeElement("small", "", detail));
        container.appendChild(card);
        return card;
    }

    function addList(container, entries, className, emptyMessage) {
        const list = makeElement("ul", className);
        const values = entries.filter(Boolean);
        if (values.length) {
            values.forEach((entry) => {
                const item = makeElement("li");
                if (typeof entry === "string") {
                    item.textContent = entry;
                } else {
                    if (entry.title) item.appendChild(makeElement("strong", "", entry.title));
                    if (entry.detail) item.appendChild(makeElement("span", "", entry.detail));
                }
                list.appendChild(item);
            });
        } else {
            list.appendChild(makeElement("li", "", emptyMessage));
        }
        container.appendChild(list);
        return list;
    }

    function destinationFor(mission) {
        return mission.destination?.id
            ? window.BeyondEarthCatalogs.get("destinations", mission.destination.id)
            : null;
    }

    function getSelectedEquipment(mission) {
        const selected = [];
        COMPONENT_FIELDS.forEach(([category, field]) => {
            const value = mission.spacecraft?.[field];
            const ids = Array.isArray(value) ? value : value ? [value] : [];
            ids.forEach((id) => {
                const item = window.BeyondEarthCatalogs.get(category, id);
                selected.push({
                    id,
                    category,
                    name: item?.name || id,
                    massKg: item?.massKg,
                    powerDrawW: item?.powerDrawW,
                    powerOutputW: item?.powerOutputW,
                    detail: item,
                });
            });
        });
        return selected;
    }

    function renderCoverPage(mission, destination, profile) {
        addPageHeading("Flight authorization", "The saved blueprint and crew member assigned to this expedition.");
        const grid = makeElement("div", "dossier-cover-grid");
        const crewName = profile.fullName?.trim() || profile.agentName?.trim() || "Assigned Astronaut";
        const callSign = profile.agentName?.trim() || "FLIGHT CREW";
        addCard(grid, "Mission", mission.name, `Flight file ${mission.id}`, true);
        addCard(
            grid,
            "Destination",
            destination?.name || mission.destination?.id || "Not selected",
            destination?.summary || "No destination profile is available.",
        );
        addCard(grid, "Flight status", "DRAFT · AWAITING APPROVAL", "No launch occurs until you confirm this file.");
        addCard(grid, "Mission type", mission.missionType || "Research expedition");

        const crewCard = addCard(grid, "Assigned astronaut", crewName, "", true);
        const crew = makeElement("div", "dossier-assigned-astronaut");
        crew.appendChild(window.AstronautPersonnel.createPortrait(profile));
        const identity = makeElement("div");
        identity.appendChild(makeElement("span", "", `${callSign} · ${profile.rank || "ASTRONAUT"}`));
        crew.appendChild(identity);
        crewCard.appendChild(crew);
        dossierContent.appendChild(grid);

        document.getElementById("mission-dossier-title").textContent = mission.name;
        document.getElementById("mission-dossier-cover-name").textContent = mission.name;
        document.getElementById("mission-dossier-cover-destination").textContent =
            destination?.name || mission.destination?.id || "DESTINATION UNFILED";
        const emblemPreview = window.AstronautPersonnel.createPortrait(profile);
        const emblem = emblemPreview.querySelector(".portrait-emblem");
        if (!emblem) throw new Error("The saved astronaut emblem could not be added to the mission file.");
        document.getElementById("mission-dossier-cover-emblem").replaceChildren(emblem.cloneNode(true));
    }

    function renderSciencePage(mission, plan) {
        addPageHeading("Science objectives", "The investigations and success criteria recorded in the flight file.");
        const objectiveIds = [
            mission.objectives?.primaryId,
            ...(mission.objectives?.secondaryIds || []),
        ].filter(Boolean);
        const objectives = objectiveIds.map((id) => {
            const definition = window.BeyondEarthCatalogs.get("objectives", id);
            return {
                title: `${definition?.name || id}${id === mission.objectives.primaryId ? " · PRIMARY" : ""}`,
                detail: definition?.description || definition?.summary || "Objective details are not available.",
            };
        });
        addList(dossierContent, objectives, "dossier-objective-list", "No science objectives have been selected.");

        const conditions = mission.objectives?.completionConditions || [];
        const conditionSection = makeElement("section", "dossier-page-section");
        conditionSection.appendChild(makeElement("h4", "", "Recorded success conditions"));
        addList(conditionSection, conditions, "dossier-condition-list", "No additional success conditions were recorded.");
        dossierContent.appendChild(conditionSection);

        const activitySection = makeElement("section", "dossier-page-section");
        activitySection.appendChild(makeElement("h4", "", "Generated mission activities"));
        addList(
            activitySection,
            plan.activities.map((activity) => ({
                title: activity.name,
                detail: `${activity.category.toUpperCase()} · ${activity.required ? "REQUIRED" : "OPTIONAL"} · DIFFICULTY ${activity.difficulty}`,
            })),
            "dossier-activity-list",
            "No activity templates match these objectives yet.",
        );
        dossierContent.appendChild(activitySection);
    }

    function renderSpacecraftPage(mission) {
        addPageHeading("Spacecraft & equipment", "The selected architecture, installed systems, and design figures.");
        const architecture = mission.spacecraft?.architectureId
            ? window.BeyondEarthCatalogs.get("architectures", mission.spacecraft.architectureId)
            : null;
        const facts = window.BeyondEarthSpacecraft.getDesignFacts(mission.spacecraft);
        const assessment = makeElement("div", "dossier-information-grid");
        addCard(assessment, "Architecture", architecture?.name || "Not selected", architecture?.description || "");
        addCard(
            assessment,
            "Payload mass",
            facts.payloadMassKg === null ? "Unknown" : `${facts.payloadMassKg} kg`,
            architecture?.maxPayloadMassKg ? `Capacity ${architecture.maxPayloadMassKg} kg` : "",
        );
        addCard(assessment, "Installed power draw", facts.powerDrawW === null ? "Unknown" : `${facts.powerDrawW} W`);
        addCard(assessment, "Power-system output", facts.powerOutputW === null ? "Unknown" : `${facts.powerOutputW} W`);
        dossierContent.appendChild(assessment);

        const equipmentSection = makeElement("section", "dossier-page-section");
        equipmentSection.appendChild(makeElement("h4", "", "Installed equipment"));
        const equipment = getSelectedEquipment(mission);
        addList(
            equipmentSection,
            equipment.map((item) => {
                const readings = [];
                if (Number.isFinite(item.massKg)) readings.push(`${item.massKg} kg`);
                if (Number.isFinite(item.powerDrawW)) readings.push(`${item.powerDrawW} W draw`);
                if (Number.isFinite(item.powerOutputW)) readings.push(`${item.powerOutputW} W output`);
                return {
                    title: item.name,
                    detail: readings.length ? readings.join(" · ") : item.category,
                };
            }),
            "dossier-equipment-list",
            "No spacecraft equipment has been selected.",
        );
        if (facts.missing.length) {
            addList(
                equipmentSection,
                facts.missing.map((item) => `Uncatalogued ${item.category} item: ${item.id}`),
                "dossier-issue-list",
                "",
            );
        }
        dossierContent.appendChild(equipmentSection);
    }

    function formatOperationalStage(stage) {
        if (typeof stage === "string") return stage;
        if (stage && typeof stage === "object") return stage.name || stage.label || stage.id || "Unnamed operation";
        return "";
    }

    function renderFlightPlanPage(mission, destination, plan, review) {
        addPageHeading("Flight plan & constraints", "The journey profile, reserved resources, and engineering review.");
        const overview = makeElement("div", "dossier-information-grid");
        addCard(
            overview,
            "Launch configuration",
            mission.planning?.launchConfiguration || "Not selected",
            "Stored launch choice; no launch simulation is currently attached.",
        );
        addCard(overview, "Trajectory", mission.planning?.trajectory || "Not selected");
        addCard(overview, "Mission duration", mission.planning?.durationDays === null
            ? "Not set"
            : `${mission.planning.durationDays} days`);
        addCard(overview, "Destination risk", destination?.risk === undefined
            ? "Not available"
            : `${Math.round(destination.risk * 100)}%`);
        dossierContent.appendChild(overview);

        const environmentalConditions = Object.entries(destination?.environmentalConditions || {})
            .map(([label, value]) => `${label.replaceAll("-", " ")}: ${String(value)}`);
        const environmentSection = makeElement("section", "dossier-page-section");
        environmentSection.appendChild(makeElement("h4", "", "Destination conditions"));
        addList(
            environmentSection,
            environmentalConditions,
            "dossier-condition-list",
            "No environmental readings are available for this destination.",
        );
        dossierContent.appendChild(environmentSection);

        const resources = mission.resources || {};
        const resourceGrid = makeElement("div", "dossier-information-grid");
        addCard(resourceGrid, "Budget reserve", `${resources.budgetCredits ?? 0} credits`);
        addCard(resourceGrid, "Payload reserve", `${resources.massKg ?? 0} kg`);
        addCard(resourceGrid, "Power reserve", `${resources.powerWh ?? 0} Wh`);
        addCard(resourceGrid, "Propellant", `${resources.fuelKg ?? 0} kg`);
        addCard(resourceGrid, "Data storage", `${resources.dataStorageMb ?? 0} MB`);
        addCard(resourceGrid, "Communications margin", `${resources.communicationsMarginDb ?? 0} dB`);
        addCard(resourceGrid, "Equipment condition", `${Math.round((resources.equipmentCondition ?? 0) * 100)}%`);
        dossierContent.appendChild(resourceGrid);

        const compromises = Array.isArray(mission.planning?.acceptedCompromises)
            ? mission.planning.acceptedCompromises
            : [];
        const compromiseSection = makeElement("section", "dossier-page-section");
        compromiseSection.appendChild(makeElement("h4", "", "Accepted trade-offs"));
        addList(
            compromiseSection,
            compromises.map((item) => typeof item === "string" ? item : item?.label || item?.name || ""),
            "dossier-condition-list",
            "No accepted trade-offs are recorded in this flight file.",
        );
        dossierContent.appendChild(compromiseSection);

        const stages = (mission.planning?.operationalStages || []).map(formatOperationalStage).filter(Boolean);
        if (stages.length) {
            const operations = makeElement("section", "dossier-page-section");
            operations.appendChild(makeElement("h4", "", "Recorded operational stages"));
            addList(operations, stages, "dossier-condition-list", "");
            dossierContent.appendChild(operations);
        }

        const reviewSection = makeElement("section", "dossier-page-section");
        reviewSection.appendChild(makeElement("h4", "", `Engineering review · ${review.status.toUpperCase()}`));
        addList(
            reviewSection,
            review.issues.map((issue) => ({
                title: issue.message,
                detail: issue.severity ? issue.severity.toUpperCase() : "REVIEW",
            })),
            "dossier-issue-list",
            "No compatibility issues found.",
        );
        if (plan.warnings.length) {
            addList(reviewSection, plan.warnings, "dossier-issue-list", "");
        }
        dossierContent.appendChild(reviewSection);
    }

    function renderDossierPage(mission, profile, page) {
        const destination = destinationFor(mission);
        const plan = window.BeyondEarthMissionGenerator.buildMissionPlan(mission);
        const review = window.BeyondEarthMissionBuilder.buildReview(mission);
        if (page === 0) renderCoverPage(mission, destination, profile);
        else if (page === 1) renderSciencePage(mission, plan);
        else if (page === 2) renderSpacecraftPage(mission);
        else renderFlightPlanPage(mission, destination, plan, review);

        dossierTabs.forEach((tab, index) => {
            tab.setAttribute("aria-selected", String(index === page));
            tab.setAttribute("tabindex", index === page ? "0" : "-1");
        });
        document.getElementById("mission-dossier-page-count").textContent =
            `PAGE ${page + 1} / ${PAGE_COUNT}`;
        dossierPrevious.disabled = page === 0;
        dossierNext.disabled = page === PAGE_COUNT - 1;
        dossierNext.textContent = page === PAGE_COUNT - 1 ? "FILE COMPLETE" : "NEXT PAGE →";
        dossierContent.classList.remove("is-flipping");
        void dossierContent.offsetWidth;
        dossierContent.classList.add("is-flipping");
    }

    function setDossierPage(page) {
        if (!activeDossierMissionId || !dossierDialog.open) return;
        const mission = window.BeyondEarthMissionManager.getActiveMission();
        if (!mission || mission.id !== activeDossierMissionId || mission.status !== "draft") {
            dossierFeedback.textContent = "This flight file changed while open. Close it and return to mission control.";
            return;
        }
        dossierPage = Math.max(0, Math.min(PAGE_COUNT - 1, page));
        renderDossierPage(mission, window.BeyondEarthPlayer.getPersonnelFile(), dossierPage);
    }

    function setGalaxyEnvironment(environment) {
        window.BeyondEarthGalaxyAtmosphere?.setEnvironment(environment);
    }

    function finishDossierClose(action) {
        window.clearTimeout(dossierCloseTimer);
        window.clearTimeout(dossierTimer);
        dossierTimer = 0;
        dossierCloseTimer = 0;
        dossierFolder.classList.remove("is-open", "is-opening");
        dossierDialog.classList.remove("is-closing");
        if (dossierDialog.open) dossierDialog.close();
        activeDossierMissionId = null;
        dossierFeedback.textContent = "";
        setGalaxyEnvironment(action === "approved" ? "galaxy" : "file");

        if (action === "approved") {
            window.BeyondEarthScenes.show("cockpit-scene");
            window.BeyondEarthMain?.syncMissionStation?.();
            document.querySelector(".station-run-mission")?.focus({ preventScroll: true });
        } else if (dossierReturnFocus?.isConnected) {
            dossierReturnFocus.focus({ preventScroll: true });
        }
    }

    function closeDossier(action = "editing") {
        if (!dossierDialog.open) return;
        dossierDialog.classList.add("is-closing");
        const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 420;
        dossierCloseTimer = window.setTimeout(() => finishDossierClose(action), delay);
    }

    function openDossier(mission) {
        if (!mission || mission.status !== "draft") {
            throw new Error("Only a saved mission draft can be opened for flight approval.");
        }
        if (dossierDialog.open) return;
        const active = window.BeyondEarthMissionManager.getActiveMission();
        if (!active || active.id !== mission.id || active.status !== "draft") {
            throw new Error("The saved mission draft changed before its dossier could be opened.");
        }
        const profile = window.BeyondEarthPlayer.getPersonnelFile();
        if (window.BeyondEarthTheme.getColorFamily() !== profile.colorFamily) {
            window.BeyondEarthTheme.setColorFamily(profile.colorFamily);
        }
        dossierReturnFocus = document.activeElement;
        activeDossierMissionId = active.id;
        dossierPage = 0;
        dossierFeedback.textContent = "";
        renderDossierPage(active, profile, dossierPage);
        setGalaxyEnvironment("file");
        dossierDialog.showModal();
        document.dispatchEvent(new CustomEvent("beyond:missionapprovalopen", {
            detail: { mission: active },
        }));
        dossierFolder.classList.remove("is-open", "is-opening");
        void dossierFolder.offsetWidth;
        dossierFolder.classList.add("is-opening");
        dossierTimer = window.setTimeout(() => {
            dossierFolder.classList.remove("is-opening");
            dossierFolder.classList.add("is-open");
        }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900);
        dossierClose.focus({ preventScroll: true });
    }

    function approveDossierMission() {
        const active = window.BeyondEarthMissionManager.getActiveMission();
        if (!active || active.id !== activeDossierMissionId || active.status !== "draft") {
            dossierFeedback.textContent = "This mission is no longer an editable draft.";
            return;
        }
        try {
            window.BeyondEarthMissionBuilder.approveMission();
            window.SpaceAudio?.playSFX?.("success");
            closeDossier("approved");
        } catch (error) {
            dossierFeedback.textContent = error.message || "Mission approval failed. Review the design checks and try again.";
        }
    }

    function cssColor(name, fallback) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
    }

    function drawDeploymentArt(mission, phase, profile = deployment?.profile) {
        const ctx = deploymentContext;
        const width = deploymentCanvas.width;
        const height = deploymentCanvas.height;
        const primary = cssColor("--theme-primary", "#bbc1c8");
        const highlight = cssColor("--theme-highlight", "#e1e3df");
        const secondary = cssColor("--theme-secondary", "#8a969b");
        const dark = cssColor("--theme-dark", "#26333c");
        const now = performance.now();
        const phaseElapsed = Math.max(0, now - (deployment?.phaseStartedAt || now));
        const progress = Math.min(1, phaseElapsed / 1850);
        const ease = progress * progress * (3 - 2 * progress);

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#070c18";
        ctx.fillRect(0, 0, width, height);

        for (let index = 0; index < 78; index += 1) {
            const x = (index * 47 + 13) % width;
            const y = (index * 31 + 9) % height;
            const size = index % 13 === 0 ? 2 : 1;
            ctx.globalAlpha = index % 5 === 0 ? 0.9 : 0.48;
            drawCelestialStar(ctx, x, y, size, index % 5 === 0 ? highlight : secondary);
        }
        ctx.globalAlpha = 1;

        const destination = destinationFor(mission);
        let planet = "#566976";
        let planetLight = "#aabfc7";
        if (/ice|icy|moon/i.test(destination?.type || "")) {
            planet = "#637d8c";
            planetLight = "#d2e8ef";
        } else if (/atmosphere|gas|planetary/i.test(destination?.type || "")) {
            planet = "#8b6656";
            planetLight = "#ddb18b";
        } else if (/star|solar/i.test(destination?.type || "")) {
            planet = "#8b744b";
            planetLight = "#f0d384";
        }
        const planetX = 276;
        const planetY = 48;
        const radius = 28;
        for (let y = -radius; y <= radius; y += 4) {
            for (let x = -radius; x <= radius; x += 4) {
                if (x * x + y * y > radius * radius) continue;
                ctx.fillStyle = Math.floor((y + radius) / 8) % 3 === 0 ? planetLight : planet;
                ctx.fillRect(planetX + x, planetY + y, 4, 4);
            }
        }

        const architecture = mission.spacecraft?.architectureId || "";
        const hull = "#d9dedb";
        ctx.fillStyle = "#252e37";
        ctx.fillRect(38, 78, 70, 28);
        ctx.fillRect(106, 82, 13, 20);
        ctx.fillStyle = hull;
        ctx.fillRect(45, 74, 62, 28);
        ctx.fillRect(107, 81, 13, 16);
        ctx.fillStyle = primary;
        ctx.fillRect(58, 68, 28, 6);
        ctx.fillRect(62, 102, 24, 6);
        ctx.fillRect(76, 80, 14, 14);
        ctx.fillStyle = highlight;
        ctx.fillRect(111, 84, 6, 9);
        ctx.fillStyle = "#5f7482";
        ctx.fillRect(28, 84, 10, 16);
        if (/rover|surface/i.test(architecture)) {
            ctx.fillStyle = "#202832";
            ctx.fillRect(48, 103, 13, 9);
            ctx.fillRect(88, 103, 13, 9);
            ctx.fillStyle = secondary;
            ctx.fillRect(51, 105, 7, 4);
            ctx.fillRect(91, 105, 7, 4);
        }
        if (mission.spacecraft?.powerSystemId) {
            ctx.fillStyle = "#63768b";
            ctx.fillRect(52, 60, 5, 8);
            ctx.fillRect(91, 60, 5, 8);
            ctx.fillRect(50, 59, 2, 10);
            ctx.fillRect(96, 59, 2, 10);
        }

        const hatchOpen = ["airlock", "departure", "arrival"].includes(phase);
        ctx.fillStyle = hatchOpen ? primary : "#65747b";
        ctx.fillRect(117, 82, 5, 20);
        ctx.fillStyle = dark;
        ctx.fillRect(hatchOpen ? 118 : 113, 83, 2, 18);

        if (phase === "departure") {
            ctx.fillStyle = "#f0d384";
            ctx.fillRect(24, 89, 11, 6);
            ctx.fillStyle = "#d78360";
            ctx.fillRect(17, 90, 7, 4);
        }

        let astronautX = 0;
        let astronautY = 0;
        let astronautVisible = true;
        if (phase === "activation") {
            astronautVisible = false;
        } else if (phase === "crew") {
            astronautX = 91;
            astronautY = 74;
        } else if (phase === "airlock") {
            astronautX = 103;
            astronautY = 72;
        } else if (phase === "departure") {
            astronautX = 108 + Math.round(78 * ease);
            astronautY = 72 - Math.round(19 * ease);
        } else {
            astronautX = 186 + Math.round(49 * ease);
            astronautY = 53 + Math.round(11 * ease);
        }

        if (astronautVisible) {
            const pixel = 2;
            const sprite = [
                "....HHHHHH....",
                "...HAAAAAAH...",
                "..HAAAAAAAAH..",
                "..HAAFFFFAAH..",
                "..HAAFFFFAAH..",
                "..HAAFFFFAAH..",
                "...HAAAAAAH...",
                "....HHHHHH....",
                ".....TTTT.....",
                "...PPPPPPPP...",
                "..PPPPPPPPPP..",
                "..PPPTPPPPPP..",
                ".PPPPPPPPPPPP.",
                ".PPPPPPPPPPPP.",
                "..PPP....PPP..",
                "..PPP....PPP..",
                "..SSS....SSS..",
                "..SSS....SSS..",
                "..HHH....HHH..",
            ];
            const colors = {
                H: primary,
                A: highlight,
                F: "#54717b",
                T: secondary,
                P: primary,
                S: secondary,
            };
            sprite.forEach((row, y) => {
                Array.from(row).forEach((pixelType, x) => {
                    if (pixelType === ".") return;
                    ctx.fillStyle = colors[pixelType];
                    ctx.fillRect(astronautX + x * pixel, astronautY + y * pixel, pixel, pixel);
                });
            });

            const emblem = deployment?.emblem;
            if (emblem) {
                const emblemColors = { A: primary, H: highlight, D: dark, S: secondary, O: "#53616a" };
                emblem.pixels.forEach((row, y) => {
                    Array.from(row).forEach((pixelType, x) => {
                        if (pixelType === ".") return;
                        ctx.fillStyle = emblemColors[pixelType];
                        ctx.fillRect(astronautX + 8 + Math.floor(x / 4), astronautY + 22 + Math.floor(y / 4), 1, 1);
                    });
                });
            }

            if (phase === "departure" && progress < 0.62) {
                ctx.fillStyle = secondary;
                const tetherEnd = astronautX + 5;
                for (let x = 119; x < tetherEnd; x += 4) {
                    ctx.fillRect(x, 84 - Math.round(12 * ease), 2, 1);
                }
            }
        }
    }

    function scheduleDeploymentAnimation() {
        if (deploymentAnimationFrame) window.cancelAnimationFrame(deploymentAnimationFrame);
        const animate = () => {
            deploymentAnimationFrame = 0;
            if (!deployment || !deploymentDialog.open) return;
            drawDeploymentArt(deployment.mission, deployment.phase, deployment.profile);
            if (["departure", "arrival"].includes(deployment.phase)) {
                deploymentAnimationFrame = window.requestAnimationFrame(animate);
            }
        };
        deploymentAnimationFrame = window.requestAnimationFrame(animate);
    }

    function setDeploymentPhase(phase, copy, cue = "") {
        if (!deployment) return;
        deployment.phase = phase;
        deployment.phaseStartedAt = performance.now();
        deploymentScene.dataset.phase = phase;
        deploymentCopy.textContent = copy;
        deploymentSkip.textContent = phase === "arrival" ? "CONTINUE TO MISSION →" : "SKIP CUTSCENE";
        drawDeploymentArt(deployment.mission, phase, deployment.profile);
        if (["departure", "arrival"].includes(phase)) scheduleDeploymentAnimation();
        if (cue) window.SpaceAudio?.playSFX?.(cue);
    }

    function clearDeploymentTimers() {
        while (deploymentTimers.length) window.clearTimeout(deploymentTimers.pop());
        if (deploymentAnimationFrame) {
            window.cancelAnimationFrame(deploymentAnimationFrame);
            deploymentAnimationFrame = 0;
        }
    }

    function setMissionPlayPhase(statusText, activityName = "Mission activity") {
        if (missionPlayStatus) missionPlayStatus.textContent = statusText;
        if (missionPlayHudActivity) missionPlayHudActivity.textContent = activityName;
    }

    function chooseMissionEnvironment(destinationId) {
        const lookup = (destinationId || "").toLowerCase();
        if (/(ice|cryo|europa|titan|pluto|glacier)/.test(lookup)) return "ice";
        if (/(mars|desert|dune|arid|red)/.test(lookup)) return "desert";
        if (/(venus|gas|atmosphere|cloud|storm)/.test(lookup)) return "storm";
        if (/(moon|luna|asteroid|crater)/.test(lookup)) return "moon";
        if (/(station|orbit|ring|orbital|earth)/.test(lookup)) return "orbit";
        return "destination";
    }

    function drawMissionPlayScene() {
        if (!missionPlayCanvas || !missionPlayContext) return;
        const canvas = missionPlayCanvas;
        const ctx = missionPlayContext;
        const rect = missionPlayScene?.getBoundingClientRect?.() || { width: 1024, height: 680 };
        const pixelScale = 4;
        const width = Math.max(1, Math.ceil(rect.width / pixelScale));
        const height = Math.max(1, Math.ceil(rect.height / pixelScale));
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
        const themeStyles = getComputedStyle(document.documentElement);
        const accent = themeStyles.getPropertyValue("--theme-primary").trim() || "#a98cd4";
        const secondary = themeStyles.getPropertyValue("--theme-secondary").trim() || "#c5a9df";
        const ambient = themeStyles.getPropertyValue("--theme-ambient-lighting").trim() || "#b6a2d8";
        const env = chooseMissionEnvironment(missionPlayScene?.dataset?.destination || "");
        const bg = ctx.createLinearGradient(0, 0, 0, height);
        bg.addColorStop(0, env === "storm" ? "#201a2a" : "#080d25");
        bg.addColorStop(0.58, env === "ice" ? "#27425a" : env === "storm" ? "#594238" : "#14213d");
        bg.addColorStop(1, env === "desert" ? "#5b342d" : env === "ice" ? "#7898a9" : "#0d1726");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);

        const starCount = Math.max(90, Math.floor((width * height) / 180));
        for (let index = 0; index < starCount; index += 1) {
            const x = (index * 73 + 19) % width;
            const y = (index * 59 + 11) % Math.max(1, Math.floor(height * 0.72));
            const size = index % 7 === 0 ? 2 : 1;
            const color = index % 5 === 0 ? "rgba(255,255,255,0.9)" : `rgba(203, 219, 255, ${0.35 + ((index % 7) / 44)})`;
            drawCelestialStar(ctx, x, y, size, color);
        }

        if (env === "orbit") {
            const baseX = Math.round(width * 0.73);
            const baseY = Math.round(height * 0.96);
            const radius = Math.ceil(Math.max(width, height) * 0.53);
            ctx.fillStyle = "#18365a";
            ctx.beginPath();
            ctx.arc(baseX, baseY, radius, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#3976a0";
            ctx.fillRect(0, Math.round(height * 0.84), width, Math.ceil(height * 0.16));
            ctx.fillStyle = "#89c8d8";
            ctx.fillRect(0, Math.round(height * 0.83), width, Math.max(1, Math.round(height * 0.018)));
            for (let i = 0; i < 13; i += 1) {
                const x = (i * 47 + 13) % width;
                const y = Math.round(height * 0.88) + (i % 3) * Math.max(1, Math.round(height * 0.025));
                ctx.fillStyle = i % 2 ? "#34708f" : "#4e8ba6";
                ctx.fillRect(x, y, Math.max(3, Math.round(width * 0.055)), Math.max(1, Math.round(height * 0.025)));
            }
        } else {
            const horizon = Math.round(height * (env === "storm" ? 0.7 : 0.62));
            const surfaceColors = env === "ice"
                ? ["#a6d7e8", "#d0eff5", "#6f9bad"]
                : env === "desert"
                    ? ["#9f5d42", "#d28a5d", "#633c37"]
                    : env === "storm"
                        ? ["#66514a", "#a57c59", "#493d48"]
                        : env === "moon"
                            ? ["#687583", "#9aa1a4", "#404c5d"]
                            : [secondary, ambient, "#34425a"];
            ctx.fillStyle = surfaceColors[0];
            ctx.fillRect(0, horizon, width, height - horizon);

            ctx.fillStyle = surfaceColors[2];
            ctx.beginPath();
            ctx.moveTo(0, horizon);
            for (let i = 0; i <= 12; i += 1) {
                const x = Math.round((i / 12) * width);
                const y = horizon - Math.round(height * (0.04 + ((i * 17) % 8) * 0.012));
                ctx.lineTo(x, y);
            }
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = surfaceColors[1];
            for (let i = 0; i < 17; i += 1) {
                const x = (i * 41 + 17) % width;
                const y = horizon + Math.round(height * (0.1 + (i % 5) * 0.055));
                ctx.fillRect(x, y, Math.max(2, Math.round(width * (0.015 + (i % 3) * 0.008))), Math.max(1, Math.round(height * 0.012)));
            }

            if (env === "ice") {
                ctx.fillStyle = "#d8f4fa";
                for (let i = 0; i < 7; i += 1) {
                    const x = Math.round(width * (0.08 + i * 0.13));
                    const peakY = horizon - Math.round(height * (0.11 + (i % 3) * 0.035));
                    ctx.fillRect(x, peakY, Math.max(2, Math.round(width * 0.025)), Math.round(height * 0.11));
                }
            } else if (env === "storm") {
                ctx.fillStyle = "rgba(255, 220, 148, 0.8)";
                for (let i = 0; i < 5; i += 1) {
                    const x = Math.round(width * (0.2 + i * 0.14));
                    ctx.fillRect(x, Math.round(height * 0.2), Math.max(1, Math.round(width * 0.004)), Math.round(height * 0.11));
                    ctx.fillRect(x - 2, Math.round(height * 0.31), Math.max(2, Math.round(width * 0.018)), Math.max(1, Math.round(height * 0.008)));
                }
            } else if (env === "moon") {
                ctx.fillStyle = "rgba(34, 45, 59, 0.58)";
                for (let i = 0; i < 6; i += 1) {
                    const x = Math.round(width * (0.08 + i * 0.16));
                    const y = Math.round(height * (0.72 + (i % 2) * 0.12));
                    ctx.fillRect(x, y, Math.max(4, Math.round(width * 0.07)), Math.max(1, Math.round(height * 0.012)));
                    ctx.fillRect(x + Math.round(width * 0.015), y - Math.round(height * 0.018), Math.max(2, Math.round(width * 0.04)), Math.max(1, Math.round(height * 0.018)));
                }
            }
        }

        ctx.fillStyle = "rgba(13, 18, 29, 0.42)";
        ctx.fillRect(0, height - Math.max(3, Math.round(height * 0.025)), width, Math.max(3, Math.round(height * 0.025)));
        ctx.fillStyle = accent;
        ctx.fillRect(Math.round(width * 0.08), height - Math.max(3, Math.round(height * 0.025)), Math.round(width * 0.38), Math.max(1, Math.round(height * 0.006)));
    }

    function renderMissionPlayScene(mission, destination, profile = window.BeyondEarthPlayer.getPersonnelFile()) {
        if (!missionPlayScene) return;
        const name = mission?.name || "MISSION";
        const destinationName = destination?.name || mission?.destination?.id || "DESTINATION";
        missionPlayMissionName.textContent = name;
        missionPlayDestination.textContent = destinationName;
        missionPlayHudName.textContent = name;
        missionPlayHudDestination.textContent = destinationName;
        missionPlayScene.dataset.destination = destination?.id || mission?.destination?.id || "destination";
        missionPlayScene.classList.remove("has-mission-ending");
        delete missionPlayScene.dataset.ending;
        drawMissionPlayScene();
        if (missionPlayAstronaut) {
            missionPlayAstronaut.replaceChildren();
            missionPlayAstronaut.classList.remove("is-celebrating");
            delete missionPlayAstronaut.dataset.ending;
            const portrait = window.AstronautPersonnel?.createPortrait?.(profile);
            if (portrait) missionPlayAstronaut.appendChild(portrait);
        }
        missionPlayPause.textContent = "PAUSE";
        missionPlayPause.hidden = false;
        missionPlaySkip.textContent = "SKIP TO GAMEPLAY";
        missionPlaySkip.hidden = false;
        setMissionPlayPhase("MISSION AUTHORISED", "Mission activity");
    }

    function minigameWeight(id, mission) {
        const objectives = [
            mission.missionType,
            mission.destination?.id,
            mission.objectives?.primaryId,
            ...(mission.objectives?.secondaryIds || []),
            ...(mission.objectives?.requiredInstrumentIds || []),
        ].filter(Boolean).join(" ").toLowerCase();
        const spacecraft = Object.values(mission.spacecraft || {}).flat().filter(Boolean).join(" ").toLowerCase();
        if (id === "spectrum-detective") return 2 + (/spectrum|spectrometer|atmospher|water|ice|geolog|mineral|science/.test(`${objectives} ${spacecraft}`) ? 8 : 0);
        if (id === "payload-tetris") return 3 + (/sample|payload|lander|rover|surface|return|instrument/.test(`${objectives} ${spacecraft}`) ? 5 : 0);
        if (id === RADAR_MINIGAME_ID) return 2 + (/landing|atmospher|thermal|radiation|navigation|descent|surface/.test(`${objectives} ${spacecraft}`) ? 5 : 0);
        if (id === "cosmic-claw") return 1.5;
        return 1;
    }

    function selectMinigameSequence(mission, available) {
        const pool = available.filter((game) => MINIGAME_BRIEFINGS[game.id]);
        if (pool.length < REQUIRED_MINIGAME_COUNT) {
            throw new Error(`Only ${pool.length} playable mission challenges are available. At least ${REQUIRED_MINIGAME_COUNT} are required.`);
        }
        const selected = [];
        const candidates = pool.filter((game) => game.id !== RADAR_MINIGAME_ID);
        while (selected.length < REQUIRED_MINIGAME_COUNT && candidates.length) {
            const totalWeight = candidates.reduce((sum, game) => sum + minigameWeight(game.id, mission), 0);
            let choice = Math.random() * totalWeight;
            let selectedIndex = candidates.length - 1;
            for (let index = 0; index < candidates.length; index += 1) {
                choice -= minigameWeight(candidates[index].id, mission);
                if (choice < 0) {
                    selectedIndex = index;
                    break;
                }
            }
            selected.push(candidates.splice(selectedIndex, 1)[0].id);
        }
        if (selected.length < REQUIRED_MINIGAME_COUNT) {
            const radarDefence = pool.find((game) => game.id === RADAR_MINIGAME_ID);
            if (radarDefence) selected.push(radarDefence.id);
        }
        if (selected.length < REQUIRED_MINIGAME_COUNT) {
            throw new Error(`Only ${selected.length} mission challenges can be selected. At least ${REQUIRED_MINIGAME_COUNT} are required.`);
        }
        return selected;
    }

    function ensureMinigameSequence(mission) {
        const savedSequence = mission.performance?.minigameSequence || [];
        if (savedSequence.length >= REQUIRED_MINIGAME_COUNT) {
            const registeredIds = new Set(window.BeyondEarthMinigames.list().map((game) => game.id));
            const missing = savedSequence.filter((id) => !registeredIds.has(id));
            if (missing.length) {
                throw new Error(`Saved mission challenges are unavailable: ${missing.join(", ")}.`);
            }
            return savedSequence.slice(0, REQUIRED_MINIGAME_COUNT);
        }
        const selected = selectMinigameSequence(mission, window.BeyondEarthMinigames.getAvailable());
        const saved = window.BeyondEarthMissionManager.updateActiveMission((draft) => {
            if (draft.performance.minigameSequence.length < REQUIRED_MINIGAME_COUNT) {
                draft.performance.minigameSequence = selected;
            }
        });
        return saved.performance.minigameSequence.slice(0, REQUIRED_MINIGAME_COUNT);
    }

    function getCompletedMinigameIds(mission) {
        return new Set((mission.performance?.minigameResults || [])
            .filter((result) => result.status !== "aborted")
            .map((result) => result.minigameId));
    }

    function getSavedSequenceResult(mission, minigameId) {
        return (mission.performance?.minigameResults || [])
            .find((result) => result.minigameId === minigameId && result.status !== "aborted");
    }

    function resultPercentage(result) {
        if (Number.isFinite(result.normalizedPercentage)) return Math.max(0, Math.min(100, result.normalizedPercentage));
        if (Number.isFinite(result.performanceRating)) return Math.round(Math.max(0, Math.min(1, result.performanceRating)) * 100);
        return Number.isFinite(result.score) ? Math.max(0, Math.min(100, result.score)) : 0;
    }

    function addSequenceRobot(container, message, mood = "happy", ending = "") {
        const card = makeElement("aside", `landing-zone__robot-card mission-sequence-robot${ending ? ` mission-sequence-robot--${ending}` : ""}`);
        const robot = makeElement("div", `landing-zone__robot${mood === "happy" ? " is-happy" : mood === "alert" ? " is-alert" : ""}`);
        robot.setAttribute("aria-hidden", "true");
        [
            ["landing-zone__robot-antenna"],
            ["landing-zone__robot-head"],
            ["landing-zone__robot-arm landing-zone__robot-arm--left"],
            ["landing-zone__robot-arm landing-zone__robot-arm--right"],
            ["landing-zone__robot-body"],
            ["landing-zone__robot-leg landing-zone__robot-leg--left"],
            ["landing-zone__robot-leg landing-zone__robot-leg--right"],
        ].forEach(([className]) => robot.appendChild(makeElement("span", className)));
        const eyes = makeElement("span", "landing-zone__robot-eyes");
        eyes.append(makeElement("i"), makeElement("i"));
        robot.querySelector?.(".landing-zone__robot-head")?.appendChild(eyes);
        const details = makeElement("div");
        details.append(
            makeElement("p", "landing-zone__robot-name", "UNIT R-01"),
            makeElement("p", "landing-zone__robot-message", message),
        );
        card.append(robot, details);
        const accent = getComputedStyle(document.documentElement).getPropertyValue("--theme-primary").trim();
        const highlight = getComputedStyle(document.documentElement).getPropertyValue("--theme-highlight").trim();
        if (accent) {
            card.style.setProperty("--lz-pink", accent);
            card.style.setProperty("--lz-lavender", accent);
        }
        if (highlight) card.style.setProperty("--lz-mint", highlight);
        container.appendChild(card);
        return card;
    }

    function createSequenceButton(label, callback) {
        const button = makeElement("button", "mission-experience-button mission-experience-button--approve", label);
        button.type = "button";
        button.addEventListener("click", callback);
        return button;
    }

    function showChallengeBriefing(mission, minigameId, message = "") {
        const sequence = mission.performance.minigameSequence;
        const number = sequence.indexOf(minigameId) + 1;
        const details = MINIGAME_BRIEFINGS[minigameId];
        const card = makeElement("article", "mission-sequence-card mission-sequence-card--briefing");
        card.append(
            makeElement("p", "mission-sequence-card__eyebrow", `MISSION CHALLENGE ${number} / ${REQUIRED_MINIGAME_COUNT}`),
            makeElement("h2", "mission-sequence-card__title", details.title),
            makeElement("p", "mission-sequence-card__copy", details.briefing),
        );
        const progress = makeElement("ol", "mission-sequence-progress");
        sequence.forEach((id, index) => {
            const step = makeElement("li", index + 1 === number ? "is-current" : index + 1 < number ? "is-complete" : "");
            step.textContent = `${String(index + 1).padStart(2, "0")} · ${MINIGAME_BRIEFINGS[id].title}`;
            progress.appendChild(step);
        });
        card.append(progress);
        if (message) card.appendChild(makeElement("p", "mission-sequence-card__notice", message));
        addSequenceRobot(card, details.robot);
        card.appendChild(createSequenceButton("START CHALLENGE", () => startSequenceMinigame(minigameId)));
        missionPlayHost.replaceChildren(card);
        missionPlayHost.hidden = false;
        missionPlayPause.hidden = true;
        missionPlaySkip.hidden = true;
        missionPlayHudActivity.textContent = `CHALLENGE ${number} / ${REQUIRED_MINIGAME_COUNT} · ${details.title}`;
        setMissionPlayPhase(`CHALLENGE ${number} READY`, details.title);
    }

    function showChallengeRetry(mission, minigameId, reason) {
        const card = makeElement("article", "mission-sequence-card mission-sequence-card--retry");
        const details = MINIGAME_BRIEFINGS[minigameId];
        const number = mission.performance.minigameSequence.indexOf(minigameId) + 1;
        card.append(
            makeElement("p", "mission-sequence-card__eyebrow", `CHALLENGE ${number} NEEDS A SCORE`),
            makeElement("h2", "mission-sequence-card__title", "Challenge not recorded"),
            makeElement("p", "mission-sequence-card__copy", reason || "This activity ended before a score was submitted. Your mission is safe; try the challenge again to continue."),
            createSequenceButton("RETRY CHALLENGE", () => showChallengeBriefing(mission, minigameId)),
        );
        addSequenceRobot(card, "No score was saved, so this challenge is still waiting for us.", "alert");
        missionPlayHost.replaceChildren(card);
        missionPlayHost.hidden = false;
        missionPlayPause.hidden = true;
        missionPlaySkip.hidden = true;
        missionPlayHudActivity.textContent = `${details.title} · RETRY REQUIRED`;
        setMissionPlayPhase("MISSION CHALLENGE INCOMPLETE", details.title);
    }

    function showChallengeResult(mission, result) {
        const key = `${mission.id}:${result.id}`;
        if (displayedResultIds.has(key)) return;
        displayedResultIds.add(key);
        const percentage = resultPercentage(result);
        const card = makeElement("article", "mission-sequence-card mission-sequence-card--result");
        const details = MINIGAME_BRIEFINGS[result.minigameId];
        const sequence = mission.performance.minigameSequence;
        const number = sequence.indexOf(result.minigameId) + 1;
        const nextId = sequence.find((id) => !getCompletedMinigameIds(mission).has(id));
        const statusText = result.status === "success" ? "OBJECTIVE COMPLETE" : result.status === "partial" ? "PARTIAL SUCCESS" : "CHALLENGE COMPLETE";
        card.append(
            makeElement("p", "mission-sequence-card__eyebrow", `CHALLENGE ${number} RESULTS · ${statusText}`),
            makeElement("h2", "mission-sequence-card__title", details?.title || result.minigameId),
        );
        const stats = makeElement("div", "mission-sequence-stats");
        stats.append(
            makeElement("div", "", ""),
        );
        stats.lastElementChild.append(makeElement("span", "", "SCORE"), makeElement("strong", "", String(result.score ?? 0)));
        const rating = makeElement("div");
        rating.append(makeElement("span", "", "PERFORMANCE"), makeElement("strong", "", `${percentage}%`));
        stats.appendChild(rating);
        const progress = makeElement("div", "mission-sequence-rating");
        progress.setAttribute("role", "progressbar");
        progress.setAttribute("aria-label", "Challenge performance");
        progress.setAttribute("aria-valuemin", "0");
        progress.setAttribute("aria-valuemax", "100");
        progress.setAttribute("aria-valuenow", String(percentage));
        const fill = makeElement("span");
        fill.style.width = `${percentage}%`;
        progress.appendChild(fill);
        card.append(stats, progress);
        if (result.explanation) card.appendChild(makeElement("p", "mission-sequence-card__copy", result.explanation));
        if (result.mistakes?.length) {
            card.appendChild(makeElement("p", "mission-sequence-card__notice", `NOTES · ${result.mistakes.join(" · ")}`));
        }
        const robotMessage = percentage >= 80
            ? "Excellent work! Your mission systems are looking strong."
            : percentage >= 45
                ? "Good recovery. We can still bring the mission home."
                : "We took a hit, but there is still a path home. Keep going.";
        addSequenceRobot(card, robotMessage, percentage >= 80 ? "happy" : "alert");
        card.appendChild(createSequenceButton(nextId ? "CONTINUE" : "VIEW FINAL RESULTS", continueMissionSequence));
        missionPlayHost.replaceChildren(card);
        missionPlayHost.hidden = false;
        missionPlayPause.hidden = true;
        missionPlaySkip.hidden = true;
        missionPlayHudActivity.textContent = `CHALLENGE ${number} / ${REQUIRED_MINIGAME_COUNT} · SCORE ${result.score ?? 0}`;
        setMissionPlayPhase(`CHALLENGE ${number} COMPLETE`, `${percentage}% PERFORMANCE`);
    }

    async function startSequenceMinigame(minigameId) {
        if (sequenceBusy) return;
        sequenceBusy = true;
        activeSequenceGameId = minigameId;
        try {
            const mission = window.BeyondEarthMissionManager.getActiveMission();
            if (!mission || mission.status !== "active"
                || !mission.performance.minigameSequence.includes(minigameId)
                || getCompletedMinigameIds(mission).has(minigameId)) {
                throw new Error("This challenge is no longer waiting in the active mission sequence.");
            }
            const profile = window.BeyondEarthPlayer.getPersonnelFile();
            const palette = window.BeyondEarthTheme.getPalette(profile.colorFamily);
            missionPlayHost.style.setProperty("--mission-accent", palette.primary);
            missionPlayHost.replaceChildren();
            missionPlayHost.hidden = false;
            missionPlayPause.hidden = false;
            missionPlaySkip.hidden = true;
            missionPlayHudActivity.textContent = `CHALLENGE ${mission.performance.minigameSequence.indexOf(minigameId) + 1} / ${REQUIRED_MINIGAME_COUNT} · ${MINIGAME_BRIEFINGS[minigameId].title}`;
            await window.BeyondEarthMinigames.start(minigameId, {
                container: missionPlayHost,
                playerColor: palette.primary,
            });
        } catch (error) {
            activeSequenceGameId = null;
            const mission = window.BeyondEarthMissionManager.getActiveMission();
            if (mission && mission.id === activeSequenceMissionId) {
                showChallengeRetry(mission, minigameId, `The challenge could not start: ${error.message}`);
            } else {
                setMissionPlayPhase("MISSION ACTIVITY ERROR", error.message);
            }
        } finally {
            sequenceBusy = false;
        }
    }

    function continueMissionSequence() {
        try {
            const mission = window.BeyondEarthMissionManager.getActiveMission();
            if (!mission || mission.status !== "active") return;
            const completed = getCompletedMinigameIds(mission);
            const nextId = mission.performance.minigameSequence.find((id) => !completed.has(id));
            if (nextId) {
                showChallengeBriefing(mission, nextId);
                return;
            }
            showMissionEnding();
        } catch (error) {
            setMissionPlayPhase("FINAL REPORT ERROR", error.message);
            missionPlayHost.replaceChildren();
            const card = makeElement("article", "mission-sequence-card mission-sequence-card--retry");
            card.append(
                makeElement("p", "mission-sequence-card__eyebrow", "MISSION CONTROL ALERT"),
                makeElement("h2", "mission-sequence-card__title", "Final report could not be saved"),
                makeElement("p", "mission-sequence-card__copy", error.message),
                createSequenceButton("RETRY FINAL REPORT", showMissionEnding),
            );
            missionPlayHost.appendChild(card);
        }
    }

    function showMissionEnding() {
        const mission = window.BeyondEarthMissionManager.getActiveMission();
        if (!mission || mission.status !== "active") return;
        const sequence = mission.performance.minigameSequence || [];
        const results = mission.performance.minigameResults || [];
        if (sequence.length < REQUIRED_MINIGAME_COUNT
            || sequence.some((id) => !results.some((result) => result.minigameId === id && result.status !== "aborted"))) {
            throw new Error("The mission ending is locked until all three challenges have saved a result.");
        }
        const evaluation = window.BeyondEarthMissionManager.evaluateMissionPerformance(
            sequence.map((id) => getSavedSequenceResult(mission, id)),
        );
        const { finalScore: score, ending } = evaluation;
        const objectiveIds = [
            mission.objectives?.primaryId,
            ...(mission.objectives?.secondaryIds || []),
        ].filter(Boolean);
        const completedObjectiveIds = new Set(mission.performance.completedObjectives || []);
        const objectivesAchieved = objectiveIds.filter((id) => completedObjectiveIds.has(id));
        const objectivesMissed = objectiveIds.filter((id) => !completedObjectiveIds.has(id));
        const spacecraftConditionPercent = Math.round(mission.resources.equipmentCondition * 100);
        const systemsRequiringRepair = spacecraftConditionPercent < 80
            ? ["spacecraft-equipment"]
            : [];
        const robotCondition = ending === "perfect"
            ? "operational"
            : ending === "damaged"
                ? "damaged-but-operational"
                : "inactive-after-emergency-signal";
        const performanceRecord = {
            finalScore: score,
            outcome: evaluation.outcome,
            ending,
            experienceAward: ending === "perfect" ? 20 : ending === "damaged" ? 10 : 0,
            evaluation: {
                ...evaluation,
                minigameSequence: sequence.slice(),
                objectivesAchieved: objectivesAchieved.slice(),
                objectivesMissed: objectivesMissed.slice(),
                spacecraftConditionPercent,
                robotCondition,
            },
            objectivesAchieved,
            objectivesMissed,
            spacecraftConditionPercent,
            robotCondition,
            systemsRequiringRepair,
        };
        const completedMission = ending === "lost"
            ? window.BeyondEarthMissionManager.closeMission("failed", performanceRecord)
            : window.BeyondEarthMissionManager.completeMission(performanceRecord);
        renderMissionEnding(completedMission, ending, score);
    }

    function renderMissionEnding(mission, ending, score) {
        const titles = {
            perfect: "BEYOND THE STARS — A MISSION SUCCESSFULLY COMPLETED",
            damaged: "THROUGH THE STORM — A COSTLY RETURN",
            lost: "LOST BEYOND THE STARS — MISSION ABORTED",
        };
        const title = titles[ending];
        const message = ending === "perfect"
            ? "The spacecraft is home, the crew is safe, and the mission objectives are secured. Earth welcomes the explorers back."
            : ending === "damaged"
                ? "The crew made an emergency return. The spacecraft needs attention, but the mission—and its discoveries—made it home."
                : "The spacecraft could not return. UNIT R-01 transmitted the final emergency signal; the crew's fate remains unknown.";
        const profile = window.BeyondEarthPlayer.getPersonnelFile();
        const palette = window.BeyondEarthTheme.getPalette(profile.colorFamily);
        const destination = destinationFor(mission);
        const destinationName = destination?.name || mission.destination?.id || "Unknown destination";
        const card = makeElement("article", `mission-sequence-card mission-ending-card mission-ending-card--${ending}`);
        const scene = makeElement("div", `mission-ending-scene mission-ending-scene--${ending}`);
        scene.innerHTML = `
            <span class="mission-ending-stars" aria-hidden="true"></span>
            <span class="mission-ending-earth" aria-hidden="true"></span>
            <span class="mission-ending-ground" aria-hidden="true"></span>
            <span class="mission-ending-debris mission-ending-debris--one" aria-hidden="true"></span>
            <span class="mission-ending-debris mission-ending-debris--two" aria-hidden="true"></span>
            <span class="mission-ending-signal" aria-hidden="true"></span>
            <div class="mission-ending-craft">
                <svg class="mission-ending-spacecraft" viewBox="0 0 112 56" shape-rendering="crispEdges" aria-hidden="true">
                    <path class="mission-ending-solar-array" d="M3 19h25v18H3zM84 19h25v18H84z" fill="#8597a8"/>
                    <path d="M6 22h8v5H6zm11 0h8v5h-8zm-11 8h8v5H6zm11 0h8v5h-8zm70-8h8v5h-8zm11 0h8v5h-8zm-11 8h8v5h-8zm11 0h8v5h-8z" fill="var(--mission-accent)"/>
                    <path d="M29 22h7v-7h9v-5h21v5h9v7h7v17h-7v7h-9v5H45v-5h-9v-7h-7z" fill="#c7cbd2"/>
                    <path d="M45 15h19v5H45z" fill="var(--mission-accent)"/>
                    <path d="M46 23h18v12H46z" fill="#182538"/>
                    <path d="M50 25h10v8H50z" fill="#94c8e8"/>
                    <path d="M37 24h7v11h-7zm27 0h7v11h-7z" fill="#e9b8cb"/>
                    <path class="mission-ending-engine" d="M44 47h21v5H44z" fill="#f2d18a"/>
                </svg>
                <div class="mission-ending-crew" aria-label="Custom astronaut aboard the spacecraft"></div>
            </div>
            <div class="mission-ending-captions" aria-live="polite"></div>
            <span class="mission-ending-sparkles" aria-hidden="true"></span>
        `;
        scene.style.setProperty("--mission-accent", palette.primary);
        const crew = scene.querySelector(".mission-ending-crew");
        crew.appendChild(window.AstronautPersonnel.createPortrait(profile));
        const captions = ending === "perfect"
            ? ["RETURN VECTOR CONFIRMED", "CREW AND UNIT R-01 HOMEWARD", "TOUCHDOWN · MISSION SUCCESSFUL"]
            : ending === "damaged"
                ? ["SYSTEM WARNING · EMERGENCY RETURN", "R-01 RESTORES ATTITUDE CONTROL", "SAFE LANDING · REPAIRS REQUIRED"]
                : ["POWER BUS FAILING · SIGNAL LOST", "R-01 TRANSMITTING FINAL BEACON", "SIGNAL ARCHIVED · MISSION LOST"];
        const captionContainer = scene.querySelector(".mission-ending-captions");
        captions.forEach((caption, index) => {
            captionContainer.appendChild(makeElement("p", `mission-ending-caption mission-ending-caption--${index + 1}`, caption));
        });
        const robotMessage = ending === "perfect"
            ? "MISSION COMPLETE! All systems operational. Friendship systems also operational!"
            : ending === "damaged"
                ? "We made it back. I am submitting a very detailed repair request."
                : "Emergency signal transmitting... Thank you for taking me along.";
        addSequenceRobot(scene, robotMessage, ending === "perfect" ? "happy" : ending === "damaged" ? "alert" : "idle", ending);
        card.append(
            makeElement("p", "mission-sequence-card__eyebrow", `${ending === "perfect" ? "BEST ENDING" : ending === "damaged" ? "PARTIAL SUCCESS" : "CRITICAL FAILURE"} · ${mission.name} · ${destinationName}`),
            makeElement("h2", "mission-sequence-card__title", title),
            makeElement("p", "mission-sequence-card__copy", message),
        );
        const criticalFailureCount = mission.performance.evaluation?.criticalFailureCount || 0;
        if (criticalFailureCount) {
            card.appendChild(makeElement(
                "p",
                "mission-sequence-card__notice",
                criticalFailureCount > 1
                    ? `${criticalFailureCount} critical challenge results affected the return outcome.`
                    : "One critical challenge result prevented a perfect-return rating.",
            ));
        }
        card.appendChild(scene);
        const stats = makeElement("div", "mission-sequence-stats");
        const scoreCard = makeElement("div");
        scoreCard.append(makeElement("span", "", "OVERALL PERFORMANCE"), makeElement("strong", "", `${score}%`));
        const resultCard = makeElement("div");
        resultCard.append(makeElement("span", "", "MISSION STATUS"), makeElement("strong", "", mission.status.toUpperCase()));
        const conditionCard = makeElement("div");
        const condition = mission.performance.spacecraftConditionPercent
            ?? Math.round(mission.resources.equipmentCondition * 100);
        conditionCard.append(makeElement("span", "", "SPACECRAFT CONDITION"), makeElement("strong", "", `${condition}%`));
        const crewCard = makeElement("div");
        crewCard.append(
            makeElement("span", "", "UNIT R-01"),
            makeElement("strong", "", ({
                operational: "OPERATIONAL",
                "damaged-but-operational": "DAMAGED · ONLINE",
                "inactive-after-emergency-signal": "SIGNAL SENT",
            })[mission.performance.robotCondition] || (ending === "perfect" ? "OPERATIONAL" : ending === "damaged" ? "DAMAGED · ONLINE" : "SIGNAL SENT")),
        );
        const awardCard = makeElement("div");
        awardCard.append(
            makeElement("span", "", "MISSION EXPERIENCE"),
            makeElement("strong", "", `+${mission.performance.experienceAward || 0} XP`),
        );
        stats.append(scoreCard, resultCard, conditionCard, crewCard, awardCard);
        card.appendChild(stats);
        const objectiveIds = [
            mission.objectives?.primaryId,
            ...(mission.objectives?.secondaryIds || []),
        ].filter(Boolean);
        const achieved = new Set(
            mission.performance.objectivesAchieved?.length
                ? mission.performance.objectivesAchieved
                : mission.performance.completedObjectives || [],
        );
        const missed = new Set(
            mission.performance.objectivesMissed?.length
                ? mission.performance.objectivesMissed
                : objectiveIds.filter((id) => !achieved.has(id)),
        );
        const objectives = makeElement("section", "mission-ending-section");
        objectives.appendChild(makeElement("h3", "", "MISSION OBJECTIVES"));
        const objectiveList = makeElement("ul", "mission-ending-objectives");
        if (!objectiveIds.length) {
            objectiveList.appendChild(makeElement("li", "mission-ending-objective", "No mission objectives were recorded."));
        } else {
            objectiveIds.forEach((id) => {
                const objective = window.BeyondEarthCatalogs.get("objectives", id);
                const isAchieved = achieved.has(id);
                const row = makeElement("li", `mission-ending-objective${isAchieved ? " is-achieved" : " is-missed"}`);
                row.append(
                    makeElement("span", "", objective?.name || id),
                    makeElement("strong", "", isAchieved ? "ACHIEVED" : missed.has(id) ? "NOT ACHIEVED" : "NOT RECORDED"),
                );
                objectiveList.appendChild(row);
            });
        }
        objectives.appendChild(objectiveList);
        card.appendChild(objectives);
        const achievementSection = makeElement("section", "mission-ending-section");
        achievementSection.appendChild(makeElement("h3", "", "MISSION ACHIEVEMENTS"));
        const achievementList = makeElement("ul", "mission-ending-achievements");
        const achievementIds = new Set(mission.performance.achievementsUnlocked || []);
        const availableAchievements = window.BeyondEarthAchievements.getProgression().achievements
            .filter((achievement) => achievementIds.has(achievement.id));
        if (availableAchievements.length) {
            availableAchievements.forEach((achievement) => {
                const item = makeElement("li", "mission-ending-achievement");
                item.append(
                    makeElement("strong", "", achievement.title || achievement.id),
                    makeElement("span", "", achievement.description || "Mission achievement unlocked."),
                );
                achievementList.appendChild(item);
            });
        } else {
            achievementList.appendChild(makeElement(
                "li",
                "mission-ending-achievement",
                ending === "lost"
                    ? "The emergency signal was archived; no completion badge was awarded."
                    : "No new campaign badge was awarded for this flight.",
            ));
        }
        achievementSection.appendChild(achievementList);
        card.appendChild(achievementSection);
        const resultList = makeElement("ol", "mission-ending-results");
        resultList.setAttribute("aria-label", "Minigame performance");
        mission.performance.minigameSequence.forEach((id) => {
            const result = getSavedSequenceResult(mission, id);
            const item = makeElement("li");
            const status = result?.status === "success"
                ? "SUCCESS"
                : result?.status === "partial"
                    ? "PARTIAL"
                    : result?.status === "failure"
                        ? "FAILURE"
                        : "ABORTED";
            item.append(
                makeElement("span", "", MINIGAME_BRIEFINGS[id]?.title || id),
                makeElement("strong", "", result
                    ? `${result.score ?? 0} · ${resultPercentage(result)}% · ${status}`
                    : "NO RESULT"),
            );
            resultList.appendChild(item);
        });
        const resultsSection = makeElement("section", "mission-ending-section");
        resultsSection.appendChild(makeElement("h3", "", "CHALLENGE PERFORMANCE"));
        resultsSection.appendChild(resultList);
        card.appendChild(resultsSection);
        const repairIds = mission.performance.systemsRequiringRepair || [];
        const repairSection = makeElement("section", "mission-ending-section");
        repairSection.appendChild(makeElement("h3", "", ending === "perfect" ? "FLIGHT CONDITION" : "SYSTEMS & RECOVERY"));
        const repairList = makeElement("ul", "mission-ending-impacts");
        repairList.appendChild(makeElement(
            "li",
            "",
            repairIds.length
                ? `Spacecraft equipment integrity needs inspection (${condition}%).`
                : `No specific subsystem fault was recorded. Equipment condition: ${condition}%.`,
        ));
        const resourceChanges = mission.performance.resourceChanges || [];
        resourceChanges.filter((change) => change.delta < 0).slice(-3).forEach((change) => {
            const amount = Number.isInteger(change.delta) ? String(change.delta) : change.delta.toFixed(2);
            repairList.appendChild(makeElement("li", "", `${change.reason} (${change.resource}: ${amount}).`));
        });
        repairSection.appendChild(repairList);
        card.appendChild(repairSection);
        if (missionPlayAstronaut) {
            missionPlayAstronaut.dataset.ending = ending;
            missionPlayAstronaut.classList.toggle("is-celebrating", ending === "perfect");
        }
        missionPlayScene.classList.add("has-mission-ending");
        card.appendChild(createSequenceButton("RETURN TO FLIGHT DECK", () => {
            window.SpaceAudio?.fadeMusic?.(500);
            window.SpaceAudio?.stopAmbient?.();
            missionPlayHost.hidden = true;
            missionPlayScene.classList.remove("has-mission-ending");
            window.BeyondEarthScenes.show("cockpit-scene");
        }));
        card.appendChild(createSequenceButton("VIEW MISSION ARCHIVE", () => {
            window.SpaceAudio?.fadeMusic?.(500);
            window.BeyondEarthMissionsTab.open();
        }));
        card.appendChild(createSequenceButton("RESTART MISSION", () => {
            card.querySelector(".mission-ending-restart-error")?.remove();
            try {
                restartMissionDesign(mission);
            } catch (error) {
                card.prepend(makeElement(
                    "p",
                    "mission-sequence-card__notice mission-ending-restart-error",
                    `The mission could not be restarted: ${error.message}`,
                ));
            }
        }));
        missionPlayHost.replaceChildren(card);
        missionPlayHost.hidden = false;
        missionPlayPause.hidden = true;
        missionPlaySkip.hidden = true;
        missionPlayHudActivity.textContent = `FINAL REPORT · ${score}%`;
        setMissionPlayPhase(title, message);
        missionPlayScene.dataset.ending = ending;
        window.SpaceAudio?.playMusic?.(`mission-ending-${ending}`);
        window.SpaceAudio?.playSFX?.(ending === "perfect" ? "mission-complete" : ending === "damaged" ? "warning" : "error");
    }

    function restartMissionDesign(mission) {
        window.SpaceAudio?.fadeMusic?.(500);
        const manager = window.BeyondEarthMissionManager;
        const retry = manager.createMission({ name: mission.name, missionType: mission.missionType });
        retry.destination = JSON.parse(JSON.stringify(mission.destination));
        retry.objectives = JSON.parse(JSON.stringify(mission.objectives));
        retry.spacecraft = JSON.parse(JSON.stringify(mission.spacecraft));
        retry.planning = JSON.parse(JSON.stringify(mission.planning));
        retry.currentStage = null;
        retry.resources = { ...mission.resources };
        [...(mission.performance.resourceChanges || [])].reverse().forEach((change) => {
            if (change
                && Object.prototype.hasOwnProperty.call(retry.resources, change.resource)
                && Number.isFinite(change.before)) {
                retry.resources[change.resource] = change.before;
            }
        });
        manager.saveMission(retry);
        window.BeyondEarthMissionsTab.open();
    }

    function reviewMission(missionId) {
        const mission = window.BeyondEarthMissionManager.getMission(missionId);
        const ending = mission?.performance?.ending || mission?.performance?.evaluation?.ending;
        const score = mission?.performance?.finalScore;
        if (!mission || !["perfect", "damaged", "lost"].includes(ending) || !Number.isFinite(score)) {
            throw new Error("This flight does not have a saved final debrief.");
        }
        const profile = window.BeyondEarthPlayer.getPersonnelFile();
        window.BeyondEarthTheme.setColorFamily(profile.colorFamily);
        const palette = window.BeyondEarthTheme.getPalette(profile.colorFamily);
        missionPlayHost.style.setProperty("--mission-accent", palette.primary);
        renderMissionPlayScene(mission, destinationFor(mission), profile);
        renderMissionEnding(mission, ending, score);
        window.BeyondEarthScenes.show("mission-play-scene");
    }

    async function beginMissionGameplay(mission) {
        if (!mission || !missionPlayScene || sequenceBusy) return;
        sequenceBusy = true;
        activeSequenceMissionId = mission.id;
        try {
            const destination = destinationFor(mission);
            const profile = window.BeyondEarthPlayer.getPersonnelFile();
            const palette = window.BeyondEarthTheme.getPalette(profile.colorFamily);
            if (window.BeyondEarthTheme.getColorFamily() !== profile.colorFamily) {
                window.BeyondEarthTheme.setColorFamily(profile.colorFamily);
            }
            const plan = window.BeyondEarthMissionGenerator.buildMissionPlan(mission);
            renderMissionPlayScene(mission, destination, profile);
            missionPlayHost.style.setProperty("--mission-accent", palette.primary);
            window.BeyondEarthScenes.show("mission-play-scene");
            const activeGame = window.BeyondEarthMinigames.getActive();
            if (activeGame?.missionId === mission.id) {
                missionPlayHost.hidden = false;
                missionPlayPause.hidden = activeGame.status !== "running";
                missionPlaySkip.hidden = true;
                missionPlayHudActivity.textContent = `${activeGame.name} · ${activeGame.status.toUpperCase()}`;
                return;
            }
            if (mission.status !== "active") {
                throw new Error("The mission must be active before its challenge sequence can begin.");
            }
            const sequence = ensureMinigameSequence(mission);
            const savedMission = window.BeyondEarthMissionManager.getActiveMission();
            const completed = getCompletedMinigameIds(savedMission);
            const nextId = sequence.find((id) => !completed.has(id));
            missionPlayHost.replaceChildren();
            if (!nextId) {
                showMissionEnding();
                return;
            }
            showChallengeBriefing(savedMission, nextId);
        } catch (error) {
            missionPlayHost.replaceChildren();
            missionPlayHost.hidden = false;
            missionPlayPause.hidden = true;
            missionPlaySkip.hidden = false;
            missionPlaySkip.textContent = "RETURN TO MISSION CONTROL";
            setMissionPlayPhase("MISSION SEQUENCE COULD NOT START", error.message);
            const card = makeElement("article", "mission-sequence-card mission-sequence-card--retry");
            card.append(
                makeElement("p", "mission-sequence-card__eyebrow", "MISSION CONTROL ALERT"),
                makeElement("h2", "mission-sequence-card__title", "Challenges could not load"),
                makeElement("p", "mission-sequence-card__copy", error.message),
                createSequenceButton("TRY AGAIN", () => {
                    beginMissionGameplay(window.BeyondEarthMissionManager.getActiveMission()).catch((retryError) => {
                        console.error("Could not resume the mission challenge sequence.", retryError);
                    });
                }),
            );
            addSequenceRobot(card, "I couldn't initialise the challenge sequence. Let's retry from mission control.", "alert");
            missionPlayHost.appendChild(card);
        } finally {
            sequenceBusy = false;
        }
    }

    async function activateMission(mission) {
        if (!mission || !["active", "paused"].includes(mission.status)) {
            throw new Error("Only an active or paused mission can be resumed from the RUN MISSION station.");
        }
        if (mission.status === "paused") {
            window.BeyondEarthMissionManager.transitionStatus("active");
        }
        const activeGame = window.BeyondEarthMinigames.getActive();
        if (activeGame?.missionId === mission.id && activeGame.status === "paused") {
            await window.BeyondEarthMinigames.resume();
        }
        await beginMissionGameplay(window.BeyondEarthMissionManager.getActiveMission());
    }

    async function toggleMissionPlayPause() {
        const activeGame = window.BeyondEarthMinigames.getActive();
        const mission = window.BeyondEarthMissionManager.getActiveMission();
        if (!mission || !activeGame || activeGame.missionId !== mission.id) {
            return;
        }
        if (activeGame.status === "running") {
            await window.BeyondEarthMinigames.pause();
            missionPlayPause.textContent = "RESUME";
            setMissionPlayPhase("MISSION PAUSED", missionPlayHudActivity.textContent || "Mission activity");
            return;
        }
        if (activeGame.status === "paused") {
            await window.BeyondEarthMinigames.resume();
            missionPlayPause.textContent = "PAUSE";
            setMissionPlayPhase(`MISSION ACTIVE · ${missionPlayHudActivity.textContent?.toUpperCase() || "MISSION ACTIVITY"} IN PROGRESS`, missionPlayHudActivity.textContent || "Mission activity");
        }
    }

    async function finishDeployment() {
        if (!deployment) return;
        clearDeploymentTimers();
        const completedDeployment = deployment;
        deploymentCopy.textContent =
            `Deployment complete. ${completedDeployment.crewName} is clear of the spacecraft at ${completedDeployment.destination?.name || "the mission destination"}.`;
        window.SpaceAudio?.playSFX?.("welcome");
        deployment = null;
        deploymentDialog.close();
        document.getElementById("cockpit-scene").classList.remove("is-deploying");

        const mission = window.BeyondEarthMissionManager.getActiveMission();
        const flightFeedback = document.getElementById("mission-flight-feedback");
        if (!mission || mission.id !== completedDeployment.mission.id || mission.status !== "active") {
            flightFeedback.textContent = "Deployment ended, but the saved flight is no longer active. Reopen mission control to check its status.";
            document.dispatchEvent(new CustomEvent("beyond:missiondeploymentend", {
                detail: { mission: completedDeployment.mission },
            }));
            return;
        }

        const host = document.getElementById("mission-minigame-host");
        if (host) {
            host.replaceChildren();
            host.hidden = true;
        }

        await beginMissionGameplay(mission);
        window.BeyondEarthMissionsTab.render();
        document.getElementById("mission-flight-panel").scrollIntoView({ block: "start", behavior: "smooth" });
        flightFeedback.textContent = `Mission deployment complete. ${mission.name} is ready for its mission activity.`;
    }

    function handleDeploymentError(error) {
        document.getElementById("mission-flight-feedback").textContent =
            `The flight is active, but mission operations could not open: ${error.message}`;
        if (deploymentDialog.open) deploymentDialog.close();
        document.getElementById("cockpit-scene").classList.remove("is-deploying");
        document.dispatchEvent(new CustomEvent("beyond:missiondeploymentend", {
            detail: { mission: deployment?.mission || null },
        }));
        window.BeyondEarthScenes.show("missions-scene");
        window.BeyondEarthMissionsTab.render();
        deployment = null;
        clearDeploymentTimers();
    }

    function deployApprovedMission() {
        if (deploymentDialog.open) throw new Error("A mission deployment is already in progress.");
        if (typeof deploymentDialog.showModal !== "function") {
            throw new Error("This browser does not support the mission deployment dialog.");
        }
        const mission = window.BeyondEarthMissionManager.getActiveMission();
        if (!mission || mission.status !== "approved") {
            throw new Error("Only an approved flight can be launched from the RUN MISSION station.");
        }
        const profile = window.BeyondEarthPlayer.getPersonnelFile();
        const crewName = profile.agentName?.trim() || profile.fullName?.trim() || "Astronaut";
        const plan = window.BeyondEarthMissionGenerator.buildMissionPlan(mission);
        const destination = destinationFor(mission);
        if (window.BeyondEarthTheme.getColorFamily() !== profile.colorFamily) {
            window.BeyondEarthTheme.setColorFamily(profile.colorFamily);
        }

        const emblem = window.BeyondEarthPlayer.getEmblems().find((item) => item.id === profile.emblem);
        deployment = {
            mission,
            plan,
            destination,
            profile,
            emblem,
            crewName,
            phase: "activation",
            phaseStartedAt: performance.now(),
        };
        document.getElementById("mission-deployment-title").textContent = mission.name;
        document.getElementById("mission-deployment-destination").textContent =
            destination?.name || mission.destination?.id || "Destination unconfirmed";
        document.getElementById("mission-deployment-objective").textContent = plan.activities[0]
            ? `FIRST ACTIVITY · ${plan.activities[0].name}`
            : "FIRST ACTIVITY · No generated activity for these objectives";
        document.getElementById("cockpit-scene").classList.add("is-deploying");
        deploymentDialog.showModal();
        try {
            window.BeyondEarthMissionManager.setCurrentStage(plan.activities[0]?.id || null);
            window.BeyondEarthMissionManager.transitionStatus("active");
        } catch (error) {
            deploymentDialog.close();
            document.getElementById("cockpit-scene").classList.remove("is-deploying");
            deployment = null;
            throw error;
        }
        document.dispatchEvent(new CustomEvent("beyond:missiondeploymentstart", {
            detail: { mission: window.BeyondEarthMissionManager.getActiveMission() },
        }));
        deploymentSkip.focus({ preventScroll: true });
        const firstActivity = plan.activities[0]?.name;
        setDeploymentPhase(
            "activation",
            `Approach confirmed for ${destination?.name || "the selected destination"}. Crew ejection sequence beginning.`,
            "panel-activate",
        );

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setDeploymentPhase(
                "arrival",
                `${crewName} is outside the spacecraft. The selected mission activity is ready.`,
            );
            deploymentTimers.push(window.setTimeout(() => {
                finishDeployment().catch(handleDeploymentError);
            }, 1800));
            return;
        }

        const phases = [
            {
                delay: 800,
                phase: "crew",
                copy: `${crewName} · saved suit colour and crew emblem confirmed.`,
                cue: "panel-open",
            },
            {
                delay: 1700,
                phase: "airlock",
                copy: "Outer hatch opening. Stabilising the spacecraft before crew ejection.",
                cue: "ignition",
            },
            {
                delay: 2700,
                phase: "departure",
                copy: `${crewName} ejected from the pixel shuttle and drifting clear into space.`,
                cue: "liftoff",
            },
            {
                delay: 4300,
                phase: "arrival",
                copy: firstActivity
                    ? `Ejection complete. ${firstActivity} is queued for this mission.`
                    : "Ejection complete. Mission operations are ready.",
                cue: "welcome",
            },
        ];
        phases.forEach(({ delay, phase, copy, cue }) => {
            deploymentTimers.push(window.setTimeout(() => setDeploymentPhase(phase, copy, cue), delay));
        });
        deploymentTimers.push(window.setTimeout(() => {
            finishDeployment().catch(handleDeploymentError);
        }, 6800));
    }

    dossierTabs.forEach((tab, index) => {
        tab.addEventListener("click", () => setDossierPage(index));
    });
    dossierPrevious.addEventListener("click", () => setDossierPage(dossierPage - 1));
    dossierNext.addEventListener("click", () => setDossierPage(dossierPage + 1));
    dossierClose.addEventListener("click", () => closeDossier("editing"));
    dossierEdit.addEventListener("click", () => closeDossier("editing"));
    dossierConfirm.addEventListener("click", approveDossierMission);
    dossierDialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeDossier("editing");
    });
    dossierDialog.addEventListener("click", (event) => {
        if (event.target === dossierDialog) closeDossier("editing");
    });
    deploymentSkip.addEventListener("click", () => {
        finishDeployment().catch(handleDeploymentError);
    });
    deploymentDialog.addEventListener("cancel", (event) => event.preventDefault());

    if (missionPlayPause) {
        missionPlayPause.addEventListener("click", () => {
            toggleMissionPlayPause().catch((error) => {
                console.error("Could not toggle mission play pause state.", error);
                setMissionPlayPhase("MISSION ACTIVE · SYSTEM ALERT", missionPlayHudActivity?.textContent || "Mission activity");
            });
        });
    }

    if (missionPlaySkip) {
        missionPlaySkip.addEventListener("click", () => {
            const mission = window.BeyondEarthMissionManager.getActiveMission();
            if (!mission || mission.status !== "active") {
                window.BeyondEarthScenes.show("missions-scene");
                return;
            }
            if (missionPlaySkip.textContent === "RETURN TO MISSION CONTROL") {
                window.BeyondEarthScenes.show("missions-scene");
                window.BeyondEarthMissionsTab.render();
                return;
            }
            const activeGame = window.BeyondEarthMinigames.getActive();
            if (activeGame?.missionId === mission.id) {
                window.BeyondEarthScenes.show("mission-play-scene");
                return;
            }
            window.BeyondEarthScenes.show("missions-scene");
            window.BeyondEarthMissionsTab.render();
        });
    }

    document.addEventListener("beyond:minigameresult", (event) => {
        const mission = window.BeyondEarthMissionManager.getActiveMission();
        const result = event.detail?.result;
        if (!mission || event.detail?.missionId !== mission.id || !result) return;
        if (!mission.performance.minigameSequence.includes(result.minigameId)) return;
        activeSequenceGameId = null;
        missionPlayPause.hidden = true;
        missionPlaySkip.hidden = true;
        showChallengeResult(mission, result);
    });

    document.addEventListener("beyond:minigameend", (event) => {
        const mission = window.BeyondEarthMissionManager.getActiveMission();
        const id = event.detail?.id;
        if (!mission || mission.status !== "active" || event.detail?.missionId !== mission.id
            || !id || activeSequenceGameId !== id || !mission.performance.minigameSequence.includes(id)
            || getCompletedMinigameIds(mission).has(id)) {
            return;
        }
        activeSequenceGameId = null;
        showChallengeRetry(mission, id);
    });

    if (missionPlayScene) {
        window.addEventListener("resize", () => drawMissionPlayScene());
        document.addEventListener("beyond:themechange", () => drawMissionPlayScene());
        document.addEventListener("beyond:scenechange", (event) => {
            if (event.detail?.scene === "mission-play-scene") drawMissionPlayScene();
        });
    }

    window.BeyondEarthMissionExperience = Object.freeze({
        activate: activateMission,
        deploy: deployApprovedMission,
        openDossier,
        review: reviewMission,
    });
})();
