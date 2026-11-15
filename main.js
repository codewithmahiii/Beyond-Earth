// =================================
// GAME INTRO SEQUENCE
// =================================

const launchScene = document.getElementById("launch-scene");
const welcomeScene = document.getElementById("welcome-scene");
const cockpitScene = document.getElementById("cockpit-scene");
const personnelScene = document.getElementById("personnel-scene");
const skipButton = document.getElementById("skip-intro");
const wakePowerButton = document.getElementById("wake-power-button");
const wakeStatus = document.getElementById("wake-status");

let introTimers = [];
let wakeTimers = [];
let wakeStarted = false;
let sceneTransitionTimer = 0;
let cockpitAnimationFrame = 0;
let lastSkyFrameTime = 0;
let skyAnimationTime = 0;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const INTRO_TIMING = reducedMotion
    ? { launch: 1200, wake: [250, 450, 650, 850], online: 1400, exit: 1900 }
    : { launch: 4600, wake: [850, 1500, 2200, 2900], online: 4400, exit: 5200 };

// Switch between scenes
function showScene(scene) {
    if (!scene || !scene.classList.contains("scene")) {
        return false;
    }

    const previousScene = document.querySelector(".scene.active");
    const shouldTransition = previousScene !== scene;
    if (shouldTransition) {
        clearTimeout(sceneTransitionTimer);
        document.querySelectorAll(".scene").forEach((item) => {
            item.classList.remove("scene-entering", "scene-leaving");
        });
        if (previousScene) previousScene.classList.add("scene-leaving");
        document.querySelectorAll(".scene.active").forEach((item) => {
            item.classList.remove("active");
        });
    }

    scene.classList.add("active");
    if (shouldTransition) {
        scene.classList.add("scene-entering");
        const transitionDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 480;
        sceneTransitionTimer = window.setTimeout(() => {
            scene.classList.remove("scene-entering");
            previousScene?.classList.remove("scene-leaving");
            sceneTransitionTimer = 0;
        }, transitionDuration + 50);
    }
    if (scene === cockpitScene || scene === welcomeScene || scene === personnelScene) {
        drawCockpit();
    }
    document.dispatchEvent(new CustomEvent("beyond:scenechange", {
        detail: { scene: scene.id },
    }));
    return true;
}

window.BeyondEarthScenes = Object.freeze({
    show: (sceneId) => showScene(document.getElementById(sceneId)),
    getCurrentScene: () => document.querySelector(".scene.active")?.id || null,
});


// Clear pending scene transitions
function clearIntroTimers() {

    introTimers.forEach((timer) => clearTimeout(timer));

    introTimers = [];
}


// Start the complete intro
function startIntro() {

    clearIntroTimers();

    if (!showScene(launchScene)) {
        return;
    }

    introTimers.push(setTimeout(() => showScene(welcomeScene), INTRO_TIMING.launch));
}

function wakeAudioCue(phase) {
    document.dispatchEvent(new CustomEvent("beyond:wakephase", {
        detail: { phase },
    }));
}

function scheduleWakeCue(delay, callback) {
    wakeTimers.push(window.setTimeout(callback, delay));
}

function startWakeSequence() {
    if (wakeStarted || !welcomeScene.classList.contains("active")) {
        return;
    }

    wakeStarted = true;
    wakePowerButton.disabled = true;
    wakePowerButton.setAttribute("aria-disabled", "true");
    welcomeScene.classList.add("is-activating");
    welcomeScene.setAttribute("aria-busy", "true");
    wakeStatus.textContent = "POWER BUS ENGAGED";

    const audioUnlock = window.SpaceAudio?.unlock?.();
    if (audioUnlock && typeof audioUnlock.then === "function") {
        audioUnlock.then(() => wakeAudioCue("start"));
    } else {
        wakeAudioCue("start");
    }

    const screens = welcomeScene.querySelectorAll(".wake-screen");
    const indicators = welcomeScene.querySelectorAll(".wake-indicators i");
    screens.forEach((screen, index) => {
        scheduleWakeCue(INTRO_TIMING.wake[index], () => {
            screen.classList.add("is-on");
            wakeAudioCue("panel");
        });
    });
    const firstIndicatorDelays = reducedMotion ? [100, 400, 700, 1000] : [300, 1050, 1850, 2750];
    const secondIndicatorDelays = reducedMotion ? [150, 500, 850] : [1250, 2450, 3500];
    firstIndicatorDelays.forEach((delay, index) => {
        scheduleWakeCue(delay, () => indicators[index].classList.add("is-on"));
    });
    secondIndicatorDelays.forEach((delay, index) => {
        scheduleWakeCue(delay, () => indicators[index + 4].classList.add("is-on"));
    });

    scheduleWakeCue(INTRO_TIMING.online, () => {
        welcomeScene.classList.add("is-online");
        welcomeScene.setAttribute("aria-busy", "false");
        wakeStatus.textContent = "SYSTEMS ONLINE";
        wakeAudioCue("online");
    });
    scheduleWakeCue(INTRO_TIMING.exit, () => {
        wakeTimers = [];
        showScene(cockpitScene);
    });
}

function clearWakeTimers() {
    wakeTimers.forEach((timer) => window.clearTimeout(timer));
    wakeTimers = [];
}

// Skip directly to the cockpit
function skipIntro() {

    clearIntroTimers();
    clearWakeTimers();
    window.SpaceAudio?.stopLaunch(true);

    showScene(cockpitScene);
}


// Skip button
if (skipButton) {
    skipButton.addEventListener("click", skipIntro);
}

if (wakePowerButton) {
    wakePowerButton.addEventListener("click", startWakeSequence);
}


// Start the game intro
startIntro();


// =================================
// MAIN MENU INTERACTIONS
// =================================

const cockpitCanvas = document.querySelector("#cockpit-scene .cockpit-art");
const cockpitContext = cockpitCanvas?.getContext("2d");
const wakeCockpitCanvas = document.querySelector(".wake-cockpit-art");
const personnelCockpitCanvas = document.querySelector(".personnel-cockpit-art");
const stationFeedback = document.querySelector(".station-feedback");
const stations = document.querySelectorAll(".station");
const stationMessages = {
    "new-mission": "Mission console active · Flight planning station",
    continue: "Navigation computer active · No saved flight plan",
    "run-mission": "Launch console active · Approved flight ready",
    profile: "Crew identification terminal active",
    archive: "Research archive terminal active",
    settings: "Auxiliary ship systems panel active",
};

function syncMissionStation() {
    const station = document.querySelector(".station-run-mission");
    const manager = window.BeyondEarthMissionManager;
    if (!station || !manager) return;

    const mission = manager.getActiveMission();
    const status = mission?.status || "none";
    const ready = ["approved", "active", "paused"].includes(status);
    station.disabled = false;
    if (!ready) station.setAttribute("aria-pressed", "false");
    station.classList.toggle("is-ready", ready);
    station.dataset.missionStatus = status;
    station.querySelector("[data-run-caption]").textContent = ready
        ? status === "approved"
            ? "FLIGHT APPROVED · READY"
            : status === "paused"
                ? "FLIGHT PAUSED · RESUME"
                : "FLIGHT ACTIVE · RETURN TO MISSION"
        : status === "draft"
            ? "DRAFT · APPROVAL REQUIRED"
            : "NO APPROVED FLIGHT";
    station.querySelector("[data-run-mark]").textContent = ready
        ? status === "approved"
            ? "READY"
            : status.toUpperCase()
        : status === "draft"
            ? "DRAFT"
            : "STANDBY";
    station.setAttribute(
        "aria-label",
        ready
            ? status === "approved"
                ? `Run approved mission: ${mission.name}`
                : status === "paused"
                    ? `Resume mission: ${mission.name}`
                    : `Return to active mission: ${mission.name}`
            : status === "draft"
                ? `Run mission unavailable: ${mission.name} requires approval`
                : "Run mission unavailable: no approved flight",
    );
}

window.BeyondEarthMain = Object.freeze({ syncMissionStation });
document.addEventListener("beyond:statechange", syncMissionStation);
document.addEventListener("beyond:missionclosed", syncMissionStation);
document.addEventListener("beyond:missioncompleted", syncMissionStation);

function drawCockpit() {
    const targetCanvas = document.querySelector(".scene.active .cockpit-art") || cockpitCanvas;
    const targetContext = targetCanvas?.getContext("2d");
    if (!targetCanvas || !targetContext) {
        return;
    }

    const bounds = targetCanvas.getBoundingClientRect();
    const pixelScale = 4;
    const width = Math.max(1, Math.ceil(bounds.width / pixelScale));
    const height = Math.max(1, Math.ceil(bounds.height / pixelScale));

    if (targetCanvas.width !== width || targetCanvas.height !== height) {
        targetCanvas.width = width;
        targetCanvas.height = height;
    }

    const ctx = targetContext;
    const themeStyles = getComputedStyle(document.documentElement);
    const themeColor = (name, fallback) => themeStyles.getPropertyValue(name).trim() || fallback;
    const accent = themeColor("--theme-interface-accent", "#bbc1c8");
    const environmentPrimary = themeColor("--theme-environment-primary", "#515b62");
    const environmentSecondary = themeColor("--theme-environment-secondary", "#879297");
    const structuralTrim = themeColor("--theme-structural-trim", "#c2c8c8");
    const consoleSurface = themeColor("--theme-console-surface", "#3f4a51");
    const ambientLighting = themeColor("--theme-ambient-lighting", "#bdcbd0");
    const w = targetCanvas.width;
    const h = targetCanvas.height;
    const x = (value) => Math.round(value * w);
    const y = (value) => Math.round(value * h);
    const rect = (left, top, wide, tall, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(x(left), y(top), Math.max(1, x(wide)), Math.max(1, y(tall)));
    };
    const polygon = (points, color) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x(points[0][0]), y(points[0][1]));
        points.slice(1).forEach(([px, py]) => ctx.lineTo(x(px), y(py)));
        ctx.closePath();
        ctx.fill();
    };
    const circle = (cx, cy, radius, color) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x(cx), y(cy), Math.max(1, y(radius)), 0, Math.PI * 2);
        ctx.fill();
    };
    const fourPointStar = (cx, cy, radius, color) => polygon([
        [cx, cy - radius],
        [cx + radius * 0.24, cy - radius * 0.24],
        [cx + radius, cy],
        [cx + radius * 0.24, cy + radius * 0.24],
        [cx, cy + radius],
        [cx - radius * 0.24, cy + radius * 0.24],
        [cx - radius, cy],
        [cx - radius * 0.24, cy - radius * 0.24],
    ], color);
    const crescent = (cx, cy, radius, color) => {
        ctx.save();
        ctx.translate(x(cx), y(cy));
        ctx.scale(x(radius), y(radius));
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, Math.PI * 2);
        ctx.arc(0.48, -0.22, 0.78, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.restore();
    };

    rect(0, 0, 1, 1, "#070d16");

    let seed = 481;
    const random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };

    const planetX = 0.68 + Math.sin(skyAnimationTime * 0.09) * 0.004;
    const planetY = 0.34 + Math.cos(skyAnimationTime * 0.07) * 0.002;
    const planetRadius = Math.min(w * 0.155, h * 0.275);
    const radiusX = planetRadius / w;
    const radiusY = planetRadius / h;
    const planetBands = [
        "#bac3b8", "#a9b9b1", "#93aaa5", "#809a98", "#718b8d",
        "#7e9693", "#698287", "#5a747e", "#4d6875", "#405b69", "#344d5d",
    ];

    polygon([[0, 0], [1, 0], [0.94, 0.13], [0.82, 0.19], [0.18, 0.19], [0.06, 0.13]], "#777d7f");
    polygon([[0.04, 0], [0.96, 0], [0.90, 0.105], [0.79, 0.15], [0.21, 0.15], [0.10, 0.105]], "#a5a8a6");
    polygon([[0.13, 0.015], [0.87, 0.015], [0.81, 0.105], [0.19, 0.105]], "#686e72");
    polygon([[0.22, 0.024], [0.78, 0.024], [0.745, 0.087], [0.255, 0.087]], "#a5a8a6");
    polygon([[0.27, 0.035], [0.73, 0.035], [0.707, 0.074], [0.293, 0.074]], environmentPrimary);
    rect(0.30, 0.081, 0.40, 0.004, ambientLighting);
    for (let i = 0; i < 12; i += 1) {
        const px = 0.16 + i * 0.062;
        rect(px, 0.02, 0.035, 0.012, i % 3 === 0 ? "#d3d4ce" : "#858b8e");
        rect(px, 0.12, 0.028, 0.008, "#555c61");
    }
    polygon([[0.18, 0.145], [0.82, 0.145], [0.89, 0.615], [0.11, 0.615]], "#545b60");
    polygon([[0.195, 0.16], [0.805, 0.16], [0.865, 0.595], [0.135, 0.595]], "#182531");

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x(0.195), y(0.16));
    ctx.lineTo(x(0.805), y(0.16));
    ctx.lineTo(x(0.865), y(0.595));
    ctx.lineTo(x(0.135), y(0.595));
    ctx.closePath();
    ctx.clip();
    for (let i = 0; i < 105; i += 1) {
        const baseX = random();
        const baseY = 0.17 + random() * 0.40;
        const starWidth = random() > 0.86 ? 0.003 : 0.0015;
        const sx = (baseX + skyAnimationTime * 0.0025) % 1;
        const sy = baseY + Math.sin(skyAnimationTime * 0.22 + i) * 0.0005;
        const sparkle = i % 29 === 0 && Math.sin(skyAnimationTime * 1.25 + i * 2.4) > 0.94;
        const starColor = sparkle
            ? "#dce9ef"
            : i % 7 === 0 ? "#a7bdc8" : "#8093a0";
        fourPointStar(sx, sy, starWidth * 2.2, starColor);
        if (sparkle) {
            fourPointStar(sx, sy, 0.008, starColor);
        }
    }

    for (let row = -24; row <= 24; row += 1) {
        const normalizedY = row / 24;
        const edge = Math.sqrt(Math.max(0, 1 - normalizedY * normalizedY)) * radiusX;
        const band = Math.min(planetBands.length - 1, Math.floor((row + 24) / 5));
        const shade = planetBands[band];
        rect(planetX - edge, planetY + normalizedY * radiusY, edge * 2, 0.015, shade);
        if (row % 5 === 0) {
            rect(planetX - edge, planetY + normalizedY * radiusY, edge * 0.17, 0.008, "#a9b5ad");
        }
    }
    const planetDetail = (points, color) => polygon(
        points.map(([px, py]) => [planetX + px * radiusX, planetY + py * radiusY]),
        color
    );
    planetDetail([[-0.84, -0.15], [-0.58, -0.25], [-0.39, -0.18], [-0.45, -0.07], [-0.65, -0.04]], "#647d80");
    planetDetail([[0.06, 0.15], [0.32, 0.04], [0.58, 0.11], [0.52, 0.26], [0.19, 0.29]], "#60787d");
    planetDetail([[-0.39, 0.40], [-0.19, 0.29], [0, 0.36], [-0.07, 0.51], [-0.32, 0.51]], "#50696f");
    rect(planetX - 0.55 * radiusX, planetY - 0.40 * radiusY, 0.04 * radiusX, 0.04 * radiusY, "#c2c7ba");
    ctx.restore();

    rect(0.493, 0.16, 0.014, 0.435, "#72797a");
    rect(0.499, 0.16, 0.003, 0.435, "#b0b2ad");
    rect(0.135, 0.585, 0.73, 0.018, "#a3a6a2");
    rect(0.14, 0.60, 0.72, 0.012, "#31373b");

    polygon([[0, 0.12], [0.105, 0.17], [0.135, 0.59], [0.20, 0.67], [0, 0.78]], "#454b50");
    polygon([[1, 0.12], [0.895, 0.17], [0.865, 0.59], [0.80, 0.67], [1, 0.78]], "#41474b");
    polygon([[0.015, 0.15], [0.085, 0.18], [0.12, 0.57], [0.045, 0.61]], environmentPrimary);
    polygon([[0.985, 0.15], [0.915, 0.18], [0.88, 0.57], [0.955, 0.61]], environmentPrimary);
    for (let i = 0; i < 7; i += 1) {
        const py = 0.22 + i * 0.05;
        rect(0.025, py, 0.052, 0.003, structuralTrim);
        rect(0.923, py, 0.052, 0.003, structuralTrim);
        crescent(0.041, py + 0.015, 0.007, i % 2 ? environmentPrimary : ambientLighting);
        crescent(0.959, py + 0.015, 0.007, i % 2 ? environmentPrimary : ambientLighting);
    }

    polygon([[0, 0.65], [0.16, 0.59], [0.31, 0.625], [0.69, 0.625], [0.84, 0.59], [1, 0.65], [1, 1], [0, 1]], "#343a3e");
    polygon([[0, 0.71], [0.18, 0.63], [0.33, 0.67], [0.67, 0.67], [0.82, 0.63], [1, 0.71], [1, 0.82], [0, 0.82]], "#777d7e");
    polygon([[0, 0.735], [0.19, 0.66], [0.34, 0.695], [0.66, 0.695], [0.81, 0.66], [1, 0.735], [1, 0.84], [0, 0.84]], "#565c60");
    polygon([[0, 0.84], [0.26, 0.77], [0.74, 0.77], [1, 0.84], [1, 1], [0, 1]], "#282d31");
    polygon([[0.22, 0.77], [0.78, 0.77], [0.90, 1], [0.10, 1]], "#454b4f");
    polygon([[0.29, 0.81], [0.71, 0.81], [0.78, 0.96], [0.22, 0.96]], consoleSurface);
    rect(0.30, 0.825, 0.40, 0.009, structuralTrim);
    rect(0.31, 0.838, 0.38, 0.004, ambientLighting);
    rect(0.25, 0.965, 0.50, 0.013, "#1a1e21");

    const stationHousing = (left, top, wide, tall) => {
        rect(left, top, wide, tall, "#252a2e");
        rect(left + 0.006, top + 0.008, wide - 0.012, tall - 0.016, "#a0a3a0");
        rect(left + 0.011, top + 0.014, wide - 0.022, tall - 0.028, environmentPrimary);
        rect(left + 0.017, top + 0.021, wide - 0.034, tall - 0.042, "#222b30");
        rect(left + 0.022, top + 0.027, wide - 0.044, 0.006, environmentSecondary);
        for (let i = 0; i < 3; i += 1) {
            crescent(left + 0.028 + i * 0.013, top + tall - 0.013, 0.004, i === 1 ? accent : ambientLighting);
        }
    };

    stationHousing(0.035, 0.405, 0.205, 0.175);
    stationHousing(0.76, 0.405, 0.205, 0.175);
    stationHousing(0.02, 0.585, 0.205, 0.14);
    stationHousing(0.755, 0.585, 0.225, 0.15);
    stationHousing(0.315, 0.49, 0.37, 0.205);

    for (let i = 0; i < 9; i += 1) {
        rect(0.265 + i * 0.052, 0.725, 0.025, 0.009, i % 3 === 0 ? "#b4b6b0" : "#282e31");
        rect(0.27 + i * 0.052, 0.741, 0.018, 0.008, i % 2 ? environmentPrimary : structuralTrim);
    }
    for (let i = 0; i < 8; i += 1) {
        rect(0.06 + i * 0.02, 0.88, 0.009, 0.022, "#23282c");
        rect(0.93 - i * 0.02, 0.88, 0.009, 0.022, "#23282c");
    }
    circle(0.17, 0.79, 0.018, "#24292c");
    circle(0.17, 0.79, 0.011, structuralTrim);
    circle(0.17, 0.79, 0.005, accent);
    circle(0.83, 0.79, 0.018, "#24292c");
    circle(0.83, 0.79, 0.011, structuralTrim);
    circle(0.83, 0.79, 0.005, "#858b8c");

    rect(0.03, 0.76, 0.06, 0.012, "#21272a");
    rect(0.91, 0.76, 0.06, 0.012, "#21272a");
    for (let i = 0; i < 5; i += 1) {
        fourPointStar(0.039 + i * 0.011, 0.766, 0.004, i === 1 ? accent : "#8e9697");
        fourPointStar(0.922 + i * 0.011, 0.766, 0.004, i === 3 ? accent : "#8e9697");
    }
}

function animateCockpitSky(timestamp) {
    cockpitAnimationFrame = 0;
    const shipSceneActive = [cockpitScene, welcomeScene, personnelScene]
        .some((scene) => scene.classList.contains("active"));
    if (reducedMotion || document.hidden || !shipSceneActive) {
        updateCockpitSkyAnimation();
        return;
    }

    if (!lastSkyFrameTime) {
        lastSkyFrameTime = timestamp;
    } else if (timestamp - lastSkyFrameTime >= 80) {
        skyAnimationTime += (timestamp - lastSkyFrameTime) / 1000;
        lastSkyFrameTime = timestamp;
        drawCockpit();
    }
    cockpitAnimationFrame = window.requestAnimationFrame(animateCockpitSky);
}

function updateCockpitSkyAnimation() {
    const shipSceneActive = [cockpitScene, welcomeScene, personnelScene]
        .some((scene) => scene.classList.contains("active"));
    if (!reducedMotion && !document.hidden && shipSceneActive) {
        if (!cockpitAnimationFrame) {
            lastSkyFrameTime = 0;
            cockpitAnimationFrame = window.requestAnimationFrame(animateCockpitSky);
        }
        return;
    }

    if (cockpitAnimationFrame) {
        window.cancelAnimationFrame(cockpitAnimationFrame);
        cockpitAnimationFrame = 0;
    }
    lastSkyFrameTime = 0;
}

document.addEventListener("beyond:themechange", drawCockpit);
document.addEventListener("beyond:scenechange", updateCockpitSkyAnimation);
document.addEventListener("visibilitychange", updateCockpitSkyAnimation);

if (cockpitCanvas && cockpitContext) {
    drawCockpit();
    const cockpitResizeObserver = new ResizeObserver(drawCockpit);
    [cockpitCanvas, wakeCockpitCanvas, personnelCockpitCanvas]
        .filter(Boolean)
        .forEach((canvas) => cockpitResizeObserver.observe(canvas));
    window.addEventListener("resize", drawCockpit);
}
updateCockpitSkyAnimation();

stations.forEach((station) => {
    station.addEventListener("click", () => {
        stations.forEach((item) => {
            item.setAttribute("aria-pressed", "false");
        });
        station.setAttribute("aria-pressed", "true");

        if (stationFeedback) {
            stationFeedback.textContent = stationMessages[station.dataset.action] || "Ship station selected";
            stationFeedback.classList.add("is-visible");
        }
        if (station.dataset.action === "profile") {
            window.AstronautPersonnel?.open();
        } else if (station.dataset.action === "new-mission" || station.dataset.action === "continue") {
            window.BeyondEarthMissionsTab?.open();
        } else if (station.dataset.action === "run-mission") {
            try {
                const launch = window.BeyondEarthMissionsTab?.runApprovedMission;
                if (typeof launch !== "function") {
                    throw new Error("Mission launch controls are not ready.");
                }
                Promise.resolve(launch()).catch((error) => {
                    if (stationFeedback) stationFeedback.textContent = `Launch unavailable · ${error.message}`;
                });
            } catch (error) {
                if (stationFeedback) stationFeedback.textContent = `Launch unavailable · ${error.message}`;
            }
        }
    });
});