(() => {
    "use strict";

    const STORAGE_KEY = "astronaut-personnel-file-v1";
    const EXPRESSIONS = Object.freeze([
        { id: "happy", label: "HAPPY" },
        { id: "calm", label: "CALM" },
        { id: "sleepy", label: "SLEEPY" },
        { id: "surprised", label: "SURPRISED" },
        { id: "excited", label: "EXCITED" },
        { id: "wink", label: "WINK" },
        { id: "shy", label: "SHY" },
    ]);

    const EMBLEMS = Object.freeze([
        {
            id: "butterfly",
            name: "BUTTERFLY",
            pixels: [
                "....OO....OO....",
                "...OAAO..OAAO...",
                "..OAAAO..OAAAO..",
                ".OAAAAO..OAAAAO.",
                ".OAHSAO..OAHSAO.",
                "..OAAAO..OAAAO..",
                "...OAAO..OAAO...",
                "....OO....OO....",
                ".......OO.......",
                "......OAHO......",
                ".......DD.......",
                "......OAAO......",
                ".....OAS..SAO...",
                "....OASS..SSAO..",
                "................",
                "................",
            ],
        },
        {
            id: "rose",
            name: "ROSE",
            pixels: [
                "......OOOO......",
                "....OOAAAAOO....",
                "...OAAHAAHAAO...",
                "..OAAAHAAHAAAO..",
                "..OAAHAAAAHAAO..",
                "...OAAHAAHAAO...",
                "....OOAAAAOO....",
                ".....OAASAO.....",
                "......ODDO......",
                ".....ODDDO......",
                "....OAAODDO.....",
                "...OAAO..ODDO...",
                "...ODDO..OAAO...",
                "....ODDDO.......",
                ".....ODDO.......",
                "................",
            ],
        },
        {
            id: "star",
            name: "STAR",
            pixels: [
                ".......OO.......",
                "......OAAO......",
                ".....OAAAAO.....",
                "..OOOAAAAAAOOO..",
                ".OAAAAAAAAAAAAO.",
                "..OAAAAAAAAAAO..",
                "...OAAAAAAAAO...",
                "....OAAAAAAO....",
                ".....OAAAAO.....",
                "......ODDO......",
                ".....OD..DO.....",
                ".....SH..HS.....",
                "......OHHO......",
                ".......OO.......",
                "................",
                "................",
            ],
        },
        {
            id: "crescent-moon",
            name: "CRESCENT MOON",
            pixels: [
                "......OOOO......",
                "....OOAAAAOO....",
                "...OAAAAAAAO....",
                "..OAAAAAAO......",
                ".OAAAAAO........",
                ".OAAAAO.........",
                "OAAAAO..........",
                "OAAAAO..........",
                "OAAAAO..........",
                ".OAAAAO.........",
                ".OAAAAAO........",
                "..OAAAAAAO......",
                "...OAAAAAAAO....",
                "....OOAAAAOO....",
                "......OOOO......",
                "................",
            ],
        },
        {
            id: "ringed-planet",
            name: "RINGED PLANET",
            pixels: [
                "...OOO....OOO...",
                "..OSSO....OSSO..",
                ".OAAAAO..OAAAAO.",
                "OAAAAAO..OAAAAAO",
                "...OOOOOOOOOO...",
                "....OAAAAAAO....",
                "...OAAHAAAAAO...",
                "...OADADAAAAO...",
                "...OAAAAAAAAO...",
                "....OAAAAAAO....",
                "...OOOOOOOOOO...",
                "OAAAAAO..OAAAAAO",
                ".OAAAAO..OAAAAO.",
                "..OSSO....OSSO..",
                "...OOO....OOO...",
                "................",
            ],
        },
        {
            id: "shooting-star",
            name: "SHOOTING STAR",
            pixels: [
                "........OO......",
                ".......OAAO.....",
                "......OAAAAO....",
                ".....OAAAAAAO...",
                "..OO.OAAAAAAO...",
                ".OAAO.OAAAAAAO..",
                "OAAAAOOAAAAAAO..",
                ".OAAO.OAAAAAAO..",
                "..OO...OAAAAO...",
                "........OAAO....",
                ".........OO.....",
                "......OO........",
                ".....OAAO.......",
                "......OO........",
                "................",
                "................",
            ],
        },
        {
            id: "winged-heart",
            name: "WINGED HEART",
            pixels: [
                "....OO....OO....",
                "...OAAO..OAAO...",
                "..OAAAAOOAAAAO..",
                ".OAAAAAAAAAAAAO.",
                "OOOAAAAAAAAAAOOO",
                ".OAAHAAAAAAHAAO.",
                "..OAAAAAAAAAAO..",
                "...OAAAAAAAAO...",
                "....OAAAAAAO....",
                ".....OAAAAO.....",
                "......OAAO......",
                ".......OO.......",
                "....OO......OO..",
                "...OSSO....OSSO.",
                "....OO......OO..",
                "................",
            ],
        },
    ]);

    function generateAstronautId() {
        const bytes = new Uint8Array(8);
        if (window.crypto?.getRandomValues) {
            window.crypto.getRandomValues(bytes);
        } else {
            bytes.forEach((_, index) => {
                bytes[index] = Math.floor(Math.random() * 256);
            });
        }
        return `BE-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
    }

    function normalizeProfile(value) {
        const source = value && typeof value === "object" ? value : {};
        const validEmblem = EMBLEMS.some((emblem) => emblem.id === source.emblem);
        const validId = typeof source.astronautId === "string" && /^BE-[A-F0-9]{16}$/.test(source.astronautId);
        return {
            fullName: typeof source.fullName === "string" ? source.fullName.slice(0, 60) : "",
            agentName: typeof source.agentName === "string" ? source.agentName.slice(0, 24) : "",
            astronautId: validId ? source.astronautId : generateAstronautId(),
            colorFamily: window.BeyondEarthTheme.hasColorFamily(source.colorFamily) ? source.colorFamily : "black-grey",
            emblem: validEmblem ? source.emblem : "star",
            expression: EXPRESSIONS.some((expression) => expression.id === source.expression)
                ? source.expression
                : "happy",
            rank: typeof source.rank === "string" && source.rank ? source.rank : "RECRUIT",
        };
    }

    const storedProfile = window.BeyondEarthStorage.read(STORAGE_KEY);
    let profile = normalizeProfile(storedProfile);
    window.BeyondEarthTheme.setColorFamily(profile.colorFamily);

    function getPersonnelFile() {
        return { ...profile };
    }

    function savePersonnelFile(changes) {
        const updated = normalizeProfile({ ...profile, ...changes, astronautId: profile.astronautId });
        window.BeyondEarthStorage.write(STORAGE_KEY, updated);
        profile = updated;
        document.dispatchEvent(new CustomEvent("beyond:personnelupdated", {
            detail: { profile: getPersonnelFile() },
        }));
        return getPersonnelFile();
    }

    window.BeyondEarthPlayer = Object.freeze({
        getPersonnelFile,
        savePersonnelFile,
        getEmblems: () => EMBLEMS.map((emblem) => ({
            ...emblem,
            pixels: [...emblem.pixels],
        })),
        getExpressions: () => EXPRESSIONS.map((expression) => ({ ...expression })),
    });
})();