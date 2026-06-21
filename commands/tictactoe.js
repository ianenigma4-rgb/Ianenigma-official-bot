const activeGames = new Map();

function createBoard() { return ['1','2','3','4','5','6','7','8','9']; }

function renderBoard(board) {
    const b = board.map((v, i) => v === 'X' ? '❌' : v === 'O' ? '⭕' : `${i+1}️⃣`);
    return `${b[0]} ${b[1]} ${b[2]}\n${b[3]} ${b[4]} ${b[5]}\n${b[6]} ${b[7]} ${b[8]}`;
}

function checkWinner(board) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,b,c] of wins) {
        if (board[a] !== '1' && board[a] !== '2' && board[a] !== '3' && board[a] !== '4' && board[a] !== '5' && board[a] !== '6' && board[a] !== '7' && board[a] !== '8' && board[a] !== '9' && board[a] === board[b] && board[b] === board[c]) return board[a];
    }
    if (board.every(v => v === 'X' || v === 'O')) return 'draw';
    return null;
}

function aiMove(board) {
    for (let i = 0; i < 9; i++) {
        if (board[i] !== 'X' && board[i] !== 'O') {
            const test = [...board]; test[i] = 'O';
            if (checkWinner(test) === 'O') return i;
        }
    }
    for (let i = 0; i < 9; i++) {
        if (board[i] !== 'X' && board[i] !== 'O') {
            const test = [...board]; test[i] = 'X';
            if (checkWinner(test) === 'X') return i;
        }
    }
    if (board[4] !== 'X' && board[4] !== 'O') return 4;
    for (const c of [0,2,6,8]) if (board[c] !== 'X' && board[c] !== 'O') return c;
    return board.findIndex(v => v !== 'X' && v !== 'O');
}

async function tictactoeCommand(sock, chatId, senderId, message, rawText) {
    try {
        const arg = rawText.replace(/^\.tictactoe\s*/i, '').trim();
        const gameKey = `${chatId}:${senderId}`;

        if (!activeGames.has(gameKey) || arg === 'new') {
            const board = createBoard();
            activeGames.set(gameKey, { board, turn: 'X' });
            return sock.sendMessage(chatId, {
                text: `🎮 *TIC TAC TOE*\n\nYou are ❌, Bot is ⭕\nType *.ttt <1-9>* to place your mark.\n\n${renderBoard(board)}\n\n_Your turn!_`
            }, { quoted: message });
        }

        const game = activeGames.get(gameKey);

        if (arg === 'quit' || arg === 'stop') {
            activeGames.delete(gameKey);
            return sock.sendMessage(chatId, { text: '🎮 Game ended. Type .tictactoe to play again!' }, { quoted: message });
        }

        const pos = parseInt(arg) - 1;
        if (isNaN(pos) || pos < 0 || pos > 8) {
            return sock.sendMessage(chatId, { text: `🎮 Type *.ttt <1-9>* to play.\n\n${renderBoard(game.board)}` }, { quoted: message });
        }
        if (game.board[pos] === 'X' || game.board[pos] === 'O') {
            return sock.sendMessage(chatId, { text: '❌ That spot is taken! Choose another.' }, { quoted: message });
        }

        game.board[pos] = 'X';
        let winner = checkWinner(game.board);
        if (winner) {
            activeGames.delete(gameKey);
            const msg = winner === 'X' ? '🏆 *You win!* Congratulations!' : winner === 'draw' ? "🤝 *It's a draw!*" : '🤖 *Bot wins!* Better luck next time.';
            return sock.sendMessage(chatId, { text: `${renderBoard(game.board)}\n\n${msg}\n\n_Type .tictactoe new to play again._` }, { quoted: message });
        }

        const botPos = aiMove(game.board);
        if (botPos !== -1) {
            game.board[botPos] = 'O';
            winner = checkWinner(game.board);
            if (winner) {
                activeGames.delete(gameKey);
                const msg = winner === 'O' ? '🤖 *Bot wins!* Better luck next time.' : "🤝 *It's a draw!*";
                return sock.sendMessage(chatId, { text: `${renderBoard(game.board)}\n\n${msg}\n\n_Type .tictactoe new to play again._` }, { quoted: message });
            }
        }

        activeGames.set(gameKey, game);
        await sock.sendMessage(chatId, { text: `${renderBoard(game.board)}\n\n_Your turn! Type .ttt <1-9>_` }, { quoted: message });
    } catch (error) {
        console.error('Error in tictactoe command:', error);
        await sock.sendMessage(chatId, { text: '❌ Game error. Type .tictactoe new to start fresh!' }, { quoted: message });
    }
}

module.exports = { tictactoeCommand };
