(() => {
    "use strict";

    const game = document.getElementById("game");
    if (!game) return;

    const robot = document.createElement("div");
    robot.className = "landing-zone__robot";
    robot.setAttribute("aria-hidden", "true");
    robot.innerHTML = `
        <span class="landing-zone__robot-antenna"></span>
        <span class="landing-zone__robot-head"><span class="landing-zone__robot-eyes"><i></i><i></i></span></span>
        <span class="landing-zone__robot-arm landing-zone__robot-arm--left"></span>
        <span class="landing-zone__robot-arm landing-zone__robot-arm--right"></span>
        <span class="landing-zone__robot-body"></span>
        <span class="landing-zone__robot-leg landing-zone__robot-leg--left"></span>
        <span class="landing-zone__robot-leg landing-zone__robot-leg--right"></span>
    `;

    const layer = document.createElement("aside");
    layer.id = "game-robot-companion";
    layer.setAttribute("aria-label", "Robot companion R-01");
    const bubble = document.createElement("div");
    bubble.id = "game-robot-companion-bubble";
    bubble.className = "game-robot-companion__bubble";
    bubble.setAttribute("role", "status");
    bubble.setAttribute("aria-live", "polite");
    bubble.hidden = true;
    const name = document.createElement("span");
    name.className = "game-robot-companion__name";
    name.textContent = "UNIT R-01";
    const message = document.createElement("p");
    message.className = "game-robot-companion__message";
    bubble.append(name, message);

    const button = document.createElement("button");
    button.className = "game-robot-companion__button";
    button.type = "button";
    button.setAttribute("aria-label", "Ask R-01 for help");
    button.setAttribute("aria-controls", bubble.id);
    button.setAttribute("aria-expanded", "false");
    const robotWrap = document.createElement("span");
    robotWrap.className = "sr-only";
    robotWrap.textContent = "R-01, your robot companion";
    button.append(robot, robotWrap);
    layer.append(bubble, button);
    game.appendChild(layer);

    const idleLines = [
        "I polished my antenna. It is now 3% shinier.",
        "I counted the stars, then one blinked and I had to start again.",
        "Tiny systems dance complete. All bolts remain accounted for.",
        "I am keeping an eye out for stray space dust. It is very sneaky.",
    ];
    let currentMessage = "I’m R-01, your co-pilot. Tap me anytime for a hand.";
    let messageTimer = 0;
    let idleTimer = 0;
    let lastSpokeAt = 0;

    function currentSceneId() {
        return window.BeyondEarthScenes?.getCurrentScene?.()
            || document.querySelector(".scene.active")?.id
            || "";
    }

    function activeMinigame() {
        return window.BeyondEarthMinigames?.getActive?.() || null;
    }

    function contextualMessage() {
        const sceneId = currentSceneId();
        const mission = window.BeyondEarthMissionManager?.getActiveMission?.();
        const profile = window.BeyondEarthPlayer?.getPersonnelFile?.();
        const playerName = profile?.agentName?.trim() || profile?.fullName?.trim();
        const greeting = playerName ? `${playerName}, ` : "";

        if (sceneId === "launch-scene") return `${greeting}I have checked the launch systems twice. Everything is ready when you are.`;
        if (sceneId === "welcome-scene") return "Primary power is waiting. Press the big switch and I will bring the ship online.";
        if (sceneId === "cockpit-scene") return `${greeting}your ship is ready. Pick a station and I will keep the diagnostics tidy.`;
        if (sceneId === "missions-scene") {
            return mission
                ? `I am tracking ${mission.name}. Check the destination and equipment before we launch.`
                : "Tell me where we are headed and what we should discover. I will check the systems as we plan.";
        }
        if (sceneId === "personnel-scene") return "I matched my indicator lights to your profile colour. Looking sharp, pilot.";
        if (sceneId === "mission-play-scene") return "I am monitoring our flight. Follow the challenge briefing and I will help with the details.";
        return currentMessage;
    }

    function applyPalette(palette) {
        if (!palette) return;
        layer.style.setProperty("--theme-primary", palette.primary);
        layer.style.setProperty("--theme-highlight", palette.highlight);
        layer.style.setProperty("--lz-lavender", palette.primary);
        layer.style.setProperty("--lz-pink", palette.highlight);
        layer.style.setProperty("--lz-mint", palette.highlight);
        layer.style.setProperty("--lz-gold", palette.highlight);
    }

    function updateProfileAccent() {
        const profile = window.BeyondEarthPlayer?.getPersonnelFile?.();
        const family = profile?.colorFamily;
        if (!family || !window.BeyondEarthTheme?.hasColorFamily?.(family)) return;
        applyPalette(window.BeyondEarthTheme.getPalette(family));
    }

    function closeBubble() {
        window.clearTimeout(messageTimer);
        messageTimer = 0;
        bubble.hidden = true;
        button.setAttribute("aria-expanded", "false");
    }

    function showMessage(text, mood = "idle", duration = 7000) {
        if (typeof text !== "string" || !text.trim()) return;
        currentMessage = text.trim();
        message.textContent = currentMessage;
        layer.dataset.mood = mood;
        robot.classList.toggle("is-happy", mood === "happy");
        robot.classList.toggle("is-alert", mood === "alert");
        robot.classList.toggle("is-mischievous", mood === "mischievous");
        bubble.hidden = false;
        button.setAttribute("aria-expanded", "true");
        lastSpokeAt = Date.now();
        window.clearTimeout(messageTimer);
        messageTimer = duration > 0 ? window.setTimeout(closeBubble, duration) : 0;
    }

    const playHost = document.getElementById("mission-play-host");
    const deploymentDialog = document.getElementById("mission-deployment");

    function syncHost() {
        const openDialogs = document.querySelectorAll("dialog[open]");
        const target = openDialogs[openDialogs.length - 1] || game;
        if (layer.parentElement !== target) target.appendChild(layer);
        layer.classList.toggle("is-dialog", target !== game);
        layer.classList.toggle("is-deployment", target === deploymentDialog);
        return target !== game ? target : null;
    }

    function syncVisibility() {
        const activeDialog = syncHost();
        const sceneId = currentSceneId();
        const activeGame = activeMinigame();
        const hasEmbeddedSequenceRobot = sceneId === "mission-play-scene"
            && !activeGame
            && playHost
            && !playHost.hidden;
        const hasEmbeddedRadarRobot = activeGame?.id === "landing-zone-radar-defence";
        layer.hidden = Boolean(hasEmbeddedSequenceRobot || hasEmbeddedRadarRobot);
        layer.classList.toggle("is-mission-play", sceneId === "mission-play-scene");
        if (layer.hidden || (activeDialog && activeDialog !== deploymentDialog)) closeBubble();
    }

    if (playHost && typeof MutationObserver === "function") {
        new MutationObserver(syncVisibility).observe(playHost, {
            attributes: true,
            attributeFilter: ["hidden"],
            childList: true,
        });
    }

    const dialogObserver = typeof MutationObserver === "function" ? new MutationObserver(syncVisibility) : null;
    document.querySelectorAll("dialog").forEach((dialog) => {
        dialog.addEventListener("close", syncVisibility);
        dialogObserver?.observe(dialog, { attributes: true, attributeFilter: ["open"] });
    });

    function sceneChanged(event) {
        syncVisibility();
        if (!layer.hidden) showMessage(contextualMessage(), "curious", 8500);
    }

    function gameInstructions(id) {
        const instructions = {
            "spectrum-detective": "Compare the full signal with the reference samples. A matching peak pattern is more reliable than one bright line.",
            "payload-tetris": "Choose a piece, rotate it if needed, and fit every required module inside the bay without exceeding its mass limit.",
            "cosmic-claw": "Line up the claw with a prize, then grab it. I will keep count while you hunt for the high-value treasures.",
            "landing-zone-radar-defence": "Track each marker toward the centre and change lanes before it reaches the spacecraft.",
        };
        return instructions[id] || "I am standing by. Check the game instructions and I will keep watch.";
    }

    button.addEventListener("click", () => {
        if (bubble.hidden) showMessage(contextualMessage(), "curious", 0);
        else closeBubble();
    });

    document.addEventListener("beyond:scenechange", sceneChanged);
    document.addEventListener("beyond:themechange", (event) => {
        applyPalette(event.detail?.palette);
    });
    document.addEventListener("beyond:personnelupdated", updateProfileAccent);
    document.addEventListener("beyond:missionapproved", (event) => {
        const mission = event.detail?.mission;
        showMessage(mission
            ? `${mission.name} is approved. I am warming up the launch sensors.`
            : "Mission approved. Launch sensors are warming up.", "happy");
        syncVisibility();
    });
    document.addEventListener("beyond:missiondeploymentstart", () => {
        showMessage("Deployment sequence is underway. I will watch the approach and meet you at the first challenge.", "excited");
        syncVisibility();
    });
    document.addEventListener("beyond:missiondeploymentend", (event) => {
        const mission = event.detail?.mission;
        if (mission) showMessage(`${mission.name} is deployed. I am bringing up the mission checklist.`, "happy");
        syncVisibility();
    });
    document.addEventListener("beyond:minigamestart", (event) => {
        syncVisibility();
        const activeGame = activeMinigame();
        if (activeGame?.id !== "landing-zone-radar-defence") {
            showMessage(gameInstructions(event.detail?.id), "curious");
        }
    });
    document.addEventListener("beyond:minigameend", syncVisibility);
    document.addEventListener("beyond:minigameobservation", (event) => {
        const reactions = {
            discovery: ["Good find. I am saving that signal for the science team.", "That looks useful. I have marked the discovery."],
            obstacle: ["Careful—there is a tricky bit ahead. Slow down and check your placement.", "I spotted a snag. You have time to make a clean correction."],
            progress: ["Nice work, pilot. The mission systems are keeping up with you.", "Looking good. I have logged that progress."],
            reset: ["No worries. I cleared the slate and recalibrated my tiny clipboard.", "Fresh start. I am ready when you are."],
        };
        const options = reactions[event.detail?.kind];
        if (options?.length) showMessage(options[Math.floor(Math.random() * options.length)], "happy", 5200);
    });
    document.addEventListener("beyond:minigameresult", (event) => {
        const result = event.detail?.result;
        if (!result) return;
        const percentage = Number.isFinite(result.normalizedPercentage)
            ? result.normalizedPercentage
            : Number.isFinite(result.performanceRating) ? Math.round(result.performanceRating * 100) : null;
        if (percentage === null) return;
        showMessage(percentage >= 80
            ? `Excellent run! ${percentage}% performance. I am filing this under “pilot knows their stuff.”`
            : percentage >= 45
                ? `${percentage}% is a solid recovery. We still have the whole mission to bring home.`
                : `${percentage}%—that was a tough one. Take a breath; I will help with the next challenge.`,
        percentage >= 80 ? "happy" : percentage < 45 ? "alert" : "curious");
    });
    document.addEventListener("beyond:minigameerror", (event) => {
        showMessage(`I could not start ${event.detail?.id || "that challenge"}. The mission is safe; try it again from the briefing.`, "alert");
    });
    document.addEventListener("beyond:missioncompleted", (event) => {
        const ending = event.detail?.mission?.performance?.ending;
        showMessage(ending === "perfect"
            ? "We made it home in perfect condition! I am saving a copy of the star chart for my desk."
            : "We are safely back. I am checking the equipment and celebrating the parts that went right.", "happy");
        syncVisibility();
    });
    document.addEventListener("beyond:missionclosed", (event) => {
        const mission = event.detail?.mission;
        if (mission?.status === "failed") {
            showMessage("Emergency report archived. I am still here, pilot—we can learn from this and try again.", "alert");
        }
        syncVisibility();
    });

    function scheduleAntics() {
        idleTimer = window.setTimeout(() => {
            if (!document.hidden && !layer.hidden && Date.now() - lastSpokeAt > 19000) {
                showMessage(idleLines[Math.floor(Math.random() * idleLines.length)], "mischievous", 5200);
            }
            scheduleAntics();
        }, 24000 + Math.random() * 12000);
    }

    updateProfileAccent();
    syncVisibility();
    showMessage(contextualMessage(), "curious", 8500);
    scheduleAntics();
})();
