(() => {
    "use strict";

    const GAME_ID = "landing-zone-radar-defence";
    const ROUND_DURATION_MS = 45000;
    const RADAR_SIZE = 640;
    const RADAR_CENTER = RADAR_SIZE / 2;
    const RADAR_RADIUS = 255;
    const COLLISION_DISTANCE = 23;
    const WARNING_DISTANCE = 145;
    const LANE_NAMES = ["LEFT · LANE 01", "CENTRE · LANE 02", "RIGHT · LANE 03"];
    const OBJECT_TYPES = Object.freeze({
        hostile: Object.freeze({ name: "Hostile Debris", color: "#ff777d", points: 100 }),
        asteroid: Object.freeze({ name: "Asteroid", color: "#ffb477", points: 150 }),
        rare: Object.freeze({ name: "Rare Object", color: "#f2d18a", points: 250 }),
    });

    function clamp(value, minimum, maximum) {
        return Math.min(maximum, Math.max(minimum, value));
    }

    function randomBetween(minimum, maximum) {
        return minimum + Math.random() * (maximum - minimum);
    }

    function makeElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function createGame(hooks = {}) {
        const root = makeElement("section", "landing-zone");
        root.setAttribute("aria-label", "Landing Zone Radar Defence");
        root.innerHTML = `
            <div class="landing-zone__shell">
                <aside class="landing-zone__briefing" aria-label="Mission briefing">
                    <div class="landing-zone__brandline">
                        <span>LANDING ZONE</span>
                        <span class="landing-zone__active">ACTIVE MISSION</span>
                    </div>
                    <p class="landing-zone__eyebrow">SPACECRAFT WARNING SYSTEM</p>
                    <h1 class="landing-zone__title">RADAR<br>DEFENCE</h1>
                    <p class="landing-zone__intro">Guide the spacecraft through the debris field. Watch the radar, read each object's lane, and protect all three shields until landing.</p>
                    <div class="landing-zone__meter-panel">
                        <span>MISSION PROGRESS</span>
                        <strong data-progress-label>0%</strong>
                        <div class="landing-zone__progress" role="progressbar" aria-label="Mission progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                            <div class="landing-zone__progress-fill" data-progress></div>
                        </div>
                        <span>DESCENT TIMER</span>
                        <strong data-time>00:45</strong>
                        <span>FLIGHT SCORE</span>
                        <strong data-score>0</strong>
                        <span>SHIELDS</span>
                        <span class="landing-zone__shields" data-shields aria-label="3 shields remaining"></span>
                    </div>
                    <div class="landing-zone__robot-card">
                        <div class="landing-zone__robot" data-robot aria-hidden="true">
                            <span class="landing-zone__robot-antenna"></span>
                            <span class="landing-zone__robot-head"><span class="landing-zone__robot-eyes"><i></i><i></i></span></span>
                            <span class="landing-zone__robot-arm landing-zone__robot-arm--left"></span>
                            <span class="landing-zone__robot-arm landing-zone__robot-arm--right"></span>
                            <span class="landing-zone__robot-body"></span>
                            <span class="landing-zone__robot-leg landing-zone__robot-leg--left"></span>
                            <span class="landing-zone__robot-leg landing-zone__robot-leg--right"></span>
                        </div>
                        <div>
                            <p class="landing-zone__robot-name">UNIT R-01</p>
                            <p class="landing-zone__robot-message" data-robot-message role="status" aria-live="polite">Radar online. Ready when you are, pilot.</p>
                        </div>
                    </div>
                    <section class="landing-zone__log" aria-label="Mission log">
                        <h2 class="landing-zone__log-title">MISSION LOG</h2>
                        <ol class="landing-zone__log-list" data-log aria-live="polite"></ol>
                    </section>
                </aside>
                <section class="landing-zone__cockpit" aria-label="Flight control system">
                    <header class="landing-zone__cockpit-header">
                        <div>
                            <h2>FLIGHT CONTROL SYSTEM</h2>
                            <p class="landing-zone__cockpit-subtitle">ORBITAL NAVIGATION TERMINAL // 07</p>
                        </div>
                        <span class="landing-zone__scan-indicator">RADAR SCANNING</span>
                    </header>
                    <div class="landing-zone__radar-frame">
                        <canvas class="landing-zone__radar" width="640" height="640" data-radar
                            aria-label="Animated proximity radar showing the spacecraft and incoming objects"></canvas>
                        <div class="landing-zone__toast" data-toast role="status" aria-live="assertive" hidden></div>
                    </div>
                    <div class="landing-zone__radar-legend" aria-label="Radar legend">
                        <span class="landing-zone__legend-item"><i class="landing-zone__legend-dot"></i>HOSTILE DEBRIS</span>
                        <span class="landing-zone__legend-item"><i class="landing-zone__legend-dot landing-zone__legend-dot--asteroid"></i>ASTEROID</span>
                        <span class="landing-zone__legend-item"><i class="landing-zone__legend-dot landing-zone__legend-dot--rare"></i>RARE OBJECT</span>
                    </div>
                    <div class="landing-zone__warning" data-warning data-kind="clear" role="status" aria-live="assertive">SYSTEM CLEAR</div>
                    <div class="landing-zone__flight-controls">
                        <div class="landing-zone__trajectory" role="group" aria-label="Choose flight trajectory">
                            <button type="button" class="landing-zone__button" data-lane="0">LEFT · LANE 01</button>
                            <button type="button" class="landing-zone__button is-active" data-lane="1" aria-pressed="true">CENTRE · LANE 02</button>
                            <button type="button" class="landing-zone__button" data-lane="2">RIGHT · LANE 03</button>
                        </div>
                        <div class="landing-zone__utility">
                            <button type="button" class="landing-zone__button landing-zone__button--scan" data-action="scan">MANUAL SCAN</button>
                            <button type="button" class="landing-zone__button" data-action="stabilize">AUTO STABILIZE</button>
                            <button type="button" class="landing-zone__button landing-zone__button--boost" data-action="boost">EVASIVE BOOST</button>
                            <button type="button" class="landing-zone__button" data-action="sound" aria-pressed="true">SOUND ON</button>
                            <button type="button" class="landing-zone__button" data-action="pause">PAUSE</button>
                        </div>
                    </div>
                    <div class="landing-zone__flight-status">
                        <span>TRAJECTORY <strong data-trajectory>CENTRE · LANE 02</strong></span>
                        <span>FLIGHT MODE <strong data-mode>MANUAL</strong></span>
                    </div>
                    <div class="landing-zone__overlay" data-start-overlay>
                        <div class="landing-zone__overlay-card">
                            <span class="landing-zone__eyebrow">SPACECRAFT WARNING SYSTEM</span>
                            <h2>INCOMING OBJECTS</h2>
                            <p>Final descent is underway. Track the radar objects and change flight lanes to protect the spacecraft. Collect rare objects when they enter your lane.</p>
                            <div class="landing-zone__instructions">
                                <div class="landing-zone__instruction"><strong>WATCH</strong>Track markers moving toward radar centre.</div>
                                <div class="landing-zone__instruction"><strong>IDENTIFY</strong>Match the marker's lane to its lane number.</div>
                                <div class="landing-zone__instruction"><strong>EVADE</strong>Choose another lane before impact.</div>
                            </div>
                            <button type="button" class="landing-zone__button" data-action="start">START RADAR DEFENCE</button>
                            <p>ESTIMATED DURATION · 45 SECONDS</p>
                        </div>
                    </div>
                    <div class="landing-zone__overlay" data-pause-overlay hidden>
                        <div class="landing-zone__overlay-card">
                            <span class="landing-zone__eyebrow">FLIGHT CONTROL HOLD</span>
                            <h2>MISSION PAUSED</h2>
                            <p>The spacecraft is holding position. Resume when you are ready to continue the descent.</p>
                            <button type="button" class="landing-zone__button" data-action="resume">RESUME MISSION</button>
                        </div>
                    </div>
                    <div class="landing-zone__overlay" data-result-overlay hidden>
                        <div class="landing-zone__overlay-card">
                            <span class="landing-zone__eyebrow" data-result-eyebrow>DESCENT REPORT</span>
                            <h2 data-result-title>MISSION COMPLETE</h2>
                            <p data-result-message>Safe landing achieved.</p>
                            <div class="landing-zone__result-stats">
                                <div class="landing-zone__result-stat"><span>FINAL SCORE</span><strong data-final-score>0</strong></div>
                                <div class="landing-zone__result-stat"><span>OBJECTS AVOIDED</span><strong data-avoided>0</strong></div>
                                <div class="landing-zone__result-stat"><span>RARE OBJECTS</span><strong data-rare>0</strong></div>
                            </div>
                            <div data-badge class="landing-zone__badge" hidden>RADAR DEFENDER BADGE UNLOCKED</div>
                            <p><button type="button" class="landing-zone__button" data-action="replay">PLAY AGAIN</button></p>
                            <button type="button" class="landing-zone__button" data-action="close">CLOSE</button>
                        </div>
                    </div>
                </section>
            </div>
        `;

        const query = (selector) => root.querySelector(selector);
        const canvas = query("[data-radar]");
        const context2d = canvas.getContext("2d");
        const timeOutput = query("[data-time]");
        const scoreOutput = query("[data-score]");
        const progressOutput = query("[data-progress]");
        const progressBar = progressOutput.parentElement;
        const progressLabel = query("[data-progress-label]");
        const shieldsElement = query("[data-shields]");
        const logList = query("[data-log]");
        const robot = query("[data-robot]");
        const robotMessage = query("[data-robot-message]");
        const warning = query("[data-warning]");
        const toast = query("[data-toast]");
        const trajectoryOutput = query("[data-trajectory]");
        const modeOutput = query("[data-mode]");
        const startOverlay = query("[data-start-overlay]");
        const pauseOverlay = query("[data-pause-overlay]");
        const resultOverlay = query("[data-result-overlay]");
        const resultTitle = query("[data-result-title]");
        const resultMessage = query("[data-result-message]");
        const resultEyebrow = query("[data-result-eyebrow]");
        const finalScoreOutput = query("[data-final-score]");
        const avoidedOutput = query("[data-avoided]");
        const rareOutput = query("[data-rare]");
        const badge = query("[data-badge]");
        const actionButtons = Array.from(root.querySelectorAll("[data-action]"));
        const laneButtons = Array.from(root.querySelectorAll("[data-lane]"));
        const state = {
            phase: "ready",
            elapsedMs: 0,
            lastFrameTime: 0,
            nextSpawnMs: 900,
            nextObjectId: 1,
            objects: [],
            particles: [],
            shields: 3,
            score: 0,
            avoided: 0,
            rareCollected: 0,
            lane: 1,
            sweepAngle: -Math.PI / 2,
            warningText: "SYSTEM CLEAR",
            warningKind: "clear",
            warningUntil: 0,
            mode: "MANUAL",
            stabilizedUntil: 0,
            boostUntil: 0,
            boostReadyAt: 0,
            soundEnabled: true,
            audioContext: null,
            masterGain: null,
            frame: 0,
            toastTimeout: 0,
            lastThreatMessageAt: -Infinity,
            disposed: false,
        };

        function formatTime(milliseconds) {
            const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
            return `00:${String(seconds).padStart(2, "0")}`;
        }

        function elapsedTimeLabel() {
            const seconds = Math.floor(state.elapsedMs / 1000);
            return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
        }

        function enableAudio() {
            if (!state.soundEnabled) return null;
            const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextConstructor) {
                state.soundEnabled = false;
                query('[data-action="sound"]').textContent = "SOUND UNAVAILABLE";
                query('[data-action="sound"]').setAttribute("aria-pressed", "false");
                showToast("Sound is not available in this browser.", 2600);
                return null;
            }
            if (!state.audioContext) {
                state.audioContext = new AudioContextConstructor();
                state.masterGain = state.audioContext.createGain();
                state.masterGain.gain.value = 1;
                state.masterGain.connect(state.audioContext.destination);
            }
            if (state.audioContext.state === "suspended") {
                state.audioContext.resume().catch((error) => {
                    showToast(`Audio could not start: ${error.message}`, 2600);
                });
            }
            return state.audioContext;
        }

        function tone(frequency, duration, waveform = "sine", volume = 0.035, endFrequency = frequency, delay = 0) {
            const audioContext = enableAudio();
            if (!audioContext || !state.masterGain) return;
            const startAt = audioContext.currentTime + delay;
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            oscillator.type = waveform;
            oscillator.frequency.setValueAtTime(frequency, startAt);
            oscillator.frequency.linearRampToValueAtTime(endFrequency, startAt + duration);
            gain.gain.setValueAtTime(0.0001, startAt);
            gain.gain.linearRampToValueAtTime(volume, startAt + Math.min(0.025, duration / 3));
            gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
            oscillator.connect(gain);
            gain.connect(state.masterGain);
            oscillator.start(startAt);
            oscillator.stop(startAt + duration + 0.01);
        }

        function playSound(kind) {
            if (!state.soundEnabled) return;
            if (kind === "lane") {
                tone(330, 0.07, "square", 0.02, 470);
            } else if (kind === "alert") {
                tone(640, 0.12, "triangle", 0.035, 470);
                tone(740, 0.12, "triangle", 0.03, 520, 0.17);
            } else if (kind === "rare") {
                [523, 659, 784, 1047].forEach((frequency, index) => {
                    tone(frequency, 0.18, "triangle", 0.035, frequency * 1.04, index * 0.11);
                });
            } else if (kind === "collision") {
                tone(180, 0.24, "sawtooth", 0.05, 78);
                tone(95, 0.28, "triangle", 0.045, 55, 0.16);
            } else if (kind === "start") {
                tone(420, 0.12, "square", 0.03, 550);
                tone(620, 0.15, "triangle", 0.035, 760, 0.13);
            } else if (kind === "pause") {
                tone(410, 0.12, "triangle", 0.025, 300);
            } else if (kind === "resume") {
                tone(300, 0.12, "triangle", 0.025, 430);
            } else if (kind === "complete") {
                [523, 659, 784, 1047].forEach((frequency, index) => {
                    tone(frequency, 0.25, "triangle", 0.04, frequency * 1.06, index * 0.17);
                });
            }
        }

        function showToast(message, duration = 2200) {
            window.clearTimeout(state.toastTimeout);
            toast.textContent = message;
            toast.hidden = false;
            state.toastTimeout = window.setTimeout(() => {
                toast.hidden = true;
            }, duration);
        }

        function setRobotMessage(message, mood = "") {
            robotMessage.textContent = message;
            robot.classList.toggle("is-alert", mood === "alert");
            robot.classList.toggle("is-happy", mood === "happy");
        }

        function updateWarning(message, kind = "clear", duration = 3000) {
            state.warningText = message;
            state.warningKind = kind;
            state.warningUntil = state.elapsedMs + duration;
            warning.textContent = message;
            warning.dataset.kind = kind;
        }

        function addLog(message) {
            const item = makeElement("li");
            const time = makeElement("time", "", elapsedTimeLabel());
            time.dateTime = `PT${Math.floor(state.elapsedMs / 1000)}S`;
            item.append(time, makeElement("span", "", message));
            logList.prepend(item);
            while (logList.children.length > 6) {
                logList.lastElementChild.remove();
            }
        }

        function updateHud() {
            timeOutput.textContent = formatTime(ROUND_DURATION_MS - state.elapsedMs);
            scoreOutput.textContent = String(state.score);
            const percent = Math.floor(clamp(state.elapsedMs / ROUND_DURATION_MS, 0, 1) * 100);
            progressOutput.style.width = `${percent}%`;
            progressLabel.textContent = `${percent}%`;
            progressBar.setAttribute("aria-valuenow", String(percent));
            shieldsElement.replaceChildren();
            for (let index = 0; index < 3; index += 1) {
                const shield = makeElement("i", `landing-zone__shield${index >= state.shields ? " is-lost" : ""}`);
                shield.setAttribute("aria-hidden", "true");
                shieldsElement.appendChild(shield);
            }
            shieldsElement.setAttribute("aria-label", `${state.shields} shield${state.shields === 1 ? "" : "s"} remaining`);
            trajectoryOutput.textContent = LANE_NAMES[state.lane];
            modeOutput.textContent = state.mode;
            laneButtons.forEach((button, index) => {
                const active = index === state.lane;
                button.classList.toggle("is-active", active);
                button.setAttribute("aria-pressed", String(active));
                button.disabled = state.phase !== "running";
            });
            const running = state.phase === "running";
            actionButtons.forEach((button) => {
                const action = button.dataset.action;
                if (["scan", "stabilize", "pause"].includes(action)) button.disabled = !running;
                if (action === "boost") {
                    const boostRemaining = Math.max(0, state.boostReadyAt - state.elapsedMs);
                    button.disabled = !running || boostRemaining > 0;
                    button.classList.toggle("is-active", state.elapsedMs < state.boostUntil);
                    button.textContent = state.elapsedMs < state.boostUntil
                        ? "BOOST ACTIVE"
                        : boostRemaining > 0
                            ? `BOOST ${Math.ceil(boostRemaining / 1000)}s`
                            : "EVASIVE BOOST";
                }
                if (action === "sound") {
                    button.textContent = state.soundEnabled ? "SOUND ON" : "SOUND OFF";
                    button.setAttribute("aria-pressed", String(state.soundEnabled));
                }
            });
        }

        function drawRadar() {
            const ctx = context2d;
            const center = RADAR_CENTER;
            const radius = RADAR_RADIUS;
            ctx.clearRect(0, 0, RADAR_SIZE, RADAR_SIZE);
            ctx.fillStyle = "#14181e";
            ctx.fillRect(0, 0, RADAR_SIZE, RADAR_SIZE);
            ctx.fillStyle = "#19221f";
            ctx.beginPath();
            ctx.arc(center, center, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "rgba(169, 226, 206, 0.17)";
            ctx.lineWidth = 2;
            for (let ring = 1; ring <= 3; ring += 1) {
                ctx.beginPath();
                ctx.arc(center, center, radius * ring / 3, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.strokeStyle = "rgba(199, 203, 210, 0.14)";
            ctx.beginPath();
            ctx.moveTo(center - radius, center);
            ctx.lineTo(center + radius, center);
            ctx.moveTo(center, center - radius);
            ctx.lineTo(center, center + radius);
            ctx.moveTo(center - radius * 0.71, center - radius * 0.71);
            ctx.lineTo(center + radius * 0.71, center + radius * 0.71);
            ctx.moveTo(center + radius * 0.71, center - radius * 0.71);
            ctx.lineTo(center - radius * 0.71, center + radius * 0.71);
            ctx.stroke();

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, state.sweepAngle, state.sweepAngle + 0.42);
            ctx.closePath();
            ctx.fillStyle = "rgba(169, 226, 206, 0.12)";
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.lineTo(center + Math.cos(state.sweepAngle) * radius, center + Math.sin(state.sweepAngle) * radius);
            ctx.strokeStyle = "rgba(169, 226, 206, 0.82)";
            ctx.lineWidth = 2;
            ctx.shadowColor = "#a9e2ce";
            ctx.shadowBlur = 12;
            ctx.stroke();
            ctx.restore();

            ctx.strokeStyle = "#84928c";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(center, center, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.font = '700 17px "Space Mono", monospace';
            ctx.textAlign = "center";
            ctx.fillStyle = "#d4d7dc";
            ctx.fillText("N", center, 32);
            ctx.fillText("S", center, RADAR_SIZE - 15);
            ctx.fillText("W", 31, center + 6);
            ctx.fillText("E", RADAR_SIZE - 31, center + 6);

            state.objects.forEach((object) => {
                const x = center + Math.cos(object.angle) * (object.distance / 220) * radius;
                const y = center + Math.sin(object.angle) * (object.distance / 220) * radius;
                const proximity = clamp(1 - object.distance / 220, 0, 1);
                const size = 8 + proximity * 9 + Math.sin(state.elapsedMs / 120 + object.id) * proximity * 2;
                const definition = OBJECT_TYPES[object.type];
                ctx.save();
                ctx.shadowColor = definition.color;
                ctx.shadowBlur = 7 + proximity * 15;
                ctx.fillStyle = definition.color;
                ctx.beginPath();
                ctx.arc(x, y, size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.fillStyle = "#171a20";
                ctx.font = "700 10px monospace";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(String(object.lane + 1), x, y + 0.5);
                ctx.restore();
            });

            state.particles = state.particles.filter((particle) => state.elapsedMs - particle.startedAt < particle.duration);
            state.particles.forEach((particle) => {
                const progress = (state.elapsedMs - particle.startedAt) / particle.duration;
                const alpha = clamp(1 - progress, 0, 1);
                const burstRadius = progress * 56;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = particle.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(center, center, burstRadius, 0, Math.PI * 2);
                ctx.stroke();
                for (let index = 0; index < 8; index += 1) {
                    const angle = index * Math.PI / 4;
                    const x = center + Math.cos(angle) * burstRadius;
                    const y = center + Math.sin(angle) * burstRadius;
                    ctx.fillStyle = particle.color;
                    ctx.fillRect(x - 3, y - 3, 6, 6);
                }
                ctx.restore();
            });

            ctx.save();
            ctx.translate(center, center);
            ctx.fillStyle = "#c9b9e9";
            ctx.strokeStyle = "#f3edfc";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -17);
            ctx.lineTo(11, 12);
            ctx.lineTo(0, 7);
            ctx.lineTo(-11, 12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#a9e2ce";
            ctx.fillRect(-3, -2, 6, 8);
            ctx.restore();
        }

        function spawnObject() {
            const roll = Math.random();
            const type = roll < 0.44 ? "hostile" : roll < 0.8 ? "asteroid" : "rare";
            state.objects.push({
                id: state.nextObjectId++,
                type,
                angle: randomBetween(0, Math.PI * 2),
                distance: randomBetween(205, 220),
                speed: randomBetween(29, 38),
                lane: Math.floor(Math.random() * 3),
                warned: false,
            });
        }

        function triggerWarning(object) {
            object.warned = true;
            const text = object.type === "hostile" ? "THREAT FOUND" : "INCOMING OBJECT DETECTED";
            updateWarning(text, object.type === "hostile" ? "danger" : "attention", 2300);
            playSound("alert");
            if (state.elapsedMs - state.lastThreatMessageAt > 3800) {
                setRobotMessage("Pilot! Something is approaching! Check your radar!", "alert");
                state.lastThreatMessageAt = state.elapsedMs;
            }
        }

        function collectRareObject() {
            state.score += OBJECT_TYPES.rare.points;
            state.rareCollected += 1;
            state.particles.push({ startedAt: state.elapsedMs, duration: 720, color: OBJECT_TYPES.rare.color });
            updateWarning("RARE OBJECT COLLECTED", "reward", 3200);
            showToast("RARE OBJECT COLLECTED · +250 POINTS");
            addLog("Rare object collected · +250 points");
            setRobotMessage("OHH! A rare object! We found something shiny!", "happy");
            playSound("rare");
        }

        function collideWith(object) {
            const definition = OBJECT_TYPES[object.type];
            state.objects = state.objects.filter((candidate) => candidate !== object);
            if (object.type === "rare") {
                if (object.lane === state.lane) collectRareObject();
                else {
                    updateWarning("SYSTEM CLEAR", "clear", 1000);
                    addLog("Rare object passed outside current lane");
                }
            } else if (object.lane === state.lane) {
                state.shields -= 1;
                state.score -= 50;
                updateWarning("SHIELD IMPACT", "danger", 3500);
                showToast(`SHIELD IMPACT · ${state.shields} REMAINING · −50 POINTS`);
                addLog(`${definition.name} collision · shield lost · −50`);
                setRobotMessage("WARNING!! That was way too close! Be careful!", "alert");
                playSound("collision");
                updateHud();
                if (state.shields <= 0) finishRound(false);
            } else {
                state.avoided += 1;
                state.score += definition.points;
                updateWarning("OBJECT AVOIDED", "clear", 2500);
                showToast(`${definition.name.toUpperCase()} AVOIDED · +${definition.points}`);
                addLog(`${definition.name} avoided · +${definition.points} points`);
                setRobotMessage("Nice flying, pilot! That was a perfect dodge!", "happy");
                updateHud();
            }
        }

        function nearestObject() {
            return state.objects.reduce((nearest, object) => {
                return !nearest || object.distance < nearest.distance ? object : nearest;
            }, null);
        }

        function directionFor(angle) {
            const degrees = ((angle * 180 / Math.PI) + 360) % 360;
            if (degrees < 45 || degrees >= 315) return "EAST";
            if (degrees < 135) return "SOUTH";
            if (degrees < 225) return "WEST";
            return "NORTH";
        }

        function manualScan() {
            if (state.phase !== "running") return;
            const nearest = nearestObject();
            const result = nearest
                ? `${state.objects.length} OBJECT${state.objects.length === 1 ? "" : "S"} DETECTED · NEAREST ${directionFor(nearest.angle)}`
                : "0 OBJECTS DETECTED · RADAR CLEAR";
            updateWarning("SCAN COMPLETE", "clear", 2800);
            showToast(result);
            addLog(result);
            if (nearest) playSound("alert");
            else tone(440, 0.08, "triangle", 0.025, 610);
        }

        function changeLane(lane) {
            if (state.phase !== "running" || lane === state.lane) return;
            state.lane = lane;
            state.mode = "MANUAL";
            state.stabilizedUntil = 0;
            updateHud();
            addLog(`Trajectory changed to ${LANE_NAMES[lane]}`);
            playSound("lane");
        }

        function autoStabilize() {
            if (state.phase !== "running") return;
            state.lane = 1;
            state.mode = "STABILIZED";
            state.stabilizedUntil = state.elapsedMs + 3000;
            updateHud();
            showToast("AUTO STABILIZE · CENTRE LANE");
            addLog("Auto stabilize engaged · centre lane");
            playSound("lane");
        }

        function activateBoost() {
            if (state.phase !== "running" || state.elapsedMs < state.boostReadyAt) return;
            state.boostUntil = state.elapsedMs + 3000;
            state.boostReadyAt = state.elapsedMs + 12000;
            state.mode = "EVASIVE BOOST";
            updateHud();
            showToast("EVASIVE BOOST · OBJECTS SLOWED FOR 3 SECONDS");
            addLog("Evasive boost activated · 12 second recharge");
            tone(260, 0.2, "sawtooth", 0.03, 680);
        }

        function setSoundEnabled() {
            state.soundEnabled = !state.soundEnabled;
            if (state.soundEnabled) {
                const audioContext = enableAudio();
                if (audioContext && state.masterGain) {
                    state.masterGain.gain.setTargetAtTime(1, audioContext.currentTime, 0.02);
                }
                tone(440, 0.08, "triangle", 0.025, 560);
            } else if (state.audioContext && state.masterGain) {
                state.masterGain.gain.setTargetAtTime(0, state.audioContext.currentTime, 0.02);
            }
            updateHud();
        }

        function startRound() {
            if (state.phase !== "ready") return;
            state.phase = "running";
            startOverlay.hidden = true;
            state.lastFrameTime = 0;
            state.nextSpawnMs = 900;
            updateWarning("SYSTEM CLEAR", "clear", 1000);
            setRobotMessage("Let's do this, pilot! Radar is online!");
            addLog("Radar Defence started · 45 second descent");
            playSound("start");
            updateHud();
            state.frame = requestAnimationFrame(animate);
        }

        function finishRound(success) {
            if (state.phase === "complete" || state.phase === "failed") return;
            state.phase = success ? "complete" : "failed";
            cancelAnimationFrame(state.frame);
            const title = success ? "MISSION COMPLETE" : "SHIELDS DEPLETED";
            resultEyebrow.textContent = success ? "DESCENT REPORT · SAFE LANDING" : "DESCENT REPORT · MISSION FAILED";
            resultTitle.textContent = title;
            resultMessage.textContent = success
                ? "WE DID IT! That was an amazing flight, pilot!"
                : "The spacecraft could not continue the descent. Recharge and try again, pilot.";
            finalScoreOutput.textContent = String(state.score);
            avoidedOutput.textContent = String(state.avoided);
            rareOutput.textContent = String(state.rareCollected);
            badge.hidden = !success;
            resultOverlay.hidden = false;
            updateWarning(success ? "SYSTEM CLEAR" : "SHIELDS DEPLETED", success ? "clear" : "danger", 100000);
            setRobotMessage(success
                ? "WE DID IT! That was an amazing flight, pilot!"
                : "Shields are depleted, pilot. Let's try that descent again.", success ? "happy" : "alert");
            addLog(success ? "Mission complete · safe landing achieved" : "Mission failed · all shields depleted");
            playSound(success ? "complete" : "collision");
            updateHud();

            if (typeof hooks.onComplete === "function") {
                const reportedScore = Math.max(0, state.score);
                hooks.onComplete({
                    status: success ? "success" : state.avoided || state.rareCollected ? "partial" : "failure",
                    score: reportedScore,
                    performanceRating: clamp(reportedScore / 2000, 0, 1),
                    resourcesAffected: [],
                    objectivesCompleted: success ? ["survive-landing-zone-descent"] : [],
                    scientificData: [{
                        id: "landing-zone-radar-defence",
                        score: state.score,
                        objectsAvoided: state.avoided,
                        rareObjectsCollected: state.rareCollected,
                        shieldsRemaining: state.shields,
                        durationMs: state.elapsedMs,
                    }],
                });
            }
        }

        function update(elapsedDelta) {
            state.elapsedMs = Math.min(ROUND_DURATION_MS, state.elapsedMs + elapsedDelta);
            state.sweepAngle = (state.sweepAngle + elapsedDelta * 0.00125) % (Math.PI * 2);
            const slowed = state.elapsedMs < state.boostUntil ? 0.47 : 1;
            if (state.elapsedMs >= state.nextSpawnMs && state.elapsedMs < ROUND_DURATION_MS) {
                spawnObject();
                state.nextSpawnMs = state.elapsedMs + randomBetween(1650, 2500);
            }
            state.objects.slice().forEach((object) => {
                if (state.phase !== "running") return;
                object.distance -= object.speed * (elapsedDelta / 1000) * slowed;
                if (!object.warned && object.distance <= WARNING_DISTANCE) triggerWarning(object);
                if (object.distance <= COLLISION_DISTANCE) collideWith(object);
            });

            if (state.phase !== "running") return;
            state.mode = state.elapsedMs < state.boostUntil
                ? "EVASIVE BOOST"
                : state.elapsedMs < state.stabilizedUntil
                    ? "STABILIZED"
                    : "MANUAL";
            if (state.warningUntil <= state.elapsedMs
                && state.warningText !== "SYSTEM CLEAR"
                && state.warningText !== "SHIELDS DEPLETED") {
                const threatNearby = state.objects.some((object) => object.distance <= WARNING_DISTANCE);
                updateWarning(threatNearby ? "INCOMING OBJECT DETECTED" : "SYSTEM CLEAR", threatNearby ? "attention" : "clear", 1000);
            }
            updateHud();
            if (state.elapsedMs >= ROUND_DURATION_MS) finishRound(true);
        }

        function animate(timestamp) {
            if (state.disposed || state.phase !== "running") return;
            const delta = state.lastFrameTime ? Math.min(80, timestamp - state.lastFrameTime) : 16;
            state.lastFrameTime = timestamp;
            update(delta);
            drawRadar();
            if (state.phase === "running" && !state.disposed) {
                state.frame = requestAnimationFrame(animate);
            }
        }

        function pauseRound() {
            if (state.phase !== "running") return;
            state.phase = "paused";
            cancelAnimationFrame(state.frame);
            pauseOverlay.hidden = false;
            state.mode = "PAUSED";
            addLog("Mission paused");
            updateHud();
            playSound("pause");
        }

        function resumeRound() {
            if (state.phase !== "paused") return;
            state.phase = "running";
            pauseOverlay.hidden = true;
            state.mode = state.elapsedMs < state.boostUntil
                ? "EVASIVE BOOST"
                : state.elapsedMs < state.stabilizedUntil
                    ? "STABILIZED"
                    : "MANUAL";
            state.lastFrameTime = 0;
            addLog("Mission resumed");
            updateHud();
            playSound("resume");
            state.frame = requestAnimationFrame(animate);
        }

        function replay() {
            if (typeof hooks.onReplay === "function") hooks.onReplay();
        }

        function close() {
            if (typeof hooks.onClose === "function") hooks.onClose();
        }

        query('[data-action="start"]').addEventListener("click", startRound);
        query('[data-action="pause"]').addEventListener("click", pauseRound);
        query('[data-action="resume"]').addEventListener("click", resumeRound);
        query('[data-action="scan"]').addEventListener("click", manualScan);
        query('[data-action="stabilize"]').addEventListener("click", autoStabilize);
        query('[data-action="boost"]').addEventListener("click", activateBoost);
        query('[data-action="sound"]').addEventListener("click", setSoundEnabled);
        query('[data-action="replay"]').addEventListener("click", replay);
        query('[data-action="close"]').addEventListener("click", close);
        laneButtons.forEach((button) => {
            button.addEventListener("click", () => changeLane(Number(button.dataset.lane)));
        });

        addLog("Flight control system online");
        updateHud();
        drawRadar();

        return {
            root,
            start() {},
            pause() {
                pauseRound();
            },
            resume() {
                resumeRound();
            },
            dispose() {
                state.disposed = true;
                cancelAnimationFrame(state.frame);
                window.clearTimeout(state.toastTimeout);
                if (state.audioContext && state.audioContext.state !== "closed") {
                    state.audioContext.close().catch((error) => {
                        console.error("Could not close Radar Defence audio.", error);
                    });
                }
            },
        };
    }

    function register() {
        window.BeyondEarthMinigames.register({
            id: GAME_ID,
            name: "Landing Zone — Radar Defence",
            isAvailable: ({ mission }) => Boolean(mission && typeof mission === "object"),
            create(context) {
                let game = null;
                let mountTarget = null;
                let preserveResult = false;
                return {
                    mount() {
                        mountTarget = context.container || document.body;
                        game = createGame({
                            onComplete(result) {
                                preserveResult = true;
                                context.reportResult(result);
                            },
                            onReplay() {
                                window.BeyondEarthMinigames.start(GAME_ID, { container: mountTarget }).catch((error) => {
                                    console.error("Could not replay Radar Defence.", error);
                                });
                            },
                            onClose() {
                                context.end().catch((error) => {
                                    console.error("Could not close Radar Defence.", error);
                                });
                            },
                        });
                        if (context.playerColor) {
                            game.root.style.setProperty("--theme-primary", context.playerColor);
                            game.root.style.setProperty("--lz-lavender", context.playerColor);
                            game.root.style.setProperty("--lz-pink", context.playerColor);
                        }
                        if (context.playerHighlight) {
                            game.root.style.setProperty("--theme-highlight", context.playerHighlight);
                            game.root.style.setProperty("--lz-mint", context.playerHighlight);
                            game.root.style.setProperty("--lz-gold", context.playerHighlight);
                        }
                        mountTarget.replaceChildren(game.root);
                        game.root.classList.add("beyond-minigame");
                        game.start();
                    },
                    pause() {
                        game?.pause();
                    },
                    resume() {
                        game?.resume();
                    },
                    dispose() {
                        game?.dispose();
                        if (!preserveResult && game?.root.parentNode) game.root.parentNode.removeChild(game.root);
                    },
                };
            },
        });
    }

    function mountStandalone() {
        const target = document.getElementById("game4-root");
        if (!target) return;
        const game = createGame({
            onReplay() {
                game.dispose();
                mountStandalone();
            },
            onClose() {
                game.dispose();
                mountStandalone();
            },
        });
        game.root.classList.add("landing-zone--standalone");
        target.replaceChildren(game.root);
    }

    if (window.BeyondEarthMinigames) {
        register();
    } else if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", mountStandalone, { once: true });
    } else {
        mountStandalone();
    }
})();
