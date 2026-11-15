(() => {
    "use strict";

    const scene = document.getElementById("missions-scene");
    const canvas = document.getElementById("mission-galaxy-background");
    const context = canvas?.getContext("2d");
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let time = 0;
    let previousFrame = 0;

    function parseColor(value, fallback) {
        const match = /^#([\da-f]{6})$/i.exec(value);
        if (!match) return fallback;
        const number = Number.parseInt(match[1], 16);
        return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
    }

    function themeColor(name, fallback) {
        const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return parseColor(value, fallback);
    }

    function colorString(rgb, alpha) {
        return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
    }

    function drawFourPointStar(x, y, radius, color) {
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

    function noise(x, y, seed = 0) {
        const value = Math.sin((x + seed) * 127.1 + (y - seed) * 311.7) * 43758.5453;
        return value - Math.floor(value);
    }

    function drawNebula(width, height, palette, animationTime) {
        const cell = 4;
        const columns = Math.ceil(width / cell);
        const rows = Math.ceil(height / cell);
        const drift = Math.floor(animationTime * 0.35);
        const clouds = [
            { x: width * 0.19, y: height * 0.37, rx: width * 0.23, ry: height * 0.25, seed: 2 },
            { x: width * 0.76, y: height * 0.61, rx: width * 0.28, ry: height * 0.24, seed: 8 },
            { x: width * 0.48, y: height * 0.12, rx: width * 0.19, ry: height * 0.13, seed: 17 },
        ];

        clouds.forEach((cloud, index) => {
            const color = palette[index % palette.length];
            for (let y = 0; y < rows; y += 1) {
                for (let x = 0; x < columns; x += 1) {
                    const px = x * cell;
                    const py = y * cell;
                    const dx = (px - cloud.x - drift * (index % 2 ? -1 : 1)) / cloud.rx;
                    const dy = (py - cloud.y) / cloud.ry;
                    const distance = dx * dx + dy * dy;
                    const grain = noise(x, y, cloud.seed);
                    const density = Math.max(0, 0.95 - distance) + grain * 0.42;
                    if (density < 0.8 || grain < 0.2) continue;
                    const alpha = Math.min(0.13, (density - 0.65) * 0.09);
                    context.fillStyle = colorString(color, alpha);
                    context.fillRect(px, py, cell * (grain > 0.78 ? 2 : 1), cell);
                }
            }
        });
    }

    function drawStars(width, height, color, animationTime) {
        const count = Math.max(90, Math.floor(width * height / 1450));
        for (let index = 0; index < count; index += 1) {
            const x = Math.floor(noise(index, 4, 1) * width);
            const y = Math.floor(noise(index, 7, 3) * height);
            const flicker = 0.36 + (Math.sin(animationTime * 1.2 + index) + 1) * 0.2;
            const size = index % 17 === 0 ? 2 : 1;
            drawFourPointStar(x, y, size, colorString(color, flicker));
        }
    }

    function drawStarMap(width, height, color) {
        const centerX = width * 0.68;
        const centerY = height * 0.45;
        [0.2, 0.32, 0.45].forEach((ratio, index) => {
            context.beginPath();
            context.ellipse(centerX, centerY, width * ratio, height * ratio * 0.58, 0, 0, Math.PI * 2);
            context.strokeStyle = colorString(color, 0.06 + index * 0.02);
            context.lineWidth = 0.5;
            context.stroke();

            [0.55 + index * 0.8, 2.45 + index * 0.6].forEach((angle) => {
                const x = Math.floor(centerX + Math.cos(angle) * width * ratio);
                const y = Math.floor(centerY + Math.sin(angle) * height * ratio * 0.58);
                drawFourPointStar(x, y, 1.5, colorString(color, 0.42));
            });
        });
        drawFourPointStar(Math.floor(centerX), Math.floor(centerY), 3, colorString(color, 0.72));
        drawFourPointStar(Math.floor(width * 0.18), Math.floor(height * 0.68), 2, colorString(color, 0.5));
        drawFourPointStar(Math.floor(width * 0.84), Math.floor(height * 0.22), 2, colorString(color, 0.5));
    }

    function drawWorkshop(width, height, color) {
        const constellation = [
            [0.17, 0.78],
            [0.31, 0.72],
            [0.43, 0.82],
            [0.58, 0.73],
            [0.72, 0.79],
            [0.86, 0.69],
        ].map(([x, y]) => [Math.floor(width * x), Math.floor(height * y)]);
        context.beginPath();
        context.moveTo(...constellation[0]);
        constellation.slice(1).forEach(([x, y]) => context.lineTo(x, y));
        context.strokeStyle = colorString(color, 0.1);
        context.lineWidth = 0.5;
        context.stroke();
        constellation.forEach(([x, y], index) => {
            drawFourPointStar(x, y, index % 2 === 0 ? 2 : 1.5, colorString(color, 0.38));
        });
    }

    function draw(timestamp = 0) {
        frame = 0;
        if (!scene || !canvas || !context) return;
        const bounds = scene.getBoundingClientRect();
        const scale = 4;
        const width = Math.max(1, Math.ceil(bounds.width / scale));
        const height = Math.max(1, Math.ceil(Math.max(bounds.height, window.innerHeight) / scale));
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }

        context.clearRect(0, 0, width, height);
        const primary = themeColor("--theme-primary", [187, 193, 200]);
        const secondary = themeColor("--theme-secondary", [138, 150, 155]);
        const highlight = themeColor("--theme-highlight", [225, 227, 223]);
        drawNebula(width, height, [primary, secondary, highlight], time);
        drawStars(width, height, highlight, time);

        if (scene.dataset.atmosphere === "destination") {
            drawStarMap(width, height, secondary);
        } else if (scene.dataset.atmosphere === "engineering") {
            drawWorkshop(width, height, secondary);
        }

        if (!motionPreference.matches && !document.hidden && scene.classList.contains("active")) {
            if (previousFrame) time += Math.min(0.05, (timestamp - previousFrame) / 1000);
            previousFrame = timestamp;
            frame = window.requestAnimationFrame(draw);
        } else {
            previousFrame = 0;
        }
    }

    function redraw() {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        draw();
    }

    if (scene && canvas && context) {
        const resizeObserver = new ResizeObserver(redraw);
        resizeObserver.observe(scene);
        document.addEventListener("beyond:themechange", redraw);
        document.addEventListener("beyond:scenechange", redraw);
        document.addEventListener("visibilitychange", redraw);
        motionPreference.addEventListener?.("change", redraw);
        window.addEventListener("resize", redraw);
        window.BeyondEarthGalaxyAtmosphere = Object.freeze({
            setEnvironment(environment) {
                scene.dataset.atmosphere = environment;
                redraw();
            },
        });
        draw();
    }
})();
