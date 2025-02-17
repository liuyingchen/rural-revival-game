export default class CultureScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CultureScene' });
        this.pieces = [];
        this.completedPieces = 0;
        this.isPlaying = false;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 添加背景图
        this.add.image(width/2, height/2, 'culture-background')
            .setDisplaySize(width, height);

        // 右侧：展示完整图片
        const totalImage = this.add.image(width * 0.75, height/2, 'puzzle-total')
            .setDisplaySize(400, 300);

        // 左侧：拼图区域
        const baseImage = this.add.image(width * 0.25, height/2, 'puzzle-other')
            .setDisplaySize(400, 300);

        // 创建返回按钮
        this.createBackButton();

        // 检查是否已经获得奖牌
        if (window.gameState.medals.culture) {
            this.showCompletedScene();
        } else {
            this.showStartPrompt();
        }

        // 配置拼图碎片
        const pieceConfigs = [
            { key: 'piece-11', targetX: width * 0.25 - 100, targetY: height/2 - 75 },
            { key: 'piece-12', targetX: width * 0.25 + 100, targetY: height/2 - 75 },
            { key: 'piece-21', targetX: width * 0.25 - 100, targetY: height/2 + 75 },
            { key: 'piece-22', targetX: width * 0.25 + 100, targetY: height/2 + 75 }
        ];

        // 随机分布碎片的初始位置
        pieceConfigs.forEach(config => {
            const angle = Math.random() * Math.PI * 2;
            const distance = Phaser.Math.Between(150, 200);
            const randomX = width * 0.25 + Math.cos(angle) * distance;
            const randomY = height/2 + Math.sin(angle) * distance;
            
            const piece = this.add.image(randomX, randomY, config.key)
                .setScale(0.30)  // 设置碎片缩放比例
                .setInteractive({ draggable: true });

            piece.targetX = config.targetX;
            piece.targetY = config.targetY;

            // 拖拽相关事件
            piece.on('dragstart', (pointer) => {
                this.children.bringToTop(piece);
                piece.setScale(0.32);  // 拖拽时稍微放大
            });

            piece.on('drag', (pointer, dragX, dragY) => {
                piece.x = dragX;
                piece.y = dragY;
            });

            piece.on('dragend', (pointer) => {
                piece.setScale(0.30);  // 恢复原来的缩小尺寸
                
                // 检查是否放在正确位置
                const distance = Phaser.Math.Distance.Between(
                    piece.x, piece.y,
                    piece.targetX, piece.targetY
                );

                if (distance < 30) {
                    piece.x = piece.targetX;
                    piece.y = piece.targetY;
                    piece.input.draggable = false;
                    
                    this.tweens.add({
                        targets: piece,
                        scale: 0.30,  // 保持缩小的尺寸
                        duration: 200,
                        ease: 'Back.easeOut',
                        onComplete: () => {
                            this.completedPieces++;
                            if (this.completedPieces === 4) {
                                this.showCompletionMessage();
                            }
                        }
                    });
                }
            });

            this.pieces.push(piece);
        });
    }

    createBackButton() {
        const backButton = this.add.container(100, 50);
        const backBg = this.add.image(0, 0, 'button')
            .setDisplaySize(120, 40);
        const backText = this.add.text(0, 0, '返回', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        backButton.add([backBg, backText]);
        backButton.setSize(120, 40);
        backButton.setInteractive();

        backButton.on('pointerdown', () => {
            this.scene.start('SceneSelectScene');
        });
    }

    showStartPrompt() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);

        const messageBox = this.add.graphics();
        messageBox.fillStyle(0xE6D5AC, 0.95);
        messageBox.lineStyle(4, 0x8B4513);
        messageBox.fillRoundedRect(width/2 - 300, height/2 - 150, 600, 300, 20);
        messageBox.strokeRoundedRect(width/2 - 300, height/2 - 150, 600, 300, 20);

        const content = this.add.text(width/2, height/2, 
            '欢迎来到乡村文化展览馆！\n\n' +
            '这里展示着我们乡村的传统文化。\n' +
            '让我们一起完成这幅拼图，\n' +
            '展现乡村的文化魅力！\n\n' +
            '点击任意位置开始！', {
            fontSize: '24px',
            fill: '#4A3000',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.isPlaying = true;
            overlay.destroy();
            messageBox.destroy();
            content.destroy();
        });
    }

    showCompletionMessage() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);

        const messageBox = this.add.graphics();
        messageBox.fillStyle(0xE6D5AC, 0.95);
        messageBox.lineStyle(4, 0x8B4513);
        messageBox.fillRoundedRect(width/2 - 300, height/2 - 150, 600, 300, 20);
        messageBox.strokeRoundedRect(width/2 - 300, height/2 - 150, 600, 300, 20);

        const content = this.add.text(width/2, height/2, 
            '太棒了！\n\n' +
            '你成功完成了拼图！\n' +
            '让我们继续传承和发扬乡村文化！\n\n' +
            '点击任意位置返回', {
            fontSize: '24px',
            fill: '#4A3000',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            window.gameState.medals.culture = true;
            this.scene.start('SceneSelectScene');
        });
    }

    showCompletedScene() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);

        const messageBox = this.add.graphics();
        messageBox.fillStyle(0xE6D5AC, 0.95);
        messageBox.lineStyle(4, 0x8B4513);
        messageBox.fillRoundedRect(width/2 - 300, height/2 - 150, 600, 300, 20);
        messageBox.strokeRoundedRect(width/2 - 300, height/2 - 150, 600, 300, 20);

        const content = this.add.text(width/2, height/2, 
            '你已经完成了这个任务！\n\n' +
            '要重新体验一次吗？\n\n' +
            '点击确定重新开始，点击返回键返回选择界面', {
            fontSize: '24px',
            fill: '#4A3000',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);

        // 添加确定按钮
        const confirmButton = this.add.container(width/2, height/2 + 100);
        const confirmBg = this.add.image(0, 0, 'button')
            .setDisplaySize(200, 50);
        const confirmText = this.add.text(0, 0, '重新开始', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        confirmButton.add([confirmBg, confirmText]);
        confirmButton.setSize(200, 50);
        confirmButton.setInteractive();

        confirmButton.on('pointerdown', () => {
            overlay.destroy();
            messageBox.destroy();
            content.destroy();
            confirmButton.destroy();
            this.showStartPrompt();
        });
    }
}