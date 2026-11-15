(() => {
    "use strict";

    function isRecord(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function toId(value, label) {
        if (typeof value !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
            throw new TypeError(`${label} IDs must use lowercase kebab-case.`);
        }
        return value;
    }

    function toName(value, fallback) {
        if (typeof value !== "string" || !value.trim()) return fallback;
        return value.trim();
    }

    function ensureCatalogs() {
        const catalogs = window.BeyondEarthCatalogs;
        if (!catalogs) return false;

        const destinationDefinitions = [
            { id: "earth-orbit", name: "Earth Orbit", type: "orbital", summary: "Low-Earth orbital operations close to Earth and with frequent communications.", description: "Rapid turnaround, low travel cost, and the most forgiving launch window for crewed or automated systems.", environmentalConditions: { gravity: 1, temperature: 15, atmosphere: "thin", radiation: "moderate" }, distanceAu: 0.000015, travelTimeDays: 0, scientificValue: 3, risk: 0.1 },
            { id: "moon", name: "Moon", type: "lunar", summary: "The closest off-world destination with harsh thermal swings and long lunar nights.", description: "A high-value test bed for surface operations, geological analysis, and long-duration autonomy.", environmentalConditions: { gravity: 0.165, temperature: -20, atmosphere: "vacuum", radiation: "high" }, distanceAu: 0.00257, travelTimeDays: 3, scientificValue: 5, risk: 0.25 },
            { id: "mars", name: "Mars", type: "planetary", summary: "A dusty desert world with seasonal changes and major exploration potential.", description: "Prolonged mission planning, harsh dust cycles, and diverse terrain make Mars a classic long-range mission target.", environmentalConditions: { gravity: 0.38, temperature: -60, atmosphere: "thin carbon dioxide", radiation: "high" }, distanceAu: 1.52, travelTimeDays: 210, scientificValue: 8, risk: 0.35 },
            { id: "venus", name: "Venus", type: "planetary", summary: "Extremely hot and dense atmosphere with major atmospheric science value.", description: "A difficult but rewarding atmosphere physics target with severe thermal and pressure stresses.", environmentalConditions: { gravity: 0.91, temperature: 465, atmosphere: "dense co2", radiation: "moderate" }, distanceAu: 0.72, travelTimeDays: 120, scientificValue: 7, risk: 0.5 },
            { id: "mercury", name: "Mercury", type: "planetary", summary: "High solar flux and dramatic temperature swings create difficult mission conditions.", description: "An intense inner-planet science target for composition, surface geology, and solar exposure studies.", environmentalConditions: { gravity: 0.38, temperature: 167, atmosphere: "vacuum", radiation: "severe" }, distanceAu: 0.39, travelTimeDays: 150, scientificValue: 7, risk: 0.55 },
            { id: "jupiter", name: "Jupiter", type: "gas-giant", summary: "A deeply challenging giant planet environment with extreme radiation.", description: "Radiation, magnetism, and atmospheric dynamics make Jupiter ideal for high-risk science missions.", environmentalConditions: { gravity: 2.53, temperature: -110, atmosphere: "hydrogen-helium", radiation: "extreme" }, distanceAu: 5.2, travelTimeDays: 1800, scientificValue: 9, risk: 0.7 },
            { id: "europa", name: "Europa", type: "moon", summary: "An icy ocean world with high astrobiology value and severe radiation.", description: "The surface is heavily irradiated and geologically uncertain, but the subsurface ocean is scientifically compelling.", environmentalConditions: { gravity: 0.134, temperature: -160, atmosphere: "thin oxygen", radiation: "extreme" }, distanceAu: 5.2, travelTimeDays: 1900, scientificValue: 10, risk: 0.75 },
            { id: "ganymede", name: "Ganymede", type: "moon", summary: "The largest moon in the solar system with complex magnetics and icy terrain.", description: "A strong target for planetary magnetism and shell composition studies.", environmentalConditions: { gravity: 0.146, temperature: -163, atmosphere: "vacuum", radiation: "high" }, distanceAu: 5.2, travelTimeDays: 1800, scientificValue: 8, risk: 0.6 },
            { id: "saturn", name: "Saturn", type: "gas-giant", summary: "Long-range mission planning with a narrow window to the giant planet and its satellites.", description: "Excellent for ring and moon studies, requiring high-power communications and deep-space navigation.", environmentalConditions: { gravity: 1.06, temperature: -178, atmosphere: "hydrogen-helium", radiation: "severe" }, distanceAu: 9.58, travelTimeDays: 2600, scientificValue: 9, risk: 0.75 },
            { id: "titan", name: "Titan", type: "moon", summary: "A methane-rich atmosphere and complex chemistry make Titan a uniquely strange destination.", description: "An excellent atmospheric chemistry and prebiotic environment target, with major engineering complexity.", environmentalConditions: { gravity: 0.138, temperature: -179, atmosphere: "nitrogen-methane", radiation: "moderate" }, distanceAu: 9.58, travelTimeDays: 2600, scientificValue: 9, risk: 0.7 },
            { id: "enceladus", name: "Enceladus", type: "moon", summary: "Plumes of water-rich material erupt from the icy moon, making it highly attractive for ice-sample science.", description: "A strategic science target for plume-sampling and subsurface oceans.", environmentalConditions: { gravity: 0.011, temperature: -201, atmosphere: "exosphere", radiation: "moderate" }, distanceAu: 9.58, travelTimeDays: 2600, scientificValue: 10, risk: 0.8 },
            { id: "asteroids", name: "Asteroids", type: "small-body", summary: "Primitive bodies with resource potential and significant early-solar-system value.", description: "High value for composition, resource prospecting, and autonomous operation in microgravity.", environmentalConditions: { gravity: 0.001, temperature: -73, atmosphere: "vacuum", radiation: "moderate" }, distanceAu: 2.5, travelTimeDays: 400, scientificValue: 8, risk: 0.4 },
            { id: "near-earth-object", name: "Near-Earth Object", type: "small-body", summary: "Small-body destination with comparatively short travel times and strong prospecting science.", description: "A practical target for early exploration, asteroid rendezvous, and resource studies.", environmentalConditions: { gravity: 0.002, temperature: -30, atmosphere: "vacuum", radiation: "moderate" }, distanceAu: 0.1, travelTimeDays: 120, scientificValue: 7, risk: 0.3 },
            { id: "sun", name: "Sun", type: "star", summary: "A near-Sun mission for solar plasma and high-energy radiation analysis.", description: "High-risk and highly specialized mission type requiring extreme thermal design and solar shielding.", environmentalConditions: { gravity: 274, temperature: 5500, atmosphere: "plasma", radiation: "extreme" }, distanceAu: 0, travelTimeDays: 30, scientificValue: 10, risk: 0.9 },
        ];

        const objectiveDefinitions = [
            { id: "surface-exploration", name: "Surface Exploration", category: "mobility", summary: "Traverse terrain and map a destination surface.", description: "Navigate over rocky terrain, create route knowledge, and establish a reliable surface survey program.", requiredInstrumentIds: ["cameras"], communicationRequirements: { relayRequired: true }, completionConditions: ["surface route completed", "terrain map generated"], preferredArchitectures: ["rover", "lander", "autonomous-research-probe"] },
            { id: "geological-investigation", name: "Geological Investigation", category: "science", summary: "Study rock, ice, and soil composition.", description: "Combines instrumentation, sample handling, and field analysis to interpret the geological history of a world.", requiredInstrumentIds: ["spectrometer", "laser-altimeter"], communicationRequirements: { minDataRateMbps: 10 }, completionConditions: ["samples catalogued", "geology report complete"], preferredArchitectures: ["rover", "lander", "sample-return"] },
            { id: "atmospheric-analysis", name: "Atmospheric Analysis", category: "science", summary: "Measure atmospheric composition, cloud motion, and thermal structure.", description: "Assess the physical and chemical makeup of a destination atmosphere to interpret climate and weather.", requiredInstrumentIds: ["atmospheric-analyser", "infrared-spectrometer"], communicationRequirements: { minDataRateMbps: 8 }, completionConditions: ["atmospheric profile recorded", "composition model updated"], preferredArchitectures: ["atmospheric-probe", "orbiter"] },
            { id: "water-ice-detection", name: "Water or Ice Detection", category: "science", summary: "Find subsurface or plume water or ice sources.", description: "Targets plumes, cavities, or subsurface deposits where water or ice may be present.", requiredInstrumentIds: ["radar-sounder", "thermal-sensor"], communicationRequirements: { minDataRateMbps: 6 }, completionConditions: ["water signature confirmed", "ice map generated"], preferredArchitectures: ["rover", "orbiter", "sample-return"] },
            { id: "mineral-composition", name: "Mineral Composition", category: "science", summary: "Characterize a destination's elemental and mineral makeup.", description: "Determine whether elements and minerals match scientific expectations for a world or body.", requiredInstrumentIds: ["spectrometer", "microscopic-imager"], communicationRequirements: { minDataRateMbps: 8 }, completionConditions: ["mineral map generated", "specimen assay complete"], preferredArchitectures: ["rover", "lander", "autonomous-research-probe"] },
            { id: "magnetic-field-investigation", name: "Magnetic Field Investigation", category: "science", summary: "Measure magnetic fields and plasma interactions.", description: "Map field structure to infer interior composition and atmospheric or plasma dynamics.", requiredInstrumentIds: ["magnetometer", "plasma-analyser"], communicationRequirements: { minDataRateMbps: 10 }, completionConditions: ["field survey recorded", "magnetic anomaly mapped"], preferredArchitectures: ["orbiter", "flyby-probe", "relay-spacecraft"] },
            { id: "radiation-measurement", name: "Radiation Measurement", category: "science", summary: "Measure the radiation environment and shielding threat.", description: "Build dose models and quantify the dangers of unshielded operations.", requiredInstrumentIds: ["radiation-detector", "thermal-sensor"], communicationRequirements: { minDataRateMbps: 6 }, completionConditions: ["radiation profile logged", "dose model produced"], preferredArchitectures: ["orbiter", "flyby-probe", "space-telescope"] },
            { id: "seismic-monitoring", name: "Seismic Monitoring", category: "science", summary: "Track internal activity and geophysical instability.", description: "Use local seismic observations to understand a world beneath its surface.", requiredInstrumentIds: ["seismometer", "laser-altimeter"], communicationRequirements: { minDataRateMbps: 8 }, completionConditions: ["seismic baseline captured", "event log archived"], preferredArchitectures: ["lander", "rover", "autonomous-research-probe"] },
            { id: "sample-collection", name: "Sample Collection", category: "science", summary: "Collect, store, and return surface or atmospheric samples.", description: "Consolidate scientific materials and preserve them for analysis or return.", requiredInstrumentIds: ["robotic-arm", "drill"], communicationRequirements: { minDataRateMbps: 8 }, completionConditions: ["sample acquired", "storage integrity confirmed"], preferredArchitectures: ["sample-return", "rover", "lander"] },
            { id: "planetary-imaging", name: "Planetary Imaging", category: "science", summary: "Capture detailed views of the destination and its environments.", description: "Map changes in terrain, atmosphere, weather, and the local environment over time.", requiredInstrumentIds: ["cameras", "infrared-spectrometer"], communicationRequirements: { minDataRateMbps: 7 }, completionConditions: ["image mosaic complete", "surface features annotated"], preferredArchitectures: ["orbiter", "rover", "space-telescope"] },
            { id: "astrobiology-related-environmental-investigation", name: "Astrobiology Environmental Investigation", category: "science", summary: "Evaluate chemistry and environments for biological potential.", description: "Measure habitability indicators and the chemistry that may support biosignatures.", requiredInstrumentIds: ["atmospheric-analyser", "microscopic-imager"], communicationRequirements: { minDataRateMbps: 9 }, completionConditions: ["biosignature scan complete", "environmental model updated"], preferredArchitectures: ["orbiter", "lander", "autonomous-research-probe"] },
            { id: "orbital-observation", name: "Orbital Observation", category: "science", summary: "Study the destination from orbit and build survey data.", description: "Document large-scale features and changes over time using orbital reconnaissance.", requiredInstrumentIds: ["cameras", "infrared-spectrometer"], communicationRequirements: { minDataRateMbps: 10 }, completionConditions: ["orbital pass complete", "regional survey archived"], preferredArchitectures: ["orbiter", "space-telescope", "relay-spacecraft"] },
            { id: "space-weather-monitoring", name: "Space Weather Monitoring", category: "science", summary: "Observe solar storms and environment-driven magnetic events.", description: "Track solar fluctuations and plasma interactions affecting spacecraft and mission systems.", requiredInstrumentIds: ["radiation-detector", "magnetometer"], communicationRequirements: { minDataRateMbps: 8 }, completionConditions: ["space weather event captured", "forecast model refined"], preferredArchitectures: ["orbiter", "flyby-probe", "communications-satellite"] },
        ];

        const architectureDefinitions = [
            { id: "orbiter", name: "Orbiter", missionClass: "orbital", maxPayloadMassKg: 1100, componentSlots: { propulsion: 1, power: 1, science: 4, communications: 1, navigation: 1, thermal: 1 }, compatibleObjectives: ["orbital-observation", "radiation-measurement", "magnetic-field-investigation", "space-weather-monitoring"] },
            { id: "rover", name: "Rover", missionClass: "surface", maxPayloadMassKg: 520, componentSlots: { chassis: 1, power: 1, science: 3, communications: 1, navigation: 1, thermal: 1 }, compatibleObjectives: ["surface-exploration", "geological-investigation", "water-ice-detection", "sample-collection"] },
            { id: "lander", name: "Lander", missionClass: "surface", maxPayloadMassKg: 780, componentSlots: { propulsion: 1, power: 1, science: 4, communications: 1, navigation: 1, thermal: 1 }, compatibleObjectives: ["seismic-monitoring", "sample-collection", "planetary-imaging", "astrobiology-related-environmental-investigation"] },
            { id: "flyby-probe", name: "Flyby Probe", missionClass: "trajectory", maxPayloadMassKg: 360, componentSlots: { propulsion: 1, power: 1, science: 3, communications: 1, navigation: 1 }, compatibleObjectives: ["magnetic-field-investigation", "radiation-measurement", "space-weather-monitoring"] },
            { id: "atmospheric-probe", name: "Atmospheric Probe", missionClass: "atmospheric", maxPayloadMassKg: 480, componentSlots: { propulsion: 1, power: 1, science: 3, communications: 1, navigation: 1, thermal: 1 }, compatibleObjectives: ["atmospheric-analysis", "planetary-imaging", "water-ice-detection"] },
            { id: "sample-return", name: "Sample Return", missionClass: "sample-return", maxPayloadMassKg: 920, componentSlots: { propulsion: 1, power: 1, science: 4, communications: 1, navigation: 1, thermal: 1, storage: 1 }, compatibleObjectives: ["sample-collection", "geological-investigation", "water-ice-detection", "mineral-composition"] },
            { id: "space-telescope", name: "Space Telescope", missionClass: "observatory", maxPayloadMassKg: 1500, componentSlots: { power: 1, science: 4, communications: 1, navigation: 1, thermal: 1 }, compatibleObjectives: ["planetary-imaging", "orbital-observation", "space-weather-monitoring"] },
            { id: "communications-satellite", name: "Communications Satellite", missionClass: "relay", maxPayloadMassKg: 520, componentSlots: { power: 1, science: 2, communications: 1, navigation: 1, thermal: 1 }, compatibleObjectives: ["space-weather-monitoring", "orbital-observation", "surface-exploration"] },
            { id: "cubesat", name: "CubeSat", missionClass: "small-sat", maxPayloadMassKg: 140, componentSlots: { power: 1, science: 2, communications: 1, navigation: 1 }, compatibleObjectives: ["orbital-observation", "radiation-measurement", "water-ice-detection"] },
            { id: "relay-spacecraft", name: "Relay Spacecraft", missionClass: "relay", maxPayloadMassKg: 700, componentSlots: { propulsion: 1, power: 1, science: 2, communications: 1, navigation: 1, thermal: 1 }, compatibleObjectives: ["orbital-observation", "surface-exploration", "magnetic-field-investigation"] },
            { id: "autonomous-research-probe", name: "Autonomous Research Probe", missionClass: "autonomous", maxPayloadMassKg: 350, componentSlots: { propulsion: 1, power: 1, science: 3, communications: 1, navigation: 1, thermal: 1 }, compatibleObjectives: ["surface-exploration", "geological-investigation", "astrobiology-related-environmental-investigation", "water-ice-detection"] },
        ];

        const componentCatalog = [
            { id: "chemical-propulsion", category: "propulsionSystems", name: "Chemical Propulsion", massKg: 410, powerDrawW: 45, compatibleArchitectureIds: ["orbiter", "lander", "sample-return", "atmospheric-probe"] },
            { id: "electric-propulsion", category: "propulsionSystems", name: "Electric Propulsion", massKg: 240, powerDrawW: 110, compatibleArchitectureIds: ["orbiter", "flyby-probe", "relay-spacecraft", "autonomous-research-probe"] },
            { id: "ion-propulsion", category: "propulsionSystems", name: "Ion Propulsion", massKg: 180, powerDrawW: 140, compatibleArchitectureIds: ["orbiter", "flyby-probe", "sample-return"] },
            { id: "solar-sail", category: "propulsionSystems", name: "Solar Sail", massKg: 75, powerDrawW: 10, compatibleArchitectureIds: ["orbiter", "cubesat", "relay-spacecraft"] },
            { id: "hybrid-propulsion", category: "propulsionSystems", name: "Hybrid Propulsion", massKg: 330, powerDrawW: 80, compatibleArchitectureIds: ["sample-return", "lander", "orbiter", "atmospheric-probe"] },
            { id: "gravity-assist-trajectory", category: "propulsionSystems", name: "Gravity-Assist Trajectory", massKg: 0, powerDrawW: 0, compatibleArchitectureIds: ["flyby-probe", "orbiter", "relay-spacecraft"] },
            { id: "solar-panels", category: "powerSystems", name: "Solar Panels", massKg: 90, powerOutputW: 600, compatibleArchitectureIds: ["orbiter", "rover", "communications-satellite", "relay-spacecraft", "cubesat"] },
            { id: "batteries", category: "powerSystems", name: "Batteries", massKg: 110, powerOutputW: 250, compatibleArchitectureIds: ["lander", "rover", "sample-return", "autonomous-research-probe", "atmospheric-probe"] },
            { id: "radioisotope-power", category: "powerSystems", name: "Radioisotope Power", massKg: 210, powerOutputW: 420, compatibleArchitectureIds: ["flyby-probe", "orbiter", "lander", "autonomous-research-probe"] },
            { id: "hybrid-power", category: "powerSystems", name: "Hybrid Power", massKg: 180, powerOutputW: 720, compatibleArchitectureIds: ["sample-return", "lander", "orbiter", "relay-spacecraft"] },
            { id: "high-gain-antenna", category: "communicationsSystems", name: "High-Gain Antenna", massKg: 30, powerDrawW: 18, dataRateMbps: 120, supportedBands: ["x-band", "ka-band"], compatibleArchitectureIds: ["orbiter", "space-telescope", "sample-return", "relay-spacecraft"] },
            { id: "low-gain-antenna", category: "communicationsSystems", name: "Low-Gain Antenna", massKg: 14, powerDrawW: 8, dataRateMbps: 5, supportedBands: ["s-band"], compatibleArchitectureIds: ["rover", "lander", "autonomous-research-probe", "communications-satellite"] },
            { id: "relay-communications", category: "communicationsSystems", name: "Relay Communications", massKg: 22, powerDrawW: 16, dataRateMbps: 60, relayCapable: true, supportedBands: ["s-band", "x-band"], compatibleArchitectureIds: ["orbiter", "relay-spacecraft", "rover", "lander"] },
            { id: "direct-earth-communication", category: "communicationsSystems", name: "Direct-to-Earth Communication", massKg: 18, powerDrawW: 15, dataRateMbps: 80, supportedBands: ["x-band", "ka-band"], compatibleArchitectureIds: ["flyby-probe", "orbiter", "space-telescope"] },
            { id: "cameras", category: "instruments", name: "Cameras", massKg: 12, powerDrawW: 18, compatibleArchitectureIds: ["orbiter", "rover", "lander", "flyby-probe", "atmospheric-probe", "space-telescope", "autonomous-research-probe"] },
            { id: "infrared-spectrometer", category: "instruments", name: "Infrared Spectrometer", massKg: 20, powerDrawW: 26, compatibleArchitectureIds: ["orbiter", "rover", "lander", "space-telescope", "atmospheric-probe"] },
            { id: "radar-sounder", category: "instruments", name: "Radar Sounder", massKg: 24, powerDrawW: 20, compatibleArchitectureIds: ["orbiter", "rover", "lander", "autonomous-research-probe"] },
            { id: "magnetometer", category: "instruments", name: "Magnetometer", massKg: 15, powerDrawW: 12, compatibleArchitectureIds: ["orbiter", "flyby-probe", "relay-spacecraft", "communications-satellite"] },
            { id: "radiation-detector", category: "instruments", name: "Radiation Detector", massKg: 10, powerDrawW: 10, compatibleArchitectureIds: ["orbiter", "flyby-probe", "communications-satellite", "space-telescope"] },
            { id: "thermal-sensor", category: "instruments", name: "Thermal Sensor", massKg: 8, powerDrawW: 9, compatibleArchitectureIds: ["orbiter", "rover", "lander", "atmospheric-probe", "autonomous-research-probe"] },
            { id: "atmospheric-analyser", category: "instruments", name: "Atmospheric Analyser", massKg: 26, powerDrawW: 32, compatibleArchitectureIds: ["atmospheric-probe", "orbiter", "lander"] },
            { id: "seismometer", category: "instruments", name: "Seismometer", massKg: 18, powerDrawW: 12, compatibleArchitectureIds: ["lander", "rover", "autonomous-research-probe"] },
            { id: "laser-altimeter", category: "instruments", name: "Laser Altimeter", massKg: 16, powerDrawW: 14, compatibleArchitectureIds: ["orbiter", "rover", "lander", "sample-return"] },
            { id: "spectrometer", category: "instruments", name: "Spectrometer", massKg: 18, powerDrawW: 22, compatibleArchitectureIds: ["rover", "lander", "sample-return", "autonomous-research-probe", "orbiter"] },
            { id: "robotic-arm", category: "instruments", name: "Robotic Arm", massKg: 30, powerDrawW: 55, compatibleArchitectureIds: ["rover", "lander", "sample-return", "autonomous-research-probe"] },
            { id: "drill", category: "instruments", name: "Drill", massKg: 42, powerDrawW: 60, compatibleArchitectureIds: ["rover", "lander", "sample-return", "autonomous-research-probe"] },
            { id: "microscopic-imager", category: "instruments", name: "Microscopic Imager", massKg: 16, powerDrawW: 18, compatibleArchitectureIds: ["rover", "lander", "autonomous-research-probe"] },
            { id: "dust-analyser", category: "instruments", name: "Dust Analyser", massKg: 14, powerDrawW: 12, compatibleArchitectureIds: ["orbiter", "lander", "rover", "autonomous-research-probe"] },
            { id: "plasma-analyser", category: "instruments", name: "Plasma Analyser", massKg: 12, powerDrawW: 11, compatibleArchitectureIds: ["orbiter", "flyby-probe", "relay-spacecraft", "communications-satellite"] },
            { id: "passive-radiator", category: "thermalSystems", name: "Passive Radiator", massKg: 60, powerDrawW: 0, compatibleArchitectureIds: ["orbiter", "rover", "lander", "space-telescope", "communications-satellite"] },
            { id: "active-thermal-loop", category: "thermalSystems", name: "Active Thermal Loop", massKg: 90, powerDrawW: 50, compatibleArchitectureIds: ["sample-return", "lander", "atmospheric-probe", "orbiter"] },
            { id: "cryogenic-control", category: "thermalSystems", name: "Cryogenic Control", massKg: 65, powerDrawW: 30, compatibleArchitectureIds: ["atmospheric-probe", "lander", "orbiter", "autonomous-research-probe"] },
            { id: "star-tracker", category: "navigationSystems", name: "Star Tracker", massKg: 10, powerDrawW: 8, compatibleArchitectureIds: ["orbiter", "flyby-probe", "space-telescope", "sample-return", "relay-spacecraft"] },
            { id: "inertial-navigation", category: "navigationSystems", name: "Inertial Navigation", massKg: 18, powerDrawW: 15, compatibleArchitectureIds: ["rover", "lander", "autonomous-research-probe", "atmospheric-probe"] },
            { id: "deep-space-navigation", category: "navigationSystems", name: "Deep-Space Navigation", massKg: 12, powerDrawW: 9, compatibleArchitectureIds: ["orbiter", "flyby-probe", "relay-spacecraft"] },
        ];

        const entries = [
            { category: "destinations", definitions: destinationDefinitions },
            { category: "objectives", definitions: objectiveDefinitions },
            { category: "architectures", definitions: architectureDefinitions },
            { category: "propulsionSystems", definitions: componentCatalog.filter((item) => item.category === "propulsionSystems") },
            { category: "powerSystems", definitions: componentCatalog.filter((item) => item.category === "powerSystems") },
            { category: "communicationsSystems", definitions: componentCatalog.filter((item) => item.category === "communicationsSystems") },
            { category: "instruments", definitions: componentCatalog.filter((item) => item.category === "instruments") },
            { category: "thermalSystems", definitions: componentCatalog.filter((item) => item.category === "thermalSystems") },
            { category: "navigationSystems", definitions: componentCatalog.filter((item) => item.category === "navigationSystems") },
        ];

        entries.forEach(({ category, definitions }) => {
            const existingIds = new Set((catalogs.list(category) || []).map((entry) => entry.id));
            definitions.forEach((definition) => {
                if (existingIds.has(definition.id)) return;
                catalogs.register(category, {
                    ...definition,
                    name: toName(definition.name, "Catalog Entry"),
                    id: toId(definition.id, category),
                });
                existingIds.add(definition.id);
            });
        });

        return true;
    }

    function normalizeMissionDraft(mission) {
        if (!isRecord(mission)) {
            throw new TypeError("Mission data must be an object.");
        }
        const primaryId = typeof mission.objectives?.primaryId === "string" ? mission.objectives.primaryId : null;
        const secondaryIds = Array.isArray(mission.objectives?.secondaryIds)
            ? mission.objectives.secondaryIds.filter((id) => typeof id === "string")
            : [];
        const objectiveIds = [primaryId, ...secondaryIds].filter(Boolean);
        return { ...clone(mission), objectiveIds };
    }

    function getMissionInfo(mission) {
        const record = normalizeMissionDraft(mission || window.BeyondEarthMissionManager?.getActiveMission?.());
        const destination = record.destination?.id
            ? window.BeyondEarthCatalogs.get("destinations", record.destination.id)
            : null;
        const objectiveList = record.objectiveIds.map((id) => window.BeyondEarthCatalogs.get("objectives", id)).filter(Boolean);
        const architecture = record.spacecraft?.architectureId
            ? window.BeyondEarthCatalogs.get("architectures", record.spacecraft.architectureId)
            : null;
        return {
            mission: record,
            destination,
            objectives: objectiveList,
            architecture,
        };
    }

    function createMissionDraft(options = {}) {
        if (!isRecord(options)) {
            throw new TypeError("Mission draft options must be an object.");
        }
        const draft = window.BeyondEarthMissionManager.createMission({
            name: toName(options.name, "Untitled Mission"),
            missionType: typeof options.missionType === "string" ? options.missionType : null,
        });

        if (typeof options.destinationId === "string" && options.destinationId.trim()) {
            draft.destination.id = options.destinationId.trim();
        }
        if (typeof options.primaryObjectiveId === "string" && options.primaryObjectiveId.trim()) {
            draft.objectives.primaryId = options.primaryObjectiveId.trim();
        }
        if (Array.isArray(options.secondaryObjectiveIds)) {
            draft.objectives.secondaryIds = options.secondaryObjectiveIds
                .filter((id) => typeof id === "string" && id.trim())
                .map((id) => id.trim());
        }
        if (typeof options.architectureId === "string" && options.architectureId.trim()) {
            draft.spacecraft.architectureId = options.architectureId.trim();
        }
        if (Array.isArray(options.scientificInstrumentIds)) {
            draft.spacecraft.scientificInstrumentIds = options.scientificInstrumentIds
                .filter((id) => typeof id === "string" && id.trim())
                .map((id) => id.trim());
        }
        if (typeof options.powerSystemId === "string" && options.powerSystemId.trim()) {
            draft.spacecraft.powerSystemId = options.powerSystemId.trim();
        }
        if (typeof options.propulsionSystemId === "string" && options.propulsionSystemId.trim()) {
            draft.spacecraft.propulsionSystemId = options.propulsionSystemId.trim();
        }
        if (typeof options.communicationsSystemId === "string" && options.communicationsSystemId.trim()) {
            draft.spacecraft.communicationsSystemId = options.communicationsSystemId.trim();
        }
        if (typeof options.thermalSystemId === "string" && options.thermalSystemId.trim()) {
            draft.spacecraft.thermalSystemId = options.thermalSystemId.trim();
        }
        if (typeof options.navigationSystemId === "string" && options.navigationSystemId.trim()) {
            draft.spacecraft.navigationSystemId = options.navigationSystemId.trim();
        }
        if (isRecord(options.planning)) {
            draft.planning = { ...draft.planning, ...clone(options.planning) };
        }
        if (isRecord(options.resources)) {
            draft.resources = { ...draft.resources, ...clone(options.resources) };
        }
        return draft;
    }

    function saveActiveDraft(options = {}) {
        const draft = createMissionDraft(options);
        return window.BeyondEarthMissionManager.saveMission(draft);
    }

    function listDestinations() {
        ensureCatalogs();
        return window.BeyondEarthCatalogs.list("destinations");
    }

    function listObjectives() {
        ensureCatalogs();
        return window.BeyondEarthCatalogs.list("objectives");
    }

    function listArchitectures() {
        ensureCatalogs();
        return window.BeyondEarthCatalogs.list("architectures");
    }

    function buildReview(mission = null) {
        ensureCatalogs();
        const target = mission || window.BeyondEarthMissionManager.getActiveMission();
        if (!target) {
            throw new Error("A mission draft is required before it can be reviewed.");
        }
        const compatibility = window.BeyondEarthCompatibility.evaluateDesign({
            destinationId: target.destination?.id || null,
            objectiveIds: [target.objectives?.primaryId, ...((target.objectives?.secondaryIds || []) || [])].filter(Boolean),
            spacecraft: target.spacecraft || {},
        });
        return {
            status: compatibility.status,
            compatible: compatibility.status !== "incompatible",
            readyForApproval: compatibility.status !== "incompatible",
            issues: compatibility.issues || [],
            metrics: compatibility.metrics || {},
            recommendation: compatibility.status === "suitable"
                ? "Mission architecture is feasible and ready for approval."
                : compatibility.status === "conditional"
                    ? "Mission is feasible but should be reviewed for cost and risk before approval."
                    : "Mission design needs revision before launch approval.",
        };
    }

    function approveMission() {
        const active = window.BeyondEarthMissionManager.getActiveMission();
        if (!active) {
            throw new Error("No active mission draft is available to approve.");
        }
        const review = buildReview(active);
        if (review.status === "incompatible") {
            throw new Error("Mission design cannot be approved until all hard compatibility issues are resolved.");
        }
        return window.BeyondEarthMissionManager.approveMission();
    }

    function setMissionStage(stageId, patch = {}) {
        if (stageId !== null && (typeof stageId !== "string" || !stageId.trim())) {
            throw new TypeError("Mission stage IDs must be non-empty strings or null.");
        }
        const mission = window.BeyondEarthMissionManager.getActiveMission();
        if (!mission) {
            throw new Error("There is no active mission to update.");
        }
        return window.BeyondEarthMissionManager.updateActiveMission((draft) => {
            draft.currentStage = stageId ? stageId.trim() : null;
            if (isRecord(patch)) {
                if (patch.destination && isRecord(patch.destination)) {
                    draft.destination = { ...draft.destination, ...clone(patch.destination) };
                }
                if (patch.objectives && isRecord(patch.objectives)) {
                    draft.objectives = { ...draft.objectives, ...clone(patch.objectives) };
                }
                if (patch.spacecraft && isRecord(patch.spacecraft)) {
                    draft.spacecraft = { ...draft.spacecraft, ...clone(patch.spacecraft) };
                }
                if (patch.planning && isRecord(patch.planning)) {
                    draft.planning = { ...draft.planning, ...clone(patch.planning) };
                }
                if (patch.resources && isRecord(patch.resources)) {
                    draft.resources = { ...draft.resources, ...clone(patch.resources) };
                }
            }
            return draft;
        });
    }

    function seedDefaults() {
        ensureCatalogs();
        return {
            destinations: listDestinations(),
            objectives: listObjectives(),
            architectures: listArchitectures(),
        };
    }

    const builder = Object.freeze({
        approveMission,
        buildReview,
        createMissionDraft,
        listArchitectures,
        listDestinations,
        listObjectives,
        saveActiveDraft,
        seedDefaults,
        setMissionStage,
    });

    window.BeyondEarthMissionBuilder = builder;
    window.BeyondEarthMissionCreator = builder;
    seedDefaults();
})();
