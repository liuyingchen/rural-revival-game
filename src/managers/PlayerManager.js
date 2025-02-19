class PlayerManager {
    constructor() {
        this.currentPlayer = null;
        this.players = this.loadPlayers();
        this.initializeSession();
    }

    // 初始化会话
    initializeSession() {
        // 从 sessionStorage 获取会话ID，如果没有则创建新的
        let sessionId = sessionStorage.getItem('gameSessionId');
        if (!sessionId) {
            sessionId = 'session_' + Date.now();
            sessionStorage.setItem('gameSessionId', sessionId);
        }
        this.setCurrentPlayer(sessionId);
    }

    // 加载所有玩家数据
    loadPlayers() {
        const playersData = sessionStorage.getItem('gamePlayers');
        return playersData ? JSON.parse(playersData) : {};
    }

    // 保存所有玩家数据
    savePlayers() {
        sessionStorage.setItem('gamePlayers', JSON.stringify(this.players));
    }

    // 创建或获取玩家
    setCurrentPlayer(sessionId) {
        if (!this.players[sessionId]) {
            this.players[sessionId] = {
                id: sessionId,
                games: {
                    culture: {
                        lastPlayed: null,
                        medal: null
                    },
                    knowledge: {
                        lastPlayed: null,
                        medal: null
                    },
                    tradition: {
                        lastPlayed: null,
                        medal: null
                    }
                },
                totalScore: 0
            };
        }
        this.currentPlayer = sessionId;
        this.savePlayers();
    }

    // 更新游戏奖励
    updateGameMedal(gameId, medal) {
        if (!this.currentPlayer) return;
        
        const player = this.players[this.currentPlayer];
        if (player && player.games[gameId]) {
            player.games[gameId] = {
                lastPlayed: new Date().toISOString(),
                medal: medal
            };
            
            // 更新总分
            this.updateTotalScore(player);
            this.savePlayers();
        }
    }

    // 计算总分
    updateTotalScore(player) {
        const medalScores = {
            gold: 3,
            silver: 2,
            bronze: 1
        };

        player.totalScore = Object.values(player.games).reduce((total, game) => {
            return total + (game.medal ? medalScores[game.medal] : 0);
        }, 0);
    }

    // 获取当前玩家的游戏数据
    getCurrentPlayerData() {
        return this.currentPlayer ? this.players[this.currentPlayer] : null;
    }

    // 获取当前玩家的总分
    getCurrentPlayerScore() {
        const player = this.getCurrentPlayerData();
        return player ? player.totalScore : 0;
    }

    // 获取当前玩家特定游戏的奖牌
    getGameMedal(gameId) {
        const player = this.getCurrentPlayerData();
        return player && player.games[gameId] ? player.games[gameId].medal : null;
    }
}

export const playerManager = new PlayerManager(); 