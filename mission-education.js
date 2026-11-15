(() => {
    "use strict";

    const knowledge = window.BeyondEarthKnowledge;
    const entries = [
        {
            id: "mission-engineering",
            title: "A spacecraft is a system of systems",
            category: "Mission Design",
            summary: "A mission succeeds when its subsystems work together toward one science goal.",
            content: "A spacecraft combines structure, data handling, power, communications, guidance, thermal control, propulsion, and instruments. Different missions need different subsets. A useful design question is not only “does this part work?” but also “does it work with the rest of this mission?”",
            sources: [{ title: "NASA Basics of Space Flight: Onboard Systems, Page One", url: "https://science.nasa.gov/learn/basics-of-space-flight/chapter11-1/" }],
            tags: ["stage:headquarters", "stage:review", "discipline:systems"],
        },
        {
            id: "orbital-motion",
            title: "Orbits are falling paths",
            category: "Orbital Mechanics",
            summary: "An orbit is a repeating path shaped by an object's motion and gravity.",
            content: "Orbits are generally elliptical, even when they look nearly circular. A spacecraft's closest and farthest points have special names, and the time for one full circuit is its orbital period. The planner's route drawing is a concept illustration, not a calculated trajectory.",
            sources: [{ title: "NASA Space Place: What Is an Orbit?", url: "https://spaceplace.nasa.gov/orbits/en/" }],
            tags: ["stage:destination", "stage:journey", "discipline:orbits", "component:orbiter"],
        },
        {
            id: "science-measurement",
            title: "Turn a science question into a measurement",
            category: "Science Payload",
            summary: "Instruments gather evidence; they also need space, power, data handling, and a way to return results.",
            content: "Start with the question, then choose a measurement that can help answer it. Instruments have practical costs: mass and electrical demand in this planner. Their observations also need to be recorded and communicated. A required-instrument warning points to a gap between an objective and the selected science payload.",
            sources: [{ title: "NASA Basics of Space Flight: Onboard Systems, Page One", url: "https://science.nasa.gov/learn/basics-of-space-flight/chapter11-1/" }],
            tags: ["stage:objectives", "stage:instruments", "discipline:payload", "component:cameras", "component:infrared-spectrometer", "component:radar-sounder", "component:magnetometer", "component:radiation-detector", "component:thermal-sensor", "component:atmospheric-analyser", "component:seismometer", "component:laser-altimeter", "component:spectrometer", "component:robotic-arm", "component:drill", "component:microscopic-imager", "component:dust-analyser", "component:plasma-analyser"],
        },
        {
            id: "spacecraft-subsystems",
            title: "Choose a spacecraft around its job",
            category: "Systems Engineering",
            summary: "A platform is a collection of capabilities and constraints, not just a shape.",
            content: "Spacecraft architectures differ in the functions and equipment they can support. In this planner, platform recommendations use objective compatibility, while component-slot and catalog limits help explain where trade-offs appear. A specialized option is a prompt to inspect the design review, not a reason to remove the existing choice.",
            sources: [{ title: "NASA Basics of Space Flight: Onboard Systems, Page One", url: "https://science.nasa.gov/learn/basics-of-space-flight/chapter11-1/" }],
            tags: ["stage:architecture", "stage:review", "discipline:systems"],
        },
        {
            id: "rocket-equation",
            title: "Why rocket mass matters",
            category: "Propulsion",
            summary: "The ideal rocket equation links velocity change to exhaust velocity and mass ratio.",
            content: "In an idealized rocket maneuver, Δv = vₑ ln(m₀/mf): vₑ is effective exhaust velocity, m₀ is starting mass, and mf is final mass. It assumes an idealized powered flight and is not calculated by this game's component catalog. Here, use it to explore why propulsion, propellant, and spacecraft mass are connected—not as a mission-performance prediction.",
            sources: [{ title: "NASA Glenn Research Center: Ideal Rocket Equation", url: "https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/" }],
            tags: ["stage:propulsion", "discipline:propulsion", "component:chemical-propulsion", "component:electric-propulsion", "component:ion-propulsion", "component:solar-sail", "component:hybrid-propulsion", "component:gravity-assist-trajectory"],
        },
        {
            id: "power-budget",
            title: "Balance the spacecraft power budget",
            category: "Power",
            summary: "Available power must cover the demand of the systems that need to operate.",
            content: "A simple budget margin is generated power minus the sum of modeled component loads. A positive margin means the current catalog figures fit this simplified check; it does not account for duty cycles, storage behavior, degradation, or peak loads. Solar arrays, batteries, and radioisotope systems solve different mission needs and come with different trade-offs.",
            sources: [{ title: "NASA Basics of Space Flight: Electrical Power Supply and Distribution", url: "https://science.nasa.gov/learn/basics-of-space-flight/chapter11-3/" }],
            tags: ["stage:power", "stage:constraints", "discipline:power", "component:solar-panels", "component:batteries", "component:radioisotope-power", "component:hybrid-power"],
        },
        {
            id: "data-link",
            title: "Science needs a path home",
            category: "Communications",
            summary: "A spacecraft's communications system must support the data and relay needs of its objectives.",
            content: "Mission communications move commands to spacecraft and science data back to Earth or through a relay. In this planner, compare the selected link's catalogued data rate and relay capability with the requirements attached to the chosen objectives. The displayed rate is a simplified capability check, not a promise of delivered data volume.",
            sources: [
                { title: "NASA Space Communications and Navigation (SCaN)", url: "https://www.nasa.gov/communicating-with-missions/" },
                { title: "NASA Basics of Space Flight: Attitude Control and Telecommunications", url: "https://science.nasa.gov/learn/basics-of-space-flight/chapter11-2/" },
            ],
            tags: ["stage:communications", "stage:objectives", "discipline:communications", "component:high-gain-antenna", "component:low-gain-antenna", "component:relay-communications", "component:direct-earth-communication"],
        },
        {
            id: "guidance-control",
            title: "Point the spacecraft where it needs to look",
            category: "Navigation",
            summary: "Guidance and attitude control help a spacecraft orient for maneuvers, observations, and communication.",
            content: "A spacecraft needs to know and control its orientation to point instruments and antennas, and to perform maneuvers in the intended direction. Navigation and attitude hardware have different roles, but they must work together with the mission's trajectory and communication plan.",
            sources: [{ title: "NASA Basics of Space Flight: Attitude and Articulation Control", url: "https://science.nasa.gov/learn/basics-of-space-flight/chapter11-2/" }],
            tags: ["stage:navigation", "stage:journey", "discipline:navigation", "component:star-tracker", "component:inertial-navigation", "component:deep-space-navigation"],
        },
        {
            id: "thermal-control",
            title: "Keep equipment within its temperature limits",
            category: "Thermal",
            summary: "Thermal design manages heating and cooling from sunlight, shadow, and spacecraft equipment.",
            content: "Spacecraft can face large temperature changes. Passive approaches such as insulation and radiators manage heat without continuous active control; heaters and other active systems can use electrical power. The mission review compares known destination conditions with any operating limits present in the component catalog.",
            sources: [{ title: "NASA Basics of Space Flight: Temperature Control Subsystems", url: "https://science.nasa.gov/learn/basics-of-space-flight/chapter11-4/" }],
            tags: ["stage:navigation", "stage:destination", "discipline:thermal", "component:passive-radiator", "component:active-thermal-loop", "component:cryogenic-control"],
        },
        {
            id: "systems-integration",
            title: "A suitable design is an integration achievement",
            category: "Systems Engineering",
            summary: "A strong design fits its objective, spacecraft, subsystems, and destination together.",
            content: "Compatibility is about relationships: instruments must support objectives, communication must meet mission needs, and components must fit platform and environmental limits. A “suitable” result means the current modeled checks found no warnings or hard issues; it is a learning milestone, not real-world flight certification.",
            sources: [
                { title: "NASA Basics of Space Flight: Onboard Systems, Page One", url: "https://science.nasa.gov/learn/basics-of-space-flight/chapter11-1/" },
                { title: "NASA Space Communications and Navigation (SCaN)", url: "https://www.nasa.gov/communicating-with-missions/" },
            ],
            tags: ["stage:review", "discipline:systems"],
        },
    ];

    entries.forEach((entry) => knowledge.register(entry));

    const stageEntries = Object.freeze({
        headquarters: "mission-engineering",
        destination: "orbital-motion",
        objectives: "science-measurement",
        architecture: "spacecraft-subsystems",
        propulsion: "rocket-equation",
        power: "power-budget",
        instruments: "science-measurement",
        communications: "data-link",
        navigation: "guidance-control",
        journey: "orbital-motion",
        constraints: "power-budget",
        review: "systems-integration",
    });

    const componentEntries = Object.freeze({
        "chemical-propulsion": "rocket-equation",
        "electric-propulsion": "rocket-equation",
        "ion-propulsion": "rocket-equation",
        "solar-sail": "rocket-equation",
        "hybrid-propulsion": "rocket-equation",
        "gravity-assist-trajectory": "orbital-motion",
        "solar-panels": "power-budget",
        batteries: "power-budget",
        "radioisotope-power": "power-budget",
        "hybrid-power": "power-budget",
        "high-gain-antenna": "data-link",
        "low-gain-antenna": "data-link",
        "relay-communications": "data-link",
        "direct-earth-communication": "data-link",
        "star-tracker": "guidance-control",
        "inertial-navigation": "guidance-control",
        "deep-space-navigation": "guidance-control",
        "passive-radiator": "thermal-control",
        "active-thermal-loop": "thermal-control",
        "cryogenic-control": "thermal-control",
    });

    const selectionCategories = Object.freeze({
        propulsion: "propulsionSystems",
        power: "powerSystems",
        communications: "communicationsSystems",
        navigation: "navigationSystems",
        thermal: "thermalSystems",
        instruments: "instruments",
    });
    const componentStageByCategory = Object.freeze({
        propulsionSystems: "propulsion",
        powerSystems: "power",
        communicationsSystems: "communications",
        instruments: "instruments",
        thermalSystems: "navigation",
        navigationSystems: "navigation",
        components: "architecture",
    });
    const issueGuidance = Object.freeze({
        "destination-unselected": { stageId: "destination", message: "Choose a destination to define the environment; check Destinations." },
        "destination-unknown": { stageId: "destination", message: "This destination isn't in the catalog; review Destinations." },
        "objectives-unselected": { stageId: "objectives", message: "Choose a science objective before reviewing the design; check Objectives." },
        "objective-unknown": { stageId: "objectives", message: "A selected objective isn't in the catalog; review Objectives." },
        "architecture-unselected": { stageId: "architecture", message: "Choose a spacecraft to check equipment fit and payload limits; check Architecture." },
        "architecture-unknown": { stageId: "architecture", message: "This spacecraft isn't in the catalog; review Architecture." },
        "component-unknown": { message: "A selected component isn't in the catalog; review the equipment choices." },
        "architecture-incompatible": { message: "This component doesn't match the selected spacecraft; review its equipment and Architecture." },
        "component-conflict": { message: "Two selected components conflict; review the equipment choices in Architecture." },
        "component-slot-limit": { stageId: "architecture", message: "The spacecraft has more components in a slot than it supports; review Architecture." },
        "payload-mass-unknown": { stageId: "architecture", message: "Payload mass can't be checked because component mass data is missing; review the payload." },
        "payload-limit-exceeded": { stageId: "architecture", message: "Payload mass exceeds this spacecraft's limit; review Architecture and Instruments." },
        "payload-limit-unknown": { stageId: "architecture", message: "This spacecraft has no catalogued payload limit; review Architecture." },
        "power-system-unselected": { stageId: "power", message: "No power system is selected. Choose one in Power." },
        "power-output-unknown": { stageId: "power", message: "Power output is not specified; review the selected Power system." },
        "power-demand-unknown": { stageId: "power", message: "Power demand can't be checked because component loads are missing; review Power." },
        "power-limit-exceeded": { stageId: "power", message: "Power demand exceeds system output; review Power and component choices." },
        "required-instrument-missing": { stageId: "instruments", message: "A science objective is missing a required instrument; review Instruments." },
        "communications-missing": { stageId: "communications", message: "A science objective needs communications equipment; review Communications." },
        "communications-band-unsupported": { stageId: "communications", message: "The selected link doesn't support a required band; review Communications." },
        "communications-data-rate-unknown": { stageId: "communications", message: "The communications data rate isn't specified; review Communications." },
        "communications-data-rate-insufficient": { stageId: "communications", message: "The selected link is below an objective's data-rate requirement; review Communications." },
        "relay-capability-missing": { stageId: "communications", message: "An objective needs relay-capable communications; review Communications." },
        "environmental-data-missing": { stageId: "destination", message: "Environmental data is missing for a component check; review the destination and equipment." },
        "environmental-limit-exceeded": { stageId: "destination", message: "A component's limits don't include this destination's conditions; review the destination and equipment." },
        "mission-plan-warning": { stageId: "journey" },
    });
    const stageEntry = Object.freeze({
        destination: "orbital-motion",
        objectives: "science-measurement",
        architecture: "spacecraft-subsystems",
        propulsion: "rocket-equation",
        power: "power-budget",
        communications: "data-link",
        navigation: "thermal-control",
        instruments: "science-measurement",
        journey: "orbital-motion",
        constraints: "power-budget",
        review: "systems-integration",
    });

    const stickers = [
        { entryId: "orbital-motion", title: "ORBIT SCOUT", pattern: [".S....S.", "..S..S..", "...SS...", "SSSSSSSS", "...SS...", "..S..S..", ".S....S.", "........"] },
        { entryId: "science-measurement", title: "QUESTION CHASER", pattern: ["...SS...", "..SHHS..", ".SHHHHS.", "SSHHHHSS", ".SHHHHS.", "..SHHS..", "...SS...", "........"] },
        { entryId: "rocket-equation", title: "DELTA-V DETECTIVE", pattern: ["...C....", "...C....", "..CCC...", ".CHHHC..", ".CHHHC..", "..CCC...", "..C.C...", ".CC.CC.."] },
        { entryId: "power-budget", title: "POWER KEEPER", pattern: ["...S....", "..SSS...", ".SSSSS..", "...B....", "..BBB...", ".BBBBB..", "..BBB...", "...B...."] },
        { entryId: "data-link", title: "SIGNAL FINDER", pattern: ["...C....", "..CCC...", ".C...C..", "C..B..C.", ".C...C..", "..CCC...", "...C....", "........"] },
        { entryId: "systems-integration", title: "SYSTEMS STITCHER", pattern: ["..HHHH..", ".H....H.", "H..SS..H", "H.S..S.H", "H..SS..H", "H......H", ".H....H.", "..HHHH.."] },
    ];
    const stickerByEntry = new Map(stickers.map((sticker) => [sticker.entryId, sticker]));
    const palette = {
        S: "var(--mission-accent)",
        H: "var(--mission-highlight)",
        C: "var(--mission-trim)",
        B: "#78b9d1",
    };
    const stageMessages = {
        headquarters: "Pick a destination, and we'll start the flight log.",
        destination: "Which world should we explore?",
        objectives: "What evidence could answer your science question?",
        architecture: "Let's find a spacecraft that fits the job.",
        propulsion: "How will your spacecraft change its path?",
        power: "Every system shares the available power.",
        instruments: "Which tools can collect the evidence you need?",
        communications: "Your science needs a path home.",
        navigation: "Let's help the spacecraft point and stay in range.",
        journey: "How should your spacecraft reach its destination?",
        constraints: "Let's check the mission's modeled limits.",
        review: "Let's see how the mission pieces fit together.",
    };
    const designStages = new Set([
        "headquarters", "destination", "objectives", "architecture", "propulsion",
        "power", "instruments", "communications", "navigation", "journey",
        "constraints", "review",
    ]);
    const personalityMoments = Object.freeze([
        { id: "icy-oceans", category: "space", expression: "curious", gesture: "look", requiresGuidance: true, message: "Some icy moons may hide oceans beneath their crust. I have questions for the oceans." },
        { id: "star-count", category: "silly", expression: "confused", gesture: "look", message: "I counted the stars, lost count, and asked the stars to start over." },
        { id: "space-shaped", category: "feelings", expression: "proud", gesture: "bounce", message: "I am feeling particularly space-shaped today." },
        { id: "backup-plan", category: "playful", expression: "mischievous", gesture: "inspect", message: "My backup plan has a backup plan. It is a very organized little stack." },
        { id: "space-socks", category: "silly", expression: "confused", gesture: "think", message: "Do socks escape in zero gravity? I do not own socks, but I remain concerned." },
        { id: "power-blanket", category: "engineering", expression: "thinking", gesture: "inspect", requiresGuidance: true, designOnly: true, message: "A tidy power budget is a cozy blanket for the numbers." },
        { id: "star-wave", category: "space", expression: "surprised", gesture: "wave", requiresGuidance: true, message: "I have no evidence, but that star looks like it is waving." },
        { id: "tiny-rest", category: "feelings", expression: "sleepy", gesture: "rest", message: "My recharge indicator is fine. I am practicing a very tiny rest." },
        { id: "extra-screws", category: "engineering", expression: "proud", gesture: "bounce", requiresGuidance: true, designOnly: true, message: "Engineering is problem-solving with extra screws. I have checked." },
        { id: "infinity", category: "playful", expression: "confused", gesture: "think", message: "I tried to calculate infinity. The calculator requested a lunch break." },
        { id: "distant-light", category: "space", expression: "thinking", gesture: "look", requiresGuidance: true, message: "Light from distant stars takes a long time to reach us. The universe is not in a hurry." },
        { id: "excellent-beep", category: "feelings", expression: "proud", gesture: "bounce", message: "I completed one excellent beep. Morale restored." },
        { id: "crater-sound", category: "space", expression: "curious", gesture: "look", requiresGuidance: true, message: "I wonder what the quiet side of a crater sounds like. Probably quiet." },
        { id: "left-boot", category: "silly", expression: "embarrassed", gesture: "inspect", message: "My left boot is more confident than my right boot. We are discussing it." },
        { id: "fit-the-science", category: "engineering", expression: "excited", gesture: "wave", requiresGuidance: true, designOnly: true, message: "When a design fits its science goal, my little checklist does a happy wiggle." },
        { id: "buffering-space", category: "space", expression: "sleepy", gesture: "rest", requiresGuidance: true, message: "Space is very, very big. I am still buffering the size of it." },
        { id: "pep-talk", category: "feelings", expression: "embarrassed", gesture: "think", message: "I gave myself a pep talk. It was convincing, so I may hear it again." },
        { id: "tiny-hands", category: "playful", expression: "mischievous", gesture: "wave", message: "I am trying not to applaud with my tiny hands. It is going moderately well." },
        { id: "margin-drama", category: "engineering", expression: "thinking", gesture: "inspect", requiresGuidance: true, designOnly: true, constraintsOnly: true, message: "I am giving these margins a careful second look. They are being dramatic." },
        { id: "all-planets", category: "silly", expression: "curious", gesture: "look", message: "Do I have a favorite planet? Yes. All of them." },
    ]);
    const entryHints = {
        "mission-engineering": "Choose your first destination, objective, or spacecraft to file this mission-design note.",
        "orbital-motion": "Choose a destination or a journey profile to discover this orbital-mechanics note.",
        "science-measurement": "Choose a science objective or a payload instrument to discover this field note.",
        "spacecraft-subsystems": "Choose a spacecraft architecture to discover this systems note.",
        "rocket-equation": "Choose a propulsion option to discover this propulsion note.",
        "power-budget": "Choose a power system to discover this power-budget note.",
        "data-link": "Choose a communications system to discover this data-link note.",
        "guidance-control": "Choose a navigation system to discover this guidance note.",
        "thermal-control": "Choose a thermal-control system to discover this temperature note.",
        "systems-integration": "Resolve all modeled review issues to earn this integration discovery.",
    };
    const notebookPages = Object.freeze({
        "mission-engineering": {
            title: "A tiny team in space",
            highlight: "Every spacecraft is a team.",
            explanation: "Power, science tools, radios, guidance, and thermal control each have a job. They work best when their needs fit together.",
            why: "A useful part can still be a poor fit if it needs more power, space, or support than the rest of the mission can provide.",
            example: "NASA's Perseverance rover brings power, mobility, communications, and science instruments together to explore Mars.",
            annotation: "Ask: what does this part need from its teammates?",
            doodle: "TEAMWORK!",
        },
        "orbital-motion": {
            title: "A looping fall",
            highlight: "An orbit is a continuous fall around a world.",
            explanation: "Gravity pulls a spacecraft inward as its forward motion carries it around. The path is usually an ellipse, even if it looks almost round.",
            why: "An orbit helps mission teams plan where a spacecraft can observe, communicate, or meet another vehicle.",
            example: "The International Space Station follows a low-Earth orbit and repeatedly passes over different parts of our planet.",
            annotation: "More forward speed can make a wider path.",
            doodle: "WHEEE, AROUND!",
        },
        "science-measurement": {
            title: "Turn a question into evidence",
            highlight: "Pick a tool that can observe what you want to know.",
            explanation: "A camera, spectrometer, or drill gathers a different kind of evidence. Instruments also need mass, power, data handling, and a way to send results home.",
            why: "Matching tools to the science question makes the mission useful—and helps reveal what the spacecraft must support.",
            example: "Mars rovers use cameras and other instruments to study rocks from several different clues, not just one picture.",
            annotation: "Question first; instrument second.",
            doodle: "LOOK CLOSER!",
        },
        "spacecraft-subsystems": {
            title: "A spacecraft built for its job",
            highlight: "A spacecraft is more than its shape.",
            explanation: "Its platform has to support the equipment, power, pointing, heat control, and data links the mission needs.",
            why: "Choosing a platform early helps you spot limits before the rest of the design depends on it.",
            example: "The Hubble Space Telescope needs power, thermal control, precise pointing, and communications to make and return observations.",
            annotation: "A good fit beats a fancy fit.",
            doodle: "CHECK THE FIT",
        },
        "rocket-equation": {
            title: "Why rocket mass matters",
            highlight: "Changing speed depends on exhaust and mass ratio.",
            explanation: "The ideal rocket equation links a spacecraft's change in speed to how fast its exhaust leaves and how its mass changes as propellant is used.",
            why: "It explains why carrying more propellant can help a maneuver, while the propellant itself also adds mass.",
            example: "Mission planners build a delta-v budget for planned burns. This ideal equation is a learning model, not a prediction of this game's trajectory.",
            annotation: "Real flights also have losses and constraints.",
            equation: "Δv = vₑ ln(m₀ / m_f)",
            equationParts: "vₑ is effective exhaust velocity; m₀ is starting mass; m_f is final mass; ln means natural logarithm.",
            doodle: "FUEL HAS MASS!",
        },
        "power-budget": {
            title: "Share the power",
            highlight: "Power supply must cover system demand.",
            explanation: "Add the modeled loads, then compare them with the power system's output. A positive margin means the catalog figures fit this simplified check.",
            why: "An instrument cannot do useful work if the spacecraft cannot provide its electrical demand when needed.",
            example: "The International Space Station uses solar arrays to generate electricity; batteries help support operations when it is in Earth's shadow.",
            annotation: "This planner leaves out peaks and duty cycles.",
            equation: "MODELED MARGIN = GENERATED POWER − MODELED LOADS",
            equationParts: "A positive result is a simple catalog comparison, not a complete power-system simulation.",
            doodle: "MIND THE MARGIN",
        },
        "data-link": {
            title: "Give science a path home",
            highlight: "A radio link carries commands and discoveries.",
            explanation: "A spacecraft can send its data directly to Earth or pass it through a relay. Rate and available time both matter.",
            why: "Collected science has little value to researchers until the spacecraft can return it.",
            example: "Mars rovers can send data to orbiters, which relay it onward to Earth.",
            annotation: "More rate is not the whole story.",
            equation: "DATA (bits) ≈ RATE (bits/s) × TIME (s)",
            equationParts: "This idealized estimate does not include protocol overhead, interruptions, or link conditions.",
            doodle: "CAN YOU HEAR ME?",
        },
        "guidance-control": {
            title: "Point where you need to look",
            highlight: "Spacecraft must know and control their direction.",
            explanation: "Guidance and attitude systems help aim instruments and antennas and orient a spacecraft for maneuvers.",
            why: "Good pointing helps a spacecraft observe its target, keep a link, and perform a maneuver in the intended direction.",
            example: "The Hubble Space Telescope uses sensors and reaction wheels to point steadily at astronomical targets.",
            annotation: "Navigation and pointing work as a team.",
            doodle: "THIS WAY!",
        },
        "thermal-control": {
            title: "Keep things just right",
            highlight: "Spacecraft equipment has temperature limits.",
            explanation: "Insulation, radiators, heaters, and other thermal controls help manage heat from sunlight, shadows, and onboard equipment.",
            why: "If equipment gets too hot or too cold, it may not operate as intended.",
            example: "Mars rovers use heaters and thermal design to keep sensitive equipment within operating limits during cold conditions.",
            annotation: "Active heat control can use power.",
            doodle: "NOT TOO HOT!",
        },
        "systems-integration": {
            title: "Make the pieces work together",
            highlight: "Mission design is a team sport.",
            explanation: "A strong design connects the science goal, spacecraft, payload, power, communication, route, and environment.",
            why: "Compatibility checks turn hidden conflicts into design choices you can understand and resolve.",
            example: "A Mars rover mission depends on the rover, its science tools, communication relays, and the landing plan working as one system.",
            annotation: "A suitable result is a learning milestone—not flight certification.",
            doodle: "NICE TEAMWORK!",
        },
    });
    const ui = {
        activeStage: null,
        mission: null,
        reaction: null,
        explanation: null,
        manualPositionRatio: null,
        manualPositionTopRatio: null,
        pointer: null,
        lastTapAt: 0,
        educationUntil: 0,
        directInteractionUntil: 0,
        criticalAlertKey: null,
        notebookEntryId: null,
        nicknamePromptDeferred: false,
        bubbleTimer: null,
        movementTimer: null,
        notebookCloseTimer: null,
        ambientTimer: null,
        playfulTimer: null,
        pendingPlayfulState: null,
        touchTimer: null,
        resizeTimer: null,
        lastReactionId: null,
        lastConstraintReviewKey: null,
        screenOverride: null,
        screenOverrideTimer: null,
        lastAmbientSpokenAt: 0,
        lastContextSpokenAt: 0,
        lastGameCommentAt: 0,
        lastMinigameResult: null,
        recentPersonalityIds: [],
        personalityMoodTimer: null,
        personalityMoodToken: null,
    };

    function element(id) {
        return document.getElementById?.(id) || null;
    }

    function promoteCompanionToGameScope() {
        const layer = element("mission-companion-layer");
        const bubble = element("mission-astronaut-bubble");
        const settingsButton = element("mission-companion-settings-open");
        if (!layer || !document.body?.appendChild) return;
        if (bubble && bubble.parentElement !== layer) layer.insertBefore(bubble, layer.firstChild);
        if (settingsButton && settingsButton.parentElement !== layer) layer.appendChild(settingsButton);
        [
            "mission-notebook-dialog",
            "mission-astronaut-name-dialog",
            "mission-companion-settings-dialog",
        ].forEach((id) => {
            const dialog = element(id);
            if (dialog && dialog.parentElement !== document.body) document.body.appendChild(dialog);
        });
        if (layer.parentElement !== document.body) document.body.appendChild(layer);
    }

    function syncCompanionDialogLayer() {
        const layer = element("mission-companion-layer");
        if (!layer || !document.body?.appendChild) return;
        if (element("mission-deployment")?.open) {
            layer.hidden = true;
            window.clearTimeout(ui.ambientTimer);
            const bubble = element("mission-astronaut-bubble");
            if (bubble) bubble.hidden = true;
            return;
        }
        const openDialogs = [...(document.querySelectorAll?.("dialog[open]") || [])];
        const parent = openDialogs[openDialogs.length - 1] || document.body;
        if (layer.parentElement !== parent) parent.appendChild(layer);
    }

    function makeNode(tag, className = "", text) {
        const item = document.createElement(tag);
        if (className) item.className = className;
        if (text !== undefined) item.textContent = text;
        return item;
    }

    function pixelArt(pattern, className, label) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 8 8");
        svg.setAttribute("class", className);
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", label);
        pattern.forEach((row, y) => {
            Array.from(row).forEach((pixel, x) => {
                if (pixel === ".") return;
                const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect.setAttribute("x", String(x));
                rect.setAttribute("y", String(y));
                rect.setAttribute("width", "1");
                rect.setAttribute("height", "1");
                rect.setAttribute("fill", palette[pixel]);
                svg.appendChild(rect);
            });
        });
        return svg;
    }

    function addSvgShape(svg, tag, attributes) {
        const shape = document.createElementNS("http://www.w3.org/2000/svg", tag);
        Object.entries(attributes).forEach(([name, value]) => shape.setAttribute(name, String(value)));
        svg.appendChild(shape);
    }

    function makeDiagram(entry) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 80 38");
        svg.setAttribute("class", "mission-note-diagram");
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", `${entry.category} concept illustration`);
        if (entry.id === "orbital-motion") {
            addSvgShape(svg, "ellipse", { cx: 40, cy: 19, rx: 30, ry: 12, fill: "none", stroke: "var(--mission-trim)", "stroke-dasharray": "2 2" });
            addSvgShape(svg, "circle", { cx: 40, cy: 19, r: 5, fill: "var(--mission-accent)" });
            addSvgShape(svg, "rect", { x: 65, y: 7, width: 5, height: 5, fill: "var(--mission-highlight)" });
            addSvgShape(svg, "circle", { cx: 11, cy: 19, r: 2, fill: "#78b9d1" });
        } else if (entry.id === "rocket-equation") {
            addSvgShape(svg, "path", { d: "M18 28V12h5V7h9v5h5v16h-5v4H23v-4z", fill: "var(--mission-trim)", stroke: "var(--mission-highlight)", "stroke-width": "1" });
            addSvgShape(svg, "path", { d: "M25 25h5M26 30v5m4-5v5M44 19h24m-6-6 6 6-6 6", fill: "none", stroke: "var(--mission-accent)", "stroke-width": "2", "stroke-linecap": "square" });
        } else if (entry.id === "power-budget") {
            addSvgShape(svg, "circle", { cx: 14, cy: 18, r: 7, fill: "var(--mission-accent)" });
            addSvgShape(svg, "path", { d: "M14 5v4m0 18v4M1 18h4m18 0h4M5 9l3 3m12 12 3 3m0-18-3 3M8 24l-3 3", stroke: "var(--mission-highlight)", "stroke-width": "2" });
            addSvgShape(svg, "rect", { x: 38, y: 10, width: 30, height: 17, fill: "none", stroke: "var(--mission-trim)", "stroke-width": "2" });
            addSvgShape(svg, "path", { d: "M49 13l-5 7h6l-2 5 8-9h-6l2-3z", fill: "var(--mission-accent)" });
        } else if (entry.id === "data-link") {
            addSvgShape(svg, "rect", { x: 7, y: 14, width: 10, height: 10, fill: "var(--mission-trim)" });
            addSvgShape(svg, "path", { d: "M22 11q9 8 0 16m5-20q14 12 0 24m5-28q19 16 0 32", fill: "none", stroke: "var(--mission-accent)", "stroke-width": "2" });
            addSvgShape(svg, "path", { d: "M49 19h20m-6-6 6 6-6 6", fill: "none", stroke: "var(--mission-highlight)", "stroke-width": "2" });
        } else if (entry.id === "thermal-control") {
            addSvgShape(svg, "circle", { cx: 14, cy: 19, r: 7, fill: "var(--mission-accent)" });
            addSvgShape(svg, "rect", { x: 39, y: 10, width: 25, height: 18, fill: "var(--mission-trim)", stroke: "var(--mission-highlight)", "stroke-width": "2" });
            addSvgShape(svg, "path", { d: "M44 15h15M44 19h15M44 23h15", stroke: "#78b9d1", "stroke-width": "2" });
        } else if (entry.id === "guidance-control") {
            addSvgShape(svg, "path", { d: "M12 30V8m-5 5 5-5 5 5M12 30h25m-5-5 5 5-5 5", fill: "none", stroke: "var(--mission-trim)", "stroke-width": "2" });
            addSvgShape(svg, "path", { d: "M48 23l8-10 8 10-8-3z", fill: "var(--mission-accent)", stroke: "var(--mission-highlight)", "stroke-width": "1" });
        } else if (entry.id === "science-measurement") {
            addSvgShape(svg, "circle", { cx: 59, cy: 19, r: 11, fill: "#78b9d1" });
            addSvgShape(svg, "path", { d: "M8 14h22v8H8zM30 16h8v4h-8zM16 22v8h8v-8M12 30h16", fill: "var(--mission-trim)", stroke: "var(--mission-highlight)", "stroke-width": "1" });
            addSvgShape(svg, "path", { d: "M59 8v22M48 19h22", stroke: "rgba(255,255,255,.55)", "stroke-width": "1" });
        } else {
            addSvgShape(svg, "rect", { x: 9, y: 10, width: 18, height: 18, fill: "var(--mission-trim)", stroke: "var(--mission-highlight)", "stroke-width": "2" });
            addSvgShape(svg, "rect", { x: 31, y: 6, width: 18, height: 13, fill: "var(--mission-accent)" });
            addSvgShape(svg, "rect", { x: 31, y: 22, width: 18, height: 10, fill: "#78b9d1" });
            addSvgShape(svg, "path", { d: "M27 19h4m18-7h9v14h-9", fill: "none", stroke: "var(--mission-highlight)", "stroke-width": "2" });
        }
        return svg;
    }

    function readComponent(category, id) {
        return id && window.BeyondEarthCatalogs?.get(category, id);
    }

    function getSelection(stageId, mission) {
        if (!mission) return null;
        if (stageId === "destination") {
            return readComponent("destinations", mission.destination?.id);
        }
        if (stageId === "objectives") {
            const id = ui.reaction?.stageId === stageId
                ? ui.reaction.componentId
                : mission.objectives?.primaryId;
            return readComponent("objectives", id);
        }
        if (stageId === "architecture") {
            return readComponent("architectures", mission.spacecraft?.architectureId);
        }
        if (stageId === "instruments") {
            const id = ui.reaction?.stageId === stageId ? ui.reaction.componentId : mission.spacecraft?.scientificInstrumentIds?.[0];
            return readComponent("instruments", id);
        }
        if (selectionCategories[stageId]) {
            const fields = {
                propulsion: "propulsionSystemId",
                power: "powerSystemId",
                communications: "communicationsSystemId",
                navigation: "navigationSystemId",
                thermal: "thermalSystemId",
            };
            const reactedId = ui.reaction?.stageId === stageId ? ui.reaction.componentId : null;
            const id = reactedId || mission.spacecraft?.[fields[stageId]];
            const category = stageId === "navigation" && componentEntries[id] === "thermal-control"
                ? "thermalSystems"
                : selectionCategories[stageId];
            return readComponent(category, id);
        }
        if (stageId === "journey") {
            return { id: mission.planning?.trajectory, name: mission.planning?.trajectory?.replaceAll("-", " ") };
        }
        return null;
    }

    function getContextEntryId(stageId, mission) {
        const selected = getSelection(stageId, mission);
        return componentEntries[selected?.id] || stageEntries[stageId] || "mission-engineering";
    }

    function baseMessage(stageId, mission, selected) {
        if (!mission) return stageMessages.headquarters;
        if (stageId === "destination" && selected) {
            return `${selected.name}—its terrain and environment will shape this trip.`;
        }
        if (stageId === "objectives" && selected) {
            const required = (selected.requiredInstrumentIds || [])
                .map((id) => readComponent("instruments", id)?.name || id)
                .join(", ");
            return required
                ? `${selected.name} needs measurable evidence. Try ${required}.`
                : `${selected.name} turns your science question into a mission activity.`;
        }
        if (stageId === "architecture" && selected) {
            return `${selected.name} supports ${selected.compatibleObjectives?.length || 0} catalogued goals and up to ${selected.maxPayloadMassKg} kg of payload.`;
        }
        if (stageId === "power" && selected) {
            const facts = window.BeyondEarthSpacecraft?.getDesignFacts(mission.spacecraft);
            return `${selected.name} supplies ${selected.powerOutputW ?? "unknown"} W; modeled systems draw ${facts?.powerDrawW ?? "unknown"} W.`;
        }
        if (stageId === "communications" && selected) {
            return `${selected.name} is rated ${selected.dataRateMbps ?? "unknown"} Mbps${selected.relayCapable ? " with relay capability" : ""}. How much data will your science send?`;
        }
        if (stageId === "propulsion" && selected) {
            return `${selected.name} adds ${selected.massKg ?? "unknown"} kg. More mass can mean more propellant.`;
        }
        if (stageId === "navigation" && selected) {
            return componentEntries[selected.id] === "thermal-control"
                ? `${selected.name} helps keep the spacecraft within temperature limits.`
                : `${selected.name} helps your spacecraft navigate and point its instruments.`;
        }
        if (stageId === "instruments" && mission.spacecraft?.scientificInstrumentIds?.length) {
            const names = mission.spacecraft.scientificInstrumentIds
                .map((id) => readComponent("instruments", id)?.name || id)
                .slice(0, 3);
            return `Your payload has ${names.join(", ")}${mission.spacecraft.scientificInstrumentIds.length > 3 ? " and more" : ""}. Each tool gathers different evidence.`;
        }
        if (stageId === "journey" && selected?.name) {
            return `${selected.name} is your current route. The notebook has a quick orbit sketch.`;
        }
        if (stageId === "constraints") {
            const issues = getCompanionIssues(mission);
            if (issues.length) {
                const issue = issues.find((item) => item.severity === "hard") || issues[0];
                return getIssueMessage(issue, mission);
            }
            const facts = window.BeyondEarthSpacecraft?.getDesignFacts(mission.spacecraft);
            const payload = facts?.payloadMassKg === null || facts?.payloadMassKg === undefined
                ? "unknown payload mass"
                : `${facts.payloadMassKg} kg payload`;
            const payloadLimit = facts?.architecture?.maxPayloadMassKg;
            const payloadReadout = Number.isFinite(payloadLimit)
                ? `${payload} of ${payloadLimit} kg`
                : payload;
            const margin = Number.isFinite(facts?.powerOutputW) && Number.isFinite(facts?.powerDrawW)
                ? `${facts.powerOutputW - facts.powerDrawW} W`
                : "unknown";
            const tradeoff = getConstraintTradeoff(mission);
            return `All supported design checks pass. ${payloadReadout}; modeled power margin ${margin}.${tradeoff ? ` Optional fit note: ${tradeoff}` : " Other reserve values are planning inputs, not separate sufficiency checks."}`;
        }
        if (stageId === "review") {
            const review = window.BeyondEarthMissionBuilder?.buildReview(mission);
            if (review?.status === "suitable") return "Everything fits the modeled checks. Nice teamwork!";
            if (review?.status === "incompatible") return "One design check needs attention. Let's see what doesn't fit.";
            if (review?.status === "conditional") return "A few trade-offs remain. Let's look at the warnings.";
        }
        return stageMessages[stageId] || stageMessages.headquarters;
    }

    function getCompanionPreferences() {
        return window.BeyondEarthGameState.getPersistentState().companion.preferences;
    }

    function getReview(mission) {
        const buildReview = window.BeyondEarthMissionBuilder?.buildReview;
        return mission && typeof buildReview === "function" ? buildReview(mission) : null;
    }

    function getCompanionIssues(mission) {
        const review = getReview(mission);
        const issues = review ? [...review.issues] : [];
        const buildPlan = window.BeyondEarthMissionGenerator?.buildMissionPlan;
        if (mission && typeof buildPlan === "function") {
            const plan = buildPlan(mission);
            if (!Array.isArray(plan.warnings)) {
                throw new TypeError("Generated mission plans must include a warnings array.");
            }
            plan.warnings.forEach((message) => {
                issues.push({ severity: "warning", code: "mission-plan-warning", message });
            });
        }
        return issues;
    }

    function getConstraintTradeoff(mission) {
        const objectiveIds = [
            mission.objectives?.primaryId,
            ...(mission.objectives?.secondaryIds || []),
        ].filter(Boolean);
        const choices = [
            ...objectiveIds.map((id) => ["objectives", id]),
            ["architecture", mission.spacecraft?.architectureId],
            ["propulsion", mission.spacecraft?.propulsionSystemId],
            ["power", mission.spacecraft?.powerSystemId],
            ["communications", mission.spacecraft?.communicationsSystemId],
            ...(mission.spacecraft?.scientificInstrumentIds || []).map((id) => ["instruments", id]),
            ["navigation", mission.spacecraft?.navigationSystemId],
            ["navigation", mission.spacecraft?.thermalSystemId],
        ];
        for (const [stageId, choiceId] of choices) {
            const observation = getSpecializedObservation(stageId, choiceId, mission);
            if (observation?.message) return observation.message.replace(/[.!?]\s*$/, "");
        }
        return null;
    }

    function getConstraintReviewKey(mission) {
        const issues = getCompanionIssues(mission);
        const issueKey = issues.map((issue) => `${getIssuePriority(issue)}:${getIssueIdentity(issue)}`).join("|");
        const tradeoff = issues.length ? null : getConstraintTradeoff(mission);
        return `${issueKey || "clear"}:${tradeoff || ""}`;
    }

    function getConstraintFeedback(controlId, mission) {
        const resources = mission.resources || {};
        const destination = readComponent("destinations", mission.destination?.id);
        const selectedObjectives = [
            mission.objectives?.primaryId,
            ...(mission.objectives?.secondaryIds || []),
        ].filter(Boolean).map((id) => readComponent("objectives", id)).filter(Boolean);
        const facts = window.BeyondEarthSpacecraft?.getDesignFacts(mission.spacecraft);
        const value = controlId === "durationDays"
            ? mission.planning?.durationDays ?? 0
            : resources[controlId];
        const fieldMessages = {
            budgetCredits: `Budget allocation is now ${value} credits; the planner doesn't catalogue component prices, so this reserve isn't a cost or approval check.`,
            powerWh: Number.isFinite(facts?.powerOutputW) && Number.isFinite(facts?.powerDrawW)
                ? `Power reserve is now ${value} Wh; ${facts.powerOutputW} W output against ${facts.powerDrawW} W draw still determines the installed power margin.`
                : `Power reserve is now ${value} Wh; installed power output or demand is unknown, so the power margin can't be checked.`,
            fuelKg: `Propellant reserve is now ${value} kg; the planner doesn't calculate route fuel consumption or use this reserve as payload mass.`,
            dataStorageMb: `Data archive capacity is now ${value} MB for ${selectedObjectives.map((objective) => objective.name).join(", ") || "your science"}; no data-volume estimate is modeled.`,
            durationDays: destination
                ? `Mission duration is now ${value} days; ${destination.name}'s catalog travel estimate is ${destination.travelTimeDays} days, but the route isn't simulated.`
                : `Mission duration is now ${value} days; choose a destination to compare its catalog travel estimate. The route isn't simulated.`,
        };
        const entryIds = {
            budgetCredits: "mission-engineering",
            powerWh: "power-budget",
            fuelKg: "rocket-equation",
            dataStorageMb: "science-measurement",
            durationDays: "orbital-motion",
        };
        const issueContext = getIssueForStage("constraints", mission);
        const tradeoff = issueContext ? null : getConstraintTradeoff(mission);
        const note = issueContext
            ? ` ${issueContext.issue.severity === "hard" ? "Critical design check" : "Design warning"} remains: ${issueContext.message.replace(/[.!?]\s*$/, "")}`
            : tradeoff
                ? ` Supported design checks pass; optional fit note: ${tradeoff}`
                : " All currently modeled design checks pass.";
        return {
            message: `${fieldMessages[controlId] || "Constraint updated."}${note}`,
            priority: issueContext?.priority || "educational",
            expression: issueContext?.priority === "critical"
                ? "concerned"
                : issueContext?.priority === "warning"
                    ? "thinking"
                    : tradeoff
                        ? "thinking"
                        : "explaining",
            entryId: issueContext?.entryId || entryIds[controlId] || "mission-engineering",
            issue: issueContext?.issue || null,
            controlId,
        };
    }

    function getSpecializedObservation(stageId, choiceId, mission) {
        const assess = window.BeyondEarthMissionsTab?.getSpecializedChoiceObservation;
        return typeof assess === "function" ? assess(stageId, choiceId, mission) : null;
    }

    function getComponentStage(componentId) {
        if (!componentId) return null;
        const catalogs = window.BeyondEarthCatalogs;
        if (!catalogs) return null;
        for (const category of Object.keys(componentStageByCategory)) {
            if (catalogs.get(category, componentId)) return componentStageByCategory[category];
        }
        return null;
    }

    function getIssueStage(issue) {
        const guidance = issueGuidance[issue?.code];
        if (guidance?.stageId) return guidance.stageId;
        if (issue?.category && componentStageByCategory[issue.category]) {
            return componentStageByCategory[issue.category];
        }
        return getComponentStage(issue?.componentId)
            || getComponentStage(issue?.conflictingComponentId)
            || "review";
    }

    function getIssuePriority(issue) {
        return issue?.severity === "hard" ? "critical" : "warning";
    }

    function getIssueMessage(issue, mission) {
        if (issue?.code === "mission-plan-warning") {
            return `${String(issue.message || "").replace(/[.!?]\s*$/, "")}; review Journey planning.`;
        }
        if (issue?.code === "architecture-incompatible" && issue.componentId) {
            const observation = getSpecializedObservation(getIssueStage(issue), issue.componentId, mission);
            if (observation?.kind === "architecture-component-fit") return observation.message;
        }
        if ([
            "communications-band-unsupported",
            "communications-data-rate-unknown",
            "communications-data-rate-insufficient",
            "relay-capability-missing",
        ].includes(issue?.code)) {
            const communicationsId = mission?.spacecraft?.communicationsSystemId;
            const observation = getSpecializedObservation("communications", communicationsId, mission);
            if (observation?.kind === "communications-requirements") return observation.message;
        }
        return issueGuidance[issue?.code]?.message
            || "A design check needs attention. Review the design checks for details.";
    }

    function getIssueIdentity(issue) {
        return [
            issue.code,
            issue.componentId,
            issue.conflictingComponentId,
            issue.objectiveId,
            issue.instrumentId,
            issue.category,
            issue.slot,
            issue.message,
        ].filter(Boolean).join(":");
    }

    function getIssueForStage(stageId, mission) {
        const issues = getCompanionIssues(mission);
        const candidates = ["review", "constraints"].includes(stageId)
            ? issues
            : issues.filter((issue) => getIssueStage(issue) === stageId);
        const reactionIssue = ui.reaction?.stageId === stageId && ui.reaction.issue
            ? issues.find((issue) => getIssueIdentity(issue) === getIssueIdentity(ui.reaction.issue))
            : null;
        const issue = (["review", "constraints"].includes(stageId) ? candidates : issues)
            .find((candidate) => candidate.severity === "hard")
            || candidates[0];
        const activeIssue = issue || reactionIssue;
        if (!activeIssue) return null;
        const issueStage = getIssueStage(activeIssue);
        return {
            issue: activeIssue,
            stageId: issueStage,
            entryId: stageEntry[issueStage] || stageEntry.review,
            priority: getIssuePriority(activeIssue),
            message: getIssueMessage(activeIssue, mission),
        };
    }

    const globalContextStages = new Set([
        "dashboard",
        "approval",
        "deployment",
        "mission-play",
        "minigame",
        "results",
        "profile",
        "unlock",
    ]);

    function currentSceneId() {
        return window.BeyondEarthScenes?.getCurrentScene?.()
            || document.querySelector?.(".scene.active")?.id
            || null;
    }

    function activeMissionForContext(mission) {
        return mission
            || window.BeyondEarthMissionManager?.getActiveMission?.()
            || ui.mission
            || null;
    }

    function getSceneStage(sceneId = currentSceneId(), fallback = ui.activeStage) {
        if (sceneId === "cockpit-scene") return "dashboard";
        if (sceneId === "personnel-scene") return "profile";
        if (sceneId === "mission-play-scene") return "mission-play";
        if (sceneId === "missions-scene") {
            const activeGame = window.BeyondEarthMinigames?.getActive?.();
            if (activeGame && ["starting", "running", "paused"].includes(activeGame.status)) {
                return "minigame";
            }
            return fallback && !globalContextStages.has(fallback) ? fallback : "headquarters";
        }
        return fallback || "dashboard";
    }

    function getRenderStage(fallback) {
        const sceneId = currentSceneId();
        if (ui.screenOverride && ui.screenOverride.sceneId === sceneId
            && ui.screenOverride.expiresAt > Date.now()) {
            return ui.screenOverride.stageId;
        }
        return getSceneStage(sceneId, fallback);
    }

    function getGlobalCompanionContext(stageId, mission) {
        const activeMission = activeMissionForContext(mission);
        const snapshot = window.BeyondEarthGameState?.getSnapshot?.();
        const progression = snapshot?.progression || {};
        const reaction = ui.reaction?.stageId === stageId ? ui.reaction : null;
        const nickname = getNickname();
        const prefix = nickname ? `${nickname}, ` : "";
        let message = "I'm right here for the next step of our mission.";
        let expression = "idle";
        let entryId = "mission-engineering";

        if (stageId === "dashboard") {
            const completedCount = progression.completedMissionIds?.length || 0;
            if (activeMission?.status === "approved") {
                message = `${prefix}${activeMission.name} is approved and ready for launch.`;
                expression = "celebrating";
            } else if (activeMission && ["active", "paused"].includes(activeMission.status)) {
                message = `${prefix}${activeMission.name} is ${activeMission.status}; use the launch console to continue the flight.`;
                expression = activeMission.status === "paused" ? "thinking" : "excited";
            } else {
                message = `${prefix}welcome to Mission Control. ${completedCount ? `You've completed ${completedCount} mission${completedCount === 1 ? "" : "s"}. ` : ""}Ready to explore?`;
                expression = completedCount ? "excited" : "idle";
            }
        } else if (stageId === "approval") {
            const destination = readComponent("destinations", activeMission?.destination?.id);
            message = activeMission
                ? `Mission file ready: ${activeMission.name}${destination?.name ? ` to ${destination.name}` : ""}. Review the design, then approve when you're ready.`
                : "Let's review the mission file before approval.";
            expression = "thinking";
            entryId = "systems-integration";
        } else if (stageId === "deployment") {
            const destination = readComponent("destinations", activeMission?.destination?.id);
            message = activeMission
                ? `${activeMission.name} is deploying to ${destination?.name || "its destination"}. Next, we'll work through the mission activities together.`
                : "Deployment is underway. I'll be here for the mission activities.";
            expression = "excited";
            entryId = "orbital-motion";
        } else if (stageId === "mission-play") {
            const destination = readComponent("destinations", activeMission?.destination?.id);
            const activity = activeMission?.currentStage;
            message = activeMission
                ? `${activeMission.name} is underway at ${destination?.name || "its destination"}${activity ? `; next up is ${activity.replaceAll("-", " ")}` : ""}.`
                : "Mission activity is getting ready.";
            expression = "excited";
            entryId = "orbital-motion";
        } else if (stageId === "minigame") {
            const activeGame = window.BeyondEarthMinigames?.getActive?.();
            const gameName = activeGame?.name || activeGame?.id?.replaceAll("-", " ") || "mission activity";
            message = activeGame?.id === "spectrum-detective"
                ? "Compare the unknown spectrum with the references. Look for a pattern across several bands before deciding."
                : `${gameName}: explore the controls, watch what changes, and use the evidence before you decide.`;
            expression = "thinking";
            entryId = "science-measurement";
        } else if (stageId === "results") {
            const result = ui.lastMinigameResult;
            if (result) {
                const explanation = result.explanation || "";
                message = result.status === "success"
                    ? `Great discovery! ${explanation || "Your analysis matched the mission evidence."}`
                    : result.status === "partial"
                        ? `Good start. ${explanation || "Review the evidence and try another comparison next time."}`
                        : result.status === "aborted"
                            ? "Activity saved as stopped. You can return to the mission when you're ready."
                            : `That comparison didn't match this sample. ${explanation || "Next time, compare more than one feature before submitting."}`;
                entryId = "science-measurement";
            } else {
                message = activeMission
                    ? `${activeMission.name} is complete. Its results are part of the flight record.`
                    : "Results saved. Every mission teaches us something new.";
                entryId = "systems-integration";
            }
            expression = result?.status === "success" ? "celebrating" : "thinking";
        } else if (stageId === "profile") {
            message = nickname
                ? `${prefix}your crew profile keeps your callsign and mission look together.`
                : "Welcome to the crew profile. You can choose your callsign and look here.";
            entryId = "mission-engineering";
        }

        return {
            expression: reaction?.expression || expression,
            message: reaction?.message || message,
            entryId: reaction?.entryId || entryId,
            priority: reaction?.priority || "educational",
            issue: reaction?.issue || null,
            issueIdentity: null,
            selectedId: null,
            selectedName: null,
        };
    }

    function getCompanionContext(stageId, mission) {
        if (globalContextStages.has(stageId)) {
            return getGlobalCompanionContext(stageId, mission);
        }
        const selected = getSelection(stageId, mission);
        const entryId = getContextEntryId(stageId, mission);
        const reaction = ui.reaction?.stageId === stageId ? ui.reaction : null;
        const review = stageId === "review" ? getReview(mission) : null;
        const issueContext = getIssueForStage(stageId, mission);
        const selectedIsIncompatible = Boolean(
            selected && mission && changedComponentIsIncompatible(stageId, selected.id, mission),
        );
        const critical = issueContext?.priority === "critical"
            || reaction?.priority === "critical"
            || selectedIsIncompatible
            || review?.status === "incompatible";
        let expression = "idle";
        if (critical) {
            expression = "concerned";
        } else if (issueContext?.priority === "warning") {
            expression = "thinking";
        } else if (reaction) {
            expression = reaction.expression;
        } else if (review) {
            expression = review.status === "suitable" ? "celebrating" : "thinking";
        } else if (["objectives", "architecture", "journey", "constraints"].includes(stageId)) {
            expression = "thinking";
        } else if (["propulsion", "power", "communications", "navigation"].includes(stageId)) {
            expression = "explaining";
        } else if (selected) {
            expression = "excited";
        }
        const constraintReaction = stageId === "constraints"
            && reaction?.controlId
            ? reaction
            : null;
        return {
            expression,
            message: constraintReaction
                ? constraintReaction.message
                : reaction?.expression === "celebrating" && issueContext
                    ? `${reaction.message.replace(/[.!?]\s*$/, "")}; next, ${issueContext.message.replace(/[.!?]\s*$/, "")}.`
                : issueContext
                ? issueContext.message
                : selectedIsIncompatible && selected
                ? `${selected.name} may not fit this spacecraft. The design check has the details.`
                : reaction?.message || baseMessage(stageId, mission, selected),
            entryId: issueContext?.entryId || reaction?.entryId || entryId,
            selectedId: selected?.id || null,
            selectedName: selected?.name || null,
            issue: issueContext?.issue || reaction?.issue || null,
            issueIdentity: issueContext ? getIssueIdentity(issueContext.issue) : null,
            priority: issueContext?.priority
                || (critical ? "critical" : "educational"),
        };
    }

    function getNickname() {
        return window.BeyondEarthGameState.getPersistentState().companion?.nickname || "";
    }

    function getCompanionTarget(stageId, mission) {
        const content = element("mission-stage-content");
        if (!content) return null;
        if (stageId === "constraints" && ui.reaction?.controlId) {
            const control = content.querySelector(
                `[data-constraint-control="${ui.reaction.controlId}"]`
            );
            if (control) return control.closest(".mission-resource-control") || control;
        }
        const selectors = {
            headquarters: ".mission-headquarters-card",
            destination: ".mission-destination-detail, .mission-destination-map",
            objectives: ".mission-objective-grid",
            architecture: ".mission-architecture-grid",
            propulsion: ".mission-choice-group",
            power: ".mission-choice-group",
            communications: ".mission-choice-group",
            navigation: ".mission-choice-group",
            instruments: ".mission-instrument-list",
            journey: ".mission-journey-grid",
            constraints: ".mission-constraints",
            review: ".mission-review-issues, .mission-review-summary",
        };
        const selector = selectors[stageId];
        if (!selector) return content;
        const matches = content.querySelectorAll(selector);
        if (!matches.length) return content;
        const target = stageId === "navigation"
            && componentEntries[getSelection(stageId, mission)?.id] === "thermal-control"
            ? matches[1] || matches[0]
            : matches[0];
        return target.querySelector?.(".mission-choice-card.is-selected") || target;
    }

    function getPositionBounds(layer, stageWrap) {
        const layerRect = layer.getBoundingClientRect?.();
        const stageRect = stageWrap?.getBoundingClientRect?.() || layerRect;
        if (!layerRect || !layer.clientWidth || !layer.clientHeight) return null;
        const width = 46;
        const height = 54;
        const activeGame = window.BeyondEarthMinigames?.getActive?.();
        const inMinigame = activeGame && ["starting", "running", "paused"].includes(activeGame.status);
        const minLeft = 8;
        const maxLeft = Math.max(minLeft, layer.clientWidth - width - 8);
        const minTop = inMinigame ? Math.max(8, layer.clientHeight - height - 8) : 8;
        const maxTop = inMinigame
            ? minTop
            : Math.max(minTop, layer.clientHeight - height - 12);
        return {
            layerRect,
            stageRect,
            minLeft,
            maxLeft,
            minTop,
            maxTop,
            top: maxTop,
            width,
            height,
        };
    }

    function positionBubble() {
        const bubble = element("mission-astronaut-bubble");
        const companion = element("mission-astronaut");
        const layer = element("mission-companion-layer");
        if (!bubble || bubble.hidden || !companion || !layer) return;
        const bounds = getPositionBounds(layer, null);
        if (!bounds) return;
        const companionLeft = Number.parseFloat(companion.style.left) || bounds.minLeft;
        const companionTop = Number.parseFloat(companion.style.top) || bounds.maxTop;
        const bubbleWidth = Math.min(340, Math.max(180, bounds.layerRect.width - 20));
        const bubbleHeight = bubble.getBoundingClientRect?.().height || 84;
        const left = Math.max(10, Math.min(
            bounds.layerRect.width - bubbleWidth - 10,
            companionLeft - 3,
        ));
        let top = companionTop - bubbleHeight - 8;
        if (top < 8) top = companionTop + bounds.height + 8;
        top = Math.max(8, Math.min(bounds.layerRect.height - bubbleHeight - 8, top));
        bubble.style.left = `${left}px`;
        bubble.style.top = `${top}px`;
    }

    function positionAstronaut(stageId, mission) {
        const layer = element("mission-companion-layer");
        const companion = element("mission-astronaut");
        const stageWrap = currentSceneId() === "missions-scene" ? element("mission-stage-wrap") : null;
        if (!layer || !companion || layer.hidden) return;
        const target = stageWrap ? getCompanionTarget(stageId, mission) : null;
        const targetRect = target?.getBoundingClientRect?.();
        const bounds = getPositionBounds(layer, stageWrap);
        if (!bounds) return;
        const preferences = getCompanionPreferences();
        const center = targetRect ? targetRect.left + targetRect.width / 2 : 0;
        let left = Number.parseFloat(companion.style.left);
        if (ui.manualPositionRatio !== null) {
            left = bounds.minLeft + ui.manualPositionRatio * (bounds.maxLeft - bounds.minLeft);
        } else if (preferences.followPlayerInteractions && targetRect) {
            const targetLeft = targetRect.left - bounds.layerRect.left;
            const targetRight = targetRect.right - bounds.layerRect.left;
            const targetIsRight = center >= bounds.layerRect.left + bounds.layerRect.width / 2;
            let targetX = targetIsRight ? targetLeft - bounds.width - 6 : targetRight + 6;
            if (targetX < bounds.minLeft || targetX > bounds.maxLeft) {
                targetX = targetIsRight ? targetRight + 6 : targetLeft - bounds.width - 6;
            }
            left = targetX;
        } else if (!Number.isFinite(left)) {
            left = bounds.minLeft;
        }
        left = Math.max(bounds.minLeft, Math.min(bounds.maxLeft, left));
        const previousLeft = Number.parseFloat(companion.style.left);
        let top = ui.manualPositionTopRatio === null
            ? bounds.top
            : bounds.minTop + ui.manualPositionTopRatio * (bounds.maxTop - bounds.minTop);
        if (ui.manualPositionTopRatio === null && ui.manualPositionRatio === null
            && preferences.followPlayerInteractions && targetRect) {
            top = targetRect.top + targetRect.height / 2 - bounds.height / 2;
        } else if (ui.manualPositionTopRatio === null && Number.isFinite(Number.parseFloat(companion.style.top))) {
            top = Number.parseFloat(companion.style.top);
        }
        top = Math.max(bounds.minTop, Math.min(bounds.maxTop, top));
        const previousTop = Number.parseFloat(companion.style.top);

        companion.style.left = `${left}px`;
        companion.style.top = `${top}px`;
        companion.style.bottom = "auto";
        if (preferences.followPlayerInteractions && targetRect && ui.manualPositionRatio === null) {
            companion.dataset.facing = center > bounds.layerRect.left + left + bounds.width / 2 ? "right" : "left";
        }
        const moving = preferences.followPlayerInteractions
            && ui.manualPositionRatio === null
            && ((Number.isFinite(previousLeft) && Math.abs(previousLeft - left) > 3)
                || (Number.isFinite(previousTop) && Math.abs(previousTop - top) > 3));
        companion.dataset.moving = String(moving);
        companion.dataset.gesture = moving ? "pointing" : "idle";
        const settingsButton = element("mission-companion-settings-open");
        if (settingsButton) {
            if (getCompanionPreferences().visible) {
                settingsButton.style.left = `${Math.max(8, Math.min(bounds.maxLeft, left + bounds.width + 4))}px`;
                settingsButton.style.top = `${Math.max(8, Math.min(bounds.maxTop, top + 8))}px`;
                settingsButton.style.right = "auto";
                settingsButton.style.bottom = "auto";
            } else {
                settingsButton.style.left = "auto";
                settingsButton.style.top = "auto";
                settingsButton.style.right = "16px";
                settingsButton.style.bottom = "18px";
            }
        }
        positionBubble();
        window.clearTimeout(ui.movementTimer);
        if (moving) {
            ui.movementTimer = window.setTimeout(() => {
                companion.dataset.moving = "false";
                companion.dataset.gesture = "idle";
                playPendingState();
            }, 720);
        } else {
            playPendingState();
        }
    }

    function scheduleAstronautPosition() {
        const reposition = () => {
            if (ui.activeStage) positionAstronaut(ui.activeStage, ui.mission);
        };
        if (typeof window.requestAnimationFrame === "function") {
            window.requestAnimationFrame(reposition);
        } else {
            window.setTimeout(reposition, 0);
        }
    }

    function setPlayfulState(state, duration = 950) {
        const companion = element("mission-astronaut");
        if (!companion) return;
        const enabled = getCompanionPreferences().playfulReactions;
        companion.dataset.playfulEnabled = String(enabled);
        if (enabled && companion.dataset.moving === "true" && state !== "idle") {
            ui.pendingPlayfulState = { state, duration };
            return;
        }
        companion.dataset.playful = enabled ? state : "idle";
        if (!enabled) ui.pendingPlayfulState = null;
        window.clearTimeout(ui.playfulTimer);
        if (enabled && duration > 0) {
            ui.playfulTimer = window.setTimeout(() => {
                companion.dataset.playful = "idle";
            }, duration);
        }
    }

    function playPendingState() {
        const pending = ui.pendingPlayfulState;
        if (!pending) return false;
        ui.pendingPlayfulState = null;
        setPlayfulState(pending.state, pending.duration);
        return true;
    }

    function moveAstronautToRatio(ratio, topRatio = null) {
        ui.manualPositionRatio = Math.max(0, Math.min(1, ratio));
        if (topRatio !== null) {
            ui.manualPositionTopRatio = Math.max(0, Math.min(1, topRatio));
        }
        positionAstronaut(ui.activeStage, ui.mission);
    }

    function ambientBehaviorIsBlocked() {
        const bubble = element("mission-astronaut-bubble");
        const context = ui.activeStage ? getCompanionContext(ui.activeStage, ui.mission) : null;
        return Boolean(
            ui.pointer
            || (bubble && !bubble.hidden)
            || element("mission-astronaut-name-dialog")?.open
            || element("mission-companion-settings-dialog")?.open
            || element("mission-notebook-dialog")?.open
            || context?.priority === "critical"
            || context?.priority === "warning"
            || Date.now() < ui.educationUntil
            || Date.now() < ui.directInteractionUntil,
        );
    }

    function isCompanionScene(sceneId = currentSceneId()) {
        return ["cockpit-scene", "missions-scene", "mission-play-scene", "personnel-scene"].includes(sceneId);
    }

    function getAmbientDelay(frequency) {
        const baseDelay = {
            quiet: 28000,
            balanced: 17000,
            chatty: 10500,
        }[frequency] || 17000;
        return baseDelay + Math.random() * baseDelay * 0.45;
    }

    function choosePersonalityMoment(stageId, preferences) {
        let candidates = personalityMoments.filter((moment) =>
            (!moment.requiresGuidance || preferences.educationalGuidance)
            && (!moment.designOnly || designStages.has(stageId))
            && (!moment.constraintsOnly || stageId === "constraints"));
        if (stageId === "constraints" && preferences.educationalGuidance) {
            const focusedMoments = candidates.filter((moment) =>
                moment.category === "engineering" || moment.category === "silly");
            if (focusedMoments.length) candidates = focusedMoments;
        } else if (designStages.has(stageId) && preferences.educationalGuidance && Math.random() < 0.45) {
            const engineeringMoments = candidates.filter((moment) => moment.category === "engineering");
            if (engineeringMoments.length) candidates = engineeringMoments;
        }

        const freshCandidates = candidates.filter((moment) =>
            !ui.recentPersonalityIds.includes(moment.id));
        const options = freshCandidates.length ? freshCandidates : candidates;
        return options[Math.floor(Math.random() * options.length)] || null;
    }

    function clearPersonalityMood() {
        window.clearTimeout(ui.personalityMoodTimer);
        ui.personalityMoodTimer = null;
        ui.personalityMoodToken = null;
    }

    function showPersonalityMoment(stageId, preferences) {
        const moment = choosePersonalityMoment(stageId, preferences);
        if (!moment) return false;
        ui.recentPersonalityIds.push(moment.id);
        if (ui.recentPersonalityIds.length > 4) ui.recentPersonalityIds.shift();
        const companion = element("mission-astronaut");
        if (companion) companion.dataset.expression = moment.expression;
        const token = `${moment.id}:${Date.now()}:${Math.random()}`;
        ui.personalityMoodToken = token;
        window.clearTimeout(ui.personalityMoodTimer);
        ui.personalityMoodTimer = window.setTimeout(() => {
            if (ui.personalityMoodToken !== token || !companion) return;
            ui.personalityMoodToken = null;
            companion.dataset.expression = ui.activeStage
                ? getCompanionContext(ui.activeStage, ui.mission).expression
                : "idle";
        }, 3300);
        setPlayfulState(moment.gesture, 2500);
        const priority = moment.requiresGuidance ? "ambient" : "playful";
        showBubble(moment.message, null, 3600, priority);
        return true;
    }

    function scheduleAmbientBehavior(delay) {
        const layer = element("mission-companion-layer");
        if (!layer) return;
        window.clearTimeout(ui.ambientTimer);
        const preferences = getCompanionPreferences();
        const canRoam = preferences.freeRoaming
            && !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        const canSpeak = preferences.visible
            && (preferences.educationalGuidance || preferences.playfulReactions);
        if ((!canRoam && !canSpeak) || !preferences.visible || !isCompanionScene()) return;
        const activeGame = window.BeyondEarthMinigames?.getActive?.();
        if (activeGame && ["starting", "running", "paused"].includes(activeGame.status)) return;
        const nextDelay = Number.isFinite(delay) ? delay : getAmbientDelay(preferences.speechBubbleFrequency);
        ui.ambientTimer = window.setTimeout(() => {
            const currentPreferences = getCompanionPreferences();
            if (!currentPreferences.visible || !isCompanionScene()) return;
            const mayRoam = currentPreferences.freeRoaming
                && !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
            if (ambientBehaviorIsBlocked()) {
                scheduleAmbientBehavior(3500);
                return;
            }
            if (mayRoam && Math.random() < 0.38) {
                moveAstronautToRatio(0.08 + Math.random() * 0.84, 0.68 + Math.random() * 0.2);
                const companion = element("mission-astronaut");
                if (companion) {
                    companion.dataset.moving = String(currentPreferences.playfulReactions);
                    window.clearTimeout(ui.movementTimer);
                    ui.movementTimer = window.setTimeout(() => {
                        companion.dataset.moving = "false";
                        if (!playPendingState() && currentPreferences.playfulReactions) {
                            setPlayfulState("look", 1200);
                        }
                    }, 720);
                }
            }
            if (currentPreferences.playfulReactions && Math.random() < 0.46) {
                const activities = ["look", "inspect", "rest", "think", "wave", "bounce"];
                setPlayfulState(activities[Math.floor(Math.random() * activities.length)], 1800);
            }
            const commentChance = {
                quiet: 0.18,
                balanced: 0.38,
                chatty: 0.58,
            }[currentPreferences.speechBubbleFrequency] || 0.38;
            const minimumGap = {
                quiet: 28000,
                balanced: 17000,
                chatty: 10500,
            }[currentPreferences.speechBubbleFrequency] || 17000;
            if ((currentPreferences.educationalGuidance || currentPreferences.playfulReactions)
                && Math.random() < commentChance
                && Date.now() - ui.lastAmbientSpokenAt >= minimumGap) {
                const context = getCompanionContext(ui.activeStage, ui.mission);
                if (context.priority !== "critical" && context.priority !== "warning") {
                    const preferGuidance = currentPreferences.educationalGuidance
                        && (!currentPreferences.playfulReactions || Math.random() < 0.4);
                    let spoke = false;
                    if (preferGuidance) {
                        showBubble(context.message, context.entryId, 3600, "ambient");
                        spoke = true;
                    } else if (currentPreferences.playfulReactions) {
                        spoke = showPersonalityMoment(ui.activeStage, currentPreferences);
                    }
                    if (spoke) ui.lastAmbientSpokenAt = Date.now();
                }
            }
            scheduleAmbientBehavior();
        }, nextDelay);
    }

    function getStageChanges(stageId, previous, current) {
        const before = previous || {};
        const after = current || {};
        const beforeSpacecraft = before.spacecraft || {};
        const afterSpacecraft = after.spacecraft || {};
        const beforePlanning = before.planning || {};
        const afterPlanning = after.planning || {};
        if (stageId === "destination") {
            return before.destination?.id !== after.destination?.id && after.destination?.id
                ? [after.destination.id]
                : [];
        }
        if (stageId === "objectives") {
            const oldIds = new Set([before.objectives?.primaryId, ...(before.objectives?.secondaryIds || [])].filter(Boolean));
            return [after.objectives?.primaryId, ...(after.objectives?.secondaryIds || [])]
                .filter((id) => id && !oldIds.has(id));
        }
        if (stageId === "architecture") {
            return beforeSpacecraft.architectureId !== afterSpacecraft.architectureId && afterSpacecraft.architectureId
                ? [afterSpacecraft.architectureId]
                : [];
        }
        const fields = {
            propulsion: ["propulsionSystemId"],
            power: ["powerSystemId"],
            communications: ["communicationsSystemId"],
            navigation: ["navigationSystemId", "thermalSystemId"],
            instruments: ["scientificInstrumentIds"],
        };
        if (fields[stageId]) {
            return fields[stageId].flatMap((field) => {
                const oldValue = beforeSpacecraft[field];
                const newValue = afterSpacecraft[field];
                if (field === "scientificInstrumentIds") {
                    const oldIds = new Set(oldValue || []);
                    return (newValue || []).filter((id) => !oldIds.has(id));
                }
                return oldValue !== newValue && newValue ? [newValue] : [];
            });
        }
        if (stageId === "journey") {
            return ["launchConfiguration", "trajectory"]
                .filter((field) => beforePlanning[field] !== afterPlanning[field] && afterPlanning[field])
                .map((field) => afterPlanning[field]);
        }
        if (stageId === "constraints") {
            const changedResources = ["budgetCredits", "powerWh", "fuelKg", "dataStorageMb"]
                .filter((field) => before.resources?.[field] !== after.resources?.[field]);
            if (beforePlanning.durationDays !== afterPlanning.durationDays) {
                changedResources.push("durationDays");
            }
            return changedResources;
        }
        return [];
    }

    function getChangedSelection(stageId, id) {
        if (stageId === "destination") return readComponent("destinations", id);
        if (stageId === "objectives") return readComponent("objectives", id);
        if (stageId === "architecture") return readComponent("architectures", id);
        if (stageId === "instruments") return readComponent("instruments", id);
        if (stageId === "journey") return { id, name: id.replaceAll("-", " ") };
        if (selectionCategories[stageId]) {
            const category = stageId === "navigation" && componentEntries[id] === "thermal-control"
                ? "thermalSystems"
                : selectionCategories[stageId];
            return readComponent(category, id);
        }
        return null;
    }

    function getEntryForChange(stageId, changedId) {
        if (stageId === "destination" || stageId === "journey") return "orbital-motion";
        if (stageId === "objectives" || stageId === "instruments") return "science-measurement";
        if (stageId === "architecture") return "spacecraft-subsystems";
        if (stageId === "propulsion") return componentEntries[changedId] || "rocket-equation";
        if (stageId === "power") return "power-budget";
        if (stageId === "communications") return "data-link";
        if (stageId === "navigation") return componentEntries[changedId] || "guidance-control";
        return null;
    }

    function changedComponentIsIncompatible(stageId, changedId, mission) {
        if (!selectionCategories[stageId] && stageId !== "navigation") return false;
        const category = stageId === "navigation"
            ? (componentEntries[changedId] === "thermal-control" ? "thermalSystems" : "navigationSystems")
            : selectionCategories[stageId];
        const component = readComponent(category, changedId);
        const architectureId = mission.spacecraft?.architectureId;
        if (!component || !architectureId || !Array.isArray(component.compatibleArchitectureIds)) return false;
        return component.compatibleArchitectureIds.length > 0
            && !component.compatibleArchitectureIds.includes(architectureId);
    }

    function compareIssueLists(previous, current) {
        const previousIssues = getCompanionIssues(previous);
        const currentIssues = getCompanionIssues(current);
        const previousKeys = new Set(previousIssues.map(getIssueIdentity));
        const currentKeys = new Set(currentIssues.map(getIssueIdentity));
        return {
            added: currentIssues.filter((issue) => !previousKeys.has(getIssueIdentity(issue))),
            resolved: previousIssues.filter((issue) => !currentKeys.has(getIssueIdentity(issue))),
            previousIssues,
            currentIssues,
        };
    }

    function handleMissionUpdate(stageId, previous, current) {
        const changes = getStageChanges(stageId, previous, current);
        if (!changes.length) {
            ui.reaction = null;
            ui.criticalAlertKey = null;
            return [];
        }
        const specializedObservation = changes
            .map((id) => getSpecializedObservation(stageId, id, current))
            .find(Boolean);
        const issueChanges = compareIssueLists(previous, current);
        if (stageId === "constraints") {
            const controlId = changes[0];
            const feedback = getConstraintFeedback(controlId, current);
            const value = controlId === "durationDays"
                ? current.planning?.durationDays ?? 0
                : current.resources?.[controlId];
            ui.educationUntil = Date.now() + 3200;
            ui.reaction = {
                id: `constraint:${controlId}:${value}`,
                stageId,
                priority: feedback.priority,
                expression: feedback.expression,
                message: feedback.message,
                entryId: feedback.entryId,
                controlId: feedback.controlId,
                issue: feedback.issue,
            };
            return [];
        }
        const addedIssue = issueChanges.added.find((issue) => issue.severity === "hard")
            || issueChanges.added[0];
        if (addedIssue) {
            const issueStage = getIssueStage(addedIssue);
            ui.educationUntil = Date.now() + 3200;
            ui.reaction = {
                id: getIssueIdentity(addedIssue),
                stageId,
                issue: addedIssue,
                priority: getIssuePriority(addedIssue),
                expression: "concerned",
                message: getIssueMessage(addedIssue, current),
            };
            ui.reaction.entryId = stageEntry[issueStage] || stageEntry.review;
            return [];
        }

        if (issueChanges.resolved.length) {
            const wasAllClear = issueChanges.previousIssues.length > 0
                && issueChanges.currentIssues.length === 0;
            const resolvedStage = getIssueStage(issueChanges.resolved[0]);
            const nextIssue = issueChanges.currentIssues.find((issue) => issue.severity === "hard")
                || issueChanges.currentIssues[0]
                || null;
            ui.educationUntil = Date.now() + 3200;
            ui.reaction = {
                id: `resolved:${getIssueIdentity(issueChanges.resolved[0])}`,
                stageId,
                priority: nextIssue ? getIssuePriority(nextIssue) : "educational",
                expression: nextIssue?.severity === "hard"
                    ? "concerned"
                    : nextIssue
                        ? "thinking"
                        : "celebrating",
                message: wasAllClear
                    ? "All modeled design checks are clear. Great systems teamwork!"
                    : `You resolved a ${resolvedStage.replaceAll("-", " ")} check. Nice engineering!${nextIssue ? ` Next, ${getIssueMessage(nextIssue, current)}` : ""}`,
                issue: nextIssue,
                entryId: nextIssue
                    ? stageEntry[getIssueStage(nextIssue)] || stageEntry.review
                    : stageEntry[resolvedStage] || stageEntry.review,
            };
            return [];
        }

        const entryId = getEntryForChange(stageId, changes[0]);
        const entryIds = entryId ? [entryId] : [];
        const knownIds = new Set(window.BeyondEarthGameState.getPersistentState().knowledge.unlockedEntryIds);
        if (entryId && stageId !== "review" && !knownIds.has("mission-engineering")) {
            entryIds.push("mission-engineering");
        }
        const newlyUnlocked = knowledge.unlockMany(entryIds);
        const selected = getChangedSelection(stageId, changes[0]);
        const incompatible = changedComponentIsIncompatible(stageId, changes[0], current);
        const entry = entryId ? knowledge.getEntry(entryId) : null;
        const sticker = stickerByEntry.get(entryId);
        ui.educationUntil = Date.now() + 3200;
        ui.reaction = {
            id: `${stageId}:${changes[0]}`,
            stageId,
            componentId: changes[0],
            priority: incompatible ? "critical" : "educational",
            expression: incompatible
                ? "concerned"
                : specializedObservation
                    ? "thinking"
                    : newlyUnlocked.length
                        ? "celebrating"
                        : "excited",
            message: specializedObservation
                ? specializedObservation.message
                : incompatible
                ? `${selected?.name || changes[0]} may not fit this spacecraft. The design check has the details.`
                : newlyUnlocked.length
                    ? sticker
                        ? `New page: ${entry.title}. You earned the ${sticker.title} sticker!`
                        : `Nice find! A new page about ${entry.title.toLowerCase()} is ready in my notebook.`
                    : `Good pick! Let's see how ${selected?.name || changes[0]} fits the mission.`,
            entryId,
        };
        return newlyUnlocked;
    }

    function createNotebookPage(entry, unlocked, relevant, index, total) {
        const pageInfo = notebookPages[entry.id] || {
            title: entry.title,
            highlight: entry.summary,
            explanation: entry.content,
            why: "This idea helps the mission fit together.",
            example: "Spacecraft teams use these ideas when planning real missions.",
            annotation: "Keep asking good questions.",
            doodle: "FIELD NOTE",
        };
        const page = makeNode("article", `mission-journal-page${relevant ? " is-relevant" : ""}`);
        const eyebrow = makeNode("div", "mission-journal-page__eyebrow");
        eyebrow.append(
            makeNode("span", "", `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`),
            makeNode("span", "", entry.category),
        );
        page.append(eyebrow, makeNode("h3", "mission-journal-page__title", pageInfo.title));

        if (!unlocked) {
            page.append(
                makeNode("p", "mission-journal-page__locked", "A discovery waiting to be made"),
                makeNode("p", "mission-journal-page__hint", entryHints[entry.id] || "Make a related design choice to open this page."),
            );
            const doodle = makeNode("span", "mission-journal-doodle", "✧ keep exploring ✧");
            doodle.setAttribute("aria-hidden", "true");
            page.appendChild(doodle);
            return page;
        }

        if (relevant) page.appendChild(makeNode("p", "mission-journal-page__relevant", "✦ A LITTLE NOTE FOR THIS DESIGN"));
        const explanation = makeNode("p", "mission-journal-page__explanation");
        explanation.append(
            makeNode("mark", "mission-journal-highlight", pageInfo.highlight),
            document.createTextNode(` ${pageInfo.explanation}`),
        );
        page.appendChild(explanation);

        const illustration = makeNode("figure", "mission-journal-illustration");
        illustration.appendChild(makeDiagram(entry));
        illustration.appendChild(makeNode("figcaption", "", pageInfo.doodle));
        page.appendChild(illustration);

        const why = makeNode("section", "mission-journal-section");
        why.append(makeNode("h4", "", "Why does this matter?"), makeNode("p", "", pageInfo.why));
        const example = makeNode("section", "mission-journal-section mission-journal-section--example");
        example.append(makeNode("h4", "", "A mission out there"), makeNode("p", "", pageInfo.example));
        page.append(why, example);

        if (pageInfo.equation) {
            const equation = makeNode("section", "mission-journal-equation");
            equation.append(
                makeNode("p", "mission-journal-equation__formula", pageInfo.equation),
                makeNode("p", "", pageInfo.equationParts),
            );
            page.appendChild(equation);
        }

        const annotation = makeNode("aside", "mission-journal-annotation");
        annotation.append(
            makeNode("span", "", "MARGIN NOTE"),
            makeNode("p", "", pageInfo.annotation),
        );
        page.appendChild(annotation);

        const sticker = stickerByEntry.get(entry.id);
        if (sticker && window.BeyondEarthGameState.getPersistentState().knowledge.unlockedEntryIds.includes(entry.id)) {
            const badge = makeNode("div", "mission-journal-sticker");
            badge.append(pixelArt(sticker.pattern, "mission-sticker-art", sticker.title));
            badge.append(makeNode("span", "", `STICKER · ${sticker.title}`));
            page.appendChild(badge);
        }

        const deeper = makeNode("details", "mission-journal-deeper");
        deeper.append(
            makeNode("summary", "", "More from this field note"),
            makeNode("p", "", entry.summary),
            makeNode("p", "", entry.content),
        );
        const sources = makeNode("ul", "mission-journal-sources");
        entry.sources.forEach((source) => {
            const item = makeNode("li");
            const link = makeNode("a", "", source.title);
            link.href = source.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            item.appendChild(link);
            sources.appendChild(item);
        });
        deeper.appendChild(sources);
        page.appendChild(deeper);
        return page;
    }

    function notebookMatches(entry, query) {
        if (!query) return true;
        const page = notebookPages[entry.id];
        const searchable = [
            entry.title,
            entry.category,
            entry.summary,
            entry.content,
            ...entry.tags,
            page?.title,
            page?.highlight,
            page?.explanation,
            page?.why,
            page?.example,
            page?.annotation,
            entryHints[entry.id],
        ].filter(Boolean);
        return searchable.some((value) => value.toLocaleLowerCase().includes(query));
    }

    function getNotebookEntries() {
        const query = element("mission-notebook-search")?.value.trim().toLocaleLowerCase() || "";
        const category = element("mission-notebook-discipline")?.value || "";
        const options = { category: category || null, includeLocked: true };
        const serviceMatches = new Set(knowledge.search(query, options).map((entry) => entry.id));
        return knowledge.list(options)
            .filter((entry) => !query || serviceMatches.has(entry.id) || notebookMatches(entry, query));
    }

    function renderNotebook() {
        const host = element("mission-notebook-page");
        if (!host) return;
        const matchingEntries = getNotebookEntries();
        let currentIndex = matchingEntries.findIndex((entry) => entry.id === ui.notebookEntryId);
        if (currentIndex < 0 && matchingEntries.length) {
            currentIndex = 0;
            ui.notebookEntryId = matchingEntries[0].id;
        }
        host.replaceChildren();

        if (!matchingEntries.length) {
            host.appendChild(makeNode("p", "mission-journal-empty", "No page matches that search. Try another word or topic."));
        } else {
            const entry = matchingEntries[currentIndex];
            const unlocked = window.BeyondEarthGameState.getPersistentState().knowledge.unlockedEntryIds.includes(entry.id);
            const selected = getSelection(ui.activeStage, ui.mission);
            const relevant = entry.tags.includes(`stage:${ui.activeStage}`)
                || Boolean(selected?.id && entry.tags.includes(`component:${selected.id}`));
            host.appendChild(createNotebookPage(entry, unlocked, relevant, currentIndex, matchingEntries.length));
        }

        const count = element("mission-notebook-page-count");
        if (count) count.textContent = matchingEntries.length ? `${currentIndex + 1} / ${matchingEntries.length}` : "0 / 0";
        const previous = element("mission-notebook-previous");
        const next = element("mission-notebook-next");
        if (previous) previous.disabled = !matchingEntries.length || currentIndex <= 0;
        if (next) next.disabled = !matchingEntries.length || currentIndex >= matchingEntries.length - 1;
    }

    function openNotebook(entryId = null) {
        const dialog = element("mission-notebook-dialog");
        if (!dialog?.showModal) return false;
        window.clearTimeout(ui.notebookCloseTimer);
        dialog.classList.remove("is-closing");
        if (entryId && knowledge.hasEntry(entryId)) ui.notebookEntryId = entryId;
        else if (!ui.notebookEntryId) ui.notebookEntryId = getContextEntryId(ui.activeStage, ui.mission);
        renderNotebook();
        if (!dialog.open) {
            dialog.showModal();
            syncCompanionDialogLayer();
            dialog.classList.add("is-opening");
            window.setTimeout(() => dialog.classList.remove("is-opening"), 420);
        }
        element("mission-notebook-close")?.focus({ preventScroll: true });
        return true;
    }

    function closeNotebook() {
        const dialog = element("mission-notebook-dialog");
        if (!dialog?.open) return;
        dialog.classList.remove("is-opening");
        dialog.classList.add("is-closing");
        window.clearTimeout(ui.notebookCloseTimer);
        ui.notebookCloseTimer = window.setTimeout(() => {
            if (dialog.open) dialog.close();
            dialog.classList.remove("is-closing");
        }, 160);
    }

    function hideBubble() {
        const bubble = element("mission-astronaut-bubble");
        const character = element("mission-astronaut-character");
        ui.explanation = null;
        if (bubble) bubble.hidden = true;
        if (character) character.setAttribute("aria-expanded", "false");
        window.clearTimeout(ui.bubbleTimer);
        scheduleAstronautPosition();
    }

    function priorityRank(priority) {
        return {
            critical: 4,
            warning: 4,
            educational: 3,
            direct: 2,
            playful: 1,
            ambient: 1,
        }[priority] || 0;
    }

    function dismissBubble() {
        hideBubble();
        if (ui.screenOverride) {
            const returnStageId = ui.screenOverride.returnStageId;
            window.clearTimeout(ui.screenOverrideTimer);
            ui.screenOverride = null;
            ui.reaction = null;
            if (returnStageId) renderCompanion(returnStageId, ui.mission);
        }
        if (!getNickname()) ui.nicknamePromptDeferred = true;
    }

    function showBubble(message, entryId, duration = 0, priority = "educational") {
        const bubble = element("mission-astronaut-bubble");
        const messageWrap = element("mission-astronaut-message-wrap");
        const character = element("mission-astronaut-character");
        const speaker = element("mission-astronaut-speaker");
        const messageElement = element("mission-astronaut-message");
        if (!bubble || !messageWrap || !character || !messageElement
            || element("mission-deployment")?.open) return;
        const preferences = getCompanionPreferences();
        if (!preferences.visible
            || (["educational", "ambient"].includes(priority) && !preferences.educationalGuidance)
            || (priority === "playful" && !preferences.playfulReactions)) return;
        const context = getCompanionContext(ui.activeStage, ui.mission);
        if ((context.priority === "critical" || context.priority === "warning")
            && priorityRank(priority) < priorityRank(context.priority)) return;
        ui.explanation = { priority, entryId };
        messageWrap.hidden = false;
        bubble.hidden = false;
        character.setAttribute("aria-expanded", "true");
        character.setAttribute("aria-label", getNickname() ? `Ask ${getNickname()} for help` : "Ask your astronaut for help");
        if (speaker) speaker.textContent = getNickname() ? `${getNickname()} · FLIGHT BUDDY` : "FLIGHT BUDDY";
        const conciseMessage = String(message || "").replace(/\s+/g, " ").trim();
        const sentenceEnd = conciseMessage.search(/[.!?](?:\s|$)/);
        const sentence = sentenceEnd >= 0 ? conciseMessage.slice(0, sentenceEnd + 1) : conciseMessage;
        messageElement.textContent = sentence.length > 180 ? `${sentence.slice(0, 177).trimEnd()}…` : sentence;
        const noteButton = element("mission-astronaut-note");
        if (noteButton) {
            noteButton.hidden = !entryId || !knowledge.hasEntry(entryId);
            noteButton.dataset.entryId = entryId || "";
            noteButton.textContent = "OPEN THIS FIELD NOTE →";
        }
        if (ui.activeStage) positionAstronaut(ui.activeStage, ui.mission);
        positionBubble();
        window.clearTimeout(ui.bubbleTimer);
        if (duration > 0) {
            ui.bubbleTimer = window.setTimeout(dismissBubble, duration);
        }
    }

    function showNicknamePrompt() {
        const dialog = element("mission-astronaut-name-dialog");
        const input = element("mission-astronaut-nickname");
        const art = element("mission-astronaut-name-dialog")?.querySelector(".mission-astronaut-name__art");
        const sprite = element("mission-astronaut-character")?.querySelector("svg");
        if (!dialog?.showModal || !art || !sprite) return false;
        if (!dialog.open) dialog.showModal();
        syncCompanionDialogLayer();
        art.replaceChildren(sprite.cloneNode(true));
        window.clearTimeout(ui.bubbleTimer);
        input?.focus({ preventScroll: true });
        return true;
    }

    function requestNickname() {
        if (getNickname() || ui.nicknamePromptDeferred) return false;
        return showNicknamePrompt();
    }

    function renderCompanion(stageId, mission) {
        clearPersonalityMood();
        stageId = getRenderStage(stageId);
        const stageChanged = ui.activeStage !== stageId;
        const missionChanged = ui.mission !== mission;
        const preferences = getCompanionPreferences();
        if (stageChanged) {
            ui.reaction = null;
            ui.lastReactionId = null;
            ui.activeStage = stageId;
            ui.criticalAlertKey = null;
            ui.educationUntil = Date.now() + 2400;
        }
        if ((stageChanged || missionChanged) && preferences.followPlayerInteractions) {
            ui.manualPositionRatio = null;
            ui.manualPositionTopRatio = null;
        }
        ui.mission = mission;
        if (stageId === "review" && mission
            && window.BeyondEarthMissionBuilder.buildReview(mission).status === "suitable"
            && !window.BeyondEarthGameState.getPersistentState().knowledge.unlockedEntryIds.includes("systems-integration")) {
            knowledge.unlock("systems-integration");
        }

        const context = getCompanionContext(stageId, mission);
        const layer = element("mission-companion-layer");
        const companion = element("mission-astronaut");
        if (layer) {
            layer.hidden = !isCompanionScene() || Boolean(element("mission-deployment")?.open);
            layer.dataset.visible = String(preferences.visible);
        }
        if (companion) {
            companion.dataset.expression = context.expression;
            companion.dataset.playfulEnabled = String(preferences.playfulReactions);
            companion.dataset.visible = String(preferences.visible);
        }
        const nickname = getNickname();
        const owner = element("mission-notebook-owner");
        if (owner) owner.textContent = nickname ? `${nickname.toUpperCase()}'S` : "ASTRONAUT'S";
        const character = element("mission-astronaut-character");
        if (character) {
            character.setAttribute("aria-label", nickname ? `Ask ${nickname} for help` : "Ask your astronaut for help");
        }
        const speaker = element("mission-astronaut-speaker");
        if (speaker) speaker.textContent = nickname ? `${nickname} · FLIGHT BUDDY` : "FLIGHT BUDDY";
        const noteButton = element("mission-astronaut-note");
        if (noteButton) {
            noteButton.dataset.entryId = context.entryId;
            noteButton.hidden = !knowledge.hasEntry(context.entryId);
        }

        positionAstronaut(stageId, mission);
        const criticalKey = context.priority === "critical" || context.priority === "warning"
            ? `${stageId}:${context.issueIdentity || ui.reaction?.id || context.selectedId || "review"}`
            : null;
        if (criticalKey && ui.criticalAlertKey !== criticalKey) {
            ui.criticalAlertKey = criticalKey;
            ui.lastReactionId = ui.reaction?.id || null;
            const reviewKey = stageId === "constraints"
                ? getConstraintReviewKey(mission)
                : null;
            const alreadyGuided = stageId === "constraints"
                && stageChanged
                && ui.lastConstraintReviewKey === reviewKey;
            if (stageId === "constraints") ui.lastConstraintReviewKey = reviewKey;
            if (alreadyGuided) hideBubble();
            else showBubble(context.message, context.entryId, 0, context.priority);
        } else if (stageChanged) {
            if (stageId === "constraints") {
                const reviewKey = getConstraintReviewKey(mission);
                if (ui.lastConstraintReviewKey !== reviewKey) {
                    ui.lastConstraintReviewKey = reviewKey;
                    ui.lastReactionId = `constraint-review:${reviewKey}`;
                    showBubble(context.message, context.entryId, 0, context.priority);
                } else {
                    hideBubble();
                }
            } else if (stageId === "review" && context.expression === "celebrating") {
                ui.lastReactionId = `stage:${stageId}:${mission?.id || "current"}`;
                showBubble(context.message, context.entryId, 0, "educational");
            } else if (globalContextStages.has(stageId)
                && preferences.educationalGuidance
                && Date.now() - ui.lastContextSpokenAt >= getAmbientDelay(preferences.speechBubbleFrequency)) {
                ui.lastContextSpokenAt = Date.now();
                showBubble(context.message, context.entryId, 0, "educational");
            } else {
                hideBubble();
            }
        } else if (ui.reaction?.stageId === stageId
            && ui.reaction.id
            && ui.lastReactionId !== ui.reaction.id
            && (preferences.educationalGuidance || ui.reaction.expression === "celebrating")) {
            ui.lastReactionId = ui.reaction.id;
            showBubble(context.message, context.entryId, 0, context.priority);
        } else if ((ui.explanation?.priority === "critical" || ui.explanation?.priority === "warning")
            && context.priority !== "critical" && context.priority !== "warning") {
            if (preferences.educationalGuidance && ui.reaction?.stageId === stageId) {
                showBubble(context.message, context.entryId, 0, context.priority);
            } else {
                hideBubble();
            }
        } else if (ui.reaction?.stageId === stageId && !element("mission-astronaut-bubble")?.hidden) {
            if (context.priority === "critical" || context.priority === "warning" || preferences.educationalGuidance) {
                showBubble(context.message, context.entryId, 0, context.priority);
            } else {
                hideBubble();
            }
        }
        if (!criticalKey) ui.criticalAlertKey = null;
        scheduleAmbientBehavior();
        if (element("mission-notebook-dialog")?.open) renderNotebook();
    }

    function updateNotebookOnKnowledgeUnlock(event) {
        const entry = event.detail?.entry;
        if (!entry) return;
        if (entry.id === "systems-integration" && ui.activeStage === "review") {
            ui.reaction = {
                id: `knowledge:${entry.id}`,
                stageId: "review",
                expression: "celebrating",
                message: "All clear! A Systems Stitcher sticker is tucked into the notebook.",
            };
        }
        if (element("mission-notebook-dialog")?.open) renderNotebook();
    }

    function renderCompanionSettings() {
        const preferences = getCompanionPreferences();
        document.querySelectorAll?.("[data-companion-setting]").forEach((input) => {
            const key = input.dataset.companionSetting;
            if (Object.prototype.hasOwnProperty.call(preferences, key)) {
                if (input.type === "checkbox") input.checked = preferences[key];
                else input.value = preferences[key];
            }
        });
        const status = element("mission-companion-settings-status");
        if (status) status.textContent = "Changes save automatically.";
    }

    function openCompanionSettings() {
        const dialog = element("mission-companion-settings-dialog");
        if (!dialog?.showModal) return false;
        renderCompanionSettings();
        if (!dialog.open) dialog.showModal();
        syncCompanionDialogLayer();
        element("mission-companion-settings-close")?.focus({ preventScroll: true });
        return true;
    }

    function closeCompanionSettings() {
        const dialog = element("mission-companion-settings-dialog");
        if (dialog?.open) dialog.close();
    }

    function saveCompanionPreference(input) {
        const key = input.dataset.companionSetting;
        const value = input.type === "checkbox" ? input.checked : input.value;
        const status = element("mission-companion-settings-status");
        try {
            const savePreferences = window.BeyondEarthGameState.setCompanionPreferences;
            if (typeof savePreferences !== "function") {
                throw new Error("Astronaut settings are unavailable. Please reload the game and try again.");
            }
            savePreferences({ [key]: value });
        } catch (error) {
            if (input.type === "checkbox") input.checked = getCompanionPreferences()[key];
            else input.value = getCompanionPreferences()[key];
            if (status) status.textContent = `Couldn't save that setting: ${error.message}`;
            return;
        }

        if (status) status.textContent = "Saved to your flight records.";
        const companion = element("mission-astronaut");
        if (companion && key === "playfulReactions") {
            companion.dataset.playfulEnabled = String(value);
            if (!value) {
                window.clearTimeout(ui.playfulTimer);
                ui.pendingPlayfulState = null;
                companion.dataset.playful = "idle";
                delete companion.dataset.touchArea;
                if (ui.explanation?.priority === "playful") hideBubble();
                clearPersonalityMood();
                if (ui.activeStage) {
                    companion.dataset.expression = getCompanionContext(ui.activeStage, ui.mission).expression;
                }
            }
        }
        if (key === "educationalGuidance" && !value
            && ui.explanation?.priority !== "critical"
            && ui.explanation?.priority !== "warning") {
            hideBubble();
        } else if (key === "educationalGuidance" && value) {
            ui.lastReactionId = null;
            if (ui.activeStage) renderCompanion(ui.activeStage, ui.mission);
        }
        if (key === "followPlayerInteractions") {
            if (value) {
                ui.manualPositionRatio = null;
                ui.manualPositionTopRatio = null;
                scheduleAstronautPosition();
            } else {
                const layer = element("mission-companion-layer");
                const stageWrap = currentSceneId() === "missions-scene"
                    ? element("mission-stage-wrap")
                    : null;
                const companion = element("mission-astronaut");
                const bounds = layer ? getPositionBounds(layer, stageWrap) : null;
                const left = Number.parseFloat(companion?.style.left);
                if (bounds && Number.isFinite(left)) {
                    ui.manualPositionRatio = bounds.maxLeft === bounds.minLeft
                        ? 0
                        : (left - bounds.minLeft) / (bounds.maxLeft - bounds.minLeft);
                }
                if (bounds && Number.isFinite(Number.parseFloat(companion?.style.top))) {
                    ui.manualPositionTopRatio = bounds.maxTop === bounds.minTop
                        ? 0
                        : (Number.parseFloat(companion.style.top) - bounds.minTop) / (bounds.maxTop - bounds.minTop);
                }
            }
        }
        if (key === "visible" && ui.activeStage) {
            renderCompanion(ui.activeStage, ui.mission);
        }
        if (key === "freeRoaming") {
            scheduleAmbientBehavior();
        }
        if (key === "playfulReactions" || key === "educationalGuidance") {
            scheduleAmbientBehavior();
        }
        if (key === "visible") scheduleAmbientBehavior();
        if (key === "speechBubbleFrequency") scheduleAmbientBehavior();
    }

    function getAstronautTouchArea(target) {
        if (target.closest?.(".mission-astronaut__helmet, .mission-astronaut__visor, .mission-astronaut__eye, .mission-astronaut__mouth, .mission-astronaut__antenna, .mission-astronaut__antenna-light")) {
            return "helmet";
        }
        if (target.closest?.(".mission-astronaut__pack")) return "backpack";
        if (target.closest?.(".mission-astronaut__boot")) return "boots";
        return "suit";
    }

    function interactWithAstronaut(area, special = false) {
        const character = element("mission-astronaut-character");
        const bubble = element("mission-astronaut-bubble");
        const preferences = getCompanionPreferences();
        const context = getCompanionContext(ui.activeStage, ui.mission);
        ui.directInteractionUntil = Date.now() + 1800;
        if (character) {
            character.dataset.touchArea = area;
            window.clearTimeout(ui.touchTimer);
            ui.touchTimer = window.setTimeout(() => delete character.dataset.touchArea, 700);
        }
        const protectedMessage = context.priority === "critical"
            || context.priority === "warning"
            || (bubble && !bubble.hidden && ui.explanation
                && priorityRank(ui.explanation.priority) > priorityRank("direct"));
        if (preferences.playfulReactions && !protectedMessage) {
            const pose = special
                ? "special"
                : area === "helmet"
                    ? "curious"
                    : area === "backpack" || area === "boots"
                        ? "happy"
                        : "tapped";
            setPlayfulState(pose, special ? 1350 : 850);
        }
        if (preferences.soundEffects) {
            window.SpaceAudio?.playSFX?.(special ? "success" : "select");
        }
        if (bubble && !bubble.hidden) return;

        const nickname = getNickname();
        if (!nickname) {
            showNicknamePrompt();
            return;
        }
        if (context.priority === "critical" || preferences.educationalGuidance) {
            showBubble(context.message, context.entryId, 0, context.priority);
        } else {
            showBubble(
                `${nickname}, I'll keep the science hints tucked away. Your field notebook is always here if you need it.`,
                null,
                0,
                "direct",
            );
        }
    }

    function handleCharacterPointerDown(event) {
        if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
        const character = element("mission-astronaut-character");
        const companion = element("mission-astronaut");
        const layer = element("mission-companion-layer");
        const stageWrap = currentSceneId() === "missions-scene"
            ? element("mission-stage-wrap")
            : null;
        if (!character || !companion || !layer || layer.hidden) return;
        const bounds = getPositionBounds(layer, stageWrap);
        if (!bounds) return;
        const currentLeft = Number.parseFloat(companion.style.left);
        const currentTop = Number.parseFloat(companion.style.top);
        ui.pointer = {
            pointerId: event.pointerId,
            pointerType: event.pointerType,
            startX: event.clientX,
            startY: event.clientY,
            startLeft: Number.isFinite(currentLeft) ? currentLeft : bounds.minLeft,
            startTop: Number.isFinite(currentTop) ? currentTop : bounds.top,
            area: getAstronautTouchArea(event.target),
            dragging: false,
        };
        if (event.pointerType !== "touch") event.preventDefault();
        if (event.isTrusted && character.setPointerCapture) {
            character.setPointerCapture(event.pointerId);
        }
    }

    function handleCharacterPointerMove(event) {
        const character = element("mission-astronaut-character");
        const companion = element("mission-astronaut");
        const layer = element("mission-companion-layer");
        const stageWrap = currentSceneId() === "missions-scene"
            ? element("mission-stage-wrap")
            : null;
        if (!character || !companion || !layer || layer.hidden) return;
        const pointer = ui.pointer;
        if (!pointer || pointer.pointerId !== event.pointerId) {
            if (event.pointerType === "mouse") {
                const rect = character.getBoundingClientRect();
                const relativeX = event.clientX - rect.left;
                character.dataset.gaze = relativeX < rect.width * 0.4
                    ? "left"
                    : relativeX > rect.width * 0.6
                        ? "right"
                        : "center";
            }
            return;
        }

        const deltaX = event.clientX - pointer.startX;
        const deltaY = event.clientY - pointer.startY;
        if (!pointer.dragging && Math.hypot(deltaX, deltaY) >= 6) {
            pointer.dragging = true;
            window.clearTimeout(ui.ambientTimer);
        }
        if (!pointer.dragging) return;

        const bounds = getPositionBounds(layer, stageWrap);
        if (!bounds) return;
        const left = Math.max(bounds.minLeft, Math.min(bounds.maxLeft, pointer.startLeft + deltaX));
        const top = Math.max(bounds.minTop, Math.min(bounds.maxTop, pointer.startTop + deltaY));
        ui.manualPositionRatio = bounds.maxLeft === bounds.minLeft
            ? 0
            : (left - bounds.minLeft) / (bounds.maxLeft - bounds.minLeft);
        ui.manualPositionTopRatio = bounds.maxTop === bounds.minTop
            ? 0
            : (top - bounds.minTop) / (bounds.maxTop - bounds.minTop);
        companion.style.left = `${left}px`;
        companion.style.top = `${top}px`;
        companion.style.bottom = "auto";
        companion.dataset.moving = String(getCompanionPreferences().playfulReactions);
        companion.dataset.gesture = "idle";
        if (Math.abs(deltaX) > 2) companion.dataset.facing = deltaX < 0 ? "left" : "right";
        positionBubble();
        const settingsButton = element("mission-companion-settings-open");
        if (settingsButton && getCompanionPreferences().visible) {
            settingsButton.style.left = `${Math.max(8, Math.min(bounds.maxLeft, left + bounds.width + 4))}px`;
            settingsButton.style.top = `${Math.max(8, Math.min(bounds.maxTop, top + 8))}px`;
        }
    }

    function finishCharacterPointer(event, cancelled = false) {
        const character = element("mission-astronaut-character");
        const companion = element("mission-astronaut");
        const pointer = ui.pointer;
        if (!pointer || pointer.pointerId !== event.pointerId) return;
        ui.pointer = null;
        if (character?.hasPointerCapture?.(event.pointerId)) {
            character.releasePointerCapture(event.pointerId);
        }
        if (companion) {
            companion.dataset.moving = "false";
            companion.dataset.gesture = "idle";
        }
        playPendingState();
        if (cancelled || pointer.dragging) {
            if (pointer.dragging) ui.lastTapAt = 0;
            ui.directInteractionUntil = Date.now() + 700;
            if (pointer.dragging) scheduleAmbientBehavior();
            return;
        }
        const now = Date.now();
        const special = ui.lastTapAt > 0 && now - ui.lastTapAt <= 360;
        ui.lastTapAt = special ? 0 : now;
        interactWithAstronaut(pointer.area, special);
    }

    function showGameReaction(stageId, message, entryId, expression = "excited", options = {}) {
        const preferences = getCompanionPreferences();
        const priority = options.priority || "educational";
        const category = options.category || "educational";
        const duration = options.duration || 4800;
        if (!preferences.visible
            || element("mission-deployment")?.open
            || (category === "educational" && !preferences.educationalGuidance && priority !== "critical")
            || (category === "playful" && !preferences.playfulReactions)) return false;
        const currentContext = ui.activeStage
            ? getCompanionContext(ui.activeStage, ui.mission)
            : null;
        if (currentContext
            && priorityRank(priority) < priorityRank(currentContext.priority)) return false;

        const sceneId = currentSceneId();
        const previousOverride = ui.screenOverride;
        const returnStageId = previousOverride?.returnStageId
            || ui.activeStage
            || getSceneStage(sceneId);
        const override = {
            sceneId,
            stageId,
            returnStageId,
            expiresAt: Date.now() + duration,
        };
        ui.screenOverride = override;
        window.clearTimeout(ui.screenOverrideTimer);
        renderCompanion(stageId, activeMissionForContext(options.mission));
        ui.reaction = {
            id: `game:${stageId}:${Date.now()}`,
            stageId,
            expression,
            message,
            entryId,
            priority,
        };
        ui.lastReactionId = ui.reaction.id;
        const companion = element("mission-astronaut");
        if (companion) companion.dataset.expression = expression;
        const bubblePriority = options.bubblePriority
            || (category === "educational" ? priority : "direct");
        showBubble(message, entryId, 0, bubblePriority);
        if (preferences.soundEffects && expression === "celebrating") {
            window.SpaceAudio?.playSFX?.("success");
        }
        ui.screenOverrideTimer = window.setTimeout(() => {
            if (ui.screenOverride !== override) return;
            ui.screenOverride = null;
            ui.reaction = null;
            hideBubble();
            renderCompanion(returnStageId, activeMissionForContext(options.mission));
        }, duration);
        return true;
    }

    function handleCompanionSceneChange(event) {
        const sceneId = event.detail?.scene || currentSceneId();
        syncCompanionDialogLayer();
        if (!isCompanionScene(sceneId)) {
            const layer = element("mission-companion-layer");
            if (layer) layer.hidden = true;
            window.clearTimeout(ui.ambientTimer);
            return;
        }
        const mission = activeMissionForContext();
        renderCompanion(getSceneStage(sceneId), mission);
        scheduleAmbientBehavior();
    }

    function handleMinigameResult(event) {
        const result = event.detail?.result;
        if (!result) return;
        ui.lastMinigameResult = result;
        const status = result.status;
        const expression = status === "success" ? "celebrating" : "thinking";
        const context = getGlobalCompanionContext("results", activeMissionForContext());
        showGameReaction("results", context.message, "science-measurement", expression, {
            duration: 6200,
            mission: activeMissionForContext(),
        });
    }

    function handleGameEvents() {
        document.addEventListener("beyond:scenechange", handleCompanionSceneChange);
        document.addEventListener("beyond:companionmodal", syncCompanionDialogLayer);
        document.querySelectorAll?.("dialog").forEach((dialog) => {
            dialog.addEventListener("close", syncCompanionDialogLayer);
        });
        if (window.MutationObserver && document.documentElement) {
            const observer = new window.MutationObserver(syncCompanionDialogLayer);
            observer.observe(document.documentElement, {
                subtree: true,
                attributes: true,
                attributeFilter: ["open"],
            });
        }
        document.addEventListener("beyond:missionapprovalopen", (event) => {
            const mission = event.detail?.mission || activeMissionForContext();
            const context = getGlobalCompanionContext("approval", mission);
            showGameReaction("approval", context.message, context.entryId, "thinking", { mission });
            syncCompanionDialogLayer();
        });
        document.addEventListener("beyond:missionapproved", (event) => {
            const mission = event.detail?.mission || activeMissionForContext();
            const destination = readComponent("destinations", mission?.destination?.id);
            showGameReaction(
                "dashboard",
                mission
                    ? `${mission.name} is approved${destination?.name ? ` for ${destination.name}` : ""}. Nice work, flight team!`
                    : "Mission approved. Nice work, flight team!",
                "systems-integration",
                "celebrating",
                { mission, category: "milestone" },
            );
        });
        document.addEventListener("beyond:missiondeploymentstart", () => {
            const layer = element("mission-companion-layer");
            const bubble = element("mission-astronaut-bubble");
            if (layer) layer.hidden = true;
            if (bubble) bubble.hidden = true;
            window.clearTimeout(ui.ambientTimer);
            syncCompanionDialogLayer();
        });
        document.addEventListener("beyond:missiondeploymentend", () => {
            if (isCompanionScene()) {
                renderCompanion(getSceneStage(), activeMissionForContext());
            }
        });
        document.addEventListener("beyond:minigamestart", () => {
            const context = getGlobalCompanionContext("minigame", activeMissionForContext());
            showGameReaction("minigame", context.message, context.entryId, "thinking");
        });
        document.addEventListener("beyond:minigameobservation", (event) => {
            const activeGame = window.BeyondEarthMinigames?.getActive?.();
            if (event.detail?.id && activeGame?.id !== event.detail.id) return;
            const frequency = getCompanionPreferences().speechBubbleFrequency;
            const cooldown = { quiet: 12000, balanced: 7000, chatty: 3800 }[frequency] || 7000;
            if (Date.now() - ui.lastGameCommentAt < cooldown) return;
            ui.lastGameCommentAt = Date.now();
            const messages = {
                discovery: "Nice find! Check whether that clue fits the rest of the evidence.",
                obstacle: "No rush. Try looking at the evidence another way, then decide when you're ready.",
                reset: "Starting fresh is a good move. Compare a few details before choosing.",
                progress: "Good comparison. Check whether several features line up before you decide.",
            };
            const message = messages[event.detail?.kind] || messages.progress;
            showGameReaction("minigame", message, "science-measurement", "thinking", {
                duration: 4200,
                category: "educational",
            });
        });
        document.addEventListener("beyond:minigameresult", handleMinigameResult);
        document.addEventListener("beyond:minigameend", () => {
            if (currentSceneId() === "missions-scene") {
                renderCompanion(getSceneStage(), activeMissionForContext());
            }
            scheduleAmbientBehavior();
        });
        document.addEventListener("beyond:minigamepause", () => {
            showGameReaction("minigame", "Activity paused. Take your time; your analysis is still here when you're ready.", "science-measurement", "thinking", { category: "activity" });
        });
        document.addEventListener("beyond:minigameresume", () => {
            showGameReaction("minigame", "Welcome back. Continue comparing the evidence before you submit.", "science-measurement", "excited", { category: "activity" });
        });
        document.addEventListener("beyond:minigameerror", (event) => {
            const error = event.detail?.error;
            showGameReaction(
                "minigame",
                `The activity hit a snag${error?.message ? `: ${error.message}` : ""}. Your mission data is still protected.`,
                "mission-engineering",
                "concerned",
                { category: "activity" },
            );
        });
        document.addEventListener("beyond:achievementunlocked", (event) => {
            const achievement = event.detail || {};
            showGameReaction(
                "unlock",
                `Achievement unlocked: ${achievement.title || "new accomplishment"}${achievement.description ? ` — ${achievement.description}` : ""}.`,
                "systems-integration",
                "celebrating",
                { duration: 6000, category: "milestone" },
            );
        });
        document.addEventListener("beyond:knowledgeunlocked", (event) => {
            const entry = event.detail?.entry;
            if (!entry) return;
            showGameReaction(
                "unlock",
                `New field note: ${entry.title}. Open the Engineering Notebook to explore it.`,
                entry.id,
                "excited",
                { duration: 6000, category: "milestone" },
            );
        });
        document.addEventListener("beyond:missioncompleted", (event) => {
            const mission = event.detail?.mission;
            if (!mission) return;
            const score = mission.performance?.finalScore;
            const scoreNote = Number.isFinite(score) ? ` Final score: ${score}.` : "";
            ui.lastMinigameResult = null;
            showGameReaction(
                "results",
                `${mission.name} is complete and its flight record is saved.${scoreNote}`,
                "systems-integration",
                "celebrating",
                { duration: 6500, mission, category: "milestone" },
            );
        });
        document.addEventListener("beyond:statechange", (event) => {
            syncCompanionDialogLayer();
            if (currentSceneId() === "cockpit-scene" && event.detail?.state?.activeMission) {
                renderCompanion("dashboard", event.detail.state.activeMission);
            } else if (currentSceneId() === "missions-scene"
                && window.BeyondEarthMinigames?.getActive?.()
                && ui.activeStage !== "minigame") {
                renderCompanion("minigame", activeMissionForContext());
            }
        });
    }

    function bindNotebookControls() {
        promoteCompanionToGameScope();
        handleGameEvents();
        syncCompanionDialogLayer();
        document.addEventListener("beyond:scenechange", (event) => {
            if (event.detail?.scene === "missions-scene") {
                scheduleAstronautPosition();
                scheduleAmbientBehavior();
            } else if (!isCompanionScene(event.detail?.scene)) {
                window.clearTimeout(ui.ambientTimer);
            }
        });

        element("mission-notebook-open")?.addEventListener("click", () => {
            openNotebook(getContextEntryId(ui.activeStage, ui.mission));
        });
        element("mission-notebook-close")?.addEventListener("click", closeNotebook);
        element("mission-notebook-dialog")?.addEventListener("cancel", (event) => {
            event.preventDefault();
            closeNotebook();
        });
        element("mission-notebook-dialog")?.addEventListener("click", (event) => {
            if (event.target === event.currentTarget) closeNotebook();
        });
        element("mission-notebook-dialog")?.addEventListener("close", () => {
            element("mission-notebook-dialog")?.classList.remove("is-opening", "is-closing");
        });
        element("mission-notebook-search")?.addEventListener("input", () => {
            ui.notebookEntryId = null;
            renderNotebook();
        });
        element("mission-notebook-discipline")?.addEventListener("change", () => {
            ui.notebookEntryId = null;
            renderNotebook();
        });
        element("mission-notebook-previous")?.addEventListener("click", () => {
            const entries = getNotebookEntries();
            const index = entries.findIndex((entry) => entry.id === ui.notebookEntryId);
            if (index > 0) {
                ui.notebookEntryId = entries[index - 1].id;
                renderNotebook();
            }
        });
        element("mission-notebook-next")?.addEventListener("click", () => {
            const entries = getNotebookEntries();
            const index = entries.findIndex((entry) => entry.id === ui.notebookEntryId);
            if (index >= 0 && index < entries.length - 1) {
                ui.notebookEntryId = entries[index + 1].id;
                renderNotebook();
            }
        });
        element("mission-astronaut-character")?.addEventListener("click", (event) => {
            if (event.detail === 0) {
                ui.lastTapAt = 0;
                interactWithAstronaut("suit");
            }
        });
        element("mission-astronaut-character")?.addEventListener("pointerdown", handleCharacterPointerDown);
        element("mission-astronaut-character")?.addEventListener("pointermove", handleCharacterPointerMove);
        element("mission-astronaut-character")?.addEventListener("pointerup", finishCharacterPointer);
        element("mission-astronaut-character")?.addEventListener("pointercancel", (event) => {
            finishCharacterPointer(event, true);
        });
        element("mission-astronaut-character")?.addEventListener("pointerleave", () => {
            const character = element("mission-astronaut-character");
            if (character && !ui.pointer) character.dataset.gaze = "center";
        });
        element("mission-astronaut-dismiss")?.addEventListener("click", dismissBubble);
        element("mission-astronaut-name-later")?.addEventListener("click", () => {
            ui.nicknamePromptDeferred = true;
            element("mission-astronaut-name-dialog")?.close();
            hideBubble();
        });
        element("mission-astronaut-name-dialog")?.addEventListener("cancel", (event) => {
            event.preventDefault();
            element("mission-astronaut-name-later")?.click();
        });
        element("mission-astronaut-name-form")?.addEventListener("submit", (event) => {
            event.preventDefault();
            const input = element("mission-astronaut-nickname");
            if (!input) return;
            input.setCustomValidity("");
            try {
                const saveNickname = window.BeyondEarthGameState.setCompanionNickname;
                if (typeof saveNickname !== "function") {
                    throw new Error("Nickname saving is unavailable. Please reload the game and try again.");
                }
                saveNickname(input.value);
            } catch (error) {
                input.setCustomValidity(error.message);
                input.reportValidity();
                return;
            }
            ui.nicknamePromptDeferred = false;
            element("mission-astronaut-name-dialog")?.close();
            const context = getCompanionContext(ui.activeStage, ui.mission);
            ui.reaction = {
                id: `nickname:${Date.now()}`,
                stageId: ui.activeStage,
                expression: "excited",
                message: context.message,
            };
            renderCompanion(ui.activeStage, ui.mission);
        });
        element("mission-astronaut-nickname")?.addEventListener("input", (event) => {
            event.currentTarget.setCustomValidity("");
        });
        element("mission-astronaut-note")?.addEventListener("click", (event) => {
            openNotebook(event.currentTarget.dataset.entryId);
        });
        element("mission-companion-settings-open")?.addEventListener("click", openCompanionSettings);
        element("mission-companion-settings-close")?.addEventListener("click", closeCompanionSettings);
        element("mission-companion-settings-dialog")?.addEventListener("cancel", (event) => {
            event.preventDefault();
            closeCompanionSettings();
        });
        element("mission-companion-settings-dialog")?.addEventListener("click", (event) => {
            if (event.target === event.currentTarget) closeCompanionSettings();
        });
        document.querySelectorAll?.("[data-companion-setting]").forEach((input) => {
            input.addEventListener("change", () => saveCompanionPreference(input));
        });
        window.matchMedia?.("(prefers-reduced-motion: reduce)")?.addEventListener?.("change", () => {
            scheduleAmbientBehavior();
        });
        window.addEventListener?.("resize", () => {
            window.clearTimeout(ui.resizeTimer);
            ui.resizeTimer = window.setTimeout(() => {
                positionAstronaut(ui.activeStage, ui.mission);
            }, 110);
        });
    }

    bindNotebookControls();
    document.addEventListener("beyond:knowledgeunlocked", updateNotebookOnKnowledgeUnlock);

    window.BeyondEarthMissionEducation = Object.freeze({
        closeNotebook,
        getCompanionContext,
        handleMissionUpdate,
        openNotebook,
        requestNickname,
        renderCompanion,
        renderNotebook,
    });
})();
