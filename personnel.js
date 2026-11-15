(() => {
    "use strict";

    const scene = document.getElementById("personnel-scene");
    const closeButton = document.getElementById("personnel-close");
    const saveButton = document.getElementById("personnel-save");
    const fullNameInput = document.getElementById("personnel-full-name");
    const agentNameInput = document.getElementById("personnel-agent-name");
    const colourOptions = document.getElementById("personnel-colour-options");
    const emblemOptions = document.getElementById("personnel-emblem-options");
    const expressionOptions = document.getElementById("personnel-expression-options");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fileAnimationDuration = reducedMotion ? 50 : 1550;
    const emblemCatalog = window.BeyondEarthPlayer.getEmblems();
    const expressionCatalog = window.BeyondEarthPlayer.getExpressions();

    let profile = window.BeyondEarthPlayer.getPersonnelFile();
    let draft = { ...profile };
    let openTimer = 0;
    let saveTimer = 0;

    function createEmblemSvg(emblem, className = "") {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 16 16");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");
        if (className) svg.setAttribute("class", className);

        emblem.pixels.forEach((row, y) => {
            if (row.length !== 16) {
                throw new Error(`Emblem "${emblem.id}" contains a row that is not 16 pixels wide.`);
            }
            Array.from(row).forEach((pixel, x) => {
                if (pixel === ".") return;
                const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect.setAttribute("x", String(x));
                rect.setAttribute("y", String(y));
                rect.setAttribute("width", "1");
                rect.setAttribute("height", "1");
                const color = {
                    A: "var(--theme-primary)",
                    H: "var(--theme-highlight)",
                    D: "var(--theme-dark)",
                    S: "var(--theme-secondary)",
                    O: "#53616a",
                }[pixel];
                if (!color) throw new Error(`Emblem "${emblem.id}" contains an unknown pixel colour.`);
                rect.setAttribute("fill", color);
                svg.appendChild(rect);
            });
        });
        return svg;
    }

    function setRadioSelection(container, selector, selectedId, attribute) {
        container.querySelectorAll(selector).forEach((button) => {
            const selected = button.dataset[attribute] === selectedId;
            button.setAttribute("aria-checked", String(selected));
            button.tabIndex = selected ? 0 : -1;
        });
    }

    function addRadioKeyboardSupport(container, selector, attribute, onSelect) {
        container.addEventListener("keydown", (event) => {
            if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
            const options = Array.from(container.querySelectorAll(selector));
            const currentIndex = options.indexOf(event.target.closest(selector));
            if (currentIndex < 0) return;
            event.preventDefault();
            const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
            const next = options[(currentIndex + direction + options.length) % options.length];
            next.focus();
            onSelect(next.dataset[attribute]);
            window.SpaceAudio?.playSFX?.("select");
        });
    }

    function buildColourOptions() {
        const families = window.BeyondEarthTheme.getColorFamilies();
        families.forEach((family) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "personnel-colour-swatch";
            button.dataset.personnelColor = family.id;
            button.setAttribute("role", "radio");
            button.setAttribute("aria-label", family.label);
            button.style.setProperty("--swatch-primary", family.palette.primary);

            const swatch = document.createElement("span");
            swatch.className = "personnel-swatch-dot";
            swatch.setAttribute("aria-hidden", "true");
            const label = document.createElement("span");
            label.textContent = family.label;
            button.append(swatch, label);
            button.addEventListener("click", () => {
                draft.colorFamily = family.id;
                window.BeyondEarthTheme.setColorFamily(family.id);
                syncPreview();
            });
            colourOptions.appendChild(button);
        });
        addRadioKeyboardSupport(colourOptions, "[data-personnel-color]", "personnelColor", (family) => {
            draft.colorFamily = family;
            window.BeyondEarthTheme.setColorFamily(family);
            syncPreview();
        });
    }

    function buildEmblemOptions() {
        emblemCatalog.forEach((emblem) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "personnel-emblem-option";
            button.dataset.personnelEmblem = emblem.id;
            button.setAttribute("role", "radio");
            button.setAttribute("aria-label", emblem.name);
            button.appendChild(createEmblemSvg(emblem));
            const label = document.createElement("span");
            label.textContent = emblem.name;
            button.appendChild(label);
            button.addEventListener("click", () => {
                draft.emblem = emblem.id;
                syncPreview();
            });
            emblemOptions.appendChild(button);
        });
        addRadioKeyboardSupport(emblemOptions, "[data-personnel-emblem]", "personnelEmblem", (emblem) => {
            draft.emblem = emblem;
            syncPreview();
        });
    }

    function buildExpressionOptions() {
        expressionCatalog.forEach((expression) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "personnel-expression-option";
            button.dataset.personnelExpression = expression.id;
            button.setAttribute("role", "radio");
            button.setAttribute("aria-label", expression.label);

            const face = document.createElement("span");
            face.className = "expression-face";
            face.dataset.expression = expression.id;
            face.setAttribute("aria-hidden", "true");
            ["left", "right"].forEach((side) => {
                const eye = document.createElement("i");
                eye.className = `expression-eye expression-eye--${side}`;
                face.appendChild(eye);
            });
            const mouth = document.createElement("i");
            mouth.className = "expression-mouth";
            face.appendChild(mouth);

            const label = document.createElement("span");
            label.textContent = expression.label;
            button.append(face, label);
            button.addEventListener("click", () => {
                draft.expression = expression.id;
                syncPreview();
            });
            expressionOptions.appendChild(button);
        });
        addRadioKeyboardSupport(
            expressionOptions,
            "[data-personnel-expression]",
            "personnelExpression",
            (expression) => {
                draft.expression = expression;
                syncPreview();
            }
        );
    }

    function syncPreview() {
        draft.fullName = fullNameInput.value.slice(0, 60);
        draft.agentName = agentNameInput.value.slice(0, 24);
        const fullName = draft.fullName.trim() || "YOUR NAME";
        const agentName = draft.agentName.trim() || "YOUR CALLSIGN";
        document.getElementById("personnel-name-preview").textContent = fullName;
        document.getElementById("personnel-agent-preview").textContent = agentName;
        document.getElementById("personnel-astronaut-id").textContent = draft.astronautId;
        document.getElementById("personnel-colour-preview").textContent =
            window.BeyondEarthTheme.getPalette(draft.colorFamily).label;
        const selectedEmblem = emblemCatalog.find((emblem) => emblem.id === draft.emblem);
        document.getElementById("personnel-emblem-name").textContent = selectedEmblem.name;

        const emblemPreview = document.getElementById("personnel-emblem-preview");
        emblemPreview.replaceChildren(createEmblemSvg(selectedEmblem));
        emblemPreview.setAttribute("aria-label", `Selected emblem: ${selectedEmblem.name}`);
        const portraitPatch = document.querySelector(".portrait-patch");
        portraitPatch.replaceChildren(createEmblemSvg(selectedEmblem, "portrait-emblem"));
        const portrait = document.querySelector(".personnel-portrait");
        portrait.dataset.expression = draft.expression;
        const selectedExpression = expressionCatalog.find((expression) => expression.id === draft.expression);
        portrait.setAttribute(
            "aria-label",
            `Pixel-art astronaut portrait, ${selectedExpression.label.toLowerCase()} expression, wearing the ${selectedEmblem.name} emblem`
        );
        setRadioSelection(colourOptions, "[data-personnel-color]", draft.colorFamily, "personnelColor");
        setRadioSelection(emblemOptions, "[data-personnel-emblem]", draft.emblem, "personnelEmblem");
        setRadioSelection(
            expressionOptions,
            "[data-personnel-expression]",
            draft.expression,
            "personnelExpression"
        );
    }

    function createPortrait(source = window.BeyondEarthPlayer.getPersonnelFile()) {
        const selectedEmblem = emblemCatalog.find((emblem) => emblem.id === source.emblem);
        const selectedExpression = expressionCatalog.find((expression) => expression.id === source.expression);
        const template = document.querySelector(".personnel-portrait");
        if (!selectedEmblem || !selectedExpression || !template) {
            throw new Error("The saved astronaut portrait could not be rendered.");
        }
        const portrait = template.cloneNode(true);
        portrait.dataset.expression = source.expression;
        portrait.querySelector(".portrait-patch").replaceChildren(
            createEmblemSvg(selectedEmblem, "portrait-emblem")
        );
        portrait.setAttribute(
            "aria-label",
            `Pixel-art astronaut portrait, ${selectedExpression.label.toLowerCase()} expression, wearing the ${selectedEmblem.name} emblem`
        );
        return portrait;
    }

    function populateForm() {
        profile = window.BeyondEarthPlayer.getPersonnelFile();
        draft = { ...profile };
        fullNameInput.value = profile.fullName;
        agentNameInput.value = profile.agentName;
        document.getElementById("personnel-rank").textContent = profile.rank;
        window.BeyondEarthTheme.setColorFamily(profile.colorFamily);
        document.getElementById("personnel-save-feedback").textContent = "";
        scene.classList.remove("is-saved");
        syncPreview();
    }

    function open() {
        if (scene.classList.contains("active")) return;
        window.clearTimeout(openTimer);
        populateForm();
        scene.classList.remove("file-opening", "file-open");
        if (!window.BeyondEarthScenes.show("personnel-scene")) return;

        window.requestAnimationFrame(() => {
            scene.classList.add("file-opening");
            openTimer = window.setTimeout(() => {
                scene.classList.remove("file-opening");
                scene.classList.add("file-open");
                closeButton.focus({ preventScroll: true });
            }, fileAnimationDuration);
        });
    }

    function close() {
        if (!scene.classList.contains("active")) return;
        window.clearTimeout(openTimer);
        window.clearTimeout(saveTimer);
        scene.classList.remove("file-opening", "file-open", "is-saved");
        window.BeyondEarthScenes.show("cockpit-scene");
        const profileStation = document.querySelector(".station-profile");
        profileStation?.setAttribute("aria-pressed", "false");
        profileStation?.focus({ preventScroll: true });
    }

    function save() {
        profile = window.BeyondEarthPlayer.savePersonnelFile({
            fullName: fullNameInput.value.trim(),
            agentName: agentNameInput.value.trim(),
            colorFamily: draft.colorFamily,
            emblem: draft.emblem,
            expression: draft.expression,
        });
        draft = { ...profile };
        window.BeyondEarthTheme.setColorFamily(profile.colorFamily);
        syncPreview();
        document.getElementById("personnel-save-feedback").textContent = "PROFILE SAVED";
        scene.classList.remove("is-saved");
        window.requestAnimationFrame(() => {
            scene.classList.add("is-saved");
        });
        window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(() => scene.classList.remove("is-saved"), 1100);
    }

    buildColourOptions();
    buildEmblemOptions();
    buildExpressionOptions();
    syncPreview();

    fullNameInput.addEventListener("input", syncPreview);
    agentNameInput.addEventListener("input", syncPreview);
    closeButton.addEventListener("click", close);
    saveButton.addEventListener("click", save);
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && scene.classList.contains("active")) {
            event.preventDefault();
            close();
        }
    });

    window.AstronautPersonnel = Object.freeze({ close, createPortrait, open });
})();
