import { playerManager } from '../managers/PlayerManager';

export default class LoginScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoginScene' });
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 添加背景
        this.add.image(width/2, height/2, 'login-bg')
            .setDisplaySize(width, height);

        // 创建输入框背景
        const inputBox = this.add.graphics()
            .setDepth(1);
        inputBox.fillStyle(0xffffff, 0.8);
        inputBox.fillRoundedRect(width/2 - 150, height/2 - 20, 300, 40, 10);

        // 创建HTML输入框
        const inputElement = document.createElement('input');
        inputElement.setAttribute('type', 'text');
        inputElement.setAttribute('placeholder', '请输入你的名字');
        inputElement.style.width = '280px';
        inputElement.style.height = '30px';
        inputElement.style.fontSize = '16px';
        inputElement.style.padding = '0 10px';
        inputElement.style.border = 'none';
        inputElement.style.borderRadius = '5px';
        inputElement.style.outline = 'none';

        // 添加输入框到游戏
        this.nameInput = this.add.dom(width/2, height/2, inputElement)
            .setDepth(2);

        // 创建开始按钮
        const startButton = this.add.text(width/2, height/2 + 50, '开始游戏', {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: '#4a90e2',
            padding: { x: 20, y: 10 },
        })
        .setOrigin(0.5)
        .setInteractive()
        .setDepth(2);

        // 添加错误提示文本
        this.errorText = this.add.text(width/2, height/2 + 100, '', {
            fontSize: '16px',
            fill: '#ff0000'
        })
        .setOrigin(0.5)
        .setDepth(2);

        // 点击开始按钮的处理
        startButton.on('pointerdown', () => {
            const playerName = inputElement.value.trim();
            
            // 验证输入
            if (!playerName) {
                this.errorText.setText('请输入你的名字');
                return;
            }
            
            if (playerName.length < 2 || playerName.length > 10) {
                this.errorText.setText('名字长度需要在2-10个字符之间');
                return;
            }

            // 生成唯一标识符（名字+时间戳）
            const playerId = `${playerName}_${Date.now()}`;
            
            // 保存玩家选择的角色类型
            window.gameState = {
                character: 'female',  // 或者从角色选择中获取
                playerId: playerId,
                playerName: playerName
            };

            // 设置当前玩家
            playerManager.setCurrentPlayer(playerId);

            // 清除错误提示
            this.errorText.setText('');

            // 转到主菜单场景
            this.scene.start('MainMenuScene');
        });
    }
} 