document.getElementById('moveSound').src = "Sound/click.mp3";
document.getElementById('winSound').src = "Sound/win.mp3";
document.getElementById('drawSound').src = "Sound/draw.mp3";

const boardEl = document.getElementById('board');
const statusText = document.getElementById('statusText');
const movesLog = document.getElementById('movesLog');
const xScoreEl = document.getElementById('xScore');
const oScoreEl = document.getElementById('oScore');
const drawScoreEl = document.getElementById('drawScore');
const xNameTitle = document.getElementById('xNameTitle');
const oNameTitle = document.getElementById('oNameTitle');
const modeDisplay = document.getElementById('modeDisplay');
const difficultyDisplay = document.getElementById('difficultyDisplay');
const modal = document.getElementById('modal');
const openModalBtn = document.getElementById('openModalBtn');
const startGameBtn = document.getElementById('startGameBtn');
const resetBtn = document.getElementById('resetBtn');
const resetScoresBtn = document.getElementById('resetScores');
const undoBtn = document.getElementById('undoBtn');
const muteBtn = document.getElementById('muteBtn');
const moveSound = document.getElementById('moveSound');
const winSound = document.getElementById('winSound');
const drawSound = document.getElementById('drawSound');

let board = Array(9).fill('');
let currentPlayer = 'X';
let running = false;
let mode = 'pvp';
let difficulty = 'medium';
let xName = 'Player X', oName = 'Player O';
let scores = { X: 0, O: 0, D: 0 };
let history = [];
let muted = false;

function saveState() {
    localStorage.setItem('ttt_names', JSON.stringify({ x: xName, o: oName }));
    localStorage.setItem('ttt_scores', JSON.stringify(scores));
    localStorage.setItem('ttt_mode', mode);
    localStorage.setItem('ttt_difficulty', difficulty);
}
function loadState() {
    try {
        const n = JSON.parse(localStorage.getItem('ttt_names'));
        const s = JSON.parse(localStorage.getItem('ttt_scores'));
        const m = localStorage.getItem('ttt_mode');
        const d = localStorage.getItem('ttt_difficulty');
        if (n) { xName = n.x || xName; oName = n.o || oName; }
        if (s) { scores = s; }
        if (m) mode = m;
        if (d) difficulty = d;
    } catch (e) { }
}
function playSound(el) { if (!muted) el.play().catch(() => { }); }

function renderBoard() {
    boardEl.innerHTML = '';
    board.forEach((cell, i) => {
        const div = document.createElement('div');
        div.className = 'cell' + (cell ? ' disabled' : '')
        div.dataset.index = i;
        div.innerHTML = cell || '';
        div.addEventListener('click', onCellClick);
        boardEl.appendChild(div);
    });
}
function updateUI() {
    document.getElementById('xScore').textContent = scores.X;
    document.getElementById('oScore').textContent = scores.O;
    document.getElementById('drawScore').textContent = scores.D;
    xNameTitle.textContent = xName;
    oNameTitle.textContent = oName;
    modeDisplay.textContent = mode === 'ai' ? 'Vs Computer' : 'Two Player';
    difficultyDisplay.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}
function setStatus(text) { statusText.textContent = text; }
function cellElements() { return Array.from(document.querySelectorAll('.cell')); }
function highlightWin(indices) {
    cellElements().forEach((el, idx) => {
        if (indices.includes(idx)) {
            el.classList.add('win');
        }
    });
}

const winLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];
function checkWinner() {
    for (const line of winLines) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a], line };
    }
    if (board.every(v => v)) return { winner: 'draw' };
    return null;
}

function onCellClick(e) {
    const idx = Number(e.currentTarget.dataset.index);
    if (!running) return;
    if (board[idx]) return;
    makeMove(idx, currentPlayer);
}

function makeMove(idx, player) {
    board[idx] = player;
    history.push({ idx, player });
    renderBoard();
    playSound(moveSound);
    logMove(player, idx);
    const res = checkWinner();
    if (res) {
        running = false;
        if (res.winner === 'draw') {
            scores.D++;
            saveState();
            updateUI();
            setStatus("It's a draw!");
            playSound(drawSound);
        } else {
            scores[res.winner]++;
            saveState();
            updateUI();
            setStatus((res.winner === 'X' ? xName : oName) + ' wins!');
            highlightWin(res.line);
            playSound(winSound);
        }
        return;
    }

    function playSound(audio) {
        audio.currentTime = 0;
        audio.play();
        setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
        }, 2000);
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    setStatus((currentPlayer === 'X' ? xName : oName) + "'s turn (" + currentPlayer + ")");
    if (running && mode === 'ai' && currentPlayer === 'O') {
        setTimeout(() => aiMove(), 260);
    }
}

function aiMove() {
    if (difficulty === 'easy') {
        const avail = board.map((v, i) => v ? null : i).filter(v => v !== null);
        const choice = avail[Math.floor(Math.random() * avail.length)];
        makeMove(choice, 'O');
    } else if (difficulty === 'medium') {
        const choice = findWinningMove('O') ?? findWinningMove('X') ?? randomMove();
        makeMove(choice, 'O');
    }
}
function randomMove() { const avail = board.map((v, i) => v ? null : i).filter(v => v !== null); return avail[Math.floor(Math.random() * avail.length)]; }
function findWinningMove(player) {
    for (const line of winLines) {
        const [a, b, c] = line;
        const values = [board[a], board[b], board[c]];
        if (values.filter(v => v === player).length === 2 && values.includes('')) {
            const idx = line[values.indexOf('')];
            return idx;
        }
    }
    return null;
}

function logMove(player, idx) {
    const row = document.createElement('p');
    row.textContent = `${player} → ${idx + 1}`;
    movesLog.prepend(row);
}

undoBtn.addEventListener('click', () => {
    if (!history.length || !running) return;
    const last = history.pop();
    board[last.idx] = '';
    currentPlayer = last.player;
    renderBoard();
    setStatus((currentPlayer === 'X' ? xName : oName) + "'s turn (" + currentPlayer + ")");
});

resetBtn.addEventListener('click', () => {
    board = Array(9).fill('');
    running = true;
    history = [];
    renderBoard();
    currentPlayer = 'X';
    setStatus((currentPlayer === 'X' ? xName : oName) + "'s turn (" + currentPlayer + ")");
    movesLog.innerHTML = '';
});

resetScoresBtn.addEventListener('click', () => {
    if (('Reset all scores?')) {
        scores = { X: 0, O: 0, D: 0 };
        saveState();
        updateUI();
    }
});

openModalBtn.addEventListener('click', () => modal.style.display = 'flex');
startGameBtn.addEventListener('click', () => {
    const xIn = document.getElementById('xNameInput').value.trim() || 'Player X';
    let oIn = document.getElementById('oNameInput').value.trim() || 'Player O';
    const modeEl = document.querySelector('input[name="mode"]:checked').value;
    const diff = document.getElementById('difficulty').value;
    xName = xIn; oName = oIn; mode = modeEl; difficulty = diff;
    if (mode === 'ai') { if (!oIn) oName = 'Computer'; }
    saveState();
    updateUI();
    renderBoard();
    running = true;
    history = [];
    document.getElementById('movesLog').innerHTML = '';
    currentPlayer = 'X';
    setStatus((xName) + "'s turn (X)");
    modal.style.display = 'none';
});

document.getElementById("startGameBtn").addEventListener("click", function () {
    this.classList.add("started");
});
openModalBtn.addEventListener('click', function () {
    startGameBtn.classList.remove("started");
});

muteBtn.addEventListener('click', () => {
    muted = !muted;
    muteBtn.textContent = muted ? '🔇' : '🔊';
});

loadState();
updateUI();
renderBoard();
setStatus('Press "New Game" to start');