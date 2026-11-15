(() => {
    "use strict";

    const GRID_SIZE = 8;
    const BASE_TARGET = 1500;
    const BASE_MOVES = 20;
    const TILE_POINTS = 60;
    const CASCADE_DELAY_MS = 190;
    const TILE_TYPES = Object.freeze([
        Object.freeze({ id: "astronaut", name: "Astronaut", icon: "👩‍🚀" }),
        Object.freeze({ id: "rocket", name: "Rocket", icon: "🚀" }),
        Object.freeze({ id: "planet", name: "Planet", icon: "🪐" }),
        Object.freeze({ id: "star", name: "Star", icon: "⭐" }),
        Object.freeze({ id: "satellite", name: "Satellite", icon: "🛰️" }),
        Object.freeze({ id: "moon", name: "Moon", icon: "🌙" }),
    ]);
    const TYPE_BY_ID = new Map(TILE_TYPES.map((type) => [type.id, type]));

    const gameBoard = document.getElementById("gameBoard");
    const levelOutput = document.getElementById("level");
    const missionTitle = document.getElementById("missionTitle");
    const scoreOutput = document.getElementById("score");
    const targetOutput = document.getElementById("target");
    const movesOutput = document.getElementById("moves");
    const progressTrack = document.querySelector(".progress-track");
    const progressBar = document.getElementById("progressBar");
    const gameMessage = document.getElementById("gameMessage");
    const restartButton = document.getElementById("restartButton");
    const soundToggle = document.getElementById("soundToggle");
    const missionModal = document.getElementById("missionModal");
    const modalIcon = document.getElementById("modalIcon");
    const modalLabel = document.getElementById("modalLabel");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const modalReward = document.getElementById("modalReward");
    const modalAction = document.getElementById("modalAction");

    const state = {
        level: 1,
        target: BASE_TARGET,
        moves: BASE_MOVES,
        score: 0,
        board: [],
        selectedIndex: null,
        clearing: new Set(),
        falling: new Set(),
        isProcessing: false,
        isLocked: false,
        modalKind: null,
        soundEnabled: true,
        audioContext: null,
    };

    function delay(milliseconds) {
        return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
    }

    function coordinate(index) {
        return { row: Math.floor(index / GRID_SIZE), column: index % GRID_SIZE };
    }

    function indexAt(row, column) {
        return row * GRID_SIZE + column;
    }

    function swapTiles(board, firstIndex, secondIndex) {
        const first = coordinate(firstIndex);
        const second = coordinate(secondIndex);
        [board[first.row][first.column], board[second.row][second.column]] =
            [board[second.row][second.column], board[first.row][first.column]];
    }

    function findMatches(board) {
        const matched = new Set();

        for (let row = 0; row < GRID_SIZE; row += 1) {
            let column = 0;
            while (column < GRID_SIZE) {
                const kind = board[row][column];
                let end = column + 1;
                while (kind && end < GRID_SIZE && board[row][end] === kind) end += 1;
                if (kind && end - column >= 3) {
                    for (let current = column; current < end; current += 1) {
                        matched.add(indexAt(row, current));
                    }
                }
                column = end;
            }
        }

        for (let column = 0; column < GRID_SIZE; column += 1) {
            let row = 0;
            while (row < GRID_SIZE) {
                const kind = board[row][column];
                let end = row + 1;
                while (kind && end < GRID_SIZE && board[end][column] === kind) end += 1;
                if (kind && end - row >= 3) {
                    for (let current = row; current < end; current += 1) {
                        matched.add(indexAt(current, column));
                    }
                }
                row = end;
            }
        }

        return matched;
    }

    function hasPossibleMove(board) {
        for (let row = 0; row < GRID_SIZE; row += 1) {
            for (let column = 0; column < GRID_SIZE; column += 1) {
                const firstIndex = indexAt(row, column);
                const neighbours = [];
                if (column + 1 < GRID_SIZE) neighbours.push(indexAt(row, column + 1));
                if (row + 1 < GRID_SIZE) neighbours.push(indexAt(row + 1, column));

                for (const secondIndex of neighbours) {
                    swapTiles(board, firstIndex, secondIndex);
                    const createsMatch = findMatches(board).size > 0;
                    swapTiles(board, firstIndex, secondIndex);
                    if (createsMatch) return true;
                }
            }
        }
        return false;
    }

    function canPlaceWithoutMatch(board, row, column, kind) {
        return !(column >= 2 && board[row][column - 1] === kind && board[row][column - 2] === kind)
            && !(row >= 2 && board[row - 1][column] === kind && board[row - 2][column] === kind);
    }

    function createRandomBoard() {
        const board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
        for (let row = 0; row < GRID_SIZE; row += 1) {
            for (let column = 0; column < GRID_SIZE; column += 1) {
                const choices = TILE_TYPES.filter((type) => canPlaceWithoutMatch(board, row, column, type.id));
                const choice = choices[Math.floor(Math.random() * choices.length)];
                board[row][column] = choice.id;
            }
        }
        return board;
    }

    function createGuaranteedPlayableBoard() {
        const board = Array.from({ length: GRID_SIZE }, (_, row) =>
            Array.from({ length: GRID_SIZE }, (_, column) => TILE_TYPES[(row * 2 + column) % TILE_TYPES.length].id));
        board[0][0] = TILE_TYPES[0].id;
        board[0][1] = TILE_TYPES[1].id;
        board[0][2] = TILE_TYPES[0].id;
        board[1][1] = TILE_TYPES[0].id;
        if (findMatches(board).size || !hasPossibleMove(board)) {
            throw new Error("Could not create a match-free playable Cosmic Crush board.");
        }
        return board;
    }

    function createPlayableBoard() {
        for (let attempt = 0; attempt < 100; attempt += 1) {
            const board = createRandomBoard();
            if (!findMatches(board).size && hasPossibleMove(board)) return board;
        }
        return createGuaranteedPlayableBoard();
    }

    function updateStatistics() {
        scoreOutput.textContent = String(state.score);
        targetOutput.textContent = String(state.target);
        movesOutput.textContent = String(state.moves);
        levelOutput.textContent = String(state.level).padStart(2, "0");
        missionTitle.textContent = state.level === 1
            ? "Collect cosmic energy!"
            : `Collect cosmic energy! · Level ${String(state.level).padStart(2, "0")}`;
        const progress = Math.min(100, state.score / state.target * 100);
        progressBar.style.width = `${progress}%`;
        progressTrack.setAttribute("aria-valuemax", String(state.target));
        progressTrack.setAttribute("aria-valuenow", String(Math.max(0, Math.min(state.target, state.score))));
        restartButton.disabled = state.isProcessing;
        soundToggle.textContent = state.soundEnabled ? "SOUND ON" : "SOUND OFF";
        soundToggle.setAttribute("aria-pressed", String(state.soundEnabled));
    }

    function renderBoard() {
        const fragment = document.createDocumentFragment();
        for (let index = 0; index < GRID_SIZE * GRID_SIZE; index += 1) {
            const { row, column } = coordinate(index);
            const kind = state.board[row]?.[column] ?? null;
            const tile = document.createElement("button");
            tile.type = "button";
            tile.className = "game-tile";
            tile.setAttribute("role", "gridcell");
            tile.dataset.index = String(index);

            if (kind) {
                const type = TYPE_BY_ID.get(kind);
                if (!type) throw new Error(`Unknown Cosmic Crush tile type "${kind}".`);
                tile.dataset.kind = kind;
                tile.textContent = type.icon;
                tile.setAttribute("aria-label", `${type.name}, row ${row + 1}, column ${column + 1}`);
                if (index === state.selectedIndex) tile.classList.add("is-selected");
                if (state.clearing.has(index)) tile.classList.add("is-clearing");
                if (state.falling.has(index)) tile.classList.add("is-falling");
                tile.disabled = state.isProcessing || state.isLocked;
            } else {
                tile.classList.add("is-empty");
                tile.disabled = true;
                tile.setAttribute("aria-hidden", "true");
            }
            fragment.appendChild(tile);
        }
        gameBoard.replaceChildren(fragment);
    }

    function playMatchSound(combo) {
        if (!state.soundEnabled) return;
        const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextConstructor) return;
        if (!state.audioContext) {
            state.audioContext = new AudioContextConstructor();
        }
        if (state.audioContext.state === "suspended") {
            state.audioContext.resume().catch((error) => {
                gameMessage.textContent = `SOUND UNAVAILABLE: ${error.message}`;
            });
        }
        const startAt = state.audioContext.currentTime;
        const oscillator = state.audioContext.createOscillator();
        const gain = state.audioContext.createGain();
        const frequency = Math.min(980, 520 + (combo - 1) * 115);
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, startAt);
        oscillator.frequency.linearRampToValueAtTime(frequency + 105, startAt + 0.12);
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.linearRampToValueAtTime(0.045, startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.16);
        oscillator.connect(gain);
        gain.connect(state.audioContext.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.17);
    }

    function collapseColumns() {
        const falling = new Set();
        for (let column = 0; column < GRID_SIZE; column += 1) {
            let writeRow = GRID_SIZE - 1;
            for (let row = GRID_SIZE - 1; row >= 0; row -= 1) {
                if (state.board[row][column] !== null) {
                    if (row !== writeRow) {
                        state.board[writeRow][column] = state.board[row][column];
                        state.board[row][column] = null;
                        falling.add(indexAt(writeRow, column));
                    }
                    writeRow -= 1;
                }
            }
            while (writeRow >= 0) {
                state.board[writeRow][column] = TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)].id;
                falling.add(indexAt(writeRow, column));
                writeRow -= 1;
            }
        }
        return falling;
    }

    function showVictory() {
        state.isLocked = true;
        state.modalKind = "victory";
        modalIcon.textContent = "🏆";
        modalLabel.textContent = "MISSION COMPLETE";
        modalTitle.textContent = "Stellar work!";
        modalMessage.textContent = "You collected enough cosmic energy to power your spacecraft.";
        modalReward.hidden = false;
        modalReward.textContent = `SPACE POINTS +${state.score}`;
        modalAction.textContent = "NEXT LEVEL";
        missionModal.hidden = false;
        renderBoard();
    }

    function showGameOver() {
        state.isLocked = true;
        state.modalKind = "game-over";
        modalIcon.textContent = "⭐";
        modalLabel.textContent = "MISSION UPDATE";
        modalTitle.textContent = "Almost there!";
        modalMessage.textContent = `Your final score was ${state.score}. Try again to collect enough cosmic energy.`;
        modalReward.hidden = true;
        modalAction.textContent = "TRY AGAIN";
        missionModal.hidden = false;
        renderBoard();
    }

    async function resolveCascades(firstMatches) {
        let matches = firstMatches;
        let combo = 0;

        while (matches.size > 0) {
            combo += 1;
            const points = matches.size * TILE_POINTS * combo;
            state.score += points;
            state.clearing = matches;
            gameMessage.textContent = combo === 1
                ? "GREAT MATCH!"
                : combo === 2
                    ? "COMBO x2!"
                    : `NICE MATCH! KEEP GOING · COMBO x${combo}`;
            updateStatistics();
            playMatchSound(combo);
            renderBoard();
            await delay(CASCADE_DELAY_MS);

            for (const index of matches) {
                const { row, column } = coordinate(index);
                state.board[row][column] = null;
            }
            state.clearing = new Set();
            state.falling = collapseColumns();
            updateStatistics();
            renderBoard();
            await delay(CASCADE_DELAY_MS);
            state.falling = new Set();
            matches = findMatches(state.board);
        }
    }

    async function reshuffleBoard() {
        state.selectedIndex = null;
        state.isProcessing = true;
        gameMessage.textContent = "RESHUFFLING THE BOARD!";
        renderBoard();
        await delay(360);
        state.board = createPlayableBoard();
        state.isProcessing = false;
        gameMessage.textContent = "PICK A TILE TO BEGIN";
        updateStatistics();
        renderBoard();
    }

    function isAdjacent(firstIndex, secondIndex) {
        const first = coordinate(firstIndex);
        const second = coordinate(secondIndex);
        return Math.abs(first.row - second.row) + Math.abs(first.column - second.column) === 1;
    }

    async function attemptSwap(firstIndex, secondIndex) {
        state.isProcessing = true;
        state.selectedIndex = null;
        swapTiles(state.board, firstIndex, secondIndex);
        renderBoard();
        await delay(110);

        const matches = findMatches(state.board);
        if (!matches.size) {
            swapTiles(state.board, firstIndex, secondIndex);
            state.isProcessing = false;
            gameMessage.textContent = "NO MATCH! TRY AGAIN";
            renderBoard();
            return;
        }

        state.moves -= 1;
        updateStatistics();
        await resolveCascades(matches);
        state.isProcessing = false;

        if (state.score >= state.target) {
            showVictory();
            return;
        }
        if (state.moves <= 0) {
            showGameOver();
            return;
        }
        if (!hasPossibleMove(state.board)) {
            await reshuffleBoard();
            return;
        }

        gameMessage.textContent = "PICK A TILE TO BEGIN";
        updateStatistics();
        renderBoard();
    }

    function handleTileSelection(event) {
        const tile = event.target.closest(".game-tile");
        if (!tile || !gameBoard.contains(tile) || tile.disabled || state.isProcessing || state.isLocked) return;
        const index = Number(tile.dataset.index);
        if (!Number.isInteger(index)) return;

        if (state.selectedIndex === null) {
            state.selectedIndex = index;
            gameMessage.textContent = "NOW PICK A NEIGHBOUR";
            renderBoard();
            return;
        }

        if (state.selectedIndex === index) {
            state.selectedIndex = null;
            gameMessage.textContent = "PICK A TILE TO BEGIN";
            renderBoard();
            return;
        }

        if (!isAdjacent(state.selectedIndex, index)) {
            state.selectedIndex = index;
            gameMessage.textContent = "PICK A NEIGHBOUR";
            renderBoard();
            return;
        }

        attemptSwap(state.selectedIndex, index).catch((error) => {
            state.isProcessing = false;
            gameMessage.textContent = `GAME ERROR: ${error.message}`;
            updateStatistics();
            renderBoard();
            console.error("Cosmic Crush could not resolve a tile swap.", error);
        });
    }

    function startLevel(level) {
        state.level = level;
        state.target = BASE_TARGET + (level - 1) * 500;
        state.moves = BASE_MOVES + Math.min(level - 1, 5) * 2;
        state.score = 0;
        state.board = createPlayableBoard();
        state.selectedIndex = null;
        state.clearing = new Set();
        state.falling = new Set();
        state.isProcessing = false;
        state.isLocked = false;
        state.modalKind = null;
        missionModal.hidden = true;
        gameMessage.textContent = "PICK A TILE TO BEGIN";
        updateStatistics();
        renderBoard();
    }

    gameBoard.addEventListener("click", handleTileSelection);
    restartButton.addEventListener("click", () => {
        if (!state.isProcessing) startLevel(state.level);
    });
    soundToggle.addEventListener("click", () => {
        state.soundEnabled = !state.soundEnabled;
        updateStatistics();
    });
    modalAction.addEventListener("click", () => {
        if (state.modalKind === "victory") startLevel(state.level + 1);
        else if (state.modalKind === "game-over") startLevel(state.level);
    });

    startLevel(1);
})();
