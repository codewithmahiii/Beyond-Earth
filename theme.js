(() => {
    "use strict";

    const palettes = Object.freeze({
        purple: Object.freeze({
            label: "PURPLE",
            primary: "#a98cd4",
            highlight: "#decdf4",
            shadow: "#594474",
            secondary: "#c5a9df",
            background: "#f0eaf7",
            environmentPrimary: "#685b83",
            environmentSecondary: "#a89acb",
            structuralTrim: "#d1c6e7",
            upholstery: "#786b89",
            consoleSurface: "#574c6d",
            ambientLighting: "#b6a2d8",
        }),
        pink: Object.freeze({
            label: "PINK",
            primary: "#d98ea5",
            highlight: "#f5cbd8",
            shadow: "#834d61",
            secondary: "#e7adb9",
            background: "#f8e9ed",
            environmentPrimary: "#987381",
            environmentSecondary: "#d0a6b3",
            structuralTrim: "#e5c4cc",
            upholstery: "#a17b89",
            consoleSurface: "#775d67",
            ambientLighting: "#deb1bf",
        }),
        yellow: Object.freeze({
            label: "YELLOW",
            primary: "#cba64e",
            highlight: "#f1d98d",
            shadow: "#77602f",
            secondary: "#e5be69",
            background: "#f6f0dc",
            environmentPrimary: "#908561",
            environmentSecondary: "#c9bb8d",
            structuralTrim: "#ded1ad",
            upholstery: "#9c916f",
            consoleSurface: "#756a4d",
            ambientLighting: "#d6c48f",
        }),
        blue: Object.freeze({
            label: "BLUE",
            primary: "#8eacd4",
            highlight: "#c9def0",
            shadow: "#526d92",
            secondary: "#9aa6d4",
            background: "#eaf1f8",
            environmentPrimary: "#667d96",
            environmentSecondary: "#9fb5cb",
            structuralTrim: "#c8d6e0",
            upholstery: "#71859c",
            consoleSurface: "#526983",
            ambientLighting: "#a9c7e0",
        }),
        green: Object.freeze({
            label: "GREEN",
            primary: "#91b59a",
            highlight: "#cee2c9",
            shadow: "#4f745a",
            secondary: "#a7c9b0",
            background: "#ebf3e9",
            environmentPrimary: "#6d8374",
            environmentSecondary: "#a2b9a5",
            structuralTrim: "#cad8c8",
            upholstery: "#758b7c",
            consoleSurface: "#536e5d",
            ambientLighting: "#afc8a9",
        }),
        red: Object.freeze({
            label: "RED",
            primary: "#b64c55",
            highlight: "#efaaa0",
            shadow: "#703642",
            secondary: "#cf716e",
            background: "#f6e5e3",
            environmentPrimary: "#97666a",
            environmentSecondary: "#cf9a95",
            structuralTrim: "#e2bdb2",
            upholstery: "#a56e72",
            consoleSurface: "#78575d",
            ambientLighting: "#d8a69e",
        }),
        "black-grey": Object.freeze({
            label: "BLACK / GREY",
            primary: "#bbc1c8",
            highlight: "#e1e3df",
            shadow: "#4b5359",
            secondary: "#8a969b",
            background: "#eceeec",
            environmentPrimary: "#515b62",
            environmentSecondary: "#879297",
            structuralTrim: "#c2c8c8",
            upholstery: "#5d666c",
            consoleSurface: "#3f4a51",
            ambientLighting: "#bdcbd0",
        }),
    });

    let activeFamily = "black-grey";

    function hasColorFamily(family) {
        return Object.prototype.hasOwnProperty.call(palettes, family);
    }

    function dispatchThemeChange() {
        document.dispatchEvent(new CustomEvent("beyond:themechange", {
            detail: {
                family: activeFamily,
                palette: { ...palettes[activeFamily] },
            },
        }));
    }

    function setColorFamily(family) {
        if (!hasColorFamily(family)) {
            throw new RangeError(`Unknown astronaut colour family: ${family}`);
        }

        activeFamily = family;
        const palette = palettes[family];
        const root = document.documentElement;
        root.dataset.colorFamily = family;
        root.style.setProperty("--theme-primary", palette.primary);
        root.style.setProperty("--theme-highlight", palette.highlight);
        root.style.setProperty("--theme-dark", palette.shadow);
        root.style.setProperty("--theme-secondary", palette.secondary);
        root.style.setProperty("--theme-tint", palette.background);
        root.style.setProperty("--theme-environment-primary", palette.environmentPrimary);
        root.style.setProperty("--theme-environment-secondary", palette.environmentSecondary);
        root.style.setProperty("--theme-structural-trim", palette.structuralTrim);
        root.style.setProperty("--theme-upholstery", palette.upholstery);
        root.style.setProperty("--theme-console-surface", palette.consoleSurface);
        root.style.setProperty("--theme-ambient-lighting", palette.ambientLighting);
        root.style.setProperty("--theme-interface-accent", palette.primary);
        root.style.setProperty("--ship-accent", palette.primary);
        dispatchThemeChange();
        return { ...palette };
    }

    function setAccentColor(color) {
        if (typeof color !== "string" || !CSS.supports("color", color)) {
            throw new TypeError("Ship accent must be a valid CSS color.");
        }
        document.documentElement.style.setProperty("--ship-accent", color);
        document.documentElement.style.setProperty("--theme-primary", color);
        document.documentElement.style.setProperty("--theme-interface-accent", color);
        dispatchThemeChange();
    }

    setColorFamily(activeFamily);

    window.BeyondEarthTheme = Object.freeze({
        setAccentColor,
        setColorFamily,
        getColorFamily: () => activeFamily,
        getColorFamilies: () => Object.keys(palettes).map((id) => ({
            id,
            label: palettes[id].label,
            palette: { ...palettes[id] },
        })),
        getPalette: (family = activeFamily) => {
            if (!hasColorFamily(family)) {
                throw new RangeError(`Unknown astronaut colour family: ${family}`);
            }
            return { ...palettes[family] };
        },
        hasColorFamily,
    });
})();
