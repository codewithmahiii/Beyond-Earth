(() => {
    "use strict";

    const STORAGE_KEY = "beyond-earth-audio-v1";
    const DEFAULTS = {
        master: 0.8,
        music: 0.28,
        sfx: 0.62,
        ambient: 0.24,
        muted: false,
    };

    const EFFECTS = {
        hover: { tones: [[880, 0.035, "sine", 0.08]], cooldown: 180 },
        click: { tones: [[760, 0.035, "square", 0.075], [1140, 0.025, "sine", 0.04]], cooldown: 65 },
        "panel-open": { tones: [[180, 0.1, "triangle", 0.12], [520, 0.1, "sine", 0.08]], cooldown: 180 },
        "panel-close": { tones: [[430, 0.08, "triangle", 0.09], [160, 0.11, "sine", 0.055]], cooldown: 180 },
        tab: { tones: [[680, 0.035, "square", 0.06]], cooldown: 90 },
        select: { tones: [[590, 0.055, "sine", 0.1], [880, 0.075, "sine", 0.09]], cooldown: 100 },
        deselect: { tones: [[510, 0.06, "triangle", 0.07]], cooldown: 120 },
        toggle: { tones: [[420, 0.035, "square", 0.07], [720, 0.055, "sine", 0.075]], cooldown: 120 },
        success: { tones: [[660, 0.11, "sine", 0.09], [880, 0.16, "sine", 0.09]], cooldown: 250 },
        error: { tones: [[190, 0.14, "triangle", 0.12], [145, 0.16, "sine", 0.09]], cooldown: 250 },
        drop: { tones: [[360, 0.045, "triangle", 0.08], [620, 0.07, "sine", 0.07]], cooldown: 100 },
        drag: { tones: [[300, 0.035, "triangle", 0.045]], cooldown: 220 },
        "joystick-start": { tones: [[380, 0.06, "triangle", 0.07]], cooldown: 180 },
        "joystick-move": { tones: [[540, 0.025, "sine", 0.035]], cooldown: 100 },
        "joystick-release": { tones: [[440, 0.08, "sine", 0.07]], cooldown: 160 },
        ignition: { flame: [0.32, 0.9], cooldown: 1200 },
        exhaust: { flame: [0.3, 0.72], cooldown: 1000 },
        liftoff: { flame: [0.5, 1], cooldown: 1600 },
        "launch-transition": { flame: [0.4, 0.62], cooldown: 900 },
        whoosh: { tones: [[260, 0.42, "sawtooth", 0.055]], cooldown: 900 },
        welcome: { tones: [[392, 0.55, "sine", 0.07], [523.25, 0.75, "sine", 0.065], [783.99, 0.9, "sine", 0.055]], cooldown: 1200 },
        "mission-complete": { tones: [[523.25, 0.22, "sine", 0.1], [659.25, 0.25, "sine", 0.09], [783.99, 0.35, "sine", 0.085], [1046.5, 0.6, "sine", 0.075]], cooldown: 1800 },
        achievement: { tones: [[523.25, 0.16, "sine", 0.1], [659.25, 0.17, "sine", 0.095], [783.99, 0.22, "sine", 0.09], [1046.5, 0.55, "sine", 0.085]], cooldown: 2000 },
        "power-on": {
            tones: [[125, 0.08, "square", 0.065], [250, 0.15, "sawtooth", 0.07], [520, 0.24, "triangle", 0.055]],
            sweeps: [[220, 880, 0.38, "sawtooth", 0.035, 0]],
            cooldown: 1200,
        },
        "panel-activate": {
            tones: [[640, 0.045, "square", 0.045], [960, 0.075, "sine", 0.052]],
            cooldown: 160,
        },
        "system-online": {
            tones: [[440, 0.14, "sine", 0.065], [660, 0.22, "sine", 0.07], [880, 0.4, "sine", 0.06]],
            cooldown: 1500,
        },
        warning: { flame: [0.11, 0.38], cooldown: 240 },
    };

    class SpaceAudioManager {
        constructor() {
            this.preferences = this.readPreferences();
            this.context = null;
            this.masterGain = null;
            this.gains = {};
            this.unlocked = false;
            this.activeScene = document.querySelector(".scene.active")?.id || "";
            this.launchPhase = "establish";
            this.lastPlayed = new Map();
            this.hoveredAt = new WeakMap();
            this.lastHoverAt = 0;
            this.volumeSaveTimer = 0;
            this.ambientChannels = new Map();
            this.media = new Map();
            this.warningTimers = [];
            this.engine = null;
            this.music = null;
            this.musicTimers = [];
            this.lastSliderSound = 0;
            this.lastSliderValue = 0;
            this.joysticks = new WeakMap();

            this.bindUnlock();
            this.bindInteractions();
            this.bindSettings();
            this.bindSceneEvents();
            this.syncSettingsControls();
            this.syncLaunchAudioControl();
            if (window.AudioContext || window.webkitAudioContext) {
                this.unlock();
            }
        }

        readPreferences() {
            try {
                const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
                return {
                    master: this.clamp(stored.master, DEFAULTS.master),
                    music: this.clamp(stored.music, DEFAULTS.music),
                    sfx: this.clamp(stored.sfx, DEFAULTS.sfx),
                    ambient: this.clamp(stored.ambient, DEFAULTS.ambient),
                    muted: stored.muted === true,
                };
            } catch (error) {
                console.warn("Audio preferences could not be loaded; using defaults.", error);
                return { ...DEFAULTS };
            }
        }

        clamp(value, fallback) {
            const number = Number(value);
            return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : fallback;
        }

        savePreferences() {
            window.clearTimeout(this.volumeSaveTimer);
            this.volumeSaveTimer = window.setTimeout(() => {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));
                } catch (error) {
                    console.warn("Audio preferences could not be saved.", error);
                }
            }, 120);
        }

        resetPreferences() {
            window.clearTimeout(this.volumeSaveTimer);
            this.volumeSaveTimer = 0;
            this.preferences = { ...DEFAULTS };
            this.applyVolumes(0);
            this.setMediaVolumes();
            this.syncSettingsControls();
            this.syncLaunchAudioControl();
        }

        bindUnlock() {
            const unlock = () => {
                if (!this.unlocked) {
                    this.unlock();
                }
            };
            document.addEventListener("pointerdown", unlock, { capture: true, passive: true });
            document.addEventListener("keydown", unlock, { capture: true });
        }

        unlock() {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                console.warn("Web Audio is not available in this browser.");
                return Promise.resolve(false);
            }

            if (!this.context) {
                try {
                    this.context = new AudioContext();
                    this.masterGain = this.context.createGain();
                    this.masterGain.connect(this.context.destination);
                    for (const category of ["music", "sfx", "ambient"]) {
                        this.gains[category] = this.context.createGain();
                        this.gains[category].connect(this.masterGain);
                    }
                    this.applyVolumes(0);
                } catch (error) {
                    this.context = null;
                    this.masterGain = null;
                    this.gains = {};
                    console.warn("Audio could not be initialized in this browser.", error);
                    return Promise.resolve(false);
                }
            }

            return this.context.resume().then(() => {
                if (!this.unlocked) {
                    this.unlocked = true;
                    this.syncActiveScene();
                    document.dispatchEvent(new Event("beyond:audiounlocked"));
                }
                return true;
            }).catch((error) => {
                console.warn("Audio could not be enabled after user interaction.", error);
                return false;
            });
        }

        bindSceneEvents() {
            document.addEventListener("beyond:scenechange", (event) => {
                this.activeScene = event.detail?.scene || "";
                this.handleSceneChange(this.activeScene);
            });
            document.addEventListener("beyond:launchphase", (event) => {
                this.handleLaunchPhase(event.detail?.phase);
            });
            document.addEventListener("beyond:wakephase", (event) => {
                const phase = event.detail?.phase;
                if (phase === "start") this.playSFX("power-on");
                if (phase === "panel") this.playSFX("panel-activate");
                if (phase === "online") this.playSFX("system-online");
            });
        }

        syncActiveScene() {
            if (this.activeScene === "launch-scene") {
                this.syncLaunchPhase();
            } else if (this.activeScene === "cockpit-scene") {
                this.playAmbient("cockpit");
                this.playMusic("orbital-drift");
            } else if (this.activeScene === "welcome-scene") {
                this.playAmbient("cockpit");
            }
        }

        handleSceneChange(sceneId) {
            if (sceneId === "launch-scene") {
                this.launchPhase = "establish";
                if (this.unlocked) {
                    this.syncLaunchPhase();
                }
                this.stopAmbient("cockpit", 180);
                this.fadeMusic(700);
                return;
            }

            if (sceneId === "welcome-scene") {
                this.stopLaunch(false);
                if (this.unlocked) {
                    this.playAmbient("cockpit");
                }
                this.stopAmbient("cockpit", 180);
                return;
            }

            if (sceneId === "cockpit-scene") {
                this.stopLaunch(false);
                if (this.unlocked) {
                    this.playAmbient("cockpit");
                    this.playMusic("orbital-drift");
                }
                return;
            }

            if (sceneId === "personnel-scene") {
                if (this.unlocked) this.playAmbient("cockpit");
                return;
            }

            this.stopAmbient();
        }

        handleLaunchPhase(phase) {
            if (!phase) {
                return;
            }
            this.launchPhase = phase;
            if (!this.unlocked || this.activeScene !== "launch-scene") {
                return;
            }

            switch (phase) {
                case "establish":
                    this.playAmbient("launchpad");
                    break;
                case "warning":
                    this.startWarningSequence();
                    break;
                case "ignition":
                    this.clearWarningSequence();
                    this.playSFX("ignition");
                    this.startEngine();
                    this.rampEngine(0.38, 0.32);
                    break;
                case "liftoff":
                    this.playSFX("liftoff");
                    this.rampEngine(0.8, 0.24);
                    break;
                case "ascent":
                    this.rampEngine(0.42, 0.34);
                    break;
                case "transition":
                    this.playSFX("launch-transition");
                    this.rampEngine(0.08, 0.65);
                    this.stopAmbient("launchpad", 1000);
                    break;
                case "complete":
                    this.stopLaunch(false);
                    break;
                default:
                    break;
            }
        }

        syncLaunchPhase() {
            this.playAmbient("launchpad");
            const phase = this.launchPhase;
            if (phase === "warning") {
                this.startWarningSequence();
            } else if (["ignition", "exhaust", "liftoff", "ascent", "transition"].includes(phase)) {
                this.startEngine();
                if (phase === "ignition") {
                    this.playSFX("ignition");
                    this.rampEngine(0.32, 0.1);
                }
                if (phase === "exhaust") {
                    this.playSFX("exhaust");
                    this.rampEngine(0.55, 0.1);
                }
                if (phase === "liftoff") {
                    this.playSFX("liftoff");
                    this.rampEngine(0.72, 0.1);
                }
                if (phase === "ascent") this.rampEngine(0.4, 0.1);
                if (phase === "transition") {
                    this.playSFX("launch-transition");
                    this.rampEngine(0.08, 0.1);
                }
            }
        }

        bindInteractions() {
            document.addEventListener("pointerover", (event) => {
                if (event.pointerType !== "mouse") return;
                const target = event.target.closest?.("button, a, [role='button'], [role='tab'], input, select, textarea, [tabindex]:not([tabindex='-1'])");
                if (!target || target.contains(event.relatedTarget)) return;
                if (target.matches("#mission-astronaut-character")) return;
                const now = performance.now();
                if (now - this.lastHoverAt < 150 || now - (this.hoveredAt.get(target) || 0) < 450) return;
                this.hoveredAt.set(target, now);
                this.lastHoverAt = now;
                this.playSFX("hover");
            });

            document.addEventListener("click", (event) => {
                const target = event.target.closest?.("button, a, [role='button'], [role='tab'], input[type='button'], input[type='submit']");
                if (!target) return;
                if (target.closest("[data-cockpit-interaction]")) return;
                if (target.matches("#mission-astronaut-character")) return;
                if (target.matches("#wake-power-button")) return;
                if (target.matches("#toggle-launch-audio")) {
                    this.toggleMute();
                    return;
                }
                if (target.matches("#personnel-close")) {
                    this.playSFX("panel-close");
                } else if (target.matches("#personnel-save")) {
                    this.playSFX("success");
                } else if (target.matches("[data-personnel-color], [data-personnel-emblem]")) {
                    this.playSFX("select");
                } else if (target.matches("#skip-intro, .audio-close")) {
                    this.playSFX(target.matches(".audio-close") ? "panel-close" : "click");
                } else if (target.matches("[data-action='settings'], [data-action='profile']")) {
                    this.playSFX("panel-open");
                } else if (target.matches("[role='tab'], [data-tab]")) {
                    this.playSFX("tab");
                } else if (target.matches(".station")) {
                    this.playSFX("select");
                } else {
                    this.playSFX("click");
                }

                if (target.matches("[data-action='settings']")) {
                    this.openSettings();
                }
                if (target.matches(".audio-close")) {
                    document.querySelector("#audio-settings")?.close();
                }
            });

            document.addEventListener("change", (event) => {
                const target = event.target;
                if (target.matches("[data-audio-mute]")) {
                    this.setMuted(target.checked);
                    this.playSFX("toggle");
                } else if (target.matches("input[type='checkbox'], input[type='radio'], [role='switch']")) {
                    this.playSFX(target.checked === false ? "deselect" : "toggle");
                } else if (target.matches("select")) {
                    this.playSFX("select");
                }
            });

            document.addEventListener("input", (event) => {
                const target = event.target;
                if (!target.matches("[data-audio-volume]")) return;
                const category = target.dataset.audioVolume;
                this.setVolume(category, Number(target.value));
                const now = performance.now();
                const value = Number(target.value);
                if (now - this.lastSliderSound > 110 && Math.abs(value - this.lastSliderValue) >= 0.06) {
                    this.playSFX("tab");
                    this.lastSliderSound = now;
                    this.lastSliderValue = value;
                }
            });

            document.addEventListener("dragstart", () => this.playSFX("drag"));
            document.addEventListener("drop", () => this.playSFX("drop"));

            document.addEventListener("pointerdown", (event) => {
                const joystick = event.target.closest?.(".joystick, [data-control='joystick']");
                if (!joystick) return;
                this.joysticks.set(joystick, { x: event.clientX, y: event.clientY, lastSound: 0 });
                this.playSFX("joystick-start");
            });
            document.addEventListener("pointermove", (event) => {
                const joystick = event.target.closest?.(".joystick, [data-control='joystick']");
                const state = joystick && this.joysticks.get(joystick);
                if (!state) return;
                const distance = Math.hypot(event.clientX - state.x, event.clientY - state.y);
                const now = performance.now();
                if (distance > 18 && now - state.lastSound > 170) {
                    this.playSFX("joystick-move");
                    state.x = event.clientX;
                    state.y = event.clientY;
                    state.lastSound = now;
                }
            });
            const releaseJoystick = (event) => {
                const joystick = event.target.closest?.(".joystick, [data-control='joystick']");
                if (!joystick || !this.joysticks.has(joystick)) return;
                this.joysticks.delete(joystick);
                this.playSFX("joystick-release");
            };
            document.addEventListener("pointerup", releaseJoystick);
            document.addEventListener("pointercancel", releaseJoystick);

            document.addEventListener("beyond:audiounlocked", () => {
                this.syncLaunchAudioControl();
            });
            document.addEventListener("beyond:cockpitinteraction", (event) => {
                if (typeof event.detail?.sound === "string") {
                    this.playSFX(event.detail.sound);
                }
            });
        }

        bindSettings() {
            const dialog = document.querySelector("#audio-settings");
            if (!dialog) return;
            dialog.addEventListener("close", () => {
                document.querySelector("[data-action='settings']")?.setAttribute("aria-pressed", "false");
                document.querySelector("[data-action='settings']")?.focus({ preventScroll: true });
            });
            dialog.addEventListener("cancel", () => this.playSFX("panel-close"));
            dialog.addEventListener("click", (event) => {
                if (event.target === dialog) {
                    this.playSFX("panel-close");
                    dialog.close();
                }
            });
        }

        openSettings() {
            const dialog = document.querySelector("#audio-settings");
            if (dialog && !dialog.open) {
                this.syncSettingsControls();
                dialog.showModal();
            }
        }

        syncSettingsControls() {
            document.querySelectorAll("[data-audio-volume]").forEach((input) => {
                const category = input.dataset.audioVolume;
                input.value = String(this.preferences[category]);
                const output = document.querySelector(`[data-audio-value='${category}']`);
                if (output) output.value = `${Math.round(this.preferences[category] * 100)}%`;
            });
            const mute = document.querySelector("[data-audio-mute]");
            if (mute) mute.checked = this.preferences.muted;
        }

        syncLaunchAudioControl() {
            const button = document.querySelector("#toggle-launch-audio");
            if (!button) return;
            button.textContent = this.preferences.muted ? "ENABLE AUDIO" : "DISABLE AUDIO";
            button.setAttribute("aria-pressed", String(this.preferences.muted));
            button.setAttribute("aria-label", this.preferences.muted ? "Enable game audio" : "Disable game audio");
            button.disabled = !(window.AudioContext || window.webkitAudioContext);
        }

        setVolume(category, value) {
            if (!Object.prototype.hasOwnProperty.call(DEFAULTS, category) || category === "muted") {
                console.warn(`Unknown audio volume category: ${category}`);
                return;
            }
            this.preferences[category] = this.clamp(value, DEFAULTS[category]);
            this.applyVolumes(0.03);
            this.setMediaVolumes();
            this.savePreferences();
            const output = document.querySelector(`[data-audio-value='${category}']`);
            if (output) output.value = `${Math.round(this.preferences[category] * 100)}%`;
        }

        setMuted(muted) {
            this.preferences.muted = Boolean(muted);
            this.applyVolumes(0.04);
            this.setMediaVolumes();
            this.savePreferences();
            const toggle = document.querySelector("[data-audio-mute]");
            if (toggle) toggle.checked = this.preferences.muted;
            this.syncLaunchAudioControl();
        }

        toggleMute() {
            this.setMuted(!this.preferences.muted);
            this.playSFX("toggle");
            return this.preferences.muted;
        }

        applyVolumes(ramp) {
            if (!this.context || !this.masterGain) return;
            const now = this.context.currentTime;
            const master = this.preferences.muted ? 0 : this.preferences.master;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setTargetAtTime(master, now, ramp || 0.001);
            for (const category of ["music", "sfx", "ambient"]) {
                this.gains[category].gain.cancelScheduledValues(now);
                this.gains[category].gain.setTargetAtTime(this.preferences[category], now, ramp || 0.001);
            }
        }

        categoryGain(category) {
            return this.gains[category] || this.gains.sfx;
        }

        playTone(frequency, duration, type = "sine", volume = 0.08, category = "sfx", delay = 0, targetGain = null) {
            if (!this.context) return;
            const now = this.context.currentTime + delay;
            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, now);
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.04, duration));
            oscillator.connect(gain);
            gain.connect(targetGain || this.categoryGain(category));
            oscillator.start(now);
            oscillator.stop(now + duration + 0.03);
            oscillator.addEventListener("ended", () => {
                oscillator.disconnect();
                gain.disconnect();
            }, { once: true });
        }

        playSweep(startFrequency, endFrequency, duration, type, volume, delay = 0) {
            if (!this.context) return;
            const startAt = this.context.currentTime + delay;
            const endAt = startAt + duration;
            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(startFrequency, startAt);
            oscillator.frequency.exponentialRampToValueAtTime(endFrequency, endAt);
            gain.gain.setValueAtTime(0.0001, startAt);
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), startAt + 0.006);
            gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
            oscillator.connect(gain);
            gain.connect(this.categoryGain("sfx"));
            oscillator.start(startAt);
            oscillator.stop(endAt + 0.025);
            oscillator.addEventListener("ended", () => {
                oscillator.disconnect();
                gain.disconnect();
            }, { once: true });
        }

        playSFX(id, options = {}) {
            const effect = EFFECTS[id];
            if (!effect) {
                console.warn(`Unknown sound effect: ${id}`);
                return false;
            }
            if (!this.context || !this.unlocked || this.preferences.muted) return false;

            const now = performance.now();
            const last = this.lastPlayed.get(id) || 0;
            if (!options.force && now - last < (effect.cooldown || 0)) return false;
            this.lastPlayed.set(id, now);

            if (effect.flame) {
                this.playFlameBurst(...effect.flame);
            }
            (effect.tones || []).forEach(([frequency, duration, type, volume], index) => {
                const delay = effect.gap ? index * effect.gap : index * 0.045;
                this.playTone(frequency, duration, type, volume, "sfx", delay);
            });
            (effect.sweeps || []).forEach(([start, end, duration, type, volume, delay]) => {
                this.playSweep(start, end, duration, type, volume, delay);
            });
            return true;
        }

        playFlameBurst(duration, intensity, delay = 0) {
            if (!this.context) return;
            const startAt = this.context.currentTime + delay;
            const endAt = startAt + duration;
            const source = this.context.createBufferSource();
            const filter = this.context.createBiquadFilter();
            const gain = this.context.createGain();
            source.buffer = this.createNoiseBuffer();
            filter.type = "bandpass";
            filter.frequency.setValueAtTime(1150, startAt);
            filter.frequency.exponentialRampToValueAtTime(2450, endAt);
            filter.Q.setValueAtTime(0.65, startAt);
            gain.gain.setValueAtTime(0.0001, startAt);
            gain.gain.exponentialRampToValueAtTime(0.13 * intensity, startAt + 0.009);
            gain.gain.setValueAtTime(0.13 * intensity, startAt + duration * 0.22);
            gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.categoryGain("sfx"));
            source.start(startAt);
            source.stop(endAt + 0.025);
            source.addEventListener("ended", () => {
                source.disconnect();
                filter.disconnect();
                gain.disconnect();
            }, { once: true });
        }

        createNoiseBuffer() {
            const length = Math.max(1, Math.floor(this.context.sampleRate * 2));
            const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < length; i += 1) {
                data[i] = (Math.random() * 2 - 1) * 0.55;
            }
            return buffer;
        }

        createAmbientChannel(id) {
            if (!this.context || !this.unlocked || this.ambientChannels.has(id)) return;
            const channel = this.context.createGain();
            channel.gain.setValueAtTime(0.0001, this.context.currentTime);
            channel.connect(this.categoryGain("ambient"));
            const record = { gain: channel, nodes: [], timers: [], stopping: false };
            this.ambientChannels.set(id, record);

            const addNoise = (frequency, q, amount) => {
                const source = this.context.createBufferSource();
                const filter = this.context.createBiquadFilter();
                const gain = this.context.createGain();
                source.buffer = this.createNoiseBuffer();
                source.loop = true;
                filter.type = "lowpass";
                filter.frequency.value = frequency;
                filter.Q.value = q;
                gain.gain.value = amount;
                source.connect(filter);
                filter.connect(gain);
                gain.connect(channel);
                source.start();
                record.nodes.push(source, filter, gain);
            };
            const addOscillator = (frequency, type, amount) => {
                const oscillator = this.context.createOscillator();
                const gain = this.context.createGain();
                oscillator.type = type;
                oscillator.frequency.value = frequency;
                gain.gain.value = amount;
                oscillator.connect(gain);
                gain.connect(channel);
                oscillator.start();
                record.nodes.push(oscillator, gain);
            };

            if (id === "launchpad") {
                addNoise(420, 0.5, 0.17);
                addOscillator(43, "sine", 0.15);
                addOscillator(67, "triangle", 0.035);
                this.scheduleAmbientBeep(record, 7, 15, "ambient");
            } else {
                addNoise(240, 0.4, 0.085);
                addOscillator(58, "sine", 0.075);
                addOscillator(116, "triangle", 0.018);
                this.scheduleAmbientBeep(record, 9, 20, "ambient");
            }
            channel.gain.setTargetAtTime(id === "launchpad" ? 0.24 : 0.2, this.context.currentTime, 0.8);
        }

        scheduleAmbientBeep(record, minSeconds, maxSeconds, category) {
            const schedule = () => {
                if (record.stopping || !this.unlocked || this.preferences.muted) return;
                const delay = minSeconds + Math.random() * (maxSeconds - minSeconds);
                const timer = window.setTimeout(() => {
                    if (record.stopping || this.preferences.muted) return;
                    const base = this.context.currentTime;
                    this.playTone(680 + Math.random() * 240, 0.045, "sine", 0.022, category, 0, record.gain);
                    this.playTone(820 + Math.random() * 200, 0.035, "sine", 0.016, category, 0.11, record.gain);
                    schedule();
                }, delay * 1000);
                record.timers.push(timer);
            };
            schedule();
        }

        playAmbient(id, options = {}) {
            if (!this.unlocked || !this.context) return false;
            if (options.src) {
                return this.playMediaLoop(`ambient:${id}`, options.src, "ambient", options);
            }
            this.createAmbientChannel(id);
            return this.ambientChannels.has(id);
        }

        stopAmbient(id, fadeMs = 500) {
            const channels = id ? [[id, this.ambientChannels.get(id)]] : [...this.ambientChannels.entries()];
            channels.forEach(([key, record]) => {
                if (!record) return;
                record.stopping = true;
                record.timers.forEach(window.clearTimeout);
                this.fadeGain(record.gain, 0, fadeMs, () => {
                    record.nodes.forEach((node) => {
                        try {
                            node.stop?.();
                            node.disconnect();
                        } catch (error) {
                            if (!(error instanceof DOMException && error.name === "InvalidStateError")) {
                                console.warn("Ambient audio node cleanup failed.", error);
                            }
                        }
                    });
                    record.gain.disconnect();
                    this.ambientChannels.delete(key);
                });
            });
            if (id) {
                const mediaKey = `ambient:${id}`;
                this.stopMedia(mediaKey, fadeMs);
            } else {
                [...this.media.keys()].filter((key) => key.startsWith("ambient:")).forEach((key) => this.stopMedia(key, fadeMs));
            }
        }

        fadeGain(gain, target, durationMs, onEnd) {
            if (!this.context || !gain) {
                onEnd?.();
                return;
            }
            const now = this.context.currentTime;
            gain.gain.cancelScheduledValues(now);
            gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
            gain.gain.linearRampToValueAtTime(Math.max(0.0001, target), now + Math.max(0.01, durationMs / 1000));
            if (onEnd) window.setTimeout(onEnd, durationMs + 40);
        }

        startWarningSequence() {
            if (this.warningTimers.length || !this.unlocked) return;
            let count = 0;
            const tick = () => {
                if (count >= 3 || this.launchPhase !== "warning" || this.activeScene !== "launch-scene") {
                    this.warningTimers = [];
                    return;
                }
                this.playSFX("warning", { force: true });
                count += 1;
                this.warningTimers.push(window.setTimeout(tick, 350));
            };
            tick();
        }

        clearWarningSequence() {
            this.warningTimers.forEach(window.clearTimeout);
            this.warningTimers = [];
        }

        startEngine() {
            if (!this.context || !this.unlocked || this.engine) return;
            const output = this.context.createGain();
            output.gain.value = 0.0001;
            output.connect(this.categoryGain("sfx"));
            const noise = this.context.createBufferSource();
            const noiseFilter = this.context.createBiquadFilter();
            const noiseGain = this.context.createGain();
            noise.buffer = this.createNoiseBuffer();
            noise.loop = true;
            noiseFilter.type = "bandpass";
            noiseFilter.frequency.value = 1450;
            noiseFilter.Q.value = 0.55;
            noiseGain.gain.value = 0.42;
            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(output);
            noise.start();
            this.engine = { output, noise, noiseFilter, noiseGain };
        }

        rampEngine(level, durationSeconds) {
            if (!this.engine || !this.context) return;
            const now = this.context.currentTime;
            this.engine.output.gain.cancelScheduledValues(now);
            this.engine.output.gain.setTargetAtTime(level, now, Math.max(0.025, durationSeconds / 3));
            this.engine.noiseFilter.frequency.setTargetAtTime(950 + level * 1450, now, 0.15);
        }

        stopEngine(fadeMs = 700, immediate = false) {
            if (!this.engine || !this.context) return;
            const engine = this.engine;
            this.engine = null;
            const finish = () => {
                [engine.noise].forEach((source) => {
                    try {
                        source.stop();
                    } catch (error) {
                        if (!(error instanceof DOMException && error.name === "InvalidStateError")) {
                            console.warn("Engine audio cleanup failed.", error);
                        }
                    }
                });
                [engine.output, engine.noiseFilter, engine.noiseGain].forEach((node) => node.disconnect());
            };
            if (immediate) {
                engine.output.gain.cancelScheduledValues(this.context.currentTime);
                engine.output.gain.setValueAtTime(0, this.context.currentTime);
                finish();
            } else {
                this.fadeGain(engine.output, 0, fadeMs, finish);
            }
        }

        stopLaunch(immediate = false) {
            this.clearWarningSequence();
            this.stopEngine(immediate ? 0 : 800, immediate);
            this.stopAmbient("launchpad", immediate ? 0 : 850);
        }

        playMediaLoop(key, src, category, options = {}) {
            if (!src || typeof src !== "string") {
                console.warn(`Audio source is missing for ${key}.`);
                return false;
            }
            this.media ||= new Map();
            if (this.media.has(key)) return true;
            const audio = new Audio(src);
            audio.loop = options.loop !== false;
            audio.preload = "none";
            audio.volume = this.preferences.muted ? 0 : this.preferences.master * this.preferences[category];
            const record = { audio, category };
            this.media.set(key, record);
            audio.addEventListener("error", () => {
                console.warn(`Optional audio asset could not be loaded: ${src}`);
                this.media.delete(key);
                if (this.music?.key === key.replace(/^music:/, "")) this.music = null;
            }, { once: true });
            audio.play().then(() => {
                if (options.fadeIn) {
                    audio.volume = 0;
                    this.fadeMedia(record, this.preferences.master * this.preferences[category], options.fadeIn);
                }
            }).catch((error) => {
                this.media.delete(key);
                if (this.music?.key === key.replace(/^music:/, "")) this.music = null;
                console.warn(`Optional audio asset could not be played: ${src}`, error);
            });
            return true;
        }

        playMusic(trackId, src = null, options = {}) {
            if (!this.unlocked || !this.context) return false;
            if (src) {
                if (this.music?.key === trackId) return true;
                this.stopMusic(250);
                const started = this.playMediaLoop(`music:${trackId}`, src, "music", { ...options, loop: options.loop !== false, fadeIn: options.fadeIn || 900 });
                this.music = started ? { key: trackId, type: "media" } : null;
                return started;
            }
            if (this.music?.key === trackId) return true;
            this.stopMusic(450);
            this.startSynthMusic(trackId);
            return true;
        }

        startSynthMusic(trackId) {
            const chord = this.context.createGain();
            chord.gain.value = 0.0001;
            chord.connect(this.categoryGain("music"));
            const endingTracks = {
                "mission-ending-perfect": {
                    notes: [130.81, 196, 261.63, 392],
                    progression: [130.81, 164.81, 196, 261.63],
                    gain: 0.18,
                },
                "mission-ending-damaged": {
                    notes: [110, 164.81, 207.65, 311.13],
                    progression: [110, 98, 123.47, 110],
                    gain: 0.14,
                },
                "mission-ending-lost": {
                    notes: [73.42, 110, 146.83, 220],
                    progression: [73.42, 69.3, 65.41, 58.27],
                    gain: 0.1,
                },
            };
            const profile = endingTracks[trackId];
            const notes = profile?.notes || [110, 164.81, 220, 329.63];
            const oscillators = notes.map((frequency, index) => {
                const oscillator = this.context.createOscillator();
                const gain = this.context.createGain();
                oscillator.type = index === 1 ? "triangle" : "sine";
                oscillator.frequency.value = frequency;
                gain.gain.value = [0.24, 0.12, 0.07, 0.035][index];
                oscillator.connect(gain);
                gain.connect(chord);
                oscillator.start();
                return { oscillator, gain };
            });
            chord.gain.setTargetAtTime(profile?.gain || 0.22, this.context.currentTime, 1.8);
            const progression = profile?.progression || [110, 98, 130.81, 87.31];
            let index = 0;
            const timer = window.setInterval(() => {
                if (!this.music || this.music.key !== trackId || !this.context) return;
                index = (index + 1) % progression.length;
                oscillators[0].oscillator.frequency.setTargetAtTime(progression[index], this.context.currentTime, 2.2);
                oscillators[1].oscillator.frequency.setTargetAtTime(progression[index] * 1.5, this.context.currentTime, 2.2);
                oscillators[2].oscillator.frequency.setTargetAtTime(progression[index] * 2, this.context.currentTime, 2.2);
            }, 11000);
            this.music = { key: trackId, type: "synth", gain: chord, oscillators, timer };
        }

        fadeMedia(record, target, durationMs, onEnd) {
            const startVolume = record.audio.volume;
            const steps = Math.max(1, Math.ceil(durationMs / 40));
            let step = 0;
            const timer = window.setInterval(() => {
                step += 1;
                const ratio = Math.min(1, step / steps);
                const volume = startVolume + (target - startVolume) * ratio;
                record.audio.volume = Math.max(0, Math.min(1, volume));
                if (ratio >= 1) {
                    window.clearInterval(timer);
                    onEnd?.();
                }
            }, 40);
        }

        stopMedia(key, fadeMs = 300) {
            this.media ||= new Map();
            const record = this.media.get(key);
            if (!record) return;
            const finish = () => {
                record.audio.pause();
                record.audio.removeAttribute("src");
                record.audio.load();
                this.media.delete(key);
            };
            if (fadeMs <= 0) finish();
            else this.fadeMedia(record, 0, fadeMs, finish);
            if (this.music?.key === key.replace(/^music:/, "")) this.music = null;
        }

        stopMusic(fadeMs = 500) {
            if (!this.music) return;
            const music = this.music;
            this.music = null;
            window.clearInterval(music.timer);
            if (music.type === "media") {
                this.stopMedia(`music:${music.key}`, fadeMs);
                return;
            }
            this.fadeGain(music.gain, 0, fadeMs, () => {
                music.oscillators.forEach(({ oscillator, gain }) => {
                    try {
                        oscillator.stop();
                    } catch (error) {
                        if (!(error instanceof DOMException && error.name === "InvalidStateError")) {
                            console.warn("Music audio cleanup failed.", error);
                        }
                    }
                    oscillator.disconnect();
                    gain.disconnect();
                });
                music.gain.disconnect();
            });
        }

        fadeMusic(durationMs = 500) {
            this.stopMusic(durationMs);
        }

        setMediaVolumes() {
            if (!this.media) return;
            for (const { audio, category } of this.media.values()) {
                audio.volume = this.preferences.muted ? 0 : this.preferences.master * this.preferences[category];
            }
        }
    }

    const audio = new SpaceAudioManager();
    window.SpaceAudio = Object.freeze({
        playSFX: (...args) => audio.playSFX(...args),
        unlock: (...args) => audio.unlock(...args),
        playMusic: (...args) => audio.playMusic(...args),
        stopMusic: (...args) => audio.stopMusic(...args),
        fadeMusic: (...args) => audio.fadeMusic(...args),
        playAmbient: (...args) => audio.playAmbient(...args),
        stopAmbient: (...args) => audio.stopAmbient(...args),
        setVolume: (...args) => audio.setVolume(...args),
        setMuted: (...args) => audio.setMuted(...args),
        toggleMute: (...args) => audio.toggleMute(...args),
        stopLaunch: (...args) => audio.stopLaunch(...args),
        getPreferences: () => ({ ...audio.preferences }),
        resetPreferences: () => audio.resetPreferences(),
    });
})();
