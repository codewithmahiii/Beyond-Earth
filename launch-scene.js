(() => {
    const scene = document.getElementById("launch-scene");
    const canvas = scene?.querySelector(".launch-art");
    const ctx = canvas?.getContext("2d");
    if (!scene || !canvas || !ctx) {
        return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sequenceDuration = reducedMotion ? 1200 : 4600;
    let frameId = 0;
    let startedAt = performance.now();
    let lastWidth = 0;
    let lastHeight = 0;
    let seed = 8917;
    let phaseIndex = -1;
    let themePrimary = "#bbc1c8";
    let themeHighlight = "#e1e3df";
    const launchPhases = [
        { progress: 0, name: "establish" },
        { progress: reducedMotion ? 0.05 : 0.1, name: "warning" },
        { progress: reducedMotion ? 0.18 : 0.25, name: "ignition" },
        { progress: reducedMotion ? 0.38 : 0.43, name: "exhaust" },
        { progress: reducedMotion ? 0.58 : 0.57, name: "liftoff" },
        { progress: 0.72, name: "ascent" },
        { progress: 0.82, name: "transition" },
        { progress: 1, name: "complete" },
    ];
    const random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };

    function syncThemeColors() {
        const styles = getComputedStyle(document.documentElement);
        themePrimary = styles.getPropertyValue("--theme-primary").trim() || themePrimary;
        themeHighlight = styles.getPropertyValue("--theme-highlight").trim() || themeHighlight;
    }

    function resizeCanvas() {
        const bounds = canvas.getBoundingClientRect();
        const scale = 3;
        const width = Math.max(1, Math.ceil(bounds.width / scale));
        const height = Math.max(1, Math.ceil(bounds.height / scale));
        if (width !== lastWidth || height !== lastHeight) {
            lastWidth = width;
            lastHeight = height;
            canvas.width = width;
            canvas.height = height;
        }
    }

    function draw(timestamp) {
        if (!scene.classList.contains("active")) {
            frameId = 0;
            return;
        }

        resizeCanvas();
        const w = canvas.width;
        const h = canvas.height;
        const x = (n) => Math.round(n * w);
        const y = (n) => Math.round(n * h);
        const rect = (left, top, width, height, color) => {
            ctx.fillStyle = color;
            ctx.fillRect(x(left), y(top), Math.max(1, x(width)), Math.max(1, y(height)));
        };
        const poly = (points, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(x(points[0][0]), y(points[0][1]));
            points.slice(1).forEach(([px, py]) => ctx.lineTo(x(px), y(py)));
            ctx.closePath();
            ctx.fill();
        };
        const star = (cx, cy, radius, color) => poly([
            [cx, cy - radius],
            [cx + radius * 0.24, cy - radius * 0.24],
            [cx + radius, cy],
            [cx + radius * 0.24, cy + radius * 0.24],
            [cx, cy + radius],
            [cx - radius * 0.24, cy + radius * 0.24],
            [cx - radius, cy],
            [cx - radius * 0.24, cy - radius * 0.24],
        ], color);

        const elapsed = timestamp - startedAt;
        const progress = Math.min(1, elapsed / sequenceDuration);
        seed = 8917;
        let nextPhaseIndex = 0;
        for (let i = 1; i < launchPhases.length; i += 1) {
            if (progress < launchPhases[i].progress) break;
            nextPhaseIndex = i;
        }
        if (nextPhaseIndex > phaseIndex) {
            phaseIndex = nextPhaseIndex;
            document.dispatchEvent(new CustomEvent("beyond:launchphase", {
                detail: { phase: launchPhases[phaseIndex].name, progress },
            }));
        }
        const ignition = reducedMotion ? 0.18 : 0.25;
        const exhaust = reducedMotion ? 0.38 : 0.43;
        const liftoff = reducedMotion ? 0.58 : 0.57;
        const ascent = Math.max(0, Math.min(1, (progress - liftoff) / (1 - liftoff)));
        const throttle = Math.max(0, Math.min(1, (progress - ignition) / (exhaust - ignition)));
        const plumeLevel = Math.max(0, Math.min(1, (progress - exhaust) / (liftoff - exhaust)));
        const cameraShake = !reducedMotion && progress > ignition && progress < 0.9
            ? Math.sin(elapsed / 26) * Math.min(2, 0.45 + throttle * 1.4)
            : 0;

        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.translate(x(cameraShake / w), 0);

        rect(0, 0, 1, 1, "#101b2a");
        rect(0, 0, 1, 0.5, "#101c2c");
        rect(0, 0.5, 1, 0.28, "#1a2734");
        rect(0, 0.78, 1, 0.22, "#24282b");

        for (let i = 0; i < 145; i += 1) {
            const sx = random();
            const sy = random() * 0.51;
            const size = i % 11 === 0 ? 0.004 : 0.002;
            star(sx, sy, size * 1.5, i % 8 === 0 ? "#bac0b5" : "#74818a");
        }
        for (let row = 0; row < 20; row += 1) {
            const span = 0.16 + row * 0.006;
            const yy = 0.19 + row * 0.009;
            rect(0.82 - span, yy, span * 2, 0.003, row % 3 === 0 ? "#1d3140" : "#172b3b");
        }

        poly([[0, .66], [.10, .62], [.21, .65], [.30, .61], [.40, .65], [.51, .62], [.62, .66], [.75, .61], [.88, .65], [1, .62], [1, .82], [0, .82]], "#202c34");
        poly([[0, .71], [.11, .68], [.21, .70], [.34, .67], [.45, .70], [.57, .67], [.73, .71], [.84, .68], [1, .70], [1, .83], [0, .83]], "#28333a");
        rect(0, .75, 1, .012, "#39434a");

        const tower = (side) => {
            ctx.save();
            if (side === "right") {
                ctx.translate(w, 0);
                ctx.scale(-1, 1);
            }
            poly([[0, .12], [.16, .15], [.22, .76], [.18, .83], [0, .78]], "#27333a");
            poly([[.02, .13], [.12, .16], [.18, .75], [.14, .77], [.03, .72]], "#526068");
            poly([[.04, .15], [.105, .17], [.15, .70], [.10, .70]], "#35434b");
            poly([[.12, .16], [.17, .18], [.21, .75], [.17, .77]], "#778187");
            for (let i = 0; i < 13; i += 1) {
                const yy = .18 + i * .043;
                rect(.02, yy, .17, .008, i % 3 === 0 ? "#91999a" : "#526067");
                rect(.035, yy + .011, .012, .026, i % 2 ? "#303d44" : "#657078");
                rect(.18, yy + .005, .04, .005, "#8b9392");
            }
            for (let i = 0; i < 8; i += 1) {
                rect(.025 + i * .021, .25 + (i % 2) * .012, .008, .22 - (i % 3) * .025, "#9ca19b");
            }
            rect(.025, .32, .018, .026, themePrimary);
            rect(.025, .323, .009, .018, themeHighlight);
            rect(.048, .32, .013, .026, themePrimary);
            rect(.051, .323, .007, .018, themeHighlight);
            for (let i = 0; i < 7; i += 1) {
                rect(.04 + i * .021, .735, .014, .012, i % 2 ? themePrimary : "#8a9495");
            }
            ctx.restore();
        };
        tower("left");
        tower("right");

        const center = 0.5;
        const rocketRise = ascent * 0.78;
        const rocketTop = 0.07 - rocketRise;
        const rocketBottom = 0.79 - rocketRise;
        const rocketWidth = Math.min(0.23, h * 0.00042);
        const half = rocketWidth / 2;
        const noseHeight = (rocketBottom - rocketTop) * 0.16;
        const bodyTop = rocketTop + noseHeight;
        const bodyBottom = rocketBottom - (rocketBottom - rocketTop) * 0.13;

        if (plumeLevel > 0 && ascent < 0.6) {
            const plumeOpacity = 0.28 + plumeLevel * 0.72;
            const plumeLength = 0.08 + plumeLevel * 0.62;
            ctx.globalAlpha = plumeOpacity;
            poly([[center - half * .55, bodyBottom], [center + half * .55, bodyBottom], [center + half * .78, bodyBottom + plumeLength * .32], [center + half * 1.25, bodyBottom + plumeLength * .55], [center + half * .7, bodyBottom + plumeLength], [center - half * .72, bodyBottom + plumeLength * .84], [center - half * 1.1, bodyBottom + plumeLength * .53], [center - half * .78, bodyBottom + plumeLength * .3]], "#9a7958");
            poly([[center - half * .38, bodyBottom], [center + half * .38, bodyBottom], [center + half * .75, bodyBottom + plumeLength * .35], [center + half * .78, bodyBottom + plumeLength * .67], [center + half * .37, bodyBottom + plumeLength * .88], [center - half * .45, bodyBottom + plumeLength * .83], [center - half * .72, bodyBottom + plumeLength * .46]], "#e1b56c");
            poly([[center - half * .2, bodyBottom], [center + half * .2, bodyBottom], [center + half * .47, bodyBottom + plumeLength * .38], [center + half * .27, bodyBottom + plumeLength * .7], [center - half * .28, bodyBottom + plumeLength * .76], [center - half * .48, bodyBottom + plumeLength * .4]], "#f0d7a1");
            for (let i = 0; i < 32; i += 1) {
                const spread = (random() - .5) * rocketWidth * (1.2 + plumeLevel);
                const py = bodyBottom + random() * plumeLength;
                rect(center + spread, py, 0.008, 0.012, i % 3 === 0 ? "#d0ccc0" : "#a8ada8");
            }
            ctx.globalAlpha = 1;
        }

        if (rocketBottom > 0) {
            poly([[center - half * .42, bodyBottom - .02], [center - half * 1.35, bodyBottom + .10], [center - half * 1.65, rocketBottom], [center - half * .55, rocketBottom]], "#657078");
            poly([[center + half * .42, bodyBottom - .02], [center + half * 1.35, bodyBottom + .10], [center + half * 1.65, rocketBottom], [center + half * .55, rocketBottom]], "#7c8587");
            poly([[center - half * .7, bodyTop], [center + half * .7, bodyTop], [center + half, bodyTop + .035], [center + half, bodyBottom], [center + half * .74, bodyBottom + .01], [center - half * .74, bodyBottom + .01], [center - half, bodyBottom], [center - half, bodyTop + .035]], "#a5aaa7");
            poly([[center - half * .64, bodyTop + .025], [center - half * .18, bodyTop + .025], [center - half * .18, bodyBottom - .02], [center - half * .64, bodyBottom - .02]], "#c7c6bb");
            poly([[center - half * .18, bodyTop + .025], [center + half * .67, bodyTop + .025], [center + half * .67, bodyBottom - .02], [center - half * .18, bodyBottom - .02]], "#8b9495");
            poly([[center - half * .64, bodyTop + .025], [center, rocketTop], [center + half * .64, bodyTop + .025], [center + half * .48, bodyTop + .08], [center - half * .48, bodyTop + .08]], "#d0cec2");
            poly([[center - half * .49, bodyTop + .08], [center + half * .49, bodyTop + .08], [center + half * .49, bodyTop + .10], [center - half * .49, bodyTop + .10]], "#737d82");

            const windowY = bodyTop + (bodyBottom - bodyTop) * .23;
            rect(center - half * .31, windowY - .006, half * .62, .09, "#47535a");
            rect(center - half * .22, windowY + .008, half * .44, .055, "#668895");
            rect(center - half * .18, windowY + .012, half * .15, .014, "#b4c1b9");
            rect(center - half * .55, bodyTop + .14, half * 1.1, .012, "#777f82");
            rect(center - half * .55, bodyTop + .16, half * 1.1, .008, themePrimary);

            for (let i = 0; i < 9; i += 1) {
                const yy = bodyTop + .19 + i * ((bodyBottom - bodyTop - .25) / 9);
                rect(center - half * .83, yy, half * 1.66, .006, i % 3 === 0 ? "#c6c5ba" : "#727c80");
                rect(center - half * .72, yy + .01, .008, .008, "#39454b");
                rect(center + half * .61, yy + .01, .008, .008, themeHighlight);
            }
            rect(center - half * .22, bodyBottom - .016, half * .44, .018, "#4c565b");
            rect(center - half * .12, bodyBottom, half * .24, .025 + throttle * .03, throttle > 0 ? "#eac26f" : "#6f797c");
            rect(center - half * .08, bodyBottom, half * .16, .012 + throttle * .025, throttle > 0 ? "#f5e1ab" : "#919997");
        }

        const arms = [
            { left: true, y: .38 },
            { left: false, y: .32 },
        ];
        arms.forEach(({ left, y: armY }) => {
            const sign = left ? -1 : 1;
            const outer = center + sign * .15;
            const attach = center + sign * half * .92;
            rect(Math.min(outer, attach), armY, Math.abs(attach - outer), .028, "#798286");
            rect(Math.min(outer, attach), armY + .008, Math.abs(attach - outer), .008, "#c3c4bc");
            rect(outer - .008, armY - .014, .016, .055, "#4a545a");
            rect(outer - .004, armY - .006, .008, .038, themePrimary);
            for (let i = 0; i < 4; i += 1) {
                rect(Math.min(outer, attach) + i * Math.abs(attach - outer) / 4, armY - .008, .009, .008, "#d3d0c4");
            }
        });

        rect(0, .80, 1, .025, "#454e52");
        rect(0, .825, 1, .015, "#252d31");
        for (let i = 0; i < 28; i += 1) {
            const px = i / 28;
            rect(px, .808, .018, .009, i % 2 ? themeHighlight : "#8b9594");
        }
        for (let i = 0; i < 16; i += 1) {
            const px = i * .064;
            rect(px, .84, .035, .008, "#596267");
            rect(px + .01, .853, .018, .006, "#343d41");
        }
        poly([[0, .88], [.17, .86], [.28, .89], [.39, .87], [.52, .9], [.64, .87], [.78, .89], [.91, .86], [1, .88], [1, 1], [0, 1]], "#333a3d");
        poly([[0, .94], [.18, .90], [.26, .93], [.36, .90], [.47, .94], [.60, .91], [.72, .94], [.82, .90], [1, .93], [1, 1], [0, 1]], "#242b2f");
        for (let i = 0; i < 30; i += 1) {
            const px = random();
            const py = .88 + random() * .1;
            rect(px, py, .008 + random() * .018, .006, i % 5 === 0 ? "#8f9691" : "#444d50");
        }

        if (progress > exhaust && progress < 0.94) {
            const cloudCount = 8 + Math.floor(plumeLevel * 24);
            for (let i = 0; i < cloudCount; i += 1) {
                const drift = ((i * 37 + elapsed / 22) % 100) / 100;
                const side = i % 2 ? -1 : 1;
                const puffX = center + side * (.12 + drift * .42);
                const puffY = .78 - drift * .28;
                const puffSize = .015 + (1 - drift) * .03;
                rect(puffX, puffY, puffSize, puffSize * 1.25, i % 3 ? "#778184" : "#9da19a");
                rect(puffX + side * puffSize, puffY + puffSize * .5, puffSize, puffSize * .7, "#59656a");
            }
        }

        if (progress > 0.82) {
            const veil = Math.min(0.7, (progress - 0.82) * 5);
            ctx.globalAlpha = veil;
            for (let i = 0; i < 220; i += 1) {
                const cloudX = ((i * 47) % 223) / 223;
                const cloudY = 0.48 + ((i * 83) % 151) / 151 * 0.52 - veil * 0.32;
                const cluster = i % 4 === 0 ? 0.018 : 0.01;
                if (cloudY < 0.94 && cloudY > 0.32) {
                    rect(cloudX, cloudY, cluster, cluster * 0.65, i % 3 === 0 ? "#a3a7a3" : "#7f898c");
                    if (i % 3 === 0) {
                        rect(cloudX - cluster * 0.65, cloudY + cluster * 0.3, cluster * 0.8, cluster * 0.55, "#687478");
                    }
                }
            }
            ctx.globalAlpha = 1;
        }

        ctx.restore();

        if (progress < 1 && scene.classList.contains("active")) {
            frameId = requestAnimationFrame(draw);
        } else {
            frameId = 0;
        }
    }

    function start() {
        if (frameId) {
            cancelAnimationFrame(frameId);
        }
        phaseIndex = -1;
        startedAt = performance.now();
        frameId = requestAnimationFrame(draw);
    }

    const resizeObserver = new ResizeObserver(() => {
        if (scene.classList.contains("active") && !frameId) {
            start();
        }
    });
    resizeObserver.observe(canvas);
    document.addEventListener("beyond:themechange", syncThemeColors);
    syncThemeColors();
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden && scene.classList.contains("active") && !frameId) {
            start();
        }
    });

    if (scene.classList.contains("active")) {
        start();
    }
})();
