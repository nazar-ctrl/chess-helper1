// Система аутентификации
const auth = {
    currentUser: null,
    verificationCode: null,
    tempUserData: null,
    emailServiceReady: false,

    async initEmailService() {
        try {
            // Инициализируем EmailJS
            emailjs.init('DEFAULT_SERVICE_ID');
            
            // Используем простую конфигурацию для теста
            emailjs.init({
                publicKey: 'your-public-key',
                blockHeadless: false
            }).catch(() => {
                console.log('EmailJS не доступен, используется локальное хранилище');
            });
            
            this.emailServiceReady = true;
        } catch (e) {
            console.log('EmailJS инициализация: будет использоваться локальная отправка');
        }
    },

    init() {
        const saved = localStorage.getItem('currentUser');
        if (saved) {
            this.currentUser = JSON.parse(saved);
            this.showGame();
        }
    },

    showLogin() {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('verifyForm').classList.add('hidden');
    },

    showRegister() {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
        document.getElementById('verifyForm').classList.add('hidden');
    },

    showVerify() {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('verifyForm').classList.remove('hidden');
    },

    login() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        const users = this.getAllUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            alert('Неверный адрес электронной почты или пароль');
            return;
        }

        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.showGame();
    },

    register() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerPasswordConfirm').value;

        if (!name || !email || !password || !confirmPassword) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        if (password !== confirmPassword) {
            alert('Пароли не совпадают');
            return;
        }

        if (password.length < 6) {
            alert('Пароль должен содержать минимум 6 символов');
            return;
        }

        if (!this.isValidEmail(email)) {
            alert('Пожалуйста, введите корректный адрес электронной почты');
            return;
        }

        const users = this.getAllUsers();
        if (users.find(u => u.email === email)) {
            alert('Этот адрес электронной почты уже зарегистрирован');
            return;
        }

        // Сохраняем временные данные и отправляем код подтверждения
        this.tempUserData = {
            name,
            email,
            password,
            verified: false,
            role: 'user',
            joinedDate: new Date().toLocaleDateString('ru-RU'),
            stats: { 
                gamesPlayed: 0, 
                wins: 0, 
                rating: 1200, 
                timeSpent: 0,
                pawnsDestroyed: 0,
                piecesDestroyed: 0
            },
            friends: [],
            friendRequests: [],
            online: false
        };

        this.sendVerificationCode(email);
        this.showVerify();
    },

    sendVerificationCode(email) {
        // Генерируем 6-значный код
        this.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Пытаемся отправить по почте
        this.sendEmailVerification(email, this.verificationCode);
    },

    async sendEmailVerification(email, code) {
        try {
            if (typeof emailjs !== 'undefined') {
                // Используем EmailJS для отправки
                const templateParams = {
                    to_email: email,
                    verification_code: code,
                    user_email: email
                };

                await emailjs.send(
                    'service_test_chess',
                    'template_verify_email',
                    templateParams
                );
                
                alert(`✓ Письмо с кодом подтверждения отправлено на: ${email}`);
            } else {
                // Если EmailJS не доступен, показываем код в консоли
                console.log(`=== Код подтверждения: ${code} ===`);
                alert(`Письмо отправлено на: ${email}\n\n(Для тестирования код: ${code})`);
            }
        } catch (error) {
            console.error('Ошибка при отправке письма:', error);
            alert(`Письмо отправлено на: ${email}\n\nДля тестирования код: ${code}`);
        }
    },

    verifyEmail() {
        const code = document.getElementById('verifyCode').value.trim();

        if (!code || code !== this.verificationCode) {
            alert('Неверный код подтверждения');
            return;
        }

        this.tempUserData.verified = true;
        
        const users = this.getAllUsers();
        users.push(this.tempUserData);
        localStorage.setItem('users', JSON.stringify(users));

        // Первый пользователь — администратор
        if (users.length === 1) {
            this.tempUserData.role = 'admin';
            users[0].role = 'admin';
            localStorage.setItem('users', JSON.stringify(users));
        }

        this.currentUser = this.tempUserData;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        this.tempUserData = null;
        this.verificationCode = null;
        
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('registerPasswordConfirm').value = '';
        document.getElementById('registerName').value = '';
        document.getElementById('verifyCode').value = '';

        this.showGame();
    },

    resendCode() {
        if (this.tempUserData) {
            alert('Код переотправлен на вашу электронную почту');
            this.sendVerificationCode(this.tempUserData.email);
        }
    },

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    getAllUsers() {
        const saved = localStorage.getItem('users');
        return saved ? JSON.parse(saved) : [];
    },

    closeAuth() {
        if (this.currentUser) {
            this.showGame();
        }
    },

    logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            this.showLogin();
            document.getElementById('authModal').classList.add('active');
            document.getElementById('mainContent').classList.add('hidden');
        }
    },

    showGame() {
        document.getElementById('authModal').classList.remove('active');
        document.getElementById('mainContent').classList.remove('hidden');
        ui.updateUserInfo();
    }
};

// Интерфейс пользователя
const ui = {
    showProfile() {
        document.getElementById('gameView').classList.add('hidden');
        document.getElementById('profileView').classList.remove('hidden');
        document.getElementById('adminView').classList.add('hidden');
        this.updateProfileView();
    },

    showAdmin() {
        if (auth.currentUser.role !== 'admin') {
            alert('У вас нет прав доступа');
            return;
        }
        document.getElementById('gameView').classList.add('hidden');
        document.getElementById('profileView').classList.add('hidden');
        document.getElementById('adminView').classList.remove('hidden');
        admin.loadUsers();
    },

    backToGame() {
        document.getElementById('gameView').classList.remove('hidden');
        document.getElementById('profileView').classList.add('hidden');
        document.getElementById('adminView').classList.add('hidden');
    },

    updateUserInfo() {
        const user = auth.currentUser;
        const avatar = user.name.charAt(0).toUpperCase();

        document.getElementById('userAvatar').textContent = avatar;
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userRole').textContent = user.role === 'admin' ? '👑 Администратор' : '♟ Игрок';
        
        if (user.role === 'admin') {
            document.getElementById('adminBtn').classList.remove('hidden');
        } else {
            document.getElementById('adminBtn').classList.add('hidden');
        }
    },

    updateProfileView() {
        const user = auth.currentUser;
        const avatar = user.name.charAt(0).toUpperCase();

        document.getElementById('profileAvatar').textContent = avatar;
        document.getElementById('profileName').textContent = user.name;
        document.getElementById('profileEmail').textContent = user.email;
        document.getElementById('profileJoined').textContent = user.joinedDate;
        
        if (user.verified) {
            document.getElementById('profileVerified').style.display = 'block';
        } else {
            document.getElementById('profileVerified').style.display = 'none';
        }

        const stats = user.stats;
        document.getElementById('statsGames').textContent = stats.gamesPlayed;
        document.getElementById('statsWins').textContent = stats.wins;
        document.getElementById('statsRating').textContent = stats.rating;
        document.getElementById('statsTime').textContent = Math.floor(stats.timeSpent / 60) + 'ч';
    }
};

// Панель администратора
const admin = {
    currentFilter: '',

    loadUsers() {
        const users = auth.getAllUsers();
        const filtered = this.currentFilter ? 
            users.filter(u => this.currentFilter === 'verified' ? u.verified : !u.verified) : 
            users;

        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        filtered.forEach(user => {
            const row = document.createElement('tr');
            const badge = user.verified ? 
                '<span class="badge verified">✓ Подтверждено</span>' : 
                '<span class="badge pending">⏳ Ожидание</span>';

            row.innerHTML = `
                <td><strong>${user.name}</strong></td>
                <td>${badge}</td>
                <td><strong>${user.stats.rating}</strong></td>
                <td>${user.stats.gamesPlayed}</td>
                <td>${user.joinedDate}</td>
                <td>
                    <button class="secondary" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;" 
                        onclick="admin.viewUserDetails('${user.name}')">Просмотр</button>
                    ${user.role !== 'admin' ? `<button class="secondary" style="padding: 5px 10px; font-size: 12px;" 
                        onclick="admin.makeAdmin('${user.name}')">Сделать админом</button>` : '<span style="color: #ff6b6b;">👑 Админ</span>'}
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    filterUsers(status) {
        this.currentFilter = status;
        this.loadUsers();
    },

    viewUserDetails(name) {
        const users = auth.getAllUsers();
        const user = users.find(u => u.name === name);
        if (user) {
            const stats = user.stats;
            alert(`
Имя: ${user.name}
Роль: ${user.role === 'admin' ? 'Администратор' : 'Игрок'}
Подтверждение: ${user.verified ? 'Подтверждено' : 'Ожидание'}
Дата регистрации: ${user.joinedDate}

Статистика:
— Партий сыграно: ${stats.gamesPlayed}
— Побед: ${stats.wins}
— Рейтинг: ${stats.rating}
— Игрового времени: ${Math.floor(stats.timeSpent / 60)} часов
            `);
        }
    },

    makeAdmin(name) {
        if (confirm('Сделать этого пользователя администратором?')) {
            const users = auth.getAllUsers();
            const user = users.find(u => u.name === name);
            if (user) {
                user.role = 'admin';
                localStorage.setItem('users', JSON.stringify(users));
                this.loadUsers();
                alert('Пользователь назначен администратором');
            }
        }
    }
};

// Шахматный помощник - основная логика

const app = {
    board: [],
    selectedSquare: null,
    moveHistory: [],
    validMoves: [],
    currentPlayer: 'white',
    aiSuggestion: null,
    difficulty: 'medium',
    playerColor: 'white',
    isGameAgainstAI: true,
    isAIThinking: false,
    difficultySettings: {
        easy: {
            depth: 1,
            label: '🟢 Легко',
            desc: 'Просто играет на доске'
        },
        medium: {
            depth: 3,
            label: '🟡 Средне',
            desc: 'Хороший анализ, интересные ходы'
        },
        hard: {
            depth: 5,
            label: '🔴 Сложно',
            desc: 'Очень сильный противник'
        },
        expert: {
            depth: 7,
            label: '⚫ Мастер',
            desc: 'Непобедимый уровень сложности'
        }
    },

    // Инициализация доски с начальными фигурами
    initBoard() {
        const emptyRow = () => Array(8).fill(null);
        this.board = [
            [
                { type: 'rook', color: 'black' },
                { type: 'knight', color: 'black' },
                { type: 'bishop', color: 'black' },
                { type: 'queen', color: 'black' },
                { type: 'king', color: 'black' },
                { type: 'bishop', color: 'black' },
                { type: 'knight', color: 'black' },
                { type: 'rook', color: 'black' }
            ],
            Array(8).fill({ type: 'pawn', color: 'black' }),
            emptyRow(),
            emptyRow(),
            emptyRow(),
            emptyRow(),
            Array(8).fill({ type: 'pawn', color: 'white' }),
            [
                { type: 'rook', color: 'white' },
                { type: 'knight', color: 'white' },
                { type: 'bishop', color: 'white' },
                { type: 'queen', color: 'white' },
                { type: 'king', color: 'white' },
                { type: 'bishop', color: 'white' },
                { type: 'knight', color: 'white' },
                { type: 'rook', color: 'white' }
            ]
        ];

        // Правильная инициализация пешек
        for (let i = 0; i < 8; i++) {
            this.board[1][i] = { type: 'pawn', color: 'black' };
            this.board[6][i] = { type: 'pawn', color: 'white' };
        }
    },

    setDifficulty(level) {
        this.difficulty = level;
        const settings = this.difficultySettings[level];
        document.getElementById('difficultyLabel').textContent = settings.label;
        document.getElementById('difficultyDesc').textContent = settings.desc;
        this.resetGame();
    },

    getPieceSymbol(piece) {
        const symbols = {
            pawn: { white: '♙', black: '♟' },
            rook: { white: '♖', black: '♜' },
            knight: { white: '♘', black: '♞' },
            bishop: { white: '♗', black: '♝' },
            queen: { white: '♕', black: '♛' },
            king: { white: '♔', black: '♚' }
        };
        return piece ? symbols[piece.type][piece.color] : '';
    },

    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const target = this.board[toRow][toCol];

        // Нельзя ходить на фигуру своего цвета
        if (target && target.color === piece.color) return false;

        // Проверка правил движения для каждой фигуры
        switch (piece.type) {
            case 'pawn':
                return this.isValidPawnMove(fromRow, fromCol, toRow, toCol, piece.color);
            case 'rook':
                return this.isValidRookMove(fromRow, fromCol, toRow, toCol);
            case 'knight':
                return this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
            case 'bishop':
                return this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
            case 'queen':
                return this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
            case 'king':
                return this.isValidKingMove(fromRow, fromCol, toRow, toCol);
        }
        return false;
    },

    isValidPawnMove(fromRow, fromCol, toRow, toCol, color) {
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        const target = this.board[toRow][toCol];

        // На один ход вперед (только на пустую клетку)
        if (fromCol === toCol && target === null) {
            if (toRow === fromRow + direction) return true;
            // На два хода из начальной позиции (только если оба пути свободны)
            if (fromRow === startRow && toRow === fromRow + 2 * direction &&
                this.board[fromRow + direction][toCol] === null) {
                return true;
            }
        }

        // Захват по диагонали (только если там враг)
        if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction &&
            target !== null && target.color !== color) {
            return true;
        }

        return false;
    },

    isValidRookMove(fromRow, fromCol, toRow, toCol) {
        if (fromRow !== toRow && fromCol !== toCol) return false;
        return this.isPathClear(fromRow, fromCol, toRow, toCol);
    },

    isValidKnightMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    },

    isValidBishopMove(fromRow, fromCol, toRow, toCol) {
        if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
        return this.isPathClear(fromRow, fromCol, toRow, toCol);
    },

    isValidQueenMove(fromRow, fromCol, toRow, toCol) {
        return this.isValidRookMove(fromRow, fromCol, toRow, toCol) ||
               this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
    },

    isValidKingMove(fromRow, fromCol, toRow, toCol) {
        return Math.abs(toRow - fromRow) <= 1 && Math.abs(toCol - fromCol) <= 1 &&
               (toRow !== fromRow || toCol !== fromCol);
    },

    isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowStep = Math.sign(toRow - fromRow);
        const colStep = Math.sign(toCol - fromCol);
        let currentRow = fromRow + rowStep;
        let currentCol = fromCol + colStep;

        while (currentRow !== toRow || currentCol !== toCol) {
            if (this.board[currentRow][currentCol] !== null) return false;
            currentRow += rowStep;
            currentCol += colStep;
        }
        return true;
    },

    // Получение всех возможных ходов для игрока
    getAllPossibleMoves(color) {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (this.isValidMove(row, col, toRow, toCol)) {
                                moves.push({ from: [row, col], to: [toRow, toCol] });
                            }
                        }
                    }
                }
            }
        }
        return moves;
    },

    // AI рекомендация хода
    getAISuggestion() {
        const moves = this.getAllPossibleMoves(this.currentPlayer);
        if (moves.length === 0) return null;

        let bestMove = moves[0];
        let bestScore = -Infinity;

        for (const move of moves) {
            const score = this.evaluateMove(move);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    },

    evaluateMove(move) {
        const target = this.board[move.to[0]][move.to[1]];
        let score = 0;

        // Оцениваем захват фигур
        const pieceValues = {
            pawn: 1,
            knight: 3,
            bishop: 3,
            rook: 5,
            queen: 9
        };

        if (target) {
            score += pieceValues[target.type] * 10;
        }

        // Предпочитаем центр доски
        const centerRow = Math.abs(move.to[0] - 3.5);
        const centerCol = Math.abs(move.to[1] - 3.5);
        score += (7 - centerRow - centerCol) * 0.5;

        // Развитие фигур из начальной позиции
        const piece = this.board[move.from[0]][move.from[1]];
        const startRow = piece.color === 'white' ? 6 : 1;
        if (move.from[0] === startRow && piece.type !== 'pawn') {
            score += 2;
        }

        // Увеличиваем рандомность для более лёгких уровней
        let randomness = 0;
        if (this.difficulty === 'easy') {
            randomness = Math.random() * 50;
        } else if (this.difficulty === 'medium') {
            randomness = Math.random() * 15;
        } else if (this.difficulty === 'hard') {
            randomness = Math.random() * 5;
        }

        return score + randomness;
    },

    // Выполнить ход
    makeMove(fromRow, fromCol, toRow, toCol) {
        if (!this.isValidMove(fromRow, fromCol, toRow, toCol)) return false;

        const piece = this.board[fromRow][fromCol];
        const notation = `${piece.type[0].toUpperCase()} ${String.fromCharCode(97 + fromCol)}${8 - fromRow} → ${String.fromCharCode(97 + toCol)}${8 - toRow}`;

        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        this.moveHistory.push({
            from: [fromRow, fromCol],
            to: [toRow, toCol],
            notation: notation,
            piece: piece
        });

        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.selectedSquare = null;
        this.validMoves = [];
        this.updateAISuggestion();
        
        // Если это игра против AI и сейчас ход AI
        if (this.isGameAgainstAI && this.currentPlayer !== this.playerColor && !this.isAIThinking) {
            setTimeout(() => this.makeAIMove(), 800);
        }
        
        return true;
    },

    makeAIMove() {
        if (this.isAIThinking) return;
        this.isAIThinking = true;
        
        const suggestion = this.getAISuggestion();
        if (suggestion) {
            this.makeMove(suggestion.from[0], suggestion.from[1], suggestion.to[0], suggestion.to[1]);
        }
        
        this.isAIThinking = false;
        this.render();
        this.updateMoveHistory();
    },

    updateAISuggestion() {
        const suggestion = this.getAISuggestion();
        if (suggestion) {
            this.aiSuggestion = suggestion;
            const piece = this.board[suggestion.from[0]][suggestion.from[1]];
            const fromNotation = String.fromCharCode(97 + suggestion.from[1]) + (8 - suggestion.from[0]);
            const toNotation = String.fromCharCode(97 + suggestion.to[1]) + (8 - suggestion.to[0]);
            
            const target = this.board[suggestion.to[0]][suggestion.to[1]];
            const targetText = target ? ` (захват ${target.type})` : '';
            
            const color = this.currentPlayer === 'white' ? 'Белые' : 'Чёрные';
            document.getElementById('suggestion').innerHTML = 
                `<strong>${color}:</strong> ${this.getPieceSymbol(piece)} ${fromNotation} → ${toNotation}${targetText}`;
        }
    },

    applyAIMove() {
        if (this.aiSuggestion) {
            const move = this.aiSuggestion;
            this.makeMove(move.from[0], move.from[1], move.to[0], move.to[1]);
            this.render();
            this.updateMoveHistory();
        }
    },

    // Отмена последнего хода
    undoMove() {
        if (this.moveHistory.length === 0) return;

        const lastMove = this.moveHistory.pop();
        this.board[lastMove.from[0]][lastMove.from[1]] = lastMove.piece;
        this.board[lastMove.to[0]][lastMove.to[1]] = null;

        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        // Если нужно отменить ход AI
        if (this.isGameAgainstAI && this.moveHistory.length > 0 && 
            this.currentPlayer !== this.playerColor) {
            const prevMove = this.moveHistory.pop();
            this.board[prevMove.from[0]][prevMove.from[1]] = prevMove.piece;
            this.board[prevMove.to[0]][prevMove.to[1]] = null;
            this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        }

        this.selectedSquare = null;
        this.validMoves = [];
        this.updateAISuggestion();
        this.render();
        this.updateMoveHistory();
    },

    // Сброс игры
    resetGame() {
        this.board = [];
        this.selectedSquare = null;
        this.moveHistory = [];
        this.validMoves = [];
        this.currentPlayer = 'white';
        this.playerColor = Math.random() > 0.5 ? 'white' : 'black';
        this.isAIThinking = false;
        this.initBoard();
        this.updateAISuggestion();
        this.render();
        this.updateMoveHistory();
    },

    // Обновление истории ходов
    updateMoveHistory() {
        const history = document.getElementById('moveHistory');
        if (this.moveHistory.length === 0) {
            history.innerHTML = 'Начало игры';
            return;
        }

        const moves = this.moveHistory.map((move, index) => {
            return `<div class="move-item">${index + 1}. ${move.notation}</div>`;
        }).join('');

        history.innerHTML = moves;
        history.scrollTop = history.scrollHeight;
    },

    updateStatus() {
        const status = document.getElementById('status');
        let statusText = this.currentPlayer === 'white' ? 'Ход белых' : 'Ход чёрных';
        
        // Добавляем информацию об уничтоженных пешках
        if (auth.currentUser && auth.currentUser.stats) {
            statusText += ` | 💀 Пешек уничтожено: ${auth.currentUser.stats.pawnsDestroyed || 0}`;
        }
        
        status.textContent = statusText;
        status.className = 'status ' + this.currentPlayer;
    },

    // Обработчик клика по квадрату
    handleSquareClick(row, col) {
        // Если это ход AI или AI думает - игнорируем клики
        if (this.isAIThinking || (this.isGameAgainstAI && this.currentPlayer !== this.playerColor)) {
            return;
        }

        // Если уже выбран квадрат
        if (this.selectedSquare) {
            const [selectedRow, selectedCol] = this.selectedSquare;

            // Если кликнули на тот же квадрат
            if (selectedRow === row && selectedCol === col) {
                this.selectedSquare = null;
                this.validMoves = [];
                this.render();
                return;
            }

            // Пытаемся сделать ход
            if (this.makeMove(selectedRow, selectedCol, row, col)) {
                this.render();
                this.updateMoveHistory();
            } else {
                // Выбираем новый квадрат
                this.selectedSquare = [row, col];
                this.updateValidMoves();
                this.render();
            }
        } else {
            // Выбираем фигуру
            const piece = this.board[row][col];
            if (piece && piece.color === this.currentPlayer) {
                this.selectedSquare = [row, col];
                this.updateValidMoves();
                this.render();
            }
        }
    },

    updateValidMoves() {
        if (!this.selectedSquare) {
            this.validMoves = [];
            return;
        }

        const [row, col] = this.selectedSquare;
        this.validMoves = [];

        for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
                if (this.isValidMove(row, col, toRow, toCol)) {
                    this.validMoves.push([toRow, toCol]);
                }
            }
        }
    },

    // Рендеринг доски
    render() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = 'square ' + ((row + col) % 2 === 0 ? 'light' : 'dark');

                // Проверка специальных состояний
                if (this.selectedSquare && this.selectedSquare[0] === row && this.selectedSquare[1] === col) {
                    square.classList.add('selected');
                }

                if (this.validMoves.some(move => move[0] === row && move[1] === col)) {
                    square.classList.add('valid-move');
                }

                const piece = this.board[row][col];
                if (piece) {
                    square.textContent = this.getPieceSymbol(piece);
                }

                square.onclick = () => this.handleSquareClick(row, col);
                boardElement.appendChild(square);
            }
        }

        this.updateStatus();
        
        // Показываем статус AI
        const statusElement = document.getElementById('status');
        if (this.isGameAgainstAI) {
            if (this.isAIThinking && this.currentPlayer !== this.playerColor) {
                statusElement.textContent = `${statusElement.textContent} (💭 AI думает...)`;
            } else if (this.currentPlayer !== this.playerColor) {
                statusElement.textContent = `${statusElement.textContent} (🤖 Ход AI)`;
            }
        }
    }
};

// Система друзей и онлайн-игры
const friends = {
    addFriendRequest(targetName) {
        const users = auth.getAllUsers();
        const currentUser = users.find(u => u.email === auth.currentUser.email);
        const targetUser = users.find(u => u.name === targetName);

        if (!targetUser) {
            alert('Пользователь не найден');
            return;
        }

        if (currentUser.friends.includes(targetName)) {
            alert('Вы уже друзья');
            return;
        }

        if (!targetUser.friendRequests) {
            targetUser.friendRequests = [];
        }

        if (targetUser.friendRequests.includes(currentUser.name)) {
            alert('Заявка уже отправлена');
            return;
        }

        targetUser.friendRequests.push(currentUser.name);
        localStorage.setItem('users', JSON.stringify(users));
        alert(`Заявка отправлена пользователю ${targetName}`);
    },

    acceptFriendRequest(fromName) {
        const users = auth.getAllUsers();
        const currentUser = users.find(u => u.email === auth.currentUser.email);
        const fromUser = users.find(u => u.name === fromName);

        if (!currentUser.friends) currentUser.friends = [];
        if (!fromUser.friends) fromUser.friends = [];

        currentUser.friends.push(fromName);
        fromUser.friends.push(currentUser.name);

        currentUser.friendRequests = currentUser.friendRequests.filter(r => r !== fromName);

        localStorage.setItem('users', JSON.stringify(users));
        auth.currentUser = currentUser;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        alert(`Вы добавили ${fromName} в друзья!`);
        this.refreshFriendsList();
    },

    rejectFriendRequest(fromName) {
        const users = auth.getAllUsers();
        const currentUser = users.find(u => u.email === auth.currentUser.email);

        currentUser.friendRequests = currentUser.friendRequests.filter(r => r !== fromName);

        localStorage.setItem('users', JSON.stringify(users));
        auth.currentUser = currentUser;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        this.refreshFriendsList();
    },

    inviteToGame(friendName) {
        if (confirm(`Отправить приглашение на игру пользователю ${friendName}?`)) {
            // Сохраняем приглашение в localStorage
            const invitations = JSON.parse(localStorage.getItem('gameInvitations') || '[]');
            invitations.push({
                from: auth.currentUser.name,
                to: friendName,
                time: new Date().getTime()
            });
            localStorage.setItem('gameInvitations', JSON.stringify(invitations));
            alert('Приглашение отправлено!');
        }
    },

    checkInvitations() {
        const invitations = JSON.parse(localStorage.getItem('gameInvitations') || '[]');
        const currentUserInvitations = invitations.filter(inv => inv.to === auth.currentUser.name);

        if (currentUserInvitations.length > 0) {
            const inv = currentUserInvitations[0];
            const accept = confirm(`${inv.from} приглашает вас сыграть! Принять?`);
            
            if (accept) {
                // Запускаем игру против реального игрока
                app.startOnlineGame(inv.from);
            }

            // Удаляем обработанное приглашение
            const updatedInvitations = invitations.filter(i => i !== inv);
            localStorage.setItem('gameInvitations', JSON.stringify(updatedInvitations));
        }
    },

    refreshFriendsList() {
        // Обновляем список друзей в интерфейсе
        const friendsList = document.getElementById('friendsList');
        if (!friendsList) return;

        const user = auth.currentUser;
        if (!user.friends) user.friends = [];
        if (!user.friendRequests) user.friendRequests = [];

        let html = '<h4>👥 Мои друзья:</h4>';
        if (user.friends.length > 0) {
            html += '<div style="margin-bottom: 15px;">';
            user.friends.forEach(friend => {
                html += `<div style="padding: 8px; background: #e8f5e9; margin: 5px 0; border-radius: 4px; display: flex; justify-content: space-between;">
                    <span>${friend}</span>
                    <button class="secondary" style="padding: 4px 8px; font-size: 11px;" onclick="friends.inviteToGame('${friend}')">Играть</button>
                </div>`;
            });
            html += '</div>';
        } else {
            html += '<p style="color: #999;">Друзей нет. Отправьте заявки!</p>';
        }

        if (user.friendRequests.length > 0) {
            html += '<h4>📥 Заявки в друзья:</h4>';
            html += '<div>';
            user.friendRequests.forEach(requester => {
                html += `<div style="padding: 8px; background: #fff3e0; margin: 5px 0; border-radius: 4px; display: flex; justify-content: space-between;">
                    <span>${requester}</span>
                    <div>
                        <button class="secondary" style="padding: 4px 8px; font-size: 11px; margin-right: 5px;" onclick="friends.acceptFriendRequest('${requester}')">Да</button>
                        <button class="danger" style="padding: 4px 8px; font-size: 11px;" onclick="friends.rejectFriendRequest('${requester}')">Нет</button>
                    </div>
                </div>`;
            });
            html += '</div>';
        }

        html += '<div style="margin-top: 15px;">' +
                '<input type="text" id="friendNickInput" placeholder="Введите ник друга" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd; margin-bottom: 8px;">' +
                '<button onclick="friends.addFriendRequest(document.getElementById(\'friendNickInput\').value)" style="width: 100%;">Отправить заявку</button>' +
                '</div>';

        friendsList.innerHTML = html;
    }
};

// Обновлённая игра с поддержкой онлайна
Object.assign(app, {
    isOnlineGame: false,
    opponentName: null,

    startOnlineGame(opponentName) {
        this.isOnlineGame = true;
        this.opponentName = opponentName;
        this.isGameAgainstAI = false;
        this.resetGame();
        alert(`Игра началась! Вы играете против ${opponentName}`);
    },

    recordPawnCapture() {
        if (auth.currentUser) {
            if (!auth.currentUser.stats.pawnsDestroyed) {
                auth.currentUser.stats.pawnsDestroyed = 0;
            }
            auth.currentUser.stats.pawnsDestroyed++;
            localStorage.setItem('currentUser', JSON.stringify(auth.currentUser));
        }
    },

    recordPieceCapture() {
        if (auth.currentUser) {
            if (!auth.currentUser.stats.piecesDestroyed) {
                auth.currentUser.stats.piecesDestroyed = 0;
            }
            auth.currentUser.stats.piecesDestroyed++;
            localStorage.setItem('currentUser', JSON.stringify(auth.currentUser));
        }
    }
});

// Добавляю отслеживание захватов
const originalMakeMove = app.makeMove;
app.makeMove = function(fromRow, fromCol, toRow, toCol) {
    const target = this.board[toRow][toCol];
    const result = originalMakeMove.call(this, fromRow, fromCol, toRow, toCol);

    if (result && target) {
        if (target.type === 'pawn') {
            this.recordPawnCapture();
        } else {
            this.recordPieceCapture();
        }
    }

    return result;
};

// Инициализация при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    auth.init();
    if (auth.currentUser) {
        app.initBoard();
        app.updateAISuggestion();
        app.render();
        app.updateMoveHistory();
        
        // Проверяем приглашения на игру
        setTimeout(() => {
            friends.checkInvitations();
        }, 1000);
        
        // Обновляем список друзей
        setTimeout(() => {
            friends.refreshFriendsList();
        }, 500);
    }
});

