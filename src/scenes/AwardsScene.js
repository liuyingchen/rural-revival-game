import { playerManager } from '../managers/PlayerManager';

export default class AwardsScene extends Phaser.Scene {
    create() {
        const playerData = playerManager.getCurrentPlayerData();
        
        // 显示玩家总分
        this.add.text(400, 100, `总分: ${playerData.totalScore}`, {
            fontSize: '32px',
            fill: '#fff'
        });

        // 显示各个游戏的奖牌
        const games = {
            culture: '文化拼图',
            knowledge: '知识问答',
            tradition: '传统习俗'
        };

        let yPos = 200;
        for (const [gameId, gameName] of Object.entries(games)) {
            const medal = playerData.games[gameId].medal;
            this.add.text(400, yPos, `${gameName}: ${medal || '未获得'}`, {
                fontSize: '24px',
                fill: '#fff'
            });
            yPos += 50;
        }
    }
} 