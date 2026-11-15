(() => {
    "use strict";

    const scene = document.getElementById("cockpit-scene");
    const monitor = document.getElementById("cockpit-systems-monitor");
    const maintenancePanel = scene?.querySelector(".cockpit-maintenance-panel");
    const observation = scene?.querySelector(".cockpit-observation");
    const interactions = window.BeyondEarthCockpitInteractions;
    const monitorPages = new Set(["power", "thermal", "communications", "life-support"]);
    const NOTE = "FLIGHT NOTE · The blue planet's clouds look like a tiny rabbit when the cabin lights are low.";
    let activeDial = null;

    if (!scene || !monitor || !maintenancePanel || !observation || !interactions) {
        throw new Error("Cockpit sandbox markup or interaction registry is unavailable.");
    }

    function registerToggle(id, system, enabled, sound = "toggle") {
        interactions.register({
            id,
            type: "toggle",
            system,
            initialState: { enabled },
            onInteract: ({ state, input }) => ({
                state: { enabled: typeof input.enabled === "boolean" ? input.enabled : !state.enabled },
            }),
            soundResponse: () => sound,
        });
    }

    function registerDial(id, system, value, sound = "tab") {
        interactions.register({
            id,
            type: "rotary",
            system,
            initialState: { value },
            onInteract: ({ input }) => {
                if (!Number.isFinite(input.value)) {
                    throw new TypeError(`The ${id} dial needs a finite value.`);
                }
                return { state: { value: Math.max(0, Math.min(100, Math.round(input.value))) } };
            },
            visualResponse: (state) => ({ angle: -135 + state.value * 2.7 }),
            soundResponse: () => sound,
        });
    }

    registerToggle("power-bus", "power", true);
    registerToggle("communications-link", "communications", false);
    registerToggle("life-support", "life-support", true);
    registerToggle("thermal-bus", "thermal", true);
    registerDial("cabin-lighting", "environment", 65);
    registerDial("thermal-control", "thermal", 52);

    interactions.register({
        id: "power-distribution",
        type: "slider",
        system: "power",
        initialState: { value: 70 },
        onInteract: ({ input }) => {
            if (!Number.isFinite(input.value)) {
                throw new TypeError("Power distribution needs a finite value.");
            }
            return { state: { value: Math.max(0, Math.min(100, Math.round(input.value / 5) * 5)) } };
        },
        soundResponse: () => "tab",
    });

    interactions.register({
        id: "systems-monitor",
        type: "monitor",
        initialState: { open: false, page: "power" },
        onInteract: ({ state, input }) => {
            if (input.action === "tab") {
                if (!monitorPages.has(input.page)) {
                    throw new RangeError(`Unknown spacecraft monitor page: ${input.page}.`);
                }
                return { state: { ...state, page: input.page } };
            }
            if (input.action === "close") {
                return { state: { ...state, open: false } };
            }
            return { state: { ...state, open: true } };
        },
        soundResponse: ({ input }) => input.action === "tab"
            ? "tab"
            : input.action === "close" ? "panel-close" : "panel-open",
    });

    interactions.register({
        id: "maintenance-panel",
        type: "compartment",
        initialState: { open: false },
        onInteract: ({ state, input }) => ({
            state: { open: typeof input?.open === "boolean" ? input.open : !state.open },
        }),
        soundResponse: ({ state }) => state.open ? "panel-open" : "panel-close",
    });

    interactions.register({
        id: "maintenance-check",
        type: "button",
        initialState: { checks: 0 },
        onInteract: ({ state }) => ({
            state: { checks: state.checks + 1 },
            result: { status: "complete", scope: "cockpit-only" },
        }),
        soundResponse: () => "success",
    });

    interactions.register({
        id: "window-note",
        type: "button",
        initialState: { found: false, visible: false },
        onInteract: ({ state }) => ({
            state: { found: true, visible: state.found ? !state.visible : true },
            result: { note: NOTE },
        }),
        soundResponse: ({ previousState }) => previousState.found ? "tab" : "success",
    });

    function getState(id) {
        return interactions.get(id).state;
    }

    function interact(id, input = null) {
        return interactions.interact(id, input, {
            expectedRevision: interactions.get(id).revision,
        });
    }

    function setText(selector, value) {
        const output = scene.querySelector(selector);
        if (!output) throw new Error(`Cockpit reading "${selector}" is missing.`);
        output.textContent = String(value);
    }

    function setProgress(system, value) {
        const progress = scene.querySelector(`[data-reading-bar="${system}"]`);
        if (!progress) throw new Error(`Cockpit progress meter "${system}" is missing.`);
        progress.value = value;
    }

    function getReadings() {
        const power = getState("power-bus").enabled;
        const distribution = getState("power-distribution").value;
        const communications = getState("communications-link").enabled;
        const lifeSupport = getState("life-support").enabled;
        const thermalBus = getState("thermal-bus").enabled;
        const thermalDial = getState("thermal-control").value;
        const enabledSubsystems = [communications, lifeSupport, thermalBus].filter(Boolean).length;
        const powerLoad = power
            ? Math.min(98, Math.round(14 + distribution * 0.48 + enabledSubsystems * 6))
            : 0;
        const thermalIndex = power && thermalBus
            ? Math.max(25, 94 - Math.round(Math.abs(thermalDial - 52) * 0.45))
            : 18;
        const communicationsSignal = power && communications ? Math.min(96, 72 + Math.round(distribution * 0.23)) : 0;
        const lifeSupportIndex = power && lifeSupport ? 96 : 0;

        return {
            power,
            distribution,
            powerLoad,
            thermalBus,
            thermalIndex,
            communications,
            communicationsSignal,
            lifeSupport,
            lifeSupportIndex,
        };
    }

    function renderMonitor() {
        const monitorState = getState("systems-monitor");
        if (monitorState.open && !monitor.open) monitor.showModal();
        if (!monitorState.open && monitor.open) monitor.close();

        scene.querySelectorAll("[data-monitor-tab]").forEach((tab) => {
            const selected = tab.dataset.monitorTab === monitorState.page;
            tab.setAttribute("aria-selected", String(selected));
            tab.tabIndex = selected ? 0 : -1;
        });
        scene.querySelectorAll("[data-monitor-view]").forEach((page) => {
            page.hidden = page.dataset.monitorView !== monitorState.page;
        });

        const readings = getReadings();
        setText("[data-reading='power-status']", readings.power ? "ONLINE" : "OFFLINE");
        setText("[data-reading='power-distribution']", `${readings.distribution}%`);
        setText("[data-reading='power-slider-value']", `${readings.distribution}%`);
        setText("[data-reading='power-load']", `${readings.powerLoad}%`);
        setText("[data-reading='thermal-index']", `${readings.thermalIndex}%`);
        setText("[data-reading='thermal-status']", readings.power && readings.thermalBus ? "ACTIVE" : "STANDBY");
        setText("[data-reading='communications-status']", readings.power && readings.communications ? "LINK ACTIVE" : "STANDBY");
        setText("[data-reading='communications-signal']", `${readings.communicationsSignal}%`);
        setText("[data-reading='life-support-status']", readings.power && readings.lifeSupport ? "ACTIVE" : "STANDBY");
        setText("[data-reading='life-support-index']", `${readings.lifeSupportIndex}%`);
        setProgress("thermal", readings.thermalIndex);
        setProgress("communications", readings.communicationsSignal);
        setProgress("life-support", readings.lifeSupportIndex);

        const distribution = scene.querySelector("[data-cockpit-interaction='power-distribution']");
        distribution.value = String(readings.distribution);
    }

    function renderSwitches() {
        scene.querySelectorAll("button[role='switch'][data-cockpit-interaction]").forEach((control) => {
            const state = getState(control.dataset.cockpitInteraction);
            control.setAttribute("aria-checked", String(state.enabled));
            control.classList.toggle("is-active", state.enabled);
        });
    }

    function renderDials() {
        scene.querySelectorAll(".cockpit-knob[data-cockpit-interaction]").forEach((control) => {
            const snapshot = interactions.get(control.dataset.cockpitInteraction);
            const { value } = snapshot.state;
            control.setAttribute("aria-valuenow", String(value));
            control.setAttribute("aria-valuetext", `${value} percent`);
            control.style.setProperty("--knob-angle", `${snapshot.visual.angle}deg`);
        });

        const lighting = getState("cabin-lighting");
        const lightSwitch = getState("power-bus").enabled;
        const lightOutput = lightSwitch ? lighting.value / 100 : 0;
        scene.style.setProperty("--cockpit-light-output", String(lightSwitch ? 0.025 + lightOutput * 0.15 : 0));
    }

    function renderMaintenance() {
        const state = getState("maintenance-panel");
        if (state.open && maintenancePanel.hidden) {
            maintenancePanel.hidden = false;
            window.requestAnimationFrame(() => {
                if (!maintenancePanel.hidden) maintenancePanel.classList.add("is-opening");
            });
        } else if (!state.open) {
            maintenancePanel.hidden = true;
            maintenancePanel.classList.remove("is-opening");
        }

        const checks = getState("maintenance-check").checks;
        const status = maintenancePanel.querySelector(".maintenance-status");
        const checkButton = maintenancePanel.querySelector("[data-cockpit-interaction='maintenance-check']");
        status.textContent = checks
            ? `LOCAL CHECK COMPLETE · ${checks} RUN${checks === 1 ? "" : "S"} · NO FLIGHT DATA CONNECTED`
            : "LOCAL CHECK READY · NO FLIGHT DATA CONNECTED";
        checkButton.textContent = checks ? "RUN LOCAL SELF-CHECK AGAIN" : "RUN LOCAL SELF-CHECK";
    }

    function renderObservation() {
        const state = getState("window-note");
        observation.hidden = !state.visible;
        observation.textContent = state.visible ? NOTE : "";
        scene.querySelectorAll("[data-cockpit-interaction='window-note']").forEach((control) => {
            control.setAttribute("aria-expanded", String(state.visible));
            control.classList.toggle("has-discovery", state.found);
        });
    }

    function render() {
        renderSwitches();
        renderDials();
        renderMaintenance();
        renderObservation();
        renderMonitor();
    }

    function valueFromPointer(control, event) {
        const bounds = control.getBoundingClientRect();
        const angle = Math.atan2(event.clientY - (bounds.top + bounds.height / 2),
            event.clientX - (bounds.left + bounds.width / 2)) * (180 / Math.PI);
        const normalizedAngle = angle > 180 ? angle - 360 : angle;
        const limitedAngle = Math.max(-135, Math.min(135, normalizedAngle));
        return Math.round((limitedAngle + 135) / 270 * 100);
    }

    function updateDial(control, value) {
        interact(control.dataset.cockpitInteraction, { value });
    }

    scene.addEventListener("click", (event) => {
        const control = event.target.closest?.("[data-cockpit-interaction]");
        if (!control || !scene.contains(control)) return;
        const id = control.dataset.cockpitInteraction;
        if (id === "cabin-lighting" || id === "thermal-control" || id === "power-distribution") return;
        if (id === "systems-monitor") {
            const action = control.dataset.monitorAction || "open";
            interact(id, { action, page: control.dataset.monitorPage });
        } else if (id === "maintenance-panel") {
            interact(id);
        } else if (id === "window-note") {
            interact(id);
        } else if (id === "maintenance-check") {
            interact(id);
        } else {
            const state = getState(id);
            interact(id, { enabled: !state.enabled });
        }
    });

    scene.addEventListener("input", (event) => {
        const control = event.target.closest?.("[data-cockpit-interaction='power-distribution']");
        if (control) interact("power-distribution", { value: Number(control.value) });
    });

    scene.addEventListener("pointerdown", (event) => {
        const control = event.target.closest?.(".cockpit-knob[data-cockpit-interaction]");
        if (!control || !scene.contains(control)) return;
        event.preventDefault();
        activeDial = control;
        control.classList.add("is-adjusting");
        control.setPointerCapture(event.pointerId);
        updateDial(control, valueFromPointer(control, event));
    });

    scene.addEventListener("pointermove", (event) => {
        if (!activeDial || !activeDial.hasPointerCapture(event.pointerId)) return;
        updateDial(activeDial, valueFromPointer(activeDial, event));
    });

    function releaseDial(event) {
        if (!activeDial) return;
        activeDial.classList.remove("is-adjusting");
        if (activeDial.hasPointerCapture(event.pointerId)) activeDial.releasePointerCapture(event.pointerId);
        activeDial = null;
    }

    scene.addEventListener("pointerup", releaseDial);
    scene.addEventListener("pointercancel", releaseDial);

    scene.addEventListener("keydown", (event) => {
        const tab = event.target.closest?.("[data-monitor-tab]");
        if (tab && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
            const tabs = Array.from(scene.querySelectorAll("[data-monitor-tab]"));
            const index = tabs.indexOf(tab);
            const direction = event.key === "ArrowRight" ? 1 : -1;
            const next = tabs[(index + direction + tabs.length) % tabs.length];
            event.preventDefault();
            interact("systems-monitor", { action: "tab", page: next.dataset.monitorTab });
            next.focus();
            return;
        }

        const control = event.target.closest?.(".cockpit-knob[data-cockpit-interaction]");
        if (!control) return;
        const state = getState(control.dataset.cockpitInteraction);
        const step = event.shiftKey ? 10 : 2;
        let value = state.value;
        if (event.key === "ArrowRight" || event.key === "ArrowUp") value += step;
        else if (event.key === "ArrowLeft" || event.key === "ArrowDown") value -= step;
        else if (event.key === "Home") value = 0;
        else if (event.key === "End") value = 100;
        else return;
        event.preventDefault();
        updateDial(control, Math.max(0, Math.min(100, value)));
    });

    monitor.addEventListener("cancel", (event) => {
        event.preventDefault();
        interact("systems-monitor", { action: "close" });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && monitor.open) {
            event.preventDefault();
            interact("systems-monitor", { action: "close" });
        }
    });

    document.addEventListener("beyond:cockpitinteraction", render);

    document.addEventListener("beyond:themechange", renderDials);
    render();
})();
