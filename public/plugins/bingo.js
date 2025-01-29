const bingoOptions = [
    "Spammer", "Brainrot", "Slur Spam", "Message & Leave", "Alt",
    "Leave & Rejoin", "Stupidity", "Pedophilia", "Sexual", "Typo", 
    "CCSD", "Penis", "Impersonation"
];

let bingoCount = 0;

const generateBingoBoard = () => {
    const shuffledOptions = bingoOptions.sort(() => Math.random() - 0.5);
    const board = [...shuffledOptions.slice(0, 4), "Slur", ...shuffledOptions.slice(4, 8)];
    return board;
};

const createBingoWindow = () => {
    const bingoBoard = generateBingoBoard();
    let bingoWon = false;
    const window = document.createElement('div');
    const board = document.createElement('div');
    const playAgain = document.createElement('button');
    const message = document.createElement('div');
    const countDisplay = document.createElement('div');

    window.style.position = 'absolute';
    window.style.top = '50px';
    window.style.left = '50px';
    window.style.width = '320px';
    window.style.height = '420px';
    window.style.backgroundColor = '#333';
    window.style.color = '#fff';
    window.style.padding = '20px';
    window.style.borderRadius = '10px';
    window.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    window.style.cursor = 'move';
    window.style.zIndex = 1000;
    document.body.appendChild(window);

    board.style.display = 'grid';
    board.style.gridTemplateColumns = 'repeat(3, 1fr)';
    board.style.gridTemplateRows = 'repeat(3, 1fr)';
    board.style.gap = '5px';
    board.style.marginBottom = '10px';
    board.style.height = 'auto';
    window.appendChild(board);

    message.style.textAlign = 'center';
    message.style.marginTop = '10px';
    message.style.fontSize = '18px';
    message.innerText = '';
    window.appendChild(message);

    playAgain.innerText = 'Play Again';
    playAgain.style.backgroundColor = '#444';
    playAgain.style.color = '#fff';
    playAgain.style.padding = '10px 20px';
    playAgain.style.margin = '10px auto';
    playAgain.style.border = 'none';
    playAgain.style.borderRadius = '5px';
    playAgain.style.cursor = 'pointer';
    playAgain.style.display = 'none';
    playAgain.style.textAlign = 'center';
    window.appendChild(playAgain);

    countDisplay.innerText = `Bingo Count: ${bingoCount}`;
    countDisplay.style.textAlign = 'center';
    countDisplay.style.marginTop = '10px';
    countDisplay.style.fontSize = '16px';
    window.appendChild(countDisplay);

    const checkBingo = () => {
        const grid = [...board.children];
        const winCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];
        return winCombinations.some(combo => combo.every(index => grid[index].classList.contains('selected')));
    };

    const handleClick = (cell, index) => {
        if (!bingoWon && !cell.classList.contains('selected')) {
            cell.classList.add('selected');
            cell.style.backgroundColor = 'red';
            if (checkBingo()) {
                bingoWon = true;
                message.innerText = 'BINGO!';
                message.style.color = 'green';
                bingoCount++;
                countDisplay.innerText = `Bingo Count: ${bingoCount}`;
                [...board.children].forEach(cell => cell.classList.add('disabled'));
                playAgain.style.display = 'block';
            }
        }
    };

    const resetBoard = () => {
        bingoWon = false;
        message.innerText = '';
        playAgain.style.display = 'none';
        board.innerHTML = '';
        generateBingoBoard().forEach((option, index) => {
            const cell = document.createElement('div');
            cell.innerText = option;
            cell.style.padding = '15px';
            cell.style.textAlign = 'center';
            cell.style.border = '2px solid #555';
            cell.style.borderRadius = '5px';
            cell.style.backgroundColor = '#444';
            cell.style.color = '#fff';
            cell.style.fontSize = '12px';
            cell.style.cursor = 'pointer';
            cell.style.display = 'flex';
            cell.style.justifyContent = 'center';
            cell.style.alignItems = 'center';
            board.appendChild(cell);
            cell.addEventListener('click', () => handleClick(cell, index));
        });
        board.children[4].classList.add('selected');
        board.children[4].style.backgroundColor = 'red';
    };

    playAgain.addEventListener('click', resetBoard);
    resetBoard();

    let offsetX, offsetY;
    const dragMouseDown = (e) => {
        offsetX = e.clientX - window.offsetLeft;
        offsetY = e.clientY - window.offsetTop;
        document.addEventListener('mousemove', moveWindow);
        document.addEventListener('mouseup', stopMovingWindow);
    };

    const moveWindow = (e) => {
        window.style.left = `${e.clientX - offsetX}px`;
        window.style.top = `${e.clientY - offsetY}px`;
    };

    const stopMovingWindow = () => {
        document.removeEventListener('mousemove', moveWindow);
        document.removeEventListener('mouseup', stopMovingWindow);
    };

    window.addEventListener('mousedown', dragMouseDown);
};

createBingoWindow();
